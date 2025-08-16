const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tables to backup
const TABLES_TO_BACKUP = [
  'casinos',
  'bonuses',
  'casino_reviews',
  'news',
  'site_settings'
];

async function createBackupDirectory() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log(`✅ Backup directory created: ${BACKUP_DIR}`);
  } catch (error) {
    console.error('❌ Failed to create backup directory:', error);
    throw error;
  }
}

async function backupTable(tableName) {
  try {
    console.log(`📦 Backing up table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      throw error;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${tableName}_backup_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    console.log(`✅ ${tableName} backed up successfully (${data?.length || 0} records)`);
    return {
      table: tableName,
      filename,
      recordCount: data?.length || 0,
      filepath
    };
  } catch (error) {
    console.error(`❌ Failed to backup table ${tableName}:`, error);
    throw error;
  }
}

async function backupDatabase() {
  try {
    console.log('🚀 Starting database backup...');
    
    await createBackupDirectory();
    
    const backupResults = [];
    
    for (const tableName of TABLES_TO_BACKUP) {
      const result = await backupTable(tableName);
      backupResults.push(result);
    }
    
    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      tables: backupResults,
      totalRecords: backupResults.reduce((sum, result) => sum + result.recordCount, 0)
    };
    
    const manifestPath = path.join(BACKUP_DIR, `backup_manifest_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('\n📋 Backup Summary:');
    console.log('==================');
    backupResults.forEach(result => {
      console.log(`${result.table}: ${result.recordCount} records`);
    });
    console.log(`Total: ${manifest.totalRecords} records`);
    console.log(`Manifest: ${manifestPath}`);
    
    console.log('\n✅ Database backup completed successfully!');
    return manifest;
    
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  }
}

async function verifyBackup(manifest) {
  try {
    console.log('\n🔍 Verifying backup integrity...');
    
    for (const tableInfo of manifest.tables) {
      const filepath = tableInfo.filepath;
      
      try {
        const fileContent = await fs.readFile(filepath, 'utf8');
        const data = JSON.parse(fileContent);
        
        if (data.length !== tableInfo.recordCount) {
          throw new Error(`Record count mismatch for ${tableInfo.table}`);
        }
        
        console.log(`✅ ${tableInfo.table}: Verified ${data.length} records`);
      } catch (error) {
        console.error(`❌ Verification failed for ${tableInfo.table}:`, error);
        throw error;
      }
    }
    
    console.log('✅ Backup verification completed successfully!');
  } catch (error) {
    console.error('❌ Backup verification failed:', error);
    throw error;
  }
}

async function createRollbackScript(manifest) {
  try {
    console.log('\n📝 Creating rollback script...');
    
    const rollbackScript = `
-- Rollback Script
-- Generated: ${manifest.timestamp}
-- Use this script to restore data if needed

-- WARNING: This will delete existing data and restore from backup
-- Make sure to backup current data before running this script

${manifest.tables.map(table => `
-- Restore ${table.table}
DELETE FROM ${table.table};
-- Then manually import data from: ${table.filename}
`).join('')}

-- Manual steps required:
-- 1. Delete all data from tables above
-- 2. Import JSON data from backup files
-- 3. Verify data integrity
-- 4. Update sequences if needed
`;
    
    const rollbackPath = path.join(BACKUP_DIR, `rollback_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
    await fs.writeFile(rollbackPath, rollbackScript);
    
    console.log(`✅ Rollback script created: ${rollbackPath}`);
  } catch (error) {
    console.error('❌ Failed to create rollback script:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const manifest = await backupDatabase();
    await verifyBackup(manifest);
    await createRollbackScript(manifest);
    
    console.log('\n🎉 Backup process completed successfully!');
    console.log('You can now proceed with the admin panel restructuring.');
    
  } catch (error) {
    console.error('\n💥 Backup process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  backupDatabase,
  verifyBackup,
  createRollbackScript
};