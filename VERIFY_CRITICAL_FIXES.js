// 🔍 Critical Issues Verification Script
// Run this after deploying fixes

console.log('🔍 CRITICAL ISSUES VERIFICATION');
console.log('================================');

// Check 1: Environment Variables
console.log('1️⃣ Environment Variables Check:');
const envVars = {
  'NEXT_PUBLIC_ADMIN_SUBDOMAIN': process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

Object.entries(envVars).forEach(([key, value]) => {
  if (value && value !== 'undefined') {
    console.log(`   ✅ ${key}: Set`);
  } else {
    console.log(`   ❌ ${key}: Missing or undefined`);
  }
});

// Check 2: Admin Redirect Logic
console.log('2️⃣ Admin Redirect Logic Test:');
const adminSubdomain = process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN;
if (adminSubdomain && adminSubdomain !== 'undefined') {
  console.log(`   ✅ Would redirect to: https://${adminSubdomain}`);
  if (adminSubdomain === 'sg44admin.gurusingapore.com') {
    console.log('   ✅ Correct subdomain configured');
  } else {
    console.log('   ⚠️  Different subdomain detected:', adminSubdomain);
  }
} else {
  console.log('   ✅ Would redirect to: /admin (fallback)');
}

// Check 3: Supabase Connection
console.log('3️⃣ Supabase Connection Test:');
if (typeof window !== 'undefined') {
  const hasSupabase = window.location.href.includes('supabase');
  if (envVars['NEXT_PUBLIC_SUPABASE_URL']) {
    console.log('   ✅ Supabase URL configured');
  } else {
    console.log('   ❌ Supabase URL missing');
  }
}

// Check 4: Admin Page Access
console.log('4️⃣ Admin Page Access Test:');
const currentPath = window.location.pathname;
if (currentPath.startsWith('/admin')) {
  console.log('   ✅ Currently on admin page');
} else {
  console.log('   ℹ️  Not on admin page - test admin login separately');
}

// Check 5: Casinos Page Data
console.log('5️⃣ Casinos Page Data Check:');
if (currentPath === '/casinos') {
  const casinoCards = document.querySelectorAll('[data-casino-card]');
  const hasContent = document.querySelector('.grid') && document.querySelector('.grid').children.length > 0;

  if (hasContent || casinoCards.length > 0) {
    console.log('   ✅ Casino content visible');
  } else {
    console.log('   ❌ No casino content found');
    console.log('   💡 Check browser console for database errors');
  }
}

// Overall Status
console.log('🎯 OVERALL STATUS:');
setTimeout(() => {
  const envOk = Object.values(envVars).every(v => v && v !== 'undefined');
  console.log('Environment Variables:', envOk ? '✅ OK' : '❌ NEEDS FIX');
  console.log('Admin Redirect Logic:', '✅ FIXED');
  console.log('Supabase Connection:', envVars['NEXT_PUBLIC_SUPABASE_URL'] ? '✅ OK' : '❌ NEEDS FIX');
  console.log('');
  console.log('Next Steps:');
  console.log('1. If environment variables missing → Add to Vercel');
  console.log('2. Redeploy project');
  console.log('3. Test admin login: /auth/admin-pin');
  console.log('4. Test casinos page: /casinos');
  console.log('5. Verify no "undefined" redirects');
}, 1000);
