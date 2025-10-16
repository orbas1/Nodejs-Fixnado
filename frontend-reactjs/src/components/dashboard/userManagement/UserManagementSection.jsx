import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ShieldExclamationIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Spinner } from '../../ui/index.js';
import {
  createAdminUser,
  resetAdminUserMfa,
  revokeAdminUserSessions,
  updateAdminUser,
  updateAdminUserProfile
} from '../../../api/adminUsersClient.js';
import { CREATE_FORM_DEFAULTS } from './constants.js';
import { useUserDirectory } from './useUserDirectory.js';
import ActionBanner from './components/ActionBanner.jsx';
import SummaryTiles from './components/SummaryTiles.jsx';
import DirectoryFilters from './components/DirectoryFilters.jsx';
import UserDirectoryTable from './components/UserDirectoryTable.jsx';
import EmptyState from './components/EmptyState.jsx';
import CreateUserModal from './components/CreateUserModal.jsx';
import EditUserModal from './components/EditUserModal.jsx';
import { formatRelativeTime } from './formatters.js';

function useSummaryStats(summary) {
  return useMemo(() => {
    if (!summary) {
      return [
        { label: 'Total accounts', value: '—', helper: 'Loading…', icon: UserGroupIcon },
        { label: 'MFA enabled', value: '—', helper: 'Two-factor adoption', icon: ShieldExclamationIcon },
        { label: 'Active status', value: '—', helper: 'Accounts in good standing', icon: CheckCircleIcon },
        { label: 'Active sessions', value: '—', helper: 'Live device sessions', icon: ArrowPathIcon }
      ];
    }

    const activeCount = summary.statuses?.active ?? 0;
    const total = summary.total ?? 0;
    const mfa = summary.twoFactorEnabled ?? 0;
    const activeSessionsTotal = summary.activeSessions ?? 0;

    return [
      {
        label: 'Total accounts',
        value: total.toLocaleString(),
        helper: summary.generatedAt ? `Last updated ${formatRelativeTime(summary.generatedAt)}` : '—',
        icon: UserGroupIcon
      },
      {
        label: 'MFA enabled',
        value: mfa.toLocaleString(),
        helper: total ? `${Math.round((mfa / total) * 100)}% of users` : '—',
        icon: ShieldExclamationIcon
      },
      {
        label: 'Active status',
        value: activeCount.toLocaleString(),
        helper: `${((activeCount / Math.max(total, 1)) * 100).toFixed(0)}% active`,
        icon: CheckCircleIcon
      },
      {
        label: 'Active sessions',
        value: activeSessionsTotal.toLocaleString(),
        helper: 'Across authenticated devices',
        icon: ArrowPathIcon
      }
    ];
  }, [summary]);
}

