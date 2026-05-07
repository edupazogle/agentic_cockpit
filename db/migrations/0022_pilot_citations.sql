create table if not exists pilot_citation (
  id                uuid primary key default gen_random_uuid(),
  pilot_id          uuid not null references pilot(id) on delete cascade,
  ref               text not null,
  title             text,
  snippet           text,
  url               text,
  retrieved_at      timestamptz not null default now(),
  verdict           text check (verdict in ('verified','unverified','contradicted','superseded')),
  must_address      boolean not null default false,
  binding           boolean not null default false,
  source_movement   text,
  tenant_id         text not null references tenants(id)
);

create index if not exists pilot_citation_pilot_binding_idx on pilot_citation(pilot_id, binding) where binding = true;

alter table pilot_citation enable row level security;

drop policy if exists pilot_citation_tenant_isolation on pilot_citation;
create policy pilot_citation_tenant_isolation on pilot_citation
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
