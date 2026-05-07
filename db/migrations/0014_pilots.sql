create table if not exists pilot (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  domain        text not null,
  level         text not null default 'L0' check (level in ('L0','L1','L2','L3','L4')),
  version       text not null default '0.1.0',
  owner_id      uuid,
  facilitator_id uuid,
  parent_id     uuid references pilot(id),
  language      text not null default 'fr' check (language in ('fr','en','de','es','it')),
  tenant_id     text not null references tenants(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists pilot_tenant_level_idx on pilot(tenant_id, level);

alter table pilot enable row level security;

drop policy if exists pilot_tenant_isolation on pilot;
create policy pilot_tenant_isolation on pilot
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
