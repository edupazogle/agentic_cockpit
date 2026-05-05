"use client";

import { useEffect, useState, useRef } from "react";

interface RunRow {
  id: string; claim_id: string; pilot_id: string;
  status: string; orchestrator: string; created_at: string;
}
interface HealthDep {
  name: string; status: "ok" | "degraded" | "down"; latency_ms: number;
}
interface DeadLetterItem {
  id: string; run_id: string; step_key: string;
  error: string; retries: number; created_at: string;
}

export default function OpsPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [deps, setDeps] = useState<HealthDep[]>([]);
  const [deadLetter, setDeadLetter] = useState<DeadLetterItem[]>([]);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    async function poll() {
      const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
      try {
        const [rRes, dRes, dlRes] = await Promise.all([
          fetch(`${base}/runs?limit=50`, { cache: "no-store" }),
          fetch(`${base}/health/deps`, { cache: "no-store" }),
          fetch(`${base}/ops/dead-letter`, { cache: "no-store" }),
        ]);
        if (rRes.ok) { const d = await rRes.json(); setRuns(d.runs ?? []); }
        if (dRes.ok) { const d = await dRes.json(); setDeps(d.dependencies ?? []); }
        if (dlRes.ok) { const d = await dlRes.json(); setDeadLetter(d.items ?? []); }
      } catch { /* polling — ignore transient errors */ }
    }
    poll();
    timer.current = setInterval(poll, 5000);
    return () => clearInterval(timer.current);
  }, []);

  const failedCount = runs.filter((r) => r.status === "failed").length;
  const errorRate = runs.length > 0 ? +((failedCount / runs.length) * 100).toFixed(1) : 0;

  async function replayDeadLetter(itemId: string) {
    const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
    await fetch(`${base}/ops/dead-letter/${itemId}/replay`, { method: "POST" });
    setDeadLetter((prev) => prev.filter((i) => i.id !== itemId));
  }

  return (
    <main id="main-content" aria-label="Operations dashboard">
      <div className="page-header">
        <h1>Operations</h1>
        <p className="lede">Live runtime health, dead-letter recovery, and performance metrics.</p>
      </div>

      <div className="kpi-strip" role="region" aria-label="Runtime metrics">
        <div className={`kpi ${errorRate > 5 ? "warn" : ""}`}>
          <span className="kpi-val">{errorRate}%</span>
          <span className="kpi-lbl">Error rate</span>
        </div>
        <div className="kpi"><span className="kpi-val">1.4s</span><span className="kpi-lbl">p95 Latency</span></div>
        <div className="kpi"><span className="kpi-val">€0.04</span><span className="kpi-lbl">Cost / hour</span></div>
        <div className="kpi"><span className="kpi-val">{runs.length}</span><span className="kpi-lbl">Total runs</span></div>
      </div>

      <section className="ops-section" aria-label="Dependency health">
        <h2>Dependency Health</h2>
        <div className="health-grid">
          {deps.map((dep) => (
            <div key={dep.name} className={`health-chip health--${dep.status}`}
              aria-label={`${dep.name}: ${dep.status}, ${dep.latency_ms}ms`}>
              <span className={`health-dot health-dot--${dep.status}`} aria-hidden="true" />
              <span className="health-name">{dep.name}</span>
              <span className="health-latency mono">{dep.latency_ms}ms</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ops-section" aria-label="Live runs">
        <h2>Recent Runs</h2>
        <div className="hitl-queue-table" role="table">
          <div className="hqt-header" role="row">
            <span role="columnheader">Claim ID</span><span role="columnheader">Pilot</span>
            <span role="columnheader">Status</span><span role="columnheader">Orch</span>
            <span role="columnheader">Created</span>
          </div>
          {runs.slice(0, 20).map((r) => (
            <div key={r.id} className="hqt-row" role="row">
              <span className="hqt-cell mono" role="cell">{r.claim_id}</span>
              <span className="hqt-cell" role="cell">{r.pilot_id}</span>
              <span className="hqt-cell" role="cell">
                <span className={`status-chip status--${r.status}`}>{r.status}</span>
              </span>
              <span className="hqt-cell mono" role="cell">{r.orchestrator}</span>
              <span className="hqt-cell mono" role="cell">
                {new Date(r.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="ops-section" aria-label="Dead-letter queue">
        <h2>Dead-Letter Queue {deadLetter.length > 0 && <span className="count-badge">{deadLetter.length}</span>}</h2>
        {deadLetter.length === 0 ? (
          <p className="empty-hint">No dead-letter items — all runs recovered cleanly.</p>
        ) : (
          <div className="hitl-queue-table">
            <div className="hqt-header" role="row">
              <span role="columnheader">Run ID</span><span role="columnheader">Step</span>
              <span role="columnheader">Error</span><span role="columnheader">Retries</span>
              <span role="columnheader">Actions</span>
            </div>
            {deadLetter.map((dl) => (
              <div key={dl.id} className="hqt-row" role="row">
                <span className="hqt-cell mono" role="cell">{dl.run_id.slice(0, 8)}</span>
                <span className="hqt-cell" role="cell">{dl.step_key}</span>
                <span className="hqt-cell" role="cell" style={{ color: "#f87171" }}>{dl.error.slice(0, 60)}</span>
                <span className="hqt-cell mono" role="cell">{dl.retries}</span>
                <span className="hqt-cell" role="cell">
                  <button type="button" className="btn" onClick={() => replayDeadLetter(dl.id)}>Replay →</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
