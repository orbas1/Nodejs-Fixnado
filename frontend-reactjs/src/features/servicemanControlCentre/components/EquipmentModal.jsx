import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Button from '../../../components/ui/Button.jsx';

const STATUS_OPTIONS = [
  { value: 'ready', label: 'Ready for use' },
  { value: 'maintenance', label: 'In maintenance' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'retired', label: 'Retired' }
];

function SelectField({ id, label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600" htmlFor={id}>
      <span className="font-medium text-slate-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

SelectField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired
};

export default function EquipmentModal({ open, onClose, onSubmit, initialValue, saving }) {
  const defaultValue = useMemo(
    () => ({
      name: '',
      serialNumber: '',
      status: 'ready',
      maintenanceDueOn: '',
      assignedAt: '',
      imageUrl: '',
      notes: ''
    }),
    []
  );

  const [formState, setFormState] = useState(defaultValue);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setFormState({ ...defaultValue, ...initialValue });
      setError(null);
    }
  }, [defaultValue, initialValue, open]);

  const handleChange = (field) => (event) => {
    setFormState((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(formState);
      onClose();
    } catch (err) {
      setError(err?.body?.message || err?.message || 'Unable to save equipment');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initialValue?.id ? 'Edit equipment' : 'Add equipment'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput id="equipment-name" label="Equipment name" value={formState.name} onChange={handleChange('name')} required />
        <TextInput
          id="equipment-serial"
          label="Serial or identifier"
          value={formState.serialNumber ?? ''}
          onChange={handleChange('serialNumber')}
        />
        <SelectField
          id="equipment-status"
          label="Status"
          value={formState.status}
          onChange={handleChange('status')}
          options={STATUS_OPTIONS}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            id="equipment-maintenance"
            label="Maintenance due"
            type="date"
            value={formState.maintenanceDueOn ?? ''}
            onChange={handleChange('maintenanceDueOn')}
          />
          <TextInput
            id="equipment-assigned"
            label="Assigned on"
            type="date"
            value={formState.assignedAt ?? ''}
            onChange={handleChange('assignedAt')}
          />
        </div>
        <TextInput
          id="equipment-image"
          label="Image URL"
          placeholder="https://"
          value={formState.imageUrl ?? ''}
          onChange={handleChange('imageUrl')}
        />
        <TextInput
          id="equipment-notes"
          label="Notes"
          placeholder="Optional notes for this asset"
          value={formState.notes ?? ''}
          onChange={handleChange('notes')}
        />
        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save equipment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

EquipmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValue: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    serialNumber: PropTypes.string,
    status: PropTypes.string,
    maintenanceDueOn: PropTypes.string,
    assignedAt: PropTypes.string,
    imageUrl: PropTypes.string,
    notes: PropTypes.string
  }),
  saving: PropTypes.bool
};

EquipmentModal.defaultProps = {
  initialValue: undefined,
  saving: false
};
