import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/auditTrailService.js', () => ({
  recordSecurityEvent: vi.fn().mockResolvedValue(undefined),
  registerAuditSink: vi.fn()
}));

import { enforcePolicy } from '../src/middleware/policyMiddleware.js';
import { Permissions } from '../src/services/accessControlService.js';
import { recordSecurityEvent } from '../src/services/auditTrailService.js';

function buildApp(middleware) {
  const app = express();
  app.use(express.json());
  app.post('/test', middleware, (req, res) => {
    res.status(204).send();
  });
  return app;
}

describe('policyMiddleware', () => {
  beforeEach(() => {
    vi.mocked(recordSecurityEvent).mockClear();
  });

  afterEach(() => {
    vi.mocked(recordSecurityEvent).mockClear();
  });

  it('allows authorised actors and records allow audit events', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/manage',
      (req, res, next) => {
        req.user = { id: 'user-1', type: 'provider' };
        req.headers['x-fixnado-role'] = 'provider';
        next();
      },
      enforcePolicy('services.manage'),
      (req, res) => {
        res.status(204).send();
      }
    );

    await request(app).post('/manage').send({ companyId: 'company-1' }).expect(204);

    expect(recordSecurityEvent).toHaveBeenCalledTimes(1);
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'allow',
        resource: 'policy:services.manage'
      })
    );
  });

  it('denies unauthenticated requests and responds with 401', async () => {
    const app = buildApp(enforcePolicy('services.manage'));

    const response = await request(app).post('/test').send({}).expect(401);
    expect(response.body).toMatchObject({ message: 'Forbidden' });

    expect(recordSecurityEvent).toHaveBeenCalledTimes(1);
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'deny',
        resource: 'policy:services.manage',
        reason: 'missing_permissions'
      })
    );
  });

  it('denies actors missing permissions with 403', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/restricted',
      (req, res, next) => {
        req.user = { id: 'user-2', type: 'user' };
        req.headers['x-fixnado-role'] = 'user';
        next();
      },
      enforcePolicy({
        id: 'custom:admin-only',
        resource: 'admin.platform',
        action: 'admin.platform:write',
        description: 'Inline guard for testing',
        requirements: [Permissions.ADMIN_PLATFORM_WRITE]
      }),
      (req, res) => {
        res.status(200).json({ ok: true });
      }
    );

    await request(app).post('/restricted').send({}).expect(403);

    expect(recordSecurityEvent).toHaveBeenCalledTimes(1);
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'deny',
        resource: 'policy:admin.platform'
      })
    );
  });

  it('sanitises metadata before audit logging', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/book/:serviceId',
      (req, res, next) => {
        req.user = { id: 'user-3', type: 'user' };
        req.headers['x-fixnado-role'] = 'user';
        next();
      },
      enforcePolicy('services.book', {
        metadata: (req) => ({
          serviceId: req.params.serviceId,
          notes: 'x'.repeat(400),
          attachments: [{ id: 'secret' }]
        })
      }),
      (req, res) => {
        res.status(204).send();
      }
    );

    await request(app).post('/book/service-99').send({}).expect(204);

    const metadata = vi.mocked(recordSecurityEvent).mock.calls[0][0].metadata;
    expect(metadata.notes.endsWith('…')).toBe(true);
    expect(metadata.attachments[0]).toBe('[object]');
    expect(metadata.serviceId).toBe('service-99');
  });
});
