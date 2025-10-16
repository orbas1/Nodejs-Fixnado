import PropTypes from 'prop-types';
import { Button, Select, TextInput } from '../../../components/ui/index.js';
import {
  BID_STRATEGY_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  PACING_STRATEGY_OPTIONS
} from '../constants.js';

const STATUS_FORM_OPTIONS = CAMPAIGN_STATUS_OPTIONS.filter((option) => option.value !== 'all');

const CURRENCY_OPTIONS = [
  { value: 'GBP', label: 'GBP · Pound sterling' },
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'USD', label: 'USD · US dollar' }
];

export default function CampaignForm({ form, mode, onChange, onSubmit, onCancel, saving }) {
  if (!form) {
    return null;
  }

  const handleChange = (field) => (event) => {
    onChange(field, event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (onSubmit) {
      await onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <TextInput
          label="Campaign name"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Fixnado emergency response"
          required
        />
        <TextInput
          label="Owning company ID"
          value={form.companyId}
          onChange={handleChange('companyId')}
          placeholder="COMP-1234"
        />
        <TextInput
          label="Campaign objective"
          value={form.objective}
          onChange={handleChange('objective')}
          placeholder="Capture emergency bookings"
          required
        />
        <Select
          label="Campaign type"
          value={form.campaignType}
          onChange={handleChange('campaignType')}
          options={CAMPAIGN_TYPE_OPTIONS}
        />
        <Select
          label="Campaign status"
          value={form.status}
          onChange={handleChange('status')}
          options={STATUS_FORM_OPTIONS}
        />
        <Select
          label="Pacing strategy"
          value={form.pacingStrategy}
          onChange={handleChange('pacingStrategy')}
          options={PACING_STRATEGY_OPTIONS}
        />
        <Select
          label="Bid strategy"
          value={form.bidStrategy}
          onChange={handleChange('bidStrategy')}
          options={BID_STRATEGY_OPTIONS}
        />
        <Select
          label="Currency"
          value={form.currency}
          onChange={handleChange('currency')}
          options={CURRENCY_OPTIONS}
        />
        <TextInput
          label="Total budget"
          type="number"
          min="0"
          step="0.01"
          prefix={form.currency || 'GBP'}
          value={form.totalBudget}
          onChange={handleChange('totalBudget')}
          placeholder="15000"
        />
        <TextInput
          label="Daily spend cap"
          type="number"
          min="0"
          step="0.01"
          prefix={form.currency || 'GBP'}
          value={form.dailySpendCap}
          onChange={handleChange('dailySpendCap')}
          placeholder="500"
          optionalLabel="optional"
        />
        <TextInput label="Starts" type="date" value={form.startAt} onChange={handleChange('startAt')} required />
        <TextInput label="Ends" type="date" value={form.endAt} onChange={handleChange('endAt')} optionalLabel="optional" />
        <TextInput
          label="Campaign timezone"
          value={form.timezone}
          onChange={handleChange('timezone')}
          placeholder="Europe/London"
          required
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {mode === 'create' ? 'Create campaign' : 'Save changes'}
        </Button>
        {mode === 'create' ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

CampaignForm.propTypes = {
  form: PropTypes.shape({
    id: PropTypes.string,
    companyId: PropTypes.string,
    name: PropTypes.string,
    objective: PropTypes.string,
    campaignType: PropTypes.string,
    status: PropTypes.string,
    pacingStrategy: PropTypes.string,
    bidStrategy: PropTypes.string,
    currency: PropTypes.string,
    totalBudget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dailySpendCap: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    startAt: PropTypes.string,
    endAt: PropTypes.string,
    timezone: PropTypes.string
  }),
  mode: PropTypes.oneOf(['create', 'edit']),
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  saving: PropTypes.bool
};

CampaignForm.defaultProps = {
  form: null,
  mode: 'edit',
  onSubmit: undefined,
  onCancel: undefined,
  saving: false
};
