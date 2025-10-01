# Understanding Web vs Worker Processes in Heroku

## The Fundamental Concept

**Key Point**: The same codebase is deployed to ALL dynos (web and worker), but DIFFERENT entry point files are executed based on the Procfile configuration.

## How Heroku Determines What Runs Where

### The Procfile - The Control Center

The `Procfile` is the single source of truth that tells Heroku what command to run for each process type:

```
web: node index.js
worker: node worker.js
```

**What this means**:
- When you scale `web=1`, Heroku creates a dyno and runs `node index.js`
- When you scale `worker=1`, Heroku creates a separate dyno and runs `node worker.js`
- Each dyno is an isolated Linux container with its own resources

### Visual Representation

```
Your Git Repository (Same Code on All Dynos)
    |
    |-- Deployed to Heroku
    |
    +-- Web Dyno (Container 1)
    |   |
    |   +-- Runs: node index.js
    |   +-- Process Type: web
    |   +-- Listens on: PORT (for HTTP requests)
    |   +-- Contains: Express server, API endpoints
    |
    +-- Worker Dyno (Container 2)
        |
        +-- Runs: node worker.js
        +-- Process Type: worker
        +-- Does NOT listen on PORT
        +-- Contains: Background job processor
```

## Deep Dive: What Happens When You Deploy

### Step 1: Code Deployment

```bash
git push origin main
```

**What happens**:
1. Heroku receives your code
2. Heroku builds your application (npm install, etc.)
3. The SAME built code is available to all dynos
4. No code is "separated" at this point - everything is there

### Step 2: Process Scaling

```bash
heroku ps:scale web=1 worker=1
```

**What happens**:
1. Heroku creates 2 separate Linux containers (dynos)
2. Both containers have the SAME codebase
3. Heroku looks at the Procfile to determine what to run

**Web Dyno**:
```bash
# Heroku runs this command in the web dyno:
node index.js
```

**Worker Dyno**:
```bash
# Heroku runs this command in the worker dyno:
node worker.js
```

### Step 3: Process Execution

**Web Dyno (running index.js)**:
- Starts Express server
- Binds to PORT environment variable
- Listens for HTTP requests
- Handles user traffic
- Does NOT run background jobs

**Worker Dyno (running worker.js)**:
- Does NOT start Express server
- Does NOT bind to PORT
- Does NOT handle HTTP requests
- Runs background job loop
- Processes tasks every 60 seconds

## Code Analysis: What Makes Each File Different

### index.js (Web Process)

```javascript
// This is the KEY difference - it starts an HTTP server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

**Why this runs on web dyno**:
- The Procfile says: `web: node index.js`
- When Heroku scales web=1, it runs `node index.js`
- This file starts an Express server
- The server listens on PORT for HTTP requests
- Heroku's router forwards HTTP traffic to this dyno

**What happens if you run this on worker dyno?**
- It would start an Express server
- But Heroku wouldn't route traffic to it (workers don't receive HTTP traffic)
- It would waste resources
- This is why we DON'T run index.js on worker dynos

### worker.js (Worker Process)

```javascript
// This is the KEY difference - it runs a loop, NOT an HTTP server
class WorkerProcessor {
  async start() {
    // Run jobs every 60 seconds
    this.jobInterval = setInterval(() => {
      this.processJobs();
    }, 60000);
  }
}

// Start the worker
worker.start();
```

**Why this runs on worker dyno**:
- The Procfile says: `worker: node worker.js`
- When Heroku scales worker=1, it runs `node worker.js`
- This file does NOT start an HTTP server
- It runs background jobs in a loop
- No HTTP traffic is routed to this dyno

**What happens if you run this on web dyno?**
- It would work, but it's bad practice
- Background jobs would compete with HTTP requests for resources
- If the web dyno restarts, jobs are interrupted
- This is why we separate concerns

## How to Identify What Runs Where

### Rule 1: Look at the Procfile

```
web: node index.js      ← This file runs on web dynos
worker: node worker.js  ← This file runs on worker dynos
```

**The Procfile is the ONLY thing that determines this.**

### Rule 2: Check if the File Starts an HTTP Server

**Web Process Indicator**:
```javascript
// If you see this, it's meant for web dyno
app.listen(PORT, () => {
  // ...
});
```

**Worker Process Indicator**:
```javascript
// If you see this, it's meant for worker dyno
setInterval(() => {
  // Background job
}, 60000);

