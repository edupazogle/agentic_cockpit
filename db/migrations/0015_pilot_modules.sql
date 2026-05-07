create table if not exists pilot_module (
  id            uuid primary key default gen_random_uuid(),
  pilot_id      uuid not null references pilot(id) on delete cascade,
  uc_code       text not null,
  slug          text not null,
  agent_name    text,
  risk_level    text not null default 'medium' check (risk_level in ('low','medium','high')),
  kyc_level     text not null default 'standard' check (kyc_level in ('standard','strong')),
  has_payment   boolean not null default false,
  status        text not null default 'draft' check (status in ('draft','composed','shipped','retired')),
  agent_id      text,
  gateway_url   text,
  module_spec   jsonb not null default '{}',
  tenant_id     text not null references tenants(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (pilot_id, uc_code)
);

create index if not exists pilot_module_pilot_idx on pilot_module(pilot_id);

alter table pilot_module enable row level security;

drop policy if exists pilot_module_tenant_isolation on pilot_module;
create policy pilot_module_tenant_isolation on pilot_module
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
