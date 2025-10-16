import PropTypes from 'prop-types';
import { Button, Spinner } from '../../components/ui/index.js';
import AccountSettingsHeader from './components/AccountSettingsHeader.jsx';
import PreferencesSettingsPanel from './components/PreferencesSettingsPanel.jsx';
import ProfileSettingsPanel from './components/ProfileSettingsPanel.jsx';
import RecipientsSettingsPanel from './components/RecipientsSettingsPanel.jsx';
import SecuritySettingsPanel from './components/SecuritySettingsPanel.jsx';
import useAccountSettings from './hooks/useAccountSettings.js';

function AccountSettingsManager({ initialSnapshot }) {
  const {
    heading,
    description,
    loading,
    hasLoaded,
    error,
    alerts,
    saving,
    profile,
    preferences,
    security,
    recipients,
    recipientDraft,
    currencyOptions,
    localeOptions,
    timezoneOptions,
    roleOptions,
    channelOptions,
    actions,
    mutations,
    handlers
  } = useAccountSettings(initialSnapshot);

  if (loading && !hasLoaded) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!hasLoaded && error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700">
        <p className="text-lg font-semibold">We couldn’t load account settings right now.</p>
        <p className="mt-2 text-sm">{error}</p>
        <Button className="mt-6" variant="secondary" onClick={actions.reload}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <AccountSettingsHeader
        heading={heading}
        description={description}
        onManageSessions={actions.openSessionsDashboard}
        onViewAudit={actions.openAuditLog}
      />

      {error && hasLoaded ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-700">
          <p className="font-medium">Some settings may be out of sync.</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : null}

      <ProfileSettingsPanel
        profile={profile}
        onFieldChange={mutations.updateProfileField}
        onSubmit={handlers.handleProfileSubmit}
        saving={saving.profile}
        alert={alerts.profile}
        mfaEnabled={security.twoFactorApp}
      />

      <PreferencesSettingsPanel
        preferences={preferences}
        onFieldChange={mutations.updatePreferencesField}
        onSubmit={handlers.handlePreferencesSubmit}
        saving={saving.preferences}
        alert={alerts.preferences}
        timezoneOptions={timezoneOptions}
        localeOptions={localeOptions}
        currencyOptions={currencyOptions}
      />

      <SecuritySettingsPanel
        security={security}
        onFieldChange={mutations.updateSecurityField}
        onSubmit={handlers.handleSecuritySubmit}
        saving={saving.security}
        alert={alerts.security}
      />

      <RecipientsSettingsPanel
        recipients={recipients}
        recipientDraft={recipientDraft}
        onDraftChange={mutations.updateRecipientDraft}
        onCreate={handlers.handleRecipientCreate}
        onUpdate={handlers.handleRecipientUpdate}
        onDelete={handlers.handleRecipientDelete}
        saving={saving.recipient}
        alert={alerts.recipients}
        roleOptions={roleOptions}
        channelOptions={channelOptions}
      />
    </div>
  );
}

AccountSettingsManager.propTypes = {
  initialSnapshot: PropTypes.shape({
    data: PropTypes.shape({
      panels: PropTypes.array
    })
  })
};

AccountSettingsManager.defaultProps = {
  initialSnapshot: null
};

export default AccountSettingsManager;
