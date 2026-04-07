import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '10s', target: 10 },   // baseline
        { duration: '10s', target: 500 },  // spike up
        { duration: '20s', target: 500 }, // hold
        { duration: '10s', target: 10 },  // spike down
        { duration: '10s', target: 0 },    // finish
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.10'],
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

  sleep(0.1);
}