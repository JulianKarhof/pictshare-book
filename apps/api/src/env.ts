const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default {
  DATABASE_URL: getRequiredEnvVar("DATABASE_URL"),
  FRONTEND_URL: getRequiredEnvVar("FRONTEND_URL"),
} as const;
