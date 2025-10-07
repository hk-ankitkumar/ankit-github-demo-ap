# Heroku Error Codes Testing and Recovery Guide

This guide explains common Heroku error codes, how to reproduce them for testing, and how to recover from them.

## Overview

Heroku uses specific error codes to indicate different types of failures. Understanding these codes helps you diagnose and fix issues quickly.

## Error Testing Dashboard

Access the interactive error testing dashboard at: `/errors`

This page allows you to trigger various error conditions and observe how they manifest in logs.

## Common Heroku Error Codes

### H10 - App Crashed

**What it means:** The application process crashed and exited unexpectedly.

**Common causes:**
- Uncaught exceptions
- Out of memory conditions
- Calling `process.exit()`
- Segmentation faults
- Invalid code that prevents startup

**How to reproduce:**
1. Visit `/errors` page
2. Click "Trigger H10 - Crash App"
3. This will cause an uncaught exception after 1 second

**What you'll see in logs:**
```
2025-10-07T12:30:00.000000+00:00 heroku[web.1]: Process exited with status 1
2025-10-07T12:30:00.000000+00:00 heroku[web.1]: State changed from up to crashed
2025-10-07T12:30:01.000000+00:00 heroku[web.1]: State changed from crashed to starting
```

**Recovery:**
- **Automatic:** Heroku automatically restarts crashed dynos
- **Manual:** `heroku restart -a ankit-github-demo-app`
- **Root cause:** Check logs to identify and fix the underlying issue

### H12 - Request Timeout

**What it means:** HTTP request took longer than 30 seconds to complete.

**Common causes:**
- Slow database queries
- External API calls that hang
- Infinite loops in request handlers
- Heavy computational tasks in web requests

**How to reproduce:**
1. Visit `/errors` page
2. Click "Trigger H12 - Request Timeout"
3. This will start a request that takes 35 seconds

**What you'll see in logs:**
```
2025-10-07T12:30:00.000000+00:00 heroku[router]: at=error code=H12 desc="Request timeout" method=POST path="/api/timeout" host=ankit-github-demo-app.herokuapp.com request_id=12345 fwd="1.2.3.4" dyno=web.1 connect=1ms service=30000ms status=503 bytes=0 protocol=https
```

**Recovery:**
- **User action:** Page refresh is sufficient
- **Fix:** Optimize slow endpoints, move heavy tasks to background jobs
- **Prevention:** Use timeouts for external calls, optimize database queries

### H14 - No Web Dynos Running

**What it means:** No web dynos are running to handle HTTP requests.

**Common causes:**
- All web dynos scaled to 0
- All web dynos crashed simultaneously
- Deployment issues preventing dyno startup

**How to reproduce:**
```bash
# Scale web dynos to 0
heroku ps:scale web=0 -a ankit-github-demo-app

# Try to access the app - you'll get H14
curl https://ankit-github-demo-app-9d164818e030.herokuapp.com/

# Restore web dynos
heroku ps:scale web=1 -a ankit-github-demo-app
```

**What you'll see in logs:**
```
2025-10-07T12:30:00.000000+00:00 heroku[router]: at=error code=H14 desc="No web dynos running" method=GET path="/" host=ankit-github-demo-app.herokuapp.com request_id=12345 fwd="1.2.3.4" dyno= connect= service= status=503 bytes= protocol=https
```

**Recovery:**
- **Scale up:** `heroku ps:scale web=1 -a ankit-github-demo-app`
- **Check status:** `heroku ps -a ankit-github-demo-app`
- **Restart if needed:** `heroku restart -a ankit-github-demo-app`

### R10 - Boot Timeout

**What it means:** Web process failed to bind to PORT within 60 seconds of launch.

**Common causes:**
- App doesn't bind to the PORT environment variable
- App takes too long to start up
- App binds to wrong port (like hardcoded 3000)
- Startup code has infinite loops or blocking operations

**How to reproduce:**
This requires code changes. Example of problematic code:
```javascript
// Wrong - hardcoded port
app.listen(3000);

// Wrong - not binding to PORT
app.listen(process.env.PORT || 8080);

// Correct
app.listen(process.env.PORT || 3000);
```

**What you'll see in logs:**
```
2025-10-07T12:30:00.000000+00:00 heroku[web.1]: Starting process with command `node index.js`
2025-10-07T12:30:00.000000+00:00 app[web.1]: Server starting...
2025-10-07T12:31:00.000000+00:00 heroku[web.1]: Error R10 (Boot timeout) -> Web process failed to bind to $PORT within 60 seconds of launch
2025-10-07T12:31:00.000000+00:00 heroku[web.1]: Stopping process with SIGKILL
2025-10-07T12:31:01.000000+00:00 heroku[web.1]: Process exited with status 137
2025-10-07T12:31:01.000000+00:00 heroku[web.1]: State changed from starting to crashed
```

**Recovery:**
- **Fix code:** Ensure app binds to `process.env.PORT`
- **Optimize startup:** Remove blocking operations from startup
- **Redeploy:** Push fixed code to trigger new deployment

### R14 - Memory Quota Exceeded

**What it means:** Process exceeded its memory quota.

