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

function parseOriginString(origin) {
  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

function buildCorsOriginMatchers(origins) {
  if (!Array.isArray(origins)) {
    return [];
  }

  return origins
    .map((origin) => {
      if (typeof origin !== 'string') {
        return null;
      }

      const trimmed = origin.trim();
      if (!trimmed) {
        return null;
      }

      if (trimmed.toLowerCase() === 'null') {
        return { type: 'null', pattern: 'null' };
      }

      if (trimmed.startsWith('regex:')) {
        const expression = trimmed.slice(6).trim();
        if (!expression) {
          console.warn('[cors] Ignoring empty regex allowlist entry');
          return null;
        }
        try {
          return { type: 'regex', pattern: trimmed, regex: new RegExp(expression, 'i') };
        } catch (error) {
          console.warn('[cors] Failed to compile allowlist regex', { pattern: trimmed, message: error.message });
          return null;
        }
      }

      if (trimmed.includes('*')) {
        const schemeIndex = trimmed.indexOf('://');
        if (schemeIndex === -1) {
          console.warn('[cors] Ignoring wildcard origin without scheme', { origin: trimmed });
          return null;
        }

        const protocol = `${trimmed.slice(0, schemeIndex).toLowerCase()}:`;
        const hostPort = trimmed.slice(schemeIndex + 3);
        const [hostPart, portPart] = hostPort.split(':');
        if (!hostPart?.startsWith('*.') || hostPart.length < 3) {
          console.warn('[cors] Ignoring invalid wildcard origin', { origin: trimmed });
          return null;
        }

        const domain = hostPart.slice(2).toLowerCase();
        const port = portPart ? portPart : '';
        return { type: 'wildcard', pattern: trimmed, protocol, domain, port };
      }

      const parsed = parseOriginString(trimmed);
      if (!parsed) {
        console.warn('[cors] Ignoring malformed origin', { origin: trimmed });
        return null;
      }

      return {
        type: 'exact',
        pattern: trimmed,
        protocol: parsed.protocol,
        hostname: parsed.hostname.toLowerCase(),
        port: parsed.port
      };
    })
    .filter(Boolean);
}

function normalisePort(protocol, port) {
  if (port && `${port}`.trim() !== '') {
    return `${port}`;
  }

  if (protocol === 'https:') {
    return '443';
  }

  if (protocol === 'http:') {
    return '80';
  }

  return '';
}

function evaluateCorsOrigin(origin, matchers, { strict }) {
  if (!origin) {
    return { allowed: !strict, reason: 'missing_origin' };
  }

  if (origin === 'null') {
    const allowsNull = matchers.some((matcher) => matcher.type === 'null');
    return allowsNull
      ? { allowed: true, matched: 'null' }
      : { allowed: false, reason: 'null_origin_not_allowlisted' };
  }

  const parsed = parseOriginString(origin);
  if (!parsed) {
    return { allowed: false, reason: 'invalid_origin' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol;
  const port = normalisePort(protocol, parsed.port);

  for (const matcher of matchers) {
    if (matcher.type === 'exact') {
      const matcherPort = normalisePort(matcher.protocol, matcher.port);
      const portsMatch = matcher.port ? matcherPort === port : matcherPort === port;
      if (matcher.protocol === protocol && matcher.hostname === hostname && portsMatch) {
        return { allowed: true, matched: matcher.pattern };
      }
    } else if (matcher.type === 'wildcard') {
      if (matcher.protocol !== protocol) {
        continue;
      }
      const matchesDomain =
        hostname === matcher.domain || hostname.endsWith(`.${matcher.domain}`);
      if (!matchesDomain) {
        continue;
      }
      if (matcher.port && matcher.port !== port) {
        continue;
      }
      return { allowed: true, matched: matcher.pattern };
    } else if (matcher.type === 'regex' && matcher.regex.test(origin)) {
      return { allowed: true, matched: matcher.pattern };
    }
  }

  if (strict === false && matchers.length === 0) {
    return { allowed: true, matched: 'permissive' };
  }

  return { allowed: false, reason: 'origin_not_allowlisted' };
}

const corsConfig = config.security?.cors ?? {};
const corsOriginMatchers = buildCorsOriginMatchers(corsConfig.allowOrigins ?? []);
const strictCorsMode = corsConfig.strict !== false;

function deriveRequestCorrelationId(req) {
  return (
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    req.headers['x-amzn-trace-id'] ||
    req.headers['x-cloud-trace-context'] ||
    null
  );
}

const helmetConfig = config.security?.helmet ?? {};
const helmetDirectives = helmetConfig.contentSecurityPolicy ?? {};

const helmetOptions = {
  hidePoweredBy: true,
  crossOriginEmbedderPolicy: helmetConfig.crossOriginEmbedderPolicyEnabled ? { policy: 'require-corp' } : false,
  crossOriginResourcePolicy: { policy: helmetConfig.crossOriginResourcePolicy || 'same-origin' },
  referrerPolicy: { policy: helmetConfig.referrerPolicy || 'no-referrer' },
  frameguard: { action: helmetConfig.frameguardAction || 'deny' },
  hsts: helmetConfig.hstsEnabled
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    : false,
  permittedCrossDomainPolicies: {
    permittedPolicies: helmetConfig.permittedCrossDomainPolicies || 'none'
  }
};

if (helmetDirectives && Object.keys(helmetDirectives).length > 0) {
  helmetOptions.contentSecurityPolicy = {
    useDefaults: false,
    directives: helmetDirectives
  };
} else {
  helmetOptions.contentSecurityPolicy = false;
}

const baseCorsOptions = {
  methods: corsConfig.allowMethods?.length ? corsConfig.allowMethods : undefined,
  allowedHeaders: corsConfig.allowHeaders?.length ? corsConfig.allowHeaders : undefined,
  exposedHeaders: corsConfig.exposedHeaders?.length ? corsConfig.exposedHeaders : undefined,
  credentials: corsConfig.allowCredentials ?? false,
  maxAge: corsConfig.maxAgeSeconds ?? 600,
  optionsSuccessStatus: 204,
  preflightContinue: false
};

const corsMiddleware = cors((req, callback) => {
  const requestOrigin = req.header('Origin');
  const evaluation = evaluateCorsOrigin(requestOrigin, corsOriginMatchers, { strict: strictCorsMode });

  if (evaluation.allowed) {
    const responseOptions = {
      ...baseCorsOptions,
      origin: requestOrigin || true
    };

    if (evaluation.matched === 'null') {
      responseOptions.credentials = false;
    }

    callback(null, responseOptions);
    return;
  }

  if (!requestOrigin && strictCorsMode === false) {
    callback(null, { ...baseCorsOptions, origin: false });
    return;
  }

  const error = new Error('Origin not allowed by CORS policy');
  error.status = 403;
  error.cause = evaluation;
  console.warn('[cors] Blocked request due to origin policy', {
    origin: requestOrigin ?? 'none',
    path: req.originalUrl,
    reason: evaluation.reason
  });
  callback(error, { ...baseCorsOptions, origin: false });
});

const app = express();

app.disable('x-powered-by');

const trustProxyValue = config.security?.trustProxy;
if (trustProxyValue !== false && trustProxyValue?.toLowerCase?.() !== 'false') {
  app.set('trust proxy', trustProxyValue);
}

app.use(helmet(helmetOptions));
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
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    const limit = options.limit ?? options.max ?? config.security?.rateLimiting?.maxRequests ?? 120;
    const correlationId = deriveRequestCorrelationId(req);

    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.setHeader('RateLimit-Policy', `${limit};w=${retryAfterSeconds}`);

    console.warn('[rate-limit] Request rejected', {
      path: req.originalUrl,
      ip: req.ip,
      limit,
      windowMs: options.windowMs
    });

    res.status(429).json({
      message: 'Too many requests, please slow down.',
      retryAfterSeconds,
      correlationId
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
