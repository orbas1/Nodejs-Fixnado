import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' }
];

const DEFAULT_FORM = {
  name: '',
  status: 'scheduled',
  startAt: '',
  endAt: '',
  budget: '',
  dailySpendCap: ''
};

export default function FlightEditorModal({ open, onClose, onSubmit, campaign }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
    }
  }, [open]);

  useEffect(() => {
    if (campaign) {
      setForm((current) => ({ ...current, status: 'scheduled' }));
    }
  }, [campaign]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        status: form.status,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        budget: form.budget ? Number(form.budget) : null,
        dailySpendCap: form.dailySpendCap ? Number(form.dailySpendCap) : null
      };

      await onSubmit(payload);
      setForm(DEFAULT_FORM);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Add flight${campaign ? ` for ${campaign.name}` : ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="flight-name" label="Flight name">
          <TextInput
            id="flight-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enterprise lead burst"
            required
          />
        </FormField>
        <Select label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="flight-start" label="Start">
            <TextInput
              id="flight-start"
              name="startAt"
              type="datetime-local"
              value={form.startAt}
              onChange={handleChange}
              required
            />
          </FormField>
          <FormField id="flight-end" label="End">
            <TextInput
              id="flight-end"
              name="endAt"
              type="datetime-local"
              value={form.endAt}
              onChange={handleChange}
              required
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="flight-budget" label="Flight budget">
            <TextInput
              id="flight-budget"
              name="budget"
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="flight-daily-cap" label="Daily spend cap" optionalLabel="Optional">
            <TextInput
              id="flight-daily-cap"
              name="dailySpendCap"
              type="number"
              min="0"
              step="0.01"
              value={form.dailySpendCap}
              onChange={handleChange}
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            Add flight
          </Button>
        </div>
      </form>
    </Modal>
  );
}

FlightEditorModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string
  })
};

FlightEditorModal.defaultProps = {
  open: false,
  campaign: null
};
