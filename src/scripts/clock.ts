type Tick = (delta: number, time: number) => void;
const listeners = new Set<Tick>();
let handle = 0;
let previous = 0;
function frame(now: number) {
  handle = 0;
  if (document.hidden) {
    previous = 0;
    return;
  }
  const dt = previous ? Math.min((now - previous) / 1000, 0.08) : 0;
  previous = now;
  for (const tick of listeners) tick(dt, now / 1000);
  if (listeners.size) handle = requestAnimationFrame(frame);
}
export function subscribe(tick: Tick) {
  listeners.add(tick);
  if (!handle && !document.hidden) {
    previous = 0;
    handle = requestAnimationFrame(frame);
  }
  return () => {
    listeners.delete(tick);
    if (!listeners.size) {
      cancelAnimationFrame(handle);
      handle = 0;
      previous = 0;
    }
  };
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(handle);
    handle = 0;
    previous = 0;
  } else if (listeners.size && !handle) handle = requestAnimationFrame(frame);
});
