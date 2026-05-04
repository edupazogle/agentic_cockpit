-- 0004_pilots_flows_cohorts.sql
-- Pilot-as-a-product control plane.

create table if not exists pilots (
  id          text primary key,
  tenant_id   text not null references tenants(id),
  name        text not null,
  use_case    text not null,
  risk_class  text not null check (risk_class in ('low','medium','high')) default 'medium',
  status      text not null check (status in ('draft','active','paused','retired')) default 'draft',
  kpis        jsonb not null default '{}'::jsonb,
  owners      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists flows (
  id          uuid primary key default gen_random_uuid(),
  pilot_id    text not null references pilots(id) on delete cascade,
  kind        text not null check (kind in ('langflow','n8n')),
  ref         text not null,
  version     text not null,
  variant_id  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists flows_pilot_active_idx on flows(pilot_id, is_active);

create table if not exists cohorts (
  id          uuid primary key default gen_random_uuid(),
  pilot_id    text not null references pilots(id) on delete cascade,
  variant     text not null,
  predicate   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create unique index if not exists cohorts_pilot_variant_idx on cohorts(pilot_id, variant);
