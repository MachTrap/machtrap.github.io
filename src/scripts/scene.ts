import fragment from '../shaders/ambient.frag?raw';
import codingFragment from '../shaders/coding.frag?raw';
import particleVertex from '../shaders/particles.vert?raw';
import particleFragment from '../shaders/particles.frag?raw';
import {
  ParticlePool,
  objectMatrix,
  pickSurface,
  type HeroPose,
} from './hero-model';
import { theme } from '../data/site';
import { subscribe } from './clock';
import { clamp } from './motion';
import { SurfaceMotion } from './surface-motion';
const vertex = `#version 300 es\nin vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
export class Scene {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private locations: Record<string, WebGLUniformLocation | null> = {};
  private unsubscribe: (() => void) | undefined;
  private codingProgram: WebGLProgram | null = null;
  private codingLocations: Record<string, WebGLUniformLocation | null> = {};
  private codingRegion: HTMLElement | null = null;
  private particleProgram: WebGLProgram | null = null;
  private particleLocations: Record<string, WebGLUniformLocation | null> = {};
  private triangleVao: WebGLVertexArrayObject | null = null;
  private particleVao: WebGLVertexArrayObject | null = null;
  private particleBuffer: WebGLBuffer | null = null;
  private particles = new ParticlePool();
  private pendingBurst = 0;
  private target = 0;
  private current = 0;
  private start = performance.now();
  private density = 1;
  private samples = 0;
  private frameElapsed = 0;
  private totalFrames = 0;
  private slow = 0;
  private lastDraw = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private active = true;
  private motion = new SurfaceMotion();
  private interactions = 0;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.dataset.renderer = 'fallback';
    this.density = this.cap();
    const relevant = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest('.identity')) &&
      !target.closest('a,button,nav');
    window.addEventListener(
      'pointerdown',
      (event) => {
        if (
          this.reduced.matches ||
          this.motion.holding ||
          !relevant(event.target)
        )
          return;
        this.pendingBurst = Math.min(48, this.pendingBurst + 20);
        this.canvas.dataset.input = event.pointerType;
        this.motion.begin(
          event.pointerId,
          event.clientX,
          event.clientY,
          event.timeStamp,
          innerWidth,
          innerHeight,
        );
        this.canvas.dataset.interactions = String(++this.interactions);
        (event.target as Element)
          .closest<HTMLElement>('.identity')
          ?.setPointerCapture(event.pointerId);
      },
      { passive: true },
    );
    window.addEventListener(
      'pointermove',
      (event) => {
        if (this.reduced.matches) return;
        if (this.motion.holding) {
          this.motion.move(
            event.pointerId,
            event.clientX,
            event.clientY,
            event.timeStamp,
            innerWidth,
            innerHeight,
          );
        } else if (event.pointerType === 'mouse' && relevant(event.target)) {
          this.motion.hover(
            (event.clientX / innerWidth) * 2 - 1,
            1 - (event.clientY / innerHeight) * 2,
          );
        }
      },
      { passive: true },
    );
    window.addEventListener(
      'pointerup',
      (event) => this.motion.end(event.pointerId, event.timeStamp),
      { passive: true },
    );
    window.addEventListener(
      'pointercancel',
      (event) => this.motion.end(event.pointerId, event.timeStamp, true),
      { passive: true },
    );
    window.addEventListener('blur', () => this.motion.cancel());
    if (new URLSearchParams(location.search).get('effects') !== 'off')
      this.init();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.gl = null;
      canvas.dataset.renderer = 'fallback';
      canvas.style.opacity = '0';
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.init();
      canvas.style.opacity = '';
    });
    this.reduced.addEventListener('change', () => {
      this.motion.cancel();
      this.particles.clear();
      this.pendingBurst = 0;
      this.schedule();
    });
  }
  private cap() {
    return Math.min(devicePixelRatio || 1, 1.25);
  }
  private init() {
    this.program = null;
    this.codingProgram = null;
    this.particleProgram = null;
    this.triangleVao = null;
    this.particleVao = null;
    this.particleBuffer = null;
    this.locations = {};
    this.codingLocations = {};
    this.particleLocations = {};
    try {
      const gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: true,
        stencil: false,
        powerPreference: 'low-power',
      });
      if (!gl) return;
      this.gl = gl;
      const make = (type: number, source: string) => {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
      };
      const vs = make(gl.VERTEX_SHADER, vertex),
        fs = make(gl.FRAGMENT_SHADER, fragment),
        program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('Visual fallback:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return;
      }
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      this.program = program;
      this.canvas.dataset.renderer = 'webgl2';
      gl.useProgram(program);
      this.triangleVao = gl.createVertexArray();
      gl.bindVertexArray(this.triangleVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      for (const key of [
        'resolution',
        'time',
        'effectTime',
        'objectMatrix',
        'scene',
        'accent',
        'background',
        'pointer',
        'rotation',
        'energy',
        'hold',
        'ripple',
        'scroll',
        'entrance',
        'visibility',
      ])
        this.locations[key] = gl.getUniformLocation(program, key);
      const rgb = (hex: string) =>
        hex.match(/[a-f\d]{2}/gi)!.map((v) => parseInt(v, 16) / 255);
      const a = rgb(theme.accent),
        b = rgb(theme.background);
      gl.uniform3f(this.locations.accent, a[0], a[1], a[2]);
      gl.uniform3f(this.locations.background, b[0], b[1], b[2]);
      const cvs = make(gl.VERTEX_SHADER, vertex),
        cfs = make(gl.FRAGMENT_SHADER, codingFragment);
      const cp = gl.createProgram()!;
      gl.attachShader(cp, cvs);
      gl.attachShader(cp, cfs);
      gl.bindAttribLocation(cp, position, 'position');
      gl.linkProgram(cp);
      gl.deleteShader(cvs);
      gl.deleteShader(cfs);
      if (gl.getProgramParameter(cp, gl.LINK_STATUS)) {
        this.codingProgram = cp;
        for (const key of [
          'resolution',
          'viewportOrigin',
          'accent',
          'background',
          'time',
          'phase',
        ])
          this.codingLocations[key] = gl.getUniformLocation(cp, key);
        gl.useProgram(cp);
        gl.uniform3f(this.codingLocations.accent, a[0], a[1], a[2]);
        gl.uniform3f(this.codingLocations.background, b[0], b[1], b[2]);
      } else {
        console.warn('Coding visual fallback:', gl.getProgramInfoLog(cp));
        gl.deleteProgram(cp);
      }
      const pvs = make(gl.VERTEX_SHADER, particleVertex),
        pfs = make(gl.FRAGMENT_SHADER, particleFragment),
        pp = gl.createProgram()!;
      gl.attachShader(pp, pvs);
      gl.attachShader(pp, pfs);
      gl.linkProgram(pp);
      gl.deleteShader(pvs);
      gl.deleteShader(pfs);
      if (!gl.getProgramParameter(pp, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(pp) ?? 'Particle shader failed');
      this.particleProgram = pp;
      for (const key of [
        'resolution',
        'effectTime',
        'scroll',
        'accent',
        'visibility',
      ])
        this.particleLocations[key] = gl.getUniformLocation(pp, key);
      this.particleVao = gl.createVertexArray();
      gl.bindVertexArray(this.particleVao);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.particleBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particles.data, gl.DYNAMIC_DRAW);
      for (const [loc, size, offset] of [
        [1, 3, 0],
        [2, 3, 12],
        [3, 4, 24],
      ]) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 40, offset);
        gl.vertexAttribDivisor(loc, 1);
      }
      gl.useProgram(pp);
      gl.uniform3f(this.particleLocations.accent, a[0], a[1], a[2]);
      gl.bindVertexArray(this.triangleVao);
      this.resize();
      this.schedule();
    } catch (error) {
      console.warn('Visual fallback:', error);
      this.canvas.dataset.renderer = 'fallback';
      this.canvas.style.opacity = '0';
    }
  }
  private resize() {
    const gl = this.gl;
    if (!gl) return;
    this.density = Math.min(this.density, this.cap());
    this.canvas.width = Math.round(innerWidth * this.density);
    this.canvas.height = Math.round(innerHeight * this.density);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.draw(this.motion.visualTime);
  }
  private pose(): HeroPose {
    const reduced = this.reduced.matches;
    return {
      geometryTime: reduced ? 0 : this.motion.visualTime,
      rotationX: reduced ? 0 : this.motion.rotationX.value,
      rotationY: reduced ? 0 : this.motion.rotationY.value,
      pointerX: reduced ? 0 : this.motion.x.value,
      pointerY: reduced ? 0 : this.motion.y.value,
      scroll: reduced ? 0 : this.motion.scroll.value,
    };
  }
  private particleLimit() {
    return (innerWidth < 800 ? 128 : 256) * (this.density < 0.85 ? 0.5 : 1);
  }
  refreshCoding() {
    this.draw(0);
  }
  setCodingRegion(element: HTMLElement | null) {
    this.codingRegion = element;
    if (this.reduced.matches) this.draw(0);
  }
  setScroll(progress: number) {
    if (!this.reduced.matches) {
      const delta = Math.abs(progress - this.motion.scroll.target);
      this.motion.energy.target = Math.min(
        0.85,
        this.motion.energy.target + delta * 5,
      );
    }
    this.motion.scroll.target = progress;
    if (this.reduced.matches) {
      this.motion.scroll.value = progress;
      this.draw(0);
    }
  }
  setVisibility(visibility: number) {
    this.motion.visibility.target = clamp(visibility, 0, 1);
    if (this.reduced.matches) {
      this.motion.visibility.value = this.motion.visibility.target;
      this.draw(0);
    }
  }
  setScene(name: string, _element?: Element) {
    this.target =
      ({ intro: 0, skills: 2 } as Record<string, number>)[name] ?? 0;
    if (this.reduced.matches) {
      this.current = this.target;
      this.draw(0);
    }
  }
  setActive(active: boolean) {
    if (this.active === active) return;
    this.active = active;
    this.schedule();
  }
  private schedule() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    if (!this.gl) return;
    if (this.reduced.matches) {
      this.current = this.target;
      this.draw(0);
      return;
    }
    // Preserve the last frame and accumulated visual time when fully occluded.
    if (!this.active && this.motion.visibility.value < 0.001) return;
    this.lastDraw = 0;
    this.samples = 0;
    this.frameElapsed = 0;
    this.slow = 0;
    this.unsubscribe = subscribe((_, time) => {
      const elapsed = this.lastDraw ? time - this.lastDraw : 1 / 60;
      if (elapsed < (this.density < 0.85 ? 1 / 30 : 1 / 60) - 0.002) return;
      const dt = Math.min(elapsed, 0.08);
      this.lastDraw = time;
      this.current += (this.target - this.current) * Math.min(1, dt * 6);
      this.motion.step(dt, this.motion.visibility.target > 0.001);
      if (this.motion.visibility.target > 0.001) {
        const pose = this.pose(),
          matrix = objectMatrix(pose);
        const contact = this.motion.holding
          ? pickSurface(
              this.motion.ripplePoint[0],
              this.motion.ripplePoint[1],
              innerWidth / innerHeight,
              pose,
              matrix,
            )
          : null;
        const rate =
          14 +
          this.motion.energy.value * 150 +
          this.motion.hold.value * 40 +
          this.pendingBurst / Math.max(dt, 0.001);
        this.particles.step(
          dt,
          this.motion.effectTime,
          rate,
          this.particleLimit(),
          matrix,
          pose.geometryTime,
          contact,
        );
        this.pendingBurst = 0;
      }
      if (!this.active && this.motion.visibility.value < 0.001) {
        this.motion.visibility.value = 0;
        this.draw(this.motion.visualTime);
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        return;
      }
      this.totalFrames++;
      if (this.totalFrames % 30 === 0) {
        this.canvas.dataset.phase = this.motion.visualTime.toFixed(4);
        this.canvas.dataset.effectPhase = this.motion.effectTime.toFixed(4);
        this.canvas.dataset.particles = String(
          this.particles.active(this.motion.effectTime, this.particleLimit()),
        );
        this.canvas.dataset.particleLimit = String(this.particleLimit());
        this.canvas.dataset.visibility =
          this.motion.visibility.value.toFixed(4);
        this.canvas.dataset.holding = String(this.motion.holding);
      }

      this.frameElapsed += elapsed;
      this.samples++;
      if (elapsed > 0.025) this.slow++;
      if (this.samples >= 120) {
        this.canvas.dataset.frameMs = (
          (this.frameElapsed / this.samples) *
          1000
        ).toFixed(2);
        this.canvas.dataset.frames = String(this.totalFrames);
        this.canvas.dataset.density = String(this.density);
        this.canvas.dataset.rotation = `${this.motion.rotationX.value.toFixed(3)},${this.motion.rotationY.value.toFixed(3)}`;
        if (this.slow > 65 && this.density > 0.65) {
          this.density = Math.max(0.65, this.density * 0.8);
          this.resize();
        }
        this.samples = 0;
        this.frameElapsed = 0;
        this.slow = 0;
      }
      this.draw(this.motion.visualTime);
    });
  }
  private draw(time: number) {
    const gl = this.gl;
    if (!gl || !this.program) return;
    const reduced = this.reduced.matches;
    gl.bindVertexArray(this.triangleVao);
    gl.useProgram(this.program);
    gl.uniform1f(
      this.locations.effectTime,
      reduced ? 0 : this.motion.effectTime,
    );
    gl.uniformMatrix3fv(
      this.locations.objectMatrix,
      false,
      objectMatrix(this.pose()),
    );
    gl.uniform2f(
      this.locations.resolution,
      this.canvas.width,
      this.canvas.height,
    );
    gl.uniform1f(this.locations.time, reduced ? 0 : time);
    gl.uniform1f(this.locations.scene, this.current);
    gl.uniform2f(
      this.locations.pointer,
      reduced ? 0 : this.motion.x.value,
      reduced ? 0 : this.motion.y.value,
    );
    gl.uniform2f(
      this.locations.rotation,
      reduced ? 0 : this.motion.rotationX.value,
      reduced ? 0 : this.motion.rotationY.value,
    );
    gl.uniform1f(
      this.locations.energy,
      reduced ? 0 : clamp(this.motion.energy.value, 0, 1),
    );
    gl.uniform1f(this.locations.hold, reduced ? 0 : this.motion.hold.value);
    gl.uniform3f(
      this.locations.ripple,
      this.motion.ripplePoint[0],
      this.motion.ripplePoint[1],
      reduced ? 100 : this.motion.rippleAge,
    );
    gl.uniform1f(this.locations.scroll, reduced ? 0 : this.motion.scroll.value);
    gl.uniform1f(
      this.locations.entrance,
      reduced ? 0 : Math.max(0, 1 - (performance.now() - this.start) / 1400),
    );
    gl.uniform1f(this.locations.visibility, this.motion.visibility.value);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const rgb = theme.background
      .match(/[a-f\d]{2}/gi)!
      .map((v) => parseInt(v, 16) / 255);
    gl.clearColor(rgb[0], rgb[1], rgb[2], 1);
    gl.depthMask(true);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const hero = document.querySelector('.identity')?.getBoundingClientRect();
    if (hero && hero.bottom > 0 && hero.top < innerHeight) {
      // The next chapter physically occludes the sculpture, while its fade keeps easing.
      gl.enable(gl.SCISSOR_TEST);
      const bottom = Math.min(innerHeight, hero.bottom),
        top = Math.max(0, hero.top);
      gl.scissor(
        0,
        Math.round((innerHeight - bottom) * this.density),
        this.canvas.width,
        Math.round((bottom - top) * this.density),
      );
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.ALWAYS);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced && this.particleProgram && this.particleBuffer) {
        gl.useProgram(this.particleProgram);
        gl.bindVertexArray(this.particleVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particles.data);
        gl.uniform2f(
          this.particleLocations.resolution,
          this.canvas.width,
          this.canvas.height,
        );
        gl.uniform1f(this.particleLocations.effectTime, this.motion.effectTime);
        gl.uniform1f(this.particleLocations.scroll, this.motion.scroll.value);
        const entrance = Math.max(
          0,
          1 - (performance.now() - this.start) / 1400,
        );
        gl.uniform1f(
          this.particleLocations.visibility,
          this.motion.visibility.value * Math.min(1, (1 - entrance) / 0.9),
        );
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.particleLimit());
        gl.disable(gl.BLEND);
        gl.depthMask(true);
        gl.bindVertexArray(this.triangleVao);
      }
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.SCISSOR_TEST);
    }
    if (this.codingRegion && this.codingProgram) {
      const r = this.codingRegion.getBoundingClientRect(),
        d = this.density;
      if (r.bottom > 0 && r.top < innerHeight) {
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(
          Math.round(r.left * d),
          Math.max(0, Math.round((innerHeight - r.bottom) * d)),
          Math.round(r.width * d),
          Math.round(
            (Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) * d,
          ),
        );
        gl.viewport(
          Math.round(r.left * d),
          Math.round((innerHeight - r.bottom) * d),
          Math.round(r.width * d),
          Math.round(r.height * d),
        );
        gl.disable(gl.DEPTH_TEST);
        gl.bindVertexArray(this.triangleVao);
        gl.useProgram(this.codingProgram);
        gl.uniform2f(
          this.codingLocations.resolution,
          r.width * d,
          r.height * d,
        );
        gl.uniform2f(
          this.codingLocations.viewportOrigin,
          Math.round(r.left * d),
          Math.round((innerHeight - r.bottom) * d),
        );
        gl.uniform1f(this.codingLocations.time, reduced ? 0 : time);
        gl.uniform1f(
          this.codingLocations.phase,
          Number(this.codingRegion.dataset.demoPhase ?? 0),
        );
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disable(gl.SCISSOR_TEST);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }
}
let instance: Scene | undefined;
export function getScene() {
  if (!instance) {
    const canvas = document.querySelector<HTMLCanvasElement>('#scene');
    if (canvas) instance = new Scene(canvas);
  }
  return instance;
}
