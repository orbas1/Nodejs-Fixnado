import https from 'node:https';
import { URL } from 'node:url';
import config from '../config/index.js';

const DEFAULT_TIMEOUT_MS = 15000;

function getConfig() {
  return config.monitoring?.warehouseFreshness?.opsgenie || {};
}

function isEnabled() {
  const cfg = getConfig();
  return cfg.enabled !== false && typeof cfg.apiKey === 'string' && cfg.apiKey.trim() !== '';
}

function buildResponders(cfg) {
  const responders = Array.isArray(cfg.responders) ? cfg.responders.filter(Boolean) : [];
  if (cfg.teamName && !responders.some((entry) => entry?.name === cfg.teamName)) {
    responders.push({ type: 'team', name: cfg.teamName });
  }
  return responders;
}

function buildTags(cfg, tags) {
  const combined = new Set();
  for (const tag of Array.isArray(cfg.tags) ? cfg.tags : []) {
    if (typeof tag === 'string' && tag.trim()) {
      combined.add(tag.trim());
    }
  }
  for (const tag of Array.isArray(tags) ? tags : []) {
    if (typeof tag === 'string' && tag.trim()) {
      combined.add(tag.trim());
    }
  }
  return Array.from(combined);
}

function requestOpsgenie(path, { method = 'POST', body = null } = {}, logger = console) {
  const cfg = getConfig();
  if (!isEnabled()) {
    logger.warn('OpsGenie integration disabled, skipping request', { path });
    return Promise.resolve({ ok: false, skipped: true });
  }

  const url = new URL(path, cfg.baseUrl || 'https://api.opsgenie.com');
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve) => {
    const request = https.request(
      url,
      {
        method,
        timeout: DEFAULT_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload ? Buffer.byteLength(payload) : 0,
          Authorization: `GenieKey ${cfg.apiKey}`
        }
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf8');
          const ok = response.statusCode && response.statusCode >= 200 && response.statusCode < 300;
          resolve({
            ok,
            statusCode: response.statusCode,
            body: bodyText
          });
        });
      }
    );

    request.on('error', (error) => {
      logger.error('OpsGenie request failed', error);
      resolve({ ok: false, error });
    });

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

export async function raiseAlert({
  alias,
  message,
  description,
  priority,
  tags = [],
  details = {},
  note,
  source = 'fixnado-warehouse-monitor'
}, logger = console) {
  const cfg = getConfig();
  const responders = buildResponders(cfg);
  const payload = {
    alias,
    message,
    description,
    priority: priority || cfg.priority || 'P3',
    source,
    tags: buildTags(cfg, tags),
    details,
    responders,
    note: note || cfg.note,
    entity: cfg.service || undefined
  };

  const response = await requestOpsgenie('/v2/alerts', { method: 'POST', body: payload }, logger);

  if (response.skipped) {
    return false;
  }

  if (!response.ok && response.statusCode !== 409) {
    logger.error('Failed to raise OpsGenie alert', { alias, response });
    return false;
  }

  if (response.statusCode === 409) {
    logger.info('OpsGenie alert already exists for alias', { alias });
  }

  return true;
}

export async function closeAlert({ alias, note, source = 'fixnado-warehouse-monitor' } = {}, logger = console) {
  const cfg = getConfig();
  const payload = {
    source,
    note: note || cfg.closeNote || 'Freshness restored.'
  };

  const path = `/v2/alerts/${encodeURIComponent(alias)}/close?identifierType=alias`;
  const response = await requestOpsgenie(path, { method: 'POST', body: payload }, logger);

  if (response.skipped) {
    return false;
  }

  if (!response.ok && response.statusCode !== 404) {
    logger.error('Failed to close OpsGenie alert', { alias, response });
    return false;
  }

  return true;
}

export function isConfigured() {
  return isEnabled();
}

export default {
  raiseAlert,
  closeAlert,
  isConfigured
};
