"use client";

import Link from "next/link";

interface Pilot {
  id: string;
  slug: string;
  domain: string;
  level: string;
}

interface PilotCardProps {
  pilot: Pilot & { runs?: { status: string }[]; hitl_pending?: number };
}

const LEVEL_LABELS: Record<string, string> = {
  L0: "Draft",
  L1: "Solo test",
  L2: "Sandbox",
  L3: "Canary",
  L4: "Live",
};

const DOMAIN_ICONS: Record<string, string> = {
  "motor-fnol": "🚗",
  property: "🏠",
  underwriting: "📋",
  fraud: "🔍",
};

function liveRunCount(runs?: { status: string }[]): number {
  return runs?.filter((r) => r.status === "running").length ?? 0;
}

export function PilotCard({ pilot }: PilotCardProps) {
  const live = liveRunCount(pilot.runs);
  const domainIcon = DOMAIN_ICONS[pilot.domain] ?? "⚙️";

  return (
    <Link
      href={`/pilots/${pilot.slug}`}
      className={`pilot-card ${live > 0 ? "live" : ""}`}
      role="listitem"
      aria-label={`${pilot.slug} — ${LEVEL_LABELS[pilot.level] ?? pilot.level}`}
    >
      <div className="pc-head">
        <span className="pc-domain" aria-hidden="true">
          {domainIcon} {pilot.domain}
        </span>
        <span className={`pc-level pc-level--${pilot.level.toLowerCase()}`}>
          {LEVEL_LABELS[pilot.level] ?? pilot.level}
        </span>
      </div>

      <h3 className="pc-title">{pilot.slug.replace(/-/g, " ")}</h3>

      <div className="pc-stats">
        {live > 0 && (
          <span className="pc-stat live" aria-live="polite">
            <span className="live-dot" aria-hidden="true" /> {live} running
          </span>
        )}
        {(pilot.hitl_pending ?? 0) > 0 && (
          <span className="pc-stat hitl">
            <span aria-hidden="true">⚠</span> {pilot.hitl_pending} awaiting
          </span>
        )}
      </div>

      <span className="pc-cta" aria-hidden="true">
        Open →
      </span>
    </Link>
  );
}
