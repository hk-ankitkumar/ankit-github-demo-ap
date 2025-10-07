#!/bin/bash

echo "==================================="
echo "Heroku Error Codes Testing Script"
echo "==================================="
echo ""

APP_NAME="ankit-github-demo-app"
APP_URL="https://ankit-github-demo-app-9d164818e030.herokuapp.com"

echo "Testing Heroku Error Codes for: $APP_NAME"
echo "App URL: $APP_URL"
echo ""

# Function to show logs with error filtering
show_error_logs() {
    echo "Recent error logs:"
    heroku logs -a $APP_NAME -n 50 | grep -E "(H[0-9]+|R[0-9]+|error|timeout)" | tail -10
    echo ""
}

# Test H12 - Request Timeout
test_h12() {
    echo "=== Testing H12 - Request Timeout ==="
    echo "This will trigger a 35-second request (exceeds Heroku's 30s limit)"
    echo ""
    
    echo "Starting timeout request..."
    curl -X POST $APP_URL/api/timeout \
         -H "Content-Type: application/json" \
         -d '{"duration": 35000}' \
         --max-time 35 \
         --silent \
         --show-error \
         --write-out "HTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
         > /dev/null 2>&1 &
    
    CURL_PID=$!
    echo "Request started (PID: $CURL_PID)"
    echo "Waiting 35 seconds for timeout..."
    
    # Wait and show progress
    for i in {1..35}; do
        echo -n "."
        sleep 1
    done
    echo ""
    
    # Kill curl if still running
    kill $CURL_PID 2>/dev/null
    
    echo "Request should have timed out. Checking logs..."
    sleep 2
    show_error_logs
}

# Test H10 - App Crash
test_h10() {
    echo "=== Testing H10 - App Crashed ==="
    echo "This will crash the app intentionally"
    echo ""
    
    echo "Triggering app crash..."
    curl -X POST $APP_URL/api/crash \
         --max-time 10 \
         --silent \
         --show-error 2>/dev/null || echo "Request failed (expected due to crash)"
    
    echo "App should crash and restart automatically. Checking logs..."
    sleep 5
    show_error_logs
    
    echo "Waiting for app to restart..."
    sleep 10
    
    # Test if app is back up
    if curl -s $APP_URL/api/health > /dev/null; then
        echo "✅ App restarted successfully"
    else
        echo "❌ App may still be restarting"
    fi
    echo ""
}

# Test R14 - Memory Quota Exceeded
test_r14() {
    echo "=== Testing R14 - Memory Quota Exceeded ==="
    echo "This will create a memory leak (limited to 500MB for safety)"
    echo ""
    
    echo "Starting memory leak..."
    curl -X POST $APP_URL/api/memory-leak \
         --max-time 10 \
         --silent \
         --show-error
    
    echo "Memory leak started. Monitor logs for memory usage..."
    echo "This may take a few minutes to show R14 error."
    sleep 5
    show_error_logs
}

# Test H14 - No Web Dynos Running
test_h14() {
    echo "=== Testing H14 - No Web Dynos Running ==="
    echo "⚠️  WARNING: This will scale web dynos to 0!"
    echo "Only proceed if you understand this will make the app unavailable."
    echo ""
    
    read -p "Do you want to proceed with H14 test? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Scaling web dynos to 0..."
        heroku ps:scale web=0 -a $APP_NAME
        
        echo "Testing app access (should get H14)..."
        sleep 5
        
        curl -s $APP_URL --max-time 10 || echo "Request failed (expected H14 error)"
        
        echo "Checking logs for H14..."
        show_error_logs
        
        echo "Restoring web dynos..."
        heroku ps:scale web=1 -a $APP_NAME
        
        echo "Waiting for app to come back online..."
        sleep 15
        
        if curl -s $APP_URL/api/health > /dev/null; then
            echo "✅ App restored successfully"
        else
            echo "❌ App may still be starting"
        fi
    else
        echo "Skipping H14 test"
    fi
    echo ""
}

# Main menu
show_menu() {
    echo "Choose an error code to test:"
    echo "1) H10 - App Crashed"
    echo "2) H12 - Request Timeout"
    echo "3) H14 - No Web Dynos Running (⚠️  Dangerous)"
    echo "4) R14 - Memory Quota Exceeded"
    echo "5) Show recent error logs"
    echo "6) Open error testing dashboard"
    echo "7) Exit"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice (1-7): " choice
    echo ""
    
    case $choice in
        1)
            test_h10
            ;;
        2)
            test_h12
            ;;
        3)
            test_h14
            ;;
        4)
            test_r14
            ;;
        5)
            show_error_logs
            ;;
        6)
            echo "Opening error testing dashboard..."
            echo "Visit: $APP_URL/errors"
            echo ""
            ;;
        7)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            echo ""
            ;;
    esac
    
    read -p "Press Enter to continue..."
    echo ""
done
