import { subscribe } from './clock';
import { spring, stepSpring, clamp } from './motion';
import { codingSceneState, touchIntent } from './coding-model';
import { getCodingCanvas } from './coding-canvas';
import type { Locale } from '../data/site';
let elapsed = 0;
export function createCodingScene(region: HTMLElement, locale: Locale) {
  const abort = new AbortController(),
    { signal } = abort,
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const x = spring(),
    y = spring();
  let pulseAge = 100,
    visible = false,
    stop: (() => void) | undefined;
  let drag: {
    id: number;
    x: number;
    y: number;
    type: string;
    intent: 'pending' | 'inspect' | 'scroll';
    moved: boolean;
  } | null = null;
  const canvas = region.querySelector<HTMLCanvasElement>('.coding-canvas');
  const stage = canvas ? getCodingCanvas(canvas) : null;
  let lastPhase = '';
  let lastTilt = '';
  let lastPulse = '';
  const render = () => {
    const state = codingSceneState(elapsed, reduced.matches);
    const act = String(state.act);
    if (region.dataset.codingAct !== act) region.dataset.codingAct = act;
    // Observability attributes update at ~10 Hz; per-frame dataset writes
    // would trigger style recalculations while the page scrolls on WebKit.
    const phase = (Math.round(state.phase * 10) / 10).toFixed(3);
    if (phase !== lastPhase) {
      lastPhase = phase;
      region.dataset.demoPhase = phase;
    }
    const tilt = `${x.value.toFixed(3)},${y.value.toFixed(3)}`;
    if (tilt !== lastTilt) {
      lastTilt = tilt;
      region.dataset.codingTilt = tilt;
    }
    const pulse = (Math.round(pulseAge * 4) / 4).toFixed(3);
    if (pulse !== lastPulse) {
      lastPulse = pulse;
      region.dataset.codingPulse = pulse;
    }
    stage?.setCodingState(
      state,
      {
        x: reduced.matches ? 0 : x.value,
        y: reduced.matches ? 0 : y.value,
        pulseAge: reduced.matches ? 100 : pulseAge,
      },
      locale,
    );
  };
  const reset = () => {
    drag = null;
    x.target = 0;
    y.target = 0;
  };
  const schedule = () => {
    stop?.();
    stop = undefined;
    if (
      !visible ||
      reduced.matches ||
      !canvas ||
      canvas.dataset.renderer !== 'webgl2'
    ) {
      if (reduced.matches) {
        x.value = y.value = 0;
        reset();
      }
      render();
      return;
    }
    let lastRender = 0;
    stop = subscribe((dt, time) => {
      elapsed += dt;
      pulseAge += dt;
      // A 60 fps ceiling: ProMotion panels otherwise redraw the shader at 120.
      if (time - lastRender < 1 / 60 - 0.002) return;
      lastRender = time;
      stepSpring(x, dt, 65, 18);
      stepSpring(y, dt, 65, 18);
      render();
    });
  };
  region.addEventListener(
    'pointerdown',
    (event) => {
      if (reduced.matches || drag || event.button !== 0) return;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        type: event.pointerType,
        intent: 'pending',
        moved: false,
      };
      region.dataset.codingInput = event.pointerType;
    },
    { signal, passive: true },
  );
  region.addEventListener(
    'pointermove',
    (event) => {
      if (reduced.matches) return;
      if (drag && drag.id === event.pointerId) {
        // A vertical gesture belongs to page scrolling: no layout reads at all.
        if (drag.intent === 'scroll') return;
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y;
        if (Math.hypot(dx, dy) >= 8) drag.moved = true;
        if (drag.intent === 'pending') {
          drag.intent =
            drag.type === 'touch'
              ? touchIntent(dx, dy)
              : Math.hypot(dx, dy) >= 8
                ? 'inspect'
                : 'pending';
          if (drag.intent === 'inspect')
            region.setPointerCapture(event.pointerId);
        }
        if (drag.intent === 'inspect') {
          const bounds = region.getBoundingClientRect();
          y.target = clamp(
            (dx / Math.max(180, bounds.width)) * 0.9,
            -Math.PI / 15,
            Math.PI / 15,
          );
          x.target = clamp(
            (dy / Math.max(240, bounds.height)) * 0.5,
            -Math.PI / 22.5,
            Math.PI / 22.5,
          );
        }
      } else if (event.pointerType === 'mouse') {
        const bounds = region.getBoundingClientRect();
        y.target =
          clamp((event.clientX - bounds.left) / bounds.width - 0.5, -0.5, 0.5) *
          0.075;
        x.target =
          clamp((event.clientY - bounds.top) / bounds.height - 0.5, -0.5, 0.5) *
          0.04;
      }
    },
    { signal, passive: true },
  );
  const release = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    if (event.type === 'pointerup' && !drag.moved) pulseAge = 0;
    reset();
    if (region.hasPointerCapture(event.pointerId))
      region.releasePointerCapture(event.pointerId);
  };
  region.addEventListener('pointerup', release, { signal });
  region.addEventListener('pointercancel', release, { signal });
  window.addEventListener('pointerup', release, { signal });
  window.addEventListener('pointercancel', release, { signal });
  region.addEventListener('lostpointercapture', reset, { signal });
  region.addEventListener(
    'pointerleave',
    () => {
      if (!drag) reset();
    },
    { signal },
  );
  region.addEventListener(
    'keydown',
    (event) => {
      if (reduced.matches) return;
      const step = Math.PI / 90;
      if (event.key === 'ArrowLeft')
        y.target = clamp(y.target - step, -Math.PI / 15, Math.PI / 15);
      else if (event.key === 'ArrowRight')
        y.target = clamp(y.target + step, -Math.PI / 15, Math.PI / 15);
      else if (event.key === 'ArrowUp')
        x.target = clamp(x.target - step, -Math.PI / 22.5, Math.PI / 22.5);
      else if (event.key === 'ArrowDown')
        x.target = clamp(x.target + step, -Math.PI / 22.5, Math.PI / 22.5);
      else if (event.key === 'Enter') pulseAge = 0;
      else if (event.key === 'Escape') reset();
      else return;
      event.preventDefault();
    },
    { signal },
  );
  region.addEventListener('blur', reset, { signal });
  window.addEventListener('blur', reset, { signal });
  canvas?.addEventListener(
    'webglcontextlost',
    () => {
      stop?.();
      stop = undefined;
      reset();
    },
    { signal },
  );
  canvas?.addEventListener('webglcontextrestored', schedule, { signal });
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) reset();
      schedule();
    },
    { threshold: 0.08 },
  );
  observer.observe(region);
  const onReduced = () => {
    reset();
    schedule();
  };
  reduced.addEventListener('change', onReduced);
  render();
  return () => {
    abort.abort();
    observer.disconnect();
    stop?.();
    reduced.removeEventListener('change', onReduced);
  };
}
