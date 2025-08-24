// Analytics and performance monitoring utilities

import { useEffect } from 'react'

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

interface PerformanceMetrics {
  FCP: number | null;
  LCP: number | null;
  CLS: number | null;
  FID: number | null;
  TTFB: number | null;
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics 4 tracking
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  try {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      custom_map: event.customParameters
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Track page views
export function trackPageView(page: string, parameters?: Record<string, any>) {
  trackEvent({
    action: 'page_view',
    category: 'Navigation',
    label: page,
    customParameters: parameters
  });
}

// Track user interactions
export function trackInteraction(
  element: string,
  action: string,
  parameters?: Record<string, any>
) {
  trackEvent({
    action: action,
    category: 'Interaction',
    label: element,
    customParameters: parameters
  });
}

// Track performance metrics
export function trackPerformanceMetrics(metrics: PerformanceMetrics) {
  // Track Core Web Vitals
  if (metrics.FCP) {
    trackEvent({
      action: 'core_web_vital',
      category: 'Performance',
      label: 'FCP',
      value: Math.round(metrics.FCP),
      customParameters: { metric_value: metrics.FCP }
    });
  }

  if (metrics.LCP) {
    trackEvent({
      action: 'core_web_vital',
      category: 'Performance',
      label: 'LCP',
      value: Math.round(metrics.LCP),
      customParameters: { metric_value: metrics.LCP }
    });
  }

  if (metrics.CLS !== null) {
    trackEvent({
      action: 'core_web_vital',
      category: 'Performance',
      label: 'CLS',
      value: Math.round(metrics.CLS * 1000), // Convert to milliseconds
      customParameters: { metric_value: metrics.CLS }
    });
  }

  if (metrics.FID) {
    trackEvent({
      action: 'core_web_vital',
      category: 'Performance',
      label: 'FID',
      value: Math.round(metrics.FID),
      customParameters: { metric_value: metrics.FID }
    });
  }

  if (metrics.TTFB) {
    trackEvent({
      action: 'performance_metric',
      category: 'Performance',
      label: 'TTFB',
      value: Math.round(metrics.TTFB),
      customParameters: { metric_value: metrics.TTFB }
    });
  }
}

// Track PWA events
export function trackPWAEvent(event: string, parameters?: Record<string, any>) {
  trackEvent({
    action: 'pwa_event',
    category: 'PWA',
    label: event,
    customParameters: parameters
  });
}

// Track casino interactions
export function trackCasinoInteraction(
  casinoId: string,
  action: string,
  parameters?: Record<string, any>
) {
  trackEvent({
    action: action,
    category: 'Casino',
    label: casinoId,
    customParameters: parameters
  });
}

// Track search interactions
export function trackSearchInteraction(
  query: string,
  results: number,
  parameters?: Record<string, any>
) {
  trackEvent({
    action: 'search',
    category: 'Search',
    label: query,
    value: results,
    customParameters: {
      search_query: query,
      results_count: results,
      ...parameters
    }
  });
}

// Track mobile-specific interactions
export function trackMobileInteraction(
  action: string,
  parameters?: Record<string, any>
) {
  trackEvent({
    action: action,
    category: 'Mobile',
    customParameters: {
      device_type: 'mobile',
      viewport_width: typeof window !== 'undefined' ? window.innerWidth : null,
      viewport_height: typeof window !== 'undefined' ? window.innerHeight : null,
      ...parameters
    }
  });
}

// Error tracking
export function trackError(error: Error, context?: Record<string, any>) {
  trackEvent({
    action: 'error',
    category: 'Error',
    label: error.message,
    customParameters: {
      error_stack: error.stack,
      error_name: error.name,
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      ...context
    }
  });
}

// Performance monitoring with real-time alerts
export function startPerformanceMonitoring(options: {
  enableRealTime?: boolean;
  alertThresholds?: {
    FCP?: number;
    LCP?: number;
    CLS?: number;
    FID?: number;
  };
  onAlert?: (alert: { type: string; value: number; threshold: number }) => void;
} = {}) {
  if (typeof window === 'undefined') return;

  const {
    enableRealTime = false,
    alertThresholds = {
      FCP: 2000,
      LCP: 2500,
      CLS: 0.1,
      FID: 100
    },
    onAlert
  } = options;

  let metrics: PerformanceMetrics = {
    FCP: null,
    LCP: null,
    CLS: null,
    FID: null,
    TTFB: null
  };

  // Measure Core Web Vitals with alerts
  const measureFCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');

      if (fcpEntry) {
        const fcp = fcpEntry.startTime;
        metrics.FCP = fcp;

        if (alertThresholds.FCP && fcp > alertThresholds.FCP) {
          onAlert?.({
            type: 'FCP',
            value: fcp,
            threshold: alertThresholds.FCP
          });
        }

        trackPerformanceMetrics(metrics);
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('FCP observer not supported');
    }
  };

  const measureLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      if (lastEntry) {
        const lcp = lastEntry.startTime;
        metrics.LCP = lcp;

        if (alertThresholds.LCP && lcp > alertThresholds.LCP) {
          onAlert?.({
            type: 'LCP',
            value: lcp,
            threshold: alertThresholds.LCP
          });
        }

        trackPerformanceMetrics(metrics);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observer not supported');
    }
  };

