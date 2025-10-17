import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';

const CREATIVE_FORMATS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'html', label: 'HTML rich media' },
  { value: 'text', label: 'Text' },
  { value: 'carousel', label: 'Carousel' }
];

const CREATIVE_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' }
];

const DEFAULT_FORM = {
  name: '',
  format: 'image',
  status: 'draft',
  flightId: '',
  assetUrl: '',
  thumbnailUrl: '',
  headline: '',
  description: '',
  callToAction: ''
};

export default function CreativeEditorModal({ open, onClose, onSubmit, creative, campaign }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const flightOptions = useMemo(() => {
    if (!campaign) return [{ value: '', label: 'No flight selected' }];
    return [{ value: '', label: 'No flight (campaign level)' }].concat(
      (campaign.flights || []).map((flight) => ({ value: flight.id, label: flight.name }))
    );
  }, [campaign]);

  useEffect(() => {
    if (creative) {
      setForm({
        name: creative.name || '',
        format: creative.format || 'image',
        status: creative.status || 'draft',
        flightId: creative.flightId || '',
        assetUrl: creative.assetUrl || '',
        thumbnailUrl: creative.thumbnailUrl || '',
        headline: creative.headline || '',
        description: creative.description || '',
        callToAction: creative.callToAction || ''
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [creative]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        format: form.format,
        status: form.status,
        flightId: form.flightId || null,
        assetUrl: form.assetUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        headline: form.headline.trim() || null,
        description: form.description.trim() || null,
        callToAction: form.callToAction.trim() || null
      };
      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={creative ? 'Edit creative' : 'Add creative'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="creative-name" label="Creative name">
          <TextInput id="creative-name" name="name" value={form.name} onChange={handleChange} required />
        </FormField>
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Format" name="format" value={form.format} onChange={handleChange} options={CREATIVE_FORMATS} />
          <Select label="Status" name="status" value={form.status} onChange={handleChange} options={CREATIVE_STATUS} />
          <Select label="Flight" name="flightId" value={form.flightId} onChange={handleChange} options={flightOptions} />
        </div>
        <FormField id="creative-asset" label="Asset URL">
          <TextInput
            id="creative-asset"
            name="assetUrl"
            value={form.assetUrl}
            onChange={handleChange}
            placeholder="https://example.com/creative.jpg"
            required
          />
        </FormField>
        <FormField id="creative-thumb" label="Thumbnail URL" optionalLabel="Optional">
          <TextInput
            id="creative-thumb"
            name="thumbnailUrl"
            value={form.thumbnailUrl}
            onChange={handleChange}
            placeholder="https://example.com/creative-thumb.jpg"
          />
        </FormField>
        <FormField id="creative-headline" label="Headline" optionalLabel="Optional">
          <TextInput id="creative-headline" name="headline" value={form.headline} onChange={handleChange} />
        </FormField>
        <FormField id="creative-description" label="Description" optionalLabel="Optional">
          <TextArea
            id="creative-description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="creative-cta" label="Call to action" optionalLabel="Optional">
          <TextInput id="creative-cta" name="callToAction" value={form.callToAction} onChange={handleChange} />
        </FormField>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {creative ? 'Save creative' : 'Add creative'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

CreativeEditorModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  creative: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    format: PropTypes.string,
    status: PropTypes.string,
    flightId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    assetUrl: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    headline: PropTypes.string,
    description: PropTypes.string,
    callToAction: PropTypes.string
  }),
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    flights: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string
      })
    )
  })
};

CreativeEditorModal.defaultProps = {
  open: false,
  creative: null,
  campaign: null
};
