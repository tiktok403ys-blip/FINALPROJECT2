// 🚨 Google Analytics Quick Debug Script
// Copy and paste this into browser console

console.log('🔍 GOOGLE ANALYTICS DEBUG');
console.log('=========================');

// 1. Check Environment Variable
console.log('1️⃣ Environment Variable Check:');
try {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  console.log('   NEXT_PUBLIC_GA_ID:', gaId || '❌ NOT SET');
  if (gaId && gaId === 'G-H7JSZEGQPQ') {
    console.log('   ✅ Measurement ID matches expected');
  } else if (gaId) {
    console.log('   ⚠️  Measurement ID different:', gaId);
  } else {
    console.log('   ❌ Environment variable missing');
  }
} catch (e) {
  console.log('   ❌ Error accessing env var:', e.message);
}

// 2. Check Google Analytics Component
console.log('2️⃣ GoogleAnalytics Component Check:');
const gaComponent = document.querySelector('[data-ga-component]');
if (gaComponent) {
  console.log('   ✅ Component found in DOM');
} else {
  console.log('   ❌ Component not found');
}

// 3. Check gtag Function
console.log('3️⃣ gtag Function Check:');
if (typeof window !== 'undefined') {
  if (window.gtag) {
    console.log('   ✅ gtag function available');
  } else {
    console.log('   ❌ gtag function not found');
  }
} else {
  console.log('   ❌ Window object not available');
}

// 4. Check GA Scripts
console.log('4️⃣ Google Analytics Scripts Check:');
const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
console.log('   GA scripts found:', gaScripts.length);
gaScripts.forEach((script, i) => {
  console.log('   Script', i + 1, ':', script.src);
});

// 5. Check Network Requests (recent)
console.log('5️⃣ Recent Network Activity Check:');
if (typeof performance !== 'undefined') {
  const resources = performance.getEntriesByType('resource');
  const gaRequests = resources.filter(r =>
    r.name.includes('googletagmanager.com') ||
    r.name.includes('google-analytics.com')
  );
  console.log('   GA requests in this session:', gaRequests.length);
  gaRequests.slice(-3).forEach((req, i) => {
    console.log('   Recent request', i + 1, ':', req.name.substring(0, 50) + '...');
  });
}

// 6. Test GA Event (if possible)
console.log('6️⃣ GA Event Test:');
if (window.gtag) {
  try {
    window.gtag('event', 'debug_test', {
      event_category: 'Debug',
      event_label: 'Quick Debug Script',
      value: Date.now()
    });
    console.log('   ✅ Test event sent successfully');
  } catch (e) {
    console.log('   ❌ Error sending test event:', e.message);
  }
} else {
  console.log('   ❌ Cannot test - gtag not available');
}

// 7. Check Console History
console.log('7️⃣ Console History Check:');
if (typeof window !== 'undefined' && window.console) {
  // This is just informational
  console.log('   Check above for any GA-related messages');
}

console.log('🎯 DEBUG COMPLETE');
console.log('================');
console.log('If you see ❌ errors above, fix them first.');
console.log('If all ✅, wait 24-48 hours for GA data to appear.');
console.log('');
console.log('Quick Actions:');
console.log('1. Check Vercel environment variables');
console.log('2. Redeploy if needed');
console.log('3. Test in incognito mode');
console.log('4. Check GA dashboard real-time reports');
