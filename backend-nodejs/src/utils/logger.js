import pino from 'pino';

function resolveLogLevel(explicitLevel) {
  if (explicitLevel) {
    return explicitLevel;
  }

  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function resolveLogFormat(explicitFormat) {
  if (explicitFormat) {
    return explicitFormat.toLowerCase();
  }

  if (process.env.LOG_FORMAT) {
    return process.env.LOG_FORMAT.toLowerCase();
  }

  return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

export function createLogger(options = {}) {
  const {
    level: explicitLevel,
    format: explicitFormat,
    serviceName: explicitService,
    redactKeys = [],
    destination
  } = options;

  const level = resolveLogLevel(explicitLevel);
  const format = resolveLogFormat(explicitFormat);
  const serviceName =
    explicitService || process.env.LOG_SERVICE_NAME || process.env.SERVICE_NAME || 'fixnado-backend';

  const pinoOptions = {
    level,
    base: {
      service: serviceName,
      environment: process.env.NODE_ENV || 'development'
    },
    redact: Array.isArray(redactKeys) ? redactKeys : []
  };

  if (format === 'pretty' && process.env.NODE_ENV !== 'production') {
    pinoOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    };
  }

  if (destination) {
    return pino(pinoOptions, destination);
  }

  return pino(pinoOptions);
}

export function createChildLogger(parentLogger, bindings = {}) {
  if (parentLogger && typeof parentLogger.child === 'function') {
    return parentLogger.child(bindings);
  }

  return parentLogger || createLogger();
}

export function serialiseError(error) {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }

  if (typeof error === 'object') {
    return { ...error };
  }

  return { message: String(error) };
}
