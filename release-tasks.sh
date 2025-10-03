#!/bin/bash
# Release Phase Script
# This runs BEFORE your app is deployed to dynos
# Perfect for: database migrations, cache warming, pre-deployment checks

echo "=========================================="
echo "🚀 RELEASE PHASE STARTED"
echo "=========================================="
echo ""

echo "📅 Release Time: $(date)"
echo "🏗️  Build: $HEROKU_SLUG_COMMIT"
echo "📦 App: $HEROKU_APP_NAME"
echo ""

echo "=========================================="
echo "✅ Running Pre-Deployment Tasks"
echo "=========================================="
echo ""

# Task 1: Simple text output
echo "Task 1: Printing release information..."
echo "  - This is the Release Phase!"
echo "  - Running before web/worker dynos start"
echo "  - Perfect for migrations and setup tasks"
echo ""

# Task 2: Check environment variables
echo "Task 2: Checking environment variables..."
if [ -n "$DATABASE_URL" ]; then
    echo "  ✅ DATABASE_URL is set"
else
    echo "  ⚠️  DATABASE_URL is not set"
fi

if [ -n "$REDIS_URL" ]; then
    echo "  ✅ REDIS_URL is set"
else
    echo "  ⚠️  REDIS_URL is not set"
fi

if [ -n "$NEW_RELIC_LICENSE_KEY" ]; then
    echo "  ✅ NEW_RELIC_LICENSE_KEY is set"
else
    echo "  ⚠️  NEW_RELIC_LICENSE_KEY is not set"
fi
echo ""

# Task 3: Display Node.js version
echo "Task 3: Checking Node.js version..."
echo "  Node version: $(node --version)"
echo "  NPM version: $(npm --version)"
echo ""

# Task 4: Random motivational message
echo "Task 4: Motivational message for the deployment..."
MESSAGES=(
    "🎉 Great job! Your code is being deployed!"
    "🚀 To infinity and beyond!"
    "💪 This deployment is going to be awesome!"
    "🌟 Your app is getting better with every deploy!"
    "🎯 Deployment in progress - stay awesome!"
)
RANDOM_INDEX=$((RANDOM % ${#MESSAGES[@]}))
echo "  ${MESSAGES[$RANDOM_INDEX]}"
echo ""

# Task 5: Simulate a database migration check
echo "Task 5: Simulating database migration check..."
echo "  Checking if migrations are needed..."
sleep 2
echo "  ✅ All migrations up to date!"
echo ""

# Task 6: Cache warming simulation
echo "Task 6: Simulating cache warming..."
echo "  Preparing cache for optimal performance..."
sleep 1
echo "  ✅ Cache warmed successfully!"
echo ""

echo "=========================================="
echo "✅ RELEASE PHASE COMPLETED SUCCESSFULLY"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Web dynos will now start with the new code"
echo "  2. Worker dynos will restart with the new code"
echo "  3. Your app will be live in a few seconds!"
echo ""
echo "🎊 Happy deploying!"
echo ""

# Exit with success
exit 0