// Or
while (true) {
  // Process jobs
}
```

### Rule 3: Check the File Purpose

**index.js (Web)**:
- Defines Express routes (`app.get()`, `app.post()`)
- Handles HTTP requests
- Serves web pages
- Provides API endpoints
- Responds to users in real-time

**worker.js (Worker)**:
- Defines background jobs
- Processes tasks asynchronously
- Cleans up data
- Generates reports
- Sends emails
- Does NOT respond to HTTP requests

## Shared Code Between Web and Worker

### Both Files Can Use the Same Modules

```javascript
// Both index.js and worker.js can use:
const logger = require('./logger');
const db = require('./db');
const cache = require('./cache');
```

**Why?**
- Both dynos have the same codebase
- Both can access the same database
- Both can use the same cache
- Both can log to Papertrail

**Example**:

**In index.js (Web)**:
```javascript
app.get('/api/stats', async (req, res) => {
  const stats = await db.getPageViewStats(); // Uses db.js
  res.json(stats);
});
```

**In worker.js (Worker)**:
```javascript
async function cleanOldPageViews() {
  await db.pool.query("DELETE FROM page_views WHERE..."); // Uses db.js
}
```

Both use `db.js`, but:
- Web uses it to respond to HTTP requests
- Worker uses it for background cleanup

## Viewing Which Process is Running

### Command: Check Process Status

```bash
heroku ps -a ankit-github-demo-app
```

**Output**:
```
=== web (Basic): node index.js (1)
web.1: up 2025/10/02 01:40:06 +0530 (~ 15m ago)

=== worker (Basic): node worker.js (1)
worker.1: up 2025/10/02 01:40:43 +0530 (~ 14m ago)
```

**What this tells you**:
- **web.1**: One web dyno running `node index.js`
- **worker.1**: One worker dyno running `node worker.js`
- Both are separate containers
- Both are running simultaneously

### Command: View Logs by Process Type

**Web logs only**:
```bash
heroku logs --tail --ps web -a ankit-github-demo-app
```

**Output shows only logs from index.js**:
```
2025-10-02T01:40:06.000000+00:00 app[web.1]: Server running on port 3000
2025-10-02T01:40:06.000000+00:00 app[web.1]: HTTP Request GET /api/health
```

**Worker logs only**:
```bash
heroku logs --tail --ps worker -a ankit-github-demo-app
```

**Output shows only logs from worker.js**:
```
2025-10-02T01:40:43.000000+00:00 app[worker.1]: Worker process starting...
2025-10-02T01:41:43.000000+00:00 app[worker.1]: Processing background jobs...
2025-10-02T01:41:43.000000+00:00 app[worker.1]: Cleaned 5 old page views
```

### Command: Scale Processes Independently

```bash
# Scale web to 2 dynos (for more HTTP capacity)
heroku ps:scale web=2 -a ankit-github-demo-app

# Keep worker at 1 dyno
heroku ps:scale worker=1 -a ankit-github-demo-app
```

**Result**:
```
=== web (Basic): node index.js (2)
web.1: up
web.2: up

=== worker (Basic): node worker.js (1)
worker.1: up
```

Now you have:
- 2 web dynos (both running index.js)
- 1 worker dyno (running worker.js)
- Total: 3 separate containers

## The Magic: How Heroku Knows

### Heroku's Process Flow

```
1. You run: heroku ps:scale web=1 worker=1
   |
   v
2. Heroku reads Procfile:
   web: node index.js
   worker: node worker.js
   |
   v
3. Heroku creates 2 dynos:
   - Dyno 1: Runs "node index.js"
   - Dyno 2: Runs "node worker.js"
   |
   v
4. Heroku's router:
   - Routes HTTP traffic to web dynos ONLY
   - Does NOT route traffic to worker dynos
   |
   v
5. Each dyno runs independently:
   - Web dyno: Handles HTTP requests
   - Worker dyno: Processes background jobs
```

### What if You Don't Have a Procfile?

Heroku uses a default:
```
web: npm start
```

This means:
- Only web process is defined
- No worker process available
- You can't scale workers

## Practical Example: Following a Request

### Scenario: User visits /api/stats

**Step 1: HTTP Request**
```
User Browser → Heroku Router → Web Dyno (index.js)
```

**Step 2: Web Dyno Processes Request**
```javascript
// In index.js (running on web dyno)
app.get('/api/stats', async (req, res) => {
  // 1. Query database
  const stats = await db.getPageViewStats();
  
  // 2. Return response
  res.json(stats);
});
```

**Step 3: Response Sent**
```
Web Dyno → Heroku Router → User Browser
```

**Worker dyno is NOT involved in this request at all.**

### Scenario: Worker Cleans Old Data

**Step 1: Timer Triggers**
```javascript
// In worker.js (running on worker dyno)
setInterval(() => {
  processJobs(); // Runs every 60 seconds
}, 60000);
```

**Step 2: Worker Processes Job**
```javascript
async function cleanOldPageViews() {
  // Delete old records from database
  await db.pool.query("DELETE FROM page_views WHERE timestamp < NOW() - INTERVAL '30 days'");
  logger.info('Cleaned old page views');
}
```

**Step 3: Job Completes**
```
Worker Dyno → Database (cleanup done)
```

**Web dyno is NOT involved in this job at all.**

## Common Misconceptions

### Misconception 1: "Code is split between web and worker"

**Reality**: The SAME codebase is on both dynos. The Procfile determines which entry point file runs.

### Misconception 2: "Worker can handle HTTP requests"

**Reality**: Worker dynos don't receive HTTP traffic from Heroku's router. Only web dynos do.

### Misconception 3: "I need to deploy separately for web and worker"

**Reality**: One deployment updates both. Heroku automatically restarts all dynos with the new code.

### Misconception 4: "Shared modules run on both"

**Reality**: Shared modules (logger.js, db.js, cache.js) are just libraries. They run when imported by either index.js or worker.js.

## How to Add More Process Types

### Example: Add a Clock Process

**Step 1: Create clock.js**
```javascript
// clock.js - Scheduled tasks
setInterval(() => {
  console.log('Running hourly task');
  // Send emails, generate reports, etc.
}, 3600000); // Every hour
```

**Step 2: Update Procfile**
```
web: node index.js
worker: node worker.js
clock: node clock.js
```

**Step 3: Scale the clock process**
```bash
heroku ps:scale clock=1 -a ankit-github-demo-app
```

**Result**:
```
=== web (Basic): node index.js (1)
web.1: up

