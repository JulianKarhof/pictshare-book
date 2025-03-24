const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default {
  PICTSHARE_BOOK_ENV: getRequiredEnvVar("PICTSHARE_BOOK_ENV"),
  DATABASE_URL: getRequiredEnvVar("DATABASE_URL"),
  FRONTEND_URL: getRequiredEnvVar("FRONTEND_URL"),
  GOOGLE_CLIENT_ID: getRequiredEnvVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getRequiredEnvVar("GOOGLE_CLIENT_SECRET"),
  S3_ENDPOINT: getRequiredEnvVar("S3_ENDPOINT"),
  S3_BUCKET_NAME: getRequiredEnvVar("S3_BUCKET_NAME"),
  S3_ACCESS_STYLE: process.env.S3_ACCESS_STYLE || "path",
  REDIS_URL: process.env.REDIS_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || "development",
} as const;
