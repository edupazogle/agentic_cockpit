create table if not exists pilot_level_history (
  id            uuid primary key default gen_random_uuid(),
  pilot_id      uuid not null references pilot(id) on delete cascade,
  level         text not null check (level in ('L0','L1','L2','L3','L4')),
  entered_at    timestamptz not null default now(),
  exited_at     timestamptz,
  signed_by     uuid,
  ac_passed     jsonb,
  signoff_note  text,
  tenant_id     text not null references tenants(id)
);

create index if not exists pilot_level_history_pilot_idx on pilot_level_history(pilot_id, entered_at);

alter table pilot_level_history enable row level security;

drop policy if exists pilot_level_history_tenant_isolation on pilot_level_history;
create policy pilot_level_history_tenant_isolation on pilot_level_history
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
