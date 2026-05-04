# Sprint 7 — Motor-Fleet + Audit Hardening

**Duration:** Weeks 13-14
**Persona promise:** The platform proves it can support a second distinct pilot and produce an audit bundle that a risk/compliance reviewer can inspect.
**Depends on:** Sprint 6 (executive demo green; experiments + rollback proven).

---

## Why This Sprint Exists

Sprint 7 is the **second pilot proof** and the **risk/compliance proof**. A platform that only runs one pilot is a flow, not a platform — motor-fleet is deliberately picked because its data shape (telematics + body-shop directory + vehicle records) differs from property-fast-track. If it lands cleanly with reused gateway / Langflow / n8n patterns, the platform is generalisable.

The audit bundle is the artifact a risk/compliance reviewer must accept. Without it, G1 promotion stalls. The bundle ships every signed receipt the platform can produce: trace summary, prompt versions, model versions, policy refs, HITL decisions, eval scores, redaction report, and audit-chain verification report — wrapped in a signed ZIP with an external hash anchor.

---

## Scope Summary

### In Scope

**Motor-fleet pilot:**
- `flows/motor-fleet.json` — Langflow flow authored from the same template patterns as property-fast-track.
- Synthetic data fully generated in `lib/server/demo/synthetic-db.ts` (extended) + `gateway/synthdata/motor_fleet.py`:
  - **~50 telematics packets** (speed, GPS, harsh-braking events).
  - **~30 vehicle records** (fully synthetic plates `MOTOR-FLEET-NN`).
  - **~25 body-shop directory entries** (`Synthetic Garage NN`).
  - **20 golden eval cases** (mirrors property-fast-track structure, motor-specific rubrics).
- Motor-fleet pilot card on `/pilots`.
- Motor-fleet demo seed (canonical snapshot at end of sprint).
- Reuses gateway / Langflow / n8n patterns. **No new abstractions.**
- Different enough from property-fast-track to prove reuse (no shared business logic).

**Audit:**
- Audit bundle generator: `gateway/src/gateway/audit_bundle/generator.py`.
- Bundle manifest (`manifest.json` inside ZIP):
  - Trace summary (steps, costs, latencies; redacted).
  - Prompt versions (each prompt SHA + Langfuse Prompt ID).
  - Model versions (provider, model, version, finetune).
  - Policy refs (which prompt/flow asserted which AXA policy section).
  - HITL decisions (`audit_log` excerpt for that run).
  - Eval scores (Langfuse Score IDs + values).
  - Redaction report (counts of redacted entities; never the raw values).
  - Audit-chain verification report (`verify_audit_chain` output).
- **Signed ZIP**: bundle hash signed with project keypair stored in Railway Secret Manager.
- **External hash anchor**: signed manifest hash written to `audit_external_anchor` table on a separate schema with limited RBAC; future option to mirror to a separate database or write-once bucket.
- Download audit trail: every bundle download writes `audit_log.AUDIT_BUNDLE_DOWNLOAD` with operator + bundle hash.
- `/audit` browser route — searchable list of bundles by claim ID, pilot, date, and HITL decision content.

**Hardening:**
- Full restore drill (executed, not planned). Report committed.
- Full-scale k6:
  - **200 concurrent users**.
  - **5K traces/day equivalent throughput**.
  - **1 hour sustained**.
  - Report committed; remediation plan if missed.
- Pentest / DAST triage: SAST + DAST findings logged in `docs/security/findings-register.md` with severity and owner.
- Data-retention/archival job — applied per draft policy from S5; archival writes to bucket, audit log preserved.
- Real Docling integration with stub fallback — primary path real, error path stub.
- G1 readiness review — full checklist; real-data promotion remains optional and gated.

### Out of Scope

- Production rollout (governance, not engineering).
- Third pilot (post-G1).
- Builder unless S8 pre-gate passes (S8).

---

## Implementation Diagram

