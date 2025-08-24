'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, RefreshCw, Home, Smartphone, Download } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkConnection = () => {
      setIsOnline(navigator.onLine);
    };

    // Check connection on mount
    checkConnection();

    // Listen for online/offline events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    // Auto-retry connection every 5 seconds
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setRetryCount(prev => prev + 1);
        checkConnection();
      } else {
        setRetryCount(0);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearInterval(interval);
    };
  }, []);

  // Handle redirect when connection is restored
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="p-4 bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Connection Restored!</h1>
            <p className="text-gray-300 mb-6">Redirecting you back to the app...</p>
            <div className="animate-pulse">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <Card className="glass-card max-w-md w-full">
        <CardHeader className="text-center pb-6">
          <div className="p-4 bg-red-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Wifi className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">
            You&apos;re Offline
          </CardTitle>
          <p className="text-gray-300">
            Don&apos;t worry! You can still access some features when you&apos;re back online.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-300">Connection Status</span>
            <Badge variant="destructive" className="animate-pulse">
              Offline
            </Badge>
          </div>

          {/* Retry Attempts */}
          {retryCount > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Auto-retry attempts: {retryCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Next retry in 5 seconds
              </p>
            </div>
          )}

          {/* Available Features */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Available Offline:</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">View cached casino data</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Access saved favorites</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Read saved reviews</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                asChild
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Link href="/casinos">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Casinos
                </Link>
              </Button>
            </div>
          </div>

          {/* PWA Install Prompt */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Install the App</p>
                <p className="text-xs text-gray-300">Get full offline access</p>
              </div>
              <Button size="sm" className="bg-primary text-black hover:bg-primary/90">
                Install
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-400">
              GuruSingapore Casino • Best casino reviews
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Auto-refreshing every 5 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}