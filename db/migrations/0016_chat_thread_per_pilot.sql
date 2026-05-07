create table if not exists chat_thread (
  id                    uuid primary key default gen_random_uuid(),
  pilot_id              uuid not null references pilot(id) on delete cascade,
  opened_at             timestamptz not null default now(),
  last_active_at        timestamptz not null default now(),
  total_tokens          integer not null default 0,
  total_cost_eur        numeric(12,4) not null default 0,
  message_count         integer not null default 0,
  active_compaction_id  uuid,
  tenant_id             text not null references tenants(id),
  unique (pilot_id)
);

create table if not exists chat_message (
  id                  uuid primary key default gen_random_uuid(),
  thread_id           uuid not null references chat_thread(id) on delete cascade,
  role                text not null check (role in ('user','companion','system','tool')),
  content             jsonb not null,
  attachments         jsonb,
  citations           jsonb,
  tools_called        jsonb,
  langfuse_trace_id   text,
  ts                  timestamptz not null default now(),
  tokens_in           integer default 0,
  tokens_out          integer default 0,
  cost_eur            numeric(12,4) default 0,
  tenant_id           text not null references tenants(id)
);

create index if not exists chat_message_thread_ts_idx on chat_message(thread_id, ts);

alter table chat_thread enable row level security;
alter table chat_message enable row level security;

drop policy if exists chat_thread_tenant_isolation on chat_thread;
create policy chat_thread_tenant_isolation on chat_thread
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');

drop policy if exists chat_message_tenant_isolation on chat_message;
create policy chat_message_tenant_isolation on chat_message
  using (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id');
