"use client";

interface KPIStripProps {
  pilotsCount: number;
  liveCount?: number;
  hitlPending?: number;
  evalPassRate?: number;
}

export function KPIStrip({
  pilotsCount,
  liveCount = 0,
  hitlPending = 0,
  evalPassRate,
}: KPIStripProps) {
  return (
    <div className="kpi-strip" role="region" aria-label="Key metrics">
      <div className="kpi">
        <span className="kpi-val">{pilotsCount}</span>
        <span className="kpi-lbl">Total pilots</span>
      </div>
      <div className={`kpi ${liveCount > 0 ? "accent" : ""}`}>
        <span className="kpi-val">{liveCount}</span>
        <span className="kpi-lbl">Live</span>
      </div>
      <div className={`kpi ${hitlPending > 0 ? "warn" : ""}`}>
        <span className="kpi-val">{hitlPending}</span>
        <span className="kpi-lbl">Awaiting HITL</span>
      </div>
      {evalPassRate !== undefined && (
        <div className="kpi">
          <span className="kpi-val">{evalPassRate.toFixed(1)}%</span>
          <span className="kpi-lbl">Eval pass · 7d</span>
        </div>
      )}
    </div>
  );
}
