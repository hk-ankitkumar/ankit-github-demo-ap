// Load New Relic first (must be first require)
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

require('dotenv').config();
const logger = require('./logger');
const db = require('./db');
const cache = require('./cache');

// Background job processor
class WorkerProcessor {
  constructor() {
    this.isRunning = false;
    this.jobInterval = null;
  }

  async start() {
    logger.info('Worker process starting...');
    this.isRunning = true;

    // Run background jobs every 60 seconds
    this.jobInterval = setInterval(() => {
      this.processJobs();
    }, 60000);

    // Run immediately on start
    await this.processJobs();

    logger.info('Worker process started successfully');
  }

  async processJobs() {
    if (!this.isRunning) return;

    try {
      logger.info('Processing background jobs...');

      // Job 1: Clean old page views (older than 30 days)
      await this.cleanOldPageViews();

      // Job 2: Update cache statistics
      await this.updateCacheStats();

      // Job 3: Generate daily summary
      await this.generateDailySummary();

      logger.info('Background jobs completed successfully');
    } catch (err) {
      logger.error('Error processing background jobs', { error: err.message });
    }
  }

  async cleanOldPageViews() {
    if (!db.pool) {
      logger.debug('PostgreSQL not configured, skipping page view cleanup');
      return;
    }

    try {
      const result = await db.pool.query(
        "DELETE FROM page_views WHERE timestamp < NOW() - INTERVAL '30 days'"
      );
      
      if (result.rowCount > 0) {
        logger.info(`Cleaned ${result.rowCount} old page views`);
      }
    } catch (err) {
      logger.error('Error cleaning old page views', { error: err.message });
    }
  }

  async updateCacheStats() {
    if (!cache.client || !cache.client.isReady) {
      logger.debug('Redis not configured, skipping cache stats update');
      return;
    }

    try {
      // Get total page views from database
      const total = await db.getTotalPageViews();
      
      // Store in cache for quick access
      await cache.set('stats:total_views', total, 3600); // 1 hour TTL
      
      logger.info(`Updated cache stats: ${total} total views`);
    } catch (err) {
      logger.error('Error updating cache stats', { error: err.message });
    }
  }

  async generateDailySummary() {
    try {
      const stats = await db.getPageViewStats();
      const total = await db.getTotalPageViews();

      const summary = {
        timestamp: new Date().toISOString(),
        totalViews: total,
        topPages: stats ? stats.slice(0, 5) : [],
        generatedBy: 'worker-process'
      };

      // Store summary in cache
      await cache.set('daily:summary', summary, 86400); // 24 hours TTL

      logger.info('Generated daily summary', { totalViews: total });
    } catch (err) {
      logger.error('Error generating daily summary', { error: err.message });
    }
  }

  async stop() {
    logger.info('Worker process stopping...');
    this.isRunning = false;

    if (this.jobInterval) {
      clearInterval(this.jobInterval);
    }

    // Close connections
    if (db.pool) {
      await db.pool.end();
      logger.info('PostgreSQL connection closed');
    }

    if (cache.client && cache.client.isReady) {
      await cache.client.quit();
      logger.info('Redis connection closed');
    }

    logger.info('Worker process stopped');
  }
}

// Create and start worker
const worker = new WorkerProcessor();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await worker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await worker.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  worker.stop().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Start the worker
worker.start().catch((err) => {
  logger.error('Failed to start worker', { error: err.message });
  process.exit(1);
});

logger.info('Worker process initialized', {
  pid: process.pid,
  node: process.version,
  platform: process.platform
});
