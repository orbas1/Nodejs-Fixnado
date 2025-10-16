import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import sequelize from '../../config/database.js';
import { Company, LiveFeedAuditEvent, LiveFeedAuditNote, ServiceZone, User } from '../../models/index.js';
import {
  recordLiveFeedAuditEvent,
  listLiveFeedAudits,
  createLiveFeedAuditNote,
  updateLiveFeedAuditNote,
  deleteLiveFeedAuditNote
} from '../liveFeedAuditService.js';

const FIXED_NOW = new Date('2025-03-25T10:00:00.000Z');

async function resetDatabase() {
  await LiveFeedAuditNote.destroy({ where: {} });
  await LiveFeedAuditEvent.destroy({ where: {} });
  await ServiceZone.destroy({ where: {} });
  await Company.destroy({ where: {} });
  await User.destroy({ where: {} });
}

async function createTestUser(overrides = {}) {
  const timestamp = Date.now();
  return User.create({
    firstName: overrides.firstName ?? 'Ops',
    lastName: overrides.lastName ?? 'Analyst',
    email:
      overrides.email ?? `ops-${timestamp}-${Math.round(Math.random() * 10000)}@example.com`,
    passwordHash: overrides.passwordHash ?? 'hashed-password',
    type: overrides.type ?? 'admin',
    ...overrides
  }, { validate: false });
}

async function createTestCompany(owner) {
  return Company.create({
    userId: owner.id,
    legalStructure: 'llc',
    contactName: 'Ops Owner',
    contactEmail: `owner-${Date.now()}-${Math.round(Math.random() * 10000)}@example.com`,
    serviceRegions: '[]',
    marketplaceIntent: 'testing',
    verified: true,
    complianceScore: 98.5
  });
}

function buildPolygon([minX, minY, maxX, maxY]) {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY]
      ]
    ]
  };
}

async function createTestZone(company, name, extent = [-1, -1, 1, 1]) {
  const polygon = buildPolygon(extent);
  return ServiceZone.create({
    companyId: company.id,
    name,
    boundary: polygon,
    centroid: { type: 'Point', coordinates: [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2] },
    boundingBox: polygon,
    metadata: { coverage: 'full' },
    demandLevel: 'medium'
  });
}

async function bootstrapContext() {
  const owner = await createTestUser({ firstName: 'Company', lastName: 'Owner', type: 'company' });
  const analyst = await createTestUser({ firstName: 'Ops', lastName: 'Analyst', type: 'admin' });
  const company = await createTestCompany(owner);
  const zone = await createTestZone(company, 'North Ops');
  return { owner, analyst, company, zone };
}

