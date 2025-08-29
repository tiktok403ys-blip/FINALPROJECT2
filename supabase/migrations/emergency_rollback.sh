#!/bin/bash
# Emergency Rollback Script - 30 Second Recovery
# Purpose: Instant rollback for production security fix deployment
# Usage: ./emergency_rollback.sh

set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED!"
echo "⏱️  Target: 30-second recovery time"

# Load backup variables
if [ -f "backup_vars.sh" ]; then
    source backup_vars.sh
    echo "📁 Using backup: $FUNCTIONS_BACKUP"
else
    echo "❌ Error: backup_vars.sh not found. Cannot determine backup file."
    echo "💡 Please specify backup file manually:"
    echo "   export FUNCTIONS_BACKUP='your_backup_file.sql'"
    exit 1
fi

# Verify backup file exists
if [ ! -f "$FUNCTIONS_BACKUP" ]; then
    echo "❌ Error: Backup file $FUNCTIONS_BACKUP not found!"
    echo "📋 Available backup files:"
    ls -la backup_functions_*.sql 2>/dev/null || echo "   No backup files found"
    exit 1
fi

echo "🔄 Starting rollback process..."
START_TIME=$(date +%s)

# Step 1: Quick health check
echo "🏥 Performing health check..."
if [ -n "$PRODUCTION_DB_URL" ]; then
    DB_STATUS=$(supabase db ping --db-url "$PRODUCTION_DB_URL" 2>&1 || echo "FAILED")
else
    DB_STATUS=$(supabase db ping 2>&1 || echo "FAILED")
fi

if [[ "$DB_STATUS" == *"FAILED"* ]]; then
    echo "❌ Database connection failed. Cannot proceed with rollback."
    exit 1
fi
echo "✅ Database connection OK"

# Step 2: Execute rollback
echo "⚡ Executing function rollback..."
if [ -n "$PRODUCTION_DB_URL" ]; then
    supabase db reset --db-url "$PRODUCTION_DB_URL" --file "$FUNCTIONS_BACKUP"
else
    supabase db reset --file "$FUNCTIONS_BACKUP"
fi

# Step 3: Verify rollback
echo "🔍 Verifying rollback success..."
if [ -n "$PRODUCTION_DB_URL" ]; then
    FUNCTION_COUNT=$(supabase db query --db-url "$PRODUCTION_DB_URL" "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND security_type = 'DEFINER'" --output csv | tail -n 1)
else
    FUNCTION_COUNT=$(supabase db query "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND security_type = 'DEFINER'" --output csv | tail -n 1)
fi

echo "📊 Security DEFINER functions restored: $FUNCTION_COUNT"

# Step 4: Test critical functions
echo "🧪 Testing critical functions..."
TEST_RESULTS=""

# Test is_authenticated
if [ -n "$PRODUCTION_DB_URL" ]; then
    AUTH_TEST=$(supabase db query --db-url "$PRODUCTION_DB_URL" "SELECT public.is_authenticated()" --output csv 2>&1 || echo "FAILED")
else
    AUTH_TEST=$(supabase db query "SELECT public.is_authenticated()" --output csv 2>&1 || echo "FAILED")
fi

if [[ "$AUTH_TEST" == *"FAILED"* ]]; then
    TEST_RESULTS="${TEST_RESULTS}❌ is_authenticated() FAILED\n"
else
    TEST_RESULTS="${TEST_RESULTS}✅ is_authenticated() OK\n"
fi

# Test is_admin
if [ -n "$PRODUCTION_DB_URL" ]; then
    ADMIN_TEST=$(supabase db query --db-url "$PRODUCTION_DB_URL" "SELECT public.is_admin()" --output csv 2>&1 || echo "FAILED")
else
    ADMIN_TEST=$(supabase db query "SELECT public.is_admin()" --output csv 2>&1 || echo "FAILED")
fi

if [[ "$ADMIN_TEST" == *"FAILED"* ]]; then
    TEST_RESULTS="${TEST_RESULTS}❌ is_admin() FAILED\n"
else
    TEST_RESULTS="${TEST_RESULTS}✅ is_admin() OK\n"
fi

# Calculate rollback time
END_TIME=$(date +%s)
ROLLBACK_TIME=$((END_TIME - START_TIME))

echo "⏱️  Rollback completed in: ${ROLLBACK_TIME} seconds"
echo "📋 Function test results:"
echo -e "$TEST_RESULTS"

if [ $ROLLBACK_TIME -le 30 ]; then
    echo "🎯 SUCCESS: Rollback completed within 30-second target!"
else
    echo "⚠️  WARNING: Rollback took longer than 30 seconds"
fi

# Step 5: Generate rollback report
REPORT_FILE="rollback_report_$(date +%Y%m%d_%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
=== EMERGENCY ROLLBACK REPORT ===
Timestamp: $(date)
Rollback Duration: ${ROLLBACK_TIME} seconds
Backup File Used: $FUNCTIONS_BACKUP
Database Status: Connected
Functions Restored: $FUNCTION_COUNT

Function Tests:
$TEST_RESULTS

Rollback Status: $([ $ROLLBACK_TIME -le 30 ] && echo "SUCCESS" || echo "DELAYED")

Next Actions:
1. Investigate root cause of deployment failure
2. Review rollback logs
3. Plan corrective deployment
4. Update team on rollback completion
EOF

echo "📄 Rollback report saved: $REPORT_FILE"
echo "🚨 EMERGENCY ROLLBACK COMPLETED!"
echo "📞 Notify team immediately of rollback completion"

# Alert thresholds check
if [ $ROLLBACK_TIME -gt 30 ]; then
    echo "⚠️  ALERT: Rollback exceeded 30-second SLA"
    echo "📋 Required actions:"
    echo "   1. Escalate to senior team"
    echo "   2. Review rollback procedure"
    echo "   3. Update emergency protocols"
fi