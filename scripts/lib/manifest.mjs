import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const REQUIRED_FIELDS = [
  'id',
  'name',
  'language',
  'runtime',
  'framework',
  'runtimeVersion',
  'source',
  'service',
  'port',
  'healthPath',
  'apiBasePath',
];

const STRING_FIELDS = REQUIRED_FIELDS.filter(
  (field) => field !== 'port',
);
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validates a parsed adapter manifest.
 * @param {unknown} value
 * @returns {string[]} list of human readable problems; empty when valid
 */
export function validateManifest(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return ['manifest must be a JSON object'];
  }

  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    const current = value[field];
    if (current === undefined || current === null || current === '') {
      errors.push(`missing required field "${field}"`);
    }
  }

  for (const field of STRING_FIELDS) {
    const current = value[field];
    if (current !== undefined && current !== null && typeof current !== 'string') {
      errors.push(`"${field}" must be a string`);
    }
  }

  if (typeof value.id === 'string' && value.id.length > 0 && !ID_PATTERN.test(value.id)) {
    errors.push('"id" must be lowercase kebab-case, for example "go-gin"');
  }

  if (!Number.isInteger(value.port) || value.port < 1 || value.port > 65535) {
    errors.push('"port" must be an integer between 1 and 65535');
  }

  if (typeof value.healthPath === 'string' && !value.healthPath.startsWith('/')) {
    errors.push('"healthPath" must start with "/"');
  }

  if (typeof value.apiBasePath === 'string' && !value.apiBasePath.startsWith('/')) {
    errors.push('"apiBasePath" must start with "/"');
  }

  return errors;
}

/**
 * Loads every adapter directory that contains an adapter.json file.
 * Directories starting with "_" are templates and are skipped.
 * @param {string} adaptersDir
 */
export async function loadAdapters(adaptersDir) {
  const entries = await readdir(adaptersDir, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();

  const adapters = [];
  const problems = [];

  for (const directory of directories) {
    const manifestPath = join(adaptersDir, directory, 'adapter.json');
    let raw;

    try {
      raw = await readFile(manifestPath, 'utf8');
    } catch {
      problems.push(`${directory}: missing adapter.json`);
      continue;
    }

    let manifest;
    try {
      manifest = JSON.parse(raw);
    } catch (error) {
      problems.push(`${directory}: invalid JSON (${error.message})`);
      continue;
    }

    const errors = validateManifest(manifest);
    if (errors.length > 0) {
      for (const error of errors) {
        problems.push(`${directory}: ${error}`);
      }
      continue;
    }

    if (manifest.id !== directory) {
      problems.push(`${directory}: "id" must match the directory name (found "${manifest.id}")`);
      continue;
    }

    adapters.push({ ...manifest, dir: directory });
  }

  const byId = new Map();
  for (const adapter of adapters) {
    const existing = byId.get(adapter.id);
    if (existing) {
      problems.push(`duplicate adapter id "${adapter.id}" in "${existing.dir}" and "${adapter.dir}"`);
      continue;
    }
    byId.set(adapter.id, adapter);
  }

  return { adapters, problems };
}

/**
 * @param {Array<{id: string}>} adapters
 * @param {string} id
 */
export function findAdapter(adapters, id) {
  return adapters.find((adapter) => adapter.id === id);
}
