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

function listFromEnv(key) {
  const raw = process.env[key];
  if (typeof raw !== 'string' || raw.trim() === '') {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
const DEFAULT_WAREHOUSE_THRESHOLDS = {
  default: 120,
  bookings: 30,
  rentals: 30,
  disputes: 60,
  ads: 45,
  communications: 20,
  zones: 90
};

function normaliseThresholds(source, fallback) {
  const base = { ...fallback };
  if (!source || typeof source !== 'object') {
    return base;
  }

  for (const [key, value] of Object.entries(source)) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      base[key] = parsed;
    }
  }

  return base;
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
  auth: {
    admin: {
      securityToken: process.env.ADMIN_SECURITY_TOKEN || '',
      allowedEmails: listFromEnv('ADMIN_ALLOWED_EMAILS'),
      allowedDomains: listFromEnv('ADMIN_ALLOWED_DOMAINS'),
      sessionTtlHours: Math.max(intFromEnv('ADMIN_SESSION_TTL_HOURS', 12), 1)
    }
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
  subscriptions: {
    enabled: process.env.SUBSCRIPTIONS_ENABLED !== 'false',
    enforceFeatures: process.env.SUBSCRIPTIONS_ENFORCE_FEATURES !== 'false',
    defaultTier: process.env.SUBSCRIPTIONS_DEFAULT_TIER || 'standard',
    restrictedFeatures: jsonFromEnv('SUBSCRIPTIONS_RESTRICTED_FEATURES', [
      'advanced-analytics',
      'campaigns',
      'priority-support'
    ]),
    tiers: jsonFromEnv('SUBSCRIPTIONS_DEFAULT_TIERS', [
      {
        id: 'standard',
        label: 'Standard',
        description: 'Core marketplace tools with baseline analytics.',
        features: ['core-marketplace', 'basic-analytics']
      },
      {
        id: 'growth',
        label: 'Growth',
        description: 'Unlock campaigns, advanced reporting, and premium support.',
        features: ['core-marketplace', 'advanced-analytics', 'campaigns', 'priority-support']
      }
    ])
  },
  integrations: {
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      accountId: process.env.STRIPE_ACCOUNT_ID || ''
    },
    escrow: {
      apiKey: process.env.ESCROW_API_KEY || '',
      apiSecret: process.env.ESCROW_API_SECRET || '',
      environment: process.env.ESCROW_ENVIRONMENT || 'sandbox'
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: intFromEnv('SMTP_PORT', 587),
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      fromEmail: process.env.SMTP_FROM_EMAIL || '',
      secure: process.env.SMTP_SECURE === 'true'
    },
    cloudflareR2: {
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID || '',
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
      bucket: process.env.CLOUDFLARE_R2_BUCKET || '',
      publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || '',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || ''
    },
    app: {
      name: process.env.APP_NAME || 'Fixnado',
      url: process.env.APP_URL || '',
      supportEmail: process.env.SUPPORT_EMAIL || ''
    }
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
    enabled: process.env.ANALYTICS_INGEST_ENABLED !== 'false',
    ingestEndpoint: process.env.ANALYTICS_INGEST_ENDPOINT || '',
    ingestApiKey: process.env.ANALYTICS_INGEST_API_KEY || '',
    batchSize: Math.max(intFromEnv('ANALYTICS_INGEST_BATCH_SIZE', 250), 1),
    pollIntervalSeconds: Math.max(intFromEnv('ANALYTICS_INGEST_INTERVAL_SECONDS', 60), 15),
    retentionDays: Math.max(intFromEnv('ANALYTICS_RETENTION_DAYS', 395), 30),
    requestTimeoutMs: Math.max(intFromEnv('ANALYTICS_INGEST_TIMEOUT_MS', 15000), 1000),
    purgeBatchSize: Math.max(intFromEnv('ANALYTICS_PURGE_BATCH_SIZE', 300), 50),
    lookbackHours: Math.max(intFromEnv('ANALYTICS_BACKFILL_LOOKBACK_HOURS', 72), 1),
    retryScheduleMinutes: jsonFromEnv('ANALYTICS_RETRY_SCHEDULE_MINUTES', [5, 15, 60, 240, 1440]),
    controlToggleKey: process.env.ANALYTICS_INGEST_TOGGLE_KEY || 'analytics.pipeline.enabled',
    controlCacheSeconds: Math.max(intFromEnv('ANALYTICS_CONTROL_CACHE_SECONDS', 30), 5)
  },
  materialsShowcase: {
    cacheSeconds: Math.max(intFromEnv('MATERIALS_SHOWCASE_CACHE_SECONDS', 45), 10),
    fallbackCacheSeconds: Math.max(intFromEnv('MATERIALS_SHOWCASE_FALLBACK_SECONDS', 10), 5),
    maxCacheEntries: Math.max(intFromEnv('MATERIALS_SHOWCASE_MAX_CACHE_ENTRIES', 24), 1)
  },
  dashboards: {
    defaultTimezone: process.env.DASHBOARDS_TIMEZONE || 'Europe/London',
    defaultWindowDays: Math.max(intFromEnv('DASHBOARDS_DEFAULT_WINDOW_DAYS', 28), 7),
    upcomingLimit: Math.max(intFromEnv('DASHBOARDS_UPCOMING_LIMIT', 8), 3),
    exportRowLimit: Math.max(intFromEnv('DASHBOARDS_EXPORT_ROW_LIMIT', 5000), 500),
    defaults: {
      admin: {
        companyId: process.env.DASHBOARDS_ADMIN_COMPANY_ID || null
      },
      provider: {
        companyId: process.env.DASHBOARDS_PROVIDER_COMPANY_ID || null,
        providerId: process.env.DASHBOARDS_PROVIDER_PROVIDER_ID || null
      },
      user: {
        userId: process.env.DASHBOARDS_USER_USER_ID || null,
        companyId: process.env.DASHBOARDS_USER_COMPANY_ID || null
      },
      serviceman: {
        providerId: process.env.DASHBOARDS_SERVICEMAN_PROVIDER_ID || null
      },
      enterprise: {
        companyId: process.env.DASHBOARDS_ENTERPRISE_COMPANY_ID || null
      }
    }
  },
  monitoring: {
    warehouseFreshness: {
      pollIntervalMinutes: Math.max(intFromEnv('WAREHOUSE_FRESHNESS_POLL_MINUTES', 5), 1),
      datasetThresholdMinutes: normaliseThresholds(
        jsonFromEnv('WAREHOUSE_FRESHNESS_THRESHOLDS', {}),
        DEFAULT_WAREHOUSE_THRESHOLDS
      ),
      backlogThreshold: Math.max(intFromEnv('WAREHOUSE_BACKLOG_THRESHOLD', 1500), 0),
      backlogAgeMinutes: Math.max(intFromEnv('WAREHOUSE_BACKLOG_MAX_AGE_MINUTES', 45), 5),
      failureStreakThreshold: Math.max(intFromEnv('WAREHOUSE_FAILURE_STREAK_THRESHOLD', 3), 1),
      maxRunGapMinutes: Math.max(intFromEnv('WAREHOUSE_MAX_RUN_GAP_MINUTES', 15), 5),
      opsgenie: {
        enabled: process.env.OPSGENIE_ENABLED !== 'false',
        apiKey: process.env.OPSGENIE_API_KEY || '',
        baseUrl: process.env.OPSGENIE_BASE_URL || 'https://api.opsgenie.com',
        teamName: process.env.OPSGENIE_TEAM_NAME || '',
        responders: jsonFromEnv('OPSGENIE_RESPONDERS', []),
        tags: jsonFromEnv('OPSGENIE_ALERT_TAGS', ['analytics', 'freshness']),
        priority: process.env.OPSGENIE_PRIORITY || 'P3',
        note: process.env.OPSGENIE_ALERT_NOTE ||
          'Investigate analytics ingestion freshness via docs/telemetry/ui-preference-dashboard.md.',
        closeNote:
          process.env.OPSGENIE_ALERT_CLOSE_NOTE ||
          'Freshness restored automatically by warehouse monitor.',
        service: process.env.OPSGENIE_SERVICE || 'Fixnado Analytics'
      }
    }
  }
};

export default config;
