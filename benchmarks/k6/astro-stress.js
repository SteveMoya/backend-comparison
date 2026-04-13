import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    stress: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '3m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3004';
const API_BASE = `${BASE_URL}/api`;

export default function () {
  const payload = JSON.stringify({
    name: `User-${__VU}-${Date.now()}`,
    email: `test-${__VU}-${Date.now()}@benchmark.com`,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // Health check
  http.get(`${BASE_URL}/health`);

  // POST /api/users
  const createRes = http.post(API_BASE + '/users', payload, params);
  check(createRes, {
    'create status 201': (r) => r.status === 201,
  });

  const userId = createRes.json('id');
  if (!userId) return;

  // GET /api/users
  http.get(API_BASE + '/users');

  // GET /api/users/:id
  http.get(`${API_BASE}/users/${userId}`);

  // PUT /api/users/:id
  http.put(`${API_BASE}/users/${userId}`, JSON.stringify({ name: `Updated-${__VU}` }), params);

  // DELETE /api/users/:id
  http.delete(`${API_BASE}/users/${userId}`);

  sleep(0.1);
}