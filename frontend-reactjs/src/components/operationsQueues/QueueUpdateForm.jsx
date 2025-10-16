import PropTypes from 'prop-types';
import { Button, FormField, TextInput } from '../ui/index.js';
import { TONE_OPTIONS } from './constants.js';
import { toLocalDateInputValue } from './formUtils.js';

function AttachmentFields({ attachments, onChange }) {
  const entries = attachments.length ? attachments : [{ label: '', url: '', type: 'link' }];
  return (
    <div className="space-y-3">
      {entries.map((attachment, index) => (
        <div key={`attachment-${index}`} className="rounded-2xl border border-accent/10 bg-white/70 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput
              label="Label"
              value={attachment.label}
              onChange={(event) => {
                const next = [...entries];
                next[index] = { ...next[index], label: event.target.value };
                onChange(next);
              }}
              optionalLabel="Optional"
            />
            <TextInput
              label="Link"
              value={attachment.url}
              onChange={(event) => {
                const next = [...entries];
                next[index] = { ...next[index], url: event.target.value };
                onChange(next);
              }}
              required
            />
            <TextInput
              label="Type"
              value={attachment.type}
              onChange={(event) => {
                const next = [...entries];
                next[index] = { ...next[index], type: event.target.value };
                onChange(next);
              }}
              optionalLabel="Optional"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const next = entries.filter((_, idx) => idx !== index);
                onChange(next.length ? next : []);
              }}
            >
              Remove attachment
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...entries, { label: '', url: '', type: 'link' }])}>
        Add attachment
      </Button>
    </div>
  );
}

AttachmentFields.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      url: PropTypes.string,
      type: PropTypes.string
    })
  ),
  onChange: PropTypes.func.isRequired
};

AttachmentFields.defaultProps = {
  attachments: []
};

export default function QueueUpdateForm({ mode, form, onChange, onSubmit, saving, onCancel }) {
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
          {mode === 'create' ? 'Log new update' : 'Edit update'}
        </h3>
        <p className="mt-1 text-sm text-slate-600">Summarise progress, attach runbooks, and timestamp the update.</p>
      </div>
      <TextInput
        label="Headline"
        value={form.headline}
        onChange={(event) => onChange({ ...form, headline: event.target.value })}
        required
      />
      <FormField id="queue-update-body" label="Details">
        <textarea
          id="queue-update-body"
          className="w-full rounded-2xl border border-accent/20 bg-white/80 p-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          rows={4}
          value={form.body}
          onChange={(event) => onChange({ ...form, body: event.target.value })}
        />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="queue-update-tone" label="Tone">
          <select
            id="queue-update-tone"
            className="w-full rounded-2xl border border-accent/20 bg-white/80 p-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={form.tone}
            onChange={(event) => onChange({ ...form, tone: event.target.value })}
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <TextInput
          type="datetime-local"
          label="Recorded at"
          value={toLocalDateInputValue(form.recordedAt)}
          onChange={(event) => onChange({ ...form, recordedAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
        />
      </div>
      <AttachmentFields attachments={form.attachments} onChange={(next) => onChange({ ...form, attachments: next })} />
      <div className="flex justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : mode === 'create' ? 'Publish update' : 'Save update'}
        </Button>
      </div>
    </form>
  );
}

QueueUpdateForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.shape({
    headline: PropTypes.string,
    body: PropTypes.string,
    tone: PropTypes.string,
    recordedAt: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string
      })
    )
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  onCancel: PropTypes.func
};

QueueUpdateForm.defaultProps = {
  saving: false,
  onCancel: undefined
};
