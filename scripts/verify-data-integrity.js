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
 * Data integrity verification script
 * Validates database consistency, foreign key constraints, and data quality
 */
class DataIntegrityVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      tablesChecked: 0,
      recordsValidated: 0,
      constraintsChecked: 0,
      orphanedRecords: 0,
      duplicateRecords: 0
    };
  }

  /**
   * Run all integrity checks
   */
  async runAllChecks() {
    console.log('🔍 Starting data integrity verification...');
    console.log('=' .repeat(50));

    try {
      // Core table checks
      await this.checkCasinosTable();
      await this.checkBonusesTable();
      await this.checkReviewsTable();
      await this.checkNewsTable();
      await this.checkUsersTable();
      await this.checkSiteSettingsTable();
      
      // Admin panel specific checks
      await this.checkAdminUsersTable();
      await this.checkAuditLogTable();
      await this.checkPageSectionsTable();
      
      // Cross-table relationship checks
      await this.checkForeignKeyConstraints();
      await this.checkOrphanedRecords();
      await this.checkDuplicateRecords();
      
      // Data quality checks
      await this.checkDataQuality();
      await this.checkIndexes();
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      this.errors.push(`Verification failed: ${error.message}`);
    }

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      stats: this.stats
    };
  }

  /**
   * Check casinos table integrity
   */
  async checkCasinosTable() {
    console.log('📊 Checking casinos table...');
    this.stats.tablesChecked++;

    try {
      const { data: casinos, error } = await supabase
        .from('casinos')
        .select('*');

      if (error) throw error;

      this.stats.recordsValidated += casinos.length;

      // Check required fields
      casinos.forEach(casino => {
        if (!casino.name || casino.name.trim() === '') {
          this.errors.push(`Casino ID ${casino.id}: Missing or empty name`);
        }
        
        if (!casino.slug || casino.slug.trim() === '') {
          this.errors.push(`Casino ID ${casino.id}: Missing or empty slug`);
        }
        
        if (casino.rating && (casino.rating < 0 || casino.rating > 10)) {
          this.errors.push(`Casino ID ${casino.id}: Invalid rating ${casino.rating}`);
        }
        
        if (casino.website_url && !this.isValidUrl(casino.website_url)) {
          this.warnings.push(`Casino ID ${casino.id}: Invalid website URL`);
        }
      });

      // Check for duplicate slugs
      const slugs = casinos.map(c => c.slug).filter(Boolean);
      const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
      if (duplicateSlugs.length > 0) {
        this.errors.push(`Duplicate casino slugs found: ${duplicateSlugs.join(', ')}`);
      }

      console.log(`✅ Casinos table: ${casinos.length} records validated`);

    } catch (error) {
      this.errors.push(`Casinos table check failed: ${error.message}`);
    }
  }

  /**
   * Check bonuses table integrity
   */
  async checkBonusesTable() {
    console.log('🎁 Checking bonuses table...');
    this.stats.tablesChecked++;

    try {
      const { data: bonuses, error } = await supabase
        .from('bonuses')
        .select('*');

      if (error) throw error;

      this.stats.recordsValidated += bonuses.length;

      bonuses.forEach(bonus => {
        if (!bonus.title || bonus.title.trim() === '') {
          this.errors.push(`Bonus ID ${bonus.id}: Missing or empty title`);
        }
        
        if (bonus.amount && bonus.amount < 0) {
          this.errors.push(`Bonus ID ${bonus.id}: Negative bonus amount`);
        }
        
        if (bonus.wagering_requirement && bonus.wagering_requirement < 0) {
          this.errors.push(`Bonus ID ${bonus.id}: Negative wagering requirement`);
        }
        
        if (bonus.expiry_date && new Date(bonus.expiry_date) < new Date()) {
          this.warnings.push(`Bonus ID ${bonus.id}: Expired bonus`);
        }
      });

      console.log(`✅ Bonuses table: ${bonuses.length} records validated`);

    } catch (error) {
      this.errors.push(`Bonuses table check failed: ${error.message}`);
    }
  }

  /**
   * Check reviews table integrity
   */
  async checkReviewsTable() {
    console.log('⭐ Checking reviews table...');
    this.stats.tablesChecked++;

    try {
      const { data: reviews, error } = await supabase
        .from('casino_reviews')
        .select('*');

      if (error) throw error;

      this.stats.recordsValidated += reviews.length;

      reviews.forEach(review => {
        if (review.rating && (review.rating < 1 || review.rating > 5)) {
          this.errors.push(`Review ID ${review.id}: Invalid rating ${review.rating}`);
        }
        
        if (!review.content || review.content.trim() === '') {
          this.warnings.push(`Review ID ${review.id}: Empty review content`);
        }
        
        if (review.content && review.content.length < 10) {
          this.warnings.push(`Review ID ${review.id}: Very short review content`);
        }
      });

      console.log(`✅ Reviews table: ${reviews.length} records validated`);

    } catch (error) {
      this.errors.push(`Reviews table check failed: ${error.message}`);
    }
  }

  /**
   * Check news table integrity
   */
  async checkNewsTable() {
    console.log('📰 Checking news table...');
    this.stats.tablesChecked++;

    try {
      const { data: news, error } = await supabase
        .from('news')
        .select('*');

      if (error) throw error;

      this.stats.recordsValidated += news.length;

      news.forEach(article => {
        if (!article.title || article.title.trim() === '') {
          this.errors.push(`News ID ${article.id}: Missing or empty title`);
        }
        
        if (!article.slug || article.slug.trim() === '') {
          this.errors.push(`News ID ${article.id}: Missing or empty slug`);
        }
        
        if (!article.content || article.content.trim() === '') {
          this.errors.push(`News ID ${article.id}: Missing or empty content`);
        }
        
        if (article.published_at && new Date(article.published_at) > new Date()) {
          this.warnings.push(`News ID ${article.id}: Future publication date`);
        }
      });

      console.log(`✅ News table: ${news.length} records validated`);

    } catch (error) {
      this.errors.push(`News table check failed: ${error.message}`);
    }
  }

  /**
   * Check users table integrity
   */
  async checkUsersTable() {
    console.log('👥 Checking users table...');
    this.stats.tablesChecked++;

    try {
      // Check auth.users table
      const { data: users, error } = await supabase.auth.admin.listUsers();

      if (error) throw error;

      this.stats.recordsValidated += users.users.length;

      users.users.forEach(user => {
        if (!user.email || !this.isValidEmail(user.email)) {
          this.errors.push(`User ID ${user.id}: Invalid email address`);
        }
        
        if (!user.email_confirmed_at) {
          this.warnings.push(`User ID ${user.id}: Email not confirmed`);
        }
      });

      console.log(`✅ Users table: ${users.users.length} records validated`);

    } catch (error) {
      this.errors.push(`Users table check failed: ${error.message}`);
    }
  }

  /**
   * Check site settings table integrity
   */
  async checkSiteSettingsTable() {
    console.log('⚙️ Checking site settings table...');
    this.stats.tablesChecked++;

    try {
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      this.stats.recordsValidated += settings.length;

      // Check for required settings
      const requiredSettings = ['site_name', 'site_description', 'contact_email'];
      const existingKeys = settings.map(s => s.key);
      
      requiredSettings.forEach(key => {
        if (!existingKeys.includes(key)) {
          this.warnings.push(`Missing required site setting: ${key}`);
        }
      });

      console.log(`✅ Site settings table: ${settings.length} records validated`);

    } catch (error) {
      this.errors.push(`Site settings table check failed: ${error.message}`);
    }
  }

  /**
   * Check admin users table integrity
   */
  async checkAdminUsersTable() {
    console.log('👨‍💼 Checking admin users table...');
    this.stats.tablesChecked++;

    try {
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('*');

      if (error) {
        this.warnings.push('Admin users table not found - may not be migrated yet');
        return;
      }

      this.stats.recordsValidated += adminUsers.length;

      adminUsers.forEach(user => {
        if (!user.email || !this.isValidEmail(user.email)) {
          this.errors.push(`Admin user ID ${user.id}: Invalid email address`);
        }
        
        if (!['super_admin', 'admin', 'editor', 'viewer'].includes(user.role)) {
          this.errors.push(`Admin user ID ${user.id}: Invalid role ${user.role}`);
        }
      });

      console.log(`✅ Admin users table: ${adminUsers.length} records validated`);

    } catch (error) {
      this.warnings.push(`Admin users table check failed: ${error.message}`);
    }
  }

  /**
   * Check audit log table integrity
   */
  async checkAuditLogTable() {
    console.log('📋 Checking audit log table...');
    this.stats.tablesChecked++;

    try {
      const { data: auditLogs, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .limit(1000);

      if (error) {
        this.warnings.push('Audit log table not found - may not be migrated yet');
        return;
      }

      this.stats.recordsValidated += auditLogs.length;

      auditLogs.forEach(log => {
        if (!log.action || log.action.trim() === '') {
          this.errors.push(`Audit log ID ${log.id}: Missing action`);
        }
        
        if (!['low', 'medium', 'high', 'critical'].includes(log.severity)) {
          this.errors.push(`Audit log ID ${log.id}: Invalid severity ${log.severity}`);
        }
      });

      console.log(`✅ Audit log table: ${auditLogs.length} records validated`);

    } catch (error) {
      this.warnings.push(`Audit log table check failed: ${error.message}`);
    }
  }

  /**
   * Check page sections table integrity
   */
  async checkPageSectionsTable() {
    console.log('📄 Checking page sections table...');
    this.stats.tablesChecked++;

    try {
      const { data: sections, error } = await supabase
        .from('page_sections')
        .select('*');

      if (error) {
        this.warnings.push('Page sections table not found - may not be migrated yet');
        return;
      }

      this.stats.recordsValidated += sections.length;

      sections.forEach(section => {
        if (!section.page_name || section.page_name.trim() === '') {
          this.errors.push(`Page section ID ${section.id}: Missing page name`);
        }
        
        if (!section.section_type || section.section_type.trim() === '') {
          this.errors.push(`Page section ID ${section.id}: Missing section type`);
        }
        
        if (section.display_order && section.display_order < 0) {
          this.errors.push(`Page section ID ${section.id}: Invalid display order`);
        }
      });

      console.log(`✅ Page sections table: ${sections.length} records validated`);

    } catch (error) {
      this.warnings.push(`Page sections table check failed: ${error.message}`);
    }
  }

  /**
   * Check foreign key constraints
   */
  async checkForeignKeyConstraints() {
    console.log('🔗 Checking foreign key constraints...');
    this.stats.constraintsChecked++;

    try {
      // Check casino-bonus relationships
      const { data: bonuses } = await supabase
        .from('bonuses')
        .select('id, casino_id')
        .not('casino_id', 'is', null);

      if (bonuses) {
        for (const bonus of bonuses) {
          const { data: casino } = await supabase
            .from('casinos')
            .select('id')
            .eq('id', bonus.casino_id)
            .single();

          if (!casino) {
            this.errors.push(`Bonus ID ${bonus.id}: References non-existent casino ${bonus.casino_id}`);
            this.stats.orphanedRecords++;
          }
        }
      }

      // Check review-casino relationships
      const { data: reviews } = await supabase
        .from('casino_reviews')
        .select('id, casino_id')
        .not('casino_id', 'is', null);

      if (reviews) {
        for (const review of reviews) {
          const { data: casino } = await supabase
            .from('casinos')
            .select('id')
            .eq('id', review.casino_id)
            .single();

          if (!casino) {
            this.errors.push(`Review ID ${review.id}: References non-existent casino ${review.casino_id}`);
            this.stats.orphanedRecords++;
          }
        }
      }

      console.log('✅ Foreign key constraints checked');

    } catch (error) {
      this.errors.push(`Foreign key constraint check failed: ${error.message}`);
    }
  }

  /**
   * Check for orphaned records
   */
  async checkOrphanedRecords() {
    console.log('🔍 Checking for orphaned records...');

    // This is covered in foreign key constraints check
    console.log('✅ Orphaned records check completed');
  }

  /**
   * Check for duplicate records
   */
  async checkDuplicateRecords() {
    console.log('🔄 Checking for duplicate records...');

    try {
      // Check duplicate casino slugs
      const { data: casinoSlugs } = await supabase
        .from('casinos')
        .select('slug')
        .not('slug', 'is', null);

      if (casinoSlugs) {
        const slugCounts = {};
        casinoSlugs.forEach(({ slug }) => {
          slugCounts[slug] = (slugCounts[slug] || 0) + 1;
        });

        Object.entries(slugCounts).forEach(([slug, count]) => {
          if (count > 1) {
            this.errors.push(`Duplicate casino slug: ${slug} (${count} occurrences)`);
            this.stats.duplicateRecords++;
          }
        });
      }

      // Check duplicate news slugs
      const { data: newsSlugs } = await supabase
        .from('news')
        .select('slug')
        .not('slug', 'is', null);

      if (newsSlugs) {
        const slugCounts = {};
        newsSlugs.forEach(({ slug }) => {
          slugCounts[slug] = (slugCounts[slug] || 0) + 1;
        });

        Object.entries(slugCounts).forEach(([slug, count]) => {
          if (count > 1) {
            this.errors.push(`Duplicate news slug: ${slug} (${count} occurrences)`);
            this.stats.duplicateRecords++;
          }
        });
      }

      console.log('✅ Duplicate records check completed');

    } catch (error) {
      this.errors.push(`Duplicate records check failed: ${error.message}`);
    }
  }

  /**
   * Check data quality
   */
  async checkDataQuality() {
    console.log('🎯 Checking data quality...');

    try {
      // Check for empty or very short content
      const { data: news } = await supabase
        .from('news')
        .select('id, title, content')
        .not('content', 'is', null);

      if (news) {
        news.forEach(article => {
          if (article.content && article.content.length < 100) {
            this.warnings.push(`News ID ${article.id}: Very short content (${article.content.length} chars)`);
          }
        });
      }

      // Check for missing images
      const { data: casinos } = await supabase
        .from('casinos')
        .select('id, name, logo_url')
        .is('logo_url', null);

      if (casinos && casinos.length > 0) {
        this.warnings.push(`${casinos.length} casinos missing logo images`);
      }

      console.log('✅ Data quality check completed');

    } catch (error) {
      this.errors.push(`Data quality check failed: ${error.message}`);
    }
  }

  /**
   * Check database indexes
   */
  async checkIndexes() {
    console.log('📊 Checking database indexes...');

    try {
      // This would require database admin privileges to check pg_indexes
      // For now, we'll just log that this check is not implemented
      this.warnings.push('Index optimization check requires database admin privileges');
      
      console.log('⚠️ Index check skipped (requires admin privileges)');

    } catch (error) {
      this.warnings.push(`Index check failed: ${error.message}`);
    }
  }

  /**
   * Generate integrity report
   */
  async generateReport() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 DATA INTEGRITY VERIFICATION REPORT');
    console.log('=' .repeat(50));
    
    console.log('\n📈 STATISTICS:');
    console.log(`Tables checked: ${this.stats.tablesChecked}`);
    console.log(`Records validated: ${this.stats.recordsValidated}`);
    console.log(`Constraints checked: ${this.stats.constraintsChecked}`);
    console.log(`Orphaned records found: ${this.stats.orphanedRecords}`);
    console.log(`Duplicate records found: ${this.stats.duplicateRecords}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All checks passed! Database integrity is good.');
    }
    
    console.log('\n' + '=' .repeat(50));
    
    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings
    };
    
    const reportPath = path.join(process.cwd(), 'integrity-report.json');
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  /**
   * Utility: Check if URL is valid
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Utility: Check if email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new DataIntegrityVerifier();
  verifier.runAllChecks()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Data integrity verification completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Data integrity verification found issues!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { DataIntegrityVerifier };