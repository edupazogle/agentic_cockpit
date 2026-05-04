-- 0006_evals_feedback_scenarios_demo.sql
-- LLM-judge evals, user feedback, and the demo-view narration cache.

create table if not exists evals (
  id            bigserial primary key,
  tenant_id     text not null references tenants(id),
  flow_id       uuid not null references flows(id) on delete cascade,
  version       text not null,
  dataset_id    text not null,
  metric        text not null,
  score         numeric(5,4) not null,
  judge_model   text not null,
  run_at        timestamptz not null default now()
);
create index if not exists evals_tenant_flow_idx on evals(tenant_id, flow_id, metric, run_at desc);

create table if not exists feedback (
  id           bigserial primary key,
  tenant_id    text not null references tenants(id),
  run_id       uuid references scenario_runs(id) on delete cascade,
  user_id      uuid references users(id),
  label        text not null check (label in ('thumbs_up','thumbs_down','flag')),
  note         text,
  langfuse_id  text,
  created_at   timestamptz not null default now()
);
create index if not exists feedback_tenant_run_idx on feedback(tenant_id, run_id);

create table if not exists scenarios_demo (
  scenario_key  text primary key references cockpit_scenarios(key) on delete cascade,
  tenant_id     text not null references tenants(id) default 'gdai-default',
  seed_run_id   uuid references scenario_runs(id),
  narration     jsonb not null default '{}'::jsonb,
  comparison    jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);
