import codingFragment from '../shaders/coding.frag?raw';
import { theme, type Locale } from '../data/site';
import { getCodingAtlas, type CodingAtlas } from './coding-atlas';
import {
  codingSceneState,
  codingRotation,
  type CodingSceneState,
  type CodingInspection,
} from './coding-model';
import { pixelDensity } from './motion';
const vertex = `#version 300 es\nin vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
/**
 * The "CODE → APPLICATION" study renders into a canvas anchored inside
 * .coding-stage: the compositor scrolls it natively, so no viewport, scissor
 * or getBoundingClientRect math runs while the page scrolls on iOS.
 */
export class CodingCanvas {
  canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private locations: Record<string, WebGLUniformLocation | null> = {};
  private observer: ResizeObserver | undefined;
  private detachCanvas: AbortController | undefined;
  private triangleVao: WebGLVertexArrayObject | null = null;
  private atlasTexture: WebGLTexture | null = null;
  private codeTexture: WebGLTexture | null = null;
  private atlasGeneration = 0;
  private atlasReady = false;
  private editorMatrix = codingRotation(0.025, 0.12, -0.025);
  private codingState: CodingSceneState = codingSceneState(0);
  private codingInspection: CodingInspection = { x: 0, y: 0, pulseAge: 100 };
  private codingLocale: Locale = 'en';
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private density = 1;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // Declared disabled before any GL work: without this the CSS fallback
    // selector cannot match when effects are off or GL is unavailable.
    canvas.dataset.renderer = 'fallback';
    this.density = pixelDensity();
    window.addEventListener('resize', () => this.resize());
    this.reduced.addEventListener('change', () => this.draw());
    this.watch(canvas);
    if (new URLSearchParams(location.search).get('effects') !== 'off')
      this.init();
  }
  /** A swapped-in DOM node is adopted; the previous context is shut down. */
  adopt(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas) return;
    this.gl
      ?.getExtension('WEBGL_lose_context')
      ?.loseContext();
    this.gl = null;
    this.canvas = canvas;
    canvas.dataset.renderer = 'fallback';
    canvas.style.opacity = '';
    this.watch(canvas);
    if (new URLSearchParams(location.search).get('effects') !== 'off')
      this.init();
  }
  private watch(canvas: HTMLCanvasElement) {
    // Superseded canvases must not keep touching the singleton: WebKit fires
    // webglcontextlost asynchronously, so a stale listener would murder the
    // live context right after adopt() swaps the DOM node.
    this.observer?.disconnect();
    this.detachCanvas?.abort();
    this.detachCanvas = new AbortController();
    const { signal } = this.detachCanvas;
    this.observer = new ResizeObserver(() => {
      if (this.canvas === canvas) this.resize();
    });
    this.observer.observe(canvas);
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        if (this.canvas !== canvas) return;
        this.gl = null;
        canvas.dataset.renderer = 'fallback';
        canvas.style.opacity = '0';
      },
      { signal },
    );
    canvas.addEventListener(
      'webglcontextrestored',
      () => {
        if (this.canvas !== canvas) return;
        this.init();
        canvas.style.opacity = '';
      },
      { signal },
    );
  }
  private init() {
    this.atlasGeneration++;
    this.atlasReady = false;
    this.canvas.dataset.renderer = 'fallback';
    this.canvas.dataset.codingAtlas = 'loading';
    this.canvas.style.opacity = '';
    this.atlasTexture = null;
    this.codeTexture = null;
    this.program = null;
    this.triangleVao = null;
    this.locations = {};
    try {
      const gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      });
      if (!gl) return;
      this.gl = gl;
      const shader = (type: number, source: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, source);
        gl.compileShader(sh);
        return sh;
      };
      const vs = shader(gl.VERTEX_SHADER, vertex),
        fs = shader(gl.FRAGMENT_SHADER, codingFragment),
        program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('Coding visual fallback:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return;
      }
      this.program = program;
      this.canvas.dataset.renderer = 'webgl2';
      gl.useProgram(program);
      this.triangle();
      for (const key of [
        'resolution',
        'accent',
        'background',
        'sceneTime',
        'timelineA',
        'timelineB',
        'codeState',
        'inspection',
        'phoneRotation',
        'editorRotation',
        'glyphAtlas',
        'codeGrid',
        'atlasReady',
        'localeIndex',
      ])
        this.locations[key] = gl.getUniformLocation(program, key);
      const rgb = (hex: string) =>
        hex.match(/[a-f\d]{2}/gi)!.map((v) => parseInt(v, 16) / 255);
      const a = rgb(theme.accent),
        b = rgb(theme.background);
      gl.uniform3f(this.locations.accent, a[0], a[1], a[2]);
      gl.uniform3f(this.locations.background, b[0], b[1], b[2]);
      // Valid transparent placeholders avoid incomplete samplers while fonts load.
      this.atlasTexture = gl.createTexture();
      this.codeTexture = gl.createTexture();
      for (const [unit, texture] of [
        [gl.TEXTURE0, this.atlasTexture],
        [gl.TEXTURE1, this.codeTexture],
      ] as const) {
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          1,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array(4),
        );
      }
      const generation = this.atlasGeneration;
      getCodingAtlas()
        .then((atlas) => {
          if (
            this.gl !== gl ||
            generation !== this.atlasGeneration ||
            gl.isContextLost()
          )
            return;
          this.uploadCodingAtlas(gl, atlas);
          this.draw();
        })
        .catch(() => {
          this.canvas.dataset.codingAtlas = 'fallback';
        });
      this.resize();
    } catch (error) {
      console.warn('Coding visual fallback:', error);
      this.canvas.dataset.renderer = 'fallback';
      this.canvas.style.opacity = '0';
    }
  }
  private triangle() {
    const gl = this.gl!;
    this.triangleVao = gl.createVertexArray();
    gl.bindVertexArray(this.triangleVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(this.program!, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }
  private uploadCodingAtlas(gl: WebGL2RenderingContext, atlas: CodingAtlas) {
    const upload = (unit: number, texture: WebGLTexture) => {
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    this.atlasTexture ??= gl.createTexture();
    upload(gl.TEXTURE0, this.atlasTexture!);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlas.canvas,
    );
    this.codeTexture ??= gl.createTexture();
    upload(gl.TEXTURE1, this.codeTexture!);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      40,
      24,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      atlas.code,
    );
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    this.atlasReady = true;
    this.canvas.dataset.codingAtlas = 'ready';
  }
  setCodingState(
    state: CodingSceneState,
    inspection: CodingInspection,
    locale: Locale,
  ) {
    this.codingState = state;
    this.codingInspection = inspection;
    this.codingLocale = locale;
    this.draw();
  }
  private resize() {
    const gl = this.gl,
      width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    if (!gl || !width || !height) return;
    this.density = pixelDensity();
    this.canvas.width = Math.round(width * this.density);
    this.canvas.height = Math.round(height * this.density);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.draw();
  }
  private draw() {
    const gl = this.gl;
    if (!gl || !this.program) return;
    const reduced = this.reduced.matches;
    const state = reduced ? codingSceneState(21, true) : this.codingState;
    const input = reduced
      ? { x: 0, y: 0, pulseAge: 100 }
      : this.codingInspection;
    gl.bindVertexArray(this.triangleVao);
    gl.useProgram(this.program);
    gl.uniform2f(
      this.locations.resolution,
      this.canvas.width,
      this.canvas.height,
    );
    gl.uniform1f(this.locations.sceneTime, state.time);
    gl.uniform4f(
      this.locations.timelineA,
      state.assembly,
      state.detail,
      state.completion,
      state.reset,
    );
    gl.uniform4f(
      this.locations.timelineB,
      state.editorReveal,
      state.signal,
      state.navigation,
      0,
    );
    gl.uniform3f(
      this.locations.codeState,
      state.codeFrom,
      state.codeTo,
      state.codeBlend,
    );
    gl.uniform3f(
      this.locations.inspection,
      input.x,
      input.y,
      input.pulseAge,
    );
    gl.uniformMatrix3fv(
      this.locations.phoneRotation,
      false,
      codingRotation(-0.025 + input.x, -0.12 + input.y, 0.015),
    );
    gl.uniformMatrix3fv(
      this.locations.editorRotation,
      false,
      this.editorMatrix,
    );
    gl.uniform1i(
      this.locations.localeIndex,
      this.codingLocale === 'ru' ? 1 : 0,
    );
    gl.uniform1f(this.locations.atlasReady, this.atlasReady ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(this.locations.glyphAtlas, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.codeTexture);
    gl.uniform1i(this.locations.codeGrid, 1);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
let instance: CodingCanvas | undefined;
export function getCodingCanvas(canvas: HTMLCanvasElement) {
  if (!instance) instance = new CodingCanvas(canvas);
  else if (instance.canvas !== canvas) instance.adopt(canvas);
  return instance;
}
