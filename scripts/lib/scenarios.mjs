/**
 * Workload definitions. v0.1 measures read-heavy traffic only: it is the most
 * comparable workload across frameworks and needs no seeded write state.
 * Write scenarios are tracked as a good first issue in CONTRIBUTING.md.
 */
export const SCENARIOS = {
  smoke: {
    id: 'smoke',
    description: 'Lectura: health, listado, detalle, ordenes y estadisticas',
    durationSeconds: 10,
    connections: 10,
  },
  load: {
    id: 'load',
    description: 'Lectura sostenida',
    durationSeconds: 60,
    connections: 50,
  },
};

/**
 * @param {string} id
 */
export function getScenario(id) {
  const scenario = SCENARIOS[id];
  if (!scenario) {
    const known = Object.keys(SCENARIOS).join(', ');
    throw new Error(`unknown scenario "${id}". Known scenarios: ${known}`);
  }
  return scenario;
}

/**
 * Builds the autocannon request sequence for one adapter.
 * @param {{healthPath: string, apiBasePath: string}} adapter
 */
export function buildRequests(adapter) {
  const base = adapter.apiBasePath.replace(/\/+$/, '');

  return [
    { method: 'GET', path: adapter.healthPath },
    { method: 'GET', path: `${base}/users?page=1&limit=10` },
    { method: 'GET', path: `${base}/users/1` },
    { method: 'GET', path: `${base}/users/1/orders` },
    { method: 'GET', path: `${base}/users/1/stats` },
  ];
}
