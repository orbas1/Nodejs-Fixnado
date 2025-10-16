import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import { Card, Spinner, StatusPill } from '../components/ui/index.js';
import {
  listEnterpriseAccounts,
  createEnterpriseAccount,
  updateEnterpriseAccount,
  archiveEnterpriseAccount,
  createEnterpriseSite,
  updateEnterpriseSite,
  deleteEnterpriseSite,
  createEnterpriseStakeholder,
  updateEnterpriseStakeholder,
  deleteEnterpriseStakeholder,
  createEnterprisePlaybook,
  updateEnterprisePlaybook,
  deleteEnterprisePlaybook
} from '../api/enterpriseAdminClient.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';
import {
  DEFAULT_SUMMARY,
  DEFAULT_SITE,
  DEFAULT_STAKEHOLDER,
  DEFAULT_PLAYBOOK,
  READ_ONLY_MESSAGE
} from '../features/enterpriseManagement/constants.js';
import { formatTimestamp } from '../features/enterpriseManagement/utils.js';
import {
  EnterpriseAccountSidebar,
  EnterpriseAccountSettingsCard,
  EnterpriseSitesCard,
  EnterpriseStakeholdersCard,
  EnterprisePlaybooksCard
} from '../features/enterpriseManagement/components/index.js';
import { DEMO_ENTERPRISE_ACCOUNTS, getDemoSummary } from '../features/enterpriseManagement/demoData.js';

const bypassAdminAuth =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_DISABLE_ADMIN_AUTH === 'true';
const enableDemoData =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENTERPRISE_DEMO_DATA === 'true';

function cloneDemoAccounts(includeArchived) {
  const source = includeArchived ? DEMO_ENTERPRISE_ACCOUNTS : DEMO_ENTERPRISE_ACCOUNTS.filter((account) => !account.archivedAt);
  return source.map((account) => ({
    ...account,
    sites: (account.sites ?? []).map((site) => ({ ...site })),
    stakeholders: (account.stakeholders ?? []).map((stakeholder) => ({ ...stakeholder })),
    playbooks: (account.playbooks ?? []).map((playbook) => ({ ...playbook }))
  }));
}

