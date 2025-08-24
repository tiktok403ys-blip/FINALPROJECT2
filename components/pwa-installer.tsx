'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Smartphone, Wifi, Zap, Star } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInWebAppiOS = (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone || isInWebAppiOS);
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Don't prevent default - let browser show its prompt if our custom one fails
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show install prompt after 5 seconds if user hasn't dismissed it before
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed && !isInstalled) {
          setIsVisible(true);
        }
      }, 5000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);

      // Track installation
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'pwa_installed', {
          event_category: 'engagement',
          event_label: 'PWA Installation',
          value: 1
        });
      }
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ User accepted the PWA install prompt');
        setIsInstalled(true);
      } else {
        console.log('❌ User dismissed the PWA install prompt');
      }

      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('❌ Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');

    // Set a timer to show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  };

  // Don't show if already installed, no prompt available, or dismissed
  if (isInstalled || !isVisible || !deferredPrompt) return null;

  const features = [
    { icon: Smartphone, text: 'VIP Mobile Access', color: 'text-yellow-400' },
    { icon: Wifi, text: 'Play Offline', color: 'text-green-400' },
    { icon: Zap, text: 'Instant Loading', color: 'text-orange-400' },
    { icon: Star, text: 'Pro Gaming Experience', color: 'text-purple-400' }
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-6 md:right-auto md:w-96">
      <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-2 border-gradient-to-r from-yellow-400/20 to-orange-400/20 shadow-2xl backdrop-blur-xl">
        <CardHeader className="pb-4 relative">
          {/* Casino-themed background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-orange-400/5 rounded-t-lg" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                  <Download className="w-6 h-6 text-black font-bold" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    🎰 Install GuruSingapore
                  </CardTitle>
                  <p className="text-sm text-gray-300 font-medium">
                    Play Like a Pro - Anytime, Anywhere
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-300 border-yellow-400/30 font-bold">
                PRO APP
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 relative z-10">
          {/* Casino-themed features */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-700/50">
                <div className="p-1.5 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-md">
                  <feature.icon className={`w-4 h-4 ${feature.color} font-bold`} />
                </div>
                <span className="text-xs text-gray-200 font-medium leading-tight">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Casino bonus highlight */}
          <div className="p-4 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                <Star className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-sm font-bold text-yellow-300">🎁 Special Bonus</p>
                <p className="text-xs text-gray-300">Get 100% Welcome Bonus when installed!</p>
              </div>
            </div>
          </div>

          {/* Network Status - Casino themed */}
          {!isOnline && (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Wifi className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300 font-medium">⚠️ Offline Mode - Install for VIP Access</span>
            </div>
          )}

          {/* Casino-style Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-300 hover:via-yellow-400 hover:to-orange-400 text-black font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Download className="w-5 h-5 mr-2" />
              🚀 INSTALL NOW
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="px-6 border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 font-semibold transition-all duration-200"
            >
              Maybe Later
            </Button>
          </div>

          {/* Casino-themed footer */}
          <div className="pt-3 border-t border-gradient-to-r from-yellow-400/20 to-orange-400/20">
            <p className="text-xs text-gray-400 text-center font-medium">
              🎲 No App Store Required • VIP Casino Experience • ⚡ Lightning Fast
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
