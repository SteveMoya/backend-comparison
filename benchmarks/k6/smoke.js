import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Smoke test: 10 VUs, 1min - Full CRUD operations

export default function () {
  const payload = JSON.stringify({
    name: `User-${__VU}-${Date.now()}`,
    email: `test-${__VU}-${Date.now()}@benchmark.com`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // POST /api/users - Create
  const createRes = http.post(API_BASE + '/users', payload, params);
  check(createRes, {
    'create user status is 201': (r) => r.status === 201,
    'create user has id': (r) => r.json('id') !== undefined,
  });

  const userId = createRes.json('id');
  if (!userId) {
    return;
  }

  // GET /api/users - List
  const listRes = http.get(API_BASE + '/users');
  check(listRes, {
    'list users status is 200': (r) => r.status === 200,
    'list users returns array': (r) => Array.isArray(r.json()),
  });

  // GET /api/users/:id - Read one
  const getRes = http.get(`${API_BASE}/users/${userId}`);
  check(getRes, {
    'get user status is 200': (r) => r.status === 200,
    'get user has correct id': (r) => r.json('id') === userId,
  });

  // PUT /api/users/:id - Update
  const updatePayload = JSON.stringify({
    name: `Updated-User-${__VU}`,
  });
  const updateRes = http.put(`${API_BASE}/users/${userId}`, updatePayload, params);
  check(updateRes, {
    'update user status is 200': (r) => r.status === 200,
  });

  // DELETE /api/users/:id - Delete
  const deleteRes = http.delete(`${API_BASE}/users/${userId}`);
  check(deleteRes, {
    'delete user status is 204': (r) => r.status === 204,
  });

  sleep(1);
}