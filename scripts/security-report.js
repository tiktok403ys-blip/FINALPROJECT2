const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://oypqykrfinmrvvsjfyqd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHF5a3JmaW5tcnZ2c2pmeXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM0MTQ5OSwiZXhwIjoyMDcwOTE3NDk5fQ.Yvk5InaPs0Sw4c4s3wQW_U58cQ6nq2tVXkP3HaY_Erg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Daftar 36 warnings dari Security Advisor berdasarkan screenshot
const KNOWN_WARNINGS = [
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
  'get_user_favorites_with_schema',
  'verify_casino_search_vector'
];

async function generateSecurityReport() {
  console.log('🔍 LAPORAN ANALISIS SECURITY WARNINGS');
  console.log('=====================================\n');

  try {
    // 1. Test fungsi critical yang tersedia
    console.log('1. 🧪 TESTING FUNGSI CRITICAL...');
    console.log('================================');
    
    const criticalFunctions = ['is_authenticated', 'is_admin', 'is_owner'];
    const functionStatus = {};
    
    for (const funcName of criticalFunctions) {
      try {
        // Test fungsi original
        const { error: originalError } = await supabase.rpc(funcName);
        functionStatus[funcName] = !originalError;
        
        // Test fungsi _v2
        const { error: v2Error } = await supabase.rpc(`${funcName}_v2`);
        functionStatus[`${funcName}_v2`] = !v2Error;
        
        console.log(`  ${funcName}: ${functionStatus[funcName] ? '✅' : '❌'}`);
        console.log(`  ${funcName}_v2: ${functionStatus[`${funcName}_v2`] ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`  ❌ Error testing ${funcName}:`, error.message);
        functionStatus[funcName] = false;
        functionStatus[`${funcName}_v2`] = false;
      }
    }
    
    console.log();

    // 2. Analisis berdasarkan hasil testing
    console.log('2. 📊 ANALISIS HASIL TESTING...');
    console.log('==============================');
    
    const availableFunctions = Object.keys(functionStatus).filter(key => functionStatus[key]);
    const missingFunctions = Object.keys(functionStatus).filter(key => !functionStatus[key]);
    
    console.log(`✅ Fungsi tersedia (${availableFunctions.length}):`);
    availableFunctions.forEach(func => console.log(`  - ${func}`));
    
    console.log(`\n❌ Fungsi tidak tersedia (${missingFunctions.length}):`);
    missingFunctions.forEach(func => console.log(`  - ${func}`));
    
    console.log();

    // 3. Analisis mengapa masih ada 36 warnings
    console.log('3. 🔍 ANALISIS MENGAPA MASIH ADA 36 WARNINGS...');
    console.log('===============================================');
    
    console.log('Berdasarkan testing fungsi, kemungkinan penyebab:');
    console.log();
    
    // Cek fungsi yang hilang
    const missingV2Functions = missingFunctions.filter(func => func.includes('_v2'));
    if (missingV2Functions.length > 0) {
      console.log(`❌ MASALAH 1: Fungsi _v2 yang hilang (${missingV2Functions.length}):`);
      missingV2Functions.forEach(func => {
        console.log(`  - ${func} tidak tersedia`);
      });
      console.log('   💡 Solusi: Buat ulang fungsi _v2 yang hilang\n');
    }
    
    // Cek fungsi original yang masih ada
    const availableOriginalFunctions = availableFunctions.filter(func => !func.includes('_v2'));
    if (availableOriginalFunctions.length > 0) {
      console.log(`⚠️  MASALAH 2: Fungsi original masih aktif (${availableOriginalFunctions.length}):`);
      availableOriginalFunctions.forEach(func => {
        console.log(`  - ${func} masih tersedia`);
      });
      console.log('   💡 Solusi: Aplikasi mungkin masih menggunakan fungsi original\n');
    }
    
    // 4. Rekomendasi perbaikan berdasarkan analisis
    console.log('4. 💡 REKOMENDASI PERBAIKAN PRIORITAS...');
    console.log('======================================');
    
    let priorityCounter = 1;
    
    // Priority 1: Buat fungsi _v2 yang hilang
    if (missingV2Functions.length > 0) {
      console.log(`\n🔥 PRIORITAS ${priorityCounter++}: Buat fungsi _v2 yang hilang`);
      console.log('   Fungsi yang perlu dibuat:');
      missingV2Functions.forEach(func => {
        const originalFunc = func.replace('_v2', '');
        console.log(`   - CREATE OR REPLACE FUNCTION ${func}() RETURNS boolean`);
        console.log(`     LANGUAGE plpgsql SECURITY DEFINER`);
        console.log(`     SET search_path = public, pg_temp`);
        console.log(`     AS $$ BEGIN RETURN ${originalFunc}(); END $$;`);
      });
    }
    
    // Priority 2: Update aplikasi untuk menggunakan _v2
    if (availableOriginalFunctions.length > 0) {
      console.log(`\n⚡ PRIORITAS ${priorityCounter++}: Update aplikasi menggunakan fungsi _v2`);
      console.log('   File yang perlu diupdate:');
      console.log('   - RLS policies di database');
      console.log('   - Frontend components yang memanggil fungsi auth');
      console.log('   - Backend API yang menggunakan fungsi auth');
    }
    
    // Priority 3: Tambahkan search_path ke fungsi yang belum ada
    console.log(`\n🛡️  PRIORITAS ${priorityCounter++}: Tambahkan search_path ke semua fungsi SECURITY DEFINER`);
    console.log('   Semua fungsi SECURITY DEFINER harus memiliki:');
    console.log('   SET search_path = public, pg_temp');
    
    // Priority 4: Monitoring dan validasi
    console.log(`\n📊 PRIORITAS ${priorityCounter++}: Setup monitoring dan validasi`);
    console.log('   - Monitor Security Advisor secara berkala');
    console.log('   - Setup automated testing untuk fungsi auth');
    console.log('   - Implementasi health check untuk security warnings');
    
    // 5. Script perbaikan yang bisa dijalankan
    console.log('\n5. 🛠️  SCRIPT PERBAIKAN YANG BISA DIJALANKAN...');
    console.log('==============================================');
    
    if (missingV2Functions.includes('is_owner_v2')) {
      console.log('\n📝 Script untuk membuat is_owner_v2:');
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
    
    // 6. Kesimpulan dan langkah selanjutnya
    console.log('\n6. 📋 KESIMPULAN DAN LANGKAH SELANJUTNYA...');
    console.log('==========================================');
    
    console.log('\n🎯 KESIMPULAN:');
    console.log(`- Total fungsi critical tersedia: ${availableFunctions.length}/6`);
    console.log(`- Fungsi _v2 yang hilang: ${missingV2Functions.length}`);
    console.log(`- Kemungkinan penyebab 36 warnings: Fungsi _v2 tidak lengkap + aplikasi masih menggunakan fungsi original`);
    
    console.log('\n🚀 LANGKAH SELANJUTNYA:');
    console.log('1. Buat fungsi _v2 yang hilang (terutama is_owner_v2)');
    console.log('2. Update semua RLS policies menggunakan fungsi _v2');
    console.log('3. Pastikan aplikasi frontend/backend menggunakan fungsi _v2');
    console.log('4. Tambahkan search_path ke semua fungsi SECURITY DEFINER');
    console.log('5. Monitor Security Advisor hingga 0 warnings');
    
    console.log('\n✅ ANALISIS SELESAI!');
    console.log('====================');
    
    return {
      availableFunctions,
      missingFunctions,
      missingV2Functions,
      availableOriginalFunctions,
      recommendations: {
        createMissingV2: missingV2Functions.length > 0,
        updateApplicationToUseV2: availableOriginalFunctions.length > 0,
        addSearchPathToAllFunctions: true,
        setupMonitoring: true
      }
    };
    
  } catch (error) {
    console.error('❌ Error dalam analisis:', error);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 MEMULAI LAPORAN SECURITY ANALYSIS...');
  console.log('=======================================\n');
  
  const report = await generateSecurityReport();
  
  if (report) {
    console.log('\n📄 Laporan telah selesai. Silakan review rekomendasi di atas.');
    console.log('💬 Apa yang Anda butuhkan dari saya untuk memperbaiki warnings ini?');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSecurityReport };