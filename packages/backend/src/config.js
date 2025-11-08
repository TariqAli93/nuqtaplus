import 'dotenv/config';

const config = {
  server: {
    port: process.env.PORT || 3050,
    host: process.env.HOST || '127.0.0.1',
    env: process.env.NODE_ENV || 'development',
  },
  jwt: {
    // create a strong secret here for production use
    secret:
      process.env.JWT_SECRET ||
      'codelims_2025_secure_jwt_secret_key_d8f7a6b5c4e3f2a1b0c9d8e7f6a5b4c3',
    expiresIn: '7d',
  },
  database: {
    path: process.env.DATABASE_PATH || './packages/backend/data/codelims.db',
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000000', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '900000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: true, // Always use pretty logging for better readability
  },
  cors: {
    origin: true,
    credentials: true,
  },
};

export default config;
