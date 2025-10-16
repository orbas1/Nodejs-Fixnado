import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchWalletOverview,
  fetchWalletAccounts,
  fetchWalletTransactions,
  saveWalletSettings,
  createWalletAccount,
  updateWalletAccount,
  recordWalletTransaction
} from '../../api/walletAdminClient.js';
import {
  OWNER_OPTIONS,
  STATUS_FILTERS,
  TRANSACTION_TYPES,
  DEFAULT_ACCOUNT_FORM,
  DEFAULT_TRANSACTION_FORM,
  PAGE_SIZE,
  ACCOUNT_STATUS_OPTIONS
} from './constants.js';
import {
  formatCurrency,
  normaliseSettingsForForm,
  preparePayloadFromForm,
  summariseTotals
} from './utils.js';

export function useWalletManagement() {
  const [loading, setLoading] = useState(true);
  const [initialised, setInitialised] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [settingsForm, setSettingsForm] = useState(normaliseSettingsForForm());
  const [baselineSettings, setBaselineSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState(null);
  const [accountsState, setAccountsState] = useState({ results: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [payoutQueue, setPayoutQueue] = useState([]);
  const [complianceNotices, setComplianceNotices] = useState([]);

  const [accountDrawer, setAccountDrawer] = useState({
    open: false,
    mode: 'create',
    form: DEFAULT_ACCOUNT_FORM,
    accountId: null,
    saving: false,
    error: null
  });

  const [transactionDrawer, setTransactionDrawer] = useState({
    open: false,
    account: null,
    form: DEFAULT_TRANSACTION_FORM,
    saving: false,
    error: null
  });

  const [ledgerState, setLedgerState] = useState({
    open: false,
    loading: false,
    account: null,
    transactions: [],
    error: null
  });

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchWalletOverview();
      const normalisedSettings = normaliseSettingsForForm(payload.settings ?? {});
      setSettingsForm(normalisedSettings);
      setBaselineSettings(normalisedSettings);
      setStats(payload.stats ?? null);
      setAccountsState(payload.accounts ?? { results: [], total: 0, page: 1, pageSize: PAGE_SIZE });
      setRecentTransactions(payload.recentTransactions ?? []);
      setPayoutQueue(payload.payoutQueue ?? []);
      setComplianceNotices(payload.compliance?.notices ?? []);
      setInitialised(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('Unable to load wallet overview'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(
    async ({ signal, page = 1 } = {}) => {
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const payload = await fetchWalletAccounts(
          {
            search: search.trim() || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            page,
            pageSize: PAGE_SIZE
          },
          { signal }
        );
        setAccountsState(payload);
      } catch (caught) {
        if (signal?.aborted) return;
        setAccountsError(caught instanceof Error ? caught : new Error('Unable to load wallet accounts'));
      } finally {
        setAccountsLoading(false);
      }
    },
    [search, statusFilter]
  );

  const loadLedger = useCallback(async (accountId) => {
    setLedgerState((current) => ({ ...current, loading: true, error: null }));
    try {
      const payload = await fetchWalletTransactions(accountId, { limit: 25 });
      setLedgerState({ open: true, loading: false, error: null, account: payload.account, transactions: payload.transactions });
    } catch (caught) {
      setLedgerState((current) => ({
        ...current,
        loading: false,
        error: caught instanceof Error ? caught.message : 'Unable to load ledger'
      }));
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!initialised) return undefined;
    const controller = new AbortController();
    const handle = setTimeout(() => {
      loadAccounts({ signal: controller.signal, page: 1 });
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [initialised, search, statusFilter, loadAccounts]);

  useEffect(() => {
    if (!settingsStatus) return undefined;
    const timer = setTimeout(() => setSettingsStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [settingsStatus]);

  const settingsDirty = useMemo(() => {
    if (!baselineSettings) return false;
    const payload = preparePayloadFromForm(settingsForm);
    const baselinePayload = preparePayloadFromForm(baselineSettings);
    return JSON.stringify(payload) !== JSON.stringify(baselinePayload);
  }, [settingsForm, baselineSettings]);

  const totalsSummary = useMemo(() => summariseTotals(stats?.totalsByCurrency ?? []), [stats]);

  const headerMeta = useMemo(
    () => [
      {
        label: 'Wallet accounts',
        value: stats ? `${stats.totalAccounts}` : loading ? 'Loading…' : '0',
        caption: stats
          ? `${stats.suspendedAccounts} suspended • ${stats.closedAccounts} closed`
          : 'All wallets are currently offline'
      },
      {
        label: 'Aggregate balance',
        value: totalsSummary,
        caption: 'Tracked across active wallet currencies'
      },
      {
        label: 'Last ledger activity',
        value: stats?.lastTransactionAt ? new Date(stats.lastTransactionAt).toLocaleString() : 'No ledger activity yet',
        caption: stats?.lastTransactionAt ? undefined : 'Transactions will appear after the first credit.'
      }
    ],
    [stats, totalsSummary, loading]
  );

  const handleAllowedOwnerToggle = useCallback((owner) => {
    setSettingsForm((current) => {
      const next = new Set(current.allowedOwnerTypes);
      if (next.has(owner)) {
        next.delete(owner);
      } else {
        next.add(owner);
      }
      return { ...current, allowedOwnerTypes: Array.from(next) };
    });
  }, []);

  const handleSettingsSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSettingsSaving(true);
      try {
        const payload = preparePayloadFromForm(settingsForm);
        const response = await saveWalletSettings(payload);
        const normalised = normaliseSettingsForForm(response.settings ?? {});
        setSettingsForm(normalised);
        setBaselineSettings(normalised);
        setSettingsStatus('Settings updated');
      } catch (caught) {
        setSettingsStatus(caught instanceof Error ? caught.message : 'Unable to save settings');
      } finally {
        setSettingsSaving(false);
      }
    },
    [settingsForm]
  );

  const openCreateAccount = useCallback(() => {
    setAccountDrawer({ open: true, mode: 'create', form: { ...DEFAULT_ACCOUNT_FORM }, accountId: null, saving: false, error: null });
  }, []);

  const openEditAccount = useCallback((account) => {
    setAccountDrawer({
      open: true,
      mode: 'edit',
      form: {
        displayName: account.displayName,
        ownerType: account.ownerType,
        ownerId: account.ownerId,
        currency: account.currency,
        status: account.status,
        metadataNote: account.metadata?.note || ''
      },
      accountId: account.id,
      saving: false,
      error: null
    });
  }, []);

  const closeAccountDrawer = useCallback(() => {
    setAccountDrawer((current) => ({ ...current, open: false }));
  }, []);

  const updateAccountDrawerForm = useCallback((updater) => {
    setAccountDrawer((current) => ({
      ...current,
      form: typeof updater === 'function' ? updater(current.form) : { ...current.form, ...updater }
    }));
  }, []);

  const handleAccountSave = useCallback(
    async (event) => {
      event.preventDefault();
      setAccountDrawer((current) => ({ ...current, saving: true, error: null }));
      try {
        if (accountDrawer.mode === 'create') {
          await createWalletAccount({
            displayName: accountDrawer.form.displayName,
            ownerType: accountDrawer.form.ownerType,
            ownerId: accountDrawer.form.ownerId,
            currency: accountDrawer.form.currency,
            status: accountDrawer.form.status,
            metadata: accountDrawer.form.metadataNote ? { note: accountDrawer.form.metadataNote } : undefined
          });
        } else {
          await updateWalletAccount(accountDrawer.accountId, {
            displayName: accountDrawer.form.displayName,
            status: accountDrawer.form.status,
            metadata: accountDrawer.form.metadataNote ? { note: accountDrawer.form.metadataNote } : undefined
          });
        }
        closeAccountDrawer();
        await loadOverview();
      } catch (caught) {
        setAccountDrawer((current) => ({
          ...current,
          saving: false,
          error: caught instanceof Error ? caught.message : 'Unable to save wallet account'
        }));
      }
    },
    [accountDrawer, closeAccountDrawer, loadOverview]
  );

  const openTransactionDrawer = useCallback((account) => {
    setTransactionDrawer({
      open: true,
      account,
      form: { ...DEFAULT_TRANSACTION_FORM, currency: account.currency },
      saving: false,
      error: null
    });
  }, []);

  const closeTransactionDrawer = useCallback(() => {
    setTransactionDrawer((current) => ({ ...current, open: false }));
  }, []);

  const updateTransactionForm = useCallback((updater) => {
    setTransactionDrawer((current) => ({
      ...current,
      form: typeof updater === 'function' ? updater(current.form) : { ...current.form, ...updater }
    }));
  }, []);

  const handleTransactionSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!transactionDrawer.account) return;
      setTransactionDrawer((current) => ({ ...current, saving: true, error: null }));
      try {
        await recordWalletTransaction(transactionDrawer.account.id, {
          type: transactionDrawer.form.type,
          amount: Number(transactionDrawer.form.amount || 0),
          currency: transactionDrawer.form.currency,
          description: transactionDrawer.form.description,
          referenceType: transactionDrawer.form.referenceType || undefined,
          referenceId: transactionDrawer.form.referenceId || undefined
        });
        closeTransactionDrawer();
        await loadOverview();
        if (ledgerState.open && ledgerState.account?.id === transactionDrawer.account.id) {
          loadLedger(transactionDrawer.account.id);
        }
      } catch (caught) {
        setTransactionDrawer((current) => ({
          ...current,
          saving: false,
          error: caught instanceof Error ? caught.message : 'Unable to record transaction'
        }));
      }
    },
    [transactionDrawer, closeTransactionDrawer, loadOverview, ledgerState.open, ledgerState.account, loadLedger]
  );

  const openLedger = useCallback((account) => {
    setLedgerState({ open: true, loading: true, account, transactions: [], error: null });
    loadLedger(account.id);
  }, [loadLedger]);

  const closeLedger = useCallback(() => {
    setLedgerState((current) => ({ ...current, open: false }));
  }, []);

  const totalPages = useMemo(
    () => (accountsState.pageSize ? Math.max(1, Math.ceil((accountsState.total ?? 0) / accountsState.pageSize)) : 1),
    [accountsState.pageSize, accountsState.total]
  );

  const handleAccountsPageChange = useCallback(
    (page) => {
      if (page < 1) return;
      loadAccounts({ page });
    },
    [loadAccounts]
  );

  return {
    loading,
    initialised,
    error,
    stats,
    settingsForm,
    setSettingsForm,
    baselineSettings,
    settingsSaving,
    settingsStatus,
    settingsDirty,
    handleAllowedOwnerToggle,
    handleSettingsSubmit,
    accountsState,
    accountsLoading,
    accountsError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    recentTransactions,
    payoutQueue,
    complianceNotices,
    accountDrawer,
    updateAccountDrawerForm,
    handleAccountSave,
    closeAccountDrawer,
    openCreateAccount,
    openEditAccount,
    transactionDrawer,
    updateTransactionForm,
    handleTransactionSubmit,
    closeTransactionDrawer,
    openTransactionDrawer,
    ledgerState,
    openLedger,
    closeLedger,
    loadOverview,
    totalsSummary,
    headerMeta,
    totalPages,
    handleAccountsPageChange,
    OWNER_OPTIONS,
    STATUS_FILTERS,
    TRANSACTION_TYPES,
    ACCOUNT_STATUS_OPTIONS,
    formatCurrency
  };
}

export default useWalletManagement;
