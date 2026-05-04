/**
 * In-memory synthetic claims database for demo/development.
 * Powers the /api/demo/* routes that n8n MCP workflows call.
 * Data is ephemeral (resets on server restart) — suitable for demos.
 */

export interface DemoClaim {
  claim_id: string
  scenario: string
  policy_number: string
  insured_name: string
  fnol: Record<string, unknown>
  status: string
  reserve_eur: number | null
  reserve_rationale: string | null
  activities: DemoActivity[]
  evidence: DemoEvidence[]
  approvals: DemoApproval[]
  escalations: DemoEscalation[]
  created_at: string
  updated_at: string
}

export interface DemoActivity {
  id: string
  activity_type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface DemoEvidence {
  id: string
  kind: string
  uri: string
  meta: Record<string, unknown>
  created_at: string
}

export interface DemoApproval {
  id: string
  gate: string
  payload: Record<string, unknown>
  decision: string | null
  rationale: string | null
  created_at: string
  decided_at: string | null
}

export interface DemoEscalation {
  id: string
  reason: string
  summary: string
  created_at: string
}

// Global singleton store — survives hot-reload via globalThis
const GLOBAL_KEY = '__demo_synthetic_db__'

function getStore(): Map<string, DemoClaim> {
  if (!(globalThis as Record<string, unknown>)[GLOBAL_KEY]) {
    ;(globalThis as Record<string, unknown>)[GLOBAL_KEY] = new Map<string, DemoClaim>()
  }
  return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as Map<string, DemoClaim>
}

function nowIso() {
  return new Date().toISOString()
}

function uuid() {
  return crypto.randomUUID()
}

// --- Claims ---

export function createClaim(params: {
  scenario?: string
  policy_number?: string
  insured_name?: string
  fnol?: Record<string, unknown>
  line?: string
  jurisdiction?: string
  insured?: string
}): DemoClaim {
  const store = getStore()
  const claimId = 'CLM-' + Date.now().toString(36).toUpperCase() + '-' + uuid().slice(0, 6).toUpperCase()
  const claim: DemoClaim = {
    claim_id: claimId,
    scenario: params.scenario || params.line || 'property',
    policy_number: params.policy_number || 'POL-DEMO-001',
    insured_name: params.insured_name || params.insured || 'Demo Insured GmbH',
    fnol: params.fnol || { line: params.line, jurisdiction: params.jurisdiction },
    status: 'FNOL_RECEIVED',
    reserve_eur: null,
    reserve_rationale: null,
    activities: [],
    evidence: [],
    approvals: [],
    escalations: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  store.set(claimId, claim)
  return claim
}

export function getClaim(claimId: string): DemoClaim | null {
  return getStore().get(claimId) ?? null
}

export function updateClaimStatus(claimId: string, status: string, reason: string): DemoClaim | null {
  const claim = getStore().get(claimId)
  if (!claim) return null
  claim.status = status
  claim.updated_at = nowIso()
  claim.activities.push({
    id: uuid(),
    activity_type: 'status_change',
    description: reason || `Status changed to ${status}`,
    metadata: { previous_status: claim.status, new_status: status },
    created_at: nowIso(),
  })
  return claim
}

export function appendActivity(
  claimId: string,
  params: { activity_type: string; description: string; metadata?: Record<string, unknown> },
): DemoActivity | null {
  const claim = getStore().get(claimId)
  if (!claim) return null
  const activity: DemoActivity = {
    id: uuid(),
    activity_type: params.activity_type,
    description: params.description,
    metadata: params.metadata || {},
    created_at: nowIso(),
  }
  claim.activities.push(activity)
  claim.updated_at = nowIso()
  return activity
}

export function setReserve(
  claimId: string,
  amount_eur: number,
  rationale: string,
): DemoClaim | null {
  const claim = getStore().get(claimId)
  if (!claim) return null
  claim.reserve_eur = amount_eur
  claim.reserve_rationale = rationale
  claim.updated_at = nowIso()
  return claim
}

export function addEvidence(
  claimId: string,
  params: { kind: string; uri: string; meta?: Record<string, unknown> },
): DemoEvidence | null {
  const claim = getStore().get(claimId)
  if (!claim) return null
  const evidence: DemoEvidence = {
    id: uuid(),
    kind: params.kind,
    uri: params.uri,
    meta: params.meta || {},
    created_at: nowIso(),
  }
  claim.evidence.push(evidence)
  claim.updated_at = nowIso()
  return evidence
}

export function createApproval(
  claimId: string,
  params: { gate: string; payload?: Record<string, unknown> },
): DemoApproval | null {
  const claim = getStore().get(claimId)
  if (!claim) return null
  const approval: DemoApproval = {
    id: uuid(),
    gate: params.gate,
    payload: params.payload || {},
    decision: null,
    rationale: null,
    created_at: nowIso(),
    decided_at: null,
  }
  claim.approvals.push(approval)
  claim.updated_at = nowIso()
  return approval
}

export function decideApproval(
  claimId: string,
  approvalId: string,
  decision: string,
  rationale?: string,
): DemoApproval | null {
  const claim = getStore().get(claimId)
  if (!claim) return null
  const approval = claim.approvals.find((a) => a.id === approvalId)
  if (!approval) return null
  approval.decision = decision
  approval.rationale = rationale || null
  approval.decided_at = nowIso()
  claim.updated_at = nowIso()
  return approval
}

export function createEscalation(
  claimId: string,
  params: { reason: string; summary: string },
): DemoEscalation | null {
  const claim = getStore().get(claimId)
  if (!claim) return null
  const escalation: DemoEscalation = {
    id: uuid(),
    reason: params.reason,
    summary: params.summary,
    created_at: nowIso(),
  }
  claim.escalations.push(escalation)
  claim.updated_at = nowIso()
  return escalation
}

// --- Static mock data for policies, weather, telematics, vendors, vehicles ---

export function getPolicy(policyId: string) {
  return {
    policy_number: policyId,
    product: 'Commercial Property All-Risk',
    insured: 'Demo Insured GmbH',
    inception_date: '2025-01-01',
    expiry_date: '2026-01-01',
    tsi_eur: 4_200_000,
    deductible_eur: 5_000,
    sublimits: { water_damage: 500_000, business_interruption: 300_000 },
    coverage_notes:
      'Full replacement cost basis. § 75 VVG proportional clause applies if underinsurance confirmed.',
    status: 'in-force',
  }
}

export function getPriorClaims(insuredName: string, lookbackDays: number) {
  return {
    insured: insuredName,
    lookback_days: lookbackDays,
    count: 1,
    prior_claims: [
      {
        claim_id: 'CLM-HIST-001',
        date: '2024-06-15',
        type: 'water-damage',
        settlement_eur: 28_500,
        status: 'closed',
      },
    ],
    loss_ratio_estimate: 0.68,
  }
}

export function getWeatherEvent(eventId: string) {
  return {
    event_id: eventId,
    type: 'storm',
    severity: 'moderate',
    date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    location: 'DE-NW',
    max_wind_kmh: 82,
    precipitation_mm: 34,
    source: 'DWD',
    relevant: true,
  }
}

export function getTelematics(eventId: string) {
  return {
    event_id: eventId,
    vehicle: 'fleet-unit-01',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    speed_kmh: 0,
    location: { lat: 51.5, lon: 7.4 },
    harsh_braking: false,
    impact_g: 0,
    idle_minutes: 720,
    notes: 'Vehicle stationary at depot at time of incident.',
  }
}

export function reverseGeocode(lat: number, lon: number) {
  return {
    lat,
    lon,
    address: 'Industriestr. 42, 44287 Dortmund, Germany',
    postcode: '44287',
    city: 'Dortmund',
    country: 'DE',
    flood_zone: 'none',
    planning_zone: 'industrial',
  }
}

export function searchVendors(params: {
  postal_code?: string
  capability?: string
  country?: string
  network?: string
}) {
  return {
    vendors: [
      {
        vendor_id: 'VND-001',
        name: 'Bauservice Müller GmbH',
        capability: params.capability || 'restoration',
        postal_code: params.postal_code || '44287',
        distance_km: 4.2,
        available_slots: ['2026-05-06T09:00', '2026-05-07T13:00'],
        nps: 87,
        on_time_pct: 94,
        on_panel: true,
      },
      {
        vendor_id: 'VND-002',
        name: 'Trocknungszentrum Nord',
        capability: params.capability || 'drying',
        postal_code: params.postal_code || '44287',
        distance_km: 7.8,
        available_slots: ['2026-05-05T14:00', '2026-05-06T10:00'],
        nps: 79,
        on_time_pct: 88,
        on_panel: true,
      },
    ],
  }
}

export function getVendorScorecard(vendorId: string) {
  return {
    vendor_id: vendorId,
    nps: 87,
    on_time_pct: 94,
    jobs_completed_ytd: 142,
    avg_cycle_days: 11,
    customer_satisfaction: 4.4,
    specialties: ['flood-restoration', 'drying', 'structural-repair'],
    complaints_ytd: 1,
  }
}

export function bookVendor(params: {
  partner?: string
  vendor_id?: string
  claim_id?: string
  slot?: string
  scenario?: string
}) {
  return {
    ok: true,
    booking_id: 'BKG-' + uuid().slice(0, 8).toUpperCase(),
    vendor_id: params.vendor_id || 'VND-001',
    claim_id: params.claim_id,
    slot: params.slot || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
    confirmation_code: 'CONF-' + Math.floor(Math.random() * 90000 + 10000),
    status: 'confirmed',
  }
}

export function getVehicle(vin: string) {
  return {
    vin,
    make: 'Mercedes-Benz',
    model: 'Actros',
    year: 2022,
    type: 'HGV',
    payload_tonnes: 18,
    registration: 'DO-MW-1234',
    owner: 'Blackwood Logistics GmbH',
    insured: true,
    odometer_km: 187_432,
    mot_expiry: '2027-03-01',
  }
}
