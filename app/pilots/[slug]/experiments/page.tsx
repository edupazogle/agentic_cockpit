"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

interface Variant {
  name: string;
  errorRate: number;
  p95Latency: number;
  evalScore: number;
  sampleSize: number;
  winner: boolean;
}

interface Experiment {
  id: string;
  name: string;
  status: "running" | "concluded";
  variants: Variant[];
  significance: number;
  recommendation: string;
}

const MOCK_EXPERIMENT: Experiment = {
  id: "exp-001",
  name: "Triage model: Opus vs Sonnet",
  status: "concluded",
  variants: [
    { name: "Claude Opus 4.7", errorRate: 1.8, p95Latency: 3.4, evalScore: 0.982, sampleSize: 245, winner: true },
    { name: "Claude Sonnet 4.6", errorRate: 3.9, p95Latency: 1.8, evalScore: 0.961, sampleSize: 245, winner: false },
    { name: "Mixtral 8×22B", errorRate: 6.3, p95Latency: 6.1, evalScore: 0.937, sampleSize: 245, winner: false },
  ],
  significance: 99.2,
  recommendation: "Opus wins on accuracy and regulatory compliance. Sonnet kept as latency fallback. Mixtral parked for fine-tuning evaluation.",
};

export default function ExperimentsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [experiment] = useState<Experiment>(MOCK_EXPERIMENT);
  const [rollbackActive, setRollbackActive] = useState(false);

  async function triggerRollback() {
    setRollbackActive(true);
    // Simulate: flag flips, then auto-recovers
    await new Promise((r) => setTimeout(r, 2000));
    setRollbackActive(false);
  }

  return (
    <main id="main-content" aria-label={`Experiments: ${slug}`}>
      <div className="page-header">
        <a href={`/pilots/${slug}`} className="back-link">← Back to pilot</a>
        <h1>Experiments</h1>
        <p className="lede">Compare variants, measure significance, and decide what ships.</p>
      </div>

      <section className="ops-section" aria-label="Variant comparison">
        <h2>{experiment.name}</h2>
        <span className={`status-chip status--${experiment.status}`}>
          {experiment.status}
        </span>

        <div className="hitl-queue-table" style={{ marginTop: 16 }} role="table">
          <div className="hqt-header" role="row">
            <span role="columnheader">Variant</span>
            <span role="columnheader">Error rate</span>
            <span role="columnheader">p95 Latency</span>
            <span role="columnheader">Eval score</span>
            <span role="columnheader">Samples</span>
            <span role="columnheader">Result</span>
          </div>
          {experiment.variants.map((v) => (
            <div key={v.name} className="hqt-row" role="row">
              <span className="hqt-cell" role="cell">
                {v.name} {v.winner && <span className="winner-badge">✓ Winner</span>}
              </span>
              <span className={`hqt-cell mono ${v.errorRate > 5 ? "err" : ""}`} role="cell">
                {v.errorRate}%
              </span>
              <span className="hqt-cell mono" role="cell">{v.p95Latency}s</span>
              <span className="hqt-cell mono" role="cell">{v.evalScore.toFixed(3)}</span>
              <span className="hqt-cell mono" role="cell">{v.sampleSize}</span>
              <span className="hqt-cell" role="cell">
                {v.winner ? "Selected" : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="ops-section" aria-label="Statistical significance">
        <h2>Statistical Significance</h2>
        <div className="kpi-strip">
          <div className="kpi accent">
            <span className="kpi-val">{experiment.significance}%</span>
            <span className="kpi-lbl">Confidence</span>
          </div>
          <div className="kpi">
            <span className="kpi-val">{experiment.variants.reduce((a, v) => a + v.sampleSize, 0)}</span>
            <span className="kpi-lbl">Total samples</span>
          </div>
        </div>
        <div className="recommendation-card">
          <strong>Recommendation:</strong> {experiment.recommendation}
        </div>
      </section>

      <section className="ops-section" aria-label="Auto-rollback demo">
        <h2>Canary Safeguard</h2>
        <p className="lede">
          If the canary variant exceeds error thresholds, the platform automatically reverts to the control.
        </p>

        <div className={`rollback-demo ${rollbackActive ? "active" : ""}`}>
          <div className="rollback-status">
            {rollbackActive ? (
              <>
                <span className="rollback-dot pulse" aria-hidden="true" />
                <span>Canary variant degraded — auto-rollback triggered</span>
              </>
            ) : (
              <>
                <span className="rollback-dot stable" aria-hidden="true" />
                <span>Canary stable — {experiment.variants[0].errorRate}% error rate within threshold</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn"
            onClick={triggerRollback}
            disabled={rollbackActive}
          >
            {rollbackActive ? "Rolling back…" : "Simulate degradation →"}
          </button>
        </div>
      </section>
    </main>
  );
}
