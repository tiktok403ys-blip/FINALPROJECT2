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
    { icon: Smartphone, text: 'Install on your device', color: 'text-blue-400' },
    { icon: Wifi, text: 'Works offline', color: 'text-green-400' },
    { icon: Zap, text: 'Faster loading', color: 'text-yellow-400' },
    { icon: Star, text: 'Better experience', color: 'text-purple-400' }
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-6 md:right-auto md:w-96">
      <Card className="glass-card border-2 border-primary/20 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/60 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Install App
                </CardTitle>
                <p className="text-sm text-gray-300">
                  Get the full GuruSingapore experience
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              PWA
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <feature.icon className={`w-4 h-4 ${feature.color}`} />
                <span className="text-gray-300">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Network Status */}
          {!isOnline && (
            <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <Wifi className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">Offline - Install for full access</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Install Now
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="px-4 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Later
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-700">
            No app store required • Works on any device
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
