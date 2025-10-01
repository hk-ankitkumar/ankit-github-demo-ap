#!/bin/bash

# Heroku Add-ons Setup Script
# This script helps you quickly add all the recommended add-ons to your Heroku app

APP_NAME="ankit-github-demo-app"

echo "🚀 Setting up Heroku Add-ons for $APP_NAME"
echo "============================================"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo "✅ Heroku CLI found"
echo ""

# Function to add an add-on
add_addon() {
    local addon_name=$1
    local addon_plan=$2
    local description=$3
    
    echo "📦 Adding $description..."
    if heroku addons:create "$addon_name:$addon_plan" -a "$APP_NAME"; then
        echo "✅ $description added successfully"
    else
        echo "⚠️  Failed to add $description (it may already exist)"
    fi
    echo ""
}

# Add Papertrail for logging
add_addon "papertrail" "choklad" "Papertrail (Logging)"

# Add PostgreSQL database
add_addon "heroku-postgresql" "essential-0" "Heroku Postgres (Database)"

# Add Redis for caching
add_addon "heroku-redis" "mini" "Heroku Redis (Caching)"

# Add New Relic for monitoring
add_addon "newrelic" "wayne" "New Relic APM (Monitoring)"

echo "============================================"
echo "🎉 Add-on setup complete!"
echo ""
echo "📋 View all add-ons:"
echo "   heroku addons -a $APP_NAME"
echo ""
echo "🔍 Check add-on status in your app:"
echo "   curl https://$APP_NAME-9d164818e030.herokuapp.com/api/info"
echo ""
echo "📖 For detailed usage instructions, see HEROKU_ADDONS_GUIDE.md"
