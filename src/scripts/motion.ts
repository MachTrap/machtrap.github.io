export interface Spring {
  value: number;
  target: number;
  velocity: number;
}
export const spring = (value = 0): Spring => ({
  value,
  target: value,
  velocity: 0,
});
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
/** Semi-implicit integration in bounded substeps keeps 30/60/120 Hz input consistent. */
export function stepSpring(
  state: Spring,
  delta: number,
  stiffness = 38,
  damping = 10,
) {
  const duration = clamp(delta, 0, 0.1),
    steps = Math.max(1, Math.ceil(duration * 120)),
    dt = duration / steps;
  for (let i = 0; i < steps; i++) {
    state.velocity +=
      ((state.target - state.value) * stiffness - state.velocity * damping) *
      dt;
    state.value += state.velocity * dt;
  }
  if (
    Math.abs(state.target - state.value) < 0.00001 &&
    Math.abs(state.velocity) < 0.00001
  ) {
    state.value = state.target;
    state.velocity = 0;
  }
  return state.value;
}
export function impulse(state: Spring, amount: number, limit = 8) {
  state.velocity = clamp(state.velocity + amount, -limit, limit);
}
