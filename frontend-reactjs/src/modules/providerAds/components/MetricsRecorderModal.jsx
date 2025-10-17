import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Button from '../../../components/ui/Button.jsx';

const DEFAULT_FORM = {
  metricDate: '',
  spend: '',
  revenue: '',
  impressions: '',
  clicks: '',
  conversions: ''
};

export default function MetricsRecorderModal({ open, onClose, onSubmit, campaign }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const today = new Date();
      const isoDate = today.toISOString().slice(0, 10);
      setForm((current) => ({ ...current, metricDate: isoDate }));
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        metricDate: form.metricDate ? new Date(form.metricDate).toISOString() : new Date().toISOString(),
        spend: form.spend ? Number(form.spend) : 0,
        revenue: form.revenue ? Number(form.revenue) : 0,
        impressions: form.impressions ? Number(form.impressions) : 0,
        clicks: form.clicks ? Number(form.clicks) : 0,
        conversions: form.conversions ? Number(form.conversions) : 0
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const campaignName = campaign?.name || 'campaign';

  return (
    <Modal open={open} onClose={onClose} title={`Log metrics for ${campaignName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="metrics-date" label="Metric date">
          <TextInput
            id="metrics-date"
            name="metricDate"
            type="date"
            value={form.metricDate}
            onChange={handleChange}
            required
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="metrics-spend" label="Spend">
            <TextInput
              id="metrics-spend"
              name="spend"
              type="number"
              min="0"
              step="0.01"
              value={form.spend}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="metrics-revenue" label="Revenue">
            <TextInput
              id="metrics-revenue"
              name="revenue"
              type="number"
              min="0"
              step="0.01"
              value={form.revenue}
              onChange={handleChange}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="metrics-impressions" label="Impressions">
            <TextInput
              id="metrics-impressions"
              name="impressions"
              type="number"
              min="0"
              step="1"
              value={form.impressions}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="metrics-clicks" label="Clicks">
            <TextInput
              id="metrics-clicks"
              name="clicks"
              type="number"
              min="0"
              step="1"
              value={form.clicks}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="metrics-conversions" label="Conversions">
            <TextInput
              id="metrics-conversions"
              name="conversions"
              type="number"
              min="0"
              step="1"
              value={form.conversions}
              onChange={handleChange}
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            Log metrics
          </Button>
        </div>
      </form>
    </Modal>
  );
}

MetricsRecorderModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string
  })
};

MetricsRecorderModal.defaultProps = {
  open: false,
  campaign: null
};
