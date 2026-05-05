#!/usr/bin/env bash
# backup-clickhouse.sh — On-demand ClickHouse backup via native BACKUP command.
#
# Usage:
#   bash infra/backup/backup-clickhouse.sh
#
# Required environment variables:
#   CLICKHOUSE_URL       — HTTP endpoint, e.g. http://clickhouse.railway.internal:8123
#   CLICKHOUSE_USER      — default: default
#   CLICKHOUSE_PASSWORD  — ClickHouse password
#   AWS_ENDPOINT_URL     — Railway S3 endpoint
#   AWS_ACCESS_KEY_ID    — (for S3-compatible upload)
#   AWS_SECRET_ACCESS_KEY— (for S3-compatible upload)
#
# ClickHouse BACKUP writes directly to S3-compatible storage.
# Ref: https://clickhouse.com/docs/en/operations/backup
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_ID="clickhouse-${TIMESTAMP}"
BUCKET="langfuse-blobs"
BUCKET_PREFIX="${BUCKET_PREFIX:-backups/clickhouse}"
S3_KEY="${BUCKET_PREFIX}/${BACKUP_ID}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

CLICKHOUSE_URL="${CLICKHOUSE_URL:-http://localhost:8123}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-default}"

# ── Validation ──────────────────────────────────────────────────────────────
if [[ -z "${CLICKHOUSE_PASSWORD:-}" ]]; then
    echo "ERROR: CLICKHOUSE_PASSWORD is not set" >&2
    exit 1
fi

command -v curl >/dev/null 2>&1 || { echo "ERROR: curl not found" >&2; exit 1; }
command -v aws  >/dev/null 2>&1 || { echo "ERROR: aws CLI not found" >&2; exit 1; }

# ── Backup ──────────────────────────────────────────────────────────────────
echo "[$(date -u +%H:%M:%SZ)] Starting ClickHouse backup → s3://${BUCKET}/${S3_KEY}"

BACKUP_SQL="BACKUP DATABASE default TO S3('${AWS_ENDPOINT_URL:-}/${BUCKET}/${S3_KEY}', '${AWS_ACCESS_KEY_ID:-}', '${AWS_SECRET_ACCESS_KEY:-}')"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -u "${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}" \
    -H "Content-Type: text/plain" \
    --data "${BACKUP_SQL}" \
    "${CLICKHOUSE_URL}/?wait_end_of_query=1")

if [[ "${HTTP_STATUS}" != "200" ]]; then
    echo "ERROR: ClickHouse BACKUP command failed with HTTP ${HTTP_STATUS}" >&2
    exit 1
fi

echo "[$(date -u +%H:%M:%SZ)] ClickHouse backup complete → ${S3_KEY}"

# ── Prune old backups ────────────────────────────────────────────────────────
echo "[$(date -u +%H:%M:%SZ)] Pruning ClickHouse backups older than ${RETENTION_DAYS} days..."
CUTOFF=$(date -u -d "${RETENTION_DAYS} days ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
    || date -u -v-"${RETENTION_DAYS}d" +%Y-%m-%dT%H:%M:%SZ)

aws s3api list-objects-v2 \
    --bucket "${BUCKET}" \
    --prefix "${BUCKET_PREFIX}/clickhouse-" \
    --endpoint-url="${AWS_ENDPOINT_URL:-}" \
    --query "Contents[?LastModified<='${CUTOFF}'].Key" \
    --output text \
| while read -r key; do
    [[ -z "${key}" ]] && continue
    echo "  Deleting old backup: ${key}"
    aws s3 rm "s3://${BUCKET}/${key}" --endpoint-url="${AWS_ENDPOINT_URL:-}"
done

echo "[$(date -u +%H:%M:%SZ)] Backup and pruning complete."
