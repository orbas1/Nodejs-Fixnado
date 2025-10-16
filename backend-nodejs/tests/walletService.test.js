import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { sequelize, User, WalletAccount } from '../src/models/index.js';
import {
  createWalletAccount,
  createWalletPaymentMethod,
  createWalletTransaction,
  getWalletAccountDetails,
  listWalletPaymentMethods,
  listWalletTransactions,
  updateWalletAccount,
  updateWalletPaymentMethod
} from '../src/services/walletService.js';

async function createTestUser(attrs = {}) {
  return User.create(
    {
      firstName: 'Test',
      lastName: 'User',
      email: `wallet-user-${Math.random().toString(16).slice(2)}@example.com`,
      passwordHash: 'hashed',
      type: 'user',
      ...attrs
    },
    { validate: false }
  );
}

describe('walletService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  it('creates wallet accounts and summarises balances with transaction history', async () => {
    const user = await createTestUser();

    const account = await createWalletAccount({
      userId: user.id,
      currency: 'GBP',
      alias: 'Facilities wallet'
    });

    expect(account).toMatchObject({
      userId: user.id,
      currency: 'GBP',
      balance: 0,
      pending: 0,
      alias: 'Facilities wallet'
    });

    await createWalletTransaction(account.id, {
      type: 'credit',
      amount: 300,
      description: 'Initial funding',
      referenceId: 'INIT-001'
    });
    await createWalletTransaction(account.id, {
      type: 'hold',
      amount: 50,
      description: 'Inspection hold',
      referenceId: 'HOLD-001'
    });
    await createWalletTransaction(account.id, {
      type: 'release',
      amount: 20,
      description: 'Partial release',
      referenceId: 'REL-001'
    });
    await createWalletTransaction(account.id, {
      type: 'debit',
      amount: 100,
      description: 'Refund processed',
      referenceId: 'DBT-001'
    });

    const details = await getWalletAccountDetails(account.id, {
      include: ['summary', 'transactions', 'methods'],
      transactionLimit: 10
    });

    expect(details.account.balance).toBe(200);
    expect(details.account.pending).toBe(30);
    expect(details.summary).toMatchObject({
      balance: 200,
      pending: 30,
      available: 170,
      lifetimeCredits: 300,
      lifetimeDebits: 120
    });
    expect(details.transactions.items).toHaveLength(4);
    expect(details.transactions.items[0].referenceId).toBe('DBT-001');
  });

  it('manages payout methods and autopayout state consistently', async () => {
    const user = await createTestUser();
    const account = await createWalletAccount({ userId: user.id, currency: 'GBP' });

    const primaryMethod = await createWalletPaymentMethod(account.id, {
      label: 'Primary bank',
      type: 'bank_account',
      details: {
        accountHolder: 'Facilities Ops',
        accountNumber: '12345678',
        sortCode: '00-00-00',
        bankName: 'HSBC'
      },
      isDefaultPayout: true
    });

    expect(primaryMethod.isDefaultPayout).toBe(true);

    const updatedAccount = await updateWalletAccount(account.id, { autopayoutEnabled: true });
    expect(updatedAccount.autopayoutEnabled).toBe(true);
    expect(updatedAccount.autopayoutMethodId).toBe(primaryMethod.id);

    const secondaryMethod = await createWalletPaymentMethod(account.id, {
      label: 'Emergency wallet',
      type: 'external_wallet',
      details: {
        provider: 'Wise',
        handle: 'ops@wise'
      },
      isDefaultPayout: false
    });

    const promotedMethod = await updateWalletPaymentMethod(account.id, secondaryMethod.id, {
      isDefaultPayout: true
    });

    expect(promotedMethod.isDefaultPayout).toBe(true);

    const methods = await listWalletPaymentMethods(account.id);
    const refreshedAccount = await WalletAccount.findByPk(account.id);

    expect(methods.find((method) => method.id === primaryMethod.id)?.isDefaultPayout).toBe(false);
    expect(refreshedAccount.autopayoutMethodId).toBe(secondaryMethod.id);
  });

  it('prevents spending limit breaches and insufficient debits', async () => {
    const user = await createTestUser();
    const account = await createWalletAccount({
      userId: user.id,
      currency: 'GBP',
      spendingLimit: 400
    });

    await expect(
      createWalletTransaction(account.id, {
        type: 'credit',
        amount: 450,
        description: 'Attempt over limit'
      })
    ).rejects.toMatchObject({ message: 'Wallet spending limit exceeded', statusCode: 409 });

    await createWalletTransaction(account.id, {
      type: 'credit',
      amount: 300,
      description: 'Approved top-up'
    });

    await expect(
      createWalletTransaction(account.id, {
        type: 'debit',
        amount: 350,
        description: 'Overdraft attempt'
      })
    ).rejects.toMatchObject({ message: 'Insufficient wallet balance for debit', statusCode: 409 });

    await createWalletTransaction(account.id, {
      type: 'debit',
      amount: 150,
      description: 'Approved debit'
    });

    const ledger = await listWalletTransactions(account.id, { limit: 10 });

    expect(ledger.total).toBe(2);
    expect(ledger.items.map((entry) => entry.type).sort()).toEqual(['credit', 'debit']);
  });
});
