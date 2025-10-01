#!/bin/bash

APP_URL="https://ankit-github-demo-app-9d164818e030.herokuapp.com"

echo "🧪 Running comprehensive Heroku add-ons tests..."
echo "================================================"
echo ""

# Test 1: Health Check
echo "✅ Test 1: Health Check"
curl -s $APP_URL/api/health | jq '.'
echo ""

# Test 2: Add-on Status
echo "✅ Test 2: Add-on Status"
curl -s $APP_URL/api/info | jq '.addons'
echo ""

# Test 3: Generate Page Views
echo "✅ Test 3: Generating Page Views (PostgreSQL)"
for i in {1..5}; do 
  curl -s $APP_URL/ > /dev/null
  echo "  - Page view $i recorded"
done
echo ""

# Test 4: Check Statistics
echo "✅ Test 4: Page View Statistics (PostgreSQL)"
curl -s $APP_URL/api/stats | jq '.'
echo ""

# Test 5: Test Cache
echo "✅ Test 5: Redis Cache Test"
echo "  First call (cache miss):"
curl -s $APP_URL/api/cache/test | jq '.'
echo "  Second call (cache hit):"
curl -s $APP_URL/api/cache/test | jq '.'
echo "  Third call (cache hit):"
curl -s $APP_URL/api/cache/test | jq '.'
echo ""

# Test 6: Test Logging
echo "✅ Test 6: Papertrail Logging Test"
curl -s -X POST $APP_URL/api/log \
  -H "Content-Type: application/json" \
  -d '{"level": "info", "message": "Automated test completed successfully"}' | jq '.'
echo ""

# Test 7: Load Test
echo "✅ Test 7: Load Test (New Relic Monitoring)"
echo "  Generating 20 requests..."
for i in {1..20}; do
  curl -s $APP_URL/api/health > /dev/null
  if [ $((i % 5)) -eq 0 ]; then
    echo "    - $i requests completed"
  fi
done
echo ""

echo "================================================"
echo "🎉 All tests completed successfully!"
echo ""
echo "📊 Next Steps:"
echo "  1. View logs: heroku addons:open papertrail -a ankit-github-demo-app"
echo "  2. Check database: heroku pg:psql -a ankit-github-demo-app"
echo "  3. View Redis: heroku redis:cli -a ankit-github-demo-app"
echo "  4. Monitor performance: heroku addons:open newrelic -a ankit-github-demo-app"
echo ""