**Memory limits by dyno type:**
- Basic/Eco: 512MB
- Standard-1X: 512MB
- Standard-2X: 1GB
- Performance dynos: Higher limits

**Common causes:**
- Memory leaks
- Loading large datasets into memory
- Inefficient data structures
- Not cleaning up resources

**How to reproduce:**
1. Visit `/errors` page
2. Click "Trigger R14 - Memory Leak"
3. This will gradually allocate memory until quota is exceeded

**What you'll see in logs:**
```
2025-10-07T12:30:00.000000+00:00 app[web.1]: Memory usage: heapUsed: 100 MB, heapTotal: 120 MB, rss: 150 MB
2025-10-07T12:30:30.000000+00:00 app[web.1]: Memory usage: heapUsed: 400 MB, heapTotal: 450 MB, rss: 500 MB
2025-10-07T12:31:00.000000+00:00 heroku[web.1]: Error R14 (Memory quota exceeded)
2025-10-07T12:31:00.000000+00:00 heroku[web.1]: Stopping process with SIGKILL
2025-10-07T12:31:01.000000+00:00 heroku[web.1]: Process exited with status 137
```

**Recovery:**
- **Immediate:** `heroku restart -a ankit-github-demo-app`
- **Fix:** Identify and fix memory leaks
- **Monitor:** Use New Relic to track memory usage
- **Upgrade:** Consider larger dyno if legitimately needed

## Additional Error Codes

### H11 - Backlog Too Deep

**What it means:** Too many requests queued, new requests rejected.

**Cause:** App can't handle incoming request volume.

**Recovery:**
- Scale up web dynos: `heroku ps:scale web=2`
- Optimize slow endpoints
- Add caching layers

### H13 - Connection Closed Without Response

**What it means:** Dyno didn't send any data within 30 seconds.

**Cause:** App accepted connection but never responded.

**Recovery:**
- Check for hanging requests
- Add proper error handling
- Ensure all routes send responses

### H15 - Idle Connection

**What it means:** Request was terminated due to idle connection.

**Cause:** Client didn't send complete request within 10 seconds.

**Recovery:**
- Usually client-side issue
- Check for slow client connections

### H18 - Server Request Interrupted

**What it means:** Server closed connection before response completed.

**Cause:** Dyno crashed or restarted during request.

**Recovery:**
- Check for app crashes (H10)
- Implement graceful shutdown
- Add request retry logic on client

### H20 - App Boot Timeout

**What it means:** App failed to start within 60 seconds.

**Cause:** Similar to R10 but for non-web processes.

**Recovery:**
- Fix startup issues
- Optimize initialization code

### H21 - Backend Connection Refused

**What it means:** Dyno refused connection attempt.

**Cause:** App not accepting connections on assigned port.

**Recovery:**
- Check port binding
- Verify app is listening correctly

### H22 - Connection Limit Reached

**What it means:** Dyno reached connection limit.

**Cause:** Too many concurrent connections.

**Recovery:**
- Scale up dynos
- Implement connection pooling
- Add rate limiting

### H23 - Endpoint Disabled

**What it means:** Endpoint has been disabled.

**Cause:** Administrative action or maintenance.

**Recovery:**
- Check Heroku status page
- Contact support if needed

### H24 - Forced Close

**What it means:** Connection forcibly closed.

**Cause:** Various network or infrastructure issues.

**Recovery:**
- Usually temporary
- Implement retry logic

### H25 - HTTP Restriction

**What it means:** Request violates HTTP restrictions.

**Cause:** Malformed requests or policy violations.

**Recovery:**
- Check request format
- Review HTTP headers

### H26 - Request Error

**What it means:** Request couldn't be processed.

**Cause:** Various request processing issues.

**Recovery:**
- Check request validity
- Review logs for specifics

### H27 - Client Request Timeout

**What it means:** Client didn't complete request in time.

**Cause:** Slow client or network issues.

**Recovery:**
- Usually client-side issue
- Check network connectivity

### R12 - Exit Timeout

**What it means:** Process didn't exit within 30 seconds of SIGTERM.

**Cause:** App doesn't handle graceful shutdown.

**Recovery:**
- Implement SIGTERM handler
- Clean up resources quickly

### R13 - Attach Error

**What it means:** Couldn't attach to process.

**Cause:** Process management issues.

**Recovery:**
- Restart dyno
- Check process status

### R15 - Memory Quota Vastly Exceeded

**What it means:** Process used significantly more memory than allowed.

**Cause:** Severe memory issues.

**Recovery:**
- Immediate restart required
- Fix memory leaks urgently

### R16 - Detached

**What it means:** Process detached from dyno manager.

**Cause:** Process management issues.

**Recovery:**
- Restart dyno
- Check for process spawning issues

### R17 - Checksum Error

**What it means:** Slug checksum verification failed.

**Cause:** Deployment corruption.

**Recovery:**
- Redeploy application
- Check build process

## Monitoring and Alerting

### Real-time Log Monitoring

