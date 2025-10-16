import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const {
  sequelize,
  CommandMetricSetting,
  CommandMetricCard
} = await import('../src/models/index.js');

const {
  getCommandMetricSettingsSnapshot,
  upsertCommandMetricSettings,
  listAllCommandMetricCards,
  listActiveCommandMetricCards,
  createCommandMetricCard,
  updateCommandMetricCard,
  deleteCommandMetricCard
} = await import('../src/services/commandMetricsConfigService.js');

describe('commandMetricsConfigService', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  beforeEach(async () => {
    await CommandMetricSetting.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await CommandMetricCard.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  });

  it('returns default snapshot when no configuration is stored', async () => {
    const snapshot = await getCommandMetricSettingsSnapshot();

    expect(snapshot.summary.highlightNotes).toEqual([]);
    expect(snapshot.metrics).toEqual({
      escrow: { targetHigh: null, targetMedium: null, captionNote: null },
      disputes: {
        thresholdLow: null,
        thresholdMedium: null,
        targetMedianMinutes: null,
        captionNote: null
      },
      jobs: { targetHigh: null, targetMedium: null, captionNote: null },
      sla: { target: null, warning: null, captionNote: null }
    });
    expect(snapshot.metadata.updatedAt).toBeNull();
  });

  it('persists sanitised settings for summary highlights and metric thresholds', async () => {
    const snapshot = await upsertCommandMetricSettings({
      actorId: 'admin-1',
      summary: { highlightNotes: ['  Keep SLA at 97%  ', '', 'Duplicate', 'Duplicate'] },
      metrics: {
        escrow: { targetHigh: '20000000', targetMedium: '15000000', captionNote: '  Fund balance  ' },
        disputes: { thresholdLow: '5', thresholdMedium: '12', targetMedianMinutes: '45', captionNote: ' Escalation ' },
        jobs: { targetHigh: '60', targetMedium: '40', captionNote: null },
        sla: { target: '98', warning: '95', captionNote: ' Adherence ' }
      }
    });

    expect(snapshot.summary.highlightNotes).toEqual(['Keep SLA at 97%', 'Duplicate', 'Duplicate']);
    expect(snapshot.metrics.escrow).toEqual({ targetHigh: 20000000, targetMedium: 15000000, captionNote: 'Fund balance' });
    expect(snapshot.metrics.disputes).toEqual({
      thresholdLow: 5,
      thresholdMedium: 12,
      targetMedianMinutes: 45,
      captionNote: 'Escalation'
    });
    expect(snapshot.metrics.jobs).toEqual({ targetHigh: 60, targetMedium: 40, captionNote: null });
    expect(snapshot.metrics.sla).toEqual({ target: 98, warning: 95, captionNote: 'Adherence' });
    expect(snapshot.metadata.updatedAt).toBeTruthy();

    const records = await CommandMetricSetting.findAll();
    expect(records).toHaveLength(5);
    records.forEach((record) => {
      expect(record.updatedBy).toBe('admin-1');
    });
  });

  it('rejects invalid threshold ordering when saving settings', async () => {
    await expect(
      upsertCommandMetricSettings({
        actorId: 'admin-2',
        summary: { highlightNotes: [] },
        metrics: { escrow: { targetHigh: 100, targetMedium: 120 } }
      })
    ).rejects.toThrow('Escrow high target must exceed the medium target');
  });

  it('creates, updates, lists, and deletes dashboard cards with sanitised payloads', async () => {
    const created = await createCommandMetricCard({
      actorId: 'admin-3',
      payload: {
        title: '  Dispute backlog ',
        tone: 'warning',
        details: [' Awaiting review ', '', ' Investigations active '],
        displayOrder: '90',
        isActive: true,
        mediaUrl: ' https://cdn.example.com/backlog.png ',
        mediaAlt: ' Backlog chart ',
        cta: { label: 'Open console', href: '/admin/disputes', external: false }
      }
    });

    expect(created.title).toBe('Dispute backlog');
    expect(created.details).toEqual(['Awaiting review', 'Investigations active']);
    expect(created.displayOrder).toBe(90);
    expect(created.mediaUrl).toBe('https://cdn.example.com/backlog.png');
    expect(created.mediaAlt).toBe('Backlog chart');
    expect(created.updatedBy).toBe('admin-3');

    const updated = await updateCommandMetricCard({
      id: created.id,
      actorId: 'admin-4',
      payload: {
        title: 'Escalation queue',
        tone: 'danger',
        details: ['12 cases breaching SLA'],
        displayOrder: 110,
        isActive: false,
        mediaUrl: '',
        mediaAlt: '',
        cta: null
      }
    });

    expect(updated.title).toBe('Escalation queue');
    expect(updated.isActive).toBe(false);
    expect(updated.displayOrder).toBe(110);
    expect(updated.mediaUrl).toBeNull();
    expect(updated.mediaAlt).toBeNull();
    expect(updated.updatedBy).toBe('admin-4');

    const additional = await createCommandMetricCard({
      actorId: 'admin-5',
      payload: {
        title: 'Automation wins',
        tone: 'success',
        details: ['Playbooks trimmed 6 hours'],
        displayOrder: 80,
        isActive: true
      }
    });

    const allCards = await listAllCommandMetricCards();
    expect(allCards.map((card) => card.id)).toEqual([additional.id, updated.id]);

    const activeCards = await listActiveCommandMetricCards();
    expect(activeCards).toHaveLength(1);
    expect(activeCards[0].id).toBe(additional.id);

    await deleteCommandMetricCard({ id: updated.id });

    const remaining = await listAllCommandMetricCards();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(additional.id);
  });

  it('requires details when creating a dashboard card', async () => {
    await expect(
      createCommandMetricCard({
        actorId: 'admin-6',
        payload: { title: 'Empty card', tone: 'info', details: [] }
      })
    ).rejects.toThrow('Provide at least one detail bullet for the card');
  });
});
