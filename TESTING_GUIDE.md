# Testing Guide for Heroku Onboarding Demo

## Overview

This application includes comprehensive test suites designed to validate functionality across different environments, particularly for Heroku's Review Apps and CI/CD pipeline integration.

## Test Structure

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "npm run test:health && npm run test:api && npm run test:features",
    "test:health": "node tests/health.test.js",
    "test:api": "node tests/api.test.js", 
    "test:features": "node tests/features.test.js",
    "test:review-app": "node tests/review-app.test.js",
    "test:ci": "npm run test && npm run test:review-app"
  }
}
```

### Test Files

1. **`tests/health.test.js`** - Basic health and connectivity tests
2. **`tests/api.test.js`** - API endpoint functionality tests
3. **`tests/features.test.js`** - Feature-specific and UI tests
4. **`tests/review-app.test.js`** - Review app specific tests

## Test Categories

### 1. Health Tests (`tests/health.test.js`)

**Purpose**: Verify basic application health and connectivity

**Tests Include**:
- ✅ Root endpoint responds with 200
- ✅ Root endpoint returns proper HTML
- ✅ Health API returns healthy status
- ✅ Health API includes timestamp and uptime
- ✅ System info API responds correctly
- ✅ All main HTML pages load successfully
- ✅ Review app specific health checks (if applicable)

**Environment Variables Used**:
- `APP_URL` - Application URL to test (defaults to localhost)
- `REVIEW_APP` - Enables review app specific tests

**Example Run**:
```bash
npm run test:health
```

**Sample Output**:
```
🏥 Running Health Check Tests...
Testing URL: https://your-app.herokuapp.com
✅ Root endpoint responds
✅ Root endpoint returns HTML
✅ Root endpoint contains app title
✅ Health API responds
✅ Health API returns valid JSON
✅ Health API reports healthy status
🎉 All health checks passed!
```

### 2. API Tests (`tests/api.test.js`)

**Purpose**: Test all API endpoints for functionality and data integrity

**Tests Include**:
- ✅ Health API returns proper structure
- ✅ System info API includes required fields
- ✅ Statistics API handles database presence/absence
- ✅ Cache API tests Redis connectivity
- ✅ Error testing endpoints respond correctly
- ✅ 404 handling for non-existent endpoints
- ✅ Invalid JSON handling

**Key Features**:
- Tests both successful and error scenarios
- Validates JSON response structures
- Checks add-on integration (PostgreSQL, Redis)
- Tests error handling gracefully

**Example Run**:
```bash
npm run test:api
```

### 3. Feature Tests (`tests/features.test.js`)

**Purpose**: Test specific application features and user-facing functionality

**Tests Include**:
- ✅ Navigation and UI elements
- ✅ Add-ons integration (PostgreSQL, Redis)
- ✅ Error testing dashboard functionality
- ✅ Environment-specific features
- ✅ Review app conditional features
- ✅ Performance and response times
- ✅ Security headers
- ✅ Concurrent request handling

**Environment Detection**:
- Adapts tests based on `NODE_ENV`
- Shows/hides review app features appropriately
- Tests environment-specific behavior

**Example Run**:
```bash
npm run test:features
```

### 4. Review App Tests (`tests/review-app.test.js`)

**Purpose**: Test review app specific functionality and environment

**Tests Include**:
- ✅ Review app environment variables
- ✅ Review app dashboard accessibility
- ✅ Home page review app banner
- ✅ Add-ons provisioning in review apps
- ✅ Data isolation from production
- ✅ Review app performance
- ✅ Critical features functionality

**Only Runs When**:
- `REVIEW_APP=true` environment variable is set
- Automatically skips in non-review environments

**Example Run**:
```bash
npm run test:review-app
```

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:health
npm run test:api
npm run test:features

# Run with custom URL
APP_URL=http://localhost:3000 npm test
```

### Heroku CI Integration

Tests automatically run in Heroku's CI system when:
1. Pull requests are created
2. Code is pushed to branches with CI enabled
3. Review apps are deployed

### Review App Testing

```bash
# In review app environment
npm run test:ci
```

This runs all tests including review app specific tests.

## Test Configuration

### Environment Variables

**Required for Testing**:
- `APP_URL` - URL of the application to test
- `PORT` - Port for local testing (default: 3000)

