import test from 'node:test';
import assert from 'node:assert/strict';
import { SurfaceMotion } from '../src/scripts/surface-motion';
import {
  ParticlePool,
  objectMatrix,
  transform,
  project,
  surfacePoint,
  pickSurface,
  type HeroPose,
} from '../src/scripts/hero-model';
const pose: HeroPose = {
  geometryTime: 1,
  rotationX: 0.3,
  rotationY: 0.2,
  pointerX: 0,
  pointerY: 0,
  scroll: 0.2,
};
test('stationary hold freezes geometry but not illumination, and occlusion stops both clocks', () => {
  const motion = new SurfaceMotion();
  motion.begin(1, 400, 300, 0, 800, 600);
  for (let i = 0; i < 240; i++) motion.step(1 / 60);
  const geometry = motion.visualTime,
    effects = motion.effectTime;
  for (let i = 0; i < 120; i++) motion.step(1 / 60);
  assert.ok(motion.visualTime - geometry < 0.001);
  assert.ok(Math.abs(motion.effectTime - effects - 2) < 0.001);
  const last = motion.effectTime;
  motion.step(0.08, false);
  assert.equal(motion.effectTime, last);
});
test('shared object transform roundtrips and picking lands on a projected surface', () => {
  const matrix = objectMatrix(pose),
    v: [number, number, number] = [0.2, 0.3, 0.6];
  const restored = transform(transform(v, matrix), matrix, true);
  v.forEach((value, i) => assert.ok(Math.abs(restored[i] - value) < 1e-6));
  const world = transform(
    surfacePoint(1.2, 0.7, pose.geometryTime),
    matrix,
    true,
  );
  const uv = project(world, 1.6, pose.scroll),
    angles = pickSurface(uv[0], uv[1], 1.6, pose, matrix);
  const hit = project(
    transform(surfacePoint(...angles, pose.geometryTime), matrix, true),
    1.6,
    pose.scroll,
  );
  assert.ok(Math.hypot(hit[0] - uv[0], hit[1] - uv[1]) < 0.03);
});
test('particles remain bounded, detach in world space and expire', () => {
  const pool = new ParticlePool(),
    storage = pool.data,
    matrix = objectMatrix(pose);
  pool.step(1 / 60, 0, 60, 128, matrix, 1, null);
  const origin = Array.from(pool.data.slice(0, 3));
  for (let i = 1; i < 1200; i++)
    pool.step(1 / 60, i / 60, 10000, 128, matrix, 1, null);
  assert.equal(pool.data, storage);
  assert.ok(pool.data.every(Number.isFinite));
  assert.equal(pool.data.length, 2560);
  assert.ok(pool.active(20, 128) <= 128);
  assert.equal(pool.active(100, 128), 0);
  const single = new ParticlePool();
  single.step(1 / 60, 0, 60, 256, matrix, 1, null);
  const before = Array.from(single.data.slice(0, 3));
  single.step(
    1 / 60,
    0.1,
    60,
    256,
    objectMatrix({ ...pose, rotationY: 4 }),
    1,
    null,
  );
  assert.deepEqual(Array.from(single.data.slice(0, 3)), before);
  assert.ok(origin.every(Number.isFinite));
  pool.clear();
  assert.equal(pool.active(20, 128), 0);
});
test('bounded emission is consistent across frame rates', () => {
  const totals = [30, 60, 120].map((hz) => {
    const pool = new ParticlePool();
    for (let i = 0; i < hz * 5; i++)
      pool.step(1 / hz, i / hz, 75, 256, objectMatrix(pose), 1, null);
    return pool.emitted;
  });
  assert.ok(Math.max(...totals) - Math.min(...totals) <= 1);
});
