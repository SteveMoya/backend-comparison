import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildResult,
  latestPerAdapter,
  readResults,
  RESULT_SCHEMA,
  resultFilename,
  summarizeAutocannon,
  writeResult,
} from '../scripts/lib/result.mjs';

const adapter = {
  id: 'demo',
  name: 'Demo',
  runtime: 'Node.js',
  framework: 'Fastify',
  language: 'TypeScript',
  runtimeVersion: '20',
};

function makeResult(overrides = {}) {
  return buildResult({
    adapter,
    scenario: { id: 'smoke' },
    commit: 'abcdef1234567890',
    startedAt: '2026-11-10T03:00:00.000Z',
    durationSeconds: 10,
    environment: { cpuModel: 'Test CPU', cpuCores: 8, totalMemoryBytes: 1024, os: 'Linux' },
    workload: { durationSeconds: 10, connections: 10, requests: [] },
    metrics: {
      requestsPerSecond: 1000,
      requestsTotal: 10000,
      latencyMs: { average: 1, p50: 1, p90: 2, p99: 3, max: 5 },
      throughputBytesPerSecond: 0,
      non2xx: 0,
      errors: 0,
      timeouts: 0,
    },
    ...overrides,
  });
}

test('summarizeAutocannon maps autocannon fields to the result schema', () => {
  const metrics = summarizeAutocannon({
    requests: { average: 1234.567, total: 1234 },
    latency: { average: 1.234, p50: 1, p90: 3, p99: 9, max: 20 },
    throughput: { average: 999.4 },
    non2xx: 2,
    errors: 1,
    timeouts: 0,
  });

  assert.equal(metrics.requestsPerSecond, 1235);
  assert.equal(metrics.latencyMs.p90, 3);
  assert.equal(metrics.latencyMs.average, 1.23);
  assert.equal(metrics.non2xx, 2);
});

test('resultFilename is deterministic and carries commit plus timestamp', () => {
  assert.equal(
    resultFilename(makeResult()),
    'demo-smoke-abcdef1-20261110T030000Z.json',
  );
});

test('writeResult then readResults round-trips the schema', async () => {
  const workdir = await mkdtemp(join(tmpdir(), 'runtime-bench-results-'));
  const result = makeResult();
  const path = await writeResult(workdir, result);
  const { results, problems } = await readResults(workdir);

  assert.deepEqual(problems, []);
  assert.equal(results.length, 1);
  assert.equal(results[0].schema, RESULT_SCHEMA);
  assert.equal(results[0].adapter, 'demo');
  assert.ok(path.endsWith('demo-smoke-abcdef1-20261110T030000Z.json'));
});

test('readResults reports unsupported schemas and invalid JSON', async () => {
  const workdir = await mkdtemp(join(tmpdir(), 'runtime-bench-results-'));
  await writeFile(join(workdir, 'old.json'), JSON.stringify({ schema: 'legacy.v0' }));
  await writeFile(join(workdir, 'broken.json'), '{ nope');

  const { results, problems } = await readResults(workdir);
  assert.equal(results.length, 0);
  assert.equal(problems.length, 2);
});

test('latestPerAdapter keeps one row per adapter using the newest run', () => {
  const older = makeResult({ startedAt: '2026-11-09T00:00:00.000Z' });
  const newer = makeResult({ startedAt: '2026-11-10T00:00:00.000Z', metrics: { ...older.metrics, requestsPerSecond: 2000 } });
  const other = makeResult({ startedAt: '2026-11-10T01:00:00.000Z', adapter: { ...adapter, id: 'other' } });

  const latest = latestPerAdapter([older, newer, other], 'smoke');
  assert.equal(latest.length, 2);
  const demo = latest.find((result) => result.adapter === 'demo');
  assert.equal(demo.metrics.requestsPerSecond, 2000);
});
