#!/usr/bin/env node

/**
 * Health Check Tests
 * Tests basic application health and connectivity
 */

const http = require('http');
const https = require('https');

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost:' + (process.env.PORT || 3000);
const TIMEOUT = 10000; // 10 seconds

console.log('🏥 Running Health Check Tests...');
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

function makeRequest(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = APP_URL + path;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, { timeout: TIMEOUT }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
  });
}

async function runHealthTests() {
  console.log('\n--- Basic Health Tests ---');

  // Test 1: Root endpoint
  try {
    const response = await makeRequest('/');
    addTest(
      'Root endpoint responds',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );
    
    addTest(
      'Root endpoint returns HTML',
      response.headers['content-type']?.includes('text/html'),
      `Content-Type: ${response.headers['content-type']}`
    );
    
    addTest(
      'Root endpoint contains app title',
      response.body.includes('Heroku Onboarding Demo Application'),
      'Title not found in response'
    );
  } catch (error) {
    addTest('Root endpoint responds', false, error.message);
  }

  // Test 2: Health check endpoint
  try {
    const response = await makeRequest('/api/health');
    addTest(
      'Health API responds',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    const healthData = JSON.parse(response.body);
    addTest(
      'Health API returns valid JSON',
      healthData && typeof healthData === 'object',
      'Invalid JSON response'
    );

    addTest(
      'Health API reports healthy status',
      healthData.status === 'healthy',
      `Status: ${healthData.status}`
    );

    addTest(
      'Health API includes timestamp',
      healthData.timestamp && new Date(healthData.timestamp).getTime() > 0,
      'Invalid or missing timestamp'
    );
  } catch (error) {
    addTest('Health API responds', false, error.message);
  }

  // Test 3: System info endpoint
  try {
    const response = await makeRequest('/api/info');
    addTest(
      'Info API responds',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    const infoData = JSON.parse(response.body);
    addTest(
      'Info API includes Node version',
      infoData.node && infoData.node.startsWith('v'),
      `Node version: ${infoData.node}`
    );

    addTest(
      'Info API includes memory info',
      infoData.memory && infoData.memory.used && infoData.memory.total,
      'Memory information missing'
    );
  } catch (error) {
    addTest('Info API responds', false, error.message);
  }

  // Test 4: HTML pages
  const htmlPages = [
    { path: '/health', name: 'Health Check page' },
    { path: '/info', name: 'System Info page' },
    { path: '/about', name: 'About page' },
    { path: '/test', name: 'Test Add-ons page' },
    { path: '/errors', name: 'Error Testing page' }
  ];

  for (const page of htmlPages) {
    try {
      const response = await makeRequest(page.path);
      addTest(
        `${page.name} loads`,
        response.statusCode === 200,
        `Status: ${response.statusCode}`
      );
    } catch (error) {
      addTest(`${page.name} loads`, false, error.message);
    }
  }

  // Test 5: Review App specific tests (if applicable)
  if (process.env.REVIEW_APP === 'true') {
    console.log('\n--- Review App Specific Tests ---');
    
    try {
      const response = await makeRequest('/review-app');
      addTest(
        'Review App dashboard loads',
        response.statusCode === 200,
        `Status: ${response.statusCode}`
      );

      addTest(
        'Review App dashboard shows warning',
        response.body.includes('Review App Notice'),
        'Review app warning not found'
      );
    } catch (error) {
      addTest('Review App dashboard loads', false, error.message);
    }

    // Check environment variables
    addTest(
      'REVIEW_APP environment variable set',
      process.env.REVIEW_APP === 'true',
      `REVIEW_APP: ${process.env.REVIEW_APP}`
    );

    addTest(
      'NODE_ENV is review',
      process.env.NODE_ENV === 'review',
      `NODE_ENV: ${process.env.NODE_ENV}`
    );
  }

  // Final results
  console.log('\n--- Test Results ---');
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
    console.log('\n🎉 All health checks passed!');
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
runHealthTests().catch((error) => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