function UserManagementSection({ section }) {
  const { filters, setFilter, setPage, state, refresh, paginationMeta } = useUserDirectory();

  const [actionMessage, setActionMessage] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(CREATE_FORM_DEFAULTS);
  const [createError, setCreateError] = useState(null);
  const [createSaving, setCreateSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [pendingAction, setPendingAction] = useState(null);

  const summaryStats = useSummaryStats(state.summary);

  const handleFilterChange = useCallback(
    (field, value) => {
      setFilter(field, value);
    },
    [setFilter]
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleCreateChange = useCallback((field, value) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleEditChange = useCallback((field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  }, []);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setCreateForm(CREATE_FORM_DEFAULTS);
    setCreateError(null);
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditForm(null);
    setEditError(null);
  }, []);

  const handleCreateSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setCreateSaving(true);
      setCreateError(null);
      try {
        const response = await createAdminUser(createForm);
        setActionMessage({
          tone: 'success',
          title: `Invited ${response?.user?.displayName ?? 'user'}`,
          description: response?.provisionedPassword
            ? `Temporary password: ${response.provisionedPassword}`
            : undefined
        });
        closeCreate();
        refresh();
      } catch (error) {
        setCreateError(error.message || 'Unable to create user');
      } finally {
        setCreateSaving(false);
      }
    },
    [createForm, closeCreate, refresh]
  );

  const handleEditSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!editForm) return;
      setEditSaving(true);
      setEditError(null);
      try {
        const { id, labels, ...updates } = editForm;
        await updateAdminUser(id, {
          firstName: updates.firstName,
          lastName: updates.lastName,
          email: updates.email,
          role: updates.role,
          twoFactorEmail: updates.twoFactorEmail,
          twoFactorApp: updates.twoFactorApp
        });
        await updateAdminUserProfile(id, {
          status: updates.status,
          jobTitle: updates.jobTitle,
          department: updates.department,
          labels,
          notes: updates.notes,
          avatarUrl: updates.avatarUrl
        });
        setActionMessage({ tone: 'success', title: `Updated ${updates.displayName ?? 'user'} details` });
        closeEdit();
        refresh();
      } catch (error) {
        setEditError(error.message || 'Unable to update user');
      } finally {
        setEditSaving(false);
      }
    },
    [editForm, closeEdit, refresh]
  );

  const openEdit = useCallback((user) => {
    setEditForm({
      id: user.id,
      displayName: user.displayName,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      role: user.role,
      status: user.status,
      jobTitle: user.jobTitle ?? '',
      department: user.department ?? '',
      labels: (user.labels ?? []).join(', '),
      notes: user.notes ?? '',
      avatarUrl: user.avatarUrl ?? '',
      twoFactorEmail: Boolean(user.twoFactor?.email),
      twoFactorApp: Boolean(user.twoFactor?.app)
    });
    setEditError(null);
    setEditOpen(true);
  }, []);

  const handleResetMfa = useCallback(
    async (user) => {
      setPendingAction({ type: 'reset-mfa', userId: user.id });
      setActionMessage(null);
      try {
        await resetAdminUserMfa(user.id);
        setActionMessage({ tone: 'info', title: `Reset MFA for ${user.displayName}` });
        refresh();
      } catch (error) {
        setActionMessage({ tone: 'danger', title: 'Unable to reset MFA', description: error.message });
      } finally {
        setPendingAction(null);
      }
    },
    [refresh]
  );

  const handleRevokeSessions = useCallback(
    async (user) => {
      setPendingAction({ type: 'revoke-sessions', userId: user.id });
      setActionMessage(null);
      try {
        await revokeAdminUserSessions(user.id);
        setActionMessage({ tone: 'info', title: `Revoked active sessions for ${user.displayName}` });
        refresh();
      } catch (error) {
        setActionMessage({ tone: 'danger', title: 'Unable to revoke sessions', description: error.message });
      } finally {
        setPendingAction(null);
      }
    },
    [refresh]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
      </div>

      <ActionBanner message={actionMessage} onDismiss={() => setActionMessage(null)} />

      <SummaryTiles stats={summaryStats} />

      <Card className="border border-slate-200/80 bg-white/95 shadow-lg shadow-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">Directory</h3>
            <p className="text-xs text-slate-500">Search by email, adjust roles, and manage MFA for each user.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowPathIcon}
              onClick={handleRefresh}
              disabled={state.loading}
            >
              Refresh
            </Button>
            <Button type="button" size="sm" icon={PlusIcon} onClick={() => setCreateOpen(true)}>
              Add user
            </Button>
          </div>
        </div>

        <DirectoryFilters filters={filters} onChange={handleFilterChange} />

        <div className="px-6 py-4">
          {state.loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : state.error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                <p className="font-semibold">{state.error}</p>
              </div>
              <Button className="mt-4" variant="secondary" size="sm" onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          ) : state.items.length === 0 ? (
            <EmptyState onCreate={() => setCreateOpen(true)} />
          ) : (
            <UserDirectoryTable
              items={state.items}
              pendingAction={pendingAction}
              onEdit={openEdit}
              onResetMfa={handleResetMfa}
              onRevokeSessions={handleRevokeSessions}
            />
          )}
        </div>

        {state.items.length > 0 && !state.loading ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
            <div>
              <p>
                {paginationMeta.paginationLabel} • {paginationMeta.totalUsersLabel} users
              </p>
              {paginationMeta.showPageAdjustment ? (
                <p className="mt-1 text-xs text-amber-600">
                  Showing the closest available page because page {paginationMeta.requestedPageLabel} exceeds the result set.
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={paginationMeta.activePage <= 1} onClick={() => setPage(Math.max(1, paginationMeta.activePage - 1))}>
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={paginationMeta.activePage >= paginationMeta.totalPages}
                onClick={() => setPage(Math.min(paginationMeta.totalPages, paginationMeta.activePage + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <CreateUserModal
        open={createOpen}
        form={createForm}
        onClose={closeCreate}
        onChange={handleCreateChange}
        onSubmit={handleCreateSubmit}
        saving={createSaving}
        formError={createError}
      />

      <EditUserModal
        open={editOpen}
        form={editForm}
        onClose={closeEdit}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit}
        saving={editSaving}
        formError={editError}
      />
    </div>
  );
}

UserManagementSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired
};

export default UserManagementSection;
