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
    // Console transport for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add Papertrail transport if configured
if (process.env.PAPERTRAIL_HOST && process.env.PAPERTRAIL_PORT) {
  const { Syslog } = require('winston-syslog');
  logger.add(new Syslog({
    host: process.env.PAPERTRAIL_HOST,
    port: process.env.PAPERTRAIL_PORT,
    protocol: 'tls4',
    localhost: 'ankit-github-demo-app',
    eol: '\n'
  }));
  logger.info('Papertrail logging enabled');
}

module.exports = logger;
