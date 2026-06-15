#!/bin/bash

# ==============================================================================
# PostgreSQL Automated Backup Script
# Usage: ./backup_db.sh
# Note: Ensure this file has executable permissions (chmod +x backup_db.sh)
# Add to crontab: 0 2 * * * /path/to/backup_db.sh >> /var/log/db_backup.log 2>&1
# ==============================================================================

# Variables
DB_CONTAINER="sems_db"
DB_USER="postgres"
DB_NAME="sems_db"
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILENAME="${DB_NAME}_backup_${DATE}.sql.gz"

echo "Starting database backup at ${DATE}..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Execute pg_dump inside the docker container and gzip the output
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/$BACKUP_FILENAME"

# Verify backup creation
if [ -f "$BACKUP_DIR/$BACKUP_FILENAME" ]; then
    echo "Backup completed successfully: $BACKUP_DIR/$BACKUP_FILENAME"
    
    # Optional: Keep only last 7 days of backups to save disk space
    find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
    echo "Old backups cleaned up (older than 7 days)."
else
    echo "Error: Backup failed!"
    exit 1
fi
