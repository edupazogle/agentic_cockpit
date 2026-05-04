-- 0002_tenants_users.sql
-- Multi-tenant control plane: tenants + users + seed default tenant.

create table if not exists tenants (
  id             text primary key,
  name           text not null,
  region         text not null default 'EU',
  data_residency text not null default 'EU',
  created_at     timestamptz not null default now()
);

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null references tenants(id) on delete restrict,
  email       text unique not null,
  role        text not null check (role in ('operator','admin','viewer')) default 'operator',
  entra_oid   text unique,
  created_at  timestamptz not null default now()
);
create index if not exists users_tenant_idx on users(tenant_id);

insert into tenants (id, name, region, data_residency)
values ('gdai-default', 'GDAI Demo', 'EU', 'EU')
on conflict (id) do nothing;
