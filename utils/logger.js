// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgRed: '\x1b[41m',
};

class Logger {
  /**
   * Format and log API request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} statusCode - Response status code
   * @param {number} responseTime - Response time in ms
   */
  logRequest(method, url, statusCode, responseTime) {
    const methodColors = {
      GET: colors.green,
      POST: colors.blue,
      PUT: colors.yellow,
      PATCH: colors.yellow,
      DELETE: colors.red,
    };

    const methodColor = methodColors[method] || colors.white;
    const statusColor = statusCode >= 500 ? colors.red :
      statusCode >= 400 ? colors.yellow :
        statusCode >= 300 ? colors.cyan :
          colors.green;

    const timestamp = new Date().toISOString();

    console.log(
      `${colors.gray}${timestamp}${colors.reset} ` +
      `${methodColor}${colors.bright}${method.padEnd(7)}${colors.reset} ` +
      `${url.padEnd(35)} ` +
      `${statusColor}${statusCode}${colors.reset} ` +
      `${colors.gray}${responseTime}ms${colors.reset}`
    );
  }

  /**
   * Log API error with details
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Error} error - Error object
   */
  logError(method, url, error) {
    const methodColors = {
      GET: colors.green,
      POST: colors.blue,
      PUT: colors.yellow,
      PATCH: colors.yellow,
      DELETE: colors.red,
    };

    const methodColor = methodColors[method] || colors.white;
    const timestamp = new Date().toISOString();

    console.log('\n' + colors.red + '═'.repeat(80) + colors.reset);
    console.log(
      `${colors.gray}${timestamp}${colors.reset} ` +
      `${methodColor}${colors.bright}${method.padEnd(7)}${colors.reset} ` +
      `${url}`
    );
    console.log(`\n${colors.red}${colors.bright}Error:${colors.reset}`);
    console.log(`${colors.red}${error.message || error}${colors.reset}`);

    if (error.stack && process.env.NODE_ENV === 'development') {
      console.log(`\n${colors.gray}Stack Trace:${colors.reset}`);
      console.log(`${colors.gray}${error.stack}${colors.reset}`);
    }
    console.log(colors.red + '═'.repeat(80) + colors.reset + '\n');
  }

  /**
   * Log general info
   * @param {string} message
   */
  info(message) {
    console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
  }

  /**
   * Log success message
   * @param {string} message
   */
  success(message) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
  }

  /**
   * Log warning
   * @param {string} message
   */
  warning(message) {
    console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
  }

  /**
   * Log error without request context
   * @param {string} message
   */
  error(message) {
    console.log(`${colors.red}${colors.bright}✗ ${message}${colors.reset}`);
  }
}

export default new Logger();