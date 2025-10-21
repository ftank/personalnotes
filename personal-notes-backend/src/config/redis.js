const Redis = require('ioredis');

let redisClient = null;

/**
 * Initialize Redis connection
 */
const initializeRedis = async () => {
  try {
    if (redisClient) {
      console.log('Redis already initialized');
      return redisClient;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    // Wait for connection
    await redisClient.ping();

    return redisClient;
  } catch (error) {
    console.error('❌ Error initializing Redis:', error.message);
    console.warn('⚠️  Continuing without Redis (caching disabled)');
    return null;
  }
};

/**
 * Get Redis client
 * @returns {Redis} Redis client
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 */
const setCache = async (key, value, ttl = 3600) => {
  if (!redisClient) return null;

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
  } catch (error) {
    console.error('Error setting cache:', error.message);
  }
};

/**
 * Get cache value
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
const getCache = async (key) => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Error getting cache:', error.message);
    return null;
  }
};

/**
 * Delete cache value
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Error deleting cache:', error.message);
  }
};

/**
 * Delete cache by pattern
 * @param {string} pattern - Pattern to match (e.g., "user:*")
 */
const deleteCachePattern = async (pattern) => {
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('Error deleting cache pattern:', error.message);
  }
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
};

module.exports = {
  initializeRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  closeRedis
};
