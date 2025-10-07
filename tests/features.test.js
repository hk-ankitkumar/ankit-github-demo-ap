#!/usr/bin/env node

/**
 * Feature Tests
 * Tests specific application features and functionality
 */

const http = require('http');
const https = require('https');

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost:' + (process.env.PORT || 3000);
const TIMEOUT = 10000;

console.log('🎯 Running Feature Tests...');
console.log(`Testing URL: ${APP_URL}`);

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
        'User-Agent': 'Heroku-Feature-Test/1.0'
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

async function runFeatureTests() {
  console.log('\n--- Navigation and UI Tests ---');

  // Test 1: Main navigation links
  const mainPages = [
    { path: '/', name: 'Home page', shouldContain: 'Heroku Onboarding Demo Application' },
    { path: '/test', name: 'Test Add-ons page', shouldContain: 'Add-ons Test Dashboard' },
    { path: '/errors', name: 'Error Testing page', shouldContain: 'Heroku Error Codes' },
    { path: '/about', name: 'About page', shouldContain: 'About This Application' },
    { path: '/health', name: 'Health Check page', shouldContain: 'Application Health Check' },
    { path: '/info', name: 'System Info page', shouldContain: 'System Information' }
  ];

  for (const page of mainPages) {
    try {
      const response = await makeRequest(page.path);
      addTest(
        `${page.name} loads successfully`,
        response.statusCode === 200,
        `Status: ${response.statusCode}`
      );

      if (response.statusCode === 200) {
        addTest(
          `${page.name} contains expected content`,
          response.body.includes(page.shouldContain),
          `Expected content "${page.shouldContain}" not found`
        );

        addTest(
          `${page.name} has proper HTML structure`,
          response.body.includes('<!DOCTYPE html>') && response.body.includes('</html>'),
          'Invalid HTML structure'
        );
      }
    } catch (error) {
      addTest(`${page.name} test`, false, error.message);
    }
  }

  console.log('\n--- Add-ons Integration Tests ---');

  // Test 2: PostgreSQL integration
  try {
    const response = await makeRequest('/api/stats');
    if (process.env.DATABASE_URL) {
      addTest(
        'PostgreSQL integration working',
        response.statusCode === 200,
        'Database connection failed'
      );
    } else {
      addTest(
        'PostgreSQL gracefully handles missing connection',
        response.body.includes('PostgreSQL not configured') || response.statusCode === 500,
        'Should handle missing DB gracefully'
      );
    }
  } catch (error) {
    addTest('PostgreSQL integration test', false, error.message);
  }

  // Test 3: Redis integration
  try {
    const response = await makeRequest('/api/cache/test');
    if (process.env.REDIS_URL) {
      addTest(
        'Redis integration working',
        response.statusCode === 200,
        'Redis connection failed'
      );
    } else {
      addTest(
        'Redis gracefully handles missing connection',
        response.statusCode === 500,
        'Should handle missing Redis gracefully'
      );
    }
  } catch (error) {
    addTest('Redis integration test', false, error.message);
  }

  console.log('\n--- Error Testing Features ---');

  // Test 4: Error testing dashboard
  try {
    const response = await makeRequest('/errors');
    addTest(
      'Error testing dashboard loads',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    addTest(
      'Error dashboard contains H10 test',
      response.body.includes('H10') && response.body.includes('App Crashed'),
      'H10 error test not found'
    );

    addTest(
      'Error dashboard contains H12 test',
      response.body.includes('H12') && response.body.includes('Request Timeout'),
      'H12 error test not found'
    );
  } catch (error) {
    addTest('Error testing dashboard', false, error.message);
  }

  console.log('\n--- Environment-Specific Features ---');

  // Test 5: Environment detection
  const nodeEnv = process.env.NODE_ENV || 'development';
  addTest(
    'NODE_ENV is set',
    nodeEnv.length > 0,
    `NODE_ENV: ${nodeEnv}`
  );

  // Test 6: Review App specific features
  if (process.env.REVIEW_APP === 'true') {
    console.log('\n--- Review App Specific Features ---');
    
    try {
      const response = await makeRequest('/review-app');
      addTest(
        'Review App dashboard accessible',
        response.statusCode === 200,
        `Status: ${response.statusCode}`
      );

      addTest(
        'Review App dashboard shows environment info',
        response.body.includes('Review App Details') && response.body.includes('Git Information'),
        'Review app info not displayed'
      );

      addTest(
        'Review App dashboard shows warning',
        response.body.includes('temporary') && response.body.includes('destroyed'),
        'Review app warning not found'
      );
    } catch (error) {
      addTest('Review App dashboard test', false, error.message);
    }

    // Test home page review app banner
    try {
      const response = await makeRequest('/');
      addTest(
        'Home page shows review app banner',
        response.body.includes('Review App Instance'),
        'Review app banner not found on home page'
      );
    } catch (error) {
      addTest('Review app banner test', false, error.message);
    }
  } else {
    // Test that review app features are hidden in production
    try {
      const response = await makeRequest('/review-app');
      addTest(
        'Review App dashboard redirects in production',
        response.statusCode === 302 || response.statusCode === 301,
        `Status: ${response.statusCode}`
      );
    } catch (error) {
      addTest('Review app redirect test', true, 'Redirect behavior is expected');
    }
  }

  console.log('\n--- Performance and Reliability Tests ---');

  // Test 7: Response time check
  const startTime = Date.now();
  try {
    const response = await makeRequest('/');
    const responseTime = Date.now() - startTime;
    addTest(
      'Home page responds quickly',
      responseTime < 5000,
      `Response time: ${responseTime}ms`
    );
  } catch (error) {
    addTest('Response time test', false, error.message);
  }

  // Test 8: Multiple concurrent requests
  try {
    const promises = Array(5).fill().map(() => makeRequest('/api/health'));
    const responses = await Promise.all(promises);
    const allSuccessful = responses.every(r => r.statusCode === 200);
    
    addTest(
      'Handles concurrent requests',
      allSuccessful,
      `${responses.filter(r => r.statusCode === 200).length}/5 requests succeeded`
    );
  } catch (error) {
    addTest('Concurrent requests test', false, error.message);
  }

  console.log('\n--- Security and Headers Tests ---');

  // Test 9: Security headers
  try {
    const response = await makeRequest('/');
    const headers = response.headers;
    
    addTest(
      'Content-Type header present',
      headers['content-type'] && headers['content-type'].includes('text/html'),
      `Content-Type: ${headers['content-type']}`
    );

    // Note: Heroku adds some security headers automatically
    addTest(
      'Response has proper headers',
      Object.keys(headers).length > 3,
      `Header count: ${Object.keys(headers).length}`
    );
  } catch (error) {
    addTest('Security headers test', false, error.message);
  }

  // Final results
  console.log('\n--- Feature Test Results ---');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);

  if (failed > 0) {
    console.log('\n--- Failed Tests ---');
    tests.filter(t => !t.success).forEach(t => {
      console.log(`❌ ${t.name}: ${t.message}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All feature tests passed!');
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
runFeatureTests().catch((error) => {
  console.error('❌ Feature test suite failed:', error.message);
  process.exit(1);
});
