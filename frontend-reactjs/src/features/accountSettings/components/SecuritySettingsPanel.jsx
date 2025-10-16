import PropTypes from 'prop-types';
import { Button, Checkbox, TextInput } from '../../../components/ui/index.js';
import InlineAlert from './InlineAlert.jsx';

function SecuritySettingsPanel({ security, onFieldChange, onSubmit, saving, alert }) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Security</p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">Authentication & access</h3>
          <p className="mt-1 text-sm text-slate-500">
            Configure multi-factor authentication options and email fallback to secure your Fixnado workspace.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
          <Checkbox
            label="Authenticator app required"
            checked={security.twoFactorApp}
            onChange={(event) => onFieldChange('twoFactorApp', event.target.checked)}
          />
          <Checkbox
            label="Email fallback codes"
            checked={security.twoFactorEmail}
            onChange={(event) => onFieldChange('twoFactorEmail', event.target.checked)}
          />
        </div>
        <TextInput
          label="Delegated access URL"
          value="https://fixnado.com/security/delegation"
          hint="Share with administrators who manage delegated logins."
          readOnly
        />
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <InlineAlert tone={alert?.type} message={alert?.message} />
        <Button type="submit" loading={saving} disabled={saving}>
          Save security
        </Button>
      </div>
    </form>
  );
}

SecuritySettingsPanel.propTypes = {
  security: PropTypes.shape({
    twoFactorApp: PropTypes.bool,
    twoFactorEmail: PropTypes.bool
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  alert: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  })
};

SecuritySettingsPanel.defaultProps = {
  alert: null
};

export default SecuritySettingsPanel;