```bash
# Watch all logs
heroku logs --tail -a ankit-github-demo-app

# Filter for errors only
heroku logs --tail -a ankit-github-demo-app | grep -E "(H[0-9]+|R[0-9]+)"

# Filter for specific error codes
heroku logs --tail -a ankit-github-demo-app | grep -E "(H10|H12|H14|R10|R14)"

# View recent errors
heroku logs -a ankit-github-demo-app | grep -E "(H[0-9]+|R[0-9]+)"
```

### Using Papertrail for Error Tracking

1. Open Papertrail dashboard: `heroku addons:open papertrail -a ankit-github-demo-app`
2. Create saved searches for error codes:
   - Search: `H10 OR H12 OR H14 OR R10 OR R14`
   - Save as: "Critical Errors"
3. Set up email alerts for critical errors

### New Relic Monitoring

1. Open New Relic: `heroku addons:open newrelic -a ankit-github-demo-app`
2. Monitor:
   - Error rate trends
   - Response time spikes
   - Memory usage patterns
   - Throughput drops

## Recovery Strategies

### Immediate Actions

1. **Check app status:**
   ```bash
   heroku ps -a ankit-github-demo-app
   ```

2. **View recent logs:**
   ```bash
   heroku logs -a ankit-github-demo-app --tail
   ```

3. **Restart if needed:**
   ```bash
   heroku restart -a ankit-github-demo-app
   ```

### When to Restart vs When to Scale

**Restart when:**
- H10 (App crashed)
- R14 (Memory exceeded)
- Process appears stuck
- After fixing code issues

**Scale when:**
- H11 (Backlog too deep)
- H12 (Request timeout) due to load
- H14 (No web dynos) - scale up
- Performance degradation under load

### Emergency Procedures

**Complete App Failure:**
```bash
# Check status
heroku ps -a ankit-github-demo-app

# Restart all processes
heroku restart -a ankit-github-demo-app

# Scale up if needed
heroku ps:scale web=2 -a ankit-github-demo-app

# Check logs
heroku logs --tail -a ankit-github-demo-app
```

**Database Issues:**
```bash
# Check database status
heroku pg:info -a ankit-github-demo-app

# Check connections
heroku pg:ps -a ankit-github-demo-app

# Restart app if database recovered
heroku restart -a ankit-github-demo-app
```

**Memory Issues:**
```bash
# Immediate restart
heroku restart -a ankit-github-demo-app

# Monitor memory usage
heroku logs --tail -a ankit-github-demo-app | grep -i memory

# Consider scaling up dyno size if legitimate usage
heroku ps:resize web=standard-2x -a ankit-github-demo-app
```

## Prevention Best Practices

### Code Level

1. **Proper error handling:**
   ```javascript
   process.on('uncaughtException', (err) => {
     logger.error('Uncaught exception:', err);
     process.exit(1);
   });
   
   process.on('unhandledRejection', (reason, promise) => {
     logger.error('Unhandled rejection:', reason);
   });
   ```

2. **Graceful shutdown:**
   ```javascript
   process.on('SIGTERM', () => {
     logger.info('SIGTERM received, shutting down gracefully');
     server.close(() => {
       process.exit(0);
     });
   });
   ```

3. **Request timeouts:**
   ```javascript
   app.use((req, res, next) => {
     res.setTimeout(25000, () => {
       res.status(408).send('Request timeout');
     });
     next();
   });
   ```

4. **Memory management:**
   ```javascript
   // Monitor memory usage
   setInterval(() => {
     const usage = process.memoryUsage();
     if (usage.heapUsed > 400 * 1024 * 1024) { // 400MB
       logger.warn('High memory usage:', usage);
     }
   }, 60000);
   ```

### Infrastructure Level

1. **Health checks:**
   - Implement `/health` endpoint
   - Monitor response times
   - Check dependencies

2. **Monitoring:**
   - Set up alerts for error rates
   - Monitor memory and CPU usage
   - Track response times

3. **Scaling:**
   - Auto-scaling based on metrics
   - Load testing before production
   - Capacity planning

## Testing Error Scenarios

### Local Testing

```bash
# Test the error endpoints locally
npm start

# In another terminal, test each endpoint:
curl -X POST http://localhost:3000/api/crash
curl -X POST http://localhost:3000/api/timeout
curl -X POST http://localhost:3000/api/memory-leak
curl -X POST http://localhost:3000/api/cpu-intensive
```

### Production Testing

**Warning:** Only test in development or staging environments.

1. **Use the error testing dashboard:** `/errors`
2. **Monitor logs in real-time:** `heroku logs --tail -a ankit-github-demo-app`
3. **Test recovery procedures**
4. **Document response times and recovery steps**

## Conclusion

Understanding Heroku error codes is crucial for maintaining reliable applications. Use the error testing dashboard to familiarize yourself with different error conditions and their recovery procedures.

**Key takeaways:**
- Monitor logs continuously
- Set up proper alerting
- Implement graceful error handling
- Test recovery procedures regularly
- Document incident response procedures

**Resources:**
- [Heroku Error Codes Documentation](https://devcenter.heroku.com/articles/error-codes)
- [Heroku Logging](https://devcenter.heroku.com/articles/logging)
- [Application Metrics](https://devcenter.heroku.com/articles/metrics)
