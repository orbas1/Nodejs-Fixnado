import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { sequelize, User, AffiliateProfile, AffiliateReferral, AffiliateLedgerEntry, PlatformSetting } = await import(
  '../src/models/index.js'
);
const {
  getAffiliateSettings,
  saveAffiliateSettings,
  createOrUpdateCommissionRule,
  resolveCommissionRule,
  recordAffiliateConversion,
  listCommissionRules,
  listAffiliateProfiles,
  createAffiliateProfile,
  updateAffiliateProfile,
  listAffiliateLedgerEntries,
  createManualAffiliateLedgerEntry,
  listAffiliateReferrals,
  createAffiliateReferral,
  updateAffiliateReferral
} = await import('../src/services/affiliateService.js');

async function resetDatabase() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  await PlatformSetting.destroy({ where: {} });
}

async function createTestUser(overrides = {}) {
  return User.create(
    {
      firstName: 'Test',
      lastName: 'User',
      email: overrides.email || `affiliate-${randomUUID()}@example.com`,
      passwordHash: 'hashed-password',
      type: overrides.type || 'admin'
    },
    { validate: false }
  );
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

describe('affiliate settings persistence', () => {
  it('normalises payloads with resources, assets, and tiers', async () => {
    const actorId = randomUUID();
    const saved = await saveAffiliateSettings({
      actorId,
      payload: {
        programmeName: '  Fixnado Partner Hub  ',
        programmeTagline: 'Earn revenue with every referral',
        contactEmail: ' affiliates@fixnado.com ',
        brandColor: '1445e0',
        payoutCadenceDays: '45',
        referralAttributionWindowDays: '15',
        resources: [
          {
            label: 'Welcome Pack',
            url: ' https://fixnado.com/resources/welcome ',
            type: 'guide',
            description: 'Everything new partners need to launch',
            roles: 'marketing, sales',
            openInNewTab: false
          }
        ],
        assetLibrary: [
          {
            label: 'Primary Logo',
            type: 'logo',
            url: 'https://cdn.fixnado.com/brand/logo.png',
            previewUrl: 'https://cdn.fixnado.com/brand/logo-preview.png',
            description: 'Transparent PNG for dark backgrounds'
          }
        ],
        tiers: [
          {
            label: 'Gold Partners',
            headline: 'Unlock premium perks',
            benefits: ['Priority payouts', 'Dedicated manager']
          }
        ]
      }
    });

    expect(saved.programmeName).toBe('Fixnado Partner Hub');
    expect(saved.brandColor).toBe('#1445E0');
    expect(saved.payoutCadenceDays).toBe(45);
    expect(saved.referralAttributionWindowDays).toBe(15);
    expect(saved.resources).toHaveLength(1);
    expect(saved.resources[0]).toMatchObject({
      id: 'welcome-pack',
      label: 'Welcome Pack',
      roles: ['marketing', 'sales'],
      openInNewTab: false
    });
    expect(saved.assetLibrary[0]).toMatchObject({
      id: 'primary-logo',
      type: 'logo'
    });
    expect(saved.tiers[0]).toMatchObject({
      id: 'gold-partners',
      label: 'Gold Partners'
    });

    const cached = await getAffiliateSettings();
    expect(cached.programmeName).toBe('Fixnado Partner Hub');
    expect(cached.resources[0].id).toBe('welcome-pack');
  });
});

describe('commission rule management', () => {
  it('creates, updates, and resolves rules based on amount and priority', async () => {
    const actor = await createTestUser({ email: 'commissioner@example.com' });
    const created = await createOrUpdateCommissionRule({
      actorId: actor.id,
      payload: {
        name: 'Starter tier',
        tierLabel: 'Starter',
        commissionRate: 10,
        minTransactionValue: 0,
        recurrenceType: 'one_time',
        priority: 200,
        metadata: { summary: 'Base tier' }
      }
    });

    const updated = await createOrUpdateCommissionRule({
      id: created.id,
      actorId: actor.id,
      payload: {
        name: 'Starter tier',
        tierLabel: 'Starter',
        commissionRate: 12.5,
        minTransactionValue: 0,
        recurrenceType: 'one_time',
        priority: 150,
        metadata: { summary: 'Updated tier' }
      }
    });

    expect(Number(updated.commissionRate)).toBeCloseTo(12.5, 5);
    expect(updated.priority).toBe(150);

    await createOrUpdateCommissionRule({
      actorId: actor.id,
      payload: {
        name: 'High value bonus',
        tierLabel: 'Premier',
        commissionRate: 18,
        minTransactionValue: 500,
        recurrenceType: 'infinite',
        priority: 50,
        metadata: { summary: 'Reward for large deals' }
      }
    });

    const rules = await listCommissionRules();
    const matchLow = resolveCommissionRule({ amount: 200, occurrenceIndex: 1, rules });
    const matchHigh = resolveCommissionRule({ amount: 1000, occurrenceIndex: 1, rules });

    expect(matchLow?.tierLabel).toBe('Starter');
    expect(matchHigh?.tierLabel).toBe('Premier');
  });
});

describe('affiliate ledger handling', () => {
  it('records conversions and rolls up metrics for profiles and referrals', async () => {
    const actor = await createTestUser({ email: 'affiliate-admin@example.com' });
    const profileOwner = await createTestUser({ email: 'affiliate@example.com', type: 'user' });

    await createOrUpdateCommissionRule({
      actorId: actor.id,
      payload: {
        name: 'Core rule',
        tierLabel: 'Core',
        commissionRate: 15,
        minTransactionValue: 0,
        recurrenceType: 'infinite',
        priority: 100,
        metadata: { summary: 'Baseline rule' }
      }
    });

    const profile = await AffiliateProfile.create({
      userId: profileOwner.id,
      referralCode: 'goldenref',
      status: 'active'
    });

    const referral = await AffiliateReferral.create({
      affiliateProfileId: profile.id,
      referralCodeUsed: 'goldenref',
      status: 'pending'
    });

    const ledgerEntry = await recordAffiliateConversion({
      affiliateProfileId: profile.id,
      referralId: referral.id,
      transactionId: 'txn_123',
      transactionAmount: 400,
      occurrenceIndex: 1,
      currency: 'USD'
    });

    expect(Number(ledgerEntry.commissionAmount)).toBeCloseTo(60, 2);

    const refreshedProfile = await AffiliateProfile.findByPk(profile.id);
    expect(Number(refreshedProfile.totalCommissionEarned)).toBeCloseTo(60, 2);
    expect(Number(refreshedProfile.pendingCommission)).toBeCloseTo(60, 2);
    expect(Number(refreshedProfile.lifetimeRevenue)).toBeCloseTo(400, 2);

    const refreshedReferral = await AffiliateReferral.findByPk(referral.id);
    expect(refreshedReferral.status).toBe('converted');
    expect(refreshedReferral.conversionsCount).toBe(1);
    expect(Number(refreshedReferral.totalCommissionEarned)).toBeCloseTo(60, 2);

    const entries = await AffiliateLedgerEntry.findAll({ where: { affiliateProfileId: profile.id } });
    expect(entries).toHaveLength(1);
  });
});

describe('affiliate roster management', () => {
  it('creates profiles, updates statuses, and records manual ledger adjustments', async () => {
    const admin = await createTestUser({ email: 'roster-admin@example.com' });
    const affiliateUser = await createTestUser({ email: 'roster-user@example.com', type: 'user' });

    const createdProfile = await createAffiliateProfile({
      actorId: admin.id,
      payload: {
        userId: affiliateUser.id,
        status: 'pending',
        tierLabel: 'Starter',
        referralCode: 'starterref'
      }
    });

    expect(createdProfile.status).toBe('pending');
    expect(createdProfile.tierLabel).toBe('Starter');

    const roster = await listAffiliateProfiles();
    expect(roster.data).toHaveLength(1);
    expect(roster.meta.total).toBe(1);

    const updated = await updateAffiliateProfile({
      id: createdProfile.id,
      payload: { status: 'active', tierLabel: 'Pro' }
    });

    expect(updated.status).toBe('active');
    expect(updated.tierLabel).toBe('Pro');

    const adjustment = await createManualAffiliateLedgerEntry({
      affiliateProfileId: createdProfile.id,
      actorId: admin.id,
      payload: {
        transactionAmount: 500,
        commissionAmount: 125,
        currency: 'USD',
        status: 'approved',
        recognizedAt: '2024-01-01T00:00:00Z',
        metadata: { memo: 'Launch bonus' }
      }
    });

    expect(Number(adjustment.entry.commissionAmount)).toBeCloseTo(125, 2);
    expect(Number(adjustment.profile.totalCommissionEarned)).toBeCloseTo(125, 2);

    const ledgerList = await listAffiliateLedgerEntries({ affiliateProfileId: createdProfile.id });
    expect(ledgerList.data).toHaveLength(1);
    expect(Number(ledgerList.data[0].commissionAmount)).toBeCloseTo(125, 2);
  });
});

describe('affiliate referral administration', () => {
  it('supports creating, listing, and updating referrals while rolling up profile totals', async () => {
    const admin = await createTestUser({ email: 'referral-admin@example.com' });
    const affiliateUser = await createTestUser({ email: 'referral-affiliate@example.com', type: 'user' });
    const referredUser = await createTestUser({ email: 'converted-user@example.com', type: 'user' });

    const profile = await createAffiliateProfile({
      actorId: admin.id,
      payload: { userId: affiliateUser.id, status: 'active', referralCode: 'referral01', tierLabel: 'Starter' }
    });

    const created = await createAffiliateReferral({
      actorId: admin.id,
      payload: {
        affiliateProfileId: profile.id,
        referredUserId: referredUser.id,
        referralCodeUsed: 'referral01',
        status: 'pending',
        conversionsCount: 2,
        totalRevenue: 800,
        totalCommissionEarned: 120
      }
    });

    expect(created.referral.status).toBe('pending');
    expect(created.profile.totalReferred).toBe(2);

    const list = await listAffiliateReferrals({ search: 'referral01' });
    expect(list.data).toHaveLength(1);
    expect(list.meta.total).toBe(1);
    expect(list.data[0].referredUser.email).toBe('converted-user@example.com');

    const updated = await updateAffiliateReferral({
      id: created.referral.id,
      payload: { status: 'converted', conversionsCount: 3, totalRevenue: 1200, lastConversionAt: '2024-02-01T00:00:00Z' }
    });

    expect(updated.referral.status).toBe('converted');
    expect(updated.referral.conversionsCount).toBe(3);
    expect(updated.profile?.totalReferred).toBe(3);

    const refreshedProfile = await AffiliateProfile.findByPk(profile.id);
    expect(refreshedProfile.totalReferred).toBe(3);
    expect(refreshedProfile.metadata?.lastConversionAt).toBeTruthy();
  });
});
