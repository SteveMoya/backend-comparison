import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import test from 'node:test';

import { loadAdapters, validateManifest } from '../scripts/lib/manifest.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const validManifest = {
  id: 'demo',
  name: 'Demo',
  language: 'TypeScript',
  runtime: 'Node.js',
  framework: 'Fastify',
  runtimeVersion: '20',
  source: 'src/demo',
  service: 'app-demo',
  port: 4000,
  healthPath: '/health',
  apiBasePath: '/api',
};

test('validateManifest accepts a complete manifest', () => {
  assert.deepEqual(validateManifest(validManifest), []);
});

test('validateManifest reports every missing required field', () => {
  const errors = validateManifest({ ...validManifest, framework: undefined, service: undefined });
  assert.equal(errors.length, 2);
  assert.ok(errors.some((error) => error.includes('"framework"')));
  assert.ok(errors.some((error) => error.includes('"service"')));
});

test('validateManifest rejects a non integer or out of range port', () => {
  assert.equal(validateManifest({ ...validManifest, port: '3000' }).length, 1);
  assert.equal(validateManifest({ ...validManifest, port: 0 }).length, 1);
  assert.equal(validateManifest({ ...validManifest, port: 70000 }).length, 1);
});

test('validateManifest rejects a non kebab-case id', () => {
  const errors = validateManifest({ ...validManifest, id: 'Demo_App' });
  assert.ok(errors.some((error) => error.includes('kebab-case')));
});

test('loadAdapters reads the five current adapters without problems', async () => {
  const { adapters, problems } = await loadAdapters(join(ROOT, 'adapters'));
  assert.deepEqual(problems, []);
  assert.deepEqual(
    adapters.map((adapter) => adapter.id),
    ['astrojs-bun', 'bun', 'go-gin', 'nodejs-nestjs', 'python-fastapi'],
  );
});

test('loadAdapters reports a directory whose id does not match its name', async () => {
  const workdir = await mkdtemp(join(tmpdir(), 'runtime-bench-manifest-'));
  await mkdir(join(workdir, 'wrong-dir'), { recursive: true });
  await writeFile(
    join(workdir, 'wrong-dir', 'adapter.json'),
    JSON.stringify({ ...validManifest, id: 'other-id' }),
  );

  const { adapters, problems } = await loadAdapters(workdir);
  assert.equal(adapters.length, 0);
  assert.ok(problems.some((problem) => problem.includes('must match the directory name')));
});

test('loadAdapters reports invalid JSON instead of throwing', async () => {
  const workdir = await mkdtemp(join(tmpdir(), 'runtime-bench-manifest-'));
  await mkdir(join(workdir, 'broken'), { recursive: true });
  await writeFile(join(workdir, 'broken', 'adapter.json'), '{ not json');

  const { adapters, problems } = await loadAdapters(workdir);
  assert.equal(adapters.length, 0);
  assert.ok(problems.some((problem) => problem.includes('invalid JSON')));
});
