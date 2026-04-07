import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

export default function () {
  const userId = Math.floor(Math.random() * 1000) + 1;

  // GET /api/users - List
  const listRes = http.get(API_BASE + '/users');
  check(listRes, {
    'list users status is 200': (r) => r.status === 200,
  });

  // GET /api/users/:id - Read one
  const getRes = http.get(`${API_BASE}/users/${userId}`);
  check(getRes, {
    'get user status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  // POST /api/users - Create (5% of traffic)
  if (Math.random() < 0.05) {
    const payload = JSON.stringify({
      name: `StressTest-${__VU}-${Date.now()}`,
      email: `stress-${__VU}-${Date.now()}@benchmark.com`,
    });
    const createRes = http.post(API_BASE + '/users', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(createRes, {
      'create user status is 201': (r) => r.status === 201,
    });
  }

  sleep(0.05);
}