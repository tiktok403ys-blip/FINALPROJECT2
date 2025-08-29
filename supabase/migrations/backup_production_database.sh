#!/bin/bash
# Production Database Backup Script
# Purpose: Create backup before security fix deployment
# Usage: ./backup_production_database.sh

set -e

echo "🚀 Starting production database backup..."

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_security_fix_${TIMESTAMP}.sql"
FUNCTIONS_BACKUP="backup_functions_${TIMESTAMP}.sql"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    exit 1
fi

# Check if production URL is set
if [ -z "$PRODUCTION_DB_URL" ]; then
    echo "⚠️  Warning: PRODUCTION_DB_URL not set. Using default project."
fi

echo "📦 Creating full database backup..."
# Create full database backup
if [ -n "$PRODUCTION_DB_URL" ]; then
    supabase db dump --db-url "$PRODUCTION_DB_URL" > "$BACKUP_FILE"
else
    supabase db dump > "$BACKUP_FILE"
fi

echo "🔧 Creating functions-only backup..."
# Create functions-only backup for quick rollback
if [ -n "$PRODUCTION_DB_URL" ]; then
    supabase db dump --db-url "$PRODUCTION_DB_URL" --schema public --data-only=false > "$FUNCTIONS_BACKUP"
else
    supabase db dump --schema public --data-only=false > "$FUNCTIONS_BACKUP"
fi

echo "✅ Backup completed successfully!"
echo "📁 Full backup: $BACKUP_FILE"
echo "🔧 Functions backup: $FUNCTIONS_BACKUP"
echo "📊 Backup size: $(du -h $BACKUP_FILE | cut -f1)"

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if [ -s "$BACKUP_FILE" ]; then
    echo "✅ Backup file is not empty"
    
    # Check if backup contains expected content
    if grep -q "CREATE FUNCTION" "$BACKUP_FILE"; then
        echo "✅ Backup contains function definitions"
    else
        echo "⚠️  Warning: Backup may not contain function definitions"
    fi
    
    if grep -q "SECURITY DEFINER" "$BACKUP_FILE"; then
        echo "✅ Backup contains SECURITY DEFINER functions"
    else
        echo "⚠️  Warning: No SECURITY DEFINER functions found in backup"
    fi
else
    echo "❌ Error: Backup file is empty or not created"
    exit 1
fi

echo "🎯 Backup verification completed!"
echo "📋 Next steps:"
echo "   1. Review backup files"
echo "   2. Test rollback script"
echo "   3. Proceed with Tier 1 deployment"

# Export backup file names for use in other scripts
echo "export BACKUP_FILE='$BACKUP_FILE'" > backup_vars.sh
echo "export FUNCTIONS_BACKUP='$FUNCTIONS_BACKUP'" >> backup_vars.sh
echo "export BACKUP_TIMESTAMP='$TIMESTAMP'" >> backup_vars.sh

echo "✅ Backup variables exported to backup_vars.sh"