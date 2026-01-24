// backend/src/config/config.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
  
  // Database
  databaseUrl: string;
  
  // Redis
  redisUrl: string;
  
  // JWT
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  
  // Email
  sendgridApiKey: string;
  emailFrom: string;
  
  // SMS
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  
  // Stripe
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  
  // AWS S3
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsS3Bucket: string;
  
  // OAuth
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
  
  appleClientId: string;
  appleTeamId: string;
  appleKeyId: string;
  applePrivateKey: string;
  appleCallbackUrl: string;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  databaseUrl: process.env.DATABASE_URL || '',
  
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@serenity.com',
  
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsS3Bucket: process.env.AWS_S3_BUCKET || '',
  
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  
  appleClientId: process.env.APPLE_CLIENT_ID || '',
  appleTeamId: process.env.APPLE_TEAM_ID || '',
  appleKeyId: process.env.APPLE_KEY_ID || '',
  applePrivateKey: process.env.APPLE_PRIVATE_KEY || '',
  appleCallbackUrl: process.env.APPLE_CALLBACK_URL || 'http://localhost:5000/api/auth/apple/callback',
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
