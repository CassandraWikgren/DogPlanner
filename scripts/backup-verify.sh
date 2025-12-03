#!/bin/bash

# ============================================================
# Backup Verification Script för DogPlanner
# Skapad: 3 December 2025
# ============================================================
# 
# Detta script:
# 1. Kör databasbackup med pg_dump
# 2. Verifierar databasintegritet FÖRE backup
# 3. Sparar tabellräkningar för jämförelse
# 4. Loggar resultat
#
# Användning:
#   chmod +x backup-verify.sh
#   ./backup-verify.sh
#
# Kräver:
#   - PostgreSQL client tools (pg_dump, psql)
#   - Miljövariabler: SUPABASE_DB_URL, SUPABASE_DB_PASSWORD
# ============================================================

set -e  # Avsluta vid fel

# ============================================================
# KONFIGURATION
# ============================================================

# Hämta från miljövariabler eller sätt här
DB_HOST="${SUPABASE_DB_HOST:-db.xxx.supabase.co}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"

# Backup-mapp
BACKUP_DIR="./backups"
LOGS_DIR="./backup-logs"

# Tidsstämpel
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dogplanner_backup_${DATE}.sql"
INTEGRITY_LOG="${LOGS_DIR}/integrity_check_${DATE}.txt"
TABLE_COUNTS_LOG="${LOGS_DIR}/table_counts_${DATE}.txt"
MAIN_LOG="${LOGS_DIR}/backup_${DATE}.log"

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================
# FUNKTIONER
# ============================================================

log() {
  echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$MAIN_LOG"
}

error() {
  echo -e "${RED}[ERROR $(date +%H:%M:%S)]${NC} $1" | tee -a "$MAIN_LOG"
}

warn() {
  echo -e "${YELLOW}[WARN $(date +%H:%M:%S)]${NC} $1" | tee -a "$MAIN_LOG"
}

check_prerequisites() {
  log "Kontrollerar förutsättningar..."
  
  # Check pg_dump
  if ! command -v pg_dump &> /dev/null; then
    error "pg_dump kunde inte hittas. Installera PostgreSQL client tools."
    exit 1
  fi
  
  # Check psql
  if ! command -v psql &> /dev/null; then
    error "psql kunde inte hittas. Installera PostgreSQL client tools."
    exit 1
  fi
  
  # Check miljövariabler
  if [ -z "$PGPASSWORD" ]; then
    error "PGPASSWORD miljövariabel är inte satt."
    echo "Sätt: export PGPASSWORD='ditt-lösenord'"
    exit 1
  fi
  
  log "✅ Alla förutsättningar uppfyllda"
}

create_directories() {
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$LOGS_DIR"
  log "✅ Mappar skapade: $BACKUP_DIR, $LOGS_DIR"
}

verify_database_integrity() {
  log "Verifierar databasintegritet..."
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" \
    -c "SELECT * FROM verify_database_integrity();" \
    -o "$INTEGRITY_LOG" 2>&1
  
  if [ $? -ne 0 ]; then
    error "Kunde inte köra integritetskontroll"
    return 1
  fi
  
  # Kolla om några checks = ERROR
  if grep -q "ERROR" "$INTEGRITY_LOG"; then
    error "❌ Integritetsproblem funna! Se $INTEGRITY_LOG"
    cat "$INTEGRITY_LOG"
    return 1
  else
    log "✅ Databasintegritet OK"
    return 0
  fi
}

get_table_counts() {
  log "Hämtar tabellräkningar..."
  
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" \
    -c "SELECT * FROM get_table_counts() ORDER BY row_count DESC;" \
    -o "$TABLE_COUNTS_LOG" 2>&1
  
  if [ $? -eq 0 ]; then
    log "✅ Tabellräkningar sparade: $TABLE_COUNTS_LOG"
    
    # Visa topp 10 största tabeller
    echo ""
    log "Topp 10 största tabeller:"
    head -n 15 "$TABLE_COUNTS_LOG" | tail -n 10
    echo ""
  else
    warn "Kunde inte hämta tabellräkningar"
  fi
}

run_backup() {
  log "Startar backup till: $BACKUP_FILE"
  
  pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    > "$BACKUP_FILE" 2>&1
  
  if [ $? -eq 0 ]; then
    # Kontrollera filstorlek
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup klar: $BACKUP_FILE ($SIZE)"
    return 0
  else
    error "❌ Backup misslyckades"
    return 1
  fi
}

compress_backup() {
  log "Komprimerar backup..."
  
  gzip -f "$BACKUP_FILE"
  
  if [ $? -eq 0 ]; then
    COMPRESSED="${BACKUP_FILE}.gz"
    SIZE=$(du -h "$COMPRESSED" | cut -f1)
    log "✅ Backup komprimerad: $COMPRESSED ($SIZE)"
  else
    warn "Kunde inte komprimera backup"
  fi
}

cleanup_old_backups() {
  log "Rensar gamla backups (äldre än 30 dagar)..."
  
  find "$BACKUP_DIR" -name "dogplanner_backup_*.sql.gz" -mtime +30 -delete
  find "$LOGS_DIR" -name "*.txt" -mtime +30 -delete
  find "$LOGS_DIR" -name "*.log" -mtime +30 -delete
  
  log "✅ Gamla backups rensade"
}

generate_summary() {
  log "============================================"
  log "BACKUP SAMMANFATTNING"
  log "============================================"
  log "Tidpunkt: $DATE"
  log "Backup-fil: ${BACKUP_FILE}.gz"
  log "Integritet: $INTEGRITY_LOG"
  log "Tabellräkningar: $TABLE_COUNTS_LOG"
  log "Huvudlogg: $MAIN_LOG"
  log "============================================"
  
  # Räkna totalt antal rader i databasen
  TOTAL_ROWS=$(awk '{sum+=$2} END {print sum}' "$TABLE_COUNTS_LOG" 2>/dev/null || echo "N/A")
  log "Totalt antal rader: $TOTAL_ROWS"
  
  log "✅ Backup-process slutförd framgångsrikt!"
}

# ============================================================
# HUVUDPROGRAM
# ============================================================

main() {
  echo ""
  log "🚀 Startar DogPlanner Backup & Verification"
  echo ""
  
  # 1. Förutsättningar
  check_prerequisites
  
  # 2. Skapa mappar
  create_directories
  
  # 3. Verifiera integritet FÖRE backup
  if ! verify_database_integrity; then
    error "Integritetskontroll misslyckades! Backup avbryts."
    exit 1
  fi
  
  # 4. Hämta tabellräkningar
  get_table_counts
  
  # 5. Kör backup
  if ! run_backup; then
    error "Backup misslyckades!"
    exit 1
  fi
  
  # 6. Komprimera backup
  compress_backup
  
  # 7. Rensa gamla backups
  cleanup_old_backups
  
  # 8. Sammanfattning
  generate_summary
  
  echo ""
  log "🎉 Backup-verifiering slutförd!"
  echo ""
}

# Kör huvudprogram
main
