"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { MetroCanvas } from "@/components/pilot/metro-canvas";
import { HitlInlineCard } from "@/components/hitl/hitl-inline-card";

interface NodeState {
  step_key: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
  icon: string;
}

const PFT_FLOW: NodeState[] = [
  { step_key: "voice_agent", label: "Voice agent answers", status: "pending", icon: "voice" },
  { step_key: "intent_classify", label: "AI intent classify", status: "pending", icon: "intent" },
  { step_key: "policy_lookup", label: "Policy lookup", status: "pending", icon: "policy" },
  { step_key: "fraud_score", label: "AI fraud-score", status: "pending", icon: "fraud" },
  { step_key: "gate_a", label: "Gate A — fraud > 0.65", status: "pending", icon: "gate" },
  { step_key: "severity", label: "Severity assessment", status: "pending", icon: "severity" },
  { step_key: "twilio_sms", label: "SMS with map", status: "pending", icon: "sms" },
  { step_key: "tow_dispatch", label: "Tow dispatch", status: "pending", icon: "tow" },
  { step_key: "gate_b", label: "Gate B — severity high", status: "pending", icon: "gate" },
  { step_key: "draft_letter", label: "Auto-draft letter", status: "pending", icon: "letter" },
  { step_key: "gate_c", label: "Gate C — claim > €4 000", status: "pending", icon: "gate" },
  { step_key: "dossier", label: "Dossier compilation", status: "pending", icon: "dossier" },
  { step_key: "gate_d", label: "Gate D — adjuster review", status: "pending", icon: "gate" },
  { step_key: "settlement", label: "Settlement update", status: "pending", icon: "settlement" },
];

export default function PilotDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [currentStep, setCurrentStep] = useState<string | undefined>();
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hitlItem, setHitlItem] = useState<{
    id: string;
    step_key: string;
    evidence: Record<string, unknown>;
    options: string[];
    sla_deadline: string;
  } | null>(null);

  const runClaim = useCallback(async () => {
    setRunning(true);
    setCompleted(false);
    setNodes([]);
    setHitlItem(null);

    const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";

    // Simulate step-by-step execution (SSE in production)
    for (let i = 0; i < PFT_FLOW.length; i++) {
      const step = PFT_FLOW[i];
      const updatedNodes = PFT_FLOW.slice(0, i + 1).map((n, j) =>
        j < i
          ? { ...n, status: "done" as const }
          : { ...n, status: "running" as const }
      );
      setNodes(updatedNodes);
      setCurrentStep(step.step_key);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

      // Simulate HITL pause at gate nodes
      if (step.icon === "gate" && i > 0) {
        setHitlItem({
          id: `hitl-${Date.now()}`,
          step_key: step.step_key,
          evidence: {
            score: "0.78",
            threshold: "0.65",
            reason: "Borderline fraud score",
            claim_id: "CLM-2026-0042",
            amount: "€4,800",
          },
          options: ["Approve", "Reject", "Escalate"],
          sla_deadline: new Date(Date.now() + 300000).toISOString(),
        });
        return; // pause until operator decides
      }
    }

    setNodes(PFT_FLOW.map((n) => ({ ...n, status: "done" as const })));
    setRunning(false);
    setCompleted(true);
  }, []);

  const handleHitlDecision = useCallback(
    async (decision: string, rationale: string) => {
      if (!hitlItem) return;
      const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
      await fetch(`${base}/hitl/${hitlItem.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rationale }),
      });
      setHitlItem(null);

      // Resume from where we paused
      const pausedIdx = PFT_FLOW.findIndex((n) => n.step_key === hitlItem.step_key);
      for (let i = pausedIdx + 1; i < PFT_FLOW.length; i++) {
        const step = PFT_FLOW[i];
        const updatedNodes = PFT_FLOW.slice(0, i + 1).map((n, j) =>
          j < i
            ? { ...n, status: "done" as const }
            : { ...n, status: "running" as const }
        );
        setNodes(updatedNodes);
        setCurrentStep(step.step_key);
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      }

      setNodes(PFT_FLOW.map((n) => ({ ...n, status: "done" as const })));
      setRunning(false);
      setCompleted(true);
    },
    [hitlItem]
  );

  return (
    <main id="main-content" aria-label={`Pilot: ${slug}`}>
      <div className="page-header">
        <a href="/pilots" className="back-link">← Back to pilots</a>
        <h1>{slug?.replace(/-/g, " ")}</h1>
        <p className="lede">
          14 nodes · 4 HITL gates · Property fast-track flow
        </p>
      </div>

      <div className="pilot-layout">
        <MetroCanvas
          nodes={nodes}
          currentStep={currentStep}
          running={running}
          completed={completed}
          onRunNow={runClaim}
        />

        {hitlItem && (
          <HitlInlineCard item={hitlItem} onDecide={handleHitlDecision} />
        )}
      </div>
    </main>
  );
}
