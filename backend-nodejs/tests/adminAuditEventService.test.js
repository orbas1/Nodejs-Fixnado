import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

const { sequelize, AdminAuditEvent } = await import('../src/models/index.js');
const {
  listAdminAuditEvents,
  createAdminAuditEvent,
  updateAdminAuditEvent,
  deleteAdminAuditEvent
} = await import('../src/services/adminAuditEventService.js');

const TIMEZONE = 'Europe/London';

describe('adminAuditEventService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AdminAuditEvent.destroy({ where: {} });
  });

  it('creates and lists audit events within the requested timeframe', async () => {
    const occurredAt = DateTime.now().setZone(TIMEZONE).minus({ hours: 1 }).toISO();
    await createAdminAuditEvent(
      {
        title: 'Compliance attestation',
        summary: 'Tracked for PCI-DSS readiness.',
        category: 'compliance',
        status: 'scheduled',
        ownerName: 'Compliance Ops',
        ownerTeam: 'Compliance',
        occurredAt,
        attachments: [{ label: 'Checklist', url: 'https://example.com/checklist.pdf' }]
      },
      null
    );

    const payload = await listAdminAuditEvents({ timeframe: '7d', timezone: TIMEZONE });
    expect(payload.events).toHaveLength(1);
    expect(payload.meta.countsByCategory.compliance).toBe(1);
    expect(payload.events[0].attachments).toHaveLength(1);
    expect(payload.meta.lastUpdated).toBeTypeOf('string');
  });

  it('updates and deletes audit events', async () => {
    const occurredAt = DateTime.now().setZone(TIMEZONE).minus({ hours: 2 }).toISO();
    const created = await createAdminAuditEvent(
      {
        title: 'Security tabletop',
        summary: 'Simulation with engineering and ops.',
        category: 'security',
        status: 'in_progress',
        ownerName: 'Security Ops',
        ownerTeam: 'Security',
        occurredAt,
        attachments: []
      },
      null
    );

    const updated = await updateAdminAuditEvent(created.id, {
      status: 'completed',
      ownerTeam: 'Trust & Safety',
      attachments: [
        { label: 'After action report', url: 'https://example.com/aar.pdf' },
        { label: 'Evidence board', url: 'https://example.com/board.png' }
      ]
    });

    expect(updated.status).toBe('completed');
    expect(updated.attachments).toHaveLength(2);
    expect(updated.ownerTeam).toBe('Trust & Safety');

    await deleteAdminAuditEvent(created.id);
    const afterDelete = await listAdminAuditEvents({ timeframe: '7d', timezone: TIMEZONE });
    expect(afterDelete.events).toHaveLength(0);
  });
});
