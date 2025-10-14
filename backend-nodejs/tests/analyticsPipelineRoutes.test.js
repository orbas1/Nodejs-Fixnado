import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, AnalyticsEvent, AnalyticsPipelineRun } = await import('../src/models/index.js');
const { clearAnalyticsPipelineStateCache, evaluatePipelineState } = await import('../src/services/analyticsPipelineService.js');

function createAnalyticsEvent(overrides = {}) {
  return AnalyticsEvent.create({
    domain: 'bookings',
    eventName: 'booking.created',
    schemaVersion: 1,
    entityType: 'booking',
    occurredAt: new Date('2025-10-20T10:00:00Z'),
    receivedAt: new Date('2025-10-20T10:01:00Z'),
    metadata: {
      bookingId: 'bk-1',
      companyId: 'co-1',
      zoneId: 'zn-1',
      type: 'on_demand',
      demandLevel: 'high',
      currency: 'GBP',
      totalAmount: 120,
      slaExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    },
    nextIngestAttemptAt: new Date(Date.now() - 60 * 1000),
    ...overrides
  });
}

function createPipelineRun(overrides = {}) {
  return AnalyticsPipelineRun.create({
    status: 'success',
    startedAt: new Date(Date.now() - 10 * 60 * 1000),
    finishedAt: new Date(Date.now() - 9 * 60 * 1000),
    eventsProcessed: 3,
    eventsFailed: 0,
    batchesDelivered: 1,
    purgedEvents: 1,
    metadata: { summary: { totalEvents: 3 } },
    ...overrides
  });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "feature_toggle_audits" (
      id TEXT PRIMARY KEY,
      toggle_key TEXT NOT NULL,
      previous_state TEXT,
      previous_rollout REAL,
      next_state TEXT NOT NULL,
      next_rollout REAL NOT NULL,
      actor TEXT NOT NULL,
      description TEXT,
      ticket TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  await sequelize.query('CREATE INDEX IF NOT EXISTS feature_toggle_audits_toggle_key ON feature_toggle_audits (toggle_key);');
  await sequelize.query('CREATE INDEX IF NOT EXISTS feature_toggle_audits_changed_at ON feature_toggle_audits (changed_at);');
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch {
    // ignore double close when watcher restarts tests
  }
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  await sequelize.query('DELETE FROM "feature_toggle_audits"');
  clearAnalyticsPipelineStateCache();
});

describe('Analytics pipeline administration API', () => {
  it('returns backlog metrics and recent runs', async () => {
    await createAnalyticsEvent();
    await createPipelineRun({ status: 'success' });
    await createPipelineRun({
      status: 'failed',
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      finishedAt: new Date(Date.now() - 4.5 * 60 * 1000),
      eventsProcessed: 0,
      eventsFailed: 4,
      batchesDelivered: 0,
      purgedEvents: 0,
      lastError: 'warehouse timeout'
    });

    const response = await request(app).get('/api/analytics/pipeline/status').expect(200);

    expect(response.body.pipeline).toBeDefined();
    expect(response.body.pipeline.enabled).toBe(true);
    expect(response.body.backlog.pendingEvents).toBe(1);
    expect(response.body.runs.length).toBeGreaterThanOrEqual(2);
    expect(response.body.failureStreak).toBe(1);
    expect(response.body.lastError.message).toContain('warehouse timeout');
  });

  it('pauses and resumes the pipeline with audit run entries', async () => {
    const pauseResponse = await request(app)
      .post('/api/analytics/pipeline/pause')
      .send({ actor: 'Ops Engineer', reason: 'warehouse maintenance', ticket: 'INC-42' })
      .expect(200);

    expect(pauseResponse.body.pipeline.enabled).toBe(false);
    const evaluatedAfterPause = await evaluatePipelineState();
    expect(evaluatedAfterPause.enabled).toBe(false);
    const runsAfterPause = await AnalyticsPipelineRun.findAll();
    expect(runsAfterPause).toHaveLength(1);
    expect(runsAfterPause[0].metadata.controlAction).toBe('pause');
    expect(runsAfterPause[0].metadata.ticket).toBe('INC-42');

    const resumeResponse = await request(app)
      .post('/api/analytics/pipeline/resume')
      .send({ actor: 'Ops Engineer', reason: 'warehouse back online' })
      .expect(200);

    expect(resumeResponse.body.pipeline.enabled).toBe(true);
    const runsAfterResume = await AnalyticsPipelineRun.findAll({ order: [['startedAt', 'ASC']] });
    expect(runsAfterResume).toHaveLength(2);
    expect(runsAfterResume[1].metadata.controlAction).toBe('resume');
  });

  it('rejects control requests without an actor', async () => {
    const response = await request(app).post('/api/analytics/pipeline/pause').send({}).expect(422);
    expect(response.body.errors).toBeInstanceOf(Array);
  });
});
