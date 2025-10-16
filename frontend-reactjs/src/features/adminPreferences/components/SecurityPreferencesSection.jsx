import PropTypes from 'prop-types';
import { PlusIcon, ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';
import { ensureNonEmptyList } from '../state.js';

export default function SecurityPreferencesSection({
  security,
  onToggle,
  onFieldChange,
  onListChange,
  onAddListEntry,
  onRemoveListEntry
}) {
  const allowlist = ensureNonEmptyList(security.ipAllowlist);
  const loginAlerts = ensureNonEmptyList(security.loginAlertEmails);

  return (
    <Card padding="lg" className="border border-emerald-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-primary">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            Security posture & session controls
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Set mandatory controls for administrator authentication and session handling.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Checkbox
            label="Require multi-factor authentication"
            checked={security.requireMfa}
            onChange={onToggle('requireMfa')}
          />
          <Checkbox
            label="Allow passwordless magic links"
            description="Only available to trusted IPs."
            checked={security.allowPasswordless}
            onChange={onToggle('allowPasswordless')}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Session timeout (minutes)"
            type="number"
            min="5"
            max="480"
            value={security.sessionTimeoutMinutes}
            onChange={(event) => onFieldChange('sessionTimeoutMinutes', event.target.value)}
          />
          <TextInput
            label="Password rotation (days)"
            type="number"
            min="0"
            max="365"
            value={security.passwordRotationDays}
            onChange={(event) => onFieldChange('passwordRotationDays', event.target.value)}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">IP allowlist</h3>
            <Button variant="ghost" size="sm" icon={PlusIcon} onClick={() => onAddListEntry('ipAllowlist')}>
              Add IP
            </Button>
          </div>
          <div className="space-y-3">
            {allowlist.map((entry, index) => (
              <div key={`allowlist-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <TextInput
                    label={`Allowed IP or CIDR ${index + 1}`}
                    value={entry}
                    onChange={(event) => onListChange('ipAllowlist', index, event.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  icon={TrashIcon}
                  onClick={() => onRemoveListEntry('ipAllowlist', index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Login alert recipients</h3>
            <Button variant="ghost" size="sm" icon={PlusIcon} onClick={() => onAddListEntry('loginAlertEmails')}>
              Add recipient
            </Button>
          </div>
          <div className="space-y-3">
            {loginAlerts.map((entry, index) => (
              <div key={`login-alert-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <TextInput
                    label={`Login alert email ${index + 1}`}
                    type="email"
                    value={entry}
                    onChange={(event) => onListChange('loginAlertEmails', index, event.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  icon={TrashIcon}
                  onClick={() => onRemoveListEntry('loginAlertEmails', index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

SecurityPreferencesSection.propTypes = {
  security: PropTypes.shape({
    requireMfa: PropTypes.bool.isRequired,
    allowPasswordless: PropTypes.bool.isRequired,
    sessionTimeoutMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    passwordRotationDays: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    ipAllowlist: PropTypes.arrayOf(PropTypes.string).isRequired,
    loginAlertEmails: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onListChange: PropTypes.func.isRequired,
  onAddListEntry: PropTypes.func.isRequired,
  onRemoveListEntry: PropTypes.func.isRequired
};
