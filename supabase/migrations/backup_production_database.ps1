# Production Database Backup Script (PowerShell)
# Purpose: Create backup before security fix deployment
# Usage: .\backup_production_database.ps1

Write-Host "Starting production database backup..." -ForegroundColor Green

# Get current timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "backup_security_fix_$timestamp.sql"
$functionsBackup = "backup_functions_$timestamp.sql"

# Check if Supabase CLI is available
try {
    $supabaseVersion = supabase --version
    Write-Host "Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if production URL is set
if (-not $env:PRODUCTION_DB_URL) {
    Write-Host "Warning: PRODUCTION_DB_URL not set. Using default project." -ForegroundColor Yellow
}

Write-Host "Creating full database backup..." -ForegroundColor Cyan
# Create full database backup
try {
    if ($env:PRODUCTION_DB_URL) {
        supabase db dump --db-url $env:PRODUCTION_DB_URL | Out-File -FilePath $backupFile -Encoding UTF8
    } else {
        supabase db dump | Out-File -FilePath $backupFile -Encoding UTF8
    }
    Write-Host "Full backup created: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "Error creating full backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Creating functions-only backup..." -ForegroundColor Cyan
# Create functions-only backup for quick rollback
try {
    if ($env:PRODUCTION_DB_URL) {
        supabase db dump --db-url $env:PRODUCTION_DB_URL --schema public --data-only=false | Out-File -FilePath $functionsBackup -Encoding UTF8
    } else {
        supabase db dump --schema public --data-only=false | Out-File -FilePath $functionsBackup -Encoding UTF8
    }
    Write-Host "Functions backup created: $functionsBackup" -ForegroundColor Green
} catch {
    Write-Host "Error creating functions backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Full backup: $backupFile" -ForegroundColor White
Write-Host "Functions backup: $functionsBackup" -ForegroundColor White

# Get backup file size
$backupSize = (Get-Item $backupFile).Length
$backupSizeKB = [math]::Round($backupSize / 1KB, 2)
Write-Host "Backup size: $backupSizeKB KB" -ForegroundColor White

# Verify backup integrity
Write-Host "Verifying backup integrity..." -ForegroundColor Cyan

if ((Get-Item $backupFile).Length -gt 0) {
    Write-Host "Backup file is not empty" -ForegroundColor Green
    
    # Check if backup contains expected content
    $backupContent = Get-Content $backupFile -Raw
    
    if ($backupContent -match "CREATE FUNCTION") {
        Write-Host "Backup contains function definitions" -ForegroundColor Green
    } else {
        Write-Host "Warning: Backup may not contain function definitions" -ForegroundColor Yellow
    }
    
    if ($backupContent -match "SECURITY DEFINER") {
        Write-Host "Backup contains SECURITY DEFINER functions" -ForegroundColor Green
    } else {
        Write-Host "Warning: No SECURITY DEFINER functions found in backup" -ForegroundColor Yellow
    }
} else {
    Write-Host "Error: Backup file is empty or not created" -ForegroundColor Red
    exit 1
}

Write-Host "Backup verification completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review backup files" -ForegroundColor White
Write-Host "   2. Test rollback script" -ForegroundColor White
Write-Host "   3. Proceed with Tier 1 deployment" -ForegroundColor White

# Export backup file names for use in other scripts
$backupVarsContent = @"
`$env:BACKUP_FILE = '$backupFile'
`$env:FUNCTIONS_BACKUP = '$functionsBackup'
`$env:BACKUP_TIMESTAMP = '$timestamp'
"@

$backupVarsContent | Out-File -FilePath 'backup_vars.ps1' -Encoding UTF8
Write-Host "Backup variables exported to backup_vars.ps1" -ForegroundColor Green

# Create backup summary
$summary = @{
    timestamp = Get-Date
    backupFile = $backupFile
    functionsBackup = $functionsBackup
    backupSizeKB = $backupSizeKB
    status = 'completed'
}

$summary | ConvertTo-Json | Out-File -FilePath "backup_summary_$timestamp.json" -Encoding UTF8
Write-Host "Backup summary saved to backup_summary_$timestamp.json" -ForegroundColor Green

Write-Host "Ready for Tier 1 deployment!" -ForegroundColor Green