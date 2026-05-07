-- Migration 0010 — Callback queue + dead-letter table
-- Idempotent: safe to run multiple times.

-- ── callback_queue ───────────────────────────────────────────────────────────
-- Stores inbound webhook payloads (from n8n and future sources) pending gateway
-- processing.  The gateway claims rows atomically via SELECT ... FOR UPDATE SKIP
-- LOCKED, processes them, then marks status='done'.  Undeliverable rows are
-- moved to callback_dead_letter after max_attempts is exceeded.

create table if not exists callback_queue (
    id               uuid        primary key default gen_random_uuid(),
    tenant_id        text        not null references tenants(id),
    source           text        not null,   -- 'n8n', 'chatwoot', etc.
    flow             text,                   -- flow/route identifier
    idempotency_key  uuid        not null unique,
    payload          jsonb       not null,
    status           text        not null default 'pending'
                                check (status in ('pending','processing','done','dead')),
    attempts         int         not null default 0,
    next_attempt_at  timestamptz not null default now(),
    processed_at     timestamptz,
    error_detail     text,
    created_at       timestamptz not null default now()
);

-- Partial index so the worker only scans 'pending' rows
create index if not exists idx_callback_queue_ready
    on callback_queue (next_attempt_at)
    where status = 'pending';

create index if not exists idx_callback_queue_tenant
    on callback_queue (tenant_id, created_at desc);

-- ── callback_dead_letter ─────────────────────────────────────────────────────
-- Rows that exceeded max attempts are copied here for investigation.

create table if not exists callback_dead_letter (
    id               uuid        primary key default gen_random_uuid(),
    original_id      uuid        not null,   -- callback_queue.id
    tenant_id        text        not null references tenants(id),
    source           text        not null,
    flow             text,
    idempotency_key  uuid        not null,
    payload          jsonb       not null,
    attempts         int         not null,
    last_error       text,
    died_at          timestamptz not null default now()
);

create index if not exists idx_callback_dead_letter_tenant
    on callback_dead_letter (tenant_id, died_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- The gateway (service_role) bypasses RLS by design.
-- Other roles can only see their own tenant rows.

alter table callback_queue enable row level security;
alter table callback_dead_letter enable row level security;

drop policy if exists callback_queue_tenant_isolation on callback_queue;
create policy callback_queue_tenant_isolation on callback_queue
    using (tenant_id = current_setting('app.tenant_id', true));

drop policy if exists callback_dead_letter_tenant_isolation on callback_dead_letter;
create policy callback_dead_letter_tenant_isolation on callback_dead_letter
    using (tenant_id = current_setting('app.tenant_id', true));

-- ── Seed default tenant config entry ─────────────────────────────────────────
-- No-op if tenant_config doesn't exist yet (guard for out-of-order apply).
do $$
begin
    if exists (select 1 from information_schema.tables
               where table_name = 'tenant_config') then
        insert into tenant_config (tenant_id, settings)
        values ('gdai-default', '{"callback_max_attempts": 5, "callback_retry_backoff_seconds": 60}')
        on conflict (tenant_id) do nothing;
    end if;
end
$$;
