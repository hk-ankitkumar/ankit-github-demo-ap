# Heroku Add-ons Implementation Guide

Complete guide on how the add-ons were integrated, how they work, and troubleshooting tips.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Add-ons Explained](#add-ons-explained)
4. [Implementation Details](#implementation-details)
5. [API Endpoints](#api-endpoints)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Overview

This application integrates four essential Heroku add-ons to demonstrate production-ready patterns:

- **Papertrail**: Centralized logging and log management
- **PostgreSQL**: Managed relational database
- **Redis**: In-memory caching and session storage
- **New Relic**: Application performance monitoring

All add-ons have free tiers suitable for learning and small projects.

## Architecture

### System Components

```
User Request
    |
    v
Express.js Application (index.js)
    |
    +-- Logger (logger.js) --> Papertrail
    +-- Database (db.js) --> PostgreSQL
    +-- Cache (cache.js) --> Redis
    +-- Monitoring --> New Relic APM
```

### Data Flow

1. **Request arrives** at Express.js server
2. **Request logging middleware** logs the request details
3. **Page view tracking** stores visit data in PostgreSQL
4. **Route handler** processes the request
5. **Cache layer** (Redis) speeds up repeated queries
6. **Response sent** to user
7. **New Relic** tracks performance metrics

### Environment-Based Configuration

The application uses environment variables for configuration:

```javascript
const dbUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
```

Heroku automatically sets these variables when add-ons are installed.

## Add-ons Explained

### 1. Papertrail (Logging)

**Purpose**: Centralized log aggregation and searching

**How it works**:
- Winston logger sends logs to Papertrail via Syslog protocol
- Logs are structured as JSON for easy parsing
- Searchable in real-time via Papertrail dashboard

**Implementation** (logger.js):
```javascript
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new Syslog({ host: PAPERTRAIL_HOST, port: PAPERTRAIL_PORT })
  ]
});
```

**Use cases**:
- Debugging production issues
- Monitoring application behavior
- Tracking errors and warnings
- Audit trails

### 2. PostgreSQL (Database)

**Purpose**: Persistent data storage

**How it works**:
- Connection pooling for efficient database access
- Automatic SSL connections in production
- Schema auto-initialization on startup

**Implementation** (db.js):
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

**Use cases**:
- Storing user data
- Page view analytics (implemented)
- Session storage
- Application state

**Example schema**:
```sql
CREATE TABLE page_views (
  id SERIAL PRIMARY KEY,
  path VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Redis (Caching)

**Purpose**: High-speed in-memory data storage

**How it works**:
- Key-value storage with optional TTL (Time To Live)
- Automatic reconnection on connection loss
- JSON serialization for complex data

**Implementation** (cache.js):
```javascript
const client = redis.createClient({ url: process.env.REDIS_URL });
await client.set(key, JSON.stringify(value), { EX: ttl });
```

**Use cases**:
- Caching expensive database queries
- Session storage
- Rate limiting
- Real-time counters (implemented)

### 4. New Relic (Monitoring)

**Purpose**: Application performance monitoring and error tracking

**How it works**:
- Automatically instruments Node.js application
- Tracks HTTP requests, database queries, external calls
- Must be loaded before other modules

**Implementation** (newrelic.js + index.js):
```javascript
// Must be first in index.js
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}
```

**Metrics tracked**:
- Response times
- Throughput (requests per minute)
- Error rates
- Database query performance
- External service calls

## Implementation Details

### File Structure

```
Core Modules:
- index.js          Main Express application
- logger.js         Winston logging configuration
- db.js             PostgreSQL connection and queries
- cache.js          Redis client and operations
- newrelic.js       New Relic APM configuration

Configuration:
- package.json      Dependencies
- .env.example      Environment variable template
- Procfile          Heroku process configuration
```

### Middleware Stack

1. **JSON body parser**: Parses JSON request bodies
2. **Static file server**: Serves public files
3. **Request logger**: Logs all HTTP requests with timing
4. **Page view tracker**: Records page visits to database

### Graceful Degradation

The application works even if add-ons are not configured:

```javascript
if (!pool) {
  logger.warn('PostgreSQL not configured');
  return null;
}
```

This allows local development without setting up all services.

### Error Handling

All database and cache operations include try-catch blocks:

```javascript
try {
  const result = await pool.query(sql, params);
  return result.rows;
} catch (err) {
  logger.error('Database error', err);
  return null;
}
```

### Connection Pooling

PostgreSQL uses connection pooling for efficiency:

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Graceful Shutdown

The application handles SIGTERM signals for graceful shutdown:

```javascript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing connections');
  pool.end();
  redisClient.quit();
  process.exit(0);
});
```

## API Endpoints

### GET /api/info

Returns system information and add-on status.

**Response**:
```json
{
  "app": "ankit-github-demo-app",
  "version": "1.0.0",
  "node": "v20.x.x",
  "addons": {
    "postgres": true,
    "redis": true,
    "papertrail": true,
    "newrelic": true
  }
}
```

### GET /api/health

Health check endpoint for monitoring.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T01:00:00.000Z",
  "uptime": 123.45
}
```

