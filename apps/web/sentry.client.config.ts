// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://40aea8f571a3f3894ddb37cb9eec7607@o4508958935089152.ingest.de.sentry.io/4508959034114128",
  integrations: [Sentry.replayIntegration(), Sentry.replayCanvasIntegration()],
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
});
