import { NextRequest, NextResponse } from 'next/server'
import { createClaim } from '@/lib/server/demo/synthetic-db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const claim = createClaim(body)
  return NextResponse.json({
    ok: true,
    claim_id: claim.claim_id,
    status: claim.status,
    scenario: claim.scenario,
    policy_number: claim.policy_number,
    insured_name: claim.insured_name,
    created_at: claim.created_at,
  })
}
