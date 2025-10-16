import PropTypes from 'prop-types';
import { Button, Card, FormField, TextArea, TextInput } from '../../../components/ui/index.js';
import { ACCOUNT_PRIORITY_OPTIONS, ACCOUNT_STATUS_OPTIONS } from '../constants.js';
import { READ_ONLY_MESSAGE } from '../constants.js';

export default function EnterpriseAccountSettingsCard({
  accountDraft,
  onChange,
  onSave,
  onArchive,
  saving,
  isReadOnly,
  archivedDisplay
}) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Account settings</h2>
          <p className="text-sm text-slate-600">
            Update operating cadence, escalation notes, and visual assets for the enterprise workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button to="/dashboards/enterprise/panel" size="sm" variant="ghost" target="_blank" rel="noreferrer">
            Open enterprise panel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onArchive}
            disabled={isReadOnly}
            loading={saving && !isReadOnly}
            title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
          >
            Archive account
          </Button>
        </div>
      </div>
      {isReadOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Archived programme</p>
          <p className="mt-1 text-amber-800">
            This account was archived{archivedDisplay ? ` on ${archivedDisplay}` : ''}. Records are locked for audit purposes.
          </p>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Account name" value={accountDraft.name} onChange={onChange('name')} disabled={isReadOnly} />
        <FormField id="enterprise-status" label="Status">
          <select
            id="enterprise-status"
            className="fx-text-input"
            value={accountDraft.status}
            onChange={onChange('status')}
            disabled={isReadOnly}
          >
            {ACCOUNT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="enterprise-priority" label="Priority">
          <select
            id="enterprise-priority"
            className="fx-text-input"
            value={accountDraft.priority}
            onChange={onChange('priority')}
            disabled={isReadOnly}
          >
            {ACCOUNT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <TextInput
          label="Timezone"
          value={accountDraft.timezone}
          onChange={onChange('timezone')}
          hint="Primary operating timezone"
          disabled={isReadOnly}
        />
        <TextInput
          label="Account manager"
          value={accountDraft.accountManager}
          onChange={onChange('accountManager')}
          disabled={isReadOnly}
        />
        <TextInput
          label="Support email"
          type="email"
          value={accountDraft.supportEmail}
          onChange={onChange('supportEmail')}
          disabled={isReadOnly}
        />
        <TextInput
          label="Billing email"
          type="email"
          value={accountDraft.billingEmail}
          onChange={onChange('billingEmail')}
          disabled={isReadOnly}
        />
        <TextInput
          label="Support phone"
          value={accountDraft.supportPhone}
          onChange={onChange('supportPhone')}
          disabled={isReadOnly}
        />
        <TextInput
          label="Logo URL"
          value={accountDraft.logoUrl}
          onChange={onChange('logoUrl')}
          disabled={isReadOnly}
        />
        <TextInput
          label="Hero image URL"
          value={accountDraft.heroImageUrl}
          onChange={onChange('heroImageUrl')}
          disabled={isReadOnly}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea
          label="Account notes"
          rows={4}
          value={accountDraft.notes}
          onChange={onChange('notes')}
          hint="Visible to Fixnado administrators"
          disabled={isReadOnly}
        />
        <TextArea
          label="Escalation notes"
          rows={4}
          value={accountDraft.escalationNotes}
          onChange={onChange('escalationNotes')}
          hint="Escalation ladder, compliance or regional instructions"
          disabled={isReadOnly}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onSave} loading={saving} disabled={isReadOnly}>
          Save account settings
        </Button>
      </div>
    </Card>
  );
}

EnterpriseAccountSettingsCard.propTypes = {
  accountDraft: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    timezone: PropTypes.string,
    accountManager: PropTypes.string,
    supportEmail: PropTypes.string,
    billingEmail: PropTypes.string,
    supportPhone: PropTypes.string,
    logoUrl: PropTypes.string,
    heroImageUrl: PropTypes.string,
    notes: PropTypes.string,
    escalationNotes: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  archivedDisplay: PropTypes.string
};

EnterpriseAccountSettingsCard.defaultProps = {
  saving: false,
  isReadOnly: false,
  archivedDisplay: ''
};
