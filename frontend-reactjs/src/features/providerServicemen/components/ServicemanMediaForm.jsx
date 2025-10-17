import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

function buildDefaultMedia(enums) {
  return {
    id: null,
    url: '',
    label: '',
    type: enums?.mediaTypes?.[0]?.value ?? 'gallery',
    isPrimary: false,
    sortOrder: 0,
    notes: ''
  };
}

export default function ServicemanMediaForm({
  media,
  onChange,
  onSave,
  enums,
  disabled,
  saving,
  message,
  error
}) {
  const handleUpdate = (index, updates) => {
    const next = media.map((item, idx) => {
      if (idx !== index) {
        return item;
      }
      const merged = { ...item, ...updates };
      return merged;
    });

    if (updates.isPrimary) {
      for (let idx = 0; idx < next.length; idx += 1) {
        next[idx] = { ...next[idx], isPrimary: idx === index };
      }
    }

    onChange(next);
  };

  const handleRemove = (index) => {
    const next = media.filter((_, idx) => idx !== index);
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...media, buildDefaultMedia(enums)]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Media & documentation</h4>
        {message ? <StatusPill tone="success">{message}</StatusPill> : null}
      </div>
      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      <div className={`space-y-3 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {media.length === 0 ? (
          <p className="text-xs text-slate-500">Add gallery images, certification scans, or a profile portrait.</p>
        ) : null}
        <ul className="space-y-3">
          {media.map((item, index) => (
            <li key={item.id ?? `media-${index}`} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField id={`media-url-${index}`} label="Media URL" required>
                  <TextInput
                    id={`media-url-${index}`}
                    value={item.url}
                    onChange={(event) => handleUpdate(index, { url: event.target.value })}
                    required
                  />
                </FormField>
                <FormField id={`media-type-${index}`} label="Type">
                  <select
                    id={`media-type-${index}`}
                    value={item.type}
                    onChange={(event) => handleUpdate(index, { type: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {(enums?.mediaTypes ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField id={`media-label-${index}`} label="Label">
                  <TextInput
                    id={`media-label-${index}`}
                    value={item.label}
                    onChange={(event) => handleUpdate(index, { label: event.target.value })}
                  />
                </FormField>
                <FormField id={`media-sort-${index}`} label="Sort order">
                  <TextInput
                    id={`media-sort-${index}`}
                    type="number"
                    value={item.sortOrder}
                    onChange={(event) => handleUpdate(index, { sortOrder: Number(event.target.value) })}
                  />
                </FormField>
              </div>
              <FormField id={`media-notes-${index}`} label="Notes">
                <TextArea
                  id={`media-notes-${index}`}
                  rows={3}
                  value={item.notes ?? ''}
                  onChange={(event) => handleUpdate(index, { notes: event.target.value })}
                />
              </FormField>
              <div className="mt-3 flex items-center justify-between">
                <Checkbox
                  label="Primary"
                  checked={Boolean(item.isPrimary)}
                  onChange={(event) => handleUpdate(index, { isPrimary: event.target.checked })}
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => handleRemove(index)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleAdd}>
            Add media
          </Button>
          <Button type="button" variant="primary" size="sm" loading={saving} onClick={onSave}>
            Save media
          </Button>
        </div>
        {disabled ? (
          <p className="text-xs text-slate-500">Create the serviceman before uploading gallery or certification records.</p>
        ) : null}
      </div>
    </div>
  );
}

ServicemanMediaForm.propTypes = {
  media: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      url: PropTypes.string,
      label: PropTypes.string,
      type: PropTypes.string,
      isPrimary: PropTypes.bool,
      sortOrder: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  enums: PropTypes.shape({
    mediaTypes: PropTypes.array
  }),
  disabled: PropTypes.bool,
  saving: PropTypes.bool,
  message: PropTypes.string,
  error: PropTypes.string
};

ServicemanMediaForm.defaultProps = {
  enums: {},
  disabled: false,
  saving: false,
  message: null,
  error: null
};
