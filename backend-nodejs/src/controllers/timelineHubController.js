import { validationResult } from 'express-validator';
import { getTimelineHubSnapshot, getTimelineModerationQueue } from '../services/timelineHubService.js';
import { createChatwootSession } from '../services/chatwootService.js';
import { updateLiveFeedAudit, createLiveFeedAuditNote } from '../services/liveFeedAuditService.js';

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (Array.isArray(value)) {
    return value.some((entry) => parseBoolean(entry, defaultValue));
  }
  const normalised = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalised)) {
    return false;
  }
  return defaultValue;
}

function parseList(value) {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .flatMap((entry) =>
      String(entry)
        .split(',')
        .map((token) => token.trim())
    )
    .filter(Boolean);
}

function parseInteger(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function respondValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

export async function getTimelineHubHandler(req, res, next) {
  if (respondValidationErrors(req, res)) {
    return;
  }

  try {
    const zoneIds = [...parseList(req.query.zoneIds), ...parseList(req.query.zoneId)];
    const snapshot = await getTimelineHubSnapshot({
      userId: req.user?.id ?? null,
      persona: req.auth?.actor?.persona ?? req.user?.type ?? null,
      zoneIds,
      customJobLimit: parseInteger(req.query.customJobLimit, 20),
      timelineLimit: parseInteger(req.query.timelineLimit, 20),
      marketplaceLimit: parseInteger(req.query.marketplaceLimit, 12),
      includeOutOfZone: parseBoolean(req.query.includeOutOfZone, true),
      outOfZoneOnly: parseBoolean(req.query.outOfZoneOnly, false)
    });
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
}

export async function getTimelineModerationQueueHandler(req, res, next) {
  if (respondValidationErrors(req, res)) {
    return;
  }

  try {
    const queue = await getTimelineModerationQueue({
      statuses: parseList(req.query.statuses ?? req.query.status),
      severities: parseList(req.query.severities ?? req.query.severity),
      zoneIds: parseList(req.query.zoneIds ?? req.query.zoneId),
      limit: parseInteger(req.query.limit, 25)
    });
    res.json(queue);
  } catch (error) {
    next(error);
  }
}

const ACTION_STATUS_MAP = Object.freeze({
  resolve: 'resolved',
  close: 'resolved',
  dismiss: 'dismissed',
  escalate: 'investigating',
  investigate: 'investigating',
  reopen: 'open'
});

export async function resolveTimelineModerationHandler(req, res, next) {
  if (respondValidationErrors(req, res)) {
    return;
  }

  try {
    const action = req.body.action ? String(req.body.action).toLowerCase() : null;
    const updates = {};
    if (action && ACTION_STATUS_MAP[action]) {
      updates.status = ACTION_STATUS_MAP[action];
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'severity')) {
      updates.severity = req.body.severity;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'summary')) {
      updates.summary = req.body.summary;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'details')) {
      updates.details = req.body.details;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'assigneeId')) {
      updates.assigneeId = req.body.assigneeId || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'nextActionAt')) {
      updates.nextActionAt = req.body.nextActionAt || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'attachments')) {
      updates.attachments = req.body.attachments;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
      updates.tags = req.body.tags;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'metadata')) {
      updates.metadata = req.body.metadata;
    }

    const event = await updateLiveFeedAudit(req.params.auditId, updates);

    let note = null;
    if (req.body.note) {
      note = await createLiveFeedAuditNote({
        auditId: event.id,
        authorId: req.user?.id ?? null,
        authorRole: req.auth?.actor?.role ?? req.user?.type ?? null,
        note: req.body.note,
        tags: parseList(req.body.noteTags)
      });
    }

    res.json({ event, note });
  } catch (error) {
    next(error);
  }
}

export async function createChatwootSessionHandler(req, res, next) {
  if (respondValidationErrors(req, res)) {
    return;
  }

  try {
    const fullName = req.body.name
      ? String(req.body.name)
      : [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || null;

    const session = await createChatwootSession({
      userId: req.user?.id ?? null,
      email: req.body.email ?? req.user?.email ?? null,
      name: fullName,
      persona: req.body.persona ?? req.auth?.actor?.persona ?? req.user?.type ?? null,
      locale:
        req.body.locale ??
        (req.headers['accept-language'] ? String(req.headers['accept-language']).split(',').at(0) : null) ??
        'en-GB',
      metadata: req.body.metadata ?? {},
      actorRole: req.auth?.actor?.role ?? req.user?.type ?? null
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
}
