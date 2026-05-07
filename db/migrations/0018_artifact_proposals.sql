create table if not exists artifact_proposal (
  id                      uuid primary key default gen_random_uuid(),
  pilot_id                uuid not null references pilot(id) on delete cascade,
  artifact_id             uuid references pilot_artifact(id),
  artifact_kind           text not null,
  version_from            integer,
  proposed_content        jsonb not null,
  rationale               text,
  citations               jsonb,
  originating_message_id  uuid references chat_message(id),
  status                  text not null default 'pending'
                          check (status in ('pending','accepted','rejected','superseded')),
  decided_at              timestamptz,
  decided_by              uuid,
  tenant_id               text not null references tenants(id),
  created_at              timestamptz not null default now()
);

create index if not exists artifact_proposal_pilot_status_idx on artifact_proposal(pilot_id, status);

alter table artifact_proposal enable row level security;

drop policy if exists artifact_proposal_tenant_isolation on artifact_proposal;
create policy artifact_proposal_tenant_isolation on artifact_proposal
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
