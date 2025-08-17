import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Production-optimized sample rate with environment variable override
  tracesSampleRate: process.env.NODE_ENV === 'production' 
    ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.05') 
    : 1.0,
  
  // Performance profiling sample rate
  profilesSampleRate: process.env.NODE_ENV === 'production' 
    ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.01') 
    : 0.1,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Safe context tags without PII
  beforeSend(event) {
    // Add safe context tags
    event.tags = {
      ...event.tags,
      environment: process.env.NODE_ENV,
      deployment: process.env.VERCEL_ENV || 'local',
      runtime: 'server',
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development'
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
  }
});