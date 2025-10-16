import PropTypes from 'prop-types';
import { Button, Checkbox, Select, TextInput } from '../../../components/ui/index.js';
import InlineAlert from './InlineAlert.jsx';

function RecipientsSettingsPanel({
  recipients,
  recipientDraft,
  onDraftChange,
  onCreate,
  onUpdate,
  onDelete,
  saving,
  alert,
  roleOptions,
  channelOptions
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notification routing</p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">Escalation contacts</h3>
          <p className="mt-1 text-sm text-slate-500">
            Decide who receives dispatch escalations, escrow decisions, and concierge follow-ups.
          </p>
        </div>
      </div>

      <form onSubmit={onCreate} className="mt-6 grid gap-4 md:grid-cols-5">
        <TextInput
          className="md:col-span-2"
          label="Contact name"
          value={recipientDraft.label}
          onChange={(event) => onDraftChange('label', event.target.value)}
          required
        />
        <Select
          label="Channel"
          value={recipientDraft.channel}
          onChange={(event) => onDraftChange('channel', event.target.value)}
          required
        >
          {channelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <TextInput
          label="Destination"
          value={recipientDraft.target}
          onChange={(event) => onDraftChange('target', event.target.value)}
          placeholder="finance@example.com"
          required
        />
        <Select
          label="Role allowance"
          value={recipientDraft.role}
          onChange={(event) => onDraftChange('role', event.target.value)}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="md:col-span-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Checkbox
            label="Enabled"
            checked={recipientDraft.enabled}
            onChange={(event) => onDraftChange('enabled', event.target.checked)}
          />
          <div className="flex items-center gap-3">
            <InlineAlert tone={alert?.type} message={alert?.message} />
            <Button type="submit" loading={saving} disabled={saving}>
              Add contact
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {recipients.length === 0 ? (
          <p className="text-sm text-slate-500">
            No additional recipients yet. Add finance approvers, facilities managers, or concierge contacts above.
          </p>
        ) : (
          recipients.map((recipient) => (
            <div
              key={recipient.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-primary">{recipient.label}</p>
                <p className="text-sm text-slate-500">
                  {recipient.channel.toUpperCase()} • {recipient.target}
                </p>
                <p className="text-xs text-slate-400">Last updated {recipient.updatedAt?.slice?.(0, 10) ?? 'recently'}</p>
              </div>
              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                <Select
                  value={recipient.role}
                  onChange={(event) => onUpdate(recipient.id, { role: event.target.value })}
                  aria-label={`Role for ${recipient.label}`}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Checkbox
                  label={recipient.enabled ? 'Enabled' : 'Paused'}
                  checked={recipient.enabled}
                  onChange={(event) => onUpdate(recipient.id, { enabled: event.target.checked })}
                />
                <Button type="button" variant="ghost" onClick={() => onDelete(recipient.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

RecipientsSettingsPanel.propTypes = {
  recipients: PropTypes.arrayOf(PropTypes.object).isRequired,
  recipientDraft: PropTypes.shape({
    label: PropTypes.string,
    channel: PropTypes.string,
    target: PropTypes.string,
    role: PropTypes.string,
    enabled: PropTypes.bool
  }).isRequired,
  onDraftChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  alert: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  }),
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  channelOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired
};

RecipientsSettingsPanel.defaultProps = {
  alert: null
};

export default RecipientsSettingsPanel;
