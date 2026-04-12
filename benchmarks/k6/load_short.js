import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    load: {
      executor: 'constant-vus',
      vus: 50,
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

// Load test: 50 VUs, 1min - Full CRUD operations

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
  http.get(`${BASE_URL}/health`);

  // POST /api/users - Create
  const createRes = http.post(API_BASE + '/users', payload, params);
  check(createRes, {
    'create user status is 201': (r) => r.status === 201,
  });

  const userId = createRes.json('id');
  if (!userId) return;

  // GET /api/users - List
  http.get(API_BASE + '/users');

  // GET /api/users/:id - Read
  http.get(`${API_BASE}/users/${userId}`);

  // PUT /api/users/:id - Update
  const updatePayload = JSON.stringify({ name: `Updated-User-${__VU}` });
  http.put(`${API_BASE}/users/${userId}`, updatePayload, params);

  // DELETE /api/users/:id - Delete
  http.delete(`${API_BASE}/users/${userId}`);

  sleep(0.5);
}