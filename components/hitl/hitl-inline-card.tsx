"use client";

import { useState } from "react";

interface HitlInlineCardProps {
  item: {
    id: string;
    step_key: string;
    evidence: Record<string, unknown>;
    options: string[];
    sla_deadline: string;
  };
  onDecide: (decision: string, rationale: string) => Promise<void>;
}

export function HitlInlineCard({ item, onDecide }: HitlInlineCardProps) {
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    await onDecide(decision, rationale);
    setSubmitting(false);
  };

  return (
    <div className="hitl-inline-card" role="alert" aria-live="assertive">
      <div className="hitl-header">
        <span className="hitl-gate-icon" aria-hidden="true">⚠</span>
        <h3>Human review required — {item.step_key}</h3>
        <SlaTimer deadline={item.sla_deadline} />
      </div>

      <div className="hitl-evidence">
        <h4>Evidence</h4>
        <dl>
          {Object.entries(item.evidence).map(([key, value]) => (
            <div key={key} className="evidence-row">
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="hitl-options" role="group" aria-label="Decision options">
        {item.options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`btn hitl-option ${decision === opt ? "selected" : ""}`}
            onClick={() => setDecision(opt)}
            aria-pressed={decision === opt}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="hitl-rationale">
        <label htmlFor={`rationale-${item.id}`}>Rationale (required for audit)</label>
        <textarea
          id={`rationale-${item.id}`}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          placeholder="Why this decision?"
        />
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!decision || submitting}
      >
        {submitting ? "Submitting…" : "Submit decision"}
      </button>
    </div>
  );
}

function SlaTimer({ deadline }: { deadline: string }) {
  const diff = Math.max(0, (new Date(deadline).getTime() - Date.now()) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = Math.floor(diff % 60);
  const urgent = mins < 1;

  return (
    <span
      className={`sla-timer ${urgent ? "urgent" : ""}`}
      aria-label={`${mins} minutes ${secs} seconds remaining`}
      role="timer"
    >
      {mins}:{String(secs).padStart(2, "0")}
    </span>
  );
}
