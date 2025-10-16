import PropTypes from 'prop-types';
import { Card, Checkbox, FormField } from '../../../components/ui/index.js';

function SecuritySection({ security, onToggle, onTimeoutChange }) {
  return (
    <Card className="space-y-6" padding="lg">
      <div>
        <h2 className="text-xl font-semibold text-primary">Security controls</h2>
        <p className="mt-1 text-sm text-slate-600">
          Harden your admin account and determine how long control centre sessions remain active.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Checkbox
          label="Require multi-factor authentication"
          description="Force a second factor challenge for every administrator sign-in."
          checked={security.requireMfa}
          onChange={() => onToggle('requireMfa')}
        />
        <Checkbox
          label="Login alerts"
          description="Email notifications when admin sessions are established or rotated."
          checked={security.loginAlerts}
          onChange={() => onToggle('loginAlerts')}
        />
        <Checkbox
          label="Allow session sharing"
          description="Permit delegated operators to assume your session for supervised actions."
          checked={security.allowSessionShare}
          onChange={() => onToggle('allowSessionShare')}
        />
        <FormField id="session-timeout" label="Session timeout" hint="Minutes before an idle admin session expires.">
          <input
            id="session-timeout"
            type="number"
            min={5}
            max={720}
            className="fx-text-input"
            value={security.sessionTimeoutMinutes}
            onChange={(event) => onTimeoutChange(event.target.value)}
          />
        </FormField>
      </div>
    </Card>
  );
}

SecuritySection.propTypes = {
  security: PropTypes.shape({
    requireMfa: PropTypes.bool,
    loginAlerts: PropTypes.bool,
    allowSessionShare: PropTypes.bool,
    sessionTimeoutMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onTimeoutChange: PropTypes.func.isRequired
};

export default SecuritySection;