=== worker (Basic): node worker.js (1)
worker.1: up

=== clock (Basic): node clock.js (1)
clock.1: up
```

Now you have 3 separate dynos, each running different code!

## Debugging: How to Verify What's Running

### Step 1: Check Procfile

```bash
cat Procfile
```

Output:
```
web: node index.js
worker: node worker.js
```

This tells you:
- `web` process runs `index.js`
- `worker` process runs `worker.js`

### Step 2: Check Running Processes

```bash
heroku ps -a ankit-github-demo-app
```

This shows which dynos are actually running.

### Step 3: Check Logs

```bash
# All logs
heroku logs --tail -a ankit-github-demo-app

# Web only
heroku logs --tail --ps web -a ankit-github-demo-app

# Worker only
heroku logs --tail --ps worker -a ankit-github-demo-app
```

### Step 4: Verify in Code

**In index.js, add:**
```javascript
logger.info('WEB PROCESS STARTED', { 
  file: 'index.js',
  processType: 'web'
});
```

**In worker.js, add:**
```javascript
logger.info('WORKER PROCESS STARTED', { 
  file: 'worker.js',
  processType: 'worker'
});
```

Then check logs:
```bash
heroku logs --tail -a ankit-github-demo-app
```

You'll see:
```
app[web.1]: WEB PROCESS STARTED { file: 'index.js', processType: 'web' }
app[worker.1]: WORKER PROCESS STARTED { file: 'worker.js', processType: 'worker' }
```

## Summary: The Complete Picture

### What Determines Process Separation

1. **Procfile** - Defines which command runs for each process type
2. **Entry Point Files** - Different files for different purposes
3. **Heroku's Scaling** - Creates separate dynos for each process type
4. **Heroku's Router** - Routes HTTP traffic only to web dynos

### Key Takeaways

1. **Same Code, Different Entry Points**
   - All dynos have the same codebase
   - Procfile determines which file runs on which dyno

2. **Process Types are Isolated**
   - Web dynos run index.js
   - Worker dynos run worker.js
   - They run in separate containers

3. **Shared Resources**
   - Both can access database
   - Both can use cache
   - Both can log to Papertrail
   - Both are monitored by New Relic

4. **Different Purposes**
   - Web: Handle HTTP requests
   - Worker: Process background jobs

5. **Independent Scaling**
   - Scale web for more HTTP capacity
   - Scale worker for more job processing
   - Each scales independently

### Visual Summary

```
Git Repository (Your Code)
    |
    |-- Deployed to Heroku
    |
    +-- Procfile says:
    |   web: node index.js
    |   worker: node worker.js
    |
    +-- When you scale web=1:
    |   Heroku creates Web Dyno
    |   Runs: node index.js
    |   Purpose: Handle HTTP requests
    |   Receives: Traffic from Heroku Router
    |
    +-- When you scale worker=1:
        Heroku creates Worker Dyno
        Runs: node worker.js
        Purpose: Process background jobs
        Receives: No HTTP traffic
```

## Conclusion

The separation between web and worker processes is NOT in the code itself, but in:

1. **How you define them** (Procfile)
2. **How you scale them** (heroku ps:scale)
3. **What they do** (HTTP server vs background jobs)

The code doesn't "know" if it's running on web or worker. The Procfile and Heroku's infrastructure handle that separation. This is the beauty of Heroku's process model - you write modular code, and Heroku runs it where it needs to run.

---

**Remember**: 
- Procfile = Process definition
- Scaling = Process creation
- Entry point files = What actually runs
- Heroku Router = Traffic distribution
