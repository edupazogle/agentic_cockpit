-- 0003_tenant_id_columns.sql
-- Add tenant_id to all existing tables (non-breaking: defaulted + nullable-friendly).
-- Also adds Langfuse trace correlation columns to scenario_runs.

alter table cockpit_scenarios          add column if not exists tenant_id text not null default 'gdai-default' references tenants(id);
alter table cockpit_scenario_members   add column if not exists tenant_id text not null default 'gdai-default' references tenants(id);
alter table cockpit_layout_config      add column if not exists tenant_id text not null default 'gdai-default' references tenants(id);
alter table scenario_runs              add column if not exists tenant_id text not null default 'gdai-default' references tenants(id);
alter table scenario_run_events        add column if not exists tenant_id text not null default 'gdai-default' references tenants(id);
alter table workflow_dispatches        add column if not exists tenant_id text not null default 'gdai-default' references tenants(id);
alter table document_jobs              add column if not exists tenant_id text not null default 'gdai-default' references tenants(id);

create index if not exists scenario_runs_tenant_started_idx        on scenario_runs(tenant_id, started_at desc);
create index if not exists scenario_run_events_tenant_run_idx      on scenario_run_events(tenant_id, run_id, created_at);
create index if not exists workflow_dispatches_tenant_run_idx      on workflow_dispatches(tenant_id, run_id);
create index if not exists document_jobs_tenant_run_idx            on document_jobs(tenant_id, run_id);

-- Trace correlation
alter table scenario_runs add column if not exists langfuse_trace_id text;
alter table scenario_runs add column if not exists orchestrator      text not null default 'n8n:wf002v2';
create index if not exists scenario_runs_trace_idx on scenario_runs(langfuse_trace_id);
