const getRequiredEnvVar = (key: string, value?: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default {
  DATABASE_URL: getRequiredEnvVar(
    "DATABASE_URL",
    process.env.NEXT_PUBLIC_BACKEND_URL,
  ),
} as const;
