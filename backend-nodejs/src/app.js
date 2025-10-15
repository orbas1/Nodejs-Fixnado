import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { sequelize } from './models/index.js';
import config from './config/index.js';

function createComponentState(status = 'initialising') {
  return {
    status,
    lastUpdatedAt: new Date().toISOString(),
    error: null,
    metadata: {}
  };
}

function normaliseError(error) {
  if (!error) {
    return null;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

const readinessState = {
  startedAt: new Date().toISOString(),
  components: {
    httpServer: createComponentState(),
    database: createComponentState(),
    backgroundJobs: createComponentState()
  }
};

function computeOverallReadinessStatus() {
  const componentStates = Object.values(readinessState.components);

  if (componentStates.some((component) => component.status === 'error')) {
    return 'fail';
  }

  if (componentStates.some((component) => component.status === 'stopping')) {
    return 'degraded';
  }

  if (componentStates.every((component) => component.status === 'ready')) {
    return 'pass';
  }

  if (componentStates.some((component) => component.status === 'degraded')) {
    return 'degraded';
  }

  return 'initialising';
}

export function updateReadiness(component, { status, error, metadata } = {}) {
  if (!component) {
    throw new Error('A readiness component name is required.');
  }

  if (!readinessState.components[component]) {
    readinessState.components[component] = createComponentState();
  }

  const nextState = readinessState.components[component];

  if (status) {
    nextState.status = status;
  }

  nextState.lastUpdatedAt = new Date().toISOString();
  nextState.error = normaliseError(error);
  if (metadata) {
    nextState.metadata = metadata;
  }

  readinessState.components[component] = nextState;
  readinessState.status = computeOverallReadinessStatus();
  readinessState.lastUpdatedAt = nextState.lastUpdatedAt;

  return readinessState.components[component];
}

export function getReadinessSnapshot() {
  const components = Object.entries(readinessState.components).reduce((acc, [key, value]) => {
    acc[key] = {
      status: value.status,
      lastUpdatedAt: value.lastUpdatedAt,
      error: value.error,
      metadata: value.metadata
    };
    return acc;
  }, {});

  const status = readinessState.status ?? computeOverallReadinessStatus();

  return {
    status,
    startedAt: readinessState.startedAt,
    lastUpdatedAt: readinessState.lastUpdatedAt,
    uptimeSeconds: Math.round(process.uptime()),
    components
  };
}

function assertPiiConfiguration() {
  const piiConfig = config.security?.pii;
  if (!piiConfig?.encryptionKeySet || !piiConfig?.hashKeySet) {
    throw new Error(
      'PII encryption cannot be initialised because PII_ENCRYPTION_KEY and PII_HASH_KEY are not configured.'
    );
  }
}

assertPiiConfiguration();

const app = express();

app.disable('x-powered-by');

const trustProxyValue = config.security?.trustProxy;
if (trustProxyValue !== false && trustProxyValue?.toLowerCase?.() !== 'false') {
  app.set('trust proxy', trustProxyValue);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hidePoweredBy: true
  })
);

const allowedOrigins = config.security?.cors?.allowOrigins ?? [];
const allowAllOrigins =
  allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes('all');

function isOriginAllowed(origin) {
  if (!origin || allowAllOrigins) {
    return true;
  }

  const normalisedOrigin = origin.toLowerCase();

  return allowedOrigins.some((allowed) => {
    const normalisedAllowed = allowed.toLowerCase();

    if (normalisedAllowed === normalisedOrigin) {
      return true;
    }

    if (normalisedAllowed.startsWith('*.')) {
      const domain = normalisedAllowed.slice(2);
      return normalisedOrigin.endsWith(domain);
    }

    return false;
  });
}

const baseCorsOptions = {
  methods: config.security?.cors?.allowMethods?.length ? config.security.cors.allowMethods : undefined,
  allowedHeaders: config.security?.cors?.allowHeaders?.length ? config.security.cors.allowHeaders : undefined,
  exposedHeaders: config.security?.cors?.exposedHeaders?.length ? config.security.cors.exposedHeaders : undefined,
  credentials: config.security?.cors?.allowCredentials ?? true,
  maxAge: 600
};

