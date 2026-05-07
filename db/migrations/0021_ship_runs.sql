create table if not exists ship_run (
  id                    uuid primary key default gen_random_uuid(),
  pilot_id              uuid not null references pilot(id) on delete cascade,
  started_at            timestamptz not null default now(),
  finished_at           timestamptz,
  status                text not null default 'queued'
                        check (status in ('queued','running','completed','failed','cancelled')),
  langfuse_session_id   text,
  total_cost_eur        numeric(12,4) default 0,
  bundle_sha            text,
  tenant_id             text not null references tenants(id)
);

create table if not exists ship_phase_event (
  id            uuid primary key default gen_random_uuid(),
  ship_run_id   uuid not null references ship_run(id) on delete cascade,
  phase         text not null check (phase in ('1_parse','2_compose','3_lint','4_wire','5_deploy','6_verify')),
  module_id     uuid references pilot_module(id),
  event_type    text not null check (event_type in ('start','progress','success','failure','rollback','cancel')),
  line          text not null,
  ts            timestamptz not null default now(),
  status        text check (status in ('ok','warn','error')),
  payload       jsonb,
  tenant_id     text not null references tenants(id)
);

create index if not exists ship_phase_event_run_idx on ship_phase_event(ship_run_id, phase, ts);

alter table ship_run enable row level security;
alter table ship_phase_event enable row level security;

drop policy if exists ship_run_tenant_isolation on ship_run;
create policy ship_run_tenant_isolation on ship_run
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');

drop policy if exists ship_phase_event_tenant_isolation on ship_phase_event;
create policy ship_phase_event_tenant_isolation on ship_phase_event
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
