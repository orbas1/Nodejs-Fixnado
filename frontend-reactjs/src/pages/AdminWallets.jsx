import { useMemo } from 'react';
import { ArrowPathIcon, BanknotesIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import { Card, Spinner } from '../components/ui/index.js';
import {
  useWalletManagement,
  WalletSettingsPanel,
  WalletActivityRail,
  WalletAccountsSection,
  WalletAccountDrawer,
  WalletTransactionDrawer,
  WalletLedgerDrawer
} from '../modules/walletManagement/index.js';

export default function AdminWallets() {
  const {
    OWNER_OPTIONS,
    STATUS_FILTERS: statusOptions,
    TRANSACTION_TYPES: transactionTypes,
    ACCOUNT_STATUS_OPTIONS: accountStatusOptions,
    loading,
    initialised,
    error,
    settingsForm,
    setSettingsForm,
    settingsSaving,
    settingsStatus,
    settingsDirty,
    handleSettingsSubmit,
    handleAllowedOwnerToggle,
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
    headerMeta,
    totalPages,
    handleAccountsPageChange,
    formatCurrency
  } = useWalletManagement();

  const headerActions = useMemo(
    () => [
      {
        label: 'New wallet account',
        icon: PlusIcon,
        onClick: openCreateAccount
      },
      {
        label: 'Refresh data',
        variant: 'secondary',
        icon: ArrowPathIcon,
        onClick: loadOverview
      },
      {
        label: 'Open finance dashboard',
        variant: 'secondary',
        icon: BanknotesIcon,
        href: '/dashboards/finance',
        target: '_blank',
        rel: 'noreferrer'
      }
    ],
    [loadOverview, openCreateAccount]
  );

  if (loading && !initialised) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader
          eyebrow="Admin Control Centre"
          title="Wallet management"
          description="Configure non-custodial wallet policies, manage float accounts, and post manual ledger adjustments across Fixnado surfaces."
          actions={headerActions}
          meta={headerMeta}
        />
        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white">
            <Spinner className="h-6 w-6 text-primary" />
            <p className="text-sm text-slate-600">Loading wallet configuration…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Admin Control Centre"
        title="Wallet management"
        description="Configure non-custodial wallet policies, manage float accounts, and post manual ledger adjustments across Fixnado surfaces."
        actions={headerActions}
        meta={headerMeta}
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {error ? (
          <Card className="mb-8 border-red-200 bg-red-50/80 text-red-700">
            <p className="font-semibold">{error.message}</p>
            <p className="text-sm">Retry or contact platform engineering if the issue persists.</p>
          </Card>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <WalletSettingsPanel
            form={settingsForm}
            onFormChange={setSettingsForm}
            onAllowedOwnerToggle={handleAllowedOwnerToggle}
            onSubmit={handleSettingsSubmit}
            ownerOptions={OWNER_OPTIONS}
            dirty={settingsDirty}
            saving={settingsSaving}
            status={settingsStatus}
          />

          <WalletActivityRail
            complianceNotices={complianceNotices}
            payoutQueue={payoutQueue}
            recentTransactions={recentTransactions}
            formatCurrency={formatCurrency}
            onViewLedger={openLedger}
          />
        </div>

        <WalletAccountsSection
          accountsState={accountsState}
          loading={accountsLoading}
          error={accountsError}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          statusOptions={statusOptions}
          onStatusFilterChange={setStatusFilter}
          onOpenEdit={openEditAccount}
          onOpenLedger={openLedger}
          onOpenTransaction={openTransactionDrawer}
          onPageChange={handleAccountsPageChange}
          totalPages={totalPages}
          formatCurrency={formatCurrency}
        />
      </main>

      <WalletAccountDrawer
        drawer={accountDrawer}
        onClose={closeAccountDrawer}
        onSubmit={handleAccountSave}
        onUpdateForm={updateAccountDrawerForm}
        ownerOptions={OWNER_OPTIONS}
        statusOptions={accountStatusOptions}
      />

      <WalletTransactionDrawer
        drawer={transactionDrawer}
        onClose={closeTransactionDrawer}
        onSubmit={handleTransactionSubmit}
        onUpdateForm={updateTransactionForm}
        transactionTypes={transactionTypes}
      />

      <WalletLedgerDrawer ledger={ledgerState} onClose={closeLedger} formatCurrency={formatCurrency} />
    </div>
  );
}
