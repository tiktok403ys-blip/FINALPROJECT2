// 🚫 Quick Fix: Disable PWA Installer Temporarily
// Copy and paste this into browser console

console.log('🎰 Disabling PWA Installer...');

// Method 1: Set dismissed flag (reappears after 7 days)
localStorage.setItem('pwa-install-dismissed', 'true');
console.log('✅ PWA installer dismissed for 7 days');

// Method 2: Force hide all PWA installers (immediate)
const pwaInstallers = document.querySelectorAll('[class*="fixed"][class*="bottom"]');
pwaInstallers.forEach(el => {
  if (el.textContent.includes('Install') || el.textContent.includes('PWA')) {
    el.style.display = 'none';
    console.log('✅ PWA installer hidden');
  }
});

// Method 3: Block beforeinstallprompt (advanced)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('✅ PWA install prompt blocked');
});

// Verification
setTimeout(() => {
  const stillVisible = document.querySelector('[class*="fixed"][class*="bottom"]');
  if (!stillVisible) {
    console.log('🎉 PWA installer successfully disabled!');
  } else {
    console.log('⚠️  PWA installer may still be visible');
  }
}, 1000);

// To re-enable:
console.log('To re-enable: localStorage.removeItem("pwa-install-dismissed")');

// Auto-restore after 7 days
setTimeout(() => {
  localStorage.removeItem('pwa-install-dismissed');
  console.log('🔄 PWA installer will be available again in 7 days');
}, 7 * 24 * 60 * 60 * 1000);
