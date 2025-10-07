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
        .description {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .description p {
          margin: 0;
          line-height: 1.6;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Heroku Onboarding Demo Application</h1>
        <div class="badge">Deployed via GitHub Integration</div>
        
        <div class="description">
          <p>This is a comprehensive demonstration application designed to showcase Heroku's platform capabilities and best practices. 
          It demonstrates the integration of multiple Heroku add-ons, process types (web and worker), release phases, and error handling patterns. 
          The application serves as a practical learning resource for developers getting started with Heroku's cloud platform.</p>
        </div>
        
        <div class="info">
          <h3>Deployment Information</h3>
          <ul>
            <li><strong>Method:</strong> GitHub to Heroku Auto-Deploy</li>
            <li><strong>Node Version:</strong> ${process.version}</li>
            <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
          </ul>
        </div>

        <div class="links">
          <a href="/test">Test Add-ons</a>
          <a href="/errors">Error Testing</a>
          <a href="/about">About</a>
          <a href="/api/health">Health Check</a>
          <a href="/api/info">System Info</a>
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
      papertrail: true, // Papertrail works via log drains, no env var needed
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

// Error testing endpoints for Heroku error codes
app.get('/errors', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Heroku Error Code Testing</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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
        h1 { color: #ee5a24; margin-bottom: 20px; }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 30px;
          color: #856404;
        }
        .error-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .error-card {
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          padding: 20px;
          background: #f9f9f9;
        }
        .error-card h3 {
          color: #ee5a24;
          margin-bottom: 10px;
        }
        .error-code {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          margin-bottom: 30px;
          border: 2px solid #1e7e34;
        }
        .description {
          font-size: 14px;
          color: #666;
          margin-bottom: 15px;
          line-height: 1.4;
        }
        button {
          background: #ee5a24;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          margin-top: 10px;
          transition: background 0.3s;
        }
        button:hover { background: #d63031; }
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
          border-left: 4px solid #ee5a24;
        }
        .result.show { display: block; }
        .back-link {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background: #ee5a24;
          color: white;
          text-decoration: none;
          border-radius: 8px;
        }
        .back-link:hover { background: #d63031; }
        .logs-info {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          color: #1565c0;
        }
        .recovery-info {
          background: #f3e5f5;
          border: 1px solid #ce93d8;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          color: #7b1fa2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Heroku Error Code Testing Dashboard</h1>
        
        <div class="warning">
          <strong>Warning:</strong> This page is for testing and learning purposes. Some actions will crash the app or cause timeouts. 
          Use this only in development/testing environments.
        </div>

        <div class="error-grid">
          <!-- H10 Error -->
          <div class="error-card">
            <div class="error-code">H10</div>
            <h3>App Crashed</h3>
            <div class="description">
              The application process crashed. This happens when your app exits unexpectedly due to an uncaught exception, 
              memory issues, or calling process.exit().
            </div>
            <button onclick="triggerH10()">Trigger H10 - Crash App</button>
            <div class="result" id="h10-result"></div>
          </div>

          <!-- H12 Error -->
          <div class="error-card">
            <div class="error-code">H12</div>
            <h3>Request Timeout</h3>
            <div class="description">
              HTTP request took longer than 30 seconds to complete. Heroku will return a 503 error to the client 
              and terminate the request.
            </div>
            <button onclick="triggerH12()">Trigger H12 - Request Timeout</button>
            <div class="result" id="h12-result"></div>
          </div>

          <!-- H14 Error -->
          <div class="error-card">
            <div class="error-code">H14</div>
            <h3>No Web Dynos Running</h3>
            <div class="description">
              No web dynos are running. This happens when all web dynos are scaled to 0 or have crashed and 
              haven't been restarted yet.
            </div>
            <button onclick="triggerH14()">Simulate H14 - Scale Down</button>
            <div class="result" id="h14-result"></div>
          </div>

          <!-- R10 Error -->
          <div class="error-card">
            <div class="error-code">R10</div>
            <h3>Boot Timeout</h3>
            <div class="description">
              Web process failed to bind to PORT within 60 seconds of launch. This usually happens when your app 
              takes too long to start or doesn't bind to the correct port.
            </div>
            <button onclick="triggerR10()">Simulate R10 - Boot Timeout</button>
            <div class="result" id="r10-result"></div>
          </div>

          <!-- Memory Leak -->
          <div class="error-card">
            <div class="error-code">R14</div>
            <h3>Memory Quota Exceeded</h3>
            <div class="description">
              Process exceeded memory quota. This happens when your app uses more memory than allocated 
              (512MB for Basic dynos).
            </div>
            <button onclick="triggerR14()">Trigger R14 - Memory Leak</button>
            <div class="result" id="r14-result"></div>
          </div>

          <!-- High CPU -->
          <div class="error-card">
            <div class="error-code">CPU</div>
            <h3>High CPU Usage</h3>
            <div class="description">
              Simulate high CPU usage that might cause performance issues and potential throttling.
            </div>
            <button onclick="triggerHighCPU()">Trigger High CPU Usage</button>
            <div class="result" id="cpu-result"></div>
          </div>
        </div>

        <div class="logs-info">
          <strong>How to View Logs:</strong><br>
          • Real-time: <code>heroku logs --tail -a ankit-github-demo-app</code><br>
          • Recent logs: <code>heroku logs -a ankit-github-demo-app</code><br>
          • Filter by error: <code>heroku logs --tail -a ankit-github-demo-app | grep -E "(H10|H12|H14|R10|R14)"</code>
        </div>

        <div class="recovery-info">
          <strong>Recovery Actions:</strong><br>
          • <strong>App Crash (H10):</strong> Heroku automatically restarts. Check logs for root cause.<br>
          • <strong>Timeout (H12):</strong> Page refresh is enough. Optimize slow endpoints.<br>
          • <strong>No Dynos (H14):</strong> Scale up: <code>heroku ps:scale web=1</code><br>
          • <strong>Boot Timeout (R10):</strong> Fix startup issues and redeploy.<br>
          • <strong>Memory (R14):</strong> Restart app: <code>heroku restart</code> and fix memory leaks.
        </div>

        <a href="/" class="back-link">Back to Home</a>
      </div>

      <script>
        async function triggerH10() {
          const resultEl = document.getElementById('h10-result');
          resultEl.innerHTML = 'Triggering app crash... This will cause H10 error.';
          resultEl.classList.add('show');
          
          try {
            const response = await fetch('/api/crash', { method: 'POST' });
            // This likely won't execute as the app will crash
            resultEl.innerHTML = 'App crashed! Check logs for H10 error.';
          } catch (err) {
            resultEl.innerHTML = 'App crashed! Connection lost. Check logs for H10 error. App should restart automatically.';
          }
        }

        async function triggerH12() {
          const resultEl = document.getElementById('h12-result');
          resultEl.innerHTML = 'Starting long request... Wait 30+ seconds for H12 timeout.';
          resultEl.classList.add('show');
          
          try {
            const response = await fetch('/api/timeout', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ duration: 35000 }) // 35 seconds
            });
            const data = await response.text();
            resultEl.innerHTML = 'Response: ' + data;
          } catch (err) {
            resultEl.innerHTML = 'Request timed out! This should generate H12 error in logs.';
          }
        }

        async function triggerH14() {
          const resultEl = document.getElementById('h14-result');
          resultEl.innerHTML = 'H14 requires scaling web dynos to 0. This is dangerous in production!';
          resultEl.classList.add('show');
          
          resultEl.innerHTML += '<br><br><strong>To simulate H14:</strong><br>';
          resultEl.innerHTML += '1. Run: <code>heroku ps:scale web=0 -a ankit-github-demo-app</code><br>';
          resultEl.innerHTML += '2. Try accessing the app<br>';
          resultEl.innerHTML += '3. Restore: <code>heroku ps:scale web=1 -a ankit-github-demo-app</code>';
        }

        async function triggerR10() {
          const resultEl = document.getElementById('r10-result');
          resultEl.innerHTML = 'R10 requires app modification and redeployment.';
          resultEl.classList.add('show');
          
          resultEl.innerHTML += '<br><br><strong>To simulate R10:</strong><br>';
          resultEl.innerHTML += '1. Modify app to not bind to PORT<br>';
          resultEl.innerHTML += '2. Deploy the broken version<br>';
          resultEl.innerHTML += '3. App will fail to start within 60 seconds<br>';
          resultEl.innerHTML += '4. Check logs for R10 error';
        }

        async function triggerR14() {
          const resultEl = document.getElementById('r14-result');
          resultEl.innerHTML = 'Creating memory leak... This may take a few minutes.';
          resultEl.classList.add('show');
          
          try {
            const response = await fetch('/api/memory-leak', { method: 'POST' });
            const data = await response.json();
            resultEl.innerHTML = JSON.stringify(data, null, 2);
          } catch (err) {
            resultEl.innerHTML = 'Memory leak started. Monitor logs for R14 error.';
          }
        }

        async function triggerHighCPU() {
          const resultEl = document.getElementById('cpu-result');
          resultEl.innerHTML = 'Starting CPU intensive task...';
          resultEl.classList.add('show');
          
          try {
            const response = await fetch('/api/cpu-intensive', { method: 'POST' });
            const data = await response.json();
            resultEl.innerHTML = JSON.stringify(data, null, 2);
          } catch (err) {
            resultEl.innerHTML = 'CPU task may have caused timeout or crash.';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// API endpoint to crash the app (H10)
app.post('/api/crash', (req, res) => {
  logger.error('Intentionally crashing app for H10 testing');
  
  // Method 1: Uncaught exception
  setTimeout(() => {
    throw new Error('Intentional crash for H10 testing');
  }, 1000);
  
  res.json({ message: 'Crash initiated...' });
});

// API endpoint to cause timeout (H12)
app.post('/api/timeout', (req, res) => {
  const duration = req.body.duration || 35000; // 35 seconds by default
  logger.warn(`Starting timeout test for ${duration}ms`);
  
  // This will exceed Heroku's 30-second timeout
  setTimeout(() => {
    res.json({ message: 'This response will never be sent due to H12 timeout' });
  }, duration);
});

// API endpoint to create memory leak (R14)
let memoryLeakArray = [];
app.post('/api/memory-leak', (req, res) => {
  logger.warn('Starting memory leak for R14 testing');
  
  // Create a memory leak by continuously allocating memory
  const leakInterval = setInterval(() => {
    // Allocate 10MB chunks
    const chunk = new Array(10 * 1024 * 1024).fill('memory-leak-data');
    memoryLeakArray.push(chunk);
    
    const memUsage = process.memoryUsage();
    logger.warn('Memory usage:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
    });
    
    // Stop after 50 chunks (500MB) to avoid killing the demo
    if (memoryLeakArray.length > 50) {
      clearInterval(leakInterval);
      logger.error('Memory leak stopped at 500MB to prevent complete crash');
    }
  }, 1000);
  
  res.json({ 
    message: 'Memory leak started',
    note: 'Monitor logs for memory usage. Will stop at 500MB to prevent complete crash.'
  });
});

// API endpoint for CPU intensive task
app.post('/api/cpu-intensive', (req, res) => {
  logger.warn('Starting CPU intensive task');
  
  const startTime = Date.now();
  let result = 0;
  
  // CPU intensive calculation
  for (let i = 0; i < 1000000000; i++) {
    result += Math.sqrt(i);
  }
  
  const duration = Date.now() - startTime;
  logger.warn(`CPU intensive task completed in ${duration}ms`);
  
  res.json({
    message: 'CPU intensive task completed',
    duration: duration + 'ms',
    result: Math.round(result)
  });
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
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Deployment: GitHub Integration`);
  logger.info('Add-ons status:', {
    postgres: !!process.env.DATABASE_URL,
    redis: !!process.env.REDIS_URL,
    papertrail: true,
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