  const measureCLS = () => {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];

      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      metrics.CLS = clsValue;

      if (alertThresholds.CLS && clsValue > alertThresholds.CLS) {
        onAlert?.({
          type: 'CLS',
          value: clsValue,
          threshold: alertThresholds.CLS
        });
      }

      trackPerformanceMetrics(metrics);
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS observer not supported');
    }
  };

  const measureFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];

      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        metrics.FID = fid;

        if (alertThresholds.FID && fid > alertThresholds.FID) {
          onAlert?.({
            type: 'FID',
            value: fid,
            threshold: alertThresholds.FID
          });
        }

        trackPerformanceMetrics(metrics);
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observer not supported');
    }
  };

  // Start measuring
  measureFCP();
  measureLCP();
  measureCLS();
  measureFID();

  // Real-time monitoring
  if (enableRealTime) {
    const interval = setInterval(() => {
      // Measure additional metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.TTFB = navigation.responseStart - navigation.requestStart;
        trackPerformanceMetrics(metrics);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }
}

// Initialize Google Analytics
export function initGA() {
  if (typeof window === 'undefined') return;

  // Initialize Google Analytics
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'GA_MEASUREMENT_ID', {
      anonymize_ip: true,
      allow_ad_features: false,
    });
  }
}

// Core Web Vitals hook
export function useCoreWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Measure Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          trackEvent({
            action: 'core_web_vital',
            category: 'Performance',
            label: 'FCP',
            value: Math.round(entry.startTime)
          });
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });

    return () => observer.disconnect();
  }, []);
}

// Performance observer hook
export function usePerformanceObserver() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Track performance entries
        console.log('Performance entry:', entry.name, entry.duration);
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, []);
}

// Analytics object
export const analytics = {
  trackEvent,
  trackPageView,
  trackInteraction,
  trackPerformanceMetrics,
  trackPWAEvent,
  trackCasinoInteraction,
  trackSearchInteraction,
  trackMobileInteraction,
  trackError,
  getDeviceInfo,
  startSessionTracking,
  initGA,
  useCoreWebVitals,
  usePerformanceObserver
};

// Device and browser tracking
export function getDeviceInfo() {
  if (typeof navigator === 'undefined') return null;

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    connection: (navigator as any).connection?.effectiveType,
    screenWidth: typeof screen !== 'undefined' ? screen.width : null,
    screenHeight: typeof screen !== 'undefined' ? screen.height : null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

// Session tracking
export function startSessionTracking() {
  if (typeof window === 'undefined') return;

  const sessionId = crypto.randomUUID();
  const startTime = Date.now();

  trackEvent({
    action: 'session_start',
    category: 'Session',
    customParameters: {
      session_id: sessionId,
      start_time: startTime,
      device_info: getDeviceInfo()
    }
  });

  // Track session duration on page unload
  const trackSessionEnd = () => {
    const duration = Date.now() - startTime;
    trackEvent({
      action: 'session_end',
      category: 'Session',
      customParameters: {
        session_id: sessionId,
        duration: duration
      }
    });
  };

  window.addEventListener('beforeunload', trackSessionEnd);

  return () => {
    window.removeEventListener('beforeunload', trackSessionEnd);
  };
}