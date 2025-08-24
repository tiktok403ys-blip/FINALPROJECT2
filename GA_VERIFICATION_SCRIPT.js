// 📊 Google Analytics Verification Script
// Jalankan di browser console setelah setup

console.log('🔍 Google Analytics Verification Starting...');

// 1. Check Environment Variable
console.log('1️⃣  Checking NEXT_PUBLIC_GA_ID...');
const gaId = process.env.NEXT_PUBLIC_GA_ID;
if (gaId && gaId.startsWith('G-')) {
  console.log('✅ GA ID found:', gaId);
} else {
  console.log('❌ GA ID missing or invalid:', gaId);
}

// 2. Check gtag Function
console.log('2️⃣  Checking gtag function...');
if (typeof window !== 'undefined' && window.gtag) {
  console.log('✅ gtag function available');
} else {
  console.log('❌ gtag function not found');
}

// 3. Check GA Script Loaded
console.log('3️⃣  Checking GA script...');
const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
if (gaScripts.length > 0) {
  console.log('✅ GA script loaded:', gaScripts[0].src);
} else {
  console.log('❌ GA script not found');
}

// 4. Test GA Event
console.log('4️⃣  Testing GA event...');
if (window.gtag) {
  window.gtag('event', 'verification_test', {
    event_category: 'Setup',
    event_label: 'GA Verification',
    value: 1
  });
  console.log('✅ Test event sent');
} else {
  console.log('❌ Cannot send test event');
}

// 5. Check Network Requests
console.log('5️⃣  Checking network requests...');
setTimeout(() => {
  // This will show GA requests in Network tab
  fetch('/api/test', { method: 'HEAD' })
    .catch(() => {
      console.log('📊 Check Network tab for GA requests to:');
      console.log('   - googletagmanager.com');
      console.log('   - google-analytics.com');
    });
}, 1000);

console.log('🎉 Verification complete! Check results above.');

// Quick Status Summary
setTimeout(() => {
  const status = {
    gaId: !!(gaId && gaId.startsWith('G-')),
    gtag: !!(typeof window !== 'undefined' && window.gtag),
    script: gaScripts.length > 0
  };

  console.log('📋 STATUS SUMMARY:');
  console.log('GA ID Valid:', status.gaId ? '✅' : '❌');
  console.log('gtag Available:', status.gtag ? '✅' : '❌');
  console.log('Script Loaded:', status.script ? '✅' : '❌');

  const allGood = status.gaId && status.gtag && status.script;
  console.log('Overall Status:', allGood ? '🎉 ALL GOOD!' : '⚠️  Check issues above');
}, 2000);
