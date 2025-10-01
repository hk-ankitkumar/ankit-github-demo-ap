# Ankit's GitHub Demo App

A simple Express.js application demonstrating Heroku's GitHub integration with automatic deployments.

## Features

- ✅ Express.js web server
- ✅ Multiple routes (/, /about, /api/health, /api/info)
- ✅ Beautiful responsive UI
- ✅ Health check endpoints
- ✅ Automatic deployment from GitHub
- ✅ Zero-downtime deployments

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
| `/api/info` | GET | System information (JSON) |

## Running Locally

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

## Live App

**Heroku URL:** `https://ankit-github-demo-app-<hash>.herokuapp.com/`

## Environment Variables

No environment variables required for basic functionality.

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
