# Heroku Review Apps Guide

## What are Review Apps?

Review Apps are temporary Heroku applications that are automatically created for each pull request in your GitHub repository. They provide an isolated environment for testing changes before they're merged into your main branch.

## Benefits of Review Apps

### 1. Isolated Testing Environment
- Each pull request gets its own temporary app instance
- Test changes without affecting production or staging
- Multiple developers can test different features simultaneously

### 2. Automatic Deployment
- Apps are created automatically when PRs are opened
- Updated automatically when new commits are pushed to the PR
- Destroyed automatically when PRs are closed or merged

### 3. Full Feature Testing
- Complete application with all add-ons (database, cache, etc.)
- Real environment testing, not just unit tests
- Stakeholder review with actual URLs

### 4. Cost Effective
- Only pay for resources while PR is open
- Automatic cleanup prevents resource waste
- Configurable to match your needs

## Our Review App Configuration

### App.json Configuration

Our `app.json` file defines:

```json
{
  "name": "Heroku Onboarding Demo Application",
  "formation": {
    "web": { "quantity": 1, "size": "basic" },
    "worker": { "quantity": 1, "size": "basic" }
  },
  "addons": [
    "heroku-postgresql:essential-0",
    "heroku-redis:mini", 
    "papertrail:choklad"
  ],
  "env": {
    "NODE_ENV": "review",
    "REVIEW_APP": "true"
  }
}
```

### Add-ons Included

**PostgreSQL Database**:
- Plan: `essential-0` (suitable for testing)
- Fresh database for each review app
- Isolated from production data

**Redis Cache**:
- Plan: `mini` (basic caching functionality)
- Independent cache instance
- Perfect for testing cache-dependent features

**Papertrail Logging**:
- Plan: `choklad` (basic logging)
- Separate log stream for each review app
- Easy debugging and monitoring

## Setting Up Review Apps

### Prerequisites

1. **Heroku Pipeline**: Your app must be part of a Heroku Pipeline
2. **GitHub Integration**: Repository connected to Heroku
3. **app.json**: Configuration file in your repository root

### Step 1: Create Heroku Pipeline

```bash
# Create a new pipeline
heroku pipelines:create heroku-onboarding-demo --team your-team

# Add your existing app to the pipeline as production
heroku pipelines:add heroku-onboarding-demo --app ankit-github-demo-app --stage production
```

### Step 2: Enable Review Apps

1. Go to your Heroku Dashboard
2. Navigate to your pipeline
3. Click "Enable Review Apps"
4. Configure settings:
   - **Automatically create review apps**: ✅ Enabled
   - **Automatically destroy review apps**: ✅ Enabled (after PR close/merge)
   - **Wait for CI to pass**: ✅ Enabled (if you have CI)

### Step 3: Configure GitHub Integration

1. Connect your GitHub repository to the pipeline
2. Enable automatic deploys for review apps
3. Set branch restrictions if needed

## Review App Workflow

### 1. Developer Workflow

```bash
# Create feature branch
git checkout -b feature/new-dashboard

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Add new dashboard feature"
git push origin feature/new-dashboard

# Create pull request on GitHub
# Review app is automatically created!
```

### 2. Automatic Process

When you create a PR:

1. **Heroku detects the PR** via GitHub webhook
2. **Creates new app** with unique name (e.g., `heroku-demo-pr-123`)
3. **Provisions add-ons** as specified in app.json
4. **Runs release phase** (if configured)
5. **Deploys the PR branch** code
6. **Posts comment** on PR with app URL

### 3. Testing Process

```bash
# Review app URL format
https://heroku-demo-pr-123.herokuapp.com

# Test your changes
curl https://heroku-demo-pr-123.herokuapp.com/health

# Check logs
heroku logs --tail --app heroku-demo-pr-123

# View add-ons
heroku addons --app heroku-demo-pr-123
```

### 4. Cleanup Process

When PR is closed or merged:
- Review app is automatically destroyed
- All add-ons are removed
- Resources are freed up
- No manual cleanup needed

## Environment Differences

### Production App
- **Environment**: `production`
- **Resources**: Optimized for performance
- **Data**: Real production data
- **Monitoring**: Full monitoring suite

### Review App
- **Environment**: `review`
- **Resources**: Basic tier for cost efficiency
- **Data**: Fresh/test data only
- **Monitoring**: Basic logging

### Environment Variables

Review apps automatically get:
```bash
NODE_ENV=review
REVIEW_APP=true
HEROKU_APP_NAME=heroku-demo-pr-123
HEROKU_SLUG_COMMIT=abc123def456
```

## Testing Scenarios

### 1. Feature Testing
```bash
# Test new features in isolation
https://heroku-demo-pr-123.herokuapp.com/new-feature

# Verify existing functionality still works
https://heroku-demo-pr-123.herokuapp.com/test
```

### 2. Database Changes
```bash
# Test database migrations
heroku run --app heroku-demo-pr-123 "npm run migrate"

# Verify data integrity
https://heroku-demo-pr-123.herokuapp.com/api/stats
```

### 3. Add-on Integration
```bash
# Test Redis functionality
https://heroku-demo-pr-123.herokuapp.com/api/cache/test

# Test PostgreSQL
https://heroku-demo-pr-123.herokuapp.com/api/stats
```