export default function AdminEnterprise() {
  const { isAuthenticated } = useAdminSession();
  const allowAccess = isAuthenticated || bypassAdminAuth;

  const [loading, setLoading] = useState(true);
  const [viewArchived, setViewArchived] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(() => ({ ...DEFAULT_SUMMARY }));
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [accountDraft, setAccountDraft] = useState(null);
  const [siteForm, setSiteForm] = useState(DEFAULT_SITE);
  const [stakeholderForm, setStakeholderForm] = useState(DEFAULT_STAKEHOLDER);
  const [playbookForm, setPlaybookForm] = useState(DEFAULT_PLAYBOOK);
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [editingStakeholderId, setEditingStakeholderId] = useState(null);
  const [editingPlaybookId, setEditingPlaybookId] = useState(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  const [savingStakeholder, setSavingStakeholder] = useState(false);
  const [savingPlaybook, setSavingPlaybook] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadAccounts = useCallback(
    async ({ includeArchived, focusAccountId } = {}) => {
      const includeArchivedFlag = includeArchived ?? viewArchived;
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const result = await listEnterpriseAccounts({ includeArchived: includeArchivedFlag });
        const accountsPayload = result.accounts;
        setSummary({ ...DEFAULT_SUMMARY, ...result.summary });
        setAccounts(accountsPayload);
        setSelectedAccountId((current) => {
          if (focusAccountId) {
            return focusAccountId;
          }
          if (current && accountsPayload.some((account) => account.id === current)) {
            return current;
          }
          return accountsPayload[0]?.id ?? null;
        });
      } catch (caught) {
        if (enableDemoData) {
          const demoAccounts = cloneDemoAccounts(includeArchivedFlag);
          const demoSummary = getDemoSummary();
          setSummary(demoSummary);
          setAccounts(demoAccounts);
          setSelectedAccountId((current) => {
            if (focusAccountId) {
              return focusAccountId;
            }
            if (current && demoAccounts.some((account) => account.id === current)) {
              return current;
            }
            return demoAccounts[0]?.id ?? null;
          });
          setSuccess('Loaded demo enterprise data. Connect the admin API to sync live accounts.');
        } else {
          setError(caught instanceof Error ? caught.message : 'Unable to load enterprise accounts');
          setAccounts([]);
          setSummary({ ...DEFAULT_SUMMARY });
          setSelectedAccountId(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [viewArchived]
  );

  useEffect(() => {
    if (!allowAccess) {
      setLoading(false);
      return;
    }
    loadAccounts({ includeArchived: viewArchived });
  }, [allowAccess, loadAccounts, viewArchived]);

  useEffect(() => {
    if (!selectedAccountId) {
      setAccountDraft(null);
      setEditingSiteId(null);
      setEditingStakeholderId(null);
      setEditingPlaybookId(null);
      setSiteForm(DEFAULT_SITE);
      setStakeholderForm(DEFAULT_STAKEHOLDER);
      setPlaybookForm(DEFAULT_PLAYBOOK);
      return;
    }
    const account = accounts.find((item) => item.id === selectedAccountId);
    if (account) {
      const isArchived = Boolean(account.archivedAt);
      setAccountDraft({
        name: account.name ?? '',
        status: account.status ?? 'active',
        priority: account.priority ?? 'standard',
        timezone: account.timezone ?? '',
        accountManager: account.accountManager ?? '',
        supportEmail: account.supportEmail ?? '',
        billingEmail: account.billingEmail ?? '',
        supportPhone: account.supportPhone ?? '',
        logoUrl: account.logoUrl ?? '',
        heroImageUrl: account.heroImageUrl ?? '',
        notes: account.notes ?? '',
        escalationNotes: account.escalationNotes ?? ''
      });
      setEditingSiteId(isArchived ? null : account.sites?.length ? null : 'new');
      setEditingStakeholderId(isArchived ? null : account.stakeholders?.length ? null : 'new');
      setEditingPlaybookId(isArchived ? null : account.playbooks?.length ? null : 'new');
      setSiteForm(DEFAULT_SITE);
      setStakeholderForm(DEFAULT_STAKEHOLDER);
      setPlaybookForm(DEFAULT_PLAYBOOK);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  const isReadOnly = selectedAccount?.archivedAt != null;

  const blockIfReadOnly = () => {
    if (!isReadOnly) {
      return false;
    }
    setError(READ_ONLY_MESSAGE);
    setSuccess(null);
    return true;
  };

  const archivedDisplay = selectedAccount?.archivedAt ? formatTimestamp(selectedAccount.archivedAt) : null;

  const headerMeta = useMemo(
    () => [
      {
        label: 'Total accounts',
        value: String(summary.total),
        caption: 'Enterprise programmes currently managed'
      },
      {
        label: 'Active',
        value: String(summary.active),
        caption: 'Enabled for live operations'
      },
      {
        label: 'Archived',
        value: String(summary.archived),
        caption: 'Read-only historical programmes'
      },
      {
        label: 'Playbooks',
        value: String(summary.playbooks),
        caption: 'Runbooks tracked across accounts'
      }
    ],
    [summary]
  );

  const handleToggleArchived = async () => {
    const next = !viewArchived;
    setViewArchived(next);
    await loadAccounts({ includeArchived: next });
  };

  const handleCreateAccount = async () => {
    setCreatingAccount(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await createEnterpriseAccount({
        name: `Untitled enterprise ${accounts.length + 1}`,
        status: 'active',
        priority: 'standard',
        timezone: 'Europe/London'
      });
      setSuccess('Enterprise account created.');
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: payload.id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create enterprise account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleAccountDraftChange = (field) => (event) => {
    const value = event.target.value;
    setAccountDraft((current) => ({ ...current, [field]: value }));
  };

  const handleAccountSave = async () => {
    if (!selectedAccountId || !accountDraft) return;
    if (blockIfReadOnly()) return;
    setSavingAccount(true);
    setError(null);
    setSuccess(null);
    try {
      await updateEnterpriseAccount(selectedAccountId, accountDraft);
      setSuccess('Account settings updated.');
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: selectedAccountId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save account settings');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleArchiveAccount = async () => {
    if (!selectedAccountId) return;
    if (selectedAccount?.archivedAt) {
      setError('Enterprise account is already archived.');
      setSuccess(null);
      return;
    }
    setSavingAccount(true);
    setError(null);
    setSuccess(null);
    try {
      await archiveEnterpriseAccount(selectedAccountId);
      setSuccess('Account archived. It is now read-only.');
      await loadAccounts({ includeArchived: true });
      setViewArchived(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to archive account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleStartEditSite = (site) => {
    if (blockIfReadOnly()) {
      return;
    }
    if (!site) {
      setEditingSiteId('new');
      setSiteForm(DEFAULT_SITE);
      return;
    }
    setEditingSiteId(site.id);
    setSiteForm({
      name: site.name ?? '',
      code: site.code ?? '',
      status: site.status ?? 'operational',
      addressLine1: site.addressLine1 ?? '',
      addressLine2: site.addressLine2 ?? '',
      city: site.city ?? '',
      region: site.region ?? '',
      postalCode: site.postalCode ?? '',
      country: site.country ?? '',
      timezone: site.timezone ?? '',
      contactName: site.contactName ?? '',
      contactEmail: site.contactEmail ?? '',
      contactPhone: site.contactPhone ?? '',
      capacityNotes: site.capacityNotes ?? '',
      mapUrl: site.mapUrl ?? '',
      imageUrl: site.imageUrl ?? '',
      notes: site.notes ?? ''
    });
  };

  const updateSiteForm = (field, value) => {
    setSiteForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveSite = async () => {
    if (!selectedAccountId) return;
    if (blockIfReadOnly()) return;
    setSavingSite(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingSiteId && editingSiteId !== 'new') {
        await updateEnterpriseSite(selectedAccountId, editingSiteId, siteForm);
        setSuccess('Site updated.');
      } else {
        await createEnterpriseSite(selectedAccountId, siteForm);
        setSuccess('Site added to enterprise account.');
      }
      setEditingSiteId(null);
      setSiteForm(DEFAULT_SITE);
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: selectedAccountId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save site details');
    } finally {
      setSavingSite(false);
    }
  };

  const handleDeleteSite = async (siteId) => {
    if (!selectedAccountId) return;
    if (blockIfReadOnly()) return;
    setSavingSite(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteEnterpriseSite(selectedAccountId, siteId);
      setSuccess('Site removed.');
      if (editingSiteId === siteId) {
        setEditingSiteId(null);
        setSiteForm(DEFAULT_SITE);
      }
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: selectedAccountId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove site');
    } finally {
      setSavingSite(false);
    }
  };

  const handleStartEditStakeholder = (stakeholder) => {
    if (blockIfReadOnly()) {
      return;
    }
    if (!stakeholder) {
      setEditingStakeholderId('new');
      setStakeholderForm(DEFAULT_STAKEHOLDER);
      return;
    }
    setEditingStakeholderId(stakeholder.id);
    setStakeholderForm({
      role: stakeholder.role ?? '',
      name: stakeholder.name ?? '',
      email: stakeholder.email ?? '',
      phone: stakeholder.phone ?? '',
      escalationLevel: stakeholder.escalationLevel ?? '',
      isPrimary: Boolean(stakeholder.isPrimary),
      avatarUrl: stakeholder.avatarUrl ?? '',
      notes: stakeholder.notes ?? ''
    });
  };

  const updateStakeholderForm = (field, value) => {
    setStakeholderForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveStakeholder = async () => {
    if (!selectedAccountId) return;
    if (blockIfReadOnly()) return;
    setSavingStakeholder(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingStakeholderId && editingStakeholderId !== 'new') {
        await updateEnterpriseStakeholder(selectedAccountId, editingStakeholderId, stakeholderForm);
        setSuccess('Stakeholder updated.');
      } else {
        await createEnterpriseStakeholder(selectedAccountId, stakeholderForm);
        setSuccess('Stakeholder added.');
      }
      setEditingStakeholderId(null);
      setStakeholderForm(DEFAULT_STAKEHOLDER);
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: selectedAccountId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save stakeholder');
    } finally {
      setSavingStakeholder(false);
    }
  };

  const handleDeleteStakeholder = async (stakeholderId) => {
    if (!selectedAccountId) return;
    if (blockIfReadOnly()) return;
    setSavingStakeholder(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteEnterpriseStakeholder(selectedAccountId, stakeholderId);
      setSuccess('Stakeholder removed.');
      if (editingStakeholderId === stakeholderId) {
        setEditingStakeholderId(null);
        setStakeholderForm(DEFAULT_STAKEHOLDER);
      }
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: selectedAccountId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove stakeholder');
    } finally {
      setSavingStakeholder(false);
    }
  };

  const handleStartEditPlaybook = (playbook) => {
    if (blockIfReadOnly()) {
      return;
    }
    if (!playbook) {
      setEditingPlaybookId('new');
      setPlaybookForm(DEFAULT_PLAYBOOK);
      return;
    }
    setEditingPlaybookId(playbook.id);
    setPlaybookForm({
      name: playbook.name ?? '',
      status: playbook.status ?? 'draft',
      owner: playbook.owner ?? '',
      category: playbook.category ?? '',
      documentUrl: playbook.documentUrl ?? '',
      summary: playbook.summary ?? '',
      lastReviewedAt: playbook.lastReviewedAt ? playbook.lastReviewedAt.slice(0, 10) : ''
    });
  };

  const updatePlaybookForm = (field, value) => {
    setPlaybookForm((current) => ({ ...current, [field]: value }));
  };

  const handleSavePlaybook = async () => {
    if (!selectedAccountId) return;
    if (blockIfReadOnly()) return;
    setSavingPlaybook(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...playbookForm,
        lastReviewedAt: playbookForm.lastReviewedAt ? new Date(playbookForm.lastReviewedAt).toISOString() : null
      };
      if (editingPlaybookId && editingPlaybookId !== 'new') {
        await updateEnterprisePlaybook(selectedAccountId, editingPlaybookId, payload);
        setSuccess('Playbook updated.');
      } else {
        await createEnterprisePlaybook(selectedAccountId, payload);
        setSuccess('Playbook created.');
      }
      setEditingPlaybookId(null);
      setPlaybookForm(DEFAULT_PLAYBOOK);
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: selectedAccountId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save playbook');
    } finally {
      setSavingPlaybook(false);
    }
  };

  const handleDeletePlaybook = async (playbookId) => {
    if (!selectedAccountId) return;
    if (blockIfReadOnly()) return;
    setSavingPlaybook(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteEnterprisePlaybook(selectedAccountId, playbookId);
      setSuccess('Playbook deleted.');
      if (editingPlaybookId === playbookId) {
        setEditingPlaybookId(null);
        setPlaybookForm(DEFAULT_PLAYBOOK);
      }
      await loadAccounts({ includeArchived: viewArchived, focusAccountId: selectedAccountId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete playbook');
    } finally {
      setSavingPlaybook(false);
    }
  };

  if (!allowAccess) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        <StatusPill tone="warning">Administrator access required</StatusPill>
        <h1 className="mt-6 text-3xl font-semibold text-primary">Administrator session required</h1>
        <p className="mt-4 text-base text-slate-600">
          Sign in with an administrator account to manage enterprise programmes, coverage, and contacts.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        eyebrow="Admin control"
        title="Enterprise management"
        description="Curate enterprise programmes, assign stakeholders, and orchestrate coverage from a single control tower."
        breadcrumbs={[
          { label: 'Admin dashboard', to: '/admin/dashboard' },
          { label: 'Enterprise management' }
        ]}
        actions={[
          {
            label: viewArchived ? 'Show active' : 'Show archived',
            variant: 'ghost',
            onClick: handleToggleArchived
          },
          {
            label: 'New enterprise',
            onClick: handleCreateAccount,
            loading: creatingAccount
          }
        ]}
        meta={headerMeta}
      />
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10">
        {error ? (
          <div className="mb-6">
            <StatusPill tone="danger">{error}</StatusPill>
          </div>
        ) : null}
        {success ? (
          <div className="mb-6">
            <StatusPill tone="success">{success}</StatusPill>
          </div>
        ) : null}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner aria-label="Loading enterprise accounts" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <EnterpriseAccountSidebar
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelect={setSelectedAccountId}
              viewArchived={viewArchived}
              onToggleArchived={handleToggleArchived}
              onCreateAccount={handleCreateAccount}
              creatingAccount={creatingAccount}
            />
            <div className="space-y-8">
              {selectedAccount && accountDraft ? (
                <>
                  <EnterpriseAccountSettingsCard
                    accountDraft={accountDraft}
                    onChange={handleAccountDraftChange}
                    onSave={handleAccountSave}
                    onArchive={handleArchiveAccount}
                    saving={savingAccount}
                    isReadOnly={isReadOnly}
                    archivedDisplay={archivedDisplay}
                  />
                  <EnterpriseSitesCard
                    sites={selectedAccount.sites ?? []}
                    siteForm={siteForm}
                    editingSiteId={editingSiteId}
                    onStartEdit={handleStartEditSite}
                    onFormChange={updateSiteForm}
                    onSave={handleSaveSite}
                    onDelete={handleDeleteSite}
                    onCancel={() => {
                      setEditingSiteId(null);
                      setSiteForm(DEFAULT_SITE);
                    }}
                    saving={savingSite}
                    isReadOnly={isReadOnly}
                  />
                  <EnterpriseStakeholdersCard
                    stakeholders={selectedAccount.stakeholders ?? []}
                    stakeholderForm={stakeholderForm}
                    editingStakeholderId={editingStakeholderId}
                    onStartEdit={handleStartEditStakeholder}
                    onFormChange={updateStakeholderForm}
                    onSave={handleSaveStakeholder}
                    onDelete={handleDeleteStakeholder}
                    onCancel={() => {
                      setEditingStakeholderId(null);
                      setStakeholderForm(DEFAULT_STAKEHOLDER);
                    }}
                    saving={savingStakeholder}
                    isReadOnly={isReadOnly}
                  />
                  <EnterprisePlaybooksCard
                    playbooks={selectedAccount.playbooks ?? []}
                    playbookForm={playbookForm}
                    editingPlaybookId={editingPlaybookId}
                    onStartEdit={handleStartEditPlaybook}
                    onFormChange={updatePlaybookForm}
                    onSave={handleSavePlaybook}
                    onDelete={handleDeletePlaybook}
                    onCancel={() => {
                      setEditingPlaybookId(null);
                      setPlaybookForm(DEFAULT_PLAYBOOK);
                    }}
                    saving={savingPlaybook}
                    isReadOnly={isReadOnly}
                  />
                </>
              ) : (
                <Card className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <h2 className="text-lg font-semibold text-primary">Select an enterprise</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Choose an enterprise from the list to manage coverage, contacts, and programme playbooks.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
