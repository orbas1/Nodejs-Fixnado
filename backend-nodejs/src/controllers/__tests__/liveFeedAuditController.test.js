import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('express-validator', () => ({
  validationResult: vi.fn()
}));

import {
  listLiveFeedAuditsHandler,
  getLiveFeedAuditHandler,
  createLiveFeedAuditHandler,
  updateLiveFeedAuditHandler,
  createLiveFeedAuditNoteHandler,
  updateLiveFeedAuditNoteHandler,
  deleteLiveFeedAuditNoteHandler
} from '../liveFeedAuditController.js';
import * as service from '../../services/liveFeedAuditService.js';
import { validationResult } from 'express-validator';

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('liveFeedAuditController', () => {
  beforeEach(() => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists audits with parsed filters', async () => {
    const payload = { data: [], meta: {}, summary: {} };
    const spy = vi.spyOn(service, 'listLiveFeedAudits').mockResolvedValue(payload);

    const req = {
      query: {
        page: '2',
        pageSize: '10',
        eventTypes: 'live_feed.post.created,live_feed.bid.created',
        includeNotes: 'true'
      }
    };
    const res = createResponse();
    const next = vi.fn();

    await listLiveFeedAuditsHandler(req, res, next);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      page: '2',
      pageSize: '10',
      eventTypes: ['live_feed.post.created', 'live_feed.bid.created'],
      includeNotes: true
    });
    expect(res.body).toBe(payload);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards errors from list handler', async () => {
    const error = new Error('failed to list');
    vi.spyOn(service, 'listLiveFeedAudits').mockRejectedValue(error);

    const req = { query: {} };
    const res = createResponse();
    const next = vi.fn();

    await listLiveFeedAuditsHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('returns a single audit event', async () => {
    const audit = { id: 'audit-123' };
    const spy = vi.spyOn(service, 'getLiveFeedAudit').mockResolvedValue(audit);

    const req = { params: { auditId: 'audit-123' }, query: { includeNotes: 'true' } };
    const res = createResponse();
    const next = vi.fn();

    await getLiveFeedAuditHandler(req, res, next);

    expect(spy).toHaveBeenCalledWith('audit-123', { includeNotes: true });
    expect(res.body).toBe(audit);
    expect(next).not.toHaveBeenCalled();
  });

  it('creates manual audit events with actor metadata', async () => {
    const audit = { id: 'audit-001' };
    const spy = vi.spyOn(service, 'createManualLiveFeedAudit').mockResolvedValue(audit);

    const req = {
      body: {
        eventType: 'live_feed.post.created',
        summary: 'Manual entry',
        status: 'open',
        severity: 'low'
      },
      user: { id: 'admin-007', type: 'super-admin' },
      auth: { actor: { role: 'super-admin', persona: 'ops' } }
    };
    const res = createResponse();
    const next = vi.fn();

    await createLiveFeedAuditHandler(req, res, next);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      eventType: 'live_feed.post.created',
      summary: 'Manual entry',
      actorId: 'admin-007',
      actorRole: 'super-admin',
      actorPersona: 'ops'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toBe(audit);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid create payloads', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid payload' }]
    });

    const spy = vi.spyOn(service, 'createManualLiveFeedAudit');
    const req = { body: {} };
    const res = createResponse();
    const next = vi.fn();

    await createLiveFeedAuditHandler(req, res, next);

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ errors: [{ msg: 'Invalid payload' }] });
    expect(spy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('updates audit events when payload is valid', async () => {
    const audit = { id: 'audit-010', status: 'resolved' };
    const spy = vi.spyOn(service, 'updateLiveFeedAudit').mockResolvedValue(audit);

    const req = {
      params: { auditId: 'audit-010' },
      body: { status: 'resolved', severity: 'high' }
    };
    const res = createResponse();
    const next = vi.fn();

    await updateLiveFeedAuditHandler(req, res, next);

    expect(spy).toHaveBeenCalledWith('audit-010', expect.objectContaining({ status: 'resolved', severity: 'high' }));
    expect(res.body).toBe(audit);
    expect(next).not.toHaveBeenCalled();
  });

  it('creates, updates, and deletes notes', async () => {
    const createdNote = { id: 'note-001', note: 'hello' };
    const updatedNote = { id: 'note-001', note: 'updated' };
    const createSpy = vi.spyOn(service, 'createLiveFeedAuditNote').mockResolvedValue(createdNote);
    const updateSpy = vi.spyOn(service, 'updateLiveFeedAuditNote').mockResolvedValue(updatedNote);
    const deleteSpy = vi.spyOn(service, 'deleteLiveFeedAuditNote').mockResolvedValue(true);

    const createReq = {
      params: { auditId: 'audit-1' },
      body: { note: 'hello', tags: ['ops'] },
      user: { id: 'admin-1', type: 'super-admin' },
      auth: { actor: { role: 'super-admin' } }
    };
    const res = createResponse();
    const next = vi.fn();

    await createLiveFeedAuditNoteHandler(createReq, res, next);
    expect(createSpy).toHaveBeenCalledWith({
      auditId: 'audit-1',
      authorId: 'admin-1',
      authorRole: 'super-admin',
      note: 'hello',
      tags: ['ops']
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toBe(createdNote);

    const updateReq = { params: { noteId: 'note-001' }, body: { note: 'updated', tags: ['cleared'] } };
    const updateRes = createResponse();
    await updateLiveFeedAuditNoteHandler(updateReq, updateRes, next);
    expect(updateSpy).toHaveBeenCalledWith('note-001', { note: 'updated', tags: ['cleared'] });
    expect(updateRes.body).toBe(updatedNote);

    const deleteReq = { params: { noteId: 'note-001' } };
    const deleteRes = createResponse();
    await deleteLiveFeedAuditNoteHandler(deleteReq, deleteRes, next);
    expect(deleteSpy).toHaveBeenCalledWith('note-001');
    expect(deleteRes.statusCode).toBe(204);
    expect(deleteRes.body).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });
});