```mermaid
flowchart TB
    subgraph "Pilots"
      PFT[property-fast-track<br/>S3-S6]
      MF[motor-fleet<br/>NEW]
    end

    subgraph "Reuse layers (no new abstractions)"
      GW[agent-gateway]
      LFR[langflow-runtime]
      N8N[n8n MCP tools]
      EVR[eval_runner]
    end

    subgraph "Synthetic data factory"
      SD[gateway/synthdata/motor_fleet.py]
      Tele[50 telematics packets]
      Veh[30 vehicles]
      BS[25 body shops]
      GS[20 golden cases]
      SD --> Tele
      SD --> Veh
      SD --> BS
      SD --> GS
    end

    PFT --> GW
    MF --> GW
    GW --> LFR
    LFR --> N8N
    EVR --> GW
    SD --> MF

    subgraph "Audit bundle"
      BG[audit_bundle/generator.py]
      Z[signed ZIP]
      AN[audit_external_anchor]
      AB[/audit browser]
      BG --> Z
      BG --> AN
      AB --> BG
    end

    GW --> BG

    subgraph "Hardening"
      K6[k6 200 VU 1h]
      RD[restore drill executed]
      PT[pentest findings register]
      DR[data retention applied]
    end

    classDef new stroke:#e63946,stroke-width:2px
    class MF,SD,BG,Z,AN,AB,K6,RD,PT,DR new
```

---

## Technical Implementation

### Audit-bundle generator

```python
async def generate_bundle(run_id: UUID, op: Operator) -> Bundle:
    run = await runs.get(run_id, tenant=op.tenant)
    trace = await langfuse.fetch_trace(run.langfuse_trace_id)
    audit_rows = await audit.fetch_for_run(run_id)
    chain_report = await audit.verify_chain(op.tenant)
    eval_scores = await langfuse.fetch_scores(run.langfuse_trace_id)

    manifest = {
        "schema_version": "1.0",
        "run": run.summary_for_audit(),  # redacted
        "trace_summary": summarise_trace(trace),
        "prompts": [p.versioned_ref() for p in trace.prompts],
        "models": [m.dict() for m in trace.models],
        "policy_refs": extract_policy_refs(trace),
        "hitl_decisions": [a.dict() for a in audit_rows if a.kind.startswith("DECISION_")],
        "eval_scores": eval_scores,
        "redaction_report": build_redaction_report(trace),
        "audit_chain": chain_report,
    }
    manifest_bytes = canonical_json(manifest).encode()
    manifest_hash = sha256(manifest_bytes).hexdigest()
    signature = sign_with_project_key(manifest_hash)

    zip_bytes = build_zip({"manifest.json": manifest_bytes,
                           "signature.bin": signature})
    bundle_hash = sha256(zip_bytes).hexdigest()
    await audit_external_anchor.insert(run_id, bundle_hash, signature)
    await audit.append(kind="AUDIT_BUNDLE_GENERATED", actor=op.id,
                       payload={"bundle_hash": bundle_hash})
    return Bundle(zip_bytes=zip_bytes, hash=bundle_hash)
```

### `audit_external_anchor`

Lives in a separate Postgres schema (`anchor.audit_external_anchor`) with a service-role grant only for the gateway. Append-only via a function; direct DML denied. Each row: `(bundle_hash, run_id, signature, anchored_at)`. The gateway exposes `GET /audit/anchors/{bundle_hash}` for verifiers.

### Synthetic motor-fleet data

`gateway/synthdata/motor_fleet.py` uses Faker + Pydantic to generate vehicles (`MOTOR-FLEET-{01..30}`), body shops (`Synthetic Garage {01..25}`), and telematics packets. Output is JSONL written to `gateway/eval/datasets/motor-fleet-v1.jsonl`. Banner on every motor-fleet UI says **Synthetic data — no real vehicle, plate or driver**.

### Real Docling with stub fallback

Gateway calls `wf006` (Docling) MCP tool with 30 s budget. On timeout, switches to stub extractor and writes `audit_log.DOCLING_STUB_FALLBACK`. Eval CI runs both paths and asserts no regression.

---

## Testing Plan

**Unit:**
- Manifest schema validation (Pydantic).
- Signature verifies with public key.
- Audit-chain report shape stable.