**Optional**:
- `REVIEW_APP` - Set to "true" for review app tests
- `NODE_ENV` - Environment mode (development, review, production)
- `DATABASE_URL` - PostgreSQL connection (for add-on tests)
- `REDIS_URL` - Redis connection (for cache tests)

### Heroku CI Configuration

In `app.json`:
```json
{
  "scripts": {
    "test-setup": "echo 'Setting up test environment...'",
    "test": "npm test"
  },
  "environments": {
    "test": {
      "addons": ["heroku-postgresql:essential-0"],
      "formation": {
        "web": {"quantity": 1, "size": "basic"}
      },
      "env": {
        "NODE_ENV": "test"
      }
    }
  }
}
```

## Test Results and Reporting

### Success Output
```
🎉 All health checks passed!
✅ Passed: 15
❌ Failed: 0
📊 Total: 15
```

### Failure Output
```
--- Failed Tests ---
❌ Health API responds: Request timeout
❌ PostgreSQL integration working: Connection failed
✅ Passed: 13
❌ Failed: 2
📊 Total: 15
```

### Exit Codes
- `0` - All tests passed
- `1` - One or more tests failed

## Integration with Heroku Pipeline

### Pipeline Configuration

1. **Enable Heroku CI** in your pipeline
2. **Configure test phase** to run before review app creation
3. **Set up automatic testing** on pull requests

### Review App Workflow

```
1. Developer creates PR
2. Heroku CI runs tests
3. If tests pass → Review app is created
4. If tests fail → Review app creation is blocked
5. Review app runs additional review-specific tests
```

### Test Phases

**Phase 1: CI Tests** (before deployment)
- Health checks
- API functionality
- Feature tests
- Basic integration tests

**Phase 2: Review App Tests** (after deployment)
- Environment-specific tests
- Add-on integration
- Review app dashboard
- End-to-end functionality

## Debugging Test Failures

### Common Issues

**1. Connection Timeouts**
```bash
# Increase timeout or check network
APP_URL=https://your-app.herokuapp.com npm test
```

**2. Missing Environment Variables**
```bash
# Check required variables are set
heroku config --app your-app-name
```

**3. Add-on Connectivity**
```bash
# Verify add-ons are provisioned
heroku addons --app your-app-name
```

### Debug Mode

Add debug logging to tests:
```javascript
// In test files
console.log('Testing URL:', APP_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('Review App:', process.env.REVIEW_APP);
```

### Manual Testing

```bash
# Test specific endpoints manually
curl -v https://your-app.herokuapp.com/api/health
curl -v https://your-app.herokuapp.com/api/info
```

## Best Practices

### Writing Tests

1. **Make tests independent** - Each test should work in isolation
2. **Use proper timeouts** - Account for network latency
3. **Test both success and failure scenarios**
4. **Include meaningful error messages**
5. **Test environment-specific behavior**

### Test Maintenance

1. **Update tests when adding features**
2. **Keep test data fresh and relevant**
3. **Monitor test performance and reliability**
4. **Document test requirements and dependencies**

### CI/CD Integration

1. **Run tests on every commit**
2. **Block deployments on test failures**
3. **Use different test suites for different environments**
4. **Monitor test results and trends**

## Extending the Test Suite

### Adding New Tests

1. **Create test file** in `tests/` directory
2. **Add script** to `package.json`
3. **Update main test command** to include new test
4. **Document new test** in this guide

### Example New Test File

```javascript
#!/usr/bin/env node

const http = require('http');

// Test configuration
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function runCustomTests() {
  console.log('🧪 Running Custom Tests...');
  
  // Add your tests here
  
  console.log('🎉 Custom tests completed!');
}

runCustomTests().catch(console.error);
```

### Integration with External Services

Tests can be extended to verify:
- Third-party API integrations
- Webhook functionality
- Email delivery
- File uploads
- Authentication flows

## Monitoring and Alerting

### Test Metrics

Track test performance:
- Test execution time
- Success/failure rates
- Environment-specific results
- Add-on connectivity status

### Alerts

Set up alerts for:
- Consistent test failures
- Performance degradation
- Add-on connectivity issues
- Review app creation failures

## Conclusion

This comprehensive test suite ensures:
- ✅ Application reliability across environments
- ✅ Proper review app functionality
- ✅ Add-on integration validation
- ✅ Performance monitoring
- ✅ Automated quality assurance

The tests are designed to catch issues early in the development process and ensure that review apps provide a reliable testing environment for stakeholders and developers.
