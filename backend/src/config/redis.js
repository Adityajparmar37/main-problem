const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let client;

const getRedisClient = () => {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
    });

    client.on('connect', () => logger.info('✅ Redis connected'));
    client.on('error', (err) => logger.error('❌ Redis error', { error: err.message }));
    client.on('close', () => logger.warn('⚠️ Redis connection closed'));
  }
  return client;
};

// Helper wrappers
const redisGet = async (key) => {
  const redis = getRedisClient();
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
};

const redisSet = async (key, value, ttlSeconds) => {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn('Redis SET failed — cache disabled', { key, error: err.message });
  }
};

const redisDel = async (key) => {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (err) {
    logger.warn('Redis DEL failed', { key, error: err.message });
  }
};

const redisIncr = async (key, ttlSeconds) => {
  try {
    const redis = getRedisClient();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ttlSeconds);
    return count;
  } catch (err) {
    logger.warn('Redis INCR failed — skipping rate limit check', { key, error: err.message });
    return 0;
  }
};

const redisExpire = async (key, ttlSeconds) => {
  try {
    const redis = getRedisClient();
    await redis.expire(key, ttlSeconds);
  } catch (err) {
    logger.warn('Redis EXPIRE failed', { key, error: err.message });
  }
};

module.exports = { getRedisClient, redisGet, redisSet, redisDel, redisIncr, redisExpire };
