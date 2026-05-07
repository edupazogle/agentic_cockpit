create table if not exists pilot_artifact (
  id              uuid primary key default gen_random_uuid(),
  pilot_id        uuid not null references pilot(id) on delete cascade,
  module_id       uuid references pilot_module(id) on delete cascade,
  kind            text not null check (kind in (
    'persona','journey_node','tools_inventory',
    'citation','reality_check_item',
    'flow_node','hitl_gate','creative_ai_step',
    'business_case','sensitivity_scenario','capability_investment',
    'synth_seed_manifest','edge_case_decision',
    'rule','integration_contract','agreement','tension_resolution',
    'flow_visualization','simulated_hitl_payload','kpi','eval_rubric_proposal',
    'summary_snapshot','observability_bundle','recommended_l1_scenarios',
    'generated_deck','generated_memo','status_update',
    'compaction_memo','module_spec'
  )),
  version         integer not null default 1,
  content         jsonb not null,
  parent_id       uuid references pilot_artifact(id),
  retired_at      timestamptz,
  created_by      text not null check (created_by in ('companion','user')),
  signed_off_by   uuid,
  signed_off_at   timestamptz,
  tenant_id       text not null references tenants(id),
  created_at      timestamptz not null default now()
);

create index if not exists pilot_artifact_pilot_kind_idx on pilot_artifact(pilot_id, kind) where retired_at is null;
create index if not exists pilot_artifact_module_kind_idx on pilot_artifact(module_id, kind) where module_id is not null and retired_at is null;

alter table pilot_artifact enable row level security;

drop policy if exists pilot_artifact_tenant_isolation on pilot_artifact;
create policy pilot_artifact_tenant_isolation on pilot_artifact
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
