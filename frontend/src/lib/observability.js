import posthog from 'posthog-js';
import * as Sentry from '@sentry/nextjs';

export const initObservability = () => {
  if (typeof window !== 'undefined') {
    // Initialize PostHog
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
    
    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        persistence: 'localStorage',
        autocapture: true,
      });
    }

    // Initialize Sentry
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, 
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: process.env.NODE_ENV,
      });
    }
  }
};

export const trackEvent = (eventName, properties = {}) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
};

export const captureException = (error, context = {}) => {
  console.error(error);
  if (typeof window !== 'undefined') {
    Sentry.captureException(error, { extra: context });
  }
};
