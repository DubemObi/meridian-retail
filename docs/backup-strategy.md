# Meridian Retail Backup Strategy

## Overview

The Meridian Retail platform uses a backup script to create compressed PostgreSQL database backups.

The backup script exports the database contents into an SQL file and compresses it into a `.sql.gz` archive. These backups can later be used to restore the database if data is lost due to hardware failure, accidental deletion, software bugs, or other unexpected events.

The backup script is scheduled to run automatically every day at **2:00 AM** using a Linux cron job.

---

## Why backups must be tested

Creating a backup file is only the first step. A backup is valuable only if it can be successfully restored.

A backup file may exist but still be unusable because:

- the backup process failed midway
- the file became corrupted
- the backup is incomplete
- the wrong database was backed up
- required permissions or dependencies are missing during restoration

Simply confirming that a `.sql.gz` file exists does not guarantee that the data inside it is valid.

The only reliable way to verify a backup is to perform a test restoration into a database and confirm that the data can be recovered successfully.

For this reason, backup verification should always include periodic restore testing, not just checking that backup files are being created.

---

## Backup Schedule

The backup script is scheduled using cron:

```text
0 2 * * * /home/ubuntu/meridian-retail/scripts/backup_db.sh
```

This runs the backup automatically every day at **2:00 AM**, helping ensure that recent data can be recovered if necessary.