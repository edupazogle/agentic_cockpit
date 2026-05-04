-- 0008_extensions.sql
-- Extensions used by the gateway. pgcrypto already created in 0001.

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Future-ready (deferred to v1.1):
-- create extension if not exists vector;
-- create extension if not exists pg_cron;
