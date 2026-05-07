create table if not exists pilot_concern (
  id                      uuid primary key default gen_random_uuid(),
  pilot_id                uuid not null references pilot(id) on delete cascade,
  severity                text not null check (severity in ('info','warning','critical')),
  title                   text not null,
  body                    text,
  origin_movement         text,
  origin_message_id       uuid references chat_message(id),
  status                  text not null default 'open'
                          check (status in ('open','acked','resolved')),
  resolution_artifact_id  uuid references pilot_artifact(id),
  ts                      timestamptz not null default now(),
  acked_at                timestamptz,
  resolved_at             timestamptz,
  tenant_id               text not null references tenants(id)
);

create index if not exists pilot_concern_pilot_status_idx on pilot_concern(pilot_id, status, severity);

alter table pilot_concern enable row level security;

drop policy if exists pilot_concern_tenant_isolation on pilot_concern;
create policy pilot_concern_tenant_isolation on pilot_concern
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
