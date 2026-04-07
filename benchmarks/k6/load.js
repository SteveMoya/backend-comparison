import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

export default function () {
  const userId = Math.floor(Math.random() * 1000) + 1;

  // GET /api/users - List (most common)
  const listRes = http.get(API_BASE + '/users');
  check(listRes, {
    'list users status is 200': (r) => r.status === 200,
  });

  // GET /api/users/:id - Read one
  const getRes = http.get(`${API_BASE}/users/${userId}`);
  check(getRes, {
    'get user status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  // POST /api/users - Create (10% of traffic)
  if (Math.random() < 0.1) {
    const payload = JSON.stringify({
      name: `LoadTest-${__VU}-${Date.now()}`,
      email: `load-${__VU}-${Date.now()}@benchmark.com`,
    });
    const createRes = http.post(API_BASE + '/users', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(createRes, {
      'create user status is 201': (r) => r.status === 201,
    });
  }

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'results/load.json': JSON.stringify(data),
  };
}

function textSummary(data, opts) {
  const indent = opts.indent || '';
  const output = `${indent}=== Load Test Results ===\n`;
  return output;
}