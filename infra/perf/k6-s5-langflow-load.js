// k6 load test — Sprint 5: 50 VU against Langflow path
// Validates AC-5-05: stable latency under load

import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "30s", target: 30 },
    { duration: "60s", target: 50 },
    { duration: "60s", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],       // p95 < 5s
    http_req_failed: ["rate<0.05"],           // < 5% error rate
    "http_req_duration{route:create_run}": ["p(95)<3000"],
    "http_req_duration{route:list_pilots}": ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.GATEWAY_URL || "http://localhost:8000";

const CLAIMS = [
  "CLM-2026-0001", "CLM-2026-0002", "CLM-2026-0003",
  "CLM-2026-0004", "CLM-2026-0005", "CLM-2026-0006",
  "CLM-2026-0007", "CLM-2026-0008", "CLM-2026-0009",
  "CLM-2026-0010",
];

export default function () {
  const claimId = CLAIMS[Math.floor(Math.random() * CLAIMS.length)];

  // Create a run
  const createRes = http.post(
    `${BASE_URL}/runs`,
    JSON.stringify({ claim_id: claimId, pilot_id: "property-fast-track" }),
    { headers: { "Content-Type": "application/json" }, tags: { route: "create_run" } }
  );
  check(createRes, { "run created": (r) => r.status === 201 });

  // List pilots
  const listRes = http.get(`${BASE_URL}/pilots`, { tags: { route: "list_pilots" } });
  check(listRes, { "pilots listed": (r) => r.status === 200 });

  sleep(1);
}
