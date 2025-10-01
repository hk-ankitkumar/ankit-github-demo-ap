# Heroku Add-ons Setup

Quick setup guide for adding Heroku add-ons to your application.

## Prerequisites

- Heroku CLI installed
- Git repository connected to Heroku
- Application deployed on Heroku

## Installation

### Option 1: Automated Setup

Run the setup script to install all add-ons at once:

```bash
chmod +x setup-addons.sh
./setup-addons.sh
```

### Option 2: Manual Installation

Install each add-on individually:

```bash
# Papertrail - Logging (Free: 50MB/month)
heroku addons:create papertrail:choklad -a ankit-github-demo-app

# PostgreSQL - Database (Free: 10,000 rows)
heroku addons:create heroku-postgresql:essential-0 -a ankit-github-demo-app

# Redis - Caching (Free: 25MB)
heroku addons:create heroku-redis:mini -a ankit-github-demo-app

# New Relic - Monitoring (Free: 100GB/month)
heroku addons:create newrelic:wayne -a ankit-github-demo-app
```

## Verification

Check that all add-ons are installed:

```bash
heroku addons -a ankit-github-demo-app
```

Verify environment variables are set:

```bash
heroku config -a ankit-github-demo-app
```

You should see:
- DATABASE_URL
- REDIS_URL
- PAPERTRAIL_HOST and PAPERTRAIL_PORT
- NEW_RELIC_LICENSE_KEY

## Deployment

After installing add-ons, deploy your code:

```bash
git add .
git commit -m "Add Heroku add-ons integration"
git push origin main
```

Heroku will automatically deploy via GitHub integration.

## Testing

### Quick Test

Visit the test dashboard in your browser:
```
https://ankit-github-demo-app-9d164818e030.herokuapp.com/test
```

### Command Line Tests

Run the automated test suite:

```bash
./test-all.sh
```

Or test individual endpoints:

```bash
# Check add-on status
curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/info

# Test PostgreSQL
curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/stats

# Test Redis
curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/cache/test

# Test Papertrail
curl -X POST https://ankit-github-demo-app-9d164818e030.herokuapp.com/api/log \
  -H "Content-Type: application/json" \
  -d '{"level": "info", "message": "Test log"}'
```

## Accessing Dashboards

Open add-on dashboards to view metrics and logs:

```bash
heroku addons:open papertrail -a ankit-github-demo-app
heroku addons:open heroku-postgresql -a ankit-github-demo-app
heroku addons:open heroku-redis -a ankit-github-demo-app
heroku addons:open newrelic -a ankit-github-demo-app
```

## Local Development

For local development, copy the example environment file:

```bash
cp .env.example .env
```

Edit .env with your local database and Redis URLs if needed. The application will work without these services configured (graceful degradation).

## Troubleshooting

### Add-on not connected

Check if environment variables are set:
```bash
heroku config:get DATABASE_URL -a ankit-github-demo-app
```

### Database connection fails

Verify database status:
```bash
heroku pg:info -a ankit-github-demo-app
```

Restart the application:
```bash
heroku restart -a ankit-github-demo-app
```

### Logs not appearing

Wait 1-2 minutes for Papertrail to initialize, then check:
```bash
heroku logs --tail -a ankit-github-demo-app
```

### Redis connection timeout

Check Redis status:
```bash
heroku redis:info -a ankit-github-demo-app
```

The application handles Redis being unavailable gracefully.

## Removing Add-ons

To remove an add-on (WARNING: This deletes all data):

```bash
heroku addons:destroy papertrail -a ankit-github-demo-app
heroku addons:destroy heroku-postgresql -a ankit-github-demo-app
heroku addons:destroy heroku-redis -a ankit-github-demo-app
heroku addons:destroy newrelic -a ankit-github-demo-app
```

Always backup your database before removing it:
```bash
heroku pg:backups:capture -a ankit-github-demo-app
```
