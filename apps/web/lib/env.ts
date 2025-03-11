const getRequiredEnvVar = (key: string, value?: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default {
  BACKEND_URL: getRequiredEnvVar(
    "NEXT_PUBLIC_BACKEND_URL",
    process.env.NEXT_PUBLIC_BACKEND_URL,
  ),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
} as const;
