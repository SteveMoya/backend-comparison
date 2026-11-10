/**
 * Verifies the HTTP contract every adapter must honour.
 * Only the read endpoints are required for v0.1 scenarios; the write endpoints
 * are documented in docs/adapter-contract.md and will be exercised in v0.2.
 *
 * @param {string} baseUrl
 * @param {{healthPath: string, apiBasePath: string}} adapter
 * @param {{timeoutMs?: number}} options
 */
export async function checkContract(baseUrl, adapter, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5000;
  const root = baseUrl.replace(/\/+$/, '');
  const api = adapter.apiBasePath.replace(/\/+$/, '');
  const checks = [];

  const record = (name, ok, detail) => {
    checks.push({ name, ok, detail });
  };

  const request = async (path) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${root}${path}`, { signal: controller.signal });
      const text = await response.text();
      let body;
      try {
        body = text.length > 0 ? JSON.parse(text) : undefined;
      } catch {
        body = undefined;
      }
      return { response, body };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const health = await request(adapter.healthPath);
    record(`GET ${adapter.healthPath}`, health.response.status === 200, `status ${health.response.status}`);
  } catch (error) {
    record(`GET ${adapter.healthPath}`, false, error.message);
  }

  try {
    const list = await request(`${api}/users?page=1&limit=10`);
    const body = list.body;
    const ok =
      list.response.status === 200 &&
      Array.isArray(body?.data) &&
      typeof body?.total === 'number';
    record(
      `GET ${api}/users`,
      ok,
      ok ? 'status 200 with {data,total,page,limit}' : `status ${list.response.status}, body ${JSON.stringify(body)?.slice(0, 120)}`,
    );
  } catch (error) {
    record(`GET ${api}/users`, false, error.message);
  }

  for (const [name, path] of [
    ['usuario', `${api}/users/1`],
    ['ordenes del usuario', `${api}/users/1/orders`],
    ['estadisticas del usuario', `${api}/users/1/stats`],
  ]) {
    try {
      const result = await request(path);
      const ok = result.response.status === 200 || result.response.status === 404;
      record(`GET ${path} (${name})`, ok, `status ${result.response.status}`);
    } catch (error) {
      record(`GET ${path} (${name})`, false, error.message);
    }
  }

  return { ok: checks.every((check) => check.ok), checks };
}
