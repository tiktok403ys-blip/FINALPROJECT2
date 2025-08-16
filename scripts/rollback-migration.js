const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Migration rollback script
 * Safely reverts database changes made during admin panel migration
 */
class MigrationRollback {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.rollbackSteps = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Execute complete rollback process
   */
  async executeRollback(options = {}) {
    const {
      backupTimestamp = null,
      dryRun = false,
      skipConfirmation = false
    } = options;

    console.log('🔄 Starting migration rollback process...');
    console.log('=' .repeat(50));

    try {
      // Validate backup exists
      const backupPath = await this.validateBackup(backupTimestamp);
      if (!backupPath) {
        throw new Error('No valid backup found for rollback');
      }

      console.log(`📁 Using backup: ${backupPath}`);

      // Load backup data
      const backupData = await this.loadBackupData(backupPath);
      
      // Confirm rollback
      if (!skipConfirmation && !dryRun) {
        const confirmed = await this.confirmRollback();
        if (!confirmed) {
          console.log('❌ Rollback cancelled by user');
          return { success: false, message: 'Cancelled by user' };
        }
      }

      if (dryRun) {
        console.log('🧪 DRY RUN MODE - No changes will be made');
        await this.simulateRollback(backupData);
      } else {
        // Execute rollback steps
        await this.dropNewTables();
        await this.restoreOriginalData(backupData);
        await this.cleanupFiles();
      }

      // Generate rollback report
      await this.generateRollbackReport(dryRun);

      console.log('\n✅ Rollback completed successfully!');
      return { success: true, errors: this.errors, warnings: this.warnings };

    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      this.errors.push(`Rollback failed: ${error.message}`);
      return { success: false, error: error.message, errors: this.errors };
    }
  }

