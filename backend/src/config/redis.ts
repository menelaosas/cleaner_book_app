import { createClient } from 'redis';
import { config } from './config';

export const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

redisClient.connect().catch(console.error);

export default redisClient;
