const winston = require('winston');

// Configure Winston logger for Papertrail and console
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'ankit-github-demo-app',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport - Heroku automatically forwards to Papertrail
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Note: Papertrail on Heroku works via log drains
// All console.log and logger output is automatically sent to Papertrail
// No additional configuration needed

module.exports = logger;
