#!/usr/bin/env bash
# backup-pg-langfuse.sh — On-demand pg_dump of the Supabase (Langfuse) database.
#
# Usage:
#   bash infra/backup/backup-pg-langfuse.sh
#
# Required environment variables:
#   SUPABASE_DB_URL      — PostgreSQL connection string, e.g.
#                          postgres://postgres:<password>@db.<project>.supabase.co:5432/postgres
#   BACKUP_BUCKET_URL    — Railway object storage presigned upload base URL
#                          (or an S3-compatible endpoint, e.g. s3://langfuse-blobs)
#   AWS_ACCESS_KEY_ID    — (for S3-compatible upload)
#   AWS_SECRET_ACCESS_KEY— (for S3-compatible upload)
#   AWS_ENDPOINT_URL     — Railway S3 endpoint, e.g. https://bucket.railway.app
#
# Produces a timestamped .dump file uploaded to the backup bucket.
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
BACKUP_DIR="${TMPDIR:-/tmp}/gdai-backups"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
DUMP_FILE="${BACKUP_DIR}/supabase-${TIMESTAMP}.dump"
BUCKET_PREFIX="${BUCKET_PREFIX:-backups/supabase}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# ── Validation ──────────────────────────────────────────────────────────────
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
    echo "ERROR: SUPABASE_DB_URL is not set" >&2
    exit 1
fi

command -v pg_dump  >/dev/null 2>&1 || { echo "ERROR: pg_dump not found" >&2; exit 1; }
command -v aws      >/dev/null 2>&1 || { echo "ERROR: aws CLI not found" >&2; exit 1; }

# ── Dump ────────────────────────────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +%H:%M:%SZ)] Starting pg_dump → ${DUMP_FILE}"
pg_dump \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --exclude-table-data='audit_log' \
    "${SUPABASE_DB_URL}" \
    --file="${DUMP_FILE}"

DUMP_SIZE=$(du -sh "${DUMP_FILE}" | cut -f1)
echo "[$(date -u +%H:%M:%SZ)] Dump complete — size: ${DUMP_SIZE}"

# ── Upload ───────────────────────────────────────────────────────────────────
S3_KEY="${BUCKET_PREFIX}/supabase-${TIMESTAMP}.dump"
echo "[$(date -u +%H:%M:%SZ)] Uploading to s3://${BUCKET_PREFIX}/..."

aws s3 cp \
    "${DUMP_FILE}" \
    "s3://langfuse-blobs/${S3_KEY}" \
    --endpoint-url="${AWS_ENDPOINT_URL:-}" \
    --storage-class STANDARD

echo "[$(date -u +%H:%M:%SZ)] Upload complete → ${S3_KEY}"

# ── Cleanup local file ───────────────────────────────────────────────────────
rm -f "${DUMP_FILE}"

# ── Prune old backups (retention) ────────────────────────────────────────────
echo "[$(date -u +%H:%M:%SZ)] Pruning backups older than ${RETENTION_DAYS} days..."
CUTOFF=$(date -u -d "${RETENTION_DAYS} days ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
    || date -u -v-"${RETENTION_DAYS}d" +%Y-%m-%dT%H:%M:%SZ)  # macOS fallback

aws s3api list-objects-v2 \
    --bucket langfuse-blobs \
    --prefix "${BUCKET_PREFIX}/supabase-" \
    --endpoint-url="${AWS_ENDPOINT_URL:-}" \
    --query "Contents[?LastModified<='${CUTOFF}'].Key" \
    --output text \
| while read -r key; do
    [[ -z "${key}" ]] && continue
    echo "  Deleting old backup: ${key}"
    aws s3 rm "s3://langfuse-blobs/${key}" --endpoint-url="${AWS_ENDPOINT_URL:-}"
done

echo "[$(date -u +%H:%M:%SZ)] Backup complete."
