import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const RESULT_SCHEMA = 'runtime-bench.result.v1';

/** Bump when the workload, driver or measurement window changes. */
export const METHODOLOGY_VERSION = 'v0.1';

/**
 * @param {object} input
 * @param {{id: string, name: string, runtime: string, framework: string, language: string, runtimeVersion: string}} input.adapter
 * @param {{id: string}} input.scenario
 * @param {string} input.commit
 * @param {string} input.startedAt ISO timestamp
 * @param {number} input.durationSeconds
 * @param {object} input.environment
 * @param {{durationSeconds: number, connections: number, requests: Array<{method: string, path: string}>}} input.workload
 * @param {object} input.metrics
 */
export function buildResult({ adapter, scenario, commit, startedAt, durationSeconds, environment, workload, metrics }) {
  return {
    schema: RESULT_SCHEMA,
    methodologyVersion: METHODOLOGY_VERSION,
    adapter: adapter.id,
    adapterName: adapter.name,
    runtime: adapter.runtime,
    framework: adapter.framework,
    language: adapter.language,
    runtimeVersion: adapter.runtimeVersion,
    scenario: scenario.id,
    commit,
    startedAt,
    durationSeconds,
    environment,
    workload,
    metrics,
  };
}

/**
 * Maps an autocannon result to the fields Runtime Bench publishes.
 * Percentiles are the ones autocannon exposes natively: p50, p90 and p99.
 * @param {any} raw
 */
export function summarizeAutocannon(raw) {
  const latency = raw?.latency ?? {};
  const requests = raw?.requests ?? {};
  const throughput = raw?.throughput ?? {};

  return {
    requestsPerSecond: round(requests.average ?? 0),
    requestsTotal: requests.total ?? 0,
    latencyMs: {
      average: round(latency.average ?? 0, 2),
      p50: latency.p50 ?? 0,
      p90: latency.p90 ?? 0,
      p99: latency.p99 ?? 0,
      max: latency.max ?? 0,
    },
    throughputBytesPerSecond: round(throughput.average ?? 0),
    non2xx: raw?.non2xx ?? 0,
    errors: raw?.errors ?? 0,
    timeouts: raw?.timeouts ?? 0,
  };
}

/**
 * @param {number} value
 * @param {number} digits
 */
function round(value, digits = 0) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * @param {string} startedAt
 */
export function compactTimestamp(startedAt) {
  return new Date(startedAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/**
 * @param {ReturnType<typeof buildResult>} result
 */
export function resultFilename(result) {
  const commit = (result.commit || 'unknown').slice(0, 7);
  return `${result.adapter}-${result.scenario}-${commit}-${compactTimestamp(result.startedAt)}.json`;
}

/**
 * @param {string} resultsDir
 * @param {ReturnType<typeof buildResult>} result
 */
export async function writeResult(resultsDir, result) {
  await mkdir(resultsDir, { recursive: true });
  const path = join(resultsDir, resultFilename(result));
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return path;
}

/**
 * Reads every result file in a directory and reports unreadable files.
 * @param {string} resultsDir
 */
export async function readResults(resultsDir) {
  let entries;
  try {
    entries = await readdir(resultsDir);
  } catch {
    return { results: [], problems: [`cannot read results directory "${resultsDir}"`] };
  }

  const results = [];
  const problems = [];

  for (const entry of entries.filter((name) => name.endsWith('.json')).sort()) {
    const path = join(resultsDir, entry);
    try {
      const parsed = JSON.parse(await readFile(path, 'utf8'));
      if (parsed?.schema !== RESULT_SCHEMA) {
        problems.push(`${entry}: unsupported schema "${parsed?.schema ?? 'missing'}"`);
        continue;
      }
      results.push(parsed);
    } catch (error) {
      problems.push(`${entry}: invalid JSON (${error.message})`);
    }
  }

  return { results, problems };
}

/**
 * Keeps the most recent result per adapter for one scenario.
 * @param {Array<{adapter: string, scenario: string, startedAt: string}>} results
 * @param {string} scenarioId
 */
export function latestPerAdapter(results, scenarioId) {
  const latest = new Map();

  for (const result of results) {
    if (result.scenario !== scenarioId) {
      continue;
    }
    const previous = latest.get(result.adapter);
    if (!previous || new Date(result.startedAt) > new Date(previous.startedAt)) {
      latest.set(result.adapter, result);
    }
  }

  return [...latest.values()];
}
