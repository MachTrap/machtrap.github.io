import test from 'node:test';
import assert from 'node:assert/strict';
import {
  architectureGraph,
  nodeIds,
  connectedNodes,
} from '../src/data/architecture';
test('every localized scenario has complete, connected stable node roles', () => {
  for (const locale of ['en', 'ru'] as const)
    for (let scenario = 0; scenario < 3; scenario++) {
      const graph = architectureGraph(locale, scenario);
      assert.deepEqual(
        graph.nodes.map((n) => n.id),
        [...nodeIds],
      );
      graph.nodes.forEach((node) => {
        assert.ok(node.label && node.description && node.detail);
        assert.ok(node.technologies.length <= 3);
      });
      const reachable = new Set(['client']);
      for (let i = 0; i < 5; i++)
        for (const edge of graph.edges) {
          assert.ok(nodeIds.includes(edge.from) && nodeIds.includes(edge.to));
          if (reachable.has(edge.from)) reachable.add(edge.to);
        }
      assert.equal(reachable.size, 5);
    }
});
test('scenario topology distinguishes media processing and optional background jobs', () => {
  const api = architectureGraph('en', 1),
    media = architectureGraph('en', 2);
  assert.ok(api.edges.find((e) => e.to === 'worker')?.optional);
  assert.ok(media.edges.some((e) => e.from === 'worker' && e.to === 'data'));
  assert.ok(!media.edges.some((e) => e.from === 'service' && e.to === 'data'));
  const neighbors = connectedNodes(api, 'service');
  assert.ok(
    neighbors.has('gateway') &&
      neighbors.has('data') &&
      neighbors.has('worker'),
  );
  assert.ok(!neighbors.has('client'));
});
