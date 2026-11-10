#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import autocannon from 'autocannon';

import { checkContract } from './lib/contract.mjs';
import { captureEnvironment, formatBytes } from './lib/environment.mjs';
import { renderLeaderboard } from './lib/leaderboard.mjs';
import { findAdapter, loadAdapters } from './lib/manifest.mjs';
import { buildResult, readResults, summarizeAutocannon, writeResult } from './lib/result.mjs';
import { buildRequests, getScenario } from './lib/scenarios.mjs';

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ADAPTERS_DIR = join(ROOT, 'adapters');
const LOCAL_RESULTS_DIR = join(ROOT, 'results');
const PUBLISHED_RESULTS_DIR = join(ROOT, 'leaderboard', 'results');
const LEADERBOARD_PATH = join(ROOT, 'LEADERBOARD.md');

const USAGE = `Runtime Bench v0.1

Uso:
  node scripts/bench.mjs list
  node scripts/bench.mjs validate
  node scripts/bench.mjs check --adapter <id> --base-url <url>
  node scripts/bench.mjs run --adapter <id> --base-url <url> [--scenario smoke|load]
                             [--duration <segundos>] [--connections <n>] [--out <dir>]
  node scripts/bench.mjs leaderboard [--results <dir>] [--out <archivo>]
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    adapter: { type: 'string' },
    'base-url': { type: 'string' },
    scenario: { type: 'string' },
    duration: { type: 'string' },
    connections: { type: 'string' },
    out: { type: 'string' },
    results: { type: 'string' },
    commit: { type: 'string' },
    json: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
});

const command = positionals[0];

if (!command || values.help) {
  console.log(USAGE);
  process.exit(command ? 0 : 1);
}

try {
  if (command === 'list') {
    await listAdapters();
  } else if (command === 'validate') {
    await validateAdapters();
  } else if (command === 'check') {
    await checkAdapter();
  } else if (command === 'run') {
    await runBenchmark();
  } else if (command === 'leaderboard') {
    await buildLeaderboard();
  } else {
    console.error(`Comando desconocido: ${command}\n`);
    console.log(USAGE);
    process.exit(1);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

async function loadOrExit() {
  const { adapters, problems } = await loadAdapters(ADAPTERS_DIR);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`- ${problem}`);
    }
    console.error(`\n${problems.length} problema(s) de manifiesto. Corré "node scripts/bench.mjs validate".`);
    process.exit(1);
  }
  return adapters;
}

async function listAdapters() {
  const adapters = await loadOrExit();

  if (values.json) {
    const payload = adapters.map(({ dir, ...manifest }) => manifest);
    console.log(JSON.stringify(payload));
    return;
  }

  const headers = ['id', 'runtime', 'framework', 'puerto'];
  const rows = adapters.map((adapter) => [
    adapter.id,
    `${adapter.runtime} ${adapter.runtimeVersion}`,
    adapter.framework,
    String(adapter.port),
  ]);
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );
  const format = (row) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join('  ').trimEnd();

  console.log(format(headers));
  console.log(format(widths.map((width) => '-'.repeat(width))));
  for (const row of rows) {
    console.log(format(row));
  }
  console.log(`\n${adapters.length} adaptadores.`);
}

async function validateAdapters() {
  const { adapters, problems } = await loadAdapters(ADAPTERS_DIR);

  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`- ${problem}`);
    }
    console.error(`\nFalló la validación: ${problems.length} problema(s) en ${adapters.length} adaptador(es) válido(s).`);
    process.exit(1);
  }

  console.log(`OK: ${adapters.length} manifiestos válidos (${adapters.map((adapter) => adapter.id).join(', ')}).`);
}

async function requireAdapter() {
  if (!values.adapter) {
    throw new Error('falta --adapter');
  }
  const adapters = await loadOrExit();
  const adapter = findAdapter(adapters, values.adapter);
  if (!adapter) {
    throw new Error(
      `adaptador desconocido "${values.adapter}". Disponibles: ${adapters.map((entry) => entry.id).join(', ')}`,
    );
  }
  return adapter;
}

function requireBaseUrl() {
  if (!values['base-url']) {
    throw new Error('falta --base-url');
  }
  return values['base-url'];
}

async function checkAdapter() {
  const adapter = await requireAdapter();
  const baseUrl = requireBaseUrl();
  const result = await checkContract(baseUrl, adapter);

  for (const check of result.checks) {
    console.log(`${check.ok ? 'OK  ' : 'FAIL'} ${check.name} — ${check.detail}`);
  }

  if (!result.ok) {
    process.exit(1);
  }
}

async function resolveCommit() {
  if (values.commit) {
    return values.commit;
  }
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: ROOT });
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

async function runBenchmark() {
  const adapter = await requireAdapter();
  const baseUrl = requireBaseUrl();
  const scenario = getScenario(values.scenario ?? 'smoke');

  const duration = values.duration ? Number(values.duration) : scenario.durationSeconds;
  const connections = values.connections ? Number(values.connections) : scenario.connections;

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('--duration debe ser un número mayor a 0');
  }
  if (!Number.isInteger(connections) || connections <= 0) {
    throw new Error('--connections debe ser un entero mayor a 0');
  }

  const requests = buildRequests(adapter);
  const environment = captureEnvironment({ runner: process.env.CI ? 'github-actions' : 'local' });
  const startedAt = new Date().toISOString();

  console.log(`Benchmark: ${adapter.id} (${adapter.runtime} ${adapter.runtimeVersion} + ${adapter.framework})`);
  console.log(`Escenario: ${scenario.id} · ${duration}s · ${connections} conexiones · ${baseUrl}`);
  console.log(`Entorno: ${environment.cpuModel}, ${environment.cpuCores} núcleos, ${formatBytes(environment.totalMemoryBytes)}`);

  const raw = await autocannon({
    url: baseUrl.replace(/\/+$/, ''),
    connections,
    duration,
    requests,
    timeout: 10,
    bailout: 10,
    renderProgressBar: false,
    renderResultsTable: false,
    renderLatencyTable: false,
  });

  const metrics = summarizeAutocannon(raw);
  const result = buildResult({
    adapter,
    scenario,
    commit: await resolveCommit(),
    startedAt,
    durationSeconds: duration,
    environment,
    workload: { durationSeconds: duration, connections, requests },
    metrics,
  });

  const outputDir = values.out ?? LOCAL_RESULTS_DIR;
  const path = await writeResult(outputDir, result);

  console.log('');
  console.log(`RPS:      ${metrics.requestsPerSecond.toLocaleString('en-US')}`);
  console.log(`Latencia: p50 ${metrics.latencyMs.p50} ms · p90 ${metrics.latencyMs.p90} ms · p99 ${metrics.latencyMs.p99} ms`);
  console.log(`Fallos:   ${metrics.non2xx} no-2xx · ${metrics.errors} errores · ${metrics.timeouts} timeouts`);
  console.log(`Resultado: ${path}`);
}

async function buildLeaderboard() {
  const resultsDir = values.results ?? PUBLISHED_RESULTS_DIR;
  const outPath = values.out ?? LEADERBOARD_PATH;
  const { results, problems } = await readResults(resultsDir);

  for (const problem of problems) {
    console.error(`- ${problem}`);
  }

  const markdown = renderLeaderboard(results);
  await writeFile(outPath, markdown, 'utf8');
  console.log(`Leaderboard: ${outPath} (${results.length} resultado(s)).`);
}
