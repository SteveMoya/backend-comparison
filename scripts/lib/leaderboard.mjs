import { formatBytes } from './environment.mjs';
import { latestPerAdapter } from './result.mjs';

/**
 * Renders a deterministic Markdown leaderboard from result objects.
 * One section per scenario, one row per adapter, highest throughput first.
 * @param {Array<object>} results
 * @param {{generatedAt?: string}} options
 */
export function renderLeaderboard(results, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const scenarios = [...new Set(results.map((result) => result.scenario))].sort();
  const lines = [
    '# Runtime Bench — Leaderboard',
    '',
    'Generado automáticamente desde los resultados en `leaderboard/results/`. No editar a mano.',
    '',
    `Generado: ${generatedAt}`,
    '',
  ];

  if (scenarios.length === 0) {
    lines.push(
      'Todavía no hay resultados publicados.',
      '',
      'Corré un benchmark y agregá el JSON generado a `leaderboard/results/`:',
      '',
      '```bash',
      'node scripts/bench.mjs run --adapter bun --base-url http://localhost:3001 --scenario smoke',
      'cp results/*.json leaderboard/results/',
      'node scripts/bench.mjs leaderboard',
      '```',
      '',
      'Ver [docs/methodology.md](../docs/methodology.md) para el procedimiento completo.',
      '',
    );
    return lines.join('\n');
  }

  for (const scenario of scenarios) {
    const rows = latestPerAdapter(results, scenario).sort(
      (a, b) => b.metrics.requestsPerSecond - a.metrics.requestsPerSecond,
    );

    lines.push(`## Escenario: ${scenario}`, '');
    lines.push('| # | Adaptador | Runtime | Framework | RPS | p50 (ms) | p90 (ms) | p99 (ms) | No-2xx | Errores | Commit |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');

    rows.forEach((result, index) => {
      const metrics = result.metrics;
      lines.push(
        `| ${index + 1} | ${result.adapterName ?? result.adapter} | ${result.runtime} ${result.runtimeVersion} | ${result.framework} | ${metrics.requestsPerSecond.toLocaleString('en-US')} | ${metrics.latencyMs.p50} | ${metrics.latencyMs.p90} | ${metrics.latencyMs.p99} | ${metrics.non2xx} | ${metrics.errors + metrics.timeouts} | \`${(result.commit ?? 'unknown').slice(0, 7)}\` |`,
      );
    });

    const newest = rows.reduce(
      (winner, result) =>
        !winner || new Date(result.startedAt) > new Date(winner.startedAt) ? result : winner,
      undefined,
    );

    if (newest) {
      const env = newest.environment ?? {};
      lines.push(
        '',
        `Entorno del resultado más reciente: ${env.cpuModel ?? 'desconocido'} (${env.cpuCores ?? '?'} núcleos), ${formatBytes(env.totalMemoryBytes ?? 0)} de RAM, ${env.os ?? 'SO desconocido'}, Node ${env.node ?? '?'}.`,
        '',
      );
    }
  }

  lines.push(
    '## Cómo leer esto',
    '',
    '- Un número solo es comparable contra otro obtenido en el mismo entorno y con el mismo escenario.',
    '- La metodología y el contrato de adaptadores están en [docs/methodology.md](../docs/methodology.md) y [docs/adapter-contract.md](../docs/adapter-contract.md).',
    '- Los resultados son por commit: no se mezclan corridas de commits distintos en la misma fila.',
    '',
  );

  return lines.join('\n');
}
