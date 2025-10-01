const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

// Initialize Redis connection if REDIS_URL is provided
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis reconnection failed after 10 attempts');
          return new Error('Redis reconnection failed');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error', err);
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  // Connect to Redis
  redisClient.connect().catch((err) => {
    logger.error('Failed to connect to Redis', err);
  });
} else {
  logger.warn('REDIS_URL not set - Redis caching disabled');
}

async function get(key) {
  if (!redisClient || !redisClient.isReady) return null;
  
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`Error getting key ${key} from Redis`, err);
    return null;
  }
}

async function set(key, value, expirationSeconds = 3600) {
  if (!redisClient || !redisClient.isReady) return false;
  
  try {
    await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    logger.error(`Error setting key ${key} in Redis`, err);
    return false;
  }
}

async function del(key) {
  if (!redisClient || !redisClient.isReady) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    logger.error(`Error deleting key ${key} from Redis`, err);
    return false;
  }
}

async function increment(key) {
  if (!redisClient || !redisClient.isReady) return 0;
  
  try {
    return await redisClient.incr(key);
  } catch (err) {
    logger.error(`Error incrementing key ${key} in Redis`, err);
    return 0;
  }
}

module.exports = {
  client: redisClient,
  get,
  set,
  del,
  increment
};
