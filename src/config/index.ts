import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  ai: {
    googleApiKey: process.env.GOOGLE_AI_API_KEY,
    defaultModel: 'gemini-pro',
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  api: {
    rateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export type Config = typeof config;
