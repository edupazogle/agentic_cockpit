"use client";

import { useEffect, useState } from "react";

interface HitlItem {
  id: string;
  run_id: string;
  step_key: string;
  evidence: Record<string, unknown>;
  options: string[];
  sla_deadline: string;
  status: string;
  decision?: string;
  rationale?: string;
  created_at: string;
}

async function fetchHitlQueue(): Promise<HitlItem[]> {
  const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
  const res = await fetch(`${base}/hitl?status=pending`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

async function submitDecision(
  itemId: string,
  decision: string,
  rationale: string
): Promise<void> {
  const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
  await fetch(`${base}/hitl/${itemId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, rationale }),
  });
}

export default function HitlPage() {
  const [items, setItems] = useState<HitlItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHitlQueue().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main id="main-content" aria-label="HITL queue">
        <h1>HITL Queue</h1>
        <p className="empty-state" role="status">Loading…</p>
      </main>
    );
  }

  return (
    <main id="main-content" aria-label="HITL queue">
      <div className="page-header">
        <h1>HITL Queue</h1>
        <p className="lede">
          Cases requiring human review before the AI can proceed.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state" role="status">
          <div className="empty-icon" aria-hidden="true">✓</div>
          <h2>No items awaiting review</h2>
          <p>All HITL cases have been resolved.</p>
        </div>
      ) : (
        <div className="hitl-queue-table" role="table" aria-label="HITL items">
          <div className="hqt-header" role="row">
            <span role="columnheader">Step</span>
            <span role="columnheader">Run</span>
            <span role="columnheader">Evidence</span>
            <span role="columnheader">SLA</span>
            <span role="columnheader">Actions</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="hqt-row" role="row">
              <span className="hqt-cell" role="cell">
                {item.step_key}
              </span>
              <span className="hqt-cell mono" role="cell">
                {item.run_id.slice(0, 8)}
              </span>
              <span className="hqt-cell" role="cell">
                {Object.entries(item.evidence).slice(0, 2).map(([k, v]) => (
                  <span key={k} className="evidence-chip">{k}: {String(v).slice(0, 30)}</span>
                ))}
              </span>
              <span className="hqt-cell mono" role="cell">
                {Math.max(0, Math.floor(
                  (new Date(item.sla_deadline).getTime() - Date.now()) / 60000
                ))}m
              </span>
              <span className="hqt-cell" role="cell">
                <a href={`/hitl/${item.id}`} className="btn">
                  Review →
                </a>
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
