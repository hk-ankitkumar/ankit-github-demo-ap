// Load New Relic first (must be first require)
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('./logger');
const db = require('./db');
const cache = require('./cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// Page view tracking middleware
app.use(async (req, res, next) => {
  // Track page views in database
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    await db.logPageView(req.path, req.get('user-agent'), ipAddress);
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GitHub Demo App</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
          font-size: 2.5em;
        }
        .badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          margin: 20px 0;
          font-weight: bold;
          font-size: 1.1em;
        }
        .info {
          background: #f7f7f7;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          text-align: left;
        }
        .info h3 {
          color: #667eea;
          margin-bottom: 10px;
        }
        .info ul {
          list-style: none;
          padding-left: 0;
        }
        .info li {
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .info li:last-child {
          border-bottom: none;
        }
        .links {
          margin-top: 30px;
        }
        .links a {
          display: inline-block;
          margin: 10px;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: transform 0.2s;
        }
        .links a:hover {
          transform: translateY(-2px);
          background: #764ba2;
        }
        .emoji {
          font-size: 3em;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🚀</div>
        <h1>GitHub Demo App</h1>
        <div class="badge">✅ Deployed via GitHub Integration</div>
        
        <div class="info">
          <h3>📦 Deployment Info</h3>
          <ul>
            <li><strong>Method:</strong> GitHub → Heroku Auto-Deploy</li>
            <li><strong>App Name:</strong> ankit-github-demo-app</li>
            <li><strong>Node Version:</strong> ${process.version}</li>
            <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
          </ul>
        </div>

        <div class="links">
          <a href="/test">Test Add-ons</a>
          <a href="/about">About</a>
          <a href="/api/health">Health Check</a>
          <a href="/api/info">API Info</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Add-ons Test Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 1000px;
          margin: 0 auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; margin-bottom: 30px; }
        .addon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .addon-card {
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          padding: 20px;
          background: #f9f9f9;
        }
        .addon-card h3 {
          color: #667eea;
          margin-bottom: 10px;
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .status.connected { background: #4caf50; color: white; }
        .status.disconnected { background: #f44336; color: white; }
        .status.loading { background: #ff9800; color: white; }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          margin-top: 10px;
        }
        button:hover { background: #764ba2; }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .result {
          margin-top: 15px;
          padding: 10px;
          background: white;
          border-radius: 5px;
          font-size: 12px;
          max-height: 150px;
          overflow-y: auto;
          display: none;
        }
        .result.show { display: block; }
        .result pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .back-link {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
        }
        .back-link:hover { background: #764ba2; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Add-ons Test Dashboard</h1>
        
        <div class="addon-grid">
          <!-- PostgreSQL -->
          <div class="addon-card">
            <h3>PostgreSQL</h3>
            <div class="status loading" id="pg-status">Checking...</div>
            <p>Database with page view tracking</p>
            <button onclick="testPostgres()">Test Database</button>
            <div class="result" id="pg-result"></div>
          </div>

          <!-- Redis -->
          <div class="addon-card">
            <h3>Redis</h3>
            <div class="status loading" id="redis-status">Checking...</div>
            <p>In-memory caching</p>
            <button onclick="testRedis()">Test Cache</button>
            <div class="result" id="redis-result"></div>
          </div>

          <!-- Papertrail -->
          <div class="addon-card">
            <h3>Papertrail</h3>
            <div class="status loading" id="papertrail-status">Checking...</div>
            <p>Centralized logging</p>
            <button onclick="testPapertrail()">Test Logging</button>
            <div class="result" id="papertrail-result"></div>
          </div>

          <!-- New Relic -->
          <div class="addon-card">
            <h3>New Relic</h3>
            <div class="status loading" id="newrelic-status">Checking...</div>
            <p>Performance monitoring</p>
            <button onclick="testNewRelic()">Generate Traffic</button>
            <div class="result" id="newrelic-result"></div>
          </div>
        </div>

        <a href="/" class="back-link">Back to Home</a>
      </div>

      <script>
        // Check add-on status on load
        async function checkStatus() {
          try {
            const response = await fetch('/api/info');
            const data = await response.json();
            
            updateStatus('pg', data.addons.postgres);
            updateStatus('redis', data.addons.redis);
            updateStatus('papertrail', data.addons.papertrail);
            updateStatus('newrelic', data.addons.newrelic);
          } catch (err) {
            console.error('Error checking status:', err);
          }
        }

        function updateStatus(addon, connected) {
          const statusEl = document.getElementById(addon + '-status');
          statusEl.textContent = connected ? 'Connected' : 'Not Configured';
          statusEl.className = 'status ' + (connected ? 'connected' : 'disconnected');
        }

        async function testPostgres() {
          const resultEl = document.getElementById('pg-result');
          resultEl.innerHTML = '<pre>Testing...</pre>';
          resultEl.classList.add('show');
          
          try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            resultEl.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (err) {
            resultEl.innerHTML = '<pre>Error: ' + err.message + '</pre>';
          }
        }

        async function testRedis() {
          const resultEl = document.getElementById('redis-result');
          resultEl.innerHTML = '<pre>Testing...</pre>';
          resultEl.classList.add('show');
          
          try {
            const response = await fetch('/api/cache/test');
            const data = await response.json();
            resultEl.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (err) {
            resultEl.innerHTML = '<pre>Error: ' + err.message + '</pre>';
          }
        }

        async function testPapertrail() {
          const resultEl = document.getElementById('papertrail-result');
          resultEl.innerHTML = '<pre>Sending log...</pre>';
          resultEl.classList.add('show');
          
          try {
            const response = await fetch('/api/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                level: 'info',
                message: 'Test log from dashboard at ' + new Date().toISOString()
              })
            });
            const data = await response.json();
            resultEl.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (err) {
            resultEl.innerHTML = '<pre>Error: ' + err.message + '</pre>';
          }
        }

        async function testNewRelic() {
          const resultEl = document.getElementById('newrelic-result');
          resultEl.innerHTML = '<pre>Generating traffic...</pre>';
          resultEl.classList.add('show');
          
          try {
            let count = 0;
            for (let i = 0; i < 10; i++) {
              await fetch('/api/health');
              count++;
              resultEl.innerHTML = '<pre>Generated ' + count + ' requests...</pre>';
            }
            resultEl.innerHTML = '<pre>Generated 10 requests successfully.\\nCheck New Relic dashboard for metrics.</pre>';
          } catch (err) {
            resultEl.innerHTML = '<pre>Error: ' + err.message + '</pre>';
          }
        }

        // Check status on page load
        checkStatus();
      </script>
    </body>
    </html>
  `);
});

app.get('/about', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>About - GitHub Demo App</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; margin-bottom: 20px; }
        h2 { color: #764ba2; margin: 30px 0 15px; }
        p { line-height: 1.6; margin-bottom: 15px; color: #555; }
        .back-link {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
        }
        .back-link:hover { background: #764ba2; }
        code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📖 About This App</h1>
        
        <h2>🎯 Purpose</h2>
        <p>This is a demonstration application showcasing Heroku's GitHub integration feature. It automatically deploys whenever code is pushed to the connected GitHub repository.</p>
        
        <h2>🛠️ Tech Stack</h2>
        <p>
          • <strong>Runtime:</strong> Node.js ${process.version}<br>
          • <strong>Framework:</strong> Express.js<br>
          • <strong>Deployment:</strong> Heroku (GitHub Integration)<br>
          • <strong>Version Control:</strong> Git + GitHub
        </p>
        
        <h2>🚀 Deployment Workflow</h2>
        <p>
          1. Code changes pushed to GitHub<br>
          2. Heroku detects the push automatically<br>
          3. Heroku builds and deploys the new version<br>
          4. App is live with zero downtime
        </p>
        
        <h2>📡 Available Endpoints</h2>
        <p>
          • <code>GET /</code> - Home page<br>
          • <code>GET /about</code> - This page<br>
          • <code>GET /api/health</code> - Health check endpoint<br>
          • <code>GET /api/info</code> - System information
        </p>
        
        <a href="/" class="back-link">← Back to Home</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    app: 'ankit-github-demo-app',
    version: '1.0.0',
    deploymentMethod: 'GitHub Integration',
    node: process.version,
    platform: process.platform,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    addons: {
      postgres: !!process.env.DATABASE_URL,
      redis: !!process.env.REDIS_URL,
      papertrail: !!(process.env.PAPERTRAIL_HOST && process.env.PAPERTRAIL_PORT),
      newrelic: !!process.env.NEW_RELIC_LICENSE_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// New endpoint: Page view statistics (demonstrates PostgreSQL)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getPageViewStats();
    const total = await db.getTotalPageViews();
    
    if (stats === null) {
      return res.json({
        message: 'PostgreSQL not configured',
        total: 0,
        topPages: []
      });
    }
    
    logger.info('Page view stats requested', { total });
    
    res.json({
      total,
      topPages: stats
    });
  } catch (err) {
    logger.error('Error fetching stats', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// New endpoint: Cache demo (demonstrates Redis)
app.get('/api/cache/test', async (req, res) => {
  try {
    const cacheKey = 'test:counter';
    
    // Try to get from cache
    let counter = await cache.get(cacheKey);
    
    if (counter === null) {
      counter = 1;
      await cache.set(cacheKey, counter, 300); // 5 minutes TTL
      logger.info('Cache miss - initialized counter');
    } else {
      counter++;
      await cache.set(cacheKey, counter, 300);
      logger.info('Cache hit - incremented counter', { counter });
    }
    
    res.json({
      message: 'Redis cache working',
      counter,
      cached: counter > 1
    });
  } catch (err) {
    logger.error('Error testing cache', err);
    res.status(500).json({ 
      error: 'Cache test failed',
      message: process.env.REDIS_URL ? 'Redis error' : 'Redis not configured'
    });
  }
});

// New endpoint: Get daily summary (from worker process cache)
app.get('/api/summary', async (req, res) => {
  try {
    const summary = await cache.get('daily:summary');
    
    if (!summary) {
      return res.json({
        message: 'No summary available yet',
        note: 'Worker process generates summary every 60 seconds'
      });
    }
    
    logger.info('Daily summary requested');
    res.json(summary);
  } catch (err) {
    logger.error('Error fetching summary', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// New endpoint: Logging demo (demonstrates Papertrail/Winston)
app.post('/api/log', (req, res) => {
  const { level = 'info', message = 'Test log message' } = req.body;
  
  switch (level) {
    case 'error':
      logger.error(message, { source: 'api', timestamp: new Date() });
      break;
    case 'warn':
      logger.warn(message, { source: 'api', timestamp: new Date() });
      break;
    case 'debug':
      logger.debug(message, { source: 'api', timestamp: new Date() });
      break;
    default:
      logger.info(message, { source: 'api', timestamp: new Date() });
  }
  
  res.json({
    success: true,
    message: `Logged at ${level} level`,
    note: 'Check Papertrail or console for logs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Not Found</title>
      <style>
        body {
          font-family: sans-serif;
          text-align: center;
          padding: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        h1 { font-size: 4em; }
        a { color: white; text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/">Go Home</a>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Deployment: GitHub Integration`);
  logger.info('Add-ons status:', {
    postgres: !!process.env.DATABASE_URL,
    redis: !!process.env.REDIS_URL,
    papertrail: !!(process.env.PAPERTRAIL_HOST && process.env.PAPERTRAIL_PORT),
    newrelic: !!process.env.NEW_RELIC_LICENSE_KEY
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  // Close database connections
  if (db.pool) {
    db.pool.end(() => {
      logger.info('PostgreSQL pool closed');
    });
  }
  
  // Close Redis connection
  if (cache.client && cache.client.isReady) {
    cache.client.quit().then(() => {
      logger.info('Redis connection closed');
    });
  }
  
  process.exit(0);
});
