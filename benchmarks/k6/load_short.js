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
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

export default function () {
  const userId = Math.floor(Math.random() * 1000) + 1;

  http.get(API_BASE + '/users');
  http.get(`${API_BASE}/users/${userId}`);
  
  if (Math.random() < 0.1) {
    const payload = JSON.stringify({
      name: `LoadTest-${__VU}-${Date.now()}`,
      email: `load-${__VU}-${Date.now()}@benchmark.com`,
    });
    http.post(API_BASE + '/users', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  sleep(0.1);
}