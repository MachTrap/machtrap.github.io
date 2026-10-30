import { subscribe } from './clock';
import { spring, stepSpring, clamp } from './motion';
import { codingSceneState, touchIntent } from './coding-model';
import { getScene } from './scene';
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
  const render = () => {
    const state = codingSceneState(elapsed, reduced.matches);
    region.dataset.demoPhase = state.phase.toFixed(3);
    region.dataset.codingAct = String(state.act);
    region.dataset.codingTilt = `${x.value.toFixed(4)},${y.value.toFixed(4)}`;
    region.dataset.codingPulse = pulseAge.toFixed(3);
    getScene()?.setCodingState(
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
      document.querySelector<HTMLElement>('#scene')?.dataset.renderer !==
        'webgl2'
    ) {
      if (reduced.matches) {
        x.value = y.value = 0;
        reset();
      }
      render();
      return;
    }
    stop = subscribe((dt) => {
      elapsed += dt;
      pulseAge += dt;
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
      const bounds = region.getBoundingClientRect();
      if (drag && drag.id === event.pointerId) {
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
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) reset();
      schedule();
    },
    { threshold: 0.08 },
  );
  observer.observe(region);
  const canvas = document.querySelector('#scene');
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
