import Redis from 'ioredis';
import { config } from './config';

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  if (!config.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      tls: config.redisTls ? {} : undefined,
    });
    redisClient.connect().catch((error) => {
      console.warn('Redis connect warning:', error.message);
    });
  }

  return redisClient;
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheSetEx(key: string, ttlSeconds: number, value: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch {
    // no-op cache failure
  }
}

export async function cacheInvalidateByPrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) {
      await redis.del(...keys);
    }
  } catch {
    // no-op cache failure
  }
}
