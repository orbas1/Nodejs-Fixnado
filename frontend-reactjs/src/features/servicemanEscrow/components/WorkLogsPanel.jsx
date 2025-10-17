import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, TextArea, TextInput } from '../../../components/ui/index.js';
import FormField from '../../../components/ui/FormField.jsx';

const LOG_TYPES = [
  { value: 'update', label: 'Progress update' },
  { value: 'issue', label: 'Issue discovered' },
  { value: 'handover', label: 'Handover' },
  { value: 'evidence', label: 'Evidence submitted' }
];

function toFormState(initialValue = null) {
  return {
    logType: initialValue?.logType ?? 'update',
    milestoneId: initialValue?.milestoneId ?? '',
    durationMinutes:
      initialValue?.durationMinutes != null && Number.isFinite(Number(initialValue.durationMinutes))
        ? String(initialValue.durationMinutes)
        : '',
    evidenceUrl: initialValue?.evidenceUrl ?? '',
    note: initialValue?.note ?? ''
  };
}

function WorkLogForm({ milestones, onSubmit, submitting, initialValue, submitLabel, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initialValue));

  useEffect(() => {
    setForm(toFormState(initialValue));
  }, [initialValue]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.note && !form.evidenceUrl) {
      return;
    }
    const payload = {
      logType: form.logType,
      milestoneId: form.milestoneId || null,
      durationMinutes: form.durationMinutes ? Number.parseInt(form.durationMinutes, 10) : null,
      evidenceUrl: form.evidenceUrl || null,
      note: form.note
    };
    const result = await onSubmit(payload);
    if (result) {
      if (initialValue) {
        onCancel?.();
      } else {
        setForm(toFormState());
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <FormField id="work-log-type" label="Entry type">
          <select
            id="work-log-type"
            className="fx-text-input"
            value={form.logType}
            onChange={(event) => handleChange('logType', event.target.value)}
          >
            {LOG_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="work-log-milestone" label="Linked milestone">
          <select
            id="work-log-milestone"
            className="fx-text-input"
            value={form.milestoneId}
            onChange={(event) => handleChange('milestoneId', event.target.value)}
          >
            <option value="">Not linked</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput
          label="Duration (minutes)"
          type="number"
          min="0"
          value={form.durationMinutes}
          onChange={(event) => handleChange('durationMinutes', event.target.value)}
        />
        <TextInput
          label="Evidence URL"
          value={form.evidenceUrl}
          onChange={(event) => handleChange('evidenceUrl', event.target.value)}
          placeholder="Link to photos or documents"
        />
      </div>
      <TextArea
        label="Notes"
        value={form.note}
        minRows={3}
        onChange={(event) => handleChange('note', event.target.value)}
        placeholder="Add field observations, outstanding tasks, or customer confirmations"
      />
      <div className="flex justify-end">
        {initialValue ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onCancel?.()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting || (!form.note && !form.evidenceUrl)}>
              {submitLabel}
            </Button>
          </div>
        ) : (
          <Button type="submit" size="sm" disabled={submitting || (!form.note && !form.evidenceUrl)}>
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}

WorkLogForm.propTypes = {
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  initialValue: PropTypes.shape({
    id: PropTypes.string,
    logType: PropTypes.string,
    note: PropTypes.string,
    durationMinutes: PropTypes.number,
    evidenceUrl: PropTypes.string,
    milestoneId: PropTypes.string
  }),
  submitLabel: PropTypes.string,
  onCancel: PropTypes.func
};

WorkLogForm.defaultProps = {
  milestones: [],
  submitting: false,
  initialValue: null,
  submitLabel: 'Log update',
  onCancel: undefined
};

export default function WorkLogsPanel({ logs, milestones, onCreate, onUpdate, onDelete, saving }) {
  const milestoneLookup = useMemo(() => {
    const map = new Map();
    milestones.forEach((milestone) => {
      map.set(milestone.id, milestone.label);
    });
    return map;
  }, [milestones]);
  const [editingId, setEditingId] = useState(null);

  return (
    <Card className="space-y-4 border-slate-200 bg-white/90 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Work logs</h3>
          <p className="text-xs text-slate-500">
            Capture progress, evidence, and field observations. Entries sync with the finance team for release decisions.
          </p>
        </div>
      </div>
      <WorkLogForm milestones={milestones} onSubmit={onCreate} submitting={saving} submitLabel="Log update" />
      <div className="space-y-4">
        {logs.length ? (
          logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-200 bg-secondary/60 p-4">
              {editingId === log.id ? (
                <WorkLogForm
                  key={`${log.id}-editor`}
                  milestones={milestones}
                  onSubmit={(payload) => onUpdate(log.id, payload)}
                  submitting={saving}
                  initialValue={log}
                  submitLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary capitalize">{log.logType}</p>
                      <p className="text-xs text-slate-500">
                        {log.milestoneId ? `Linked to ${milestoneLookup.get(log.milestoneId) || 'milestone'}` : 'Not linked'}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {log.durationMinutes ? `${log.durationMinutes} min • ` : ''}
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {log.note ? <p className="mt-3 text-sm text-slate-700">{log.note}</p> : null}
                  {log.evidenceUrl ? (
                    <a
                      href={log.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary"
                    >
                      View evidence
                    </a>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditingId(log.id)}
                      disabled={saving}
                    >
                      Edit entry
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => onUpdate(log.id, { logType: log.logType === 'update' ? 'handover' : 'update' })}
                      disabled={saving}
                    >
                      Toggle type
                    </Button>
                    <Button type="button" size="xs" variant="ghost" onClick={() => onDelete(log.id)} disabled={saving}>
                      Remove
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No work logs recorded yet. Use this space to keep finance and support in sync.</p>
        )}
      </div>
    </Card>
  );
}

WorkLogsPanel.propTypes = {
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      logType: PropTypes.string.isRequired,
      note: PropTypes.string,
      durationMinutes: PropTypes.number,
      evidenceUrl: PropTypes.string,
      milestoneId: PropTypes.string,
      createdAt: PropTypes.string
    })
  ),
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

WorkLogsPanel.defaultProps = {
  logs: [],
  milestones: [],
  saving: false
};
