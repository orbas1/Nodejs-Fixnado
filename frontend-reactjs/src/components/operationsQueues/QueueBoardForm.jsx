import PropTypes from 'prop-types';
import { Button, Checkbox, FormField, TextInput } from '../ui/index.js';
import { STATUS_OPTIONS } from './constants.js';
import { ensureList } from './formUtils.js';

function EditableListInput({ id, label, values, onChange, placeholder, addLabel, limit }) {
  const safeValues = ensureList(values).slice(0, limit);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="space-y-2">
        {safeValues.map((value, index) => (
          <div key={`${id}-${index}`} className="flex items-center gap-2">
            <TextInput
              id={`${id}-${index}`}
              value={value}
              onChange={(event) => {
                const next = [...safeValues];
                next[index] = event.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              inputClassName="w-full"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const next = safeValues.filter((_, idx) => idx !== index);
                onChange(next.length ? next : ['']);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          if (safeValues.length < limit) {
            onChange([...safeValues, '']);
          }
        }}
        className="mt-2"
        disabled={safeValues.length >= limit}
      >
        {addLabel}
      </Button>
    </div>
  );
}

EditableListInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  addLabel: PropTypes.string,
  limit: PropTypes.number
};

EditableListInput.defaultProps = {
  values: [],
  placeholder: undefined,
  addLabel: 'Add entry',
  limit: 10
};

export default function QueueBoardForm({
  mode,
  form,
  onChange,
  onSubmit,
  onArchive,
  onClose,
  capabilities,
  saving,
  deleting
}) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <h3 className="text-lg font-semibold text-primary">
          {mode === 'create' ? 'Create operations queue' : 'Edit operations queue'}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Update ownership, SLA metadata, and intake channels for this operations workflow.
        </p>
      </div>

      <div className="space-y-4">
        <TextInput
          label="Queue title"
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          required
        />
        <TextInput
          label="Owner"
          value={form.owner}
          onChange={(event) => onChange({ ...form, owner: event.target.value })}
          required
        />
        <FormField id="queue-summary" label="Summary">
          <textarea
            id="queue-summary"
            className="w-full rounded-2xl border border-accent/20 bg-white/80 p-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            rows={4}
            value={form.summary}
            onChange={(event) => onChange({ ...form, summary: event.target.value })}
            required
          />
        </FormField>
        <FormField id="queue-status" label="Status">
          <select
            id="queue-status"
            className="w-full rounded-2xl border border-accent/20 bg-white/80 p-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={form.status}
            onChange={(event) => onChange({ ...form, status: event.target.value })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <TextInput
          type="number"
          label="Priority"
          min={1}
          max={5}
          value={form.priority}
          onChange={(event) => onChange({ ...form, priority: event.target.value })}
        />
      </div>

      <div className="space-y-6 rounded-3xl border border-accent/10 bg-white/70 p-6">
        <h4 className="text-md font-semibold text-primary">Metadata & escalation</h4>
        <EditableListInput
          id="queue-tags"
          label="Tags"
          values={form.metadata.tags}
          onChange={(next) => onChange({ ...form, metadata: { ...form.metadata, tags: next } })}
          placeholder="Risk, Compliance, Payroll"
          addLabel="Add tag"
          limit={12}
        />
        <EditableListInput
          id="queue-watchers"
          label="Watchers"
          values={form.metadata.watchers}
          onChange={(next) => onChange({ ...form, metadata: { ...form.metadata, watchers: next } })}
          placeholder="ops-duty@example.com"
          addLabel="Add watcher"
          limit={10}
        />
        <EditableListInput
          id="queue-intake"
          label="Intake channels"
          values={form.metadata.intakeChannels}
          onChange={(next) => onChange({ ...form, metadata: { ...form.metadata, intakeChannels: next } })}
          placeholder="Ticket escalation"
          addLabel="Add channel"
          limit={10}
        />
        <TextInput
          type="number"
          label="SLA target (minutes)"
          min={0}
          max={2880}
          value={form.metadata.slaMinutes}
          onChange={(event) =>
            onChange({ ...form, metadata: { ...form.metadata, slaMinutes: event.target.value } })
          }
        />
        <TextInput
          label="Escalation contact"
          value={form.metadata.escalationContact}
          onChange={(event) =>
            onChange({ ...form, metadata: { ...form.metadata, escalationContact: event.target.value } })
          }
        />
        <TextInput
          label="Playbook URL"
          value={form.metadata.playbookUrl}
          onChange={(event) =>
            onChange({ ...form, metadata: { ...form.metadata, playbookUrl: event.target.value } })
          }
        />
        <FormField id="queue-notes" label="Notes">
          <textarea
            id="queue-notes"
            className="w-full rounded-2xl border border-accent/20 bg-white/80 p-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            rows={3}
            value={form.metadata.notes}
            onChange={(event) => onChange({ ...form, metadata: { ...form.metadata, notes: event.target.value } })}
          />
        </FormField>
        <Checkbox
          id="queue-auto-alerts"
          checked={Boolean(form.metadata.autoAlerts)}
          onChange={(event) =>
            onChange({ ...form, metadata: { ...form.metadata, autoAlerts: event.target.checked } })
          }
          label="Send automated alerts to watchers"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {mode === 'edit' && capabilities.canArchive ? (
            <Button type="button" variant="danger" onClick={onArchive} disabled={deleting}>
              {deleting ? 'Archiving…' : 'Archive queue'}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : mode === 'create' ? 'Create queue' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

QueueBoardForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.shape({
    title: PropTypes.string,
    owner: PropTypes.string,
    summary: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    metadata: PropTypes.shape({
      tags: PropTypes.arrayOf(PropTypes.string),
      watchers: PropTypes.arrayOf(PropTypes.string),
      intakeChannels: PropTypes.arrayOf(PropTypes.string),
      slaMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      escalationContact: PropTypes.string,
      playbookUrl: PropTypes.string,
      autoAlerts: PropTypes.bool,
      notes: PropTypes.string
    })
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onArchive: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  capabilities: PropTypes.shape({
    canArchive: PropTypes.bool
  }),
  saving: PropTypes.bool,
  deleting: PropTypes.bool
};

QueueBoardForm.defaultProps = {
  onArchive: undefined,
  capabilities: undefined,
  saving: false,
  deleting: false
};
