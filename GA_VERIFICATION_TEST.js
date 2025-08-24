// 📊 Google Analytics Verification Test
// Run this in browser console after setup

console.log('🔍 Google Analytics Verification Test');
console.log('=====================================');

// 1. Check Measurement ID
console.log('1️⃣  Checking Measurement ID...');
const gaId = process.env.NEXT_PUBLIC_GA_ID;
if (gaId && gaId.startsWith('G-')) {
  console.log('✅ Found GA ID:', gaId);
} else {
  console.log('❌ GA ID missing or invalid');
}

// 2. Check Google Analytics Component
console.log('2️⃣  Checking GA Component...');
const gaComponent = document.querySelector('[data-ga-loaded]');
if (gaComponent) {
  console.log('✅ GoogleAnalytics component loaded');
} else {
  console.log('❌ GoogleAnalytics component not found');
}

// 3. Check gtag Function
console.log('3️⃣  Checking gtag function...');
if (typeof window !== 'undefined' && window.gtag) {
  console.log('✅ gtag function available');
} else {
  console.log('❌ gtag function not found');
}

// 4. Check GA Script
console.log('4️⃣  Checking GA script...');
const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
if (gaScripts.length > 0) {
  console.log('✅ GA script loaded:', gaScripts[0].src);
} else {
  console.log('❌ GA script not found');
}

// 5. Test GA Event
console.log('5️⃣  Testing GA event...');
if (window.gtag) {
  window.gtag('event', 'verification_test', {
    event_category: 'Setup',
    event_label: 'GA Verification',
    value: 1
  });
  console.log('✅ Test event sent successfully');
} else {
  console.log('❌ Cannot send test event');
}

// 6. Check Analytics Provider
console.log('6️⃣  Checking Analytics Provider...');
const analyticsProvider = document.querySelector('[data-analytics-provider]');
if (analyticsProvider) {
  console.log('✅ Analytics Provider active');
} else {
  console.log('❌ Analytics Provider not found');
}

console.log('🎯 Verification Complete!');
console.log('=========================');

// Summary
setTimeout(() => {
  const results = {
    gaId: !!(gaId && gaId.startsWith('G-')),
    component: !!gaComponent,
    gtag: !!(typeof window !== 'undefined' && window.gtag),
    script: gaScripts.length > 0,
    provider: !!analyticsProvider
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log('📋 FINAL RESULTS:');
  console.log('GA ID Valid:', results.gaId ? '✅' : '❌');
  console.log('Component Active:', results.component ? '✅' : '❌');
  console.log('gtag Available:', results.gtag ? '✅' : '❌');
  console.log('Script Loaded:', results.script ? '✅' : '❌');
  console.log('Provider Active:', results.provider ? '✅' : '❌');
  console.log('');
  console.log('🎯 Overall Status:', passed === total ? 'PERFECT! 🎉' : `${passed}/${total} checks passed`);

  if (passed === total) {
    console.log('🚀 Google Analytics is fully operational!');
    console.log('📊 Check GA dashboard for real-time data');
  } else {
    console.log('⚠️  Some components may need attention');
    console.log('🔧 Check the failed items above');
  }
}, 2000);
