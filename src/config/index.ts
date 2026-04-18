export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  api: {
    geminiApiKey: process.env.GEMINI_API_KEY || null,
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export function requireApiKey(): string {
  if (!config.api.geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return config.api.geminiApiKey;
}

export type Config = typeof config;
