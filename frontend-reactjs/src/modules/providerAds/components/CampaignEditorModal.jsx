import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' }
];

const TYPE_OPTIONS = [
  { value: 'ppc', label: 'PPC awareness' },
  { value: 'ppc_conversion', label: 'Conversion focused' },
  { value: 'ppi', label: 'Pay per impression' },
  { value: 'awareness', label: 'Awareness flight' }
];

const PACING_OPTIONS = [
  { value: 'even', label: 'Even pacing' },
  { value: 'asap', label: 'Accelerated' },
  { value: 'lifetime', label: 'Lifetime budget' }
];

const BID_STRATEGY_OPTIONS = [
  { value: 'cpc', label: 'Cost per click' },
  { value: 'cpm', label: 'Cost per thousand impressions' },
  { value: 'cpa', label: 'Cost per acquisition' }
];

const CURRENCY_OPTIONS = [
  { value: 'GBP', label: 'GBP' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' }
];

const DEFAULT_FORM = {
  name: '',
  objective: '',
  status: 'draft',
  campaignType: 'ppc',
  pacingStrategy: 'even',
  bidStrategy: 'cpc',
  totalBudget: '',
  dailySpendCap: '',
  startAt: '',
  endAt: '',
  currency: 'GBP',
  metadataNotes: ''
};

export default function CampaignEditorModal({ open, onClose, onSubmit, campaign }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || '',
        objective: campaign.objective || '',
        status: campaign.status || 'draft',
        campaignType: campaign.campaignType || 'ppc',
        pacingStrategy: campaign.pacingStrategy || 'even',
        bidStrategy: campaign.bidStrategy || 'cpc',
        totalBudget: campaign.totalBudget != null ? String(campaign.totalBudget) : '',
        dailySpendCap: campaign.dailySpendCap != null ? String(campaign.dailySpendCap) : '',
        startAt: campaign.startAt ? campaign.startAt.slice(0, 16) : '',
        endAt: campaign.endAt ? campaign.endAt.slice(0, 16) : '',
        currency: campaign.currency || 'GBP',
        metadataNotes: campaign.metadata?.goal || ''
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [campaign]);

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
        objective: form.objective.trim(),
        status: form.status,
        campaignType: form.campaignType,
        pacingStrategy: form.pacingStrategy,
        bidStrategy: form.bidStrategy,
        totalBudget: form.totalBudget ? Number(form.totalBudget) : null,
        dailySpendCap: form.dailySpendCap ? Number(form.dailySpendCap) : null,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        currency: form.currency,
        metadata: { goal: form.metadataNotes.trim() || undefined }
      };
      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={campaign ? 'Edit campaign' : 'Create campaign'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="campaign-name" label="Campaign name">
          <TextInput id="campaign-name" name="name" value={form.name} onChange={handleChange} required />
        </FormField>
        <FormField id="campaign-objective" label="Objective">
          <TextInput id="campaign-objective" name="objective" value={form.objective} onChange={handleChange} required />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
          <Select
            label="Campaign type"
            name="campaignType"
            value={form.campaignType}
            onChange={handleChange}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Pacing"
            name="pacingStrategy"
            value={form.pacingStrategy}
            onChange={handleChange}
            options={PACING_OPTIONS}
          />
          <Select
            label="Bid strategy"
            name="bidStrategy"
            value={form.bidStrategy}
            onChange={handleChange}
            options={BID_STRATEGY_OPTIONS}
          />
          <Select label="Currency" name="currency" value={form.currency} onChange={handleChange} options={CURRENCY_OPTIONS} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="campaign-budget" label="Total budget">
            <TextInput
              id="campaign-budget"
              name="totalBudget"
              type="number"
              min="0"
              step="0.01"
              value={form.totalBudget}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="campaign-daily-cap" label="Daily spend cap" optionalLabel="Optional">
            <TextInput
              id="campaign-daily-cap"
              name="dailySpendCap"
              type="number"
              min="0"
              step="0.01"
              value={form.dailySpendCap}
              onChange={handleChange}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="campaign-start" label="Start">
            <TextInput
              id="campaign-start"
              name="startAt"
              type="datetime-local"
              value={form.startAt}
              onChange={handleChange}
              required
            />
          </FormField>
          <FormField id="campaign-end" label="End">
            <TextInput id="campaign-end" name="endAt" type="datetime-local" value={form.endAt} onChange={handleChange} required />
          </FormField>
        </div>
        <FormField id="campaign-metadata" label="Notes" optionalLabel="Optional">
          <TextArea
            id="campaign-metadata"
            name="metadataNotes"
            rows={3}
            value={form.metadataNotes}
            onChange={handleChange}
            placeholder="Add context for teammates (only stored in metadata)."
          />
        </FormField>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {campaign ? 'Save changes' : 'Create campaign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

CampaignEditorModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    objective: PropTypes.string,
    status: PropTypes.string,
    campaignType: PropTypes.string,
    pacingStrategy: PropTypes.string,
    bidStrategy: PropTypes.string,
    totalBudget: PropTypes.number,
    dailySpendCap: PropTypes.number,
    startAt: PropTypes.string,
    endAt: PropTypes.string,
    currency: PropTypes.string,
    metadata: PropTypes.object
  })
};

CampaignEditorModal.defaultProps = {
  open: false,
  campaign: null
};
