import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const {
  sequelize,
  ServicemanMetricSetting,
  ServicemanMetricCard
} = await import('../src/models/index.js');

const {
  getServicemanMetricSettingsSnapshot,
  upsertServicemanMetricSettings,
  listAllServicemanMetricCards,
  listActiveServicemanMetricCards,
  createServicemanMetricCard,
  updateServicemanMetricCard,
  deleteServicemanMetricCard
} = await import('../src/services/servicemanMetricsService.js');

describe('servicemanMetricsService', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  beforeEach(async () => {
    await ServicemanMetricSetting.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true
    });
    await ServicemanMetricCard.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true
    });
  });

  it('returns default snapshot when no configuration exists', async () => {
    const snapshot = await getServicemanMetricSettingsSnapshot();

    expect(snapshot.summary.ownerName).toBeNull();
    expect(snapshot.summary.highlightNotes).toEqual(['']);
    expect(snapshot.productivity).toEqual({
      targetBillableHours: null,
      targetUtilisation: null,
      backlogCeiling: null,
      responseTargetMinutes: null,
      note: null
    });
    expect(snapshot.training.requiredModules).toEqual([]);
    expect(snapshot.operations.crewLeaderboard).toEqual([]);
    expect(snapshot.metadata).toEqual({ updatedAt: null, updatedBy: null });
  });

  it('sanitises and persists the complete metrics payload per scope', async () => {
    const snapshot = await upsertServicemanMetricSettings({
      actorId: 'crew-lead-42',
      summary: {
        ownerName: '  Alex Morgan  ',
        ownerEmail: '  crew.lead@example.com  ',
        escalationChannel: '  #crew-escalations  ',
        reviewCadence: '  Bi-weekly  ',
        highlightNotes: ['  Focus on emergency SLAs  ', '', ' Travel buffers < 45 mins ', '']
      },
      productivity: {
        targetBillableHours: '42.5',
        targetUtilisation: '102',
        backlogCeiling: '-4',
        responseTargetMinutes: '45',
        note: '  Balance coverage with wellbeing  '
      },
      quality: {
        targetSla: '99.9',
        reworkThreshold: '12.5',
        npsTarget: '78.123',
        qualityFlagLimit: '8',
        note: '  Escalate if callbacks occur twice  '
      },
      logistics: {
        travelBufferMinutes: '90',
        maxConcurrentJobs: '3',
        vehicleComplianceRate: '105',
        standbyCrew: '2',
        note: '  Maintain EV crew on standby  '
      },
      training: {
        requiredModules: ['  Working at height  ', '', 'Lockout training'],
        certificationAlerts: [
          { id: 'cert-custom', name: '  Gas Safe  ', dueDate: ' 2025-04-01 ', owner: '  Maria  ' },
          { name: '', owner: '', dueDate: null }
        ],
        complianceDueInDays: '45',
        lastDrillCompletedAt: ' 2025-02-20 ',
        nextDrillScheduledAt: '2025-03-05 ',
        note: '  Schedule cross-training  '
      },
      wellness: {
        overtimeCapHours: '60.4',
        wellbeingCheckCadence: '  Weekly  ',
        safetyIncidentThreshold: '4',
        fatigueFlagLimit: '3',
        note: '  Flag fatigue via safety board  '
      },
      operations: {
        crewLeaderboard: [
          {
            id: 'crew-1',
            name: '  Maria Chen  ',
            role: '  Lead engineer  ',
            completedJobs: '18',
            utilisation: '83.7',
            qualityScore: '97.2',
            rating: '4.7',
            avatarUrl: ' https://cdn.example.com/maria.png ',
            spotlight: '  Travel optimiser  '
          },
          {
            name: '',
            role: null,
            completedJobs: 'not-a-number',
            utilisation: null,
            qualityScore: undefined,
            rating: 9
          }
        ],
        checklists: [
          {
            id: 'check-1',
            label: '  Vehicle inspection  ',
            owner: '  Shift lead  ',
            cadence: ' Daily ',
            lastCompletedAt: ' 2025-02-18 '
          },
          { label: null }
        ],
        automation: {
          autoAssignEnabled: false,
          escalationChannel: '  @duty-officer  ',
          followUpChannel: '  #crew-follow-up  ',
          escalateWhen: '  Backlog > 12 jobs  '
        }
      }
    });

    expect(snapshot.summary).toEqual({
      ownerName: 'Alex Morgan',
      ownerEmail: 'crew.lead@example.com',
      escalationChannel: '#crew-escalations',
      reviewCadence: 'Bi-weekly',
      highlightNotes: ['Focus on emergency SLAs', 'Travel buffers < 45 mins']
    });
    expect(snapshot.productivity).toEqual({
      targetBillableHours: 42.5,
      targetUtilisation: 100,
      backlogCeiling: 0,
      responseTargetMinutes: 45,
      note: 'Balance coverage with wellbeing'
    });
    expect(snapshot.quality).toEqual({
      targetSla: 99.9,
      reworkThreshold: 12.5,
      npsTarget: 78.12,
      qualityFlagLimit: 8,
      note: 'Escalate if callbacks occur twice'
    });
    expect(snapshot.logistics).toEqual({
      travelBufferMinutes: 90,
      maxConcurrentJobs: 3,
      vehicleComplianceRate: 100,
      standbyCrew: 2,
      note: 'Maintain EV crew on standby'
    });
    expect(snapshot.training.requiredModules).toEqual(['Working at height', 'Lockout training']);
    expect(snapshot.training.certificationAlerts).toHaveLength(2);
    expect(snapshot.training.certificationAlerts[0]).toMatchObject({
      id: 'cert-custom',
      name: 'Gas Safe',
      dueDate: '2025-04-01',
      owner: 'Maria'
    });
    expect(snapshot.training.certificationAlerts[1].name).toBe('Certification');
    expect(snapshot.wellness).toEqual({
      overtimeCapHours: 60.4,
      wellbeingCheckCadence: 'Weekly',
      safetyIncidentThreshold: 4,
      fatigueFlagLimit: 3,
      note: 'Flag fatigue via safety board'
    });
    expect(snapshot.operations.automation).toEqual({
      autoAssignEnabled: false,
      escalationChannel: '@duty-officer',
      followUpChannel: '#crew-follow-up',
      escalateWhen: 'Backlog > 12 jobs'
    });
    expect(snapshot.operations.crewLeaderboard).toHaveLength(2);
    expect(snapshot.operations.crewLeaderboard[0]).toMatchObject({
      id: 'crew-1',
      name: 'Maria Chen',
      role: 'Lead engineer',
      completedJobs: 18,
      utilisation: 83.7,
      qualityScore: 97.2,
      rating: 4.7,
      avatarUrl: 'https://cdn.example.com/maria.png',
      spotlight: 'Travel optimiser'
    });
    expect(snapshot.operations.crewLeaderboard[1]).toMatchObject({
      name: 'Crew member',
      completedJobs: 0,
      utilisation: 0,
      qualityScore: null,
      rating: 5
    });
    expect(snapshot.operations.checklists).toHaveLength(2);
    expect(snapshot.operations.checklists[0]).toMatchObject({
      id: 'check-1',
      label: 'Vehicle inspection',
      owner: 'Shift lead',
      cadence: 'Daily',
      lastCompletedAt: '2025-02-18'
    });
    expect(snapshot.metadata.updatedBy).toBe('crew-lead-42');
    expect(snapshot.metadata.updatedAt).toBeTruthy();

    const records = await ServicemanMetricSetting.findAll();
    expect(records).toHaveLength(7);
    records.forEach((record) => {
      expect(record.updatedBy).toBe('crew-lead-42');
      expect(typeof record.scope).toBe('string');
    });
  });

  it('supports full lifecycle management of custom dashboard cards', async () => {
    const created = await createServicemanMetricCard({
      actorId: 'crew-lead',
      payload: {
        title: '  Travel buffer alerts  ',
        tone: 'warning',
        details: ['  4 upcoming bookings above buffer  ', '', '  Review standby crew coverage '],
        displayOrder: '95',
        isActive: true,
        mediaUrl: ' https://cdn.example.com/travel.png ',
        mediaAlt: ' Travel map ',
        cta: { label: '  Open routing dashboard  ', href: '  /crew/routing  ', external: false }
      }
    });

    expect(created).toMatchObject({
      title: 'Travel buffer alerts',
      tone: 'warning',
      details: ['4 upcoming bookings above buffer', 'Review standby crew coverage'],
      displayOrder: 95,
      isActive: true,
      mediaUrl: 'https://cdn.example.com/travel.png',
      mediaAlt: 'Travel map',
      cta: { label: 'Open routing dashboard', href: '/crew/routing', external: false },
      updatedBy: 'crew-lead'
    });

    const updated = await updateServicemanMetricCard({
      id: created.id,
      actorId: 'crew-admin',
      payload: {
        title: 'Travel readiness alerts',
        tone: 'danger',
        details: ['6 bookings breaching travel buffers'],
        displayOrder: 120,
        isActive: false,
        mediaUrl: '',
        mediaAlt: '',
        cta: null
      }
    });

    expect(updated).toMatchObject({
      title: 'Travel readiness alerts',
      tone: 'danger',
      displayOrder: 120,
      isActive: false,
      mediaUrl: null,
      mediaAlt: null,
      cta: null,
      updatedBy: 'crew-admin'
    });

    const additional = await createServicemanMetricCard({
      actorId: 'crew-lead',
      payload: {
        title: 'Automation wins',
        tone: 'success',
        details: ['Auto-routed 12 of 18 bookings'],
        displayOrder: 80,
        isActive: true
      }
    });

    const allCards = await listAllServicemanMetricCards();
    expect(allCards.map((card) => card.id)).toEqual([additional.id, updated.id]);

    const activeCards = await listActiveServicemanMetricCards();
    expect(activeCards).toHaveLength(1);
    expect(activeCards[0].id).toBe(additional.id);

    await deleteServicemanMetricCard({ id: updated.id });

    const remaining = await listAllServicemanMetricCards();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(additional.id);
  });

  it('rejects invalid card payloads', async () => {
    await expect(
      createServicemanMetricCard({
        actorId: 'crew-lead',
        payload: { title: 'Empty', tone: 'info', details: [] }
      })
    ).rejects.toThrow('Provide at least one detail bullet for the card');

    const created = await createServicemanMetricCard({
      actorId: 'crew-lead',
      payload: { title: 'Valid', tone: 'info', details: ['One detail'] }
    });

    await expect(
      updateServicemanMetricCard({
        id: created.id,
        actorId: 'crew-lead',
        payload: { title: 'Updated', tone: 'unknown', details: ['Detail'] }
      })
    ).rejects.toThrow('Select a supported tone for the card');
  });
});
