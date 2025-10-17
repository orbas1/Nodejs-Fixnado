import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';

const RULE_TYPES = [
  { value: 'zone', label: 'Geographic zone' },
  { value: 'industry', label: 'Industry' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'account_status', label: 'Account status' },
  { value: 'custom', label: 'Custom JSON payload' }
];

const OPERATORS = [
  { value: 'include', label: 'Include' },
  { value: 'exclude', label: 'Exclude' }
];

function serialisePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return '{\n  "values": []\n}';
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch (parseError) {
    console.debug('[TargetingRulesModal] serialise payload failure', parseError);
    return '{\n  "values": []\n}';
  }
}

function ensureRuleShape(rule = {}) {
  return {
    id: rule.id || null,
    ruleType: rule.ruleType || 'zone',
    operator: rule.operator || 'include',
    payloadText: serialisePayload(rule.payload)
  };
}

export default function TargetingRulesModal({ open, onClose, campaign, onSubmit }) {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const campaignName = campaign?.name || 'campaign';

  useEffect(() => {
    if (open) {
      const hydrated = (campaign?.targetingRules || []).map(ensureRuleShape);
      setRules(hydrated.length ? hydrated : [ensureRuleShape()]);
      setError(null);
    } else {
      setRules([]);
      setError(null);
    }
  }, [campaign, open]);

  const hasCustomRule = useMemo(() => rules.some((rule) => rule.ruleType === 'custom'), [rules]);

  const handleRuleChange = (index, key, value) => {
    setRules((current) => current.map((rule, idx) => (idx === index ? { ...rule, [key]: value } : rule)));
  };

  const handlePayloadChange = (index, value) => {
    setRules((current) => current.map((rule, idx) => (idx === index ? { ...rule, payloadText: value } : rule)));
  };

  const handleAddRule = () => {
    setRules((current) => current.concat(ensureRuleShape()));
  };

  const handleRemoveRule = (index) => {
    setRules((current) => {
      if (current.length === 1) {
        return [ensureRuleShape()];
      }
      return current.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = rules.map((rule, index) => {
        const trimmed = rule.payloadText.trim();
        let parsed = {};
        if (trimmed) {
          try {
            parsed = JSON.parse(trimmed);
          } catch (parseError) {
            console.debug('[TargetingRulesModal] invalid rule payload', parseError);
            throw new Error(`Rule ${index + 1} has invalid JSON payload`);
          }
        }

        return {
          ruleType: rule.ruleType,
          operator: rule.operator,
          payload: parsed
        };
      });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Targeting rules for ${campaignName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Define how Gigvora should include or exclude specific audiences for this campaign. Payloads accept JSON; we pre-fill a
          helpful structure for common rule types.
        </p>

        {rules.map((rule, index) => (
          <div key={`rule-${index}`} className="rounded-3xl border border-slate-200 bg-white/70 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Select
                label="Rule type"
                name={`rule-type-${index}`}
                value={rule.ruleType}
                onChange={(event) => handleRuleChange(index, 'ruleType', event.target.value)}
                options={RULE_TYPES}
              />
              <Select
                label="Operator"
                name={`rule-operator-${index}`}
                value={rule.operator}
                onChange={(event) => handleRuleChange(index, 'operator', event.target.value)}
                options={OPERATORS}
              />
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  tone="danger"
                  onClick={() => handleRemoveRule(index)}
                  disabled={submitting && rules.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
            <TextArea
              rows={6}
              value={rule.payloadText}
              onChange={(event) => handlePayloadChange(index, event.target.value)}
              label={undefined}
              placeholder={`{
  "zones": ["City of London"]
}`}
            />
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={handleAddRule} disabled={submitting}>
            Add targeting rule
          </Button>
          {hasCustomRule ? (
            <span className="text-xs text-slate-500">
              Custom payloads support any valid JSON object. Keep keys descriptive for your teammates.
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-600">{error}</div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            Save rules
          </Button>
        </div>
      </form>
    </Modal>
  );
}

TargetingRulesModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    targetingRules: PropTypes.array
  })
};

TargetingRulesModal.defaultProps = {
  open: false,
  campaign: null
};
