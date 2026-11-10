import assert from 'node:assert/strict';
import test from 'node:test';

import { renderLeaderboard } from '../scripts/lib/leaderboard.mjs';

function result(adapter, rps, startedAt = '2026-11-10T00:00:00.000Z', scenario = 'smoke') {
  return {
    adapter,
    adapterName: adapter,
    runtime: 'Node.js',
    runtimeVersion: '20',
    framework: 'Fastify',
    scenario,
    commit: 'abcdef1234567890',
    startedAt,
    metrics: {
      requestsPerSecond: rps,
      latencyMs: { p50: 1, p90: 2, p99: 3, max: 4 },
      non2xx: 0,
      errors: 0,
      timeouts: 0,
    },
    environment: { cpuModel: 'Test CPU', cpuCores: 8, totalMemoryBytes: 1073741824, os: 'Linux 6', node: 'v20' },
  };
}

test('leaderboard sorts adapters by throughput descending', () => {
  const markdown = renderLeaderboard([result('slow', 100), result('fast', 900)], {
    generatedAt: '2026-11-10T00:00:00.000Z',
  });
  const fastIndex = markdown.indexOf('| 1 | fast |');
  const slowIndex = markdown.indexOf('| 2 | slow |');
  assert.ok(fastIndex > -1 && slowIndex > fastIndex);
});

test('leaderboard keeps only the newest result per adapter', () => {
  const markdown = renderLeaderboard(
    [result('demo', 100, '2026-11-09T00:00:00.000Z'), result('demo', 500, '2026-11-10T00:00:00.000Z')],
    { generatedAt: '2026-11-10T00:00:00.000Z' },
  );
  assert.equal(markdown.match(/\| demo \|/g).length, 1);
  assert.ok(markdown.includes('500'));
  assert.ok(!markdown.includes('| 100 |'));
});

test('leaderboard declares the environment of the newest result', () => {
  const markdown = renderLeaderboard([result('demo', 100)], {
    generatedAt: '2026-11-10T00:00:00.000Z',
  });
  assert.ok(markdown.includes('Test CPU (8 núcleos)'));
});

test('leaderboard with no results explains how to publish one', () => {
  const markdown = renderLeaderboard([], { generatedAt: '2026-11-10T00:00:00.000Z' });
  assert.ok(markdown.includes('Todavía no hay resultados publicados'));
  assert.ok(markdown.includes('node scripts/bench.mjs run'));
});
