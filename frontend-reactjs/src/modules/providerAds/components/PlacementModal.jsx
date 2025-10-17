import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';

const CHANNEL_OPTIONS = [
  { value: 'marketplace', label: 'Gigvora marketplace' },
  { value: 'network', label: 'Programmatic network' },
  { value: 'search', label: 'Search syndication' },
  { value: 'social', label: 'Social lead ads' },
  { value: 'newsletter', label: 'Newsletter sponsorship' }
];

const FORMAT_OPTIONS = [
  { value: 'native', label: 'Native card' },
  { value: 'banner', label: 'Banner' },
  { value: 'video', label: 'Video' },
  { value: 'email', label: 'Email slot' },
  { value: 'article', label: 'Sponsored article' }
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' }
];

const DEFAULT_METADATA_TEMPLATE = `{
  "position": "homepage"
}`;

const DEFAULT_FORM = {
  channel: 'marketplace',
  format: 'native',
  status: 'planned',
  flightId: '',
  bidAmount: '',
  bidCurrency: 'GBP',
  cpm: '',
  inventorySource: '',
  metadata: DEFAULT_METADATA_TEMPLATE
};

export default function PlacementModal({ open, onClose, onSubmit, placement, campaign }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const flightOptions = useMemo(() => {
    if (!campaign) return [{ value: '', label: 'No flight' }];
    return [{ value: '', label: 'Campaign level' }].concat(
      (campaign.flights || []).map((flight) => ({ value: flight.id, label: flight.name }))
    );
  }, [campaign]);

  useEffect(() => {
    if (open) {
      if (placement) {
        setForm({
          channel: placement.channel || 'marketplace',
          format: placement.format || 'native',
          status: placement.status || 'planned',
          flightId: placement.flightId || '',
          bidAmount: placement.bidAmount != null ? String(placement.bidAmount) : '',
          bidCurrency: placement.bidCurrency || 'GBP',
          cpm: placement.cpm != null ? String(placement.cpm) : '',
          inventorySource: placement.inventorySource || '',
          metadata: placement.metadata ? JSON.stringify(placement.metadata, null, 2) : DEFAULT_METADATA_TEMPLATE
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setError(null);
    } else {
      setForm(DEFAULT_FORM);
      setError(null);
    }
  }, [open, placement]);

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
          console.debug('[PlacementModal] metadata parse failure', parseError);
          throw new Error('Metadata must be valid JSON.');
        }
      }

      const payload = {
        channel: form.channel,
        format: form.format,
        status: form.status,
        flightId: form.flightId || null,
        bidAmount: form.bidAmount ? Number(form.bidAmount) : null,
        bidCurrency: form.bidCurrency || 'GBP',
        cpm: form.cpm ? Number(form.cpm) : null,
        inventorySource: form.inventorySource.trim() || null,
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

  const title = placement ? 'Edit placement' : 'Add placement';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Channel" name="channel" value={form.channel} onChange={handleChange} options={CHANNEL_OPTIONS} />
          <Select label="Format" name="format" value={form.format} onChange={handleChange} options={FORMAT_OPTIONS} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
          <Select label="Flight" name="flightId" value={form.flightId} onChange={handleChange} options={flightOptions} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="placement-bid" label="Bid amount">
            <TextInput
              id="placement-bid"
              name="bidAmount"
              type="number"
              min="0"
              step="0.01"
              value={form.bidAmount}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="placement-bid-currency" label="Currency">
            <TextInput
              id="placement-bid-currency"
              name="bidCurrency"
              value={form.bidCurrency}
              onChange={handleChange}
              maxLength={3}
            />
          </FormField>
          <FormField id="placement-cpm" label="CPM" optionalLabel="Optional">
            <TextInput
              id="placement-cpm"
              name="cpm"
              type="number"
              min="0"
              step="0.01"
              value={form.cpm}
              onChange={handleChange}
            />
          </FormField>
        </div>
        <FormField id="placement-source" label="Inventory source" optionalLabel="Optional">
          <TextInput
            id="placement-source"
            name="inventorySource"
            value={form.inventorySource}
            onChange={handleChange}
            placeholder="Gigvora marketplace hero"
          />
        </FormField>
        <FormField id="placement-metadata" label="Metadata" optionalLabel="JSON">
          <TextArea
            id="placement-metadata"
            name="metadata"
            rows={4}
            value={form.metadata}
            onChange={handleChange}
            placeholder={`{
  "position": "homepage-top"
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
            {placement ? 'Save placement' : 'Add placement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

PlacementModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  placement: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    channel: PropTypes.string,
    format: PropTypes.string,
    status: PropTypes.string,
    flightId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bidAmount: PropTypes.number,
    bidCurrency: PropTypes.string,
    cpm: PropTypes.number,
    inventorySource: PropTypes.string,
    metadata: PropTypes.object
  }),
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    flights: PropTypes.array
  })
};

PlacementModal.defaultProps = {
  open: false,
  placement: null,
  campaign: null
};
