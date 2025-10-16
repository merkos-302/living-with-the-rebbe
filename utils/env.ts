/**
 * Environment variable utilities with type safety
 */

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || fallback || '';
}

export const env = {
  // ChabadUniverse Configuration
  chabadUniverseUrl: getEnvVar('NEXT_PUBLIC_CHABAD_UNIVERSE_URL', 'https://chabaduniverse.com'),
  chabadUniverseApiKey: getEnvVar('CHABAD_UNIVERSE_API_KEY', ''),
  chabadUniverseChannelId: getEnvVar('CHABAD_UNIVERSE_CHANNEL_ID', ''),

  // Archive Configuration
  archiveBaseUrl: getEnvVar('ARCHIVE_BASE_URL', 'https://merkos-living.s3.us-west-2.amazonaws.com'),

  // Database
  mongodbUri: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/living-with-rebbe'),

  // Email
  emailRecipient: getEnvVar('EMAIL_NOTIFICATION_RECIPIENT', 'retzion@merkos302.com'),
  smtpHost: getEnvVar('SMTP_HOST', ''),
  smtpPort: parseInt(getEnvVar('SMTP_PORT', '587')),
  smtpUser: getEnvVar('SMTP_USER', ''),
  smtpPassword: getEnvVar('SMTP_PASSWORD', ''),

  // Node Environment
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  isDevelopment: getEnvVar('NODE_ENV', 'development') === 'development',
  isProduction: getEnvVar('NODE_ENV', 'development') === 'production',
} as const;

// Type guard to check if required env vars are set
export function validateRequiredEnvVars(): string[] {
  const missing: string[] = [];

  if (!env.chabadUniverseApiKey && env.isProduction) {
    missing.push('CHABAD_UNIVERSE_API_KEY');
  }

  if (!env.chabadUniverseChannelId && env.isProduction) {
    missing.push('CHABAD_UNIVERSE_CHANNEL_ID');
  }

  if (!env.mongodbUri) {
    missing.push('MONGODB_URI');
  }

  return missing;
}
