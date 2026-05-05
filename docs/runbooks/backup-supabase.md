# Supabase Backup Runbook

> **Scope:** `tsevmqftwnyzrxlpnred` (production Supabase project)
>
> **RPO:** 24h via PITR; on-demand snapshot before any destructive migration
>
> **Authority:** Supabase dashboard > Project > Backups

---

## Backup Layers

| Layer | Mechanism | Retention | Who triggers |
|---|---|---|---|
| PITR (Point-in-Time Recovery) | Supabase Pro plan — continuous WAL shipping | 7 days | Automatic |
| On-demand snapshot | `pg_dump` via `infra/backup/backup-pg-langfuse.sh` | 30 days in Railway bucket | Manual / pre-migration |
| ClickHouse backup | `infra/backup/backup-clickhouse.sh` | 30 days in Railway bucket | Manual / pre-migration |

---

## Before Any Destructive Migration

**Always trigger on-demand snapshot before:**
- `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`
- Migrations that rewrite large tables
- Schema renames that affect RLS policies

```bash
# 1. Take on-demand Supabase snapshot
bash infra/backup/backup-pg-langfuse.sh

# 2. Verify snapshot uploaded
railway service logs --service langfuse-blobs | tail -20

# 3. Apply migration
supabase db push --project-ref tsevmqftwnyzrxlpnred

# 4. Verify migration applied
supabase migration list --linked
```

---

## PITR Restore (Supabase Dashboard)

For any data loss event within the 7-day PITR window:

1. Go to **Supabase Dashboard** > `tsevmqftwnyzrxlpnred` > **Database** > **Backups**
2. Select **Point in Time Recovery**
3. Enter target timestamp (UTC) — use `git log` to correlate with incident
4. Click **Restore** — creates a new Supabase project clone
5. **Verify data integrity** on the clone before switching
6. Update `SUPABASE_URL` and keys in Railway `production` environment
7. Re-run `supabase db push` to apply any migrations newer than the restore point

> **Warning:** PITR restore creates a new project. The old project remains until manually deleted. Do not delete until restore is confirmed.

---

## On-Demand Snapshot Restore

From a `pg_dump` backup file stored in Railway object storage:

```bash
# 1. Download backup from Railway bucket
railway bucket download --bucket langfuse-blobs --key "backups/supabase/$(date +%Y-%m-%d)*.dump" ./restore.dump

# 2. Restore to a fresh Supabase project (do NOT restore to production directly)
pg_restore \
  --host=$NEW_SUPABASE_HOST \
  --port=5432 \
  --dbname=postgres \
  --username=postgres \
  --no-owner \
  --no-privileges \
  ./restore.dump

# 3. Verify row counts match expectations
psql "$NEW_SUPABASE_URL" -c "SELECT tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"
```

---

## Restore Drill Plan

Run quarterly to validate backup integrity:

### Frequency: Quarterly (before each major sprint milestone)

### Steps

1. **Download** latest on-demand snapshot
2. **Restore** to a temporary Supabase project (free tier sufficient for drill)
3. **Verify** critical tables:
   ```sql
   SELECT COUNT(*) FROM scenario_runs;      -- must match production within expected delta
   SELECT COUNT(*) FROM audit_log;          -- must match production
   SELECT COUNT(*) FROM pilots;             -- must match production
   SELECT COUNT(*) FROM callback_queue;     -- may differ (transient rows)
   ```
4. **Check** RLS policies are present: `SELECT * FROM pg_policies LIMIT 20;`
5. **Delete** the temporary project
6. **Record** drill result in `docs/runbooks/drill-log.md` with date and row counts

### Pass Criteria
- Restore completes without errors
- All critical tables present and non-empty
- RLS policies in place
- Row counts within ±5% of production (adjusted for time delta)

---

## Key Contacts

| Role | Contact |
|---|---|
| DB admin | AXA GDAI platform team |
| Supabase support | support@supabase.io — reference project `tsevmqftwnyzrxlpnred` |
| Railway support | help.railway.app |
