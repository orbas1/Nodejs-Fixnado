import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  sequelize,
  User,
  Company,
  ProviderContact
} from '../src/models/index.js';
import {
  createServicemanCommissionRule,
  createServicemanPayment,
  getServicemanPaymentsWorkspace,
  updateServicemanPayment,
  archiveServicemanCommissionRule,
  listServicemanCommissionRules
} from '../src/services/servicemanFinanceService.js';

async function createProviderContext() {
  const user = await User.create(
    {
      firstName: 'Ops',
      lastName: 'Lead',
      email: `provider-${Math.random().toString(16).slice(2)}@example.com`,
      passwordHash: 'hashed',
      type: 'company'
    },
    { validate: false }
  );

  const company = await Company.create({
    userId: user.id,
    legalStructure: 'limited',
    contactName: 'Ops Lead',
    contactEmail: 'ops@example.com',
    serviceRegions: 'London',
    verified: true
  });

  return { user, company };
}

describe('servicemanFinanceService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates payments, applies default commission rules, and summarises workspace data', async () => {
    const { user, company } = await createProviderContext();

    await createServicemanCommissionRule(
      {
        name: 'Default 15%',
        rateType: 'percentage',
        rateValue: 0.15,
        isDefault: true,
        autoApply: true,
        approvalStatus: 'approved'
      },
      { companyId: company.id, actor: user }
    );

    const serviceman = await ProviderContact.create({
      companyId: company.id,
      name: 'Morgan Lee',
      role: 'Lead engineer',
      email: 'morgan@example.com',
      type: 'operations'
    });

    const created = await createServicemanPayment(
      {
        servicemanId: serviceman.id,
        amount: 800,
        currency: 'gbp',
        status: 'approved',
        dueDate: new Date().toISOString()
      },
      { companyId: company.id, actor: user }
    );

    expect(created.serviceman?.id).toBe(serviceman.id);
    expect(created.commissionAmount).toBeCloseTo(120);
    expect(created.commissionRule?.name).toBe('Default 15%');

    const workspace = await getServicemanPaymentsWorkspace({ companyId: company.id, actor: user });
    expect(workspace.summary.outstandingTotal).toBeCloseTo(800);
    expect(workspace.summary.commissionOutstanding).toBeCloseTo(120);
    expect(workspace.upcoming).toHaveLength(1);

    const updated = await updateServicemanPayment(
      created.id,
      { status: 'paid', paidAt: new Date().toISOString() },
      { companyId: company.id, actor: user }
    );

    expect(updated.status).toBe('paid');

    const refreshed = await getServicemanPaymentsWorkspace({ companyId: company.id, actor: user });
    expect(refreshed.summary.outstandingTotal).toBe(0);
    expect(refreshed.summary.commissionPaid).toBeCloseTo(120);
  });

  it('archives commission rules and excludes them from active counts', async () => {
    const { user, company } = await createProviderContext();

    const rule = await createServicemanCommissionRule(
      {
        name: 'Project bonus',
        rateType: 'flat',
        rateValue: 250,
        approvalStatus: 'approved'
      },
      { companyId: company.id, actor: user }
    );

    await archiveServicemanCommissionRule(rule.id, { companyId: company.id, actor: user });

    const summary = await listServicemanCommissionRules({ companyId: company.id, actor: user });
    expect(summary.rules[0].approvalStatus).toBe('archived');
    expect(summary.activeRules).toBe(0);
  });
});