describe('liveFeedAuditService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('recordLiveFeedAuditEvent persists sanitised payloads', async () => {
    const { analyst, company, zone } = await bootstrapContext();

    const event = await recordLiveFeedAuditEvent({
      eventType: 'live_feed.post.created',
      summary: '  Example issue summary  ',
      details: 'Investigate attachments',
      severity: 'HIGH',
      status: 'INVESTIGATING',
      attachments: [
        { url: 'https://evidence.fixnado.example/audit.png', label: '  Screenshot ' },
        { url: 'ftp://invalid', label: 'Ignore' }
      ],
      tags: ['critical', 'Critical', ''],
      metadata: { reason: 'manual-review', safe: true },
      zoneId: zone.id,
      companyId: company.id,
      actorId: analyst.id,
      occurredAt: FIXED_NOW.toISOString()
    });

    expect(event.id).toBeDefined();
    expect(event.summary).toBe('Example issue summary');
    expect(event.severity).toBe('high');
    expect(event.status).toBe('investigating');
    expect(event.attachments).toEqual([
      { url: 'https://evidence.fixnado.example/audit.png', label: 'Screenshot' }
    ]);
    expect(event.tags).toEqual(['critical']);
    expect(event.zoneSnapshot).toMatchObject({ id: zone.id, name: zone.name, companyId: company.id });
    expect(event.actorSnapshot).toMatchObject({ id: analyst.id, name: 'Ops Analyst', email: analyst.email });
    expect(event.metadata).toEqual({ reason: 'manual-review', safe: true });

    const stored = await LiveFeedAuditEvent.findByPk(event.id);
    expect(stored).not.toBeNull();
    expect(stored?.companyId).toBe(company.id);
    expect(stored?.occurredAt.toISOString()).toBe(FIXED_NOW.toISOString());
  });

  test('listLiveFeedAudits returns pagination, summaries, and optional notes', async () => {
    const { analyst, company, zone } = await bootstrapContext();
    const secondZone = await createTestZone(company, 'South Ops', [2, -1, 4, 1]);
    const reviewer = await createTestUser({ firstName: 'Risk', lastName: 'Lead', type: 'admin' });

    const older = await recordLiveFeedAuditEvent({
      eventType: 'live_feed.post.created',
      summary: 'Older alert',
      severity: 'high',
      status: 'open',
      tags: ['urgent'],
      zoneId: zone.id,
      companyId: company.id,
      actorId: analyst.id,
      occurredAt: new Date(FIXED_NOW.getTime() - 60 * 60 * 1000).toISOString()
    });

    const newer = await recordLiveFeedAuditEvent({
      eventType: 'live_feed.bid.created',
      summary: 'Latest alert',
      severity: 'low',
      status: 'resolved',
      tags: ['reviewed'],
      zoneId: secondZone.id,
      companyId: company.id,
      actorId: reviewer.id,
      occurredAt: FIXED_NOW.toISOString()
    });

    await createLiveFeedAuditNote({
      auditId: older.id,
      authorId: analyst.id,
      authorRole: 'admin',
      note: 'Follow-up with provider',
      tags: ['ops']
    });

    const listing = await listLiveFeedAudits({
      includeNotes: true,
      sortBy: 'occurredAt',
      sortDirection: 'ASC'
    });

    expect(listing.meta).toEqual({ page: 1, pageSize: 25, total: 2, totalPages: 1 });
    expect(listing.data).toHaveLength(2);
    expect(listing.data[0].id).toBe(older.id);
    expect(listing.data[0].notes).toHaveLength(1);
    expect(listing.summary.total).toBe(2);
    expect(listing.summary.byStatus).toMatchObject({ open: 1, resolved: 1 });
    expect(listing.summary.bySeverity).toMatchObject({ high: 1, low: 1 });
      const zoneIds = listing.summary.topZones.map((entry) => entry.zoneId);
      const actorIds = listing.summary.topActors.map((entry) => entry.actorId);
    expect(new Set(zoneIds)).toEqual(new Set([zone.id, secondZone.id]));
    expect(zoneIds).toHaveLength(2);
    expect(new Set(actorIds)).toEqual(new Set([analyst.id, reviewer.id]));
    expect(actorIds).toHaveLength(2);

    const filtered = await listLiveFeedAudits({ severities: ['high'] });
    expect(filtered.data).toHaveLength(1);
    expect(filtered.data[0].id).toBe(older.id);
    expect(filtered.summary.total).toBe(1);
    expect(filtered.summary.bySeverity).toMatchObject({ high: 1 });
  });

  test('create/update/delete note workflow mutates records safely', async () => {
    const { analyst, company, zone } = await bootstrapContext();

    const audit = await recordLiveFeedAuditEvent({
      eventType: 'live_feed.bid.message',
      summary: 'Note handling',
      severity: 'medium',
      status: 'open',
      zoneId: zone.id,
      companyId: company.id,
      actorId: analyst.id
    });

    const created = await createLiveFeedAuditNote({
      auditId: audit.id,
      authorId: analyst.id,
      authorRole: 'moderator',
      note: 'Initial note',
      tags: ['triage', 'triage', '']
    });

    expect(created.note).toBe('Initial note');
    expect(created.tags).toEqual(['triage']);

    const updated = await updateLiveFeedAuditNote(created.id, { note: 'Updated note', tags: ['resolved'] });
    expect(updated.note).toBe('Updated note');
    expect(updated.tags).toEqual(['resolved']);

    await expect(updateLiveFeedAuditNote(created.id, { note: '' })).rejects.toThrow('Note text cannot be empty');

    const deleted = await deleteLiveFeedAuditNote(created.id);
    expect(deleted).toBe(true);
    await expect(updateLiveFeedAuditNote(created.id, { note: 'again' })).rejects.toThrow('Live feed audit note not found');
  });
});
