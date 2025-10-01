const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

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
          <a href="/about">About</a>
          <a href="/api/health">Health Check</a>
          <a href="/api/info">API Info</a>
        </div>
      </div>
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
    timestamp: new Date().toISOString()
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Deployment: GitHub Integration`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
