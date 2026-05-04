-- 0007_rls_policies.sql
-- Row-level security across the control plane. Service-role bypasses RLS by design (Supabase),
-- so the gateway/agentic-web with the service-role key keep working at MVP.

-- Pre-step: ensure flows + cohorts have tenant_id (was missed in 0004; idempotent backfill).
alter table flows   add column if not exists tenant_id text references tenants(id);
alter table cohorts add column if not exists tenant_id text references tenants(id);
update flows   f set tenant_id = p.tenant_id from pilots p where f.pilot_id = p.id and f.tenant_id is null;
update cohorts c set tenant_id = p.tenant_id from pilots p where c.pilot_id = p.id and c.tenant_id is null;
update flows   set tenant_id = 'gdai-default' where tenant_id is null;
update cohorts set tenant_id = 'gdai-default' where tenant_id is null;
alter table flows   alter column tenant_id set not null;
alter table cohorts alter column tenant_id set not null;
alter table flows   alter column tenant_id set default 'gdai-default';
alter table cohorts alter column tenant_id set default 'gdai-default';
create index if not exists flows_tenant_idx   on flows(tenant_id);
create index if not exists cohorts_tenant_idx on cohorts(tenant_id);

alter table tenants                  enable row level security;
alter table users                    enable row level security;
alter table pilots                   enable row level security;
alter table flows                    enable row level security;
alter table cohorts                  enable row level security;
alter table hitl_items               enable row level security;
alter table audit_log                enable row level security;
alter table decisions                enable row level security;
alter table evals                    enable row level security;
alter table feedback                 enable row level security;
alter table scenarios_demo           enable row level security;
alter table cockpit_scenarios        enable row level security;
alter table cockpit_scenario_members enable row level security;
alter table cockpit_layout_config    enable row level security;

create or replace function current_tenant_id() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', ''),
    'gdai-default'
  )
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'pilots','flows','cohorts','hitl_items','decisions','evals','feedback',
    'scenarios_demo','scenario_runs','scenario_run_events','workflow_dispatches',
    'document_jobs','cockpit_scenarios','cockpit_scenario_members','cockpit_layout_config'
  ]) loop
    execute format('drop policy if exists %1$s_tenant_isolation on %1$I', t);
    execute format(
      'create policy %1$s_tenant_isolation on %1$I for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id())',
      t
    );
  end loop;
end $$;

-- audit_log: append-only (insert + select for tenant; update/delete denied by default)
drop policy if exists audit_log_select on audit_log;
drop policy if exists audit_log_insert on audit_log;
create policy audit_log_select on audit_log for select using (tenant_id = current_tenant_id());
create policy audit_log_insert on audit_log for insert with check (tenant_id = current_tenant_id());

-- tenants/users: readable by tenant members, writable only via service role
drop policy if exists tenants_self_read on tenants;
create policy tenants_self_read on tenants for select using (id = current_tenant_id());

drop policy if exists users_tenant_read on users;
create policy users_tenant_read on users for select using (tenant_id = current_tenant_id());
