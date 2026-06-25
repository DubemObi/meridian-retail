#!/bin/bash
# scripts/backup_db.sh
# Meridian Retail Group — PostgreSQL Backup Script
#
# Runs daily via cron. Dumps the database, compresses it, keeps the
# last 7 days locally, and deletes anything older.
#
# Install as a cron job:
#   crontab -e
#   0 2 * * * /home/ubuntu/meridian-retail/scripts/backup_db.sh >> /home/ubuntu/backup.log 2>&1

set -e

BACKUP_DIR="/home/ubuntu/backups/meridian"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/meridian_db_$TIMESTAMP.sql.gz"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

docker exec meridian-postgres pg_dump -U meridian meridian_db | gzip > "$BACKUP_FILE"

if [ -s "$BACKUP_FILE" ]; then
  echo "[$(date)] Backup successful: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "[$(date)] ERROR: Backup file is empty or was not created"
  exit 1
fi

# Delete backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "meridian_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days"

echo "[$(date)] Current backups:"
ls -lh "$BACKUP_DIR"