### GET /api/stats

Page view statistics from PostgreSQL.

**Response**:
```json
{
  "total": 150,
  "topPages": [
    { "path": "/", "views": "100", "last_view": "2025-10-02T01:00:00.000Z" },
    { "path": "/about", "views": "50", "last_view": "2025-10-02T00:59:00.000Z" }
  ]
}
```

### GET /api/cache/test

Tests Redis caching with a counter.

**Response**:
```json
{
  "message": "Redis cache working",
  "counter": 5,
  "cached": true
}
```

### POST /api/log

Creates a log entry (demonstrates Papertrail).

**Request**:
```json
{
  "level": "info",
  "message": "Test log message"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Logged at info level"
}
```

### GET /test

Web UI for testing all add-ons interactively.

## Testing

### Automated Testing

Run the complete test suite:

```bash
./test-all.sh
```

This script tests:
1. Health check endpoint
2. Add-on status verification
3. PostgreSQL page view tracking
4. Redis cache operations
5. Papertrail logging
6. New Relic monitoring (load test)

### Manual Testing

#### Test PostgreSQL

```bash
# Generate page views
curl https://your-app.herokuapp.com/
curl https://your-app.herokuapp.com/about

# Check statistics
curl https://your-app.herokuapp.com/api/stats

# Direct database access
heroku pg:psql -a ankit-github-demo-app
SELECT * FROM page_views LIMIT 10;
```

#### Test Redis

```bash
# Call multiple times to see counter increment
curl https://your-app.herokuapp.com/api/cache/test
curl https://your-app.herokuapp.com/api/cache/test
curl https://your-app.herokuapp.com/api/cache/test

# Direct Redis access
heroku redis:cli -a ankit-github-demo-app
GET test:counter
```

#### Test Papertrail

```bash
# Create log entry
curl -X POST https://your-app.herokuapp.com/api/log \
  -H "Content-Type: application/json" \
  -d '{"level": "error", "message": "Test error log"}'

# View in Papertrail
heroku addons:open papertrail -a ankit-github-demo-app
```

#### Test New Relic

```bash
# Generate traffic
for i in {1..50}; do
  curl https://your-app.herokuapp.com/api/health
done

# View metrics
heroku addons:open newrelic -a ankit-github-demo-app
```

## Troubleshooting

### Common Issues

#### Issue: Add-on shows as false in /api/info

**Cause**: Environment variable not set

**Solution**:
```bash
heroku config -a ankit-github-demo-app
```

Verify the required environment variable exists. If missing, reinstall the add-on.

#### Issue: Database connection timeout

**Cause**: Database not provisioned or connection limit reached

**Solution**:
```bash
# Check database status
heroku pg:info -a ankit-github-demo-app

# Check connections
heroku pg:ps -a ankit-github-demo-app

# Restart app to reset connections
heroku restart -a ankit-github-demo-app
```

#### Issue: Redis connection fails

**Cause**: Redis not provisioned or network issue

**Solution**:
```bash
# Check Redis status
heroku redis:info -a ankit-github-demo-app

# Check connection
heroku redis:cli -a ankit-github-demo-app
PING
```

The app handles Redis failures gracefully and will continue working.

#### Issue: Logs not appearing in Papertrail

**Cause**: Papertrail still initializing or configuration issue

**Solution**:
- Wait 1-2 minutes after adding Papertrail
- Check environment variables: PAPERTRAIL_HOST and PAPERTRAIL_PORT
- Verify logs locally: `heroku logs --tail -a ankit-github-demo-app`

#### Issue: New Relic not showing data

**Cause**: License key not set or app not generating traffic

**Solution**:
```bash
# Verify license key
heroku config:get NEW_RELIC_LICENSE_KEY -a ankit-github-demo-app

# Generate traffic
for i in {1..20}; do curl https://your-app.herokuapp.com/api/health; done

# Wait 2-3 minutes for data to appear
heroku addons:open newrelic -a ankit-github-demo-app
```

### Debugging Steps

1. **Check application logs**:
   ```bash
   heroku logs --tail -a ankit-github-demo-app
   ```

2. **Verify add-ons are installed**:
   ```bash
   heroku addons -a ankit-github-demo-app
   ```

