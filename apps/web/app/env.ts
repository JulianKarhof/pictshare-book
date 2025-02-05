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
} as const;
