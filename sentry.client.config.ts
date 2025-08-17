import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Production-optimized sample rate
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  replaysOnErrorSampleRate: 1.0,
  
  // Lower sample rate for production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  
  // Safe context tags without PII
  beforeSend(event) {
    // Add safe context tags
    event.tags = {
      ...event.tags,
      environment: process.env.NODE_ENV,
      deployment: process.env.VERCEL_ENV || 'local'
    };
    
    // Remove any potential PII from user context
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      // Keep only safe identifiers
      event.user = {
        id: event.user.id ? 'user_' + btoa(String(event.user.id)).slice(0, 8) : undefined
      };
    }
    
    return event;
  },
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});