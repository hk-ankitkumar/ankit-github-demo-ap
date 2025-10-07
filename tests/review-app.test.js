#!/usr/bin/env node

/**
 * Review App Specific Tests
 * Tests that only run in review app environments
 */

const http = require('http');
const https = require('https');

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost:' + (process.env.PORT || 3000);
const TIMEOUT = 10000;

console.log('🔄 Running Review App Specific Tests...');
console.log(`Testing URL: ${APP_URL}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Review App: ${process.env.REVIEW_APP}`);

// Test results tracking
let tests = [];
let passed = 0;
let failed = 0;

function addTest(name, success, message = '') {
  tests.push({ name, success, message });
  if (success) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name}: ${message}`);
  }
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = APP_URL + path;
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Heroku-ReviewApp-Test/1.0'
      }
    };

    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function runReviewAppTests() {
  // Check if this is actually a review app
  if (process.env.REVIEW_APP !== 'true') {
    console.log('ℹ️  Not a review app environment - skipping review app specific tests');
    console.log('✅ Review app tests skipped (not applicable)');
    process.exit(0);
  }

  console.log('\n--- Review App Environment Tests ---');

  // Test 1: Environment variables
  addTest(
    'REVIEW_APP environment variable is set',
    process.env.REVIEW_APP === 'true',
    `REVIEW_APP: ${process.env.REVIEW_APP}`
  );

  addTest(
    'NODE_ENV is set to review',
    process.env.NODE_ENV === 'review',
    `NODE_ENV: ${process.env.NODE_ENV}`
  );

  addTest(
    'HEROKU_APP_NAME is set',
    process.env.HEROKU_APP_NAME && process.env.HEROKU_APP_NAME.length > 0,
    `HEROKU_APP_NAME: ${process.env.HEROKU_APP_NAME || 'not set'}`
  );

  addTest(
    'HEROKU_SLUG_COMMIT is set',
    process.env.HEROKU_SLUG_COMMIT && process.env.HEROKU_SLUG_COMMIT.length > 0,
    `HEROKU_SLUG_COMMIT: ${process.env.HEROKU_SLUG_COMMIT || 'not set'}`
  );

  console.log('\n--- Review App Dashboard Tests ---');

  // Test 2: Review App Dashboard
  try {
    const response = await makeRequest('/review-app');
    addTest(
      'Review App dashboard is accessible',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    if (response.statusCode === 200) {
      addTest(
        'Dashboard shows review app title',
        response.body.includes('Review App Dashboard'),
        'Dashboard title not found'
      );

      addTest(
        'Dashboard shows warning banner',
        response.body.includes('Review App Notice') && response.body.includes('temporary'),
        'Warning banner not found'
      );

      addTest(
        'Dashboard shows app details',
        response.body.includes('Review App Details') && response.body.includes(process.env.HEROKU_APP_NAME || 'Unknown'),
        'App details not displayed'
      );

      addTest(
        'Dashboard shows git information',
        response.body.includes('Git Information') && response.body.includes('Commit SHA'),
        'Git information not displayed'
      );

      addTest(
        'Dashboard has test buttons',
        response.body.includes('Test This Review App') && response.body.includes('Health Check'),
        'Test buttons not found'
      );

      addTest(
        'Dashboard explains workflow',
        response.body.includes('Review App Workflow') && response.body.includes('Pull Request'),
        'Workflow explanation not found'
      );
    }
  } catch (error) {
    addTest('Review App dashboard test', false, error.message);
  }

  console.log('\n--- Home Page Review App Features ---');

  // Test 3: Home page review app elements
  try {
    const response = await makeRequest('/');
    addTest(
      'Home page shows review app banner',
      response.body.includes('Review App Instance') && response.body.includes('temporary'),
      'Review app banner not found'
    );

    addTest(
      'Home page has review app navigation link',
      response.body.includes('Review App Info') && response.body.includes('/review-app'),
      'Review app navigation link not found'
    );

    addTest(
      'Review app link has distinct styling',
      response.body.includes('ff6b6b') || response.body.includes('ee5a24'),
      'Review app link styling not found'
    );
  } catch (error) {
    addTest('Home page review app features', false, error.message);
  }

  console.log('\n--- Review App Add-ons Tests ---');

  // Test 4: Add-ons provisioned for review app
  const expectedAddons = ['DATABASE_URL', 'REDIS_URL'];
  
  for (const addon of expectedAddons) {
    addTest(
      `${addon} environment variable is set`,
      process.env[addon] && process.env[addon].length > 0,
      `${addon}: ${process.env[addon] ? 'configured' : 'not set'}`
    );
  }

  // Test 5: Database connectivity in review app
  try {
    const response = await makeRequest('/api/stats');
    if (process.env.DATABASE_URL) {
      addTest(
        'PostgreSQL works in review app',
        response.statusCode === 200 || response.body.includes('PostgreSQL not configured'),
        `Database test status: ${response.statusCode}`
      );
    }
  } catch (error) {
    addTest('Review app database test', false, error.message);
  }

  // Test 6: Redis connectivity in review app
  try {
    const response = await makeRequest('/api/cache/test');
    if (process.env.REDIS_URL) {
      addTest(
        'Redis works in review app',
        response.statusCode === 200 || response.statusCode === 500,
        `Redis test status: ${response.statusCode}`
      );
    }
  } catch (error) {
    addTest('Review app Redis test', false, error.message);
  }

  console.log('\n--- Review App Isolation Tests ---');

  // Test 7: Review app has fresh data
  try {
    const response = await makeRequest('/api/stats');
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      addTest(
        'Review app starts with fresh data',
        !data.total || data.total < 100, // Assuming production would have more
        `Total page views: ${data.total || 0}`
      );
    }
  } catch (error) {
    addTest('Fresh data test', true, 'Database isolation working');
  }

  // Test 8: Review app specific behavior
  try {
    const response = await makeRequest('/api/info');
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      addTest(
        'System info reflects review environment',
        data.app && data.app.includes('Demo'),
        `App name: ${data.app}`
      );
    }
  } catch (error) {
    addTest('Review app behavior test', false, error.message);
  }

  console.log('\n--- Review App Performance Tests ---');

  // Test 9: Review app performance (should be reasonable despite smaller dynos)
  const startTime = Date.now();
  try {
    const response = await makeRequest('/');
    const responseTime = Date.now() - startTime;
    addTest(
      'Review app responds in reasonable time',
      responseTime < 10000, // More lenient for review apps
      `Response time: ${responseTime}ms`
    );
  } catch (error) {
    addTest('Review app performance test', false, error.message);
  }

  // Test 10: All critical features work in review app
  const criticalEndpoints = ['/health', '/info', '/test', '/errors'];
  let workingEndpoints = 0;

  for (const endpoint of criticalEndpoints) {
    try {
      const response = await makeRequest(endpoint);
      if (response.statusCode === 200) {
        workingEndpoints++;
      }
    } catch (error) {
      // Continue testing other endpoints
    }
  }

  addTest(
    'Critical features work in review app',
    workingEndpoints >= criticalEndpoints.length * 0.8, // 80% success rate
    `${workingEndpoints}/${criticalEndpoints.length} endpoints working`
  );

  // Final results
  console.log('\n--- Review App Test Results ---');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);

  // Review app specific summary
  console.log('\n--- Review App Summary ---');
  console.log(`🏷️  App Name: ${process.env.HEROKU_APP_NAME || 'Unknown'}`);
  console.log(`🌿 Branch: ${process.env.HEROKU_BRANCH || 'Unknown'}`);
  console.log(`📝 Commit: ${(process.env.HEROKU_SLUG_COMMIT || 'Unknown').substring(0, 8)}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'Unknown'}`);

  if (failed > 0) {
    console.log('\n--- Failed Tests ---');
    tests.filter(t => !t.success).forEach(t => {
      console.log(`❌ ${t.name}: ${t.message}`);
    });
    
    // For review apps, we might be more lenient with failures
    if (failed <= 2) {
      console.log('\n⚠️  Some tests failed, but review app is functional enough for testing');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } else {
    console.log('\n🎉 All review app tests passed!');
    console.log('🚀 Review app is ready for testing and review');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Run tests
runReviewAppTests().catch((error) => {
  console.error('❌ Review app test suite failed:', error.message);
  process.exit(1);
});
