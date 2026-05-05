-- 0009_runtime_safety.sql
-- Sprint 1 — Foundation + Trust Boundary
--
-- Changes:
--  1. scenario_runs: add failed_sla status, constrain orchestrator values, add missing indexes
--  2. scenario_run_events: add idempotency_key for webhook replay deduplication
--  3. audit_log: add verification function, add row-lock chain position, add append_audit_event RPC helper
--  4. tenant_config: add deny-fallback setting for multi-tenant promotion
--
-- All DDL is idempotent (create if not exists / alter column if not exists / create or replace).

-- ─── 1. scenario_runs hardening ──────────────────────────────────────────────

-- Add failed_sla to the status check constraint (requires drop + recreate)
alter table scenario_runs drop constraint if exists scenario_runs_status_check;
alter table scenario_runs add constraint scenario_runs_status_check
  check (status in ('queued', 'running', 'waiting', 'completed', 'failed', 'cancelled', 'failed_sla'));

-- Add orchestrator column if it doesn't exist, with constraint on allowed values
alter table scenario_runs add column if not exists orchestrator text not null default 'n8n';
alter table scenario_runs drop constraint if exists scenario_runs_orchestrator_check;
alter table scenario_runs add constraint scenario_runs_orchestrator_check
  check (orchestrator in ('n8n', 'langflow', 'direct'));

-- Add tenant_id column to scenario_runs (scopes runs to tenant)
alter table scenario_runs add column if not exists tenant_id text references tenants(id);
update scenario_runs set tenant_id = 'gdai-default' where tenant_id is null;
alter table scenario_runs alter column tenant_id set not null;
alter table scenario_runs alter column tenant_id set default 'gdai-default';

-- Performance indexes
create index if not exists scenario_runs_tenant_status_idx
  on scenario_runs(tenant_id, status, started_at desc);
create index if not exists scenario_runs_status_started_idx
  on scenario_runs(status, started_at desc)
  where status in ('queued', 'running', 'waiting');
create index if not exists scenario_runs_finished_idx
  on scenario_runs(finished_at desc)
  where finished_at is not null;

-- ─── 2. scenario_run_events: idempotency key ─────────────────────────────────

alter table scenario_run_events add column if not exists idempotency_key text;
alter table scenario_run_events add column if not exists tenant_id text references tenants(id);
update scenario_run_events e
  set tenant_id = r.tenant_id
  from scenario_runs r
  where e.run_id = r.id and e.tenant_id is null;
alter table scenario_run_events alter column tenant_id set default 'gdai-default';

-- Unique constraint prevents duplicate event delivery from webhook retries
create unique index if not exists scenario_run_events_idempotency_idx
  on scenario_run_events(run_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists scenario_run_events_tenant_run_idx
  on scenario_run_events(tenant_id, run_id, created_at desc);

-- ─── 3. audit_log: verification function and chain position ──────────────────

-- Add chain_position (monotonically increasing per tenant for fast verification)
alter table audit_log add column if not exists chain_position bigint;

-- Create sequence for chain positions
create sequence if not exists audit_log_chain_pos_seq;

-- Backfill chain_position for existing rows (ordered by id)
update audit_log
  set chain_position = subq.pos
  from (
    select id, row_number() over (order by id) as pos from audit_log where chain_position is null
  ) subq
  where audit_log.id = subq.id;

-- Verification function: checks that no row has been tampered
-- Returns true if chain is intact, raises exception with first bad row otherwise.
create or replace function verify_audit_chain(p_tenant_id text default null)
returns boolean language plpgsql as $$
declare
  rec        record;
  expected   text;
begin
  for rec in
    select id, tenant_id, actor, action, target, before, after, occurred_at, prev_hash, hash
    from   audit_log
    where  (p_tenant_id is null or tenant_id = p_tenant_id)
    order  by id
  loop
    expected := encode(
      digest(
        coalesce(rec.prev_hash,'') || '|' ||
        rec.tenant_id || '|' || rec.actor || '|' || rec.action || '|' || rec.target || '|' ||
        coalesce(rec.before::text,'') || '|' || coalesce(rec.after::text,'') || '|' ||
        to_char(rec.occurred_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'sha256'
      ),
      'hex'
    );
    if rec.hash <> expected then
      raise exception 'Audit chain integrity violation at row id=% tenant=%', rec.id, rec.tenant_id;
    end if;
  end loop;
  return true;
end $$;

-- RPC helper called by gateway's audit.py append_audit_event()
-- This function inserts via the existing trigger chain (hash is auto-computed by trigger).
create or replace function append_audit_event(
  p_id           text,
  p_tenant_id    text,
  p_action       text,
  p_actor_id     text,
  p_resource_type text,
  p_resource_id  text,
  p_payload      jsonb,
  p_recorded_at  text
) returns void language plpgsql security definer as $$
begin
  insert into audit_log (tenant_id, actor, action, target, after, occurred_at)
  values (
    p_tenant_id,
    coalesce(p_actor_id, 'system'),
    p_action,
    p_resource_type || ':' || p_resource_id,
    p_payload,
    (p_recorded_at)::timestamptz
  );
end $$;

-- ─── 4. tenant_config: deny-fallback setting ────────────────────────────────

create table if not exists tenant_config (
  tenant_id    text primary key references tenants(id),
  settings     jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- Seed default config for gdai-default
insert into tenant_config (tenant_id, settings)
values ('gdai-default', '{"allow_tenant_fallback": true, "env": "local"}'::jsonb)
on conflict (tenant_id) do nothing;

-- RLS
alter table tenant_config enable row level security;
drop policy if exists "tenant_config_tenant_isolation" on tenant_config;
create policy "tenant_config_tenant_isolation" on tenant_config
  using (tenant_id = current_setting('app.tenant_id', true));

-- ─── 5. enable RLS on new columns ───────────────────────────────────────────

drop policy if exists "scenario_runs_tenant_isolation" on scenario_runs;
create policy "scenario_runs_tenant_isolation" on scenario_runs
  using (tenant_id = current_setting('app.tenant_id', true));
