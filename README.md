# Ankit's GitHub Demo App

A simple Express.js application demonstrating Heroku's GitHub integration with automatic deployments and production-ready add-ons.

## Features

- Express.js web server
- Multiple routes with responsive UI
- Health check endpoints
- Automatic deployment from GitHub
- Zero-downtime deployments
- **Heroku Add-ons Integration:**
  - Papertrail - Centralized logging
  - PostgreSQL - Database with page view tracking
  - Redis - Caching layer
  - New Relic - Performance monitoring

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Deployment:** Heroku (GitHub Integration)
- **Version Control:** Git + GitHub

## Deployment Method

This app is deployed to Heroku using **GitHub Integration** with automatic deployments enabled.

### Workflow:
1. Push code to GitHub repository
2. Heroku automatically detects the push
3. Heroku builds and deploys the new version
4. App goes live automatically

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page with deployment info |
| `/about` | GET | About page with tech details |
| `/api/health` | GET | Health check (JSON) |
| `/api/info` | GET | System information & add-on status (JSON) |
| `/api/stats` | GET | Page view statistics (PostgreSQL demo) |
| `/api/cache/test` | GET | Redis cache test with counter |
| `/api/log` | POST | Create log entry (Papertrail demo) |

## Running Locally

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

## Live App

**Heroku URL:** `https://ankit-github-demo-app-9d164818e030.herokuapp.com/`

## Heroku Add-ons

This app demonstrates integration with popular Heroku add-ons:

- **Papertrail** - Centralized logging and log management
- **Heroku Postgres** - Managed PostgreSQL database
- **Heroku Redis** - In-memory caching and session storage
- **New Relic APM** - Application performance monitoring

**Documentation:**
- [SETUP.md](./SETUP.md) - Quick setup guide
- [GUIDE.md](./GUIDE.md) - Complete implementation guide with troubleshooting

## Environment Variables

Add-ons automatically set these environment variables on Heroku:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `PAPERTRAIL_HOST` & `PAPERTRAIL_PORT` - Papertrail logging
- `NEW_RELIC_LICENSE_KEY` - New Relic monitoring

For local development, copy `.env.example` to `.env` (optional).

## Configuration Files

- `Procfile` - Tells Heroku how to run the app
- `package.json` - Node.js dependencies and scripts
- `.gitignore` - Files to exclude from Git

## Deployment to Heroku

### Via GitHub Integration (Current Method):

1. Create Heroku app
2. Connect to GitHub repository via Heroku Dashboard
3. Enable automatic deployments
4. Push to GitHub → Auto-deploy!

### Alternative: Git Push

```bash
heroku git:remote -a ankit-github-demo-app
git push heroku main
```

## Author

Ankit Kumar
