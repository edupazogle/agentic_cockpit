"use client";

import { useState } from "react";

export default function AuditPage() {
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  async function runVerification() {
    const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${base}/audit/verify`);
      const data = await res.json();
      setVerifyResult(data.valid === true);
    } catch {
      setVerifyResult(false);
    }
  }

  return (
    <main id="main-content" aria-label="Audit trail">
      <div className="page-header">
        <h1>Audit Trail</h1>
        <p className="lede">
          Compliance-grade audit bundles with cryptographic chain verification.
        </p>
      </div>

      <section className="ops-section" aria-label="Chain verification">
        <h2>Audit Chain Verification</h2>
        <div className="rollback-demo">
          <div className="rollback-status">
            <span
              className={`rollback-dot ${verifyResult === true ? "stable" : verifyResult === false ? "pulse" : ""}`}
              style={verifyResult === null ? { background: "rgba(255,255,255,0.2)" } : {}}
              aria-hidden="true"
            />
            <span>
              {verifyResult === null && "Verification not yet run"}
              {verifyResult === true && "Audit chain valid — all signatures match"}
              {verifyResult === false && "Audit chain verification failed — see details"}
            </span>
          </div>
          <button type="button" className="btn btn-primary" onClick={runVerification}>
            Verify audit chain →
          </button>
        </div>
      </section>

      <section className="ops-section" aria-label="Required artifacts">
        <h2>Bundle Contents</h2>
        <p className="empty-hint">
          Each audit bundle contains 7 signed artifacts: trace summary, prompt versions,
          model versions, policy references, HITL decisions, eval scores, and redaction report.
        </p>
        <div className="health-grid" style={{ marginTop: 12 }}>
          {[
            "trace_summary.json",
            "prompt_versions.json",
            "model_versions.json",
            "policy_refs.json",
            "hitl_decisions.json",
            "eval_scores.json",
            "redaction_report.json",
          ].map((name) => (
            <span key={name} className="health-chip health--ok mono" style={{ fontSize: "0.75rem" }}>
              <span className="health-dot health-dot--ok" aria-hidden="true" />
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="ops-section" aria-label="G1 readiness">
        <h2>G1 Readiness Checklist</h2>
        <div className="hitl-queue-table">
          <div className="hqt-header" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">Requirement</span>
            <span role="columnheader">Status</span>
          </div>
          {[
            { id: "G1-1", name: "Audit bundle generator produces signed ZIP", done: true },
            { id: "G1-2", name: "verify_audit_chain() passes on all bundles", done: true },
            { id: "G1-3", name: "External hash anchor stored in audit_external_anchor", done: true },
            { id: "G1-4", name: "Full restore drill executed within RTO", done: true },
            { id: "G1-5", name: "k6 200-VU sustained test passes", done: true },
            { id: "G1-6", name: "Pentest/DAST triage — findings registered", done: true },
            { id: "G1-7", name: "Data retention archival job active", done: true },
            { id: "G1-8", name: "Real Docling integration verified", done: true },
            { id: "G1-9", name: "PII redaction confirmed on all egress paths", done: true },
            { id: "G1-10", name: "Two pilots running on same platform patterns", done: true },
          ].map((item) => (
            <div key={item.id} className="hqt-row" role="row">
              <span className="hqt-cell mono" role="cell">{item.id}</span>
              <span className="hqt-cell" role="cell">{item.name}</span>
              <span className="hqt-cell" role="cell">
                <span className="status-chip status--completed">done</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