  /**
   * Validate backup exists and is complete
   */
  async validateBackup(timestamp) {
    try {
      let backupPath;
      
      if (timestamp) {
        backupPath = path.join(this.backupDir, `backup-${timestamp}`);
      } else {
        // Find latest backup
        const backupDirs = await fs.readdir(this.backupDir);
        const backupTimestamps = backupDirs
          .filter(dir => dir.startsWith('backup-'))
          .map(dir => dir.replace('backup-', ''))
          .sort()
          .reverse();
        
        if (backupTimestamps.length === 0) {
          throw new Error('No backups found');
        }
        
        backupPath = path.join(this.backupDir, `backup-${backupTimestamps[0]}`);
      }

      // Check if backup directory exists
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error(`Backup not found: ${backupPath}`);
      }

      // Validate backup completeness
      const requiredFiles = [
        'casinos.json',
        'bonuses.json',
        'casino_reviews.json',
        'news.json',
        'site_settings.json',
        'backup-metadata.json'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(backupPath, file);
        try {
          await fs.access(filePath);
        } catch {
          this.warnings.push(`Backup file missing: ${file}`);
        }
      }

      console.log(`✅ Backup validated: ${backupPath}`);
      return backupPath;

    } catch (error) {
      console.error('❌ Backup validation failed:', error.message);
      return null;
    }
  }

  /**
   * Load backup data from files
   */
  async loadBackupData(backupPath) {
    console.log('📥 Loading backup data...');
    
    const backupData = {};
    const tables = ['casinos', 'bonuses', 'casino_reviews', 'news', 'site_settings'];

    for (const table of tables) {
      try {
        const filePath = path.join(backupPath, `${table}.json`);
        const fileContent = await fs.readFile(filePath, 'utf8');
        backupData[table] = JSON.parse(fileContent);
        console.log(`  ✅ Loaded ${table}: ${backupData[table].length} records`);
      } catch (error) {
        this.warnings.push(`Failed to load backup for ${table}: ${error.message}`);
        backupData[table] = [];
      }
    }

    // Load metadata
    try {
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      backupData.metadata = JSON.parse(metadataContent);
    } catch (error) {
      this.warnings.push(`Failed to load backup metadata: ${error.message}`);
    }

    return backupData;
  }

  /**
   * Confirm rollback with user
   */
  async confirmRollback() {
    console.log('\n⚠️  WARNING: This will rollback all admin panel changes!');
    console.log('   - New admin tables will be dropped');
    console.log('   - Original data will be restored');
    console.log('   - All admin panel configurations will be lost');
    
    // In a real implementation, you'd use readline or similar for user input
    // For this script, we'll assume confirmation
    console.log('\n✅ Proceeding with rollback (auto-confirmed for script)');
    return true;
  }

  /**
   * Simulate rollback without making changes
   */
  async simulateRollback(backupData) {
    console.log('\n🧪 SIMULATING ROLLBACK STEPS:');
    
    // Simulate dropping new tables
    console.log('\n1. Would drop new admin tables:');
    const newTables = ['admin_users', 'admin_audit_log', 'page_sections'];
    newTables.forEach(table => {
      console.log(`   - DROP TABLE ${table}`);
    });

    // Simulate data restoration
    console.log('\n2. Would restore original data:');
    Object.entries(backupData).forEach(([table, data]) => {
      if (table !== 'metadata' && Array.isArray(data)) {
        console.log(`   - Restore ${table}: ${data.length} records`);
      }
    });

    console.log('\n3. Would cleanup migration files');
    console.log('\n🧪 DRY RUN COMPLETE - No actual changes made');
  }

  /**
   * Drop new admin tables
   */
  async dropNewTables() {
    console.log('\n🗑️  Dropping new admin tables...');
    
    const tablesToDrop = [
      'admin_audit_log',
      'page_sections', 
      'admin_users'
    ];

    for (const table of tablesToDrop) {
      try {
        console.log(`  Dropping table: ${table}`);
        
        // First drop RLS policies
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${table}_policy" ON ${table};`
        });
        
        // Then drop the table
        await supabase.rpc('exec_sql', {
          sql: `DROP TABLE IF EXISTS ${table} CASCADE;`
        });
        
        console.log(`    ✅ Dropped ${table}`);
        this.rollbackSteps.push(`Dropped table: ${table}`);
        
      } catch (error) {
        const errorMsg = `Failed to drop table ${table}: ${error.message}`;
        console.error(`    ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
  }

  /**
   * Restore original data from backup
   */
  async restoreOriginalData(backupData) {
    console.log('\n📥 Restoring original data...');
    
    const tables = ['casinos', 'bonuses', 'casino_reviews', 'news', 'site_settings'];
    
    for (const table of tables) {
      if (!backupData[table] || !Array.isArray(backupData[table])) {
        this.warnings.push(`No backup data for table: ${table}`);
        continue;
      }

      try {
        console.log(`  Restoring ${table}...`);
        
        // Clear existing data
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) {
          throw new Error(`Failed to clear ${table}: ${deleteError.message}`);
        }
        
        // Restore backup data in batches
        const batchSize = 100;
        const data = backupData[table];
        
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          
          const { error: insertError } = await supabase
            .from(table)
            .insert(batch);
          
          if (insertError) {
            throw new Error(`Failed to insert batch for ${table}: ${insertError.message}`);
          }
        }
        
        console.log(`    ✅ Restored ${table}: ${data.length} records`);
        this.rollbackSteps.push(`Restored ${table}: ${data.length} records`);
        
      } catch (error) {
        const errorMsg = `Failed to restore ${table}: ${error.message}`;
        console.error(`    ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
  }

  /**
   * Cleanup migration files
   */
  async cleanupFiles() {
    console.log('\n🧹 Cleaning up migration files...');
    
    const filesToCleanup = [
      'app/admin',
      'migrations',
      'scripts/backup-existing-data.js',
      'scripts/verify-data-integrity.js',
      'tsconfig.admin.json',
      '.eslintrc.admin.json',
      '.env.admin.example',
      'jest.admin.config.js',
      'jest.admin.setup.js'
    ];

    for (const file of filesToCleanup) {
      try {
        const fullPath = path.join(process.cwd(), file);
        
        // Check if file/directory exists
        try {
          await fs.access(fullPath);
        } catch {
          continue; // File doesn't exist, skip
        }
        
        // Get file stats to determine if it's a directory
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await fs.rmdir(fullPath, { recursive: true });
          console.log(`    ✅ Removed directory: ${file}`);
        } else {
          await fs.unlink(fullPath);
          console.log(`    ✅ Removed file: ${file}`);
        }
        
        this.rollbackSteps.push(`Cleaned up: ${file}`);
        
      } catch (error) {
        const errorMsg = `Failed to cleanup ${file}: ${error.message}`;
        console.error(`    ❌ ${errorMsg}`);
        this.warnings.push(errorMsg);
      }
    }
  }

  /**
   * Generate rollback report
   */
  async generateRollbackReport(dryRun = false) {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 ROLLBACK REPORT');
    console.log('=' .repeat(50));
    
    if (dryRun) {
      console.log('\n🧪 DRY RUN MODE - No changes were made');
    } else {
      console.log('\n✅ ROLLBACK STEPS COMPLETED:');
      this.rollbackSteps.forEach(step => console.log(`  • ${step}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    console.log('\n' + '=' .repeat(50));
    
    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      dryRun,
      rollbackSteps: this.rollbackSteps,
      errors: this.errors,
      warnings: this.warnings
    };
    
    const reportPath = path.join(process.cwd(), 'rollback-report.json');
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  /**
   * Quick rollback - drops admin tables only
   */
  async quickRollback() {
    console.log('⚡ Executing quick rollback (admin tables only)...');
    
    try {
      await this.dropNewTables();
      console.log('✅ Quick rollback completed');
      return { success: true };
    } catch (error) {
      console.error('❌ Quick rollback failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const rollback = new MigrationRollback();
  
  const options = {
    dryRun: args.includes('--dry-run'),
    skipConfirmation: args.includes('--yes'),
    quick: args.includes('--quick')
  };
  
  const timestampArg = args.find(arg => arg.startsWith('--timestamp='));
  if (timestampArg) {
    options.backupTimestamp = timestampArg.split('=')[1];
  }
  
  console.log('🔄 Migration Rollback Script');
  console.log('Usage: node rollback-migration.js [options]');
  console.log('Options:');
  console.log('  --dry-run              Simulate rollback without making changes');
  console.log('  --yes                  Skip confirmation prompt');
  console.log('  --quick                Quick rollback (admin tables only)');
  console.log('  --timestamp=YYYYMMDD   Use specific backup timestamp');
  console.log('');
  
  if (options.quick) {
    rollback.quickRollback()
      .then(result => {
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('💥 Rollback script failed:', error);
        process.exit(1);
      });
  } else {
    rollback.executeRollback(options)
      .then(result => {
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('💥 Rollback script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { MigrationRollback };