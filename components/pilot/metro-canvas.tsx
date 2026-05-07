"use client";

import { useEffect, useState, useCallback } from "react";

interface NodeState {
  step_key: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
  icon: string;
  evidence?: string;
}

interface MetroCanvasProps {
  nodes: NodeState[];
  currentStep?: string;
  completed?: boolean;
  onRunNow?: () => void;
  running: boolean;
}

const NODE_ICONS: Record<string, string> = {
  voice: "🎙️",
  intent: "🧠",
  policy: "📋",
  fraud: "🔍",
  gate: "⚠️",
  severity: "📊",
  sms: "💬",
  tow: "🚛",
  letter: "📝",
  dossier: "📁",
  settlement: "✅",
};

export function MetroCanvas({
  nodes,
  currentStep,
  completed,
  onRunNow,
  running,
}: MetroCanvasProps) {
  if (nodes.length === 0 && !running) {
    return (
      <div className="metro-canvas empty" role="region" aria-label="Run canvas">
        <p>No active run. Click Run Now to start a claim.</p>
        {onRunNow && (
          <button type="button" className="btn btn-primary" onClick={onRunNow}>
            Run Now
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="metro-canvas"
      role="region"
      aria-label="Live run execution"
      aria-live="polite"
    >
      <div className="metro-flow">
        {nodes.map((node) => {
          const isActive = node.step_key === currentStep;
          const isDone = node.status === "done";
          const isFailed = node.status === "failed";
          const icon = NODE_ICONS[node.icon] ?? "●";

          return (
            <div
              key={node.step_key}
              className={`metro-node ${isActive ? "active" : ""} ${isDone ? "done" : ""} ${isFailed ? "failed" : ""}`}
              aria-current={isActive ? "step" : undefined}
              aria-label={`${node.label} — ${node.status}`}
            >
              <span className="mn-icon" aria-hidden="true">
                {icon}
              </span>
              <span className="mn-label">{node.label}</span>
              {isActive && <span className="mn-pulse" aria-hidden="true" />}
              {isDone && <span className="mn-check" aria-hidden="true">✓</span>}
              {isFailed && <span className="mn-fail" aria-hidden="true">✗</span>}
            </div>
          );
        })}
      </div>

      {completed && (
        <div className="metro-completed" role="status">
          Run completed.{" "}
          <button type="button" className="btn" onClick={onRunNow}>
            Run another →
          </button>
        </div>
      )}

      {running && !completed && (
        <div className="metro-running" role="status">
          Running step: {nodes.find((n) => n.step_key === currentStep)?.label ?? "…"}
        </div>
      )}
    </div>
  );
}
