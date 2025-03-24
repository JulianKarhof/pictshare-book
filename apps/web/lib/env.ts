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
  NEXT_PUBLIC_PICTSHARE_BOOK_ENV: getRequiredEnvVar(
    "NEXT_PUBLIC_PICTSHARE_BOOK_ENV",
    process.env.NEXT_PUBLIC_PICTSHARE_BOOK_ENV,
  ),
} as const;

export const isTest = process.env.NEXT_PUBLIC_IS_TEST === "true";
