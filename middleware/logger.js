import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs all incoming requests with method, URL, status code, and response time
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capture the original res.json to log after response
  const originalJson = res.json;
  const originalSend = res.send;

  // Override res.json
  res.json = function (data) {
    res.json = originalJson;
    const responseTime = Date.now() - startTime;
    logger.logRequest(req.method, req.originalUrl, res.statusCode, responseTime);
    return res.json(data);
  };

  // Override res.send
  res.send = function (data) {
    res.send = originalSend;
    const responseTime = Date.now() - startTime;
    logger.logRequest(req.method, req.originalUrl, res.statusCode, responseTime);
    return res.send(data);
  };

  // Handle errors that occur before response
  res.on('finish', () => {
    if (!res.headersSent) {
      const responseTime = Date.now() - startTime;
      logger.logRequest(req.method, req.originalUrl, res.statusCode, responseTime);
    }
  });

  next();
};

/**
 * Error logging middleware
 * Logs detailed error information for failed requests
 */
export const errorLogger = (err, req, res, next) => {
  // Log the error with full details
  logger.logError(req.method, req.originalUrl, err);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
