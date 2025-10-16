import { useState } from 'react';
import PropTypes from 'prop-types';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import TextInput from '../../ui/TextInput.jsx';
import FormField from '../../ui/FormField.jsx';
import { ATTACHMENT_TYPES } from './constants.js';
import { generateLocalId } from './utils.js';
import AttachmentIcon from './AttachmentIcon.jsx';

function AttachmentManager({ attachments, onChange, emptyMessage, addLabel }) {
  const [draft, setDraft] = useState({ label: '', url: '', type: 'link' });
  const [error, setError] = useState(null);

  const handleAdd = () => {
    if (!draft.url.trim()) {
      setError('A URL is required');
      return;
    }
    const next = {
      id: generateLocalId(),
      url: draft.url.trim(),
      label: draft.label.trim() || draft.url.trim(),
      type: draft.type
    };
    onChange([...(attachments || []), next]);
    setDraft({ label: '', url: '', type: 'link' });
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {(attachments || []).map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-accent/10 bg-secondary px-3 py-2 text-sm text-slate-600"
          >
            <div className="flex items-center gap-3">
              <AttachmentIcon type={attachment.type} />
              <div>
                <a href={attachment.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                  {attachment.label}
                </a>
                <p className="text-xs text-slate-500">{attachment.type}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(attachments.filter((item) => item.id !== attachment.id))}
              className="text-xs font-semibold text-rose-500 hover:text-rose-400"
            >
              Remove
            </button>
          </div>
        ))}
        {(attachments || []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-accent/30 bg-secondary/60 px-3 py-2 text-xs text-slate-500">
            {emptyMessage}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <TextInput
          label="Label"
          value={draft.label}
          onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))}
        />
        <TextInput
          label="URL"
          value={draft.url}
          onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
        />
        <FormField id="attachment-type" label="Type">
          <select
            id="attachment-type"
            value={draft.type}
            onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
            className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring focus:ring-accent/40"
          >
            {ATTACHMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      <Button variant="secondary" size="sm" icon={CloudArrowUpIcon} onClick={handleAdd}>
        {addLabel}
      </Button>
    </div>
  );
}

AttachmentManager.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string,
      label: PropTypes.string,
      type: PropTypes.string
    })
  ),
  onChange: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string,
  addLabel: PropTypes.string
};

AttachmentManager.defaultProps = {
  attachments: [],
  emptyMessage: 'No attachments yet. Upload site plans, images, or supporting documentation.',
  addLabel: 'Add attachment'
};

export default AttachmentManager;
