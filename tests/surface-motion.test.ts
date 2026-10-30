import test from 'node:test';
import assert from 'node:assert/strict';
import { SurfaceMotion, heroVisibility } from '../src/scripts/surface-motion';
test('stationary touch and subpixel noise do not generate repeated movement', () => {
  const m = new SurfaceMotion();
  m.begin(1, 100, 100, 0, 390, 844);
  for (let i = 1; i <= 300; i++) {
    assert.equal(
      m.move(1, 100 + (i % 2 ? 0.4 : -0.4), 100, i * 16, 390, 844),
      false,
    );
    m.step(1 / 60);
  }
  assert.equal(m.rotationX.target, 0);
  assert.equal(m.rotationY.target, 0);
  assert.ok(m.energy.value < 0.001);
  const phase = m.visualTime;
  for (let i = 0; i < 60; i++) m.step(1 / 60);
  assert.ok(m.visualTime - phase < 0.0001);
});
test('held drag tracks its target without spring overshoot', () => {
  const m = new SurfaceMotion();
  m.begin(1, 100, 100, 0, 400, 800);
  m.move(1, 180, 120, 16, 400, 800);
  const target = m.rotationY.target;
  let last = 0;
  for (let i = 0; i < 120; i++) {
    m.step(1 / 60);
    assert.ok(m.rotationY.value >= last - 1e-8);
    assert.ok(m.rotationY.value <= target + 1e-8);
    last = m.rotationY.value;
  }
});
test('release carries bounded momentum, but holding before release cancels the fling', () => {
  const moving = new SurfaceMotion();
  moving.begin(1, 100, 100, 0, 400, 800);
  moving.move(1, 180, 100, 16, 400, 800);
  moving.step(1 / 60);
  moving.end(1, 20);
  const target = moving.rotationY.target;
  moving.step(1 / 60);
  assert.ok(moving.rotationY.target > target);
  const held = new SurfaceMotion();
  held.begin(1, 100, 100, 0, 400, 800);
  held.move(1, 180, 100, 16, 400, 800);
  held.end(1, 500);
  const stable = held.rotationY.target;
  for (let i = 0; i < 120; i++) held.step(1 / 60);
  assert.equal(held.rotationY.target, stable);
});
test('gesture momentum is stable across frame rates', () => {
  const results = [30, 60, 120].map((fps) => {
    const m = new SurfaceMotion();
    m.begin(1, 100, 100, 0, 400, 800);
    m.move(1, 180, 100, 16, 400, 800);
    m.end(1, 20);
    for (let i = 0; i < fps * 2; i++) m.step(1 / fps);
    return m.rotationY.value;
  });
  assert.ok(Math.max(...results) - Math.min(...results) < 0.004);
});
test('scroll visibility fades through partial exposure, not a section midpoint cutoff', () => {
  assert.equal(heroVisibility(900, 900, 90), 1);
  assert.ok(heroVisibility(450, 900, 90) > 0);
  assert.equal(heroVisibility(90, 900, 90), 0);
  const m = new SurfaceMotion();
  m.visibility.target = 0.2;
  let last = 1;
  for (let i = 0; i < 180; i++) {
    m.step(1 / 60);
    assert.ok(m.visibility.value <= last + 1e-8);
    assert.ok(m.visibility.value >= 0.2 - 1e-8);
    last = m.visibility.value;
  }
  assert.ok(m.visualTime > 2.9);
});
test('resuming preserves the accumulated visual phase', () => {
  const m = new SurfaceMotion();
  for (let i = 0; i < 60; i++) m.step(1 / 60);
  const phase = m.visualTime;
  m.step(1 / 60);
  assert.ok(m.visualTime > phase);
  m.cancel();
  assert.ok(m.visualTime > phase);
});
