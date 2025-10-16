import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';

const {
  sequelize,
  Company,
  User,
  ComplianceControl,
  PlatformSetting
} = await import('../src/models/index.js');

const {
  listComplianceControls,
  createComplianceControl,
  updateComplianceControl,
  deleteComplianceControl,
  getComplianceControlAutomationSettings,
  updateComplianceControlAutomationSettings
} = await import('../src/services/complianceControlService.js');

const TIMEZONE = 'Europe/London';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('complianceControlService', () => {
  it('creates and lists compliance controls with metadata', async () => {
    const owner = await User.create({
      firstName: 'Tessa',
      lastName: 'Morgan',
      email: 'tessa@example.com',
      passwordHash: 'hashed',
      type: 'admin'
    });

    const company = await Company.create({
      userId: owner.id,
      legalStructure: 'Ltd',
      contactName: 'Tessa Morgan',
      contactEmail: owner.email,
      serviceRegions: 'London',
      marketplaceIntent: 'Facilities'
    });

    const nextReviewAt = DateTime.now().plus({ days: 5 }).toISO();

    const created = await createComplianceControl({
      title: 'Data processing agreement review',
      category: 'vendor',
      controlType: 'detective',
      status: 'active',
      reviewFrequency: 'annual',
      ownerTeam: 'Vendor Assurance',
      ownerEmail: 'vendor.assurance@example.com',
      ownerId: owner.id,
      companyId: company.id,
      nextReviewAt,
      evidenceRequired: true,
      evidenceLocation: 'https://evidence.fixnado.com/bucket',
      tags: ['vendors', 'critical'],
      watchers: 'alice@example.com,bob@example.com',
      metadata: {
        evidenceCheckpoints: [
          {
            id: 'contract-upload',
            name: 'Upload latest contract',
            dueAt: DateTime.now().plus({ days: 3 }).toISO(),
            owner: 'Vendor Assurance',
            status: 'pending'
          }
        ],
        exceptionReviews: [
          {
            id: 'urgent-waiver',
            summary: 'Grace period waiver for supplier onboarding',
            owner: 'Compliance Ops',
            status: 'open',
            expiresAt: DateTime.now().plus({ days: 14 }).toISO()
          }
        ]
      }
    }, { timezone: TIMEZONE });

    expect(created.title).toBe('Data processing agreement review');
    expect(created.owner?.name).toContain('Tessa');
    expect(created.tags).toContain('vendors');
    expect(created.watchers).toHaveLength(2);

    const payload = await listComplianceControls({ timezone: TIMEZONE });
    expect(payload.summary.total).toBe(1);
    expect(payload.controls).toHaveLength(1);
    expect(payload.controls[0].dueLabel).toContain('Due in');
    expect(payload.evidence).toHaveLength(1);
    expect(payload.exceptions).toHaveLength(1);
    expect(payload.filters.statuses).toContain('active');
  });

  it('updates an existing compliance control', async () => {
    const control = await ComplianceControl.create({
      title: 'Incident response runbook',
      category: 'procedure',
      controlType: 'corrective',
      status: 'active',
      reviewFrequency: 'semiannual',
      ownerTeam: 'Security Operations',
      nextReviewAt: DateTime.now().plus({ days: 10 }).toJSDate(),
      tags: ['security'],
      watchers: ['soc@example.com'],
      metadata: {}
    });

    const updated = await updateComplianceControl(
      control.id,
      {
        status: 'monitoring',
        tags: 'security,playbook',
        watchers: ['soc@example.com', 'duty@example.com'],
        metadata: {
          evidenceCheckpoints: [
            {
              id: 'drill-schedule',
              name: 'Schedule tabletop drill',
              dueAt: DateTime.now().plus({ days: 4 }).toISO(),
              owner: 'Security Operations'
            }
          ]
        }
      },
      { timezone: TIMEZONE }
    );

    expect(updated.status).toBe('monitoring');
    expect(updated.tags).toContain('playbook');
    expect(updated.watchers).toHaveLength(2);
    expect(updated.metadata.evidenceCheckpoints).toHaveLength(1);
  });

  it('deletes a compliance control', async () => {
    const control = await ComplianceControl.create({
      title: 'Legacy policy cleanup',
      category: 'policy',
      controlType: 'corrective',
      status: 'draft',
      reviewFrequency: 'annual',
      ownerTeam: 'Compliance Ops'
    });

    await deleteComplianceControl(control.id);
    const remaining = await ComplianceControl.count();
    expect(remaining).toBe(0);
  });

  it('updates automation settings', async () => {
    await PlatformSetting.destroy({ where: {} });
    const current = await getComplianceControlAutomationSettings();
    expect(current.reminderOffsetDays).toBeGreaterThanOrEqual(0);

    const next = await updateComplianceControlAutomationSettings({
      autoReminders: false,
      reminderOffsetDays: 3,
      defaultOwnerTeam: 'Risk & Compliance',
      escalateTo: 'risk@example.com',
      evidenceGraceDays: 1
    });

    expect(next.autoReminders).toBe(false);
    expect(next.reminderOffsetDays).toBe(3);
    expect(next.defaultOwnerTeam).toBe('Risk & Compliance');

    const persisted = await getComplianceControlAutomationSettings();
    expect(persisted.escalateTo).toBe('risk@example.com');
  });
});

