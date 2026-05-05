import type { Metadata } from "next";
import { PilotCard } from "@/components/pilot/pilot-card";
import { KPIStrip } from "@/components/pilot/kpi-strip";
import { SkeletonPilotCard } from "@/components/pilot/skeleton";

export const metadata: Metadata = { title: "Pilots — GDAI Agentic Cockpit" };

interface Pilot {
  id: string;
  slug: string;
  domain: string;
  level: string;
  created_at: string;
  updated_at: string;
}

interface PilotRun {
  id: string;
  status: string;
  orchestrator: string;
  created_at: string;
}

interface PilotWithRuns extends Pilot {
  runs: PilotRun[];
  hitl_pending: number;
}

async function fetchPilots(): Promise<PilotWithRuns[]> {
  const base = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8000";
  const res = await fetch(`${base}/pilots`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.pilots ?? [];
}

export default async function PilotsPage() {
  const pilots = await fetchPilots();

  return (
    <main id="main-content" aria-label="Pilots">
      <div className="page-header">
        <h1>Pilots</h1>
        <p className="lede">
          Compose, run, and monitor your agentic insurance pilots.
        </p>
      </div>

      <KPIStrip pilotsCount={pilots.length} />

      {pilots.length === 0 ? (
        <div className="empty-state" role="status">
          <div className="empty-icon" aria-hidden="true">+</div>
          <h2>No pilots yet</h2>
          <p>Your companion can help you compose the first one.</p>
          <a href="/pilots/new" className="btn btn-primary">
            Compose a pilot →
          </a>
        </div>
      ) : (
        <div className="pilot-grid" role="list" aria-label="Pilot list">
          {pilots.map((pilot) => (
            <PilotCard key={pilot.id} pilot={pilot} />
          ))}
        </div>
      )}
    </main>
  );
}
