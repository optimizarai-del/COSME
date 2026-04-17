/**
 * Logger - Simple logging utility
 */

export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  log(level, message, data = {}) {
    if (this.levels[level] <= this.levels[this.level]) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...data
      }));
    }
  }

  error(message, data) { this.log('error', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  info(message, data) { this.log('info', message, data); }
  debug(message, data) { this.log('debug', message, data); }
}