### 4. Error Handling
```bash
# Test error scenarios
https://heroku-demo-pr-123.herokuapp.com/errors

# Verify error codes in logs
heroku logs --app heroku-demo-pr-123 | grep -E "(H[0-9]+|R[0-9]+)"
```

## Best Practices

### 1. App.json Maintenance
- Keep add-on plans cost-effective for review apps
- Use minimal dyno sizes for testing
- Include all necessary environment variables
- Document any special setup requirements

### 2. Database Considerations
- Use separate database plans for review apps
- Don't use production data in review apps
- Consider data seeding for consistent testing

### 3. Cost Management
- Use basic/mini plans for review app add-ons
- Set up automatic destruction of old review apps
- Monitor review app usage and costs

### 4. Security
- Don't include production secrets in app.json
- Use separate credentials for review app services
- Limit review app access to team members

## Monitoring Review Apps

### View All Review Apps
```bash
# List all apps in pipeline
heroku pipelines:info heroku-onboarding-demo

# View specific review app
heroku apps:info --app heroku-demo-pr-123
```

### Logs and Debugging
```bash
# View logs
heroku logs --tail --app heroku-demo-pr-123

# Check dyno status
heroku ps --app heroku-demo-pr-123

# View add-ons
heroku addons --app heroku-demo-pr-123
```

### Performance Monitoring
```bash
# Check metrics
heroku logs --app heroku-demo-pr-123 | grep -i "response_time"

# Monitor resource usage
heroku ps:type --app heroku-demo-pr-123
```

## Troubleshooting

### Common Issues

**1. Review App Creation Failed**
```bash
# Check pipeline configuration
heroku pipelines:info heroku-onboarding-demo

# Verify app.json syntax
cat app.json | jq .

# Check GitHub integration
heroku pipelines:setup heroku-onboarding-demo --team your-team
```

**2. Add-on Provisioning Failed**
```bash
# Check add-on availability
heroku addons:plans heroku-postgresql

# Verify billing information
heroku account

# Check add-on limits
heroku limits
```

**3. Deployment Failed**
```bash
# Check build logs
heroku builds --app heroku-demo-pr-123

# Verify dependencies
npm audit

# Check release phase
heroku releases --app heroku-demo-pr-123
```

### Debug Commands
```bash
# Get detailed app info
heroku apps:info --app heroku-demo-pr-123 --json

# Check configuration
heroku config --app heroku-demo-pr-123

# View recent activity
heroku releases --app heroku-demo-pr-123
```

## Advanced Configuration

### Custom Postdeploy Script
```json
{
  "scripts": {
    "postdeploy": "npm run seed-database && npm run setup-test-data"
  }
}
```

### Environment-Specific Settings
```json
{
  "environments": {
    "review": {
      "formation": {
        "web": {"quantity": 1, "size": "basic"}
      },
      "addons": ["heroku-postgresql:essential-0"]
    }
  }
}
```

### Conditional Add-ons
```json
{
  "addons": [
    {
      "plan": "heroku-postgresql:essential-0",
      "as": "DATABASE"
    }
  ],
  "environments": {
    "review": {
      "addons": [
        "heroku-postgresql:essential-0",
        "heroku-redis:mini"
      ]
    }
  }
}
```

## Integration with CI/CD

### GitHub Actions Integration
```yaml
name: Review App Tests
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  test-review-app:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Review App
        run: sleep 60
      
      - name: Test Review App
        run: |
          curl -f $REVIEW_APP_URL/health
          curl -f $REVIEW_APP_URL/api/info
```

### Automated Testing
```bash
# Test script for review apps
#!/bin/bash
REVIEW_APP_URL="https://heroku-demo-pr-$PR_NUMBER.herokuapp.com"

# Health check
curl -f "$REVIEW_APP_URL/health" || exit 1

# Feature tests
curl -f "$REVIEW_APP_URL/test" || exit 1

# Error handling tests
curl -f "$REVIEW_APP_URL/errors" || exit 1

echo "All tests passed!"
```

## Cost Optimization

### Resource Planning
- **Basic dynos**: $7/month per dyno (only while PR is open)
- **Essential PostgreSQL**: $5/month per database
- **Mini Redis**: $3/month per instance
- **Papertrail**: Free tier available

### Cost Control Strategies
1. **Automatic cleanup**: Enable auto-destroy after PR merge
2. **Resource limits**: Use minimal dyno sizes
3. **Add-on selection**: Choose cost-effective plans
4. **Time limits**: Set maximum review app lifetime

## Conclusion

Review Apps provide a powerful way to test changes in isolation before they reach production. They enable:

- **Safer deployments** through isolated testing
- **Better collaboration** with stakeholder review
- **Faster feedback** loops in development
- **Reduced production issues** through early detection

With proper configuration and best practices, Review Apps become an essential part of your development workflow, providing confidence in your deployments while maintaining cost efficiency.

## Next Steps

1. **Set up your pipeline** and enable Review Apps
2. **Create a test PR** to see Review Apps in action
3. **Configure monitoring** for review app performance
4. **Establish team workflows** around review app usage
5. **Optimize costs** based on usage patterns

Review Apps transform how teams collaborate on features, making it easier to catch issues early and deploy with confidence.
