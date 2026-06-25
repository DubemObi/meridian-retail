#!/bin/bash
# scripts/restore_db.sh
# Meridian Retail Group — PostgreSQL Restore Script
#
# Usage: bash scripts/restore_db.sh /home/ubuntu/backups/meridian/meridian_db_2025-01-15_02-00-00.sql.gz

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: bash restore_db.sh <path-to-backup.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will overwrite the current meridian_db database."
read -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "Restoring from $BACKUP_FILE..."

gunzip -c "$BACKUP_FILE" | docker exec -i meridian-postgres psql -U meridian -d meridian_db

echo "Restore complete. Verify with:"
echo "  docker exec -it meridian-postgres psql -U meridian -d meridian_db -c '\dt'"
