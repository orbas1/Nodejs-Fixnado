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

const config = {
  env,
  port: intFromEnv('PORT', 4000),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: intFromEnv('DB_PORT', 3306),
    name: process.env.DB_NAME || 'fixnado',
    user: process.env.DB_USER || 'fixnado_user',
    password: process.env.DB_PASSWORD || 'change_me'
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
  }
};

export default config;
