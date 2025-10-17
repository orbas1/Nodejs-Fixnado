import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';

const SEGMENT_TYPES = [
  { value: 'lookalike', label: 'Lookalike audience' },
  { value: 'custom', label: 'Custom upload' },
  { value: 'retargeting', label: 'Retargeting' },
  { value: 'crm', label: 'CRM sync' }
];

const SEGMENT_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' }
];

const DEFAULT_METADATA_TEMPLATE = `{
  "source": ""
}`;

const DEFAULT_FORM = {
  name: '',
  segmentType: 'custom',
  status: 'draft',
  sizeEstimate: '',
  engagementRate: '',
  syncedAt: '',
  metadata: DEFAULT_METADATA_TEMPLATE
};

export default function AudienceSegmentModal({ open, onClose, onSubmit, segment }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (segment) {
        setForm({
          name: segment.name || '',
          segmentType: segment.segmentType || 'custom',
          status: segment.status || 'draft',
          sizeEstimate: segment.sizeEstimate != null ? String(segment.sizeEstimate) : '',
          engagementRate: segment.engagementRate != null ? String(segment.engagementRate) : '',
          syncedAt: segment.syncedAt ? segment.syncedAt.slice(0, 16) : '',
          metadata: segment.metadata ? JSON.stringify(segment.metadata, null, 2) : DEFAULT_METADATA_TEMPLATE
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setError(null);
    } else {
      setForm(DEFAULT_FORM);
      setError(null);
    }
  }, [open, segment]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let metadata = {};
      if (form.metadata.trim()) {
        try {
          metadata = JSON.parse(form.metadata);
        } catch (parseError) {
          console.debug('[AudienceSegmentModal] metadata parse failure', parseError);
          throw new Error('Metadata must be valid JSON.');
        }
      }

      const payload = {
        name: form.name.trim(),
        segmentType: form.segmentType,
        status: form.status,
        sizeEstimate: form.sizeEstimate ? Number(form.sizeEstimate) : null,
        engagementRate: form.engagementRate ? Number(form.engagementRate) : null,
        syncedAt: form.syncedAt ? new Date(form.syncedAt).toISOString() : null,
        metadata
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={segment ? 'Edit audience segment' : 'Add audience segment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="segment-name" label="Segment name">
          <TextInput
            id="segment-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enterprise FM leads"
            required
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Type" name="segmentType" value={form.segmentType} onChange={handleChange} options={SEGMENT_TYPES} />
          <Select label="Status" name="status" value={form.status} onChange={handleChange} options={SEGMENT_STATUS} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="segment-size" label="Size estimate" optionalLabel="Optional">
            <TextInput
              id="segment-size"
              name="sizeEstimate"
              type="number"
              min="0"
              step="1"
              value={form.sizeEstimate}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="segment-engagement" label="Engagement rate" optionalLabel="Optional">
            <TextInput
              id="segment-engagement"
              name="engagementRate"
              type="number"
              min="0"
              max="1"
              step="0.001"
              value={form.engagementRate}
              onChange={handleChange}
            />
          </FormField>
        </div>
        <FormField id="segment-synced" label="Last sync" optionalLabel="Optional">
          <TextInput
            id="segment-synced"
            name="syncedAt"
            type="datetime-local"
            value={form.syncedAt}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="segment-metadata" label="Metadata" optionalLabel="JSON">
          <TextArea
            id="segment-metadata"
            name="metadata"
            rows={4}
            value={form.metadata}
            onChange={handleChange}
            placeholder={`{
  "source": "crm",
  "priority": "tier-1"
}`}
          />
        </FormField>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-600">{error}</div>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {segment ? 'Save segment' : 'Add segment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

AudienceSegmentModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  segment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    segmentType: PropTypes.string,
    status: PropTypes.string,
    sizeEstimate: PropTypes.number,
    engagementRate: PropTypes.number,
    syncedAt: PropTypes.string,
    metadata: PropTypes.object
  })
};

AudienceSegmentModal.defaultProps = {
  open: false,
  segment: null
};
