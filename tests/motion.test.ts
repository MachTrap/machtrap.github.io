import test from 'node:test';
import assert from 'node:assert/strict';
import { spring, stepSpring, impulse, clamp } from '../src/scripts/motion';
test('an interaction carries momentum after release and settles', () => {
  const state = spring();
  impulse(state, 4);
  stepSpring(state, 1 / 60);
  assert.ok(state.value > 0);
  const first = state.value;
  stepSpring(state, 1 / 60);
  assert.ok(state.value > first);
  for (let i = 0; i < 600; i++) stepSpring(state, 1 / 60);
  assert.ok(Math.abs(state.value) < 0.001);
  assert.ok(Math.abs(state.velocity) < 0.001);
});
test('spring motion is consistent at 30, 60 and 120 Hz', () => {
  const result = [30, 60, 120].map((fps) => {
    const s = spring();
    s.target = 1;
    for (let i = 0; i < fps; i++) stepSpring(s, 1 / fps);
    return s.value;
  });
  assert.ok(Math.max(...result) - Math.min(...result) < 0.003);
});
test('large pauses and repeated gestures remain finite and bounded', () => {
  const s = spring();
  for (let i = 0; i < 100; i++) {
    impulse(s, 100);
    stepSpring(s, 10);
  }
  assert.ok(Number.isFinite(s.value));
  assert.ok(Math.abs(s.velocity) <= 8);
  assert.equal(clamp(10, 0, 2), 2);
});
