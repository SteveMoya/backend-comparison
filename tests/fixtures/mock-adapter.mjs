import http from 'node:http';

/**
 * Minimal HTTP server that implements the Runtime Bench adapter contract.
 * Used by the test suite to exercise the runner without Docker.
 * @param {{failListEndpoint?: boolean}} options
 */
export async function createMockAdapter(options = {}) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const json = (status, body) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };

    if (url.pathname === '/health') {
      return json(200, { status: 'ok' });
    }

    if (url.pathname === '/api/users' && request.method === 'GET') {
      if (options.failListEndpoint) {
        return json(500, { error: 'boom' });
      }
      return json(200, { data: [], total: 0, page: 1, limit: 10 });
    }

    if (url.pathname === '/api/users/1' && request.method === 'GET') {
      return json(200, { id: 1, name: 'Ada', email: 'ada@example.com' });
    }

    if (url.pathname === '/api/users/1/orders') {
      return json(200, []);
    }

    if (url.pathname === '/api/users/1/stats') {
      return json(200, { totalOrders: 0, totalAmount: 0, avgAmount: 0 });
    }

    return json(404, { error: 'not found' });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
