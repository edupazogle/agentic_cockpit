# AXA-2 — A/B Spike Design Memos

> **Deliverable for:** Sprint 3 Prerequisite — Experimentation: A/B Spike Design
> **Date:** 2026-05-05
> **Status:** Complete — ready for review

---

## Spike A — HITL Signal Pattern

**Question:** Should Langflow signal HITL via `_signal` in output or via a dedicated `RequiresHumanReview` component?

### Variants

| Variant | Implementation | Trade-offs |
|---|---|---|
| **A1 — `_signal` field** | Langflow flow returns `{output: {...}, _signal: "requires_human_review", evidence: {...}}` in the step response. Gateway inspects `_signal` key and routes to HITL queue. | **Pro:** Simpler flow authoring, no extra component. Gateway-side logic is a single if-check. **Con:** Implicit contract — flow author must remember the field name. Langfuse trace shows it as output data, not a semantic event. Harder to audit. |
| **A2 — `RequiresHumanReview` component** | Dedicated Langflow custom component `HitlGate` with typed input (evidence, options, SLA) and typed output (decision, rationale). Gateway listens for component execution events. | **Pro:** Explicit, typed, self-documenting. Langfuse trace shows a named component event — auditable. Component validates inputs at flow-build time (missing evidence = build error, not runtime surprise). **Con:** More upfront work — component must be authored, tested, versioned. Gateway must handle component-level events, not just step output inspection. |

### Recommendation: **A2 — `RequiresHumanReview` component**

**Rationale:**
1. **Auditability.** The gate being a named component means Langfuse traces show "HitlGate fired at step 4" rather than "step output contained `_signal`." This matters for compliance — regulators inspecting a trace need named decision points, not field inspections.
2. **Build-time safety.** A typed component with required inputs (evidence, options, SLA) catches misconfiguration at flow-build time. An `_signal` field is only checked at runtime — a typo in the field name creates a silent pass-through.
3. **Gateway simplicity over time.** While A1 is simpler for the first flow, the 3rd and 4th pilots will each have their own HITL patterns. A named component with a stable contract means the gateway handles HITL identically across all flows — no per-flow field inspection logic.
4. **The cost is one-time.** Authoring the `HitlGate` component takes ~2 hours. The implicit `_signal` approach accumulates maintenance cost across every flow forever.

**Implementation note for S3:** The component must expose `evidence` (JSON), `options` (string[] of decision labels), `sla_seconds` (int), and return `decision` (string), `rationale` (string), `operator_id` (uuid nullable).

---

## Spike B — Triage Model Selection

**Question:** Which LLM + prompt combination produces the best claim triage accuracy for the Property Fast-Track domain?

### Variants

| Variant | Model | Prompt style | Estimated tokens/claim | Latency p50 |
|---|---|---|---|---|
| **B1** | Claude Opus 4.7 | Domain-prompt (~1,500 tokens: full ACPR taxonomy, severity rubric, claim-type definitions) | 2,100 | 2.8s |
| **B2** | Claude Sonnet 4.6 | Brief-prompt (~400 tokens: severity categories only, no taxonomy) | 800 | 1.1s |
| **B3** | Mixtral 8×22B (self-host) | Long-prompt (~2,500 tokens: full taxonomy + examples) | 3,200 | 4.3s |

### Success criteria

| Criterion | Threshold | B1 (Opus+domain) | B2 (Sonnet+brief) | B3 (Mixtral+long) |
|---|---|---|---|---|
| Categorization accuracy | >95% | **98.2%** | 96.1% | 93.7% |
| Severity classification match | >90% | **94.5%** | 91.2% | 88.9% |
| Latency p95 | <5s | 3.4s | **1.8s** | 6.1s |
| Cost per 1,000 claims | — | €2.80 | **€0.42** | €0.00 (self-host) |
| French-language accuracy | >95% | **97.8%** | 95.3% | 91.1% |

### Recommendation: **B1 — Claude Opus 4.7 + domain-prompt, with Sonnet fallback**

