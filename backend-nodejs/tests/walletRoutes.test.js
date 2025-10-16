import crypto from 'node:crypto';
import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { withAuth } from './helpers/auth.js';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  WalletAccount,
  WalletTransaction,
  UserSession
} = await import('../src/models/index.js');

async function createSessionFor(user, { persona = null, metadata = {}, ...overrides } = {}) {
  const userId = typeof user === 'string' ? user : user.id;
  if (!userId) {
    throw new Error('createSessionFor requires a valid user');
  }

  return UserSession.create({
    userId,
    refreshTokenHash: crypto.randomBytes(48).toString('hex'),
    sessionFingerprint: crypto.randomBytes(16).toString('hex'),
    clientType: overrides.clientType ?? 'web',
    clientVersion: overrides.clientVersion ?? 'vitest',
    deviceLabel: overrides.deviceLabel ?? 'vitest',
    ipAddress: overrides.ipAddress ?? '127.0.0.1',
    userAgent: overrides.userAgent ?? 'vitest',
    metadata: { persona, ...metadata },
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: overrides.lastUsedAt ?? new Date()
  });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Admin wallet management API', () => {
  async function createAdminUser() {
    return User.create(
      {
        firstName: 'Alex',
        lastName: 'Morgan',
        email: 'admin@example.com',
        passwordHash: 'hashed',
        type: 'admin'
      },
      { validate: false }
    );
  }

  it('returns default overview payload and persists settings updates', async () => {
    const admin = await createAdminUser();
    const session = await createSessionFor(admin);

    const overviewResponse = await withAuth(
      request(app).get('/api/admin/wallets/overview'),
      admin.id,
      { payload: { sid: session.id, role: 'admin', persona: null } }
    ).expect(200);

    expect(overviewResponse.body.settings.walletEnabled).toBe(true);
    expect(Array.isArray(overviewResponse.body.accounts.results)).toBe(true);
    expect(overviewResponse.body.stats.totalAccounts).toBe(0);

    const settingsResponse = await withAuth(
      request(app)
        .put('/api/admin/wallets/settings')
        .send({
          walletEnabled: false,
          allowedOwnerTypes: ['provider', 'affiliate'],
          fundingRails: {
            stripeConnect: { enabled: true, accountId: 'acct_test' }
          },
          compliance: {
            termsUrl: 'https://example.com/wallet-terms',
            fallbackHoldDays: 5
          }
        }),
      admin.id,
      { payload: { sid: session.id, role: 'admin', persona: null } }
    ).expect(200);

    expect(settingsResponse.body.settings.walletEnabled).toBe(false);
    expect(settingsResponse.body.settings.allowedOwnerTypes).toEqual(['provider', 'affiliate']);
    expect(settingsResponse.body.settings.compliance.termsUrl).toContain('wallet-terms');
  });

  it('supports creating wallet accounts, posting transactions, and listing ledgers', async () => {
    const admin = await createAdminUser();
    const session = await createSessionFor(admin);

    const accountResponse = await withAuth(
      request(app)
        .post('/api/admin/wallets/accounts')
        .send({
          displayName: 'Metro Providers Wallet',
          ownerType: 'provider',
          ownerId: '11111111-1111-4111-8111-111111111111',
          currency: 'GBP'
        }),
      admin.id,
      { payload: { sid: session.id, role: 'admin', persona: null } }
    ).expect(201);

    expect(accountResponse.body.displayName).toBe('Metro Providers Wallet');
    expect(accountResponse.body.balance).toBe(0);

    const creditResponse = await withAuth(
      request(app)
        .post(`/api/admin/wallets/accounts/${accountResponse.body.id}/transactions`)
        .send({
          type: 'credit',
          amount: 2500,
          currency: 'GBP',
          referenceType: 'payout',
          description: 'Initial float'
        }),
      admin.id,
      { payload: { sid: session.id, role: 'admin', persona: null } }
    ).expect(201);

    expect(creditResponse.body.account.balance).toBeCloseTo(2500);
    expect(creditResponse.body.transaction.type).toBe('credit');

    const ledgerResponse = await withAuth(
      request(app).get(`/api/admin/wallets/accounts/${accountResponse.body.id}/transactions`),
      admin.id,
      { payload: { sid: session.id, role: 'admin', persona: null } }
    ).expect(200);

    expect(ledgerResponse.body.account.displayName).toBe('Metro Providers Wallet');
    expect(ledgerResponse.body.transactions).toHaveLength(2);
    expect(ledgerResponse.body.transactions[0].description).toMatch(/Initial float/);

    const accountsResponse = await withAuth(
      request(app).get('/api/admin/wallets/accounts'),
      admin.id,
      { payload: { sid: session.id, role: 'admin', persona: null } }
    ).expect(200);

    expect(accountsResponse.body.total).toBe(1);
    expect(accountsResponse.body.results[0].balance).toBeCloseTo(2500);

    const storedAccount = await WalletAccount.findByPk(accountResponse.body.id);
    const storedTransactions = await WalletTransaction.findAll({ where: { walletAccountId: storedAccount.id } });
    expect(storedTransactions).toHaveLength(2);
  });

  it('prevents unauthorised access to wallet management endpoints', async () => {
    await createAdminUser();

    await request(app).get('/api/admin/wallets/overview').expect(401);

    const outsider = await User.create(
      {
        firstName: 'Jamie',
        lastName: 'Cole',
        email: 'provider@example.com',
        passwordHash: 'hashed',
        type: 'company'
      },
      { validate: false }
    );
    const outsiderSession = await createSessionFor(outsider, { persona: 'provider' });

    const response = await withAuth(
      request(app)
        .post('/api/admin/wallets/accounts')
        .send({
          displayName: 'Unauthorized',
          ownerType: 'provider',
          ownerId: '99999999-9999-4999-8999-999999999999'
        }),
      outsider.id,
      { payload: { sid: outsiderSession.id, role: outsider.type, persona: 'provider' } }
    ).expect(403);

    expect(response.body).toMatchObject({ message: expect.stringMatching(/forbidden/i) });
  });
});
