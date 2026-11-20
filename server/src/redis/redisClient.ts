import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DIAGNOSIS_TTL = 60 * 60;       // 1 hour
const CHECKER_TTL  = 60 * 30;        // 30 minutes

let redis: Redis | null = null;
let redisConnected = false;

function getRedisClient(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis(REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => {
      redisConnected = true;
      console.log('✅ Redis connected');
    });
    redis.on('error', (err: Error) => {
      if (redisConnected) {
        console.warn('⚠️  Redis error — caching disabled:', err.message);
      }
      redisConnected = false;
    });
    redis.on('close', () => {
      redisConnected = false;
    });

    redis.connect().catch(() => {
      console.warn('⚠️  Redis not available — running without cache');
    });
  } catch {
    console.warn('⚠️  Redis init failed — running without cache');
  }
  return redis;
}

export function isRedisConnected(): boolean {
  return redisConnected;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !redisConnected) return null;
  try {
    const val = await client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttl: number = DIAGNOSIS_TTL): Promise<void> {
  const client = getRedisClient();
  if (!client || !redisConnected) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // silently fail — cache is non-critical
  }
}

export async function deleteCached(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client || !redisConnected) return;
  try {
    await client.del(key);
  } catch { /* ignore */ }
}

export { DIAGNOSIS_TTL, CHECKER_TTL };
export default getRedisClient;
