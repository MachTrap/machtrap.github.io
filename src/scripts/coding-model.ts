import { clamp } from './motion';
export const CODING_DURATION = 24;
export interface CodingSceneState {
  time: number;
  phase: number;
  act: 0 | 1 | 2;
  assembly: number;
  detail: number;
  completion: number;
  reset: number;
  editorReveal: number;
  signal: number;
  navigation: number;
  codeFrom: number;
  codeTo: number;
  codeBlend: number;
}
const ease = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export function codingSceneState(
  elapsed: number,
  reduced = false,
): CodingSceneState {
  const phase = reduced
    ? 21
    : elapsed >= 0
      ? elapsed % CODING_DURATION
      : ((elapsed % CODING_DURATION) + CODING_DURATION) % CODING_DURATION;
  const reset = ease(23, 24, phase),
    act = phase < 7 ? 0 : phase < 15 ? 1 : 2;
  const assembly =
    (0.08 + 0.92 * ease(4.1, 6.3, phase)) * (1 - reset) + 0.08 * reset;
  const detail = ease(9.1, 10.4, phase) * (1 - ease(16.8, 18.8, phase));
  const completion = ease(11.3, 13.8, phase) * (1 - reset);
  let codeFrom = 0,
    codeTo = 0,
    codeBlend = 0;
  if (phase >= 23) {
    codeFrom = 2;
    codeTo = 0;
    codeBlend = reset;
  } else if (phase >= 15.35) {
    codeFrom = codeTo = 2;
  } else if (phase >= 14.65) {
    codeFrom = 1;
    codeTo = 2;
    codeBlend = ease(14.65, 15.35, phase);
  } else if (phase >= 7.35) {
    codeFrom = codeTo = 1;
  } else if (phase >= 6.65) {
    codeFrom = 0;
    codeTo = 1;
    codeBlend = ease(6.65, 7.35, phase);
  }
  const editorReveal =
    phase >= 23
      ? 0.12
      : codeTo === 0
        ? 0.12 + 0.88 * ease(0.3, 3.2, phase)
        : codeTo === 1
          ? 0.08 + 0.92 * ease(6.7, 8.4, phase)
          : 0.08 + 0.92 * ease(14.7, 16, phase);
  let signal = -1;
  for (const [start, end] of [
    [3.2, 4.1],
    [8.4, 9.1],
    [16, 16.8],
  ])
    if (phase >= start && phase <= end) signal = ease(start, end, phase);
  return {
    time: reduced ? 21 : elapsed,
    phase,
    act,
    assembly,
    detail,
    completion,
    reset,
    editorReveal,
    signal,
    navigation: ease(18.8, 20.6, phase) * (1 - reset),
    codeFrom,
    codeTo,
    codeBlend,
  };
}
export interface CodingInspection {
  x: number;
  y: number;
  pulseAge: number;
}
export function codingRotation(x: number, y: number, z = 0): Float32Array {
  const cx = Math.cos(x),
    sx = Math.sin(x),
    cy = Math.cos(y),
    sy = Math.sin(y),
    cz = Math.cos(z),
    sz = Math.sin(z);
  return new Float32Array([
    cz * cy,
    sz * cy,
    -sy,
    cz * sy * sx - sz * cx,
    sz * sy * sx + cz * cx,
    cy * sx,
    cz * sy * cx + sz * sx,
    sz * sy * cx - cz * sx,
    cy * cx,
  ]);
}
export function touchIntent(
  dx: number,
  dy: number,
): 'pending' | 'inspect' | 'scroll' {
  if (Math.hypot(dx, dy) < 8) return 'pending';
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? 'inspect' : 'scroll';
}
