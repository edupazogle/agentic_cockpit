// k6 load test — Sprint 7: 200 VU sustained, 1 hour
// Validates AC-7-05: p95 < 5s under 200 concurrent users

import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "3m", target: 100 },
    { duration: "5m", target: 200 },
    { duration: "50m", target: 200 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.GATEWAY_URL || "http://localhost:8000";

const CLAIMS = Array.from({ length: 200 }, (_, i) => `CLM-2026-${String(i + 1000).padStart(4, "0")}`);

export default function () {
  const claimId = CLAIMS[Math.floor(Math.random() * CLAIMS.length)];

  // Create run
  http.post(`${BASE_URL}/runs`, JSON.stringify({
    claim_id: claimId, pilot_id: "motor-fleet",
  }), { headers: { "Content-Type": "application/json" } });

  // List pilots
  http.get(`${BASE_URL}/pilots`);

  // Health check
  http.get(`${BASE_URL}/health`);

  // HITL queue
  http.get(`${BASE_URL}/hitl`);

  // Audit verify
  http.get(`${BASE_URL}/audit/verify`);

  sleep(2);
}
