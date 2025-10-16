import { Op, fn, col } from 'sequelize';
import { WalletConfiguration, WalletAccount, WalletTransaction, PayoutRequest } from '../../models/index.js';
import { buildComplianceNotices, ensureSettingsStructure, formatPayout, formatTransaction } from './helpers.js';
import { listWalletAccounts } from './accountService.js';

export async function getWalletOverview({ search, status, page = 1, pageSize = 10 } = {}) {
  const configuration = await WalletConfiguration.findOne({ order: [['updated_at', 'DESC']] });
  const settings = ensureSettingsStructure(configuration?.settings ?? {});

  const accounts = await listWalletAccounts({ search, status, page, pageSize, includeRecent: true });

  const totalsByCurrencyRaw = await WalletAccount.findAll({
    attributes: [
      'currency',
      [fn('SUM', col('balance')), 'balanceTotal'],
      [fn('SUM', col('hold_balance')), 'holdTotal'],
      [fn('COUNT', col('id')), 'accounts']
    ],
    group: ['currency']
  });

  const totalsByCurrency = totalsByCurrencyRaw.map((row) => ({
    currency: row.get('currency'),
    totalBalance: Number.parseFloat(row.get('balanceTotal')) || 0,
    totalHolds: Number.parseFloat(row.get('holdTotal')) || 0,
    accounts: Number.parseInt(row.get('accounts'), 10) || 0
  }));

  const [totalAccounts, suspendedAccounts, closedAccounts, lastTransactionAt] = await Promise.all([
    WalletAccount.count(),
    WalletAccount.count({ where: { status: 'suspended' } }),
    WalletAccount.count({ where: { status: 'closed' } }),
    WalletTransaction.max('occurred_at')
  ]);

  const payoutQueue = await PayoutRequest.findAll({
    where: { status: { [Op.in]: ['pending', 'approved', 'processing'] } },
    order: [['scheduled_for', 'ASC']],
    limit: 12
  });

  const recentTransactions = await WalletTransaction.findAll({
    order: [['occurred_at', 'DESC']],
    limit: 10,
    include: [
      {
        model: WalletAccount,
        as: 'walletAccount',
        attributes: ['id', 'displayName', 'ownerType']
      }
    ]
  });

  return {
    settings,
    stats: {
      totalAccounts,
      suspendedAccounts,
      closedAccounts,
      totalsByCurrency,
      lastTransactionAt: lastTransactionAt ? new Date(lastTransactionAt).toISOString() : null
    },
    accounts,
    payoutQueue: payoutQueue.map(formatPayout),
    compliance: {
      notices: buildComplianceNotices(settings)
    },
    recentTransactions: recentTransactions.map((transaction) => formatTransaction(transaction))
  };
}

export default {
  getWalletOverview
};