3. **Check environment variables**:
   ```bash
   heroku config -a ankit-github-demo-app
   ```

4. **Test locally**:
   ```bash
   npm start
   curl http://localhost:3000/api/info
   ```

5. **Restart application**:
   ```bash
   heroku restart -a ankit-github-demo-app
   ```

### Performance Issues

#### Slow database queries

**Solution**:
- Add database indexes
- Use connection pooling (already implemented)
- Cache frequent queries in Redis
- Check slow queries: `heroku pg:diagnose -a ankit-github-demo-app`

#### High memory usage

**Solution**:
- Check Redis memory: `heroku redis:info -a ankit-github-demo-app`
- Review New Relic memory metrics
- Optimize database connection pool size

#### Response time degradation

**Solution**:
- Check New Relic transaction traces
- Review database query performance
- Verify Redis cache hit rate
- Consider scaling dynos: `heroku ps:scale web=2`

## FAQ

### Q: Do I need all four add-ons?

A: No, the application works without any add-ons (graceful degradation). However, for production use, logging and monitoring are highly recommended.

### Q: Can I use different add-ons?

A: Yes, you can replace these with alternatives:
- Papertrail → Logentries, Loggly
- PostgreSQL → MySQL, MongoDB
- Redis → Memcached
- New Relic → Datadog, AppDynamics

### Q: How much does this cost?

A: All add-ons have free tiers:
- Papertrail: Free (50MB/month)
- PostgreSQL: Free (10,000 rows)
- Redis: Free (25MB)
- New Relic: Free (100GB/month)

Total: $0/month for learning and small projects.

### Q: How do I scale beyond free tiers?

A: Upgrade add-ons as needed:
```bash
heroku addons:upgrade heroku-postgresql:standard-0
heroku addons:upgrade heroku-redis:premium-0
```

### Q: Can I run this locally?

A: Yes, install PostgreSQL and Redis locally, then set environment variables in .env file. The app works without these services too.

### Q: How do I backup my database?

A: Use Heroku's backup feature:
```bash
heroku pg:backups:capture -a ankit-github-demo-app
heroku pg:backups:download -a ankit-github-demo-app
```

### Q: How do I migrate data between databases?

A: Use pg_dump and pg_restore:
```bash
heroku pg:backups:capture -a ankit-github-demo-app
heroku pg:backups:restore <backup-url> DATABASE_URL -a ankit-github-demo-app
```

### Q: Can I use this in production?

A: Yes, this implementation follows production best practices:
- Connection pooling
- Error handling
- Graceful shutdown
- Structured logging
- Performance monitoring

### Q: How do I set up alerts?

A: Configure alerts in each add-on dashboard:
- Papertrail: Set up saved searches and alerts
- New Relic: Configure alert policies
- PostgreSQL: Use Heroku metrics alerts
- Redis: Monitor memory usage alerts

### Q: What's the difference between logs and monitoring?

A: 
- **Logs** (Papertrail): Detailed event records for debugging
- **Monitoring** (New Relic): Aggregated metrics and performance data

Both are complementary and serve different purposes.

### Q: How do I optimize database performance?

A:
1. Add indexes on frequently queried columns
2. Use EXPLAIN to analyze query plans
3. Cache results in Redis
4. Use connection pooling (already implemented)
5. Monitor slow queries in New Relic

### Q: Can I use this with Docker?

A: Yes, the same environment variables work in Docker. Set them in your docker-compose.yml or Dockerfile.

### Q: How do I handle database migrations?

A: Use a migration tool like node-pg-migrate or Knex.js:
```bash
npm install node-pg-migrate
npx node-pg-migrate create initial-schema
```

### Q: What happens if Redis goes down?

A: The application handles Redis failures gracefully. Cache operations return null, and the app continues working without caching.

### Q: How do I monitor costs?

A: Check usage in each add-on dashboard:
```bash
heroku addons:open papertrail -a ankit-github-demo-app
heroku addons:open heroku-postgresql -a ankit-github-demo-app
heroku addons:open heroku-redis -a ankit-github-demo-app
```

### Q: Can I use this with TypeScript?

A: Yes, convert the JavaScript files to TypeScript and add type definitions for pg, redis, winston, and newrelic.

## Additional Resources

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Winston Logger](https://github.com/winstonjs/winston)
- [New Relic Node.js Agent](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/)

## Summary

This implementation demonstrates production-ready patterns for:
- Centralized logging with Papertrail
- Database management with PostgreSQL
- Caching with Redis
- Performance monitoring with New Relic

All code follows best practices including error handling, connection pooling, graceful degradation, and proper shutdown procedures.
