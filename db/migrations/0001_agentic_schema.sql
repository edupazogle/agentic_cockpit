create extension if not exists pgcrypto;

create table if not exists cockpit_scenarios (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  description text,
  icon text,
  url_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cockpit_scenario_members (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null references cockpit_scenarios(key) on delete cascade,
  member_id text not null,
  name text not null,
  row_type text not null,
  phase_key text not null,
  icon text not null,
  mission text,
  category text,
  tier integer not null default 2,
  cost_per_beat numeric(7, 3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scenario_key, member_id)
);

create table if not exists cockpit_layout_config (
  id uuid primary key default gen_random_uuid(),
  scenario_key text unique not null references cockpit_scenarios(key) on delete cascade,
  rows jsonb,
  phases jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scenario_runs (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null references cockpit_scenarios(key) on delete restrict,
  status text not null check (status in ('queued', 'running', 'waiting', 'completed', 'failed')),
  started_by text,
  current_step text,
  reserve_eur numeric(12, 2),
  vendor_name text,
  claim_id text,
  approval_id text,
  workflow_key text,
  dispatch_state text not null default 'queued',
  node_states jsonb not null default '{}'::jsonb,
  runtime_metadata jsonb not null default '{}'::jsonb,
  run_source text not null default 'agentic-web',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists scenario_run_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references scenario_runs(id) on delete cascade,
  scenario_key text not null,
  step_key text not null,
  level text not null default 'info' check (level in ('info', 'warning', 'error', 'success')),
  label text not null,
  detail text,
  node_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists workflow_dispatches (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references scenario_runs(id) on delete cascade,
  scenario_key text not null,
  workflow_key text not null,
  webhook_path text,
  external_execution_id text,
  request_payload jsonb,
  response_payload jsonb,
  dispatch_state text not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references scenario_runs(id) on delete set null,
  scenario_key text not null,
  workflow_key text,
  document_url text,
  filename text,
  mime_type text,
  doc_type text,
  status text not null default 'queued',
  summary text,
  provider text not null default 'docling',
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists scenario_runs enable row level security;
alter table if exists scenario_run_events enable row level security;
alter table if exists workflow_dispatches enable row level security;
alter table if exists document_jobs enable row level security;
