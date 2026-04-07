import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    stress_1000: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
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

  http.get(API_BASE + '/users');
  http.get(`${API_BASE}/users/${userId}`);
  
  if (Math.random() < 0.05) {
    const payload = JSON.stringify({
      name: `StressTest-${__VU}-${Date.now()}`,
      email: `stress-${__VU}-${Date.now()}@benchmark.com`,
    });
    http.post(API_BASE + '/users', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  sleep(0.05);
}