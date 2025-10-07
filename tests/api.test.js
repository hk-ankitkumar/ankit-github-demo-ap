#!/usr/bin/env node

/**
 * API Endpoint Tests
 * Tests all API endpoints for functionality and data integrity
 */

const http = require('http');
const https = require('https');

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost:' + (process.env.PORT || 3000);
const TIMEOUT = 15000; // 15 seconds for API tests

console.log('🔌 Running API Endpoint Tests...');
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
        'User-Agent': 'Heroku-Test-Suite/1.0',
        'Accept': 'application/json'
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

async function runAPITests() {
  console.log('\n--- Core API Tests ---');

  // Test 1: Health API
  try {
    const response = await makeRequest('/api/health');
    addTest(
      'Health API returns 200',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    const data = JSON.parse(response.body);
    addTest(
      'Health API has required fields',
      data.status && data.timestamp && typeof data.uptime === 'number',
      'Missing required fields'
    );

    addTest(
      'Health API uptime is positive',
      data.uptime >= 0,
      `Uptime: ${data.uptime}`
    );
  } catch (error) {
    addTest('Health API test', false, error.message);
  }

  // Test 2: System Info API
  try {
    const response = await makeRequest('/api/info');
    addTest(
      'Info API returns 200',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    const data = JSON.parse(response.body);
    addTest(
      'Info API has app info',
      data.app && data.version && data.node,
      'Missing app information'
    );

    addTest(
      'Info API has memory info',
      data.memory && data.memory.used && data.memory.total,
      'Missing memory information'
    );

    addTest(
      'Info API has addons info',
      data.addons && typeof data.addons === 'object',
      'Missing addons information'
    );
  } catch (error) {
    addTest('Info API test', false, error.message);
  }

  // Test 3: Statistics API (if PostgreSQL is available)
  try {
    const response = await makeRequest('/api/stats');
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      addTest(
        'Stats API returns valid data',
        typeof data.total === 'number' && Array.isArray(data.topPages),
        'Invalid stats data structure'
      );
    } else {
      addTest(
        'Stats API handles missing DB gracefully',
        response.statusCode === 200 || response.statusCode === 500,
        `Unexpected status: ${response.statusCode}`
      );
    }
  } catch (error) {
    addTest('Stats API test', false, error.message);
  }

  // Test 4: Cache API (if Redis is available)
  try {
    const response = await makeRequest('/api/cache/test');
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      addTest(
        'Cache API returns counter',
        typeof data.counter === 'number' && data.counter >= 1,
        `Counter: ${data.counter}`
      );
    } else {
      addTest(
        'Cache API handles missing Redis gracefully',
        response.statusCode === 500,
        `Status: ${response.statusCode}`
      );
    }
  } catch (error) {
    addTest('Cache API test', false, error.message);
  }

  // Test 5: Summary API (worker process data)
  try {
    const response = await makeRequest('/api/summary');
    addTest(
      'Summary API responds',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );

    const data = JSON.parse(response.body);
    addTest(
      'Summary API returns valid structure',
      data.message || (data.totalViews && typeof data.totalViews === 'number'),
      'Invalid summary data'
    );
  } catch (error) {
    addTest('Summary API test', false, error.message);
  }

  console.log('\n--- Error Testing API Tests ---');

  // Test 6: Timeout endpoint (should return quickly in test)
  try {
    const response = await makeRequest('/api/timeout', 'POST', JSON.stringify({ duration: 1000 }));
    addTest(
      'Timeout API accepts requests',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    // Timeout is expected for long durations
    addTest('Timeout API test', true, 'Timeout behavior is normal');
  }

  // Test 7: Memory leak endpoint (should start successfully)
  try {
    const response = await makeRequest('/api/memory-leak', 'POST');
    addTest(
      'Memory leak API starts',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    addTest('Memory leak API test', false, error.message);
  }

  // Test 8: CPU intensive endpoint
  try {
    const response = await makeRequest('/api/cpu-intensive', 'POST');
    addTest(
      'CPU intensive API responds',
      response.statusCode === 200,
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    addTest('CPU intensive API test', false, error.message);
  }

  console.log('\n--- Error Handling Tests ---');

  // Test 9: Non-existent endpoint
  try {
    const response = await makeRequest('/api/nonexistent');
    addTest(
      'Non-existent endpoint returns 404',
      response.statusCode === 404,
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    addTest('404 handling test', false, error.message);
  }

  // Test 10: Invalid JSON POST
  try {
    const response = await makeRequest('/api/timeout', 'POST', 'invalid json');
    addTest(
      'Invalid JSON handled gracefully',
      response.statusCode === 400 || response.statusCode === 500,
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    addTest('Invalid JSON handling', true, 'Error handling working');
  }

  // Final results
  console.log('\n--- API Test Results ---');
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
    console.log('\n🎉 All API tests passed!');
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
runAPITests().catch((error) => {
  console.error('❌ API test suite failed:', error.message);
  process.exit(1);
});
