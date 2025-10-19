import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  paymentFindAll: vi.fn(),
  orderFindAll: vi.fn(),
  escrowFindAll: vi.fn(),
  financeInvoiceFindAll: vi.fn(),
  financeTransactionHistoryCount: vi.fn(),
  walletAccountFindAll: vi.fn()
}));

const paymentFindAllMock = mocks.paymentFindAll;
const orderFindAllMock = mocks.orderFindAll;
const escrowFindAllMock = mocks.escrowFindAll;
const financeInvoiceFindAllMock = mocks.financeInvoiceFindAll;
const financeTransactionHistoryCountMock = mocks.financeTransactionHistoryCount;
const walletAccountFindAllMock = mocks.walletAccountFindAll;

vi.mock('../../config/index.js', () => ({
  default: {
    finance: {
      defaultCurrency: 'GBP',
      exchangeRates: {
        default: 1,
        GBP: 1,
        USD: 1.27
      }
    }
  }
}));

vi.mock('../../models/index.js', () => ({
  Payment: { findAll: (...args) => paymentFindAllMock(...args) },
  Order: { findAll: (...args) => orderFindAllMock(...args) },
  Escrow: { findAll: (...args) => escrowFindAllMock(...args) },
  FinanceInvoice: { findAll: (...args) => financeInvoiceFindAllMock(...args) },
  FinanceTransactionHistory: { count: (...args) => financeTransactionHistoryCountMock(...args) },
  WalletAccount: { findAll: (...args) => walletAccountFindAllMock(...args) },
  Service: {}
}));

import {
  getCommerceSnapshot,
  getPersonaCommerceDashboard,
  __private__
} from '../commerceEngineService.js';

const { resolveWindow, resolvePersonaScope, computeInvoiceStats } = __private__;

describe('commerceEngineService helper utilities', () => {
  it('parses timeframe windows with defaults', () => {
    const window = resolveWindow({ timeframe: '14d', timezone: 'Europe/London' });
    expect(window.label).toBe('Last 14 days');
    expect(window.timezone).toBe('Europe/London');
  });

  it('throws when persona context missing', () => {
    expect(() => resolvePersonaScope('user', {})).toThrow(/user_context_required/);
    expect(() => resolvePersonaScope('provider', {})).toThrow(/provider_context_required/);
  });

  it('computes invoice stats', () => {
    const stats = computeInvoiceStats(
      [
        { status: 'issued', currency: 'GBP', dueTotal: '500.00', paidTotal: '300.00', count: 1 },
        { status: 'overdue', currency: 'GBP', dueTotal: '200.00', paidTotal: '0.00', count: 2 },
        { status: 'paid', currency: 'GBP', dueTotal: '100.00', paidTotal: '100.00', count: 1 }
      ],
      'GBP'
    );
    expect(stats.outstanding.amount).toBeCloseTo(400);
    expect(stats.outstanding.count).toBe(3);
    expect(stats.overdue.amount).toBeCloseTo(200);
    expect(stats.overdue.count).toBe(2);
  });
});

describe('getCommerceSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    paymentFindAllMock.mockImplementation((options) => {
      if (options.attributes?.[0]?.[0] === 'Payment.order_id') {
        return [
          { orderId: 'order-1' },
          { orderId: 'order-2' }
        ];
      }

      return [
        { status: 'captured', currency: 'GBP', count: 4, amount: '1200.00' },
        { status: 'refunded', currency: 'USD', count: 1, amount: '100.00' },
        { status: 'authorised', currency: 'GBP', count: 2, amount: '250.00' }
      ];
    });

    orderFindAllMock.mockResolvedValue([
      { status: 'completed', currency: 'GBP', count: 5, amount: '1500.00' },
      { status: 'in_progress', currency: 'GBP', count: 2, amount: '400.00' }
    ]);

    escrowFindAllMock.mockImplementation((options) => {
      if (options.attributes?.includes('fundedAt')) {
        return [
          { fundedAt: new Date(Date.now() - 48 * 3_600_000), releasedAt: new Date(Date.now() - 12 * 3_600_000) },
          { fundedAt: new Date(Date.now() - 10 * 3_600_000), releasedAt: new Date(Date.now() - 4 * 3_600_000) }
        ];
      }
      return [
        { status: 'pending', currency: 'GBP', count: 2, amount: '300.00' },
        { status: 'funded', currency: 'GBP', count: 1, amount: '600.00' },
        { status: 'disputed', currency: 'GBP', count: 1, amount: '150.00' }
      ];
    });

    financeInvoiceFindAllMock.mockResolvedValue([
      { status: 'issued', currency: 'GBP', count: 2, dueTotal: '500.00', paidTotal: '100.00' },
      { status: 'overdue', currency: 'GBP', count: 1, dueTotal: '200.00', paidTotal: '0.00' }
    ]);

    financeTransactionHistoryCountMock.mockResolvedValue(3);

    walletAccountFindAllMock.mockResolvedValue([
      {
        id: 'wallet-1',
        displayName: 'Primary Wallet',
        currency: 'GBP',
        balance: '800.00',
        holdBalance: '120.00',
        status: 'active',
        autopayoutEnabled: true
      },
      {
        id: 'wallet-2',
        displayName: 'USD Wallet',
        currency: 'USD',
        balance: '400.00',
        holdBalance: '80.00',
        status: 'suspended',
        autopayoutEnabled: false
      }
    ]);
  });

  it('builds a provider snapshot with aggregated metrics and alerts', async () => {
    const snapshot = await getCommerceSnapshot('provider', { providerId: 'provider-1', timeframe: '30d' });
    expect(snapshot.persona).toBe('provider');
    expect(snapshot.currency).toBe('GBP');
    expect(snapshot.totals.grossMerchandiseVolume).toBeGreaterThan(0);
    expect(snapshot.totals.netRevenue).toBeGreaterThan(0);
    expect(snapshot.alerts).toHaveLength(3);
    expect(snapshot.escrowStats.pending.amount).toBeCloseTo(300);
    expect(snapshot.wallet.available).toBeGreaterThan(0);
    expect(snapshot.averageSettlementHours).toBeGreaterThan(0);
  });

  it('builds persona dashboards with structured sections', async () => {
    const { dashboard } = await getPersonaCommerceDashboard('provider', { providerId: 'provider-1' });
    expect(dashboard.header.persona).toBe('provider');
    expect(dashboard.sections).toHaveLength(5);
    expect(dashboard.alerts.length).toBeGreaterThan(0);
    expect(dashboard.readiness.autopayoutCoverage).toBe(1);
  });
});
