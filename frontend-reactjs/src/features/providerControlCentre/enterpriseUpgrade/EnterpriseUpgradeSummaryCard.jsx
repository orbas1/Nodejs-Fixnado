import PropTypes from 'prop-types';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import { FEATURE_OPTIONS, STATUS_OPTIONS } from './constants.js';

function EnterpriseUpgradeSummaryCard({
  form,
  record,
  statusTone,
  onFieldChange,
  onFeatureToggle,
  format
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <StatusPill tone={statusTone}>{form.status.replaceAll('_', ' ')}</StatusPill>
            {record?.requestedAt ? <span>Requested {format.dateTime(record.requestedAt)}</span> : null}
            {record?.lastDecisionAt ? <span>Decision {format.dateTime(record.lastDecisionAt)}</span> : null}
          </div>
          <TextArea
            label="Executive summary"
            value={form.summary}
            onChange={(event) => onFieldChange('summary', event.target.value)}
            placeholder="Outline enterprise goals, expected impact, and executive sponsors."
            minRows={3}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-1/2">
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(event) => onFieldChange('status', event.target.value)}
              options={STATUS_OPTIONS}
            />
          </FormField>
          <TextInput
            label="Requested date"
            type="date"
            value={form.requestedAt}
            onChange={(event) => onFieldChange('requestedAt', event.target.value)}
          />
          <TextInput
            label="Target go-live"
            type="date"
            value={form.targetGoLive}
            onChange={(event) => onFieldChange('targetGoLive', event.target.value)}
          />
          <TextInput
            label="Last decision date"
            type="date"
            value={form.lastDecisionAt}
            onChange={(event) => onFieldChange('lastDecisionAt', event.target.value)}
          />
          <TextInput
            label="Projected enterprise seats"
            type="number"
            min="0"
            value={form.seats}
            onChange={(event) => onFieldChange('seats', event.target.value)}
          />
          <TextInput
            label="Estimated contract value"
            type="number"
            min="0"
            value={form.contractValue}
            onChange={(event) => onFieldChange('contractValue', event.target.value)}
            prefix={form.currency}
          />
          <TextInput
            label="Onboarding manager"
            value={form.onboardingManager}
            onChange={(event) => onFieldChange('onboardingManager', event.target.value)}
            placeholder="Who is leading this upgrade?"
          />
          <TextInput
            label="Currency"
            value={form.currency}
            maxLength={3}
            onChange={(event) => onFieldChange('currency', event.target.value.toUpperCase())}
          />
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {FEATURE_OPTIONS.map((feature) => (
          <label
            key={feature.value}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-600"
          >
            <Checkbox
              checked={form.enterpriseFeatures.includes(feature.value)}
              onChange={() => onFeatureToggle(feature.value)}
            />
            {feature.label}
          </label>
        ))}
      </div>
      <TextArea
        className="mt-6"
        label="Automation scope"
        value={form.automationScope}
        onChange={(event) => onFieldChange('automationScope', event.target.value)}
        placeholder="Describe the enterprise automation and integration requirements."
        minRows={3}
      />
      <TextArea
        className="mt-4"
        label="Internal notes"
        value={form.notes}
        onChange={(event) => onFieldChange('notes', event.target.value)}
        placeholder="Capture negotiation updates, outstanding risks, or blockers."
        minRows={3}
      />
    </article>
  );
}

EnterpriseUpgradeSummaryCard.propTypes = {
  form: PropTypes.shape({
    status: PropTypes.string.isRequired,
    summary: PropTypes.string,
    requestedAt: PropTypes.string,
    targetGoLive: PropTypes.string,
    lastDecisionAt: PropTypes.string,
    seats: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    contractValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    enterpriseFeatures: PropTypes.arrayOf(PropTypes.string).isRequired,
    automationScope: PropTypes.string,
    onboardingManager: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  record: PropTypes.shape({
    requestedAt: PropTypes.string,
    lastDecisionAt: PropTypes.string
  }),
  statusTone: PropTypes.string.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onFeatureToggle: PropTypes.func.isRequired,
  format: PropTypes.shape({
    dateTime: PropTypes.func.isRequired
  }).isRequired
};

EnterpriseUpgradeSummaryCard.defaultProps = {
  record: null
};

export default EnterpriseUpgradeSummaryCard;
