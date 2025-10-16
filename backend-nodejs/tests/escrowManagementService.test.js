import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const {
  sequelize,
  Region,
  User,
  Company,
  Service,
  Order,
  Escrow,
  EscrowMilestone,
  EscrowNote
} = await import('../src/models/index.js');

const {
  listEscrows,
  createManualEscrow,
  updateEscrow,
  addEscrowNote,
  deleteEscrowNote,
  upsertEscrowMilestone,
  deleteEscrowMilestone,
  getEscrowById,
  listReleasePolicies,
  upsertReleasePolicy,
  deleteReleasePolicy
} = await import('../src/services/escrowManagementService.js');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

async function seedOrder({
  amount = 1250,
  currency = 'GBP'
} = {}) {
  const region = await Region.create({ code: 'GB', name: 'Great Britain' });
  const buyer = await User.create(
    {
      firstName: 'Amelia',
      lastName: 'Buyer',
      email: 'amelia.buyer@example.com',
      passwordHash: 'hashed',
      type: 'user',
      regionId: region.id
    },
    { validate: false }
  );
  const admin = await User.create(
    {
      firstName: 'Oliver',
      lastName: 'Admin',
      email: 'ops@example.com',
      passwordHash: 'hashed',
      type: 'admin',
      regionId: region.id
    },
    { validate: false }
  );
  const provider = await User.create(
    {
      firstName: 'Harvey',
      lastName: 'Provider',
      email: 'provider@example.com',
      passwordHash: 'hashed',
      type: 'provider',
      regionId: region.id
    },
    { validate: false }
  );

  const company = await Company.create({
    userId: provider.id,
    legalStructure: 'Ltd',
    contactName: 'Provider Ops',
    contactEmail: 'ops@provider.test',
    serviceRegions: 'GB',
    marketplaceIntent: 'scale',
    verified: true,
    regionId: region.id
  });

  const service = await Service.create({
    companyId: company.id,
    providerId: provider.id,
    title: 'High rise HVAC repair',
    description: 'Planned maintenance for multi-site operations',
    category: 'maintenance',
    price: amount,
    currency,
    regionId: region.id
  });

  const order = await Order.create({
    buyerId: buyer.id,
    serviceId: service.id,
    status: 'draft',
    totalAmount: amount,
    currency,
    regionId: region.id
  });

  return { region, buyer, provider, admin, company, service, order };
}

describe('Escrow management service', () => {
  it('lists escrows with summary metrics and settings', async () => {
    const { order } = await seedOrder();
    await Escrow.create({
      orderId: order.id,
      amount: 1250,
      currency: 'GBP',
      status: 'funded'
    });

    const payload = await listEscrows();

    expect(payload.items).toHaveLength(1);
    expect(payload.summary.totalAmount).toBeGreaterThan(0);
    expect(payload.filters.statuses).toContain('funded');
    expect(Array.isArray(payload.settings.releasePolicies)).toBe(true);
    expect(payload.items[0]).toMatchObject({
      status: 'funded',
      currency: 'GBP'
    });
  });

  it('creates, updates, and manages manual escrow lifecycles', async () => {
    const { order, admin } = await seedOrder({ amount: 3200, currency: 'USD' });

    const created = await createManualEscrow(
      {
        orderId: order.id,
        amount: 3200,
        currency: 'USD',
        policyId: 'high-value',
        requiresDualApproval: true,
        autoReleaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Manual escrow created for enterprise rollout',
        milestones: [
          { label: 'Kick-off', status: 'pending', amount: 800 },
          { label: 'Commissioning', status: 'pending', amount: 2400 }
        ]
      },
      admin.id
    );

    expect(created.status).toBe('pending');
    expect(created.milestones).toHaveLength(2);
    expect(created.notes).toHaveLength(1);

    const updated = await updateEscrow(
      created.id,
      {
        status: 'funded',
        onHold: true,
        holdReason: 'Awaiting compliance checks',
        amount: 3250,
        milestones: created.milestones.map((milestone, index) => ({
          id: milestone.id,
          status: index === 0 ? 'approved' : milestone.status,
          completedAt: index === 0 ? new Date().toISOString() : null
        }))
      },
      admin.id
    );

    expect(updated.status).toBe('funded');
    expect(updated.onHold).toBe(true);
    expect(updated.milestones[0].status).toBe('approved');
    expect(updated.amount).toBeCloseTo(3250);

    const noted = await addEscrowNote(created.id, 'Finance approved release window', {
      authorId: admin.id,
      pinned: true
    });
    expect(noted.notes.some((note) => note.pinned)).toBe(true);

    const afterDeleteNote = await deleteEscrowNote(created.id, noted.notes[0].id);
    expect(afterDeleteNote.notes).toHaveLength(noted.notes.length - 1);

    const milestoneAdded = await upsertEscrowMilestone(created.id, {
      label: 'Post inspection sign-off',
      status: 'pending',
      amount: 0
    });
    expect(milestoneAdded.milestones.length).toBeGreaterThan(updated.milestones.length);

    const removed = await deleteEscrowMilestone(created.id, milestoneAdded.milestones.at(-1).id);
    expect(removed.milestones.length).toBe(updated.milestones.length);

    const fetched = await getEscrowById(created.id);
    expect(fetched.metadata.updatedBy).toBe(admin.id);
  });

  it('supports CRUD operations for release policies', async () => {
    const baseline = await listReleasePolicies();
    expect(Array.isArray(baseline)).toBe(true);

    const { policy: createdPolicy, policies: afterCreate } = await upsertReleasePolicy({
      name: 'Enterprise rollouts',
      description: 'High-risk projects that require dual approval and extended verification.',
      autoReleaseDays: 14,
      requiresDualApproval: true,
      maxAmount: 50000,
      notifyRoles: ['finance', 'ops'],
      documentChecklist: ['Invoice', 'Photos'],
      releaseConditions: ['Client sign-off', 'Compliance review']
    });

    expect(createdPolicy).toMatchObject({
      name: 'Enterprise rollouts',
      requiresDualApproval: true
    });
    expect(afterCreate.some((policy) => policy.id === createdPolicy.id)).toBe(true);

    const { policy: updatedPolicy } = await upsertReleasePolicy({
      id: createdPolicy.id,
      name: 'Enterprise rollouts',
      autoReleaseDays: 10,
      notifyRoles: ['finance'],
      releaseConditions: ['Client sign-off']
    });

    expect(updatedPolicy.autoReleaseDays).toBe(10);
    expect(updatedPolicy.notifyRoles).toContain('finance');
    expect(updatedPolicy.notifyRoles).toHaveLength(1);

    const { policies: afterDelete } = await deleteReleasePolicy(createdPolicy.id);
    expect(afterDelete.some((policy) => policy.id === createdPolicy.id)).toBe(false);
  });
});
