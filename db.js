const { Pool } = require('pg');
const logger = require('./logger');

// PostgreSQL connection pool
let pool = null;

// Initialize database connection if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  pool.on('connect', () => {
    logger.info('Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client', err);
  });

  // Initialize database schema
  initializeDatabase();
} else {
  logger.warn('DATABASE_URL not set - PostgreSQL features disabled');
}

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        path VARCHAR(255) NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Database schema initialized');
  } catch (err) {
    logger.error('Error initializing database schema', err);
  }
}

async function logPageView(path, userAgent, ipAddress) {
  if (!pool) return null;
  
  try {
    const result = await pool.query(
      'INSERT INTO page_views (path, user_agent, ip_address) VALUES ($1, $2, $3) RETURNING *',
      [path, userAgent, ipAddress]
    );
    return result.rows[0];
  } catch (err) {
    logger.error('Error logging page view', err);
    return null;
  }
}

async function getPageViewStats() {
  if (!pool) return null;
  
  try {
    const result = await pool.query(`
      SELECT 
        path,
        COUNT(*) as views,
        MAX(timestamp) as last_view
      FROM page_views
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `);
    return result.rows;
  } catch (err) {
    logger.error('Error getting page view stats', err);
    return null;
  }
}

async function getTotalPageViews() {
  if (!pool) return 0;
  
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM page_views');
    return parseInt(result.rows[0].total);
  } catch (err) {
    logger.error('Error getting total page views', err);
    return 0;
  }
}

module.exports = {
  pool,
  logPageView,
  getPageViewStats,
  getTotalPageViews
};
