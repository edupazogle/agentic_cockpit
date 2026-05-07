create table if not exists repo_change_set (
  id            uuid primary key default gen_random_uuid(),
  pilot_id      uuid not null references pilot(id) on delete cascade,
  module_id     uuid references pilot_module(id),
  branch        text,
  files         jsonb not null default '[]',
  status        text not null default 'pending'
                check (status in ('pending','reviewed','applied','rejected')),
  commit_sha    text,
  ts            timestamptz not null default now(),
  tenant_id     text not null references tenants(id)
);

comment on column repo_change_set.files is 'Array of {path, op, before_sha, after_sha, content} objects';

alter table repo_change_set enable row level security;

drop policy if exists repo_change_set_tenant_isolation on repo_change_set;
create policy repo_change_set_tenant_isolation on repo_change_set
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
