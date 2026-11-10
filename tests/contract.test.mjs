import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import { checkContract } from '../scripts/lib/contract.mjs';
import { createMockAdapter } from './fixtures/mock-adapter.mjs';

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const adapter = { id: 'demo', healthPath: '/health', apiBasePath: '/api' };

test('contract check passes against a compliant adapter', async () => {
  const server = await createMockAdapter();
  try {
    const result = await checkContract(server.url, adapter);
    assert.equal(result.ok, true, JSON.stringify(result.checks));
  } finally {
    await server.close();
  }
});

test('contract check fails when the list endpoint breaks', async () => {
  const server = await createMockAdapter({ failListEndpoint: true });
  try {
    const result = await checkContract(server.url, adapter);
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((check) => check.name.includes('/api/users') && !check.ok));
  } finally {
    await server.close();
  }
});

test('bench run writes a runtime-bench.result.v1 file end to end', async () => {
  const server = await createMockAdapter();
  const outDir = await mkdtemp(join(tmpdir(), 'runtime-bench-run-'));
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        join(ROOT, 'scripts', 'bench.mjs'),
        'run',
        '--adapter',
        'bun',
        '--base-url',
        server.url,
        '--scenario',
        'smoke',
        '--duration',
        '1',
        '--connections',
        '2',
        '--out',
        outDir,
      ],
      { cwd: ROOT, timeout: 60_000 },
    );

    assert.ok(stdout.includes('RPS:'));

    const files = (await readdir(outDir)).filter((name) => name.endsWith('.json'));
    assert.equal(files.length, 1);

    const saved = JSON.parse(await readFile(join(outDir, files[0]), 'utf8'));
    assert.equal(saved.schema, 'runtime-bench.result.v1');
    assert.equal(saved.adapter, 'bun');
    assert.equal(saved.scenario, 'smoke');
    assert.equal(saved.workload.durationSeconds, 1);
    assert.ok(saved.metrics.requestsPerSecond > 0);
    assert.equal(saved.metrics.errors, 0);
  } finally {
    await server.close();
  }
});
