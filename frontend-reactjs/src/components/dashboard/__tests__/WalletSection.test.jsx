import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WalletSection from '../wallet/WalletSection.jsx';
import {
  createWalletAccount,
  createWalletTransaction,
  getWalletAccount,
  getWalletPaymentMethods,
  getWalletTransactions,
  updateWalletAccount
} from '../../../api/walletClient.js';

vi.mock('../../../api/walletClient.js', () => ({
  getWalletAccount: vi.fn(),
  updateWalletAccount: vi.fn(),
  createWalletAccount: vi.fn(),
  getWalletTransactions: vi.fn(),
  createWalletTransaction: vi.fn(),
  getWalletPaymentMethods: vi.fn(),
  createWalletPaymentMethod: vi.fn(),
  updateWalletPaymentMethod: vi.fn()
}));

describe('WalletSection', () => {
  const baseSection = {
    id: 'wallet',
    title: 'Wallet',
    data: {
      account: {
        id: 'acct-1',
        currency: 'GBP',
        balance: 1200,
        pending: 200,
        autopayoutEnabled: false,
        autopayoutMethodId: null,
        autopayoutThreshold: null,
        spendingLimit: null,
        alias: 'Facilities wallet'
      },
      summary: {
        balance: 1200,
        pending: 200,
        available: 1000,
        lifetimeCredits: 2200,
        lifetimeDebits: 1000,
        recentTransactions: []
      },
      methods: [
        {
          id: 'pm-1',
          label: 'HSBC UK',
          type: 'bank_account',
          status: 'active',
          maskedIdentifier: '••1234',
          details: { bankName: 'HSBC', accountHolder: 'Facilities Ops' }
        }
      ],
      policy: {
        canManage: true,
        canTransact: true,
        canEditMethods: true
      },
      autopayout: {
        enabled: false,
        threshold: null,
        method: null
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getWalletAccount.mockResolvedValue({
      account: baseSection.data.account,
      summary: baseSection.data.summary,
      methods: baseSection.data.methods,
      transactions: { items: [], total: 0, limit: 10, offset: 0 },
      autopayout: baseSection.data.autopayout
    });
    getWalletTransactions.mockResolvedValue({ items: [], total: 0, limit: 10, offset: 0 });
    getWalletPaymentMethods.mockResolvedValue(baseSection.data.methods);
    updateWalletAccount.mockResolvedValue({ ...baseSection.data.account, autopayoutEnabled: true });
    createWalletTransaction.mockResolvedValue({});
    createWalletAccount.mockResolvedValue({
      id: 'acct-new',
      currency: 'GBP',
      balance: 0,
      pending: 0,
      autopayoutEnabled: false
    });
  });

  it('submits wallet configuration updates with normalised payloads', async () => {
    const user = userEvent.setup();
    render(<WalletSection section={baseSection} />);

    await waitFor(() => expect(getWalletAccount).toHaveBeenCalledWith('acct-1', {
      include: 'summary,methods',
      transactionLimit: 10
    }));

    const aliasInput = await screen.findByLabelText('Wallet name');
    await user.clear(aliasInput);
    await user.type(aliasInput, 'Operations wallet');

    const autopayoutToggle = screen.getByLabelText('Enable autopayout automation');
    await user.click(autopayoutToggle);

    const methodSelect = screen.getByLabelText('Default payout destination');
    await user.selectOptions(methodSelect, 'pm-1');

    const thresholdInput = screen.getByLabelText('Autopayout threshold');
    await user.clear(thresholdInput);
    await user.type(thresholdInput, '250');

    const limitInput = screen.getByLabelText('Spending cap');
    await user.clear(limitInput);
    await user.type(limitInput, '1000');

    await user.click(screen.getByRole('button', { name: 'Save configuration' }));

    await waitFor(() =>
      expect(updateWalletAccount).toHaveBeenCalledWith('acct-1', {
        alias: 'Operations wallet',
        autopayoutEnabled: true,
        autopayoutMethodId: 'pm-1',
        autopayoutThreshold: 250,
        spendingLimit: 1000
      })
    );

    await waitFor(() => expect(screen.getByText('Wallet settings updated')).toBeInTheDocument());
  });

  it('records manual transactions and refreshes the ledger', async () => {
    const user = userEvent.setup();
    render(<WalletSection section={baseSection} />);

    await waitFor(() => expect(getWalletAccount).toHaveBeenCalled());

    const amountInput = await screen.findByLabelText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '150');

    const referenceInput = screen.getByLabelText('Reference');
    await user.type(referenceInput, 'INV-123');

    const descriptionInput = screen.getByPlaceholderText('e.g. Emergency deployment top-up');
    await user.type(descriptionInput, 'Manual adjustment');

    const noteInput = screen.getByPlaceholderText('Visible in booking history');
    await user.type(noteInput, 'Visible to customer');

    await user.click(screen.getByRole('button', { name: 'Record transaction' }));

    await waitFor(() =>
      expect(createWalletTransaction).toHaveBeenCalledWith('acct-1', {
        type: 'credit',
        amount: 150,
        description: 'Manual adjustment',
        referenceId: 'INV-123',
        metadata: {
          source: 'customer-control-centre',
          note: 'Visible to customer'
        }
      })
    );

    await waitFor(() => expect(getWalletTransactions).toHaveBeenCalledWith('acct-1', { limit: 10, offset: 0 }));
    await waitFor(() => expect(screen.getByText('Transaction recorded successfully')).toBeInTheDocument());
  });

  it('creates a wallet when none exists and hydrates the section', async () => {
    const user = userEvent.setup();
    const emptySection = {
      ...baseSection,
      data: {
        ...baseSection.data,
        account: null,
        summary: null,
        methods: [],
        autopayout: { enabled: false, threshold: null, method: null },
        policy: { canManage: true, canTransact: true, canEditMethods: true },
        user: { id: 'user-1' },
        company: { id: 'company-1' }
      }
    };

    render(<WalletSection section={emptySection} />);

    expect(screen.getByRole('button', { name: 'Create wallet' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create wallet' }));

    await waitFor(() =>
      expect(createWalletAccount).toHaveBeenCalledWith({
        userId: 'user-1',
        companyId: 'company-1',
        currency: 'GBP'
      })
    );

    await waitFor(() =>
      expect(getWalletAccount).toHaveBeenCalledWith('acct-new', {
        include: 'summary,methods',
        transactionLimit: 10
      })
    );
  });
});
