"use client";

import { useState } from "react";

const FSM_STEPS = [
  { key: "intake", label: "Intake", icon: "📥" },
  { key: "research", label: "Research", icon: "🔍" },
  { key: "plan", label: "Plan", icon: "📋" },
  { key: "approve", label: "Approve", icon: "✋" },
  { key: "build", label: "Build", icon: "🔧" },
  { key: "lint", label: "Lint", icon: "🛡" },
  { key: "preview", label: "Preview", icon: "👁" },
  { key: "deploy", label: "Deploy G0", icon: "🚀" },
];

const DOMAIN_TEMPLATES = [
  "Pet insurance — veterinary claims with breed risk assessment",
  "Travel insurance — multi-country with medical evacuation",
  "Home contents — high-value items with depreciation",
  "Marine cargo — vessel tracking with port risk scoring",
];

export default function BuilderPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<string>("intake");
  const [domain, setDomain] = useState("");
  const [lintResult, setLintResult] = useState<{ passed: boolean; report?: Record<string, unknown> } | null>(null);
  const [cost, setCost] = useState(0);
  const [stepResults, setStepResults] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
  const currentStepIdx = FSM_STEPS.findIndex((s) => s.key === currentState);

  async function startSession(domainBrief: string) {
    setBusy(true);
    const res = await fetch(`${base}/builder/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domainBrief }),
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setDomain(data.domain);
    setCurrentState(data.state);
    setBusy(false);
  }

  async function advance() {
    if (!sessionId) return;
    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= FSM_STEPS.length) return;

    const nextState = FSM_STEPS[nextIdx].key;
    setBusy(true);

    const res = await fetch(`${base}/builder/sessions/${sessionId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_state: nextState }),
    });
    const data = await res.json();
    setCurrentState(data.state);

    // Simulate step work
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    setStepResults((prev) => ({ ...prev, [nextState]: `Completed at ${new Date().toLocaleTimeString()}` }));
    if (data.session_id) {
      const info = await fetch(`${base}/builder/sessions/${sessionId}`);
      const details = await info.json();
      setCost(details.token_cost_eur || 0);
    }

    setBusy(false);
  }

  return (
    <main id="main-content" aria-label="Scenario builder">
      <div className="page-header">
        <h1>Scenario Builder</h1>
        <p className="lede">
          Describe a domain. The builder researches, plans, lints, and deploys a pilot — with human gates at every critical step.
        </p>
      </div>

      {!sessionId ? (
        <div className="ops-section">
          <h2>Start a new pilot</h2>
          <div className="demo-grid" role="list">
            {DOMAIN_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                type="button"
                className="demo-card"
                onClick={() => startSession(tpl)}
                disabled={busy}
                role="listitem"
              >
                <span className="demo-domain">Template</span>
                <h3>{tpl.split(" — ")[0]}</h3>
                <p>{tpl.split(" — ")[1]}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="kpi-strip" role="region" aria-label="Builder status">
            <div className="kpi"><span className="kpi-val">{domain.split(" — ")[0]}</span><span className="kpi-lbl">Domain</span></div>
            <div className="kpi"><span className="kpi-val">{currentState}</span><span className="kpi-lbl">Current step</span></div>
            <div className="kpi"><span className="kpi-val">€{cost.toFixed(2)}</span><span className="kpi-lbl">Token cost</span></div>
            <div className="kpi">
              <span className="kpi-val">4/5</span>
              <span className="kpi-lbl">Gate passed</span>
            </div>
          </div>

          <div className="ops-section">
            <h2>Pipeline</h2>
            <div className="demo-timeline" style={{ padding: 16 }}>
              {FSM_STEPS.map((step, idx) => {
                const done = idx < currentStepIdx;
                const active = idx === currentStepIdx;
                return (
                  <div key={step.key} className={`demo-timeline-node ${done ? "done" : ""} ${active ? "active" : ""}`}>
                    <span className="dtn-dot" aria-hidden="true" />
                    <span aria-hidden="true">{step.icon}</span>
                    <span>{step.label}</span>
                    {done && <span style={{ fontSize: "0.625rem", color: "rgba(34,197,94,0.6)", marginLeft: "auto" }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ops-section">
            {currentState === "lint" && (
              <div className="rollback-demo" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: "0.875rem" }}>
                  {lintResult?.passed === false ? "Lint found violations — fix before preview." : "Security lint running…"}
                </span>
                <button type="button" className="btn"
                  onClick={async () => {
                    const res = await fetch(`${base}/builder/sessions/${sessionId}/lint`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        capability_manifest: { version: "1", generated_by: "builder", tools_used: [], egress_endpoints: ["api.anthropic.com"], data_types_accessed: ["claim"], human_gates: ["approve"] },
                        egress_endpoints: ["api.anthropic.com"],
                        nodes: [{ id: "1", type: "llm_call", name: "triage" }],
                      }),
                    });
                    const d = await res.json();
                    setLintResult(d);
                  }}>
                  Run lint →
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {currentStepIdx < FSM_STEPS.length - 1 && (
                <button type="button" className="btn btn-primary" onClick={advance} disabled={busy}>
                  {busy ? "Working…" : `Advance to ${FSM_STEPS[currentStepIdx + 1]?.label || "next"} →`}
                </button>
              )}
              {currentState === "deploy" && (
                <button type="button" className="btn btn-primary" onClick={advance} disabled={busy}>
                  {busy ? "Deploying…" : "Deploy to G0 (requires approval) →"}
                </button>
              )}
              <button type="button" className="btn" onClick={() => { setSessionId(null); setCurrentState("intake"); }}>
                Reset
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
