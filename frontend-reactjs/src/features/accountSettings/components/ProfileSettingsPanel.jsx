import PropTypes from 'prop-types';
import { Button, StatusPill, TextInput } from '../../../components/ui/index.js';
import InlineAlert from './InlineAlert.jsx';

function ProfileSettingsPanel({
  profile,
  onFieldChange,
  onSubmit,
  saving,
  alert,
  mfaEnabled
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Identity</p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">Profile & contact details</h3>
        </div>
        <StatusPill tone={mfaEnabled ? 'success' : 'warning'}>
          {mfaEnabled ? 'MFA active' : 'Enable MFA'}
        </StatusPill>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <TextInput
          label="First name"
          value={profile.firstName}
          onChange={(event) => onFieldChange('firstName', event.target.value)}
          required
        />
        <TextInput
          label="Last name"
          value={profile.lastName}
          onChange={(event) => onFieldChange('lastName', event.target.value)}
          required
        />
        <TextInput
          label="Email"
          type="email"
          value={profile.email}
          onChange={(event) => onFieldChange('email', event.target.value)}
          required
        />
        <TextInput
          label="SMS number"
          value={profile.phoneNumber}
          onChange={(event) => onFieldChange('phoneNumber', event.target.value)}
          hint="Used for urgent dispatch updates and MFA codes."
        />
        <TextInput
          label="Profile image URL"
          value={profile.profileImageUrl}
          onChange={(event) => onFieldChange('profileImageUrl', event.target.value)}
          placeholder="https://"
          hint="Paste a link to the avatar shown to crews and support."
        />
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <InlineAlert tone={alert?.type} message={alert?.message} />
        <Button type="submit" loading={saving} disabled={saving}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

ProfileSettingsPanel.propTypes = {
  profile: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phoneNumber: PropTypes.string,
    profileImageUrl: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  alert: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  }),
  mfaEnabled: PropTypes.bool.isRequired
};

ProfileSettingsPanel.defaultProps = {
  alert: null
};

export default ProfileSettingsPanel;
