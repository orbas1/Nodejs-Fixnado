import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { sequelize, PlatformSetting } = await import('../src/models/index.js');
const {
  getOverviewSettings,
  updateOverviewSettings,
  __resetOverviewSettingsCache,
  DEFAULT_OVERVIEW_SETTINGS
} = await import('../src/services/adminDashboardSettingsService.js');

describe('admin dashboard overview settings service', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
    __resetOverviewSettingsCache();
  });

  it('returns default settings when none persisted', async () => {
    const settings = await getOverviewSettings();
    expect(settings.metrics.escrow.label).toBe(DEFAULT_OVERVIEW_SETTINGS.metrics.escrow.label);
    expect(settings.metrics.sla.goal).toBe(DEFAULT_OVERVIEW_SETTINGS.metrics.sla.goal);
    expect(settings.insights.manual).toEqual([]);
  });

  it('sanitises and persists updates', async () => {
    const updated = await updateOverviewSettings(
      {
        metrics: {
          escrow: {
            label: 'Escrow coverage ',
            caption: 'Tracking {{count}} positions',
            targetHighMultiplier: 1.34,
            targetMediumMultiplier: 0.42
          },
          sla: {
            goal: 98.4,
            warningThreshold: 96.2,
            caption: 'Goal {{goal}}%'
          }
        },
        insights: {
          manual: ['  Review data feeds  ', 'Review data feeds', 'Escalate ops']
        },
        timeline: {
          manual: [
            { title: 'Ops sync', when: 'Tomorrow', status: 'Ops' },
            { title: ' ', when: 'Later', status: 'N/A' }
          ]
        },
        security: {
          manualSignals: [
            { label: '  MFA uplift ', valueLabel: ' 91% ', caption: 'Portal adoption ', tone: 'warning' },
            { label: '', valueLabel: 'skip', caption: 'ignore', tone: 'danger' }
          ]
        },
        automation: {
          manualBacklog: [
            { name: ' Document triage ', status: 'Pilot ', notes: 'Launching for disputes', tone: 'success' },
            { name: ' ', status: 'Later', notes: 'skip' }
          ]
        },
        queues: {
          manualBoards: [
            {
              title: ' Insurance queue ',
              summary: ' Manual summary ',
              owner: 'Risk ops ',
              updates: [' First update ', ' ', 'Second update']
            }
          ],
          manualComplianceControls: [
            {
              name: 'Fire certificate review ',
              detail: ' Expiring assets ',
              due: ' Next week ',
              owner: 'Facilities ',
              tone: 'danger'
            },
            { name: '', detail: 'skip', due: 'skip' }
          ]
        },
        audit: {
          manualTimeline: [
            { time: ' 08:00 ', event: 'Pipeline backfill ', owner: 'Automation', status: 'Complete ' },
            { time: '', event: 'ignore' }
          ]
        }
      },
      'admin-user'
    );

    expect(updated.metrics.escrow.label).toBe('Escrow coverage');
    expect(updated.metrics.escrow.targetHighMultiplier).toBe(1.34);
    expect(updated.metrics.escrow.targetMediumMultiplier).toBe(0.42);
    expect(updated.metrics.sla.goal).toBeCloseTo(98.4, 2);
    expect(updated.metrics.sla.warningThreshold).toBeCloseTo(96.2, 2);
    expect(updated.insights.manual).toEqual(['Review data feeds', 'Escalate ops']);
    expect(updated.timeline.manual).toEqual([{ title: 'Ops sync', when: 'Tomorrow', status: 'Ops' }]);
    expect(updated.security.manualSignals).toEqual([
      { label: 'MFA uplift', valueLabel: '91%', caption: 'Portal adoption', tone: 'warning' }
    ]);
    expect(updated.automation.manualBacklog).toEqual([
      { name: 'Document triage', status: 'Pilot', notes: 'Launching for disputes', tone: 'success' }
    ]);
    expect(updated.queues.manualBoards).toEqual([
      {
        title: 'Insurance queue',
        summary: 'Manual summary',
        owner: 'Risk ops',
        updates: ['First update', 'Second update']
      }
    ]);
    expect(updated.queues.manualComplianceControls).toEqual([
      {
        name: 'Fire certificate review',
        detail: 'Expiring assets',
        due: 'Next week',
        owner: 'Facilities',
        tone: 'danger'
      }
    ]);
    expect(updated.audit.manualTimeline).toEqual([
      { time: '08:00', event: 'Pipeline backfill', owner: 'Automation', status: 'Complete' }
    ]);

    const row = await PlatformSetting.findOne({ where: { key: 'adminDashboardOverview' } });
    expect(row.value.metrics.escrow.label).toBe('Escrow coverage');
    expect(row.updatedBy).toBe('admin-user');

    const cached = await getOverviewSettings();
    expect(cached.metrics.escrow.label).toBe('Escrow coverage');
  });

  it('rejects invalid payloads', async () => {
    await expect(updateOverviewSettings(null)).rejects.toMatchObject({ statusCode: 422 });
  });
});
