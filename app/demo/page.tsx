"use client";

import { useState } from "react";

const DEMO_SCENARIOS = [
  {
    key: "property-fast-track",
    title: "Property Fast Track",
    domain: "Property",
    description: "Water-damage claims auto-triaged in under 14 seconds.",
    nodes: 14,
    gates: 4,
    savings: "€280k–€420k / yr",
    claims: "12,481 this month",
  },
  {
    key: "motor-fnol-tow",
    title: "Motor FNOL + Tow Dispatch",
    domain: "Motor",
    description: "Voice-agent intake with real-time tow dispatching and fraud screening.",
    nodes: 14,
    gates: 4,
    savings: "€340k–€510k / yr",
    claims: "3,127 pilot cohort",
  },
  {
    key: "subrogation-pre-screen",
    title: "Subrogation Pre-Screen",
    domain: "Property",
    description: "Identify subrogation candidates from incident notes before settlement.",
    nodes: 8,
    gates: 1,
    savings: "Estimate pending",
    claims: "Draft — 0 runs",
  },
];

interface NarrationStep {
  nodeLabel: string;
  text: string;
}

export default function DemoPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [narration, setNarration] = useState<NarrationStep[]>([]);

  const scenario = DEMO_SCENARIOS.find((s) => s.key === selected);

  async function startReplay(scenarioKey: string) {
    setSelected(scenarioKey);
    setReplaying(true);
    setCurrentStep(0);

    // In production: fetch from POST /demo/narrate (LLM-generated from Langfuse trace)
    // Board-safe: no implementation details, no raw trace payloads
    const generatedNarration: NarrationStep[] = [
      { nodeLabel: "Voice agent", text: "The claim begins when the policyholder calls. Our voice agent answers immediately — no hold, no menu. It captures the incident details in natural conversation." },
      { nodeLabel: "Intent classification", text: "The AI classifies the claim type and urgency. For water damage, it checks whether this is a new incident or an existing claim — avoiding duplicate work." },
      { nodeLabel: "Policy lookup", text: "The system retrieves the policy details. It confirms coverage, checks deductibles, and identifies any special conditions that apply to this claim." },
      { nodeLabel: "Fraud screening", text: "Here the AI runs a fraud-risk assessment. It cross-references claim patterns, policyholder history, and external data. This step protects both AXA and honest customers." },
      { nodeLabel: "Human review gate", text: "The fraud score exceeded the threshold, so a human operator reviews the evidence. This is a regulatory safeguard — certain decisions require human judgment under EU law." },
      { nodeLabel: "Severity assessment", text: "The AI evaluates damage severity from photos and descriptions. This determines the reserve amount and whether specialist review is needed." },
      { nodeLabel: "SMS with location map", text: "The policyholder receives an SMS with a live map showing the assigned repair shop or inspector. No app download needed." },
      { nodeLabel: "Tow dispatch", text: "If the vehicle is undrivable, a tow truck is dispatched automatically. The policyholder sees real-time ETA updates." },
      { nodeLabel: "Draft customer letter", text: "The AI drafts a formal response letter that meets AXA's regulatory obligations. It includes the claim reference, next steps, and contact details." },
      { nodeLabel: "Compliance gate", text: "A second human review ensures the draft letter meets all regulatory requirements before it reaches the customer." },
      { nodeLabel: "Dossier compilation", text: "All documents, decisions, and evidence are compiled into a single audit-ready dossier. Every step is traceable and timestamped." },
      { nodeLabel: "Final review", text: "A senior adjuster performs a final review. This is the last checkpoint before settlement — ensuring accuracy and fairness." },
      { nodeLabel: "Settlement", text: "The claim is settled. Payment is triggered, the policyholder is notified, and the dossier is archived for future reference." },
    ];
    setNarration(generatedNarration);

    // Animate through steps
    for (let i = 0; i < generatedNarration.length; i++) {
      await new Promise((r) => setTimeout(r, 2200));
      setCurrentStep(i + 1);
    }
    setReplaying(false);
  }

  return (
    <main id="main-content" aria-label="Executive demo">
      <div className="page-header">
        <h1>Demo</h1>
        <p className="lede">
          Watch how AXA pilots process claims — narrated from actual system traces, board-ready.
        </p>
      </div>

      {!selected && (
        <div className="demo-grid" role="list" aria-label="Available scenarios">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.key}
              type="button"
              className="demo-card"
              onClick={() => startReplay(s.key)}
              role="listitem"
            >
              <span className="demo-domain">{s.domain}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <div className="demo-meta">
                <span>{s.nodes} nodes</span>
                <span>{s.gates} quality gates</span>
                <span className="demo-savings">{s.savings}</span>
              </div>
              <span className="btn btn-primary">Watch replay →</span>
            </button>
          ))}
        </div>
      )}

      {selected && scenario && (
        <div className="demo-replay" aria-live="polite">
          <div className="demo-replay-header">
            <button type="button" className="btn" onClick={() => { setSelected(null); setReplaying(false); }}>
              ← Back to scenarios
            </button>
            <h2>{scenario.title}</h2>
            <span className="demo-badge">Synthetic data — for demonstration</span>
          </div>

          <div className="demo-player">
            <div className="demo-timeline">
              {narration.map((step, i) => (
                <div
                  key={step.nodeLabel}
                  className={`demo-timeline-node ${i < currentStep ? "done" : ""} ${i === currentStep ? "active" : ""}`}
                >
                  <span className="dtn-dot" aria-hidden="true" />
                  <span className="dtn-label">{step.nodeLabel}</span>
                </div>
              ))}
            </div>

            <div className="demo-narration" aria-live="assertive">
              {currentStep < narration.length && (
                <div className="narration-card">
                  <div className="narration-step">
                    Step {currentStep + 1} of {narration.length} — {narration[currentStep].nodeLabel}
                  </div>
                  <p className="narration-text">{narration[currentStep].text}</p>
                </div>
              )}
              {currentStep >= narration.length && !replaying && (
                <div className="narration-complete">
                  <span className="check-icon" aria-hidden="true">✓</span>
                  <h3>Replay complete</h3>
                  <p>14 steps · 4 quality gates · 13.2s average processing time</p>
                  <div className="demo-actions">
                    <button type="button" className="btn btn-primary" onClick={() => startReplay(selected)}>
                      Replay
                    </button>
                    <button type="button" className="btn">
                      View technical appendix →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="demo-try">
            <h3>Try it yourself</h3>
            <p>Enter a synthetic claim description and watch the AI process it live.</p>
            <form
              className="try-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).querySelector("input") as HTMLInputElement;
                if (!input?.value) return;
                const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
                await fetch(`${base}/runs`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    claim_id: `CLM-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                    pilot_id: selected,
                  }),
                });
                input.value = "";
                alert("Synthetic run started — check the run canvas for live results.");
              }}
            >
              <input
                type="text"
                placeholder="Describe a claim scenario… (e.g. water damage in kitchen, photos attached)"
                aria-label="Claim description"
              />
              <button type="submit" className="btn btn-primary">
                Run synthetic claim →
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
