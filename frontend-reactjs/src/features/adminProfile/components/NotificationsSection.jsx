import PropTypes from 'prop-types';
import { Card, Checkbox } from '../../../components/ui/index.js';

function NotificationsSection({ notifications, onToggle }) {
  return (
    <Card className="space-y-6" padding="lg">
      <div>
        <h2 className="text-xl font-semibold text-primary">Notification preferences</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose how you receive real-time alerts, escalations, and platform updates.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Checkbox
          label="Security alerts"
          description="Immediate login anomalies and privileged activity alerts."
          checked={notifications.securityAlerts}
          onChange={() => onToggle('securityAlerts')}
        />
        <Checkbox
          label="Incident escalations"
          description="Pager and email notifications when incident queues require approval."
          checked={notifications.incidentEscalations}
          onChange={() => onToggle('incidentEscalations')}
        />
        <Checkbox
          label="Weekly digest"
          description="Summary of admin KPIs, audit checkpoints, and outstanding tasks."
          checked={notifications.weeklyDigest}
          onChange={() => onToggle('weeklyDigest')}
        />
        <Checkbox
          label="Product updates"
          description="New feature launches, pilots, and dashboard enhancements."
          checked={notifications.productUpdates}
          onChange={() => onToggle('productUpdates')}
        />
        <Checkbox
          label="SMS alerts"
          description="Critical escalation SMS when out of hours availability is required."
          checked={notifications.smsAlerts}
          onChange={() => onToggle('smsAlerts')}
        />
      </div>
    </Card>
  );
}

NotificationsSection.propTypes = {
  notifications: PropTypes.shape({
    securityAlerts: PropTypes.bool,
    incidentEscalations: PropTypes.bool,
    weeklyDigest: PropTypes.bool,
    productUpdates: PropTypes.bool,
    smsAlerts: PropTypes.bool
  }).isRequired,
  onToggle: PropTypes.func.isRequired
};

export default NotificationsSection;
