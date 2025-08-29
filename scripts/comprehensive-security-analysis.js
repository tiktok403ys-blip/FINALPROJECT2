const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://oypqykrfinmrvvsjfyqd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHF5a3JmaW5tcnZ2c2pmeXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM0MTQ5OSwiZXhwIjoyMDcwOTE3NDk5fQ.Yvk5InaPs0Sw4c4s3wQW_U58cQ6nq2tVXkP3HaY_Erg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Daftar 36 warnings dari Security Advisor berdasarkan screenshot
const KNOWN_WARNINGS_FROM_SCREENSHOT = [
  'change_avatar_url_limits',
  'change_admin_pin_content_at', 
  'is_owner',
  'is_authenticated',
  'is_admin',
  'set_profile_claim_insert',
  'set_admin_pin',
  'change_admin_pin_change',
  'get_user_favorites_with_schema',
  'verify_last_seen',
  'verify_casino_search_vector',
  'verify_log_admin_activity',
  'get_casino_details_mobile',
  'verify_casino_search_vector'
];

async function runSecurityAnalysisQuery(queryText) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: queryText });
    if (error) {
      console.error('Error executing query:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in query execution:', error);
    return null;
  }
}

async function comprehensiveSecurityAnalysis() {
  console.log('🔍 COMPREHENSIVE SECURITY ANALYSIS REPORT');
  console.log('==========================================\n');

  try {
    // 1. Analisis semua fungsi SECURITY DEFINER
    console.log('1. 📊 ANALISIS SEMUA FUNGSI SECURITY DEFINER...');
    console.log('===============================================');
    
    const securityDefinerQuery = `
      SELECT 
          routine_name,
          routine_type,
          security_type,
          CASE 
              WHEN routine_definition LIKE '%search_path%' THEN 'HAS_SEARCH_PATH'
              ELSE 'MISSING_SEARCH_PATH'
          END as search_path_status,
          CASE 
              WHEN routine_name LIKE '%_v2' THEN 'V2_FUNCTION'
              ELSE 'ORIGINAL_FUNCTION'
          END as function_version
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
          AND security_type = 'DEFINER'
      ORDER BY routine_name;
    `;
    
    const { data: securityDefinerFunctions, error: sdfError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, security_type')
      .eq('routine_schema', 'public')
      .eq('security_type', 'DEFINER');
    
    if (sdfError) {
      console.log('❌ Error getting security definer functions:', sdfError.message);
    } else {
      console.log(`📈 Total fungsi SECURITY DEFINER: ${securityDefinerFunctions?.length || 0}`);
      
      if (securityDefinerFunctions && securityDefinerFunctions.length > 0) {
        const originalFunctions = securityDefinerFunctions.filter(f => !f.routine_name.includes('_v2'));
        const v2Functions = securityDefinerFunctions.filter(f => f.routine_name.includes('_v2'));
        
        console.log(`  - Fungsi original: ${originalFunctions.length}`);
        console.log(`  - Fungsi _v2: ${v2Functions.length}`);
        
        console.log('\n📋 Daftar fungsi SECURITY DEFINER:');
        securityDefinerFunctions.forEach(func => {
          const type = func.routine_name.includes('_v2') ? '[V2]' : '[ORIG]';
          console.log(`  ${type} ${func.routine_name}`);
        });
      }
    }
    
    console.log();

    // 2. Analisis fungsi yang bermasalah (tanpa search_path)
    console.log('2. ⚠️  FUNGSI BERMASALAH (TANPA SEARCH_PATH)...');
    console.log('==============================================');
    
    // Karena kita tidak bisa akses routine_definition langsung, kita akan test fungsi yang diketahui
    const knownProblematicFunctions = [
      'is_authenticated', 'is_admin', 'is_owner',
      'change_avatar_url_limits', 'change_admin_pin_content_at',
      'set_profile_claim_insert', 'set_admin_pin', 'change_admin_pin_change',
      'get_user_favorites_with_schema', 'verify_last_seen',
      'verify_casino_search_vector', 'verify_log_admin_activity',
      'get_casino_details_mobile'
    ];
    
    console.log('🔍 Testing fungsi yang diketahui bermasalah:');
    const problematicFunctions = [];
    const workingFunctions = [];
    
    for (const funcName of knownProblematicFunctions) {
      try {
        // Test fungsi original
        const { error: originalError } = await supabase.rpc(funcName);
        if (!originalError) {
          workingFunctions.push(funcName);
          console.log(`  ✅ ${funcName} - tersedia`);
        } else {
          problematicFunctions.push(funcName);
          console.log(`  ❌ ${funcName} - error: ${originalError.message}`);
        }
      } catch (error) {
        problematicFunctions.push(funcName);
        console.log(`  ❌ ${funcName} - tidak tersedia`);
      }
    }
    
    console.log(`\n📊 Hasil testing:`);
    console.log(`  - Fungsi yang bekerja: ${workingFunctions.length}`);
    console.log(`  - Fungsi bermasalah: ${problematicFunctions.length}`);
    
    console.log();

    // 3. Analisis pasangan fungsi original vs v2
    console.log('3. 🔄 ANALISIS MIGRASI FUNGSI (ORIGINAL VS V2)...');
    console.log('===============================================');
    
    const criticalFunctions = ['is_authenticated', 'is_admin', 'is_owner'];
    const migrationStatus = {};
    
    for (const baseFunc of criticalFunctions) {
      const v2Func = `${baseFunc}_v2`;
      
      try {
        const { error: originalError } = await supabase.rpc(baseFunc);
        const { error: v2Error } = await supabase.rpc(v2Func);
        
        migrationStatus[baseFunc] = {
          original: !originalError,
          v2: !v2Error,
          status: !originalError && !v2Error ? 'READY_FOR_MIGRATION' :
                  !v2Error ? 'V2_AVAILABLE' :
                  !originalError ? 'NEEDS_V2_CREATION' : 'BOTH_MISSING'
        };
        
        console.log(`📋 ${baseFunc}:`);
        console.log(`  - Original: ${!originalError ? '✅' : '❌'}`);
        console.log(`  - V2: ${!v2Error ? '✅' : '❌'}`);
        console.log(`  - Status: ${migrationStatus[baseFunc].status}`);
        
      } catch (error) {
        migrationStatus[baseFunc] = {
          original: false,
          v2: false,
          status: 'BOTH_MISSING'
        };
        console.log(`❌ ${baseFunc}: Error testing - ${error.message}`);
      }
    }
    
    console.log();

    // 4. Analisis RLS policies
    console.log('4. 🛡️  ANALISIS RLS POLICIES...');
    console.log('==============================');
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('schemaname, tablename, policyname, qual')
        .eq('schemaname', 'public');
      
      if (policiesError) {
        console.log('❌ Error getting policies:', policiesError.message);
      } else {
        console.log(`📈 Total RLS policies: ${policies?.length || 0}`);
        
        if (policies && policies.length > 0) {
          const policiesUsingOriginal = policies.filter(p => 
            p.qual && (
              p.qual.includes('is_authenticated()') ||
              p.qual.includes('is_admin()') ||
              p.qual.includes('is_owner()')
            )
          );
          
          const policiesUsingV2 = policies.filter(p => 
            p.qual && (
              p.qual.includes('is_authenticated_v2()') ||
              p.qual.includes('is_admin_v2()') ||
              p.qual.includes('is_owner_v2()')
            )
          );
          
          console.log(`  - Policies menggunakan fungsi original: ${policiesUsingOriginal.length}`);
          console.log(`  - Policies menggunakan fungsi _v2: ${policiesUsingV2.length}`);
          
          if (policiesUsingOriginal.length > 0) {
            console.log('\n⚠️  Policies yang masih menggunakan fungsi original:');
            policiesUsingOriginal.forEach(policy => {
              console.log(`  - ${policy.tablename}.${policy.policyname}`);
            });
          }
          
          if (policiesUsingV2.length > 0) {
            console.log('\n✅ Policies yang sudah menggunakan fungsi _v2:');
            policiesUsingV2.forEach(policy => {
              console.log(`  - ${policy.tablename}.${policy.policyname}`);
            });
          }
        }
      }
    } catch (error) {
      console.log('❌ Error analyzing policies:', error.message);
    }
    
    console.log();

    // 5. Analisis mengapa masih ada 36 warnings
    console.log('5. 🔍 ANALISIS MENGAPA MASIH ADA 36 WARNINGS...');
    console.log('===============================================');
    
    const analysisResults = {
      totalSecurityDefinerFunctions: securityDefinerFunctions?.length || 0,
      workingFunctions: workingFunctions.length,
      problematicFunctions: problematicFunctions.length,
      migrationStatus
    };
    
    console.log('📊 Ringkasan temuan:');
    console.log(`  - Total fungsi SECURITY DEFINER: ${analysisResults.totalSecurityDefinerFunctions}`);
    console.log(`  - Fungsi yang bekerja: ${analysisResults.workingFunctions}`);
    console.log(`  - Fungsi bermasalah: ${analysisResults.problematicFunctions}`);
    
    console.log('\n🔍 Kemungkinan penyebab 36 warnings:');
    
    let issueCounter = 1;
    
    // Issue 1: Fungsi _v2 yang hilang
    const missingV2Functions = criticalFunctions.filter(func => 
      migrationStatus[func] && !migrationStatus[func].v2
    );
    
    if (missingV2Functions.length > 0) {
      console.log(`\n❌ ISSUE ${issueCounter++}: Fungsi _v2 yang hilang (${missingV2Functions.length})`);
      missingV2Functions.forEach(func => {
        console.log(`  - ${func}_v2 tidak tersedia`);
      });
      console.log('   💡 Impact: Security Advisor mendeteksi fungsi original tanpa search_path');
    }
    
    // Issue 2: Fungsi original masih aktif
    const activeOriginalFunctions = criticalFunctions.filter(func => 
      migrationStatus[func] && migrationStatus[func].original
    );
    
    if (activeOriginalFunctions.length > 0) {
      console.log(`\n⚠️  ISSUE ${issueCounter++}: Fungsi original masih aktif (${activeOriginalFunctions.length})`);
      activeOriginalFunctions.forEach(func => {
        console.log(`  - ${func} masih tersedia dan mungkin digunakan`);
      });
      console.log('   💡 Impact: RLS policies atau aplikasi masih menggunakan fungsi tidak aman');
    }
    
    // Issue 3: Fungsi lain yang belum dianalisis
    const otherProblematicFunctions = KNOWN_WARNINGS_FROM_SCREENSHOT.filter(func => 
      !criticalFunctions.includes(func)
    );
    
    if (otherProblematicFunctions.length > 0) {
      console.log(`\n🔍 ISSUE ${issueCounter++}: Fungsi lain yang bermasalah (${otherProblematicFunctions.length})`);
      otherProblematicFunctions.forEach(func => {
        console.log(`  - ${func} (dari screenshot Security Advisor)`);
      });
      console.log('   💡 Impact: Masih ada fungsi SECURITY DEFINER lain tanpa search_path');
    }
    
    console.log();

    // 6. Rekomendasi perbaikan prioritas
    console.log('6. 💡 REKOMENDASI PERBAIKAN PRIORITAS...');
    console.log('======================================');
    
    let priorityCounter = 1;
    
    // Priority 1: Buat fungsi _v2 yang hilang
    if (missingV2Functions.length > 0) {
      console.log(`\n🔥 PRIORITAS ${priorityCounter++}: Buat fungsi _v2 yang hilang`);
      console.log('   📝 Script SQL yang perlu dijalankan:');
      missingV2Functions.forEach(func => {
        console.log(`\n   -- Membuat ${func}_v2`);
        console.log(`   CREATE OR REPLACE FUNCTION ${func}_v2()`);
        console.log(`   RETURNS boolean`);
        console.log(`   LANGUAGE plpgsql`);
        console.log(`   SECURITY DEFINER`);
        console.log(`   SET search_path = public, pg_temp`);
        console.log(`   AS $$`);
        console.log(`   BEGIN`);
        console.log(`     RETURN ${func}();`);
        console.log(`   END`);
        console.log(`   $$;`);
      });
    }
    
    // Priority 2: Tambahkan search_path ke fungsi yang ada
    if (otherProblematicFunctions.length > 0) {
      console.log(`\n⚡ PRIORITAS ${priorityCounter++}: Tambahkan search_path ke fungsi bermasalah`);
      console.log('   📝 Fungsi yang perlu diperbaiki:');
      otherProblematicFunctions.forEach(func => {
        console.log(`   - ALTER FUNCTION ${func}() SET search_path = public, pg_temp;`);
      });
    }
    
    // Priority 3: Update RLS policies
    console.log(`\n🛡️  PRIORITAS ${priorityCounter++}: Update RLS policies menggunakan fungsi _v2`);
    console.log('   📝 Yang perlu dilakukan:');
    console.log('   - Ganti semua is_authenticated() dengan is_authenticated_v2()');
    console.log('   - Ganti semua is_admin() dengan is_admin_v2()');
    console.log('   - Ganti semua is_owner() dengan is_owner_v2()');
    
    // Priority 4: Monitoring dan validasi
    console.log(`\n📊 PRIORITAS ${priorityCounter++}: Setup monitoring dan validasi`);
    console.log('   📝 Yang perlu dilakukan:');
    console.log('   - Monitor Security Advisor secara berkala');
    console.log('   - Setup automated testing untuk fungsi auth');
    console.log('   - Implementasi health check untuk security warnings');
    
    console.log();

    // 7. Script perbaikan yang bisa langsung dijalankan
    console.log('7. 🛠️  SCRIPT PERBAIKAN SIAP PAKAI...');
    console.log('===================================');
    
    if (missingV2Functions.includes('is_owner')) {
      console.log('\n📝 Script untuk membuat is_owner_v2 (PRIORITAS TINGGI):');
      console.log('```sql');
      console.log('CREATE OR REPLACE FUNCTION is_owner_v2()');
      console.log('RETURNS boolean');
      console.log('LANGUAGE plpgsql');
      console.log('SECURITY DEFINER');
      console.log('SET search_path = public, pg_temp');
      console.log('AS $$');
      console.log('BEGIN');
      console.log('  RETURN is_owner();');
      console.log('END');
      console.log('$$;');
      console.log('```');
    }
    
    console.log('\n📝 Script untuk memperbaiki fungsi lain:');
    console.log('```sql');
    console.log('-- Tambahkan search_path ke fungsi bermasalah');
    otherProblematicFunctions.slice(0, 5).forEach(func => {
      console.log(`ALTER FUNCTION ${func}() SET search_path = public, pg_temp;`);
    });
    console.log('```');
    
    console.log();

    // 8. Kesimpulan dan langkah selanjutnya
    console.log('8. 📋 KESIMPULAN DAN LANGKAH SELANJUTNYA...');
    console.log('==========================================');
    
    console.log('\n🎯 KESIMPULAN ANALISIS:');
    console.log(`- Total fungsi SECURITY DEFINER: ${analysisResults.totalSecurityDefinerFunctions}`);
    console.log(`- Fungsi critical yang hilang _v2: ${missingV2Functions.length}`);
    console.log(`- Fungsi original yang masih aktif: ${activeOriginalFunctions.length}`);
    console.log(`- Fungsi lain yang bermasalah: ${otherProblematicFunctions.length}`);
    console.log(`- Kemungkinan total warnings: ${missingV2Functions.length + activeOriginalFunctions.length + otherProblematicFunctions.length}`);
    
    console.log('\n🚀 LANGKAH SELANJUTNYA (URUTAN PRIORITAS):');
    console.log('1. 🔥 Buat fungsi _v2 yang hilang (terutama is_owner_v2)');
    console.log('2. ⚡ Tambahkan search_path ke semua fungsi SECURITY DEFINER');
    console.log('3. 🛡️  Update RLS policies menggunakan fungsi _v2');
    console.log('4. 📊 Monitor Security Advisor hingga 0 warnings');
    console.log('5. 🧪 Setup automated testing untuk mencegah regresi');
    
    console.log('\n💬 APA YANG SAYA BUTUHKAN DARI ANDA:');
    console.log('=====================================');
    console.log('1. 🔑 Konfirmasi apakah Anda ingin saya membuat fungsi _v2 yang hilang?');
    console.log('2. 📝 Konfirmasi apakah Anda ingin saya memperbaiki fungsi dengan search_path?');
    console.log('3. 🛡️  Konfirmasi apakah Anda ingin saya update RLS policies?');
    console.log('4. 📊 Akses ke Security Advisor untuk monitoring real-time?');
    
    console.log('\n✅ ANALISIS MENDALAM SELESAI!');
    console.log('==============================');
    
    return {
      analysisResults,
      missingV2Functions,
      activeOriginalFunctions,
      otherProblematicFunctions,
      recommendations: {
        createMissingV2: missingV2Functions.length > 0,
        addSearchPathToExisting: otherProblematicFunctions.length > 0,
        updateRLSPolicies: activeOriginalFunctions.length > 0,
        setupMonitoring: true
      }
    };
    
  } catch (error) {
    console.error('❌ Error dalam comprehensive analysis:', error);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 MEMULAI COMPREHENSIVE SECURITY ANALYSIS...');
  console.log('==============================================\n');
  
  const report = await comprehensiveSecurityAnalysis();
  
  if (report) {
    console.log('\n📄 Analisis mendalam telah selesai.');
    console.log('💬 Silakan review temuan dan rekomendasi di atas.');
    console.log('🔧 Saya siap membantu implementasi perbaikan sesuai prioritas.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { comprehensiveSecurityAnalysis };