# Sprint 16 — External Escalation Adapters + Blueprint Library

> **Supersedes:** New sprint from `docs/superpowers/specs/2026-05-05-cockpit-surfaces-ux-design.md`. Architecture authority: `docs/architecture.md` §23.

**Duration:** 14 days, post-S15
**Status:** planned (post-MVP)
**Depends on:** S15 (HITL Chat) — activates the external escalation adapter layer architected in S15

## Scope summary

Activate external escalation: Teams adaptive cards, Salesforce Case creation, ServiceNow incident opening — all via the adapter interface architected in S15. Ship the blueprint library browser for cross-country asset sharing. Complete the cockpit surfaces.

## Deliverables

### Frontend

| Component | Description |
|---|---|
| `BlueprintLibrary.tsx` | Modal browser: search, filter by type, preview, import |
| `BlueprintCard.tsx` | Asset card: name, sharing country, usage count, compatibility tags, Preview/Import |
| `ExternalToolConfig.tsx` | Admin panel: configure Teams/SF/ServiceNow credentials per country |
| `DeliveryStatusBadge.tsx` | Per-message delivery status: cockpit-only / sent-to-teams / delivered / failed |

### Backend

| Route | Description |
|---|---|
| `GET /api/:country/blueprints` | List available blueprints from other countries |
| `POST /api/:country/blueprints/:id/import` | Import blueprint → draft pilot or library asset |
| `PUT /api/:country/admin/external-tools` | Configure external escalation credentials |
| `GET /api/:country/admin/external-tools/status` | Health check for configured external tools |

### Adapters

| Adapter | Protocol | Auth |
|---|---|---|
| **Microsoft Teams** | Adaptive Card via webhook → Teams channel | Webhook URL (country config) |
| **Salesforce** | REST `POST /services/data/v60.0/sobjects/Case` | OAuth2 connected app |
| **ServiceNow** | REST `POST /api/now/table/incident` | Basic auth + instance URL |

### Database

| Migration | Purpose |
|---|---|
| `0022_notification_prefs.sql` | Per-user notification preferences (email, Teams, SF, ServiceNow) |

## Acceptance criteria

- AC-13 (verified): External escalation adapter activates without code changes when credentials are configured + feature flag flipped
- AC-18: Blueprint library allows browsing and importing shared assets; imported assets appear in receiving country
- Teams/SF/ServiceNow: decision packet pushed → external tool receives correctly formatted payload → reply webhook flows back to chat thread
- Delivery status visible per message: cockpit-only / external-sent / delivered / failed

## Linear issues (sibling)

| Issue | Title |
|---|---|
| LIN-24 | BlueprintLibrary + BlueprintCard + import flow |
| LIN-25 | ExternalToolConfig admin panel + DeliveryStatusBadge |
| LIN-26 | Gateway: blueprint routes + import logic |
| LIN-27 | Gateway: external escalation routes + admin config |
| LIN-28 | Teams adapter: Adaptive Card webhook |
| LIN-29 | Salesforce adapter: Case REST integration |
| LIN-30 | ServiceNow adapter: Incident REST integration |
| LIN-31 | Migration 0022: notification_prefs |
| LIN-32 | E2E: blueprint + external escalation AC tests |
