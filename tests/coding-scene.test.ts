import test from 'node:test';
import assert from 'node:assert/strict';
import {
  codingSceneState,
  CODING_DURATION,
  codingRotation,
  touchIntent,
} from '../src/scripts/coding-model';
import { codingLabels } from '../src/scripts/coding-atlas';
test('edits and transfers precede the corresponding application changes', () => {
  assert.equal(codingSceneState(3.2).editorReveal, 1);
  assert.equal(codingSceneState(3.2).signal, 0);
  assert.equal(codingSceneState(4.1).signal, 1);
  assert.equal(codingSceneState(4.1).assembly, 0.08);
  assert.ok(codingSceneState(5).assembly > codingSceneState(4.1).assembly);
  assert.equal(codingSceneState(8.4).editorReveal, 1);
  assert.equal(codingSceneState(9.1).detail, 0);
  assert.equal(codingSceneState(10.4).detail, 1);
  assert.equal(codingSceneState(11.3).completion, 0);
  assert.equal(codingSceneState(13.8).completion, 1);
  assert.equal(codingSceneState(16).signal, 0);
  assert.equal(codingSceneState(16.8).detail, 1);
  assert.equal(codingSceneState(18.8).detail, 0);
  assert.equal(codingSceneState(21).navigation, 1);
});
test('loop resets to the same visual state without a blank application or a code jump', () => {
  const start = codingSceneState(0),
    end = codingSceneState(CODING_DURATION - 1e-5),
    wrapped = codingSceneState(CODING_DURATION);
  for (const key of [
    'assembly',
    'detail',
    'completion',
    'navigation',
    'editorReveal',
  ] as const)
    assert.ok(Math.abs(start[key] - end[key]) < 1e-4, key);
  assert.equal(end.codeTo, start.codeFrom);
  assert.ok(end.codeBlend > 0.999);
  const { time: _a, ...a } = start,
    { time: _b, ...b } = wrapped;
  assert.deepEqual(a, b);
  for (let i = 0; i < 2400; i++) {
    const state = codingSceneState(i / 100);
    assert.ok(state.assembly >= 0.0799);
    for (const key of [
      'assembly',
      'detail',
      'completion',
      'reset',
      'editorReveal',
      'navigation',
      'codeBlend',
    ] as const)
      assert.ok(state[key] >= 0 && state[key] <= 1, key);
  }
});
test('reduced motion produces a finished dashboard independently of playback position', () => {
  assert.deepEqual(codingSceneState(0, true), codingSceneState(1000, true));
  const state = codingSceneState(0, true);
  assert.equal(state.assembly, 1);
  assert.equal(state.detail, 0);
  assert.equal(state.completion, 1);
  assert.equal(state.signal, -1);
});
test('touch inspection has an intent threshold and yields vertical or diagonal gestures to scrolling', () => {
  assert.equal(touchIntent(5, 3), 'pending');
  assert.equal(touchIntent(20, 4), 'inspect');
  assert.equal(touchIntent(4, 20), 'scroll');
  assert.equal(touchIntent(10, 10), 'scroll');
});
test('inspection transforms remain orthonormal at the allowed bounds and localized labels fit the atlas', () => {
  for (const x of [-Math.PI / 22.5, 0, Math.PI / 22.5])
    for (const y of [-Math.PI / 15, 0, Math.PI / 15]) {
      const matrix = codingRotation(x, y, 0.015);
      for (let a = 0; a < 3; a++)
        for (let b = 0; b < 3; b++) {
          let dot = 0;
          for (let axis = 0; axis < 3; axis++)
            dot += matrix[a * 3 + axis] * matrix[b * 3 + axis];
          assert.ok(Math.abs(dot - (a === b ? 1 : 0)) < 1e-6);
        }
    }
  assert.equal(codingLabels.en.length, 16);
  assert.equal(codingLabels.ru.length, 16);
  assert.ok(192 + Math.ceil(32 / 4) * 40 <= 512);
});
