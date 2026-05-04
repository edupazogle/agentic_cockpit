-- 0005_hitl_audit_decisions.sql
-- HITL queue, append-only audit log with hash chain, and decisions registry.

create table if not exists hitl_items (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     text not null references tenants(id),
  run_id        uuid not null references scenario_runs(id) on delete cascade,
  pilot_id      text references pilots(id),
  assigned_to   uuid references users(id),
  state         text not null check (state in ('pending','claimed','approved','edited','rejected','escalated')) default 'pending',
  decision      jsonb,
  reason        text,
  priority      text not null check (priority in ('normal','escalated')) default 'normal',
  sla_deadline  timestamptz,
  latency_ms    integer,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index if not exists hitl_items_queue_idx on hitl_items(tenant_id, state, sla_deadline);
create index if not exists hitl_items_run_idx   on hitl_items(run_id);

create table if not exists audit_log (
  id          bigserial primary key,
  tenant_id   text not null references tenants(id),
  actor       text not null,
  action      text not null,
  target      text not null,
  before      jsonb,
  after       jsonb,
  occurred_at timestamptz not null default now(),
  prev_hash   text,
  hash        text not null
);
create index if not exists audit_log_tenant_time_idx on audit_log(tenant_id, occurred_at desc);
create index if not exists audit_log_target_idx      on audit_log(target);

create or replace function audit_log_hash_chain() returns trigger language plpgsql as $$
declare prev text;
begin
  select hash into prev from audit_log
   where tenant_id = new.tenant_id
   order by id desc limit 1;
  new.prev_hash := coalesce(prev, '');
  new.hash := encode(
    digest(
      coalesce(new.prev_hash,'') || '|' ||
      new.tenant_id || '|' || new.actor || '|' || new.action || '|' || new.target || '|' ||
      coalesce(new.before::text,'') || '|' || coalesce(new.after::text,'') || '|' ||
      to_char(new.occurred_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'sha256'
    ),
    'hex'
  );
  return new;
end $$;

drop trigger if exists trg_audit_log_hash on audit_log;
create trigger trg_audit_log_hash before insert on audit_log
  for each row execute function audit_log_hash_chain();

create table if not exists decisions (
  decision_id    uuid primary key default gen_random_uuid(),
  tenant_id      text not null references tenants(id),
  pilot_id       text not null references pilots(id),
  run_id         uuid not null references scenario_runs(id) on delete restrict,
  inputs_hash    text not null,
  outputs_hash   text not null,
  model_versions jsonb not null default '{}'::jsonb,
  human_approver uuid references users(id),
  policy_refs    text[] not null default '{}',
  signature      text,
  occurred_at    timestamptz not null default now()
);
create index if not exists decisions_tenant_time_idx on decisions(tenant_id, occurred_at desc);
create index if not exists decisions_run_idx         on decisions(run_id);
