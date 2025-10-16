import { validationResult } from 'express-validator';
import {
  listLiveFeedAudits,
  getLiveFeedAudit,
  createManualLiveFeedAudit,
  updateLiveFeedAudit,
  createLiveFeedAuditNote,
  updateLiveFeedAuditNote,
  deleteLiveFeedAuditNote
} from '../services/liveFeedAuditService.js';

function parseArrayParam(value) {
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

export async function listLiveFeedAuditsHandler(req, res, next) {
  try {
    const payload = await listLiveFeedAudits({
      page: req.query.page,
      pageSize: req.query.pageSize,
      start: req.query.start,
      end: req.query.end,
      eventTypes: parseArrayParam(req.query.eventType ?? req.query.eventTypes),
      statuses: parseArrayParam(req.query.status ?? req.query.statuses),
      severities: parseArrayParam(req.query.severity ?? req.query.severities),
      zoneIds: parseArrayParam(req.query.zoneId ?? req.query.zoneIds),
      actorRoles: parseArrayParam(req.query.actorRole ?? req.query.actorRoles),
      actorIds: parseArrayParam(req.query.actorId ?? req.query.actorIds),
      search: req.query.search ?? null,
      includeNotes: req.query.includeNotes === 'true' || req.query.includeNotes === true,
      sortBy: req.query.sortBy,
      sortDirection: req.query.sortDirection
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function getLiveFeedAuditHandler(req, res, next) {
  try {
    const audit = await getLiveFeedAudit(req.params.auditId, {
      includeNotes: req.query.includeNotes !== 'false'
    });
    res.json(audit);
  } catch (error) {
    next(error);
  }
}

export async function createLiveFeedAuditHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const audit = await createManualLiveFeedAudit({
      eventType: req.body.eventType,
      summary: req.body.summary,
      details: req.body.details,
      source: 'manual',
      status: req.body.status,
      severity: req.body.severity,
      resourceType: req.body.resourceType,
      resourceId: req.body.resourceId,
      postId: req.body.postId,
      postSnapshot: req.body.postSnapshot,
      zoneId: req.body.zoneId,
      zoneSnapshot: req.body.zoneSnapshot,
      companyId: req.body.companyId,
      actorId: req.user?.id ?? null,
      actorRole: req.auth?.actor?.role ?? req.user?.type ?? null,
      actorPersona: req.auth?.actor?.persona ?? null,
      actorSnapshot: req.body.actorSnapshot,
      assigneeId: req.body.assigneeId,
      nextActionAt: req.body.nextActionAt,
      attachments: req.body.attachments,
      tags: req.body.tags,
      metadata: req.body.metadata,
      occurredAt: req.body.occurredAt
    });

    res.status(201).json(audit);
  } catch (error) {
    next(error);
  }
}

export async function updateLiveFeedAuditHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const audit = await updateLiveFeedAudit(req.params.auditId, {
      status: req.body.status,
      severity: req.body.severity,
      summary: req.body.summary,
      details: req.body.details,
      assigneeId: req.body.assigneeId,
      nextActionAt: req.body.nextActionAt,
      attachments: req.body.attachments,
      tags: req.body.tags,
      metadata: req.body.metadata
    });
    res.json(audit);
  } catch (error) {
    next(error);
  }
}

export async function createLiveFeedAuditNoteHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const note = await createLiveFeedAuditNote({
      auditId: req.params.auditId,
      authorId: req.user?.id,
      authorRole: req.auth?.actor?.role ?? req.user?.type ?? null,
      note: req.body.note,
      tags: req.body.tags
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
}

export async function updateLiveFeedAuditNoteHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const note = await updateLiveFeedAuditNote(req.params.noteId, {
      note: req.body.note,
      tags: req.body.tags
    });
    res.json(note);
  } catch (error) {
    next(error);
  }
}

export async function deleteLiveFeedAuditNoteHandler(req, res, next) {
  try {
    await deleteLiveFeedAuditNote(req.params.noteId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
