import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  encryptionKey: process.env.ENCRYPTION_KEY,
  encryptionIv: process.env.ENCRYPTION_IV,
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  throttleLoginLimit: parseInt(process.env.THROTTLE_LOGIN_LIMIT || '20', 10),
  logLevel: process.env.LOG_LEVEL || 'debug',
}));
