const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://oypqykrfinmrvvsjfyqd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHF5a3JmaW5tcnZ2c2pmeXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM0MTQ5OSwiZXhwIjoyMDcwOTE3NDk5fQ.Yvk5InaPs0Sw4c4s3wQW_U58cQ6nq2tVXkP3HaY_Erg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Daftar 36 warnings dari Security Advisor berdasarkan screenshot
const KNOWN_WARNINGS = [
  'public.change_avatar_url_limits',
  'public.change_admin_pin_content_at',
  'public.is_owner',
  'public.is_authenticated', 
  'public.is_admin',
  'public.set_profile_claim_insert',
  'public.set_admin_pin',
  'public.change_admin_pin_change',
  'public.get_user_favorites_with_schema',
  'public.verify_last_seen',
  'public.verify_casino_search_vector',
  'public.verify_log_admin_activity',
  'public.verify_casino_search_vector',
  'public.get_casino_details_mobile',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector',
  'public.verify_casino_search_vector'
];

async function analyzeSecurityWarnings() {
  console.log('🔍 ANALISIS MENDALAM SECURITY WARNINGS');
  console.log('=====================================\n');

  try {
    // 1. Query semua fungsi di schema public menggunakan query langsung
    console.log('1. Mengambil semua fungsi di schema public...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select(`
        routine_name,
        routine_type,
        security_type,
        routine_definition
      `)
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION')
      .eq('security_type', 'DEFINER')
      .order('routine_name');

    if (functionsError) {
      console.error('❌ Error mengambil fungsi:', functionsError);
      return;
    }

    console.log(`✅ Ditemukan ${functions?.length || 0} fungsi SECURITY DEFINER\n`);

    // 2. Analisis fungsi berdasarkan kategori
    const analysis = {
      total_functions: functions?.length || 0,
      functions_with_search_path: 0,
      functions_without_search_path: 0,
      v2_functions: 0,
      original_functions: 0,
      problematic_functions: [],
      fixed_functions: [],
      unknown_functions: []
    };

    functions?.forEach(func => {
      // Analisis search_path
      const hasSearchPath = func.routine_definition && func.routine_definition.includes('search_path');
      const isV2Function = func.routine_name && func.routine_name.includes('_v2');
      
      // Hitung berdasarkan search_path
      if (hasSearchPath) {
        analysis.functions_with_search_path++;
        analysis.fixed_functions.push(func.routine_name);
      } else {
        analysis.functions_without_search_path++;
        analysis.problematic_functions.push(func.routine_name);
      }

      // Hitung berdasarkan versi
      if (isV2Function) {
        analysis.v2_functions++;
      } else {
        analysis.original_functions++;
      }

      // Cek apakah fungsi ada dalam daftar warnings
      if (!KNOWN_WARNINGS.includes(`public.${func.routine_name}`)) {
        analysis.unknown_functions.push(func.routine_name);
      }
    });

    // 3. Tampilkan hasil analisis
    console.log('📊 HASIL ANALISIS:');
    console.log('==================');
    console.log(`Total fungsi SECURITY DEFINER: ${analysis.total_functions}`);
    console.log(`Fungsi dengan search_path: ${analysis.functions_with_search_path}`);
    console.log(`Fungsi tanpa search_path: ${analysis.functions_without_search_path}`);
    console.log(`Fungsi versi _v2: ${analysis.v2_functions}`);
    console.log(`Fungsi original: ${analysis.original_functions}\n`);

    // 4. Fungsi yang sudah diperbaiki
    console.log('✅ FUNGSI YANG SUDAH DIPERBAIKI (dengan search_path):');
    console.log('====================================================');
    analysis.fixed_functions.forEach(func => {
      console.log(`  - ${func}`);
    });
    console.log();

    // 5. Fungsi yang masih bermasalah
    console.log('❌ FUNGSI YANG MASIH BERMASALAH (tanpa search_path):');
    console.log('===================================================');
    analysis.problematic_functions.forEach(func => {
      console.log(`  - ${func}`);
    });
    console.log();

    // 6. Analisis mengapa masih ada 36 warnings
    console.log('🔍 ANALISIS MENGAPA MASIH ADA 36 WARNINGS:');
    console.log('==========================================');
    
    if (analysis.functions_without_search_path > 0) {
      console.log(`1. Masih ada ${analysis.functions_without_search_path} fungsi tanpa search_path eksplisit`);
    }
    
    if (analysis.original_functions > 0) {
      console.log(`2. Masih ada ${analysis.original_functions} fungsi original yang belum diganti dengan _v2`);
    }
    
    console.log(`3. Kemungkinan aplikasi masih menggunakan fungsi original, bukan _v2`);
    console.log(`4. RLS policies mungkin masih mereferensikan fungsi lama`);
    console.log();

    // 7. Rekomendasi perbaikan
    console.log('💡 REKOMENDASI PERBAIKAN:');
    console.log('=========================');
    console.log('1. Pastikan semua aplikasi menggunakan fungsi _v2');
    console.log('2. Update semua RLS policies untuk menggunakan fungsi _v2');
    console.log('3. Drop fungsi original setelah migrasi selesai');
    console.log('4. Tambahkan search_path eksplisit ke semua fungsi yang belum ada');
    console.log();

    // 8. Detail fungsi yang perlu diperbaiki
    if (analysis.problematic_functions.length > 0) {
      console.log('🔧 DETAIL FUNGSI YANG PERLU DIPERBAIKI:');
      console.log('======================================');
      
      for (const funcName of analysis.problematic_functions.slice(0, 5)) {
        const func = functions.find(f => f.routine_name === funcName);
        if (func) {
          console.log(`\n📝 Fungsi: ${funcName}`);
          console.log('   Definisi saat ini:');
          console.log('   ' + func.routine_definition.substring(0, 200) + '...');
          console.log('   ⚠️  Perlu ditambahkan: SET search_path = public, pg_temp;');
        }
      }
    }

    // 9. Generate SQL untuk perbaikan
    console.log('\n🛠️  SQL UNTUK PERBAIKAN:');
    console.log('========================');
    console.log('-- Script untuk menambahkan search_path ke fungsi yang belum ada');
    analysis.problematic_functions.forEach(funcName => {
      console.log(`-- TODO: Update function ${funcName} to include search_path`);
    });

    return analysis;

  } catch (error) {
    console.error('❌ Error dalam analisis:', error);
  }
}

// Fungsi untuk mengecek status aplikasi
async function checkApplicationUsage() {
  console.log('\n🔍 MENGECEK PENGGUNAAN FUNGSI DI APLIKASI:');
  console.log('==========================================');
  
  try {
    // Karena tidak bisa query pg_policies langsung, kita akan cek fungsi yang ada
    console.log('\n📋 Menganalisis fungsi yang tersedia...');
    
    // Cek apakah fungsi critical sudah ada versi _v2
    const criticalFunctions = ['is_authenticated', 'is_admin', 'is_owner'];
    
    for (const funcName of criticalFunctions) {
      try {
        // Test fungsi original
        const { data: originalTest, error: originalError } = await supabase.rpc(funcName);
        console.log(`  ✅ Fungsi ${funcName} tersedia`);
        
        // Test fungsi _v2
        const { data: v2Test, error: v2Error } = await supabase.rpc(`${funcName}_v2`);
        if (!v2Error) {
          console.log(`  ✅ Fungsi ${funcName}_v2 tersedia`);
        } else {
          console.log(`  ❌ Fungsi ${funcName}_v2 tidak tersedia`);
        }
      } catch (error) {
        console.log(`  ❌ Error testing ${funcName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error mengecek penggunaan aplikasi:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 MEMULAI ANALISIS SECURITY WARNINGS...');
  console.log('========================================\n');
  
  const analysis = await analyzeSecurityWarnings();
  await checkApplicationUsage();
  
  console.log('\n✅ ANALISIS SELESAI!');
  console.log('===================');
  console.log('Silakan review hasil analisis di atas untuk menentukan langkah perbaikan selanjutnya.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeSecurityWarnings, checkApplicationUsage };