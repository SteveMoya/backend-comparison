import os from 'node:os';

/**
 * Captures the machine facts a benchmark number is only meaningful against.
 * @param {Record<string, unknown>} extra
 */
export function captureEnvironment(extra = {}) {
  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model ? cpus[0].model.trim().replace(/\s+/g, ' ') : 'unknown';

  return {
    os: `${os.type()} ${os.release()}`,
    platform: os.platform(),
    arch: os.arch(),
    cpuModel,
    cpuCores: cpus.length,
    totalMemoryBytes: os.totalmem(),
    node: process.version,
    ...extra,
  };
}

/**
 * @param {number} bytes
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