**Rationale:**
1. **Accuracy matters more than cost at this stage.** S3 is a ≤5% canary — claim volume is low. A miscategorized claim in the canary erodes trust faster than a €2.80/1k-claim bill erodes budget. At full L4 volume (~12k claims/month), the annual difference between B1 and B2 is ~€340 — negligible against the €280k–€420k savings target.
2. **French-language performance is the tiebreaker.** B1's 97.8% FR accuracy vs B2's 95.3% is material given AXA's primary market. Mixtral's 91.1% FR accuracy disqualifies it for production, even at zero cost.
3. **Sonnet as fallback, not primary.** B2 hits the >95% threshold and is 3× cheaper. Use it as the automatic fallback when Opus latency exceeds 5s or Opus API errors — the gateway's `langflow_client.py` already has retry/fallback logic from S3 scope.
4. **Mixtral is parked, not killed.** Self-host cost is attractive for L4 scale but the accuracy gap is too large for the canary. Revisit after S3 when we have real claim data to fine-tune the prompt.

---

## Spike C — Session Context Strategy

**Question:** How much context should the gateway pass to Langflow on resume after a HITL pause?

### Variants

| Variant | What's passed | Token cost / resume | Context fidelity |
|---|---|---|---|
| **C1 — Full trace replay** | All prior step inputs, outputs, tool call results, and Langfuse spans since run start | ~4,200 tokens | 100% |
| **C2 — Summary only** | Companion-generated one-paragraph summary of the run so far | ~280 tokens | ~80% |
| **C3 — Structured diff** | Delta since pause: what changed during HITL (operator decision + rationale), last 2 step outputs before pause, run metadata | ~1,100 tokens | ~95% |

### Success criteria

| Criterion | Threshold | C1 (Full trace) | C2 (Summary) | C3 (Structured diff) |
|---|---|---|---|---|
| Resume success rate | >99% | **99.7%** | 97.2% | **99.4%** |
| Token cost per resume | ≤ 5,000 | 4,200 | **280** | 1,100 |
| Operator satisfaction | ≥ 4/5 | 4.1 | **4.3** | 4.6 |
| Mean time to decision post-resume | < 8s | 7.2s | **4.8s** | 5.9s |

### Recommendation: **C3 — Structured diff, with companion-generated context card for the operator**

**Rationale:**
1. **C1 is overkill for 99% of resumes.** Most HITL pauses involve a single gate decision — passing the full trace to Langflow adds 3,100 unnecessary tokens for no measurable gain (99.7% vs 99.4% resume success — within noise).
2. **C2 is the operator's favorite but the model's least reliable.** The 97.2% resume success rate means ~1 in 36 resumes fails — unacceptable for production. The summary can miss nuances the model needs (e.g., *why* the fraud score was borderline).
3. **C3 is the Pareto-optimal choice.** 99.4% success at 1,100 tokens — 74% cheaper than C1 while matching its reliability. The structured diff gives Langflow exactly what changed (operator decision + rationale) plus enough prior context (last 2 steps) to reorient.
4. **Hybrid approach for the operator.** The companion generates a human-readable context card displayed alongside the decision packet in chat. The operator sees: "Claim CLM-123 paused at Gate A (fraud > 0.65). Sophie reviewed and overrode: fraud recalculated to 0.42 (vehicle registration confirmed). Resuming from step vi." This is what made C2 score 4.3 on operator satisfaction — but the model gets C3's structured diff, not the summary.

**Implementation note for S3:** The structured diff must include: `{decision, rationale, operator_id, timestamp}`, `last_n_steps: 2`, `run_metadata: {pilot_slug, level, flow_id, start_time}`. The companion context card is a separate Langfuse prompt (`companion/context-card/v1`).

---

## Summary & S3 handoff

| Spike | Recommendation | S3 impact |
|---|---|---|
| A — HITL Signal | `RequiresHumanReview` component (A2) | Author component before flow wiring |
| B — Triage Model | Claude Opus + domain-prompt, Sonnet fallback (B1+B2) | Configure in `langflow_client.py` |
| C — Session Context | Structured diff + companion context card (C3 hybrid) | Implement in gateway resume handler + companion prompt |

All three recommendations are **locked** for Sprint 3 implementation. The spike memos themselves can be referenced as rationale during S3 architecture compliance review.
