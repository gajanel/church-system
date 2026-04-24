#!/bin/bash
# backup_db.sh — Backup automático de PostgreSQL
# Agrega al cron: 0 2 * * * /opt/church-system/backup_db.sh
# (ejecuta todos los días a las 2:00 AM)

set -euo pipefail

# ── Configuración ───────────────────────────────────────────
DB_NAME="church_system"
DB_USER="postgres"
BACKUP_DIR="/var/backups/church-system"
RETENTION_DAYS=30       # elimina backups más viejos de 30 días
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/church_${DATE}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# ── Crear directorio si no existe ──────────────────────────
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup de BD: $DB_NAME" >> "$LOG_FILE"

# ── Dump comprimido ────────────────────────────────────────
if pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] ✅ Backup exitoso: $BACKUP_FILE ($SIZE)" >> "$LOG_FILE"
else
    echo "[$(date)] ❌ Backup FALLÓ" >> "$LOG_FILE"
    exit 1
fi

# ── Eliminar backups viejos ────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "church_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "[$(date)] 🗑️  Backups eliminados (>$RETENTION_DAYS días): $DELETED" >> "$LOG_FILE"

echo "[$(date)] Backup completado." >> "$LOG_FILE"
