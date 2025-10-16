import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getWalletAccount,
  updateWalletAccount,
  createWalletAccount,
  getWalletTransactions,
  createWalletTransaction,
  getWalletPaymentMethods,
  createWalletPaymentMethod,
  updateWalletPaymentMethod,
  deleteWalletPaymentMethod,
  exportWalletTransactions
} from '../../../api/walletClient.js';
import { Spinner } from '../../ui/index.js';
import WalletEmptyState from './WalletEmptyState.jsx';
import WalletSummaryCards from './WalletSummaryCards.jsx';
import WalletConfigurationForm from './WalletConfigurationForm.jsx';
import WalletManualAdjustmentForm from './WalletManualAdjustmentForm.jsx';
import WalletPaymentMethods from './WalletPaymentMethods.jsx';
import WalletTransactionsPanel from './WalletTransactionsPanel.jsx';
import { defaultMethodForm, defaultTransactionForm } from './walletDefaults.js';
import { WalletLedgerDrawer } from '../../../modules/walletManagement/index.js';

const WalletSection = ({ section }) => {
  const initialAccount = section.data?.account ?? null;
  const initialSummary = section.data?.summary ?? null;
  const initialMethods = section.data?.methods ?? [];
  const initialTransactions = section.data?.summary?.recentTransactions ?? [];

  const [account, setAccount] = useState(initialAccount);
  const [summary, setSummary] = useState(initialSummary);
  const [methods, setMethods] = useState(initialMethods);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [transactionsMeta, setTransactionsMeta] = useState({
    total: section.data?.transactions?.total ?? initialTransactions.length ?? 0,
    limit: 10,
    offset: 0
  });
  const [transactionQuery, setTransactionQuery] = useState({ type: 'all' });

  const [settingsForm, setSettingsForm] = useState({
    alias: initialAccount?.alias ?? '',
    autopayoutEnabled: initialAccount?.autopayoutEnabled ?? section.data?.autopayout?.enabled ?? false,
    autopayoutMethodId: initialAccount?.autopayoutMethodId || section.data?.autopayout?.method?.id || '',
    autopayoutThreshold:
      initialAccount?.autopayoutThreshold != null
        ? String(initialAccount.autopayoutThreshold)
        : section.data?.autopayout?.threshold != null
        ? String(section.data.autopayout.threshold)
        : '',
    spendingLimit:
      initialAccount?.spendingLimit != null
        ? String(initialAccount.spendingLimit)
        : section.data?.account?.spendingLimit != null
        ? String(section.data.account.spendingLimit)
        : ''
  });
  const [transactionForm, setTransactionForm] = useState(() => ({ ...defaultTransactionForm }));
  const [methodForm, setMethodForm] = useState(() => ({ ...defaultMethodForm }));

  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [transactionMessage, setTransactionMessage] = useState(null);
  const [methodMessage, setMethodMessage] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [transactionSaving, setTransactionSaving] = useState(false);
  const [methodSaving, setMethodSaving] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [methodMode, setMethodMode] = useState('create');
  const [editingMethod, setEditingMethod] = useState(null);
  const [ledgerState, setLedgerState] = useState({
    open: false,
    loading: false,
    account: null,
    transactions: [],
    error: null
  });
  const [exportState, setExportState] = useState({ downloading: false, error: null });

  const accountId = useMemo(() => account?.id ?? section.data?.accountId ?? null, [account, section.data?.accountId]);
  const currency = section.data?.currency || account?.currency || 'GBP';
  const canManage = section.data?.policy?.canManage !== false;
  const canTransact = section.data?.policy?.canTransact !== false;
  const canEditMethods = section.data?.policy?.canEditMethods !== false;

  const refreshAccount = useCallback(
    async (id = accountId) => {
      if (!id) return;
      setLoading(true);
      try {
        const payload = await getWalletAccount(id, { include: 'summary,methods', transactionLimit: 10 });
        setAccount(payload.account);
        setSummary(payload.summary ?? null);
        setMethods(payload.methods ?? []);
        if (payload.transactions) {
          setTransactions(payload.transactions.items ?? []);
          setTransactionsMeta({
            total: payload.transactions.total ?? 0,
            limit: payload.transactions.limit ?? 10,
            offset: payload.transactions.offset ?? 0
          });
        }
        setSettingsForm({
          alias: payload.account?.alias ?? '',
          autopayoutEnabled: payload.account?.autopayoutEnabled ?? false,
          autopayoutMethodId: payload.account?.autopayoutMethodId || payload.autopayout?.method?.id || '',
          autopayoutThreshold:
            payload.account?.autopayoutThreshold != null
              ? String(payload.account.autopayoutThreshold)
              : payload.autopayout?.threshold != null
              ? String(payload.autopayout.threshold)
              : '',
          spendingLimit:
            payload.account?.spendingLimit != null ? String(payload.account.spendingLimit) : ''
        });
      } catch (error) {
        setCreateError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [accountId]
  );

  const refreshTransactions = useCallback(
    async (params = {}) => {
      if (!accountId) return;
      setTransactionsLoading(true);
      try {
        const query = {
          ...params,
          limit: params.limit ?? transactionsMeta.limit,
          offset: params.offset ?? 0
        };
        if (query.type === 'all') {
          delete query.type;
        }
        const result = await getWalletTransactions(accountId, query);
        setTransactions(result.items ?? []);
        setTransactionsMeta({
          total: result.total ?? 0,
          limit: result.limit ?? query.limit ?? 10,
          offset: result.offset ?? query.offset ?? 0
        });
      } catch (error) {
        setTransactionMessage(error.message);
      } finally {
        setTransactionsLoading(false);
      }
    },
    [accountId, transactionsMeta.limit]
  );

  const refreshMethods = useCallback(async () => {
    if (!accountId) return;
    setMethodsLoading(true);
    try {
      const list = await getWalletPaymentMethods(accountId);
      setMethods(list);
    } catch (error) {
      setMethodMessage(error.message);
    } finally {
      setMethodsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      refreshAccount(accountId);
    }
  }, [accountId, refreshAccount]);

  useEffect(() => {
    if (!methodMessage) return undefined;
    const timer = setTimeout(() => setMethodMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [methodMessage]);

  useEffect(() => {
    if (!exportState.error) return undefined;
    const timer = setTimeout(() => setExportState((current) => ({ ...current, error: null })), 4000);
    return () => clearTimeout(timer);
  }, [exportState.error]);

  const handleCreateAccount = useCallback(async () => {
    if (!canManage) return;
    setCreateError(null);
    setLoading(true);
    try {
      const created = await createWalletAccount({
        userId: section.data?.user?.id ?? null,
        companyId: section.data?.company?.id ?? null,
        currency
      });
      setAccount(created);
      await refreshAccount(created.id);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setLoading(false);
    }
  }, [canManage, currency, refreshAccount, section.data?.company?.id, section.data?.user?.id]);

  const availableBalance = useMemo(() => {
    if (summary?.available != null) {
      return summary.available;
    }
    if (account) {
      return Number(account.balance || 0) - Number(account.pending || 0);
    }
    return 0;
  }, [summary, account]);

  const autopayoutMethodOptions = useMemo(() => {
    const base = methods.map((method) => ({ value: method.id, label: method.label }));
    return [{ value: '', label: 'Select payout method' }, ...base];
  }, [methods]);

  const renderCurrency = useCallback(
    (value, iso = currency) => {
      const numeric = Number.parseFloat(value ?? 0);
      const amount = Number.isFinite(numeric) ? numeric : 0;
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: iso || currency }).format(amount);
      } catch (error) {
        console.warn('Unable to format currency', error);
        return `${iso || currency} ${amount.toFixed(2)}`;
      }
    },
    [currency]
  );

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    if (!accountId || !canManage) return;
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const payload = {
        alias: settingsForm.alias || null,
        autopayoutEnabled: Boolean(settingsForm.autopayoutEnabled),
        autopayoutMethodId: settingsForm.autopayoutMethodId || null,
        autopayoutThreshold:
          settingsForm.autopayoutThreshold !== '' ? Number(settingsForm.autopayoutThreshold) : null,
        spendingLimit: settingsForm.spendingLimit !== '' ? Number(settingsForm.spendingLimit) : null
      };
      await updateWalletAccount(accountId, payload);
      await refreshAccount(accountId);
      setSettingsMessage('Wallet settings updated');
    } catch (error) {
      setSettingsMessage(error.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();
    if (!accountId || !canTransact) return;
    setTransactionSaving(true);
    setTransactionMessage(null);
    try {
      await createWalletTransaction(accountId, {
        type: transactionForm.type,
        amount: Number(transactionForm.amount),
        description: transactionForm.description || null,
        referenceId: transactionForm.referenceId || null,
        metadata: {
          source: 'customer-control-centre',
          ...(transactionForm.note ? { note: transactionForm.note } : {})
        }
      });
      setTransactionForm(() => ({ ...defaultTransactionForm }));
      await refreshAccount(accountId);
      await refreshTransactions({ type: transactionQuery.type });
      setTransactionMessage('Transaction recorded successfully');
    } catch (error) {
      setTransactionMessage(error.message);
    } finally {
      setTransactionSaving(false);
    }
  };

  const handleMethodSubmit = async (event) => {
    event.preventDefault();
    if (!accountId || !canEditMethods) return;
    setMethodSaving(true);
    setMethodMessage(null);
    try {
      const payload = {
        label: methodForm.label,
        type: methodForm.type,
        supportingDocumentUrl: methodForm.supportingDocumentUrl || undefined,
        isDefaultPayout: Boolean(methodForm.isDefaultPayout),
        details: {
          accountHolder: methodForm.accountHolder || undefined,
          accountNumber: methodForm.accountNumber || undefined,
          sortCode: methodForm.sortCode || undefined,
          bankName: methodForm.bankName || undefined,
          notes: methodForm.notes || undefined,
          brand: methodForm.brand || undefined,
          expiryMonth: methodForm.expiryMonth || undefined,
          expiryYear: methodForm.expiryYear || undefined,
          provider: methodForm.provider || undefined,
          handle: methodForm.handle || undefined
        }
      };

      if (methodMode === 'edit' && editingMethod) {
        await updateWalletPaymentMethod(accountId, editingMethod.id, payload);
        setMethodMessage('Payment method updated');
      } else {
        await createWalletPaymentMethod(accountId, payload);
        setMethodMessage('Payment method saved');
      }

      setMethodForm(() => ({ ...defaultMethodForm }));
      setMethodMode('create');
      setEditingMethod(null);
      await refreshAccount(accountId);
      await refreshMethods();
    } catch (error) {
      setMethodMessage(error.message);
    } finally {
      setMethodSaving(false);
    }
  };

  const handleEditMethod = (method) => {
    setMethodMode('edit');
    setEditingMethod(method);
    setMethodMessage(null);
    setMethodForm({
      label: method.label ?? '',
      type: method.type ?? 'bank_account',
      accountHolder: method.details?.accountHolder ?? '',
      accountNumber: '',
      sortCode: method.details?.sortCode ?? '',
      bankName: method.details?.bankName ?? '',
      notes: method.details?.notes ?? '',
      supportingDocumentUrl: method.supportingDocumentUrl ?? '',
      brand: method.details?.brand ?? '',
      expiryMonth: method.details?.expiryMonth ?? '',
      expiryYear: method.details?.expiryYear ?? '',
      handle: method.details?.handle ?? '',
      provider: method.details?.provider ?? '',
      isDefaultPayout: Boolean(method.isDefaultPayout)
    });
  };

  const handleCancelMethodEdit = () => {
    setMethodMode('create');
    setEditingMethod(null);
    setMethodForm(() => ({ ...defaultMethodForm }));
  };

  const handleSetDefaultMethod = async (method) => {
    if (!accountId || !canEditMethods) return;
    try {
      await updateWalletPaymentMethod(accountId, method.id, { isDefaultPayout: true });
      await refreshAccount(accountId);
      await refreshMethods();
    } catch (error) {
      setMethodMessage(error.message);
    }
  };

  const handleToggleMethodStatus = async (method) => {
    if (!accountId || !canEditMethods) return;
    try {
      const nextStatus = method.status === 'active' ? 'inactive' : 'active';
      await updateWalletPaymentMethod(accountId, method.id, { status: nextStatus });
      await refreshMethods();
      await refreshAccount(accountId);
    } catch (error) {
      setMethodMessage(error.message);
    }
  };

  const handleDeleteMethod = async (method) => {
    if (!accountId || !canEditMethods) return;
    setMethodSaving(true);
    setMethodMessage(null);
    try {
      await deleteWalletPaymentMethod(accountId, method.id);
      if (editingMethod?.id === method.id) {
        handleCancelMethodEdit();
      }
      await refreshAccount(accountId);
      await refreshMethods();
      setMethodMessage('Payment method removed');
    } catch (error) {
      setMethodMessage(error.message);
    } finally {
      setMethodSaving(false);
    }
  };

  const handleTransactionTypeChange = (value) => {
    setTransactionForm((current) => ({ ...current, type: value }));
  };

  const handleTransactionFilterChange = async (value) => {
    setTransactionQuery({ type: value });
    await refreshTransactions({ type: value });
  };

  const handleSettingsChange = (field, value) => {
    setSettingsForm((current) => ({ ...current, [field]: value }));
  };

  const handleTransactionFieldChange = (field, value) => {
    setTransactionForm((current) => ({ ...current, [field]: value }));
  };

  const handleMethodFieldChange = (field, value) => {
    setMethodForm((current) => ({ ...current, [field]: value }));
  };

  const handleOpenLedger = useCallback(async () => {
    if (!accountId) return;
    setLedgerState({ open: true, loading: true, account: account ? { ...account } : null, transactions: [], error: null });
    try {
      const result = await getWalletTransactions(accountId, {
        limit: 100,
        ...(transactionQuery.type !== 'all' ? { type: transactionQuery.type } : {})
      });
      setLedgerState({
        open: true,
        loading: false,
        account: account ? { ...account } : null,
        transactions: result.items ?? [],
        error: null
      });
    } catch (error) {
      setLedgerState({
        open: true,
        loading: false,
        account: account ? { ...account } : null,
        transactions: [],
        error: error.message
      });
    }
  }, [accountId, account, transactionQuery.type]);

  const handleCloseLedger = useCallback(() => {
    setLedgerState((current) => ({ ...current, open: false }));
  }, []);

  const handleExportTransactions = useCallback(async () => {
    if (typeof window === 'undefined' || !accountId) return;
    setExportState({ downloading: true, error: null });
    try {
      const { blob, filename } = await exportWalletTransactions(accountId, {
        ...(transactionQuery.type !== 'all' ? { type: transactionQuery.type } : {})
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportState({ downloading: false, error: null });
    } catch (error) {
      setExportState({ downloading: false, error: error.message });
    }
  }, [accountId, transactionQuery.type]);

  if (!accountId && !account) {
    return (
      <section id={section.id} className="space-y-6">
        <WalletEmptyState
          onCreate={handleCreateAccount}
          loading={loading}
          error={createError}
          canManage={canManage}
        />
      </section>
    );
  }

  const effectiveSummary = summary || {
    balance: Number(account?.balance || 0),
    pending: Number(account?.pending || 0),
    available: availableBalance,
    recentTransactions: transactions
  };

  const autopayoutStatus = account?.autopayoutEnabled
    ? methods.find((method) => method.id === account.autopayoutMethodId)?.label || 'Enabled'
    : 'Disabled';

  return (
    <section id={section.id} className="space-y-10">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold text-primary">Wallet &amp; Payments</h2>
        <p className="text-sm text-slate-600">
          Manage wallet funding, payout rules, and payment destinations. All changes apply instantly to ongoing bookings and
          escrow releases.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-5 w-5 text-primary" />
        </div>
      ) : (
        <div className="space-y-10">
          <WalletSummaryCards
            summary={effectiveSummary}
            availableBalance={availableBalance}
            currency={currency}
            autopayoutEnabled={Boolean(account?.autopayoutEnabled)}
            autopayoutStatus={autopayoutStatus}
          />

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <WalletConfigurationForm
              currency={currency}
              form={settingsForm}
              onChange={handleSettingsChange}
              onSubmit={handleSettingsSubmit}
              saving={settingsSaving}
              message={settingsMessage}
              canManage={canManage}
              autopayoutOptions={autopayoutMethodOptions}
            />
            <WalletManualAdjustmentForm
              currency={currency}
              form={transactionForm}
              onFieldChange={handleTransactionFieldChange}
              onSubmit={handleTransactionSubmit}
              saving={transactionSaving}
              message={transactionMessage}
              canTransact={canTransact}
              onTypeChange={handleTransactionTypeChange}
            />
          </div>

          <WalletPaymentMethods
            form={methodForm}
            mode={methodMode}
            editingMethodId={editingMethod?.id || null}
            onFieldChange={handleMethodFieldChange}
            onSubmit={handleMethodSubmit}
            onCancelEdit={handleCancelMethodEdit}
            onEdit={handleEditMethod}
            onDelete={handleDeleteMethod}
            saving={methodSaving}
            message={methodMessage}
            canEditMethods={canEditMethods}
            methods={methods}
            methodsLoading={methodsLoading}
            onRefresh={refreshMethods}
            onSetDefault={handleSetDefaultMethod}
            onToggleStatus={handleToggleMethodStatus}
            autopayoutMethodId={account?.autopayoutMethodId || null}
          />

          <WalletTransactionsPanel
            transactions={transactions}
            currency={currency}
            loading={transactionsLoading}
            meta={transactionsMeta}
            filter={transactionQuery.type}
            onFilterChange={handleTransactionFilterChange}
            onPaginate={(offset) =>
              refreshTransactions({
                type: transactionQuery.type,
                offset
              })
            }
            onOpenLedger={handleOpenLedger}
            onExport={handleExportTransactions}
            exporting={exportState.downloading}
            exportError={exportState.error}
          />
        </div>
      )}
      <WalletLedgerDrawer ledger={ledgerState} onClose={handleCloseLedger} formatCurrency={renderCurrency} />
    </section>
  );
};

WalletSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    data: PropTypes.shape({
      account: PropTypes.object,
      accountId: PropTypes.string,
      summary: PropTypes.object,
      methods: PropTypes.array,
      autopayout: PropTypes.object,
      policy: PropTypes.shape({
        canManage: PropTypes.bool,
        canTransact: PropTypes.bool,
        canEditMethods: PropTypes.bool
      }),
      transactions: PropTypes.shape({
        total: PropTypes.number,
        limit: PropTypes.number,
        offset: PropTypes.number,
        items: PropTypes.arrayOf(PropTypes.object)
      }),
      currency: PropTypes.string,
      user: PropTypes.object,
      company: PropTypes.object
    })
  }).isRequired
};

export default WalletSection;
