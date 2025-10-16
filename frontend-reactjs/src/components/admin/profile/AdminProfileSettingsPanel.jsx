import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Spinner, StatusPill } from '../../ui/index.js';
import ProfileDetailsForm from './ProfileDetailsForm.jsx';
import AddressSettingsForm from './AddressSettingsForm.jsx';
import NotificationPreferencesForm from './NotificationPreferencesForm.jsx';
import NotificationEmailsManager from './NotificationEmailsManager.jsx';
import DelegateTable from './DelegateTable.jsx';
import DelegateModal from './DelegateModal.jsx';
import {
  buildForm,
  createEmptyDelegateForm,
  formatUpdatedAt,
  NOTIFICATION_ITEMS,
  TIMEZONE_OPTIONS,
  DELEGATE_STATUS_OPTIONS
} from './constants.js';

export default function AdminProfileSettingsPanel({
  data,
  loading,
  saving,
  error,
  success,
  onRefresh,
  onSubmit,
  onCreateDelegate,
  onUpdateDelegate,
  onDeleteDelegate
}) {
  const [form, setForm] = useState(() => buildForm(data));
  const [emailInput, setEmailInput] = useState('');
  const [modalState, setModalState] = useState({ open: false, mode: 'create', delegate: null });
  const [delegateForm, setDelegateForm] = useState(createEmptyDelegateForm());
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    setForm(buildForm(data));
  }, [data]);

  useEffect(() => {
    if (modalState.open) {
      const base = modalState.delegate ?? createEmptyDelegateForm();
      setDelegateForm({
        id: base.id ?? '',
        name: base.name ?? '',
        email: base.email ?? '',
        role: base.role ?? '',
        avatarUrl: base.avatarUrl ?? '',
        status: base.status ?? 'active',
        permissionsText: Array.isArray(base.permissions) ? base.permissions.join(', ') : base.permissionsText ?? ''
      });
      setModalSubmitting(false);
      setModalError(null);
    } else {
      setDelegateForm(createEmptyDelegateForm());
      setModalSubmitting(false);
      setModalError(null);
    }
  }, [modalState]);

  const handleProfileChange = (field, value) => {
    setForm((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value }
    }));
  };

  const handleAddressChange = (field, value) => {
    setForm((current) => ({
      ...current,
      address: { ...current.address, [field]: value }
    }));
  };

  const handleNotificationChange = (field, checked) => {
    setForm((current) => ({
      ...current,
      notifications: { ...current.notifications, [field]: checked }
    }));
  };

  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    setForm((current) => {
      if (current.notificationEmails.some((email) => email.toLowerCase() === trimmed.toLowerCase())) {
        return current;
      }
      return {
        ...current,
        notificationEmails: [...current.notificationEmails, trimmed]
      };
    });
    setEmailInput('');
  };

  const handleRemoveEmail = (target) => {
    setForm((current) => ({
      ...current,
      notificationEmails: current.notificationEmails.filter((email) => email !== target)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    await onSubmit(form);
  };

  const handleRefresh = async () => {
    if (typeof onRefresh === 'function') {
      await onRefresh();
    }
  };

  const openCreateModal = () => {
    setModalState({ open: true, mode: 'create', delegate: null });
  };

  const openEditModal = (delegate) => {
    setModalState({ open: true, mode: 'edit', delegate });
  };

  const closeModal = () => {
    setModalState({ open: false, mode: 'create', delegate: null });
  };

  const handleDelegateFieldChange = (field, value) => {
    setDelegateForm((current) => ({ ...current, [field]: value }));
  };

  const handleDelegateSubmit = async (event) => {
    event.preventDefault();
    if (modalSubmitting) return;
    setModalSubmitting(true);
    setModalError(null);

    const payload = {
      name: delegateForm.name,
      email: delegateForm.email,
      role: delegateForm.role,
      avatarUrl: delegateForm.avatarUrl,
      status: delegateForm.status,
      permissions: delegateForm.permissionsText
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    };

    try {
      if (modalState.mode === 'edit' && modalState.delegate) {
        await onUpdateDelegate(modalState.delegate.id, payload);
      } else {
        await onCreateDelegate(payload);
      }
      setModalSubmitting(false);
      closeModal();
    } catch (caught) {
      setModalSubmitting(false);
      setModalError(caught?.message ?? 'Unable to save delegate');
    }
  };

  const handleDelegateDelete = async (delegate) => {
    if (!delegate?.id) return;
    const confirmed = window.confirm(`Remove ${delegate.name || delegate.email} from the admin workspace?`);
    if (!confirmed) return;
    try {
      await onDeleteDelegate(delegate.id);
    } catch (caught) {
      window.alert(caught?.message ?? 'Unable to remove delegate');
    }
  };

  const delegates = useMemo(() => data?.delegates ?? [], [data]);
  const lastUpdated = useMemo(() => formatUpdatedAt(data?.audit?.updatedAt), [data]);

  if (loading && !data) {
    return (
      <Card className="flex min-h-[240px] items-center justify-center">
        <Spinner aria-label="Loading profile settings" />
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Profile settings</h2>
          <p className="text-sm text-slate-600">
            Manage admin identity, service address, notification policies, and delegate access.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          {lastUpdated ? (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Last updated {lastUpdated}</p>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={handleRefresh} disabled={loading || saving}>
            Refresh snapshot
          </Button>
        </div>
      </div>

      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      {success ? <StatusPill tone="success">{success}</StatusPill> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-8">
          <ProfileDetailsForm values={form.profile} onChange={handleProfileChange} timezoneOptions={TIMEZONE_OPTIONS} />
          <AddressSettingsForm values={form.address} onChange={handleAddressChange} />
          <NotificationPreferencesForm
            values={form.notifications}
            items={NOTIFICATION_ITEMS}
            onChange={handleNotificationChange}
          />
          <NotificationEmailsManager
            emails={form.notificationEmails}
            inputValue={emailInput}
            onInputChange={setEmailInput}
            onAdd={handleAddEmail}
            onRemove={handleRemoveEmail}
            disableAdd={!emailInput.trim() || saving}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={loading || saving}>
              Save changes
            </Button>
          </div>
        </Card>
      </form>

      <DelegateTable
        delegates={delegates}
        disabled={saving}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelegateDelete}
      />

      <DelegateModal
        open={modalState.open}
        mode={modalState.mode}
        values={delegateForm}
        statusOptions={DELEGATE_STATUS_OPTIONS}
        submitting={modalSubmitting}
        error={modalError}
        onClose={closeModal}
        onFieldChange={handleDelegateFieldChange}
        onSubmit={handleDelegateSubmit}
      />
    </div>
  );
}

AdminProfileSettingsPanel.propTypes = {
  data: PropTypes.shape({
    profile: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      jobTitle: PropTypes.string,
      department: PropTypes.string,
      phoneNumber: PropTypes.string,
      avatarUrl: PropTypes.string,
      timezone: PropTypes.string
    }),
    address: PropTypes.shape({
      line1: PropTypes.string,
      line2: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      postalCode: PropTypes.string,
      country: PropTypes.string
    }),
    notifications: PropTypes.object,
    notificationEmails: PropTypes.arrayOf(PropTypes.string),
    delegates: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
        permissions: PropTypes.arrayOf(PropTypes.string),
        status: PropTypes.string,
        avatarUrl: PropTypes.string
      })
    ),
    audit: PropTypes.shape({
      updatedAt: PropTypes.string
    })
  }),
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.string,
  onRefresh: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  onCreateDelegate: PropTypes.func.isRequired,
  onUpdateDelegate: PropTypes.func.isRequired,
  onDeleteDelegate: PropTypes.func.isRequired
};

AdminProfileSettingsPanel.defaultProps = {
  data: null,
  loading: false,
  saving: false,
  error: null,
  success: null,
  onRefresh: undefined
};
