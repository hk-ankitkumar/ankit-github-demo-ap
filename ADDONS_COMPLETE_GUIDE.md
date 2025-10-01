# Complete Heroku Add-ons Setup and Usage Guide

This comprehensive guide covers everything you need to know about setting up, configuring, and using Heroku add-ons in your application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Add-ons Overview](#add-ons-overview)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [Web vs Worker Processes](#web-vs-worker-processes)
6. [Use Cases and Examples](#use-cases-and-examples)
7. [Testing](#testing)
8. [Monitoring and Dashboards](#monitoring-and-dashboards)
9. [Troubleshooting](#troubleshooting)
10. [Cost Management](#cost-management)

## Quick Start

### Install All Add-ons (Automated)

```bash
./setup-addons.sh
```

### Install All Add-ons (Manual)

```bash
heroku addons:create papertrail:choklad -a ankit-github-demo-app
heroku addons:create heroku-postgresql:essential-0 -a ankit-github-demo-app
heroku addons:create heroku-redis:mini -a ankit-github-demo-app
heroku addons:create newrelic:wayne -a ankit-github-demo-app
```

### Enable Worker Process

```bash
heroku ps:scale worker=1 -a ankit-github-demo-app
```

### Verify Installation

Visit: https://ankit-github-demo-app-9d164818e030.herokuapp.com/test

## Add-ons Overview

### 1. Papertrail - Centralized Logging

**What it does**: Aggregates all application logs in one searchable interface

**Free Tier**: 50MB/month, 7-day retention

**Why you need it**:
- Debug production issues without SSH access
- Search logs in real-time
- Set up alerts for errors
- Track application behavior

**Environment Variables Set**:
- `PAPERTRAIL_HOST`
- `PAPERTRAIL_PORT`
- `PAPERTRAIL_API_TOKEN`

### 2. PostgreSQL - Relational Database

**What it does**: Managed PostgreSQL database with automatic backups

**Free Tier**: 10,000 rows, 1GB storage

**Why you need it**:
- Store persistent data (users, posts, etc.)
- Relational data with ACID compliance
- Automatic backups
- Easy scaling

**Environment Variables Set**:
- `DATABASE_URL` (connection string)

### 3. Redis - In-Memory Cache

**What it does**: Fast in-memory data store for caching and sessions

**Free Tier**: 25MB storage

**Why you need it**:
- Cache expensive database queries
- Store user sessions
- Rate limiting
- Real-time features (pub/sub)

**Environment Variables Set**:
- `REDIS_URL` (connection string)

### 4. New Relic - Application Monitoring

**What it does**: Tracks application performance, errors, and user experience

**Free Tier**: 100GB/month data ingestion

**Why you need it**:
- Monitor response times
- Track errors and exceptions
- Identify slow database queries
- Understand user behavior

**Environment Variables Set**:
- `NEW_RELIC_LICENSE_KEY`
- `NEW_RELIC_APP_NAME`

## Installation Methods

### Method 1: Heroku Dashboard (UI)

1. Go to https://dashboard.heroku.com/apps/ankit-github-demo-app
2. Click on "Resources" tab
3. In "Add-ons" section, search for each add-on:
   - Search "Papertrail" → Select "Papertrail" → Choose "Choklad" plan → Submit
   - Search "Postgres" → Select "Heroku Postgres" → Choose "Essential-0" plan → Submit
   - Search "Redis" → Select "Heroku Redis" → Choose "Mini" plan → Submit
   - Search "New Relic" → Select "New Relic APM" → Choose "Wayne" plan → Submit

### Method 2: Heroku CLI

```bash
# Install all at once
heroku addons:create papertrail:choklad -a ankit-github-demo-app
heroku addons:create heroku-postgresql:essential-0 -a ankit-github-demo-app
heroku addons:create heroku-redis:mini -a ankit-github-demo-app
heroku addons:create newrelic:wayne -a ankit-github-demo-app
```

### Method 3: Setup Script

```bash
chmod +x setup-addons.sh
./setup-addons.sh
```

### Verify Installation

```bash
# List all add-ons
heroku addons -a ankit-github-demo-app

# Check environment variables
heroku config -a ankit-github-demo-app
```

## Configuration

### PostgreSQL Configuration

**Automatic Setup**: Database schema is automatically created on first connection

**Manual Database Access**:
```bash
# Connect to database
heroku pg:psql -a ankit-github-demo-app

# Run queries
SELECT * FROM page_views LIMIT 10;

# Exit
\q
```

**Backup Database**:
```bash
# Create backup
heroku pg:backups:capture -a ankit-github-demo-app

# List backups
heroku pg:backups -a ankit-github-demo-app

# Download backup
heroku pg:backups:download -a ankit-github-demo-app
```

**Database Info**:
```bash
heroku pg:info -a ankit-github-demo-app
```

### Redis Configuration

**Check Status**:
```bash
heroku redis:info -a ankit-github-demo-app
```

**Access Redis CLI**:
```bash
heroku redis:cli -a ankit-github-demo-app

# Commands:
KEYS *              # List all keys
GET key_name        # Get value
TTL key_name        # Check time to live
FLUSHALL            # Clear all data (careful!)
```

**Monitor Memory**:
```bash
heroku redis:maxmemory -a ankit-github-demo-app
```

### Papertrail Configuration

**View Logs**:
```bash
# Real-time logs
heroku logs --tail -a ankit-github-demo-app

# Open Papertrail dashboard
heroku addons:open papertrail -a ankit-github-demo-app
```

**Search Logs** (in Papertrail dashboard):
- Search for errors: `error`
- Search for specific endpoint: `GET /api/stats`
- Search by time range: Use date picker

**Set Up Alerts**:
1. Open Papertrail dashboard
2. Create a search (e.g., "error")
3. Click "Save Search"
4. Click "Create Alert"
5. Configure email/webhook notifications

### New Relic Configuration

**Open Dashboard**:
```bash
heroku addons:open newrelic -a ankit-github-demo-app
```

**What to Monitor**:
- **Overview**: Response time, throughput, error rate
- **Transactions**: Slowest endpoints
- **Databases**: Slow queries
- **Errors**: Exception tracking
- **Browser**: Frontend performance (if configured)

**Set Up Alerts**:
1. Open New Relic dashboard
2. Go to "Alerts & AI" → "Alert Policies"
3. Create new policy
4. Add conditions (e.g., response time > 1s)
5. Set notification channels

## Web vs Worker Processes

### Process Types

**Web Process** (`web: node index.js`):
- Handles HTTP requests
- Serves web pages and API endpoints
- Always running (required)
- Responds to user interactions

**Worker Process** (`worker: node worker.js`):
- Runs background jobs
- Processes async tasks
- Optional but recommended
- Doesn't handle HTTP requests

### Why Separate Processes?

1. **Performance**: Web process stays responsive
2. **Scalability**: Scale web and workers independently
3. **Reliability**: Worker crashes don't affect web
4. **Resource Management**: Different memory/CPU needs

### Current Implementation

**Web Process** (index.js):
- Serves HTTP requests
- API endpoints
- Real-time user interactions

**Worker Process** (worker.js):
- Cleans old page views (every 60 seconds)
- Updates cache statistics
- Generates daily summaries
- Background data processing

### Managing Processes

**Check Process Status**:
```bash
heroku ps -a ankit-github-demo-app
```

**Scale Processes**:
```bash
# Scale web dynos
heroku ps:scale web=1 -a ankit-github-demo-app

# Enable worker
heroku ps:scale worker=1 -a ankit-github-demo-app

# Disable worker
heroku ps:scale worker=0 -a ankit-github-demo-app

# Scale both
heroku ps:scale web=2 worker=1 -a ankit-github-demo-app
```

**Restart Processes**:
```bash
# Restart all
heroku restart -a ankit-github-demo-app

# Restart specific process
heroku restart web -a ankit-github-demo-app
heroku restart worker -a ankit-github-demo-app
```

**View Logs by Process**:
```bash
# Web logs only
heroku logs --tail --ps web -a ankit-github-demo-app

# Worker logs only
heroku logs --tail --ps worker -a ankit-github-demo-app
```

## Use Cases and Examples

### Use Case 1: User Authentication System

**PostgreSQL**: Store user accounts
```javascript
// Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Insert user
await pool.query(
  'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
  [email, hashedPassword]
);
```

**Redis**: Store sessions
```javascript
// Store session
await cache.set(`session:${sessionId}`, {
  userId: user.id,
  email: user.email
}, 3600); // 1 hour

// Get session
const session = await cache.get(`session:${sessionId}`);
```

**Papertrail**: Log authentication events
```javascript
logger.info('User logged in', { userId: user.id, email: user.email });
logger.warn('Failed login attempt', { email, ip: req.ip });
```

**New Relic**: Monitor login performance
- Track login endpoint response time
- Monitor failed login rate
- Alert on authentication errors

### Use Case 2: Blog Platform

**PostgreSQL**: Store posts and comments
```javascript
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  author_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  user_id INTEGER REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Redis**: Cache popular posts
```javascript
// Cache post
await cache.set(`post:${postId}`, postData, 3600);

// Get from cache first
let post = await cache.get(`post:${postId}`);
if (!post) {
  post = await db.getPost(postId);
  await cache.set(`post:${postId}`, post, 3600);
}
```

**Worker**: Generate trending posts
```javascript
// In worker.js
async function updateTrendingPosts() {
  const trending = await db.query(`
    SELECT p.*, COUNT(c.id) as comment_count
    FROM posts p
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY p.id
    ORDER BY comment_count DESC
    LIMIT 10
  `);
  
  await cache.set('trending:posts', trending.rows, 3600);
}
```

### Use Case 3: E-commerce Platform

**PostgreSQL**: Products, orders, inventory
```javascript
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2),
  stock INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total DECIMAL(10,2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Redis**: Shopping cart
```javascript
// Add to cart
await cache.set(`cart:${userId}`, cartItems, 86400); // 24 hours

// Get cart
const cart = await cache.get(`cart:${userId}`);
```

**Worker**: Process orders, send emails
```javascript
async function processOrders() {
  const pendingOrders = await db.getPendingOrders();
  
  for (const order of pendingOrders) {
    await processPayment(order);
    await sendConfirmationEmail(order);
    await updateInventory(order);
    logger.info('Order processed', { orderId: order.id });
  }
}
```

**New Relic**: Monitor checkout performance
- Track checkout funnel
- Monitor payment gateway response times
- Alert on failed transactions

### Use Case 4: API Rate Limiting

**Redis**: Track API usage
```javascript
async function checkRateLimit(userId, limit = 100) {
  const key = `ratelimit:${userId}:${Date.now() / 60000 | 0}`;
  const current = await cache.increment(key);
  
  if (current === 1) {
    await cache.client.expire(key, 60); // Expire in 60 seconds
  }
  
  if (current > limit) {
    throw new Error('Rate limit exceeded');
  }
  
  return { remaining: limit - current };
}
```

### Use Case 5: Analytics Dashboard

**PostgreSQL**: Store events
```javascript
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100),
  user_id INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Track event
await pool.query(
  'INSERT INTO events (event_type, user_id, metadata) VALUES ($1, $2, $3)',
  ['page_view', userId, { page: '/products', referrer: req.headers.referer }]
);
```

**Worker**: Generate analytics reports
```javascript
async function generateDailyReport() {
  const stats = await db.query(`
    SELECT 
      event_type,
      COUNT(*) as count,
      DATE(created_at) as date
    FROM events
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY event_type, DATE(created_at)
  `);
  
  await cache.set('analytics:daily', stats.rows, 86400);
  logger.info('Daily analytics generated');
}
```

**Redis**: Cache dashboard data
```javascript
// Cache expensive aggregations
const dashboardData = await cache.get('dashboard:stats');
if (!dashboardData) {
  const data = await db.getComplexStats();
  await cache.set('dashboard:stats', data, 300); // 5 minutes
}
```

## Testing

### Interactive Test Dashboard

Visit: https://ankit-github-demo-app-9d164818e030.herokuapp.com/test

Features:
- Real-time status for all add-ons
- Test buttons for each service
- Visual feedback
- JSON response display

### Command Line Testing

**Test All Add-ons**:
```bash
./test-all.sh
```

**Test Individual Add-ons**:

```bash
# PostgreSQL
curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/stats

# Redis
curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/cache/test

# Papertrail
curl -X POST https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/log \
  -H "Content-Type: application/json" \
  -d '{"level": "info", "message": "Test"}'

# Worker Summary
curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/summary
```

## Monitoring and Dashboards

### Papertrail Dashboard

**Access**: `heroku addons:open papertrail -a ankit-github-demo-app`

**Features**:
- Real-time log streaming
- Full-text search
- Saved searches
- Email alerts
- Log archiving

**Common Searches**:
- Errors: `error OR exception`
- Slow requests: `duration > 1000`
- Specific user: `userId:123`
- Worker logs: `worker`

### PostgreSQL Dashboard

**Access**: `heroku addons:open heroku-postgresql -a ankit-github-demo-app`

**Features**:
- Connection stats
- Database size
- Query performance
- Backup status

**Useful Commands**:
```bash
# Database info
heroku pg:info -a ankit-github-demo-app

# Active connections
heroku pg:ps -a ankit-github-demo-app

# Diagnose issues
heroku pg:diagnose -a ankit-github-demo-app
```

### Redis Dashboard

**Access**: `heroku addons:open heroku-redis -a ankit-github-demo-app`

**Features**:
- Memory usage
- Hit/miss ratio
- Connection count
- Key statistics

**Useful Commands**:
```bash
# Redis info
heroku redis:info -a ankit-github-demo-app

# Memory stats
heroku redis:maxmemory -a ankit-github-demo-app

# Metrics
heroku redis:metrics -a ankit-github-demo-app
```

### New Relic Dashboard

**Access**: `heroku addons:open newrelic -a ankit-github-demo-app`

**Key Metrics**:
- **Apdex Score**: User satisfaction (aim for > 0.9)
- **Response Time**: Average request duration
- **Throughput**: Requests per minute
- **Error Rate**: Percentage of failed requests

**Important Views**:
- **Transactions**: See slowest endpoints
- **Databases**: Identify slow queries
- **Errors**: Track exceptions
- **Service Maps**: Visualize dependencies

## Troubleshooting

### Add-ons Show "Not Configured"

**Problem**: Test dashboard shows "Not Configured"

**Solution**:
```bash
# Check if add-ons are installed
heroku addons -a ankit-github-demo-app

# Check environment variables
heroku config -a ankit-github-demo-app

# Restart app
heroku restart -a ankit-github-demo-app

# Wait 2-3 minutes and test again
```

### PostgreSQL Connection Errors

**Problem**: Database connection timeout

**Solutions**:
```bash
# Check database status
heroku pg:info -a ankit-github-demo-app

# Check connections
heroku pg:ps -a ankit-github-demo-app

# If too many connections, restart
heroku restart -a ankit-github-demo-app

# Check logs
heroku logs --tail --ps web -a ankit-github-demo-app
```

### Redis Connection Fails

**Problem**: Redis timeout or connection refused

**Solutions**:
```bash
# Check Redis status
heroku redis:info -a ankit-github-demo-app

# Check if Redis is provisioned
heroku addons:info redis -a ankit-github-demo-app

# Application handles Redis gracefully, check logs
heroku logs --tail -a ankit-github-demo-app | grep -i redis
```

### Papertrail Logs Not Appearing

**Problem**: Logs not showing in Papertrail

**Solutions**:
1. Wait 2-3 minutes after adding Papertrail
2. Check environment variables:
   ```bash
   heroku config:get PAPERTRAIL_HOST -a ankit-github-demo-app
   heroku config:get PAPERTRAIL_PORT -a ankit-github-demo-app
   ```
3. Verify logs are being generated:
   ```bash
   heroku logs --tail -a ankit-github-demo-app
   ```
4. Restart application:
   ```bash
   heroku restart -a ankit-github-demo-app
   ```

### Worker Process Not Running

**Problem**: Worker jobs not executing

**Solutions**:
```bash
# Check if worker is scaled
heroku ps -a ankit-github-demo-app

# Scale worker to 1
heroku ps:scale worker=1 -a ankit-github-demo-app

# Check worker logs
heroku logs --tail --ps worker -a ankit-github-demo-app

# Restart worker
heroku restart worker -a ankit-github-demo-app
```

### New Relic Not Showing Data

**Problem**: No data in New Relic dashboard

**Solutions**:
1. Verify license key:
   ```bash
   heroku config:get NEW_RELIC_LICENSE_KEY -a ankit-github-demo-app
   ```
2. Generate traffic:
   ```bash
   for i in {1..20}; do curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/health; done
   ```
3. Wait 2-3 minutes for data to appear
4. Check logs for New Relic errors:
   ```bash
   heroku logs --tail -a ankit-github-demo-app | grep -i "new relic"
   ```

## Cost Management

### Free Tier Limits

| Add-on | Free Tier | Paid Starts At |
|--------|-----------|----------------|
| Papertrail | 50MB/month, 7-day retention | $7/month |
| PostgreSQL | 10,000 rows, 1GB storage | $5/month |
| Redis | 25MB | $3/month |
| New Relic | 100GB/month | Free tier sufficient |
| **Worker Dyno** | 550 hours/month (free tier) | $7/month (Eco) |

### Monitor Usage

**PostgreSQL**:
```bash
heroku pg:info -a ankit-github-demo-app
# Check "Rows" and "Data Size"
```

**Redis**:
```bash
heroku redis:info -a ankit-github-demo-app
# Check "Memory Usage"
```

**Dyno Hours**:
```bash
heroku ps -a ankit-github-demo-app
# Free tier: 550 hours/month
# With worker: ~720 hours/month needed (web + worker)
# Consider Eco dynos ($5/month) for both
```

### Optimization Tips

1. **Database**: Add indexes, clean old data
2. **Redis**: Set appropriate TTLs, don't cache everything
3. **Logs**: Use appropriate log levels
4. **Worker**: Adjust job frequency based on needs
5. **Dynos**: Scale down worker when not needed

### Upgrade When Needed

```bash
# Upgrade PostgreSQL
heroku addons:upgrade heroku-postgresql:standard-0 -a ankit-github-demo-app

# Upgrade Redis
heroku addons:upgrade heroku-redis:premium-0 -a ankit-github-demo-app

# Upgrade to Eco dynos (recommended for production)
heroku ps:type eco -a ankit-github-demo-app
```

## Summary

You now have a complete production-ready setup with:

- **Papertrail**: Centralized logging
- **PostgreSQL**: Persistent database
- **Redis**: High-speed caching
- **New Relic**: Performance monitoring
- **Web Process**: HTTP request handling
- **Worker Process**: Background job processing

All add-ons work together to provide a scalable, monitored, and maintainable application infrastructure.

For more details, see:
- [SETUP.md](./SETUP.md) - Quick setup guide
- [GUIDE.md](./GUIDE.md) - Implementation details
