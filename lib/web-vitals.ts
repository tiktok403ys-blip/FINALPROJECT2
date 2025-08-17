import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      addBreadcrumb: (breadcrumb: any) => void;
    };
  }
}

function sendToAnalytics(metric: any) {
  // Send to Sentry
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.addBreadcrumb({
      message: `Web Vital: ${metric.name}`,
      category: 'performance',
      level: 'info',
      data: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      },
    });
  }

  // You can also send to other analytics services here
  console.log('Web Vital:', metric);
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}