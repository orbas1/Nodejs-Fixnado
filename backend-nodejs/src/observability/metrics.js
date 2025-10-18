import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const registry = new Registry();

collectDefaultMetrics({
  register: registry,
  prefix: 'fixnado_' + (process.env.NODE_ENV === 'production' ? '' : 'dev_')
});

const readinessGauge = new Gauge({
  name: 'fixnado_readiness_status',
  help: 'Readiness component status (0=error,0.25=stopping,0.5=initialising,0.75=degraded,1=ready)',
  labelNames: ['component'],
  registers: [registry]
});

const rateLimitCounter = new Counter({
  name: 'fixnado_rate_limit_rejections_total',
  help: 'Total number of requests rejected by the rate limiter',
  labelNames: ['path', 'method'],
  registers: [registry]
});

const databaseHealthHistogram = new Histogram({
  name: 'fixnado_database_health_duration_ms',
  help: 'Observed database health check latency in milliseconds',
  labelNames: ['status'],
  buckets: [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [registry]
});

const databaseHealthFailures = new Counter({
  name: 'fixnado_database_health_failures_total',
  help: 'Count of failed database readiness checks',
  registers: [registry]
});

const readinessStatusMap = new Map();

function statusToValue(status) {
  switch (status) {
    case 'ready':
    case 'pass':
      return 1;
    case 'degraded':
      return 0.75;
    case 'initialising':
    case 'initializing':
      return 0.5;
    case 'stopping':
      return 0.25;
    case 'error':
    case 'fail':
      return 0;
    default:
      return 0.5;
  }
}

export function markReadinessStatus(component, status) {
  if (!component) {
    return;
  }

  readinessStatusMap.set(component, status);
  readinessGauge.set({ component }, statusToValue(status));
}

export function recordRateLimitRejection({ path, method }) {
  rateLimitCounter.inc({ path: path || 'unknown', method: (method || 'UNKNOWN').toUpperCase() });
}

export function observeDatabaseHealth(durationMs, status) {
  const safeDuration = Math.max(durationMs, 0);
  databaseHealthHistogram.observe({ status }, safeDuration);
  if (status !== 'pass') {
    databaseHealthFailures.inc();
  }
}

export function getMetricsRegistry() {
  return registry;
}

export async function serialiseMetrics() {
  return registry.metrics();
}

export function getReadinessMetricsSnapshot() {
  return Array.from(readinessStatusMap.entries()).map(([component, status]) => ({ component, status }));
}
