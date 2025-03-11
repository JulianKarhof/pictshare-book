// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://40aea8f571a3f3894ddb37cb9eec7607@o4508958935089152.ingest.de.sentry.io/4508959034114128",
  tracesSampleRate: 1,
  debug: false,
});
