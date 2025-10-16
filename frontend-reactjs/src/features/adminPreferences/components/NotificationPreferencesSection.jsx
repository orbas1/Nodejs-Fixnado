import PropTypes from 'prop-types';
import { BellAlertIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';
import { ensureNonEmptyList } from '../state.js';

export default function NotificationPreferencesSection({
  notifications,
  onToggle,
  onFieldChange,
  onListChange,
  onAddEmail,
  onRemoveEmail
}) {
  const escalationEmails = ensureNonEmptyList(notifications.escalationEmails);

  return (
    <Card padding="lg" className="border border-indigo-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-primary">
            <BellAlertIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
            Escalations & notifications
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Control how the platform alerts the duty team about incidents and daily performance.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Checkbox
            label="Email alerts enabled"
            checked={notifications.emailEnabled}
            onChange={onToggle('emailEnabled')}
          />
          <Checkbox label="SMS alerts enabled" checked={notifications.smsEnabled} onChange={onToggle('smsEnabled')} />
          <Checkbox
            label="Push notifications enabled"
            checked={notifications.pushEnabled}
            onChange={onToggle('pushEnabled')}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Daily digest hour"
            type="number"
            min="0"
            max="23"
            value={notifications.dailyDigestHour}
            onChange={(event) => onFieldChange('dailyDigestHour', event.target.value)}
          />
          <TextInput
            label="Digest timezone"
            value={notifications.digestTimezone}
            onChange={(event) => onFieldChange('digestTimezone', event.target.value)}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Escalation email list</h3>
            <Button variant="ghost" size="sm" icon={PlusIcon} onClick={onAddEmail}>
              Add email
            </Button>
          </div>
          <div className="space-y-3">
            {escalationEmails.map((email, index) => (
              <div key={`escalation-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <TextInput
                    label={`Escalation email ${index + 1}`}
                    type="email"
                    value={email}
                    onChange={(event) => onListChange(index, event.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  icon={TrashIcon}
                  aria-label={`Remove escalation email ${index + 1}`}
                  onClick={() => onRemoveEmail(index)}
                  disabled={notifications.escalationEmails.length === 0}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
        <TextInput
          label="Incident webhook URL"
          hint="Optional URL for PagerDuty, Slack, or custom incident ingestion."
          value={notifications.incidentWebhookUrl}
          onChange={(event) => onFieldChange('incidentWebhookUrl', event.target.value)}
        />
      </div>
    </Card>
  );
}

NotificationPreferencesSection.propTypes = {
  notifications: PropTypes.shape({
    emailEnabled: PropTypes.bool.isRequired,
    smsEnabled: PropTypes.bool.isRequired,
    pushEnabled: PropTypes.bool.isRequired,
    dailyDigestHour: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    digestTimezone: PropTypes.string.isRequired,
    escalationEmails: PropTypes.arrayOf(PropTypes.string).isRequired,
    incidentWebhookUrl: PropTypes.string.isRequired
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onListChange: PropTypes.func.isRequired,
  onAddEmail: PropTypes.func.isRequired,
  onRemoveEmail: PropTypes.func.isRequired
};