const corsMiddleware = cors((req, callback) => {
  const requestOrigin = req.header('Origin');

  if (isOriginAllowed(requestOrigin)) {
    callback(null, { ...baseCorsOptions, origin: true });
    return;
  }

  const error = new Error('Origin not allowed by CORS policy');
  error.status = 403;
  callback(error, { ...baseCorsOptions, origin: false });
});

app.use(corsMiddleware);
app.options(/.*/, corsMiddleware);

app.use(
  express.json({
    limit: config.security?.bodyParser?.jsonLimit ?? '1mb'
  })
);
app.use(
  express.urlencoded({
    limit: config.security?.bodyParser?.urlencodedLimit ?? '1mb',
    extended: true
  })
);

const rateLimiter = rateLimit({
  windowMs: (config.security?.rateLimiting?.windowMinutes ?? 1) * 60 * 1000,
  max: config.security?.rateLimiting?.maxRequests ?? 120,
  standardHeaders: config.security?.rateLimiting?.standardHeaders ?? true,
  legacyHeaders: config.security?.rateLimiting?.legacyHeaders ?? false,
  skipSuccessfulRequests: config.security?.rateLimiting?.skipSuccessfulRequests ?? false,
  skip: (req) => req.path === '/healthz' || req.path === '/',
  keyGenerator: (req) => {
    const forwarded = req.headers?.[config.security?.clientIpHeader];
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }
    return req.ip;
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      message: 'Too many requests, please slow down.',
      retryAfterSeconds: Math.ceil(options.windowMs / 1000)
    });
  }
});

app.use(rateLimiter);

app.use(morgan('tiny'));

app.set('dashboards:exportRowLimit', config.dashboards?.exportRowLimit ?? 5000);
app.set('dashboards:defaultTimezone', config.dashboards?.defaultTimezone ?? 'Europe/London');

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Fixnado API' });
});

async function measureDatabaseHealth(timeoutMs) {
  const startedAt = process.hrtime.bigint();
  let timeoutId;

  try {
    await Promise.race([
      sequelize.query('SELECT 1'),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const timeoutError = new Error('Database ping timed out');
          timeoutError.status = 503;
          reject(timeoutError);
        }, timeoutMs);
      })
    ]);

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    return {
      status: 'pass',
      latencyMs: Number(durationMs.toFixed(2))
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error.message
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

app.get('/healthz', async (req, res, next) => {
  try {
    const databaseHealth = await measureDatabaseHealth(config.security?.health?.databaseTimeoutMs ?? 2000);
    const healthy = databaseHealth.status === 'pass';

    const response = {
      status: healthy ? 'pass' : 'fail',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseHealth
      },
      readiness: getReadinessSnapshot()
    };

    res.status(healthy ? 200 : 503).json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/readyz', (req, res) => {
  const readiness = getReadinessSnapshot();
  res.status(readiness.status === 'pass' ? 200 : 503).json(readiness);
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export async function initDatabase(logger = console) {
  updateReadiness('database', { status: 'initialising' });

  try {
    await sequelize.authenticate();
  } catch (error) {
    updateReadiness('database', { status: 'error', error });
    throw error;
  }

  if (sequelize.getDialect() === 'postgres') {
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis');
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis_topology');
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      const [rows] = await sequelize.query(
        "SELECT installed_version FROM pg_available_extensions WHERE name = 'postgis' AND installed_version IS NOT NULL"
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('PostGIS extension not installed for the current database user');
      }

      const postgisVersion = rows[0].installed_version;

      logger?.info?.('PostGIS extension verified', {
        postgisVersion
      });

      updateReadiness('database', {
        status: 'ready',
        metadata: {
          dialect: sequelize.getDialect(),
          postgisVersion
        }
      });
    } catch (error) {
      logger?.error?.('PostGIS verification failed', {
        message: error.message
      });
      updateReadiness('database', { status: 'error', error });
      throw error;
    }
  } else {
    updateReadiness('database', {
      status: 'ready',
      metadata: {
        dialect: sequelize.getDialect()
      }
    });
  }
}

export default app;