**Integration:**
- End-to-end motor-fleet run with real Docling, then with Docling forced offline (stub fallback).
- Bundle generation for property-fast-track and motor-fleet — both verify externally.
- Tampered bundle (flip one byte in `manifest.json`) → verification fails.

**Performance (k6):**
- 200 VU, 1 h sustained, mixed pilot traffic. Targets:
  - p95 < 8 s for property-fast-track.
  - p95 < 6 s for motor-fleet.
  - error rate < 1%.

**Failure tests:**
- Audit-bundle generation interrupted mid-write → resumable on retry, no orphan files.
- Real Docling times out → stub fallback, audit row, eval still runs.
- Motor-fleet eval regression on golden set → blocked from canary.
- Retention job archives only eligible rows; audit_log preserved unchanged.
- Bundle download without role → 403 + audit row.

---

## Acceptance Criteria

| # | Criterion | Evidence |
|---|---|---|
| AC-01 | Motor-fleet completes end-to-end | Trace + run row |
| AC-02 | Motor-fleet has its own golden dataset and eval baseline | Eval CI green |
| AC-03 | Audit bundle exports and verifies | CLI verify command |
| AC-04 | Audit hash anchor exists in separate schema | psql query |
| AC-05 | `/audit` browser finds an HITL decision and opens its bundle | E2E |
| AC-06 | Full restore drill passes | drill report |
| AC-07 | 200 VU, 1 h load test meets target or remediation plan | `infra/perf/k6-s7-loadtest.json` |
| AC-08 | Pentest findings triaged by severity | findings register |
| AC-09 | Real Docling primary, stub fallback | dual run |

---

## Sprint Review / Decision Gate

### Demo Script (15 min)

1. **(persona: pilot owner)** Run property-fast-track and motor-fleet side by side from `/pilots`. Two distinct domains, same UX.
2. Open both pilot pages and compare reuse — same MetroCanvas, same HITL pattern, different evidence panels (telematics vs photos).
3. **(persona: risk/compliance reviewer)** Open `/audit`. Search for a specific HITL decision from a motor-fleet run. Open its bundle.
4. Download the bundle. From a terminal: `python tools/verify_bundle.py bundle.zip --pubkey project.pub` → "OK: signature valid, chain valid, hash anchor matches."
5. Tamper with one byte (`hexedit`), re-verify → "FAIL: signature invalid."
6. Show restore-drill report (DB restored to T-1h on staging in <30 min).
7. Show k6 200-VU 1 h report — p95 below targets, error rate <1%.
8. Show pentest findings register — severity by status (ack/in-progress/closed).
9. **Decision ask:** Is motor-fleet sufficiently distinct? Audit bundle contents acceptable to compliance? PDF summary required, or signed JSON/ZIP enough? Latency budget when real Docling replaces stub?

### Definition of Done

- All AC-01..AC-09 demonstrated.
- Both pilots have green Eval CI.
- All hardening reports committed.
- G1 readiness review checklist completed (separate doc, signed by ops + product).
- `docs/refactor_main_v3.md` §12 updated.

### Readiness for Sprint 8 (Builder + Synthdata Factory)

- ✅ Synthetic-data factory pattern proven (motor-fleet generation).
- ✅ Audit bundle gives compliance the artifact it needs to allow Builder-generated pilots at G0.
- ✅ Two pilots in motion → reuse patterns are concrete enough for Builder to template.

---

## Critical User Questions / Experiments

- Is motor-fleet sufficiently different to prove platform generality?
- What does compliance actually need inside the audit bundle?
- Is a PDF summary required, or is signed JSON/ZIP enough?
- What latency is acceptable when real Docling replaces stub extraction?

---

## What's Deferred

| Item | Sprint |
|---|---|
| Builder + synthdata factory at scale | S8 (gated by pre-S8 experiment) |
| Third pilot | post-G1 |
| Production rollout | governance |
| Real-data demo | post-G1 |

---

## References

- `docs/refactor_main_v3.md` §6 (Sprint 7), §11 (Railway template).
- `.agents/skills/langfuse/SKILL.md`.
- `.agents/skills/n8n/n8n-mcp-tools-expert/SKILL.md`.
- `docs/architecture.md` §13 (durability), §15 (audit chain).
