import 'dotenv/config';

const env = process.env.NODE_ENV || 'development';

function intFromEnv(key, defaultValue) {
  const raw = process.env[key];
  const parsed = Number.parseInt(raw ?? '', 10);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return defaultValue;
}

function floatFromEnv(key, defaultValue) {
  const raw = process.env[key];
  if (typeof raw !== 'string') {
    return defaultValue;
  }

  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return defaultValue;
}

function jsonFromEnv(key, defaultValue) {
  const raw = process.env[key];
  if (typeof raw !== 'string' || raw.trim() === '') {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.warn(`Failed to parse JSON for ${key}:`, error.message);
  }

  return defaultValue;
}

const config = {
  env,
  port: intFromEnv('PORT', 4000),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: intFromEnv('DB_PORT', 5432),
    name: process.env.DB_NAME || 'fixnado',
    user: process.env.DB_USER || 'fixnado_user',
    password: process.env.DB_PASSWORD || 'change_me',
    ssl: process.env.DB_SSL === 'true',
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    dialect: (process.env.DB_DIALECT || 'postgres').toLowerCase()
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret',
    expiresIn: '12h'
  },
  telemetry: {
    slackWebhookUrl: process.env.TELEMETRY_SLACK_WEBHOOK_URL || '',
    evaluationRangeHours: Math.max(intFromEnv('TELEMETRY_EVALUATION_RANGE_HOURS', 24), 1),
    staleMinutesThreshold: Math.max(intFromEnv('TELEMETRY_STALE_MINUTES', 120), 5),
    emoShareThreshold: Math.min(Math.max(floatFromEnv('TELEMETRY_EMO_SHARE_MINIMUM', 0.1), 0), 1),
    pollIntervalMinutes: Math.max(intFromEnv('TELEMETRY_ALERT_INTERVAL_MINUTES', 15), 5),
    repeatAlertMinutes: Math.max(intFromEnv('TELEMETRY_ALERT_REPEAT_MINUTES', 60), 15),
    minimumEventsForShare: Math.max(intFromEnv('TELEMETRY_MIN_EVENTS_FOR_SHARE', 50), 1)
  },
  finance: {
    defaultCurrency: (process.env.FINANCE_DEFAULT_CURRENCY || 'GBP').toUpperCase(),
    commissionRates: jsonFromEnv('FINANCE_COMMISSION_RATES', { default: 0.12 }),
    taxRates: jsonFromEnv('FINANCE_TAX_RATES', { GBP: 0.2 }),
    exchangeRates: jsonFromEnv('FINANCE_EXCHANGE_RATES', { GBP: 1, EUR: 1.17, USD: 1.27 }),
    slaTargetsMinutes: jsonFromEnv('FINANCE_SLA_TARGET_MINUTES', {
      on_demand: 90,
      scheduled: 240
    })
  },
  zoneAnalytics: {
    snapshotIntervalMinutes: Math.max(intFromEnv('ZONE_ANALYTICS_INTERVAL_MINUTES', 30), 5),
    staleBookingThresholdMinutes: Math.max(intFromEnv('ZONE_ANALYTICS_STALE_MINUTES', 120), 15)
  },
  featureToggles: {
    secretArn: process.env.FEATURE_TOGGLE_SECRET_ARN || '',
    cacheTtlSeconds: Math.max(intFromEnv('FEATURE_TOGGLE_CACHE_SECONDS', 60), 10),
    overrides: jsonFromEnv('FEATURE_TOGGLE_OVERRIDES', {}),
    auditTrail: process.env.FEATURE_TOGGLE_AUDIT_TABLE || 'feature_toggle_audits'
  },
  communications: {
    aiAssistEndpoint: process.env.COMMS_AI_ENDPOINT || '',
    aiAssistApiKey: process.env.COMMS_AI_KEY || '',
    aiAssistModel: process.env.COMMS_AI_MODEL || 'gpt-4o-mini',
    suggestionTemperature: Math.min(Math.max(floatFromEnv('COMMS_AI_TEMPERATURE', 0.35), 0), 1),
    defaultQuietHours: jsonFromEnv('COMMS_DEFAULT_QUIET_HOURS', {
      start: '22:00',
      end: '07:00',
      timezone: 'Europe/London'
    }),
    retentionDays: Math.max(intFromEnv('COMMS_MESSAGE_RETENTION_DAYS', 90), 14),
    agora: {
      appId: process.env.AGORA_APP_ID || '',
      appCertificate: process.env.AGORA_APP_CERTIFICATE || '',
      defaultExpireSeconds: Math.max(intFromEnv('AGORA_SESSION_TTL_SECONDS', 3600), 300)
    }
  },
  campaigns: {
    overspendTolerance: Math.max(floatFromEnv('CAMPAIGN_OVERSPEND_TOLERANCE', 0.15), 0),
    underspendTolerance: Math.max(floatFromEnv('CAMPAIGN_UNDERSPEND_TOLERANCE', 0.25), 0),
    suspiciousCtrThreshold: Math.max(floatFromEnv('CAMPAIGN_SUSPICIOUS_CTR_THRESHOLD', 0.18), 0),
    suspiciousCvrThreshold: Math.max(floatFromEnv('CAMPAIGN_SUSPICIOUS_CVR_THRESHOLD', 0.45), 0),
    deliveryGapImpressionFloor: Math.max(intFromEnv('CAMPAIGN_DELIVERY_GAP_IMPRESSIONS', 100), 0),
    noSpendGraceDays: Math.max(intFromEnv('CAMPAIGN_NO_SPEND_GRACE_DAYS', 2), 0),
    exportBatchSize: Math.max(intFromEnv('CAMPAIGN_EXPORT_BATCH_SIZE', 200), 1),
    exportIntervalSeconds: Math.max(intFromEnv('CAMPAIGN_EXPORT_INTERVAL_SECONDS', 60), 15),
    analyticsEndpoint: process.env.CAMPAIGN_ANALYTICS_ENDPOINT || '',
    analyticsApiKey: process.env.CAMPAIGN_ANALYTICS_API_KEY || '',
    failedRetryMinutes: Math.max(intFromEnv('CAMPAIGN_EXPORT_RETRY_MINUTES', 10), 1)
  },
  analyticsPipeline: {
    ingestEndpoint: process.env.ANALYTICS_INGEST_ENDPOINT || '',
    ingestApiKey: process.env.ANALYTICS_INGEST_API_KEY || '',
    batchSize: Math.max(intFromEnv('ANALYTICS_INGEST_BATCH_SIZE', 250), 1),
    pollIntervalSeconds: Math.max(intFromEnv('ANALYTICS_INGEST_INTERVAL_SECONDS', 60), 15),
    retentionDays: Math.max(intFromEnv('ANALYTICS_RETENTION_DAYS', 395), 30),
    requestTimeoutMs: Math.max(intFromEnv('ANALYTICS_INGEST_TIMEOUT_MS', 15000), 1000),
    purgeBatchSize: Math.max(intFromEnv('ANALYTICS_PURGE_BATCH_SIZE', 300), 50),
    lookbackHours: Math.max(intFromEnv('ANALYTICS_BACKFILL_LOOKBACK_HOURS', 72), 1),
    retryScheduleMinutes: jsonFromEnv('ANALYTICS_RETRY_SCHEDULE_MINUTES', [5, 15, 60, 240, 1440])
  }
};

export default config;
