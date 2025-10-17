import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button, Card, Select, TextInput } from '../../../components/ui/index.js';
import { TARGETING_OPERATORS, TARGETING_RULE_TYPES } from '../constants.js';

export default function TargetingPanel({
  targetingRules,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  onSave,
  saving
}) {
  return (
    <Card padding="lg" className="border border-slate-200 bg-white/70 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Targeting</p>
          <h3 className="text-xl font-semibold text-primary">Audience filters</h3>
          <p className="mt-2 text-sm text-slate-600">
            Use rules to focus on service zones, device families, or pre-approved partner cohorts. Rules are applied in
            order and support include/exclude logic.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddRule}>
          Add rule
        </Button>
      </header>

      <div className="space-y-4">
        {targetingRules.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No targeting rules configured. Add at least one rule to lock the campaign to the correct territories.
          </p>
        ) : (
          targetingRules.map((rule, index) => (
            <div key={rule.id ?? index} className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 md:grid-cols-3">
              <Select
                label="Rule type"
                value={rule.ruleType}
                onChange={(event) => onUpdateRule(index, 'ruleType', event.target.value)}
                options={TARGETING_RULE_TYPES}
              />
              <Select
                label="Operator"
                value={rule.operator}
                onChange={(event) => onUpdateRule(index, 'operator', event.target.value)}
                options={TARGETING_OPERATORS}
              />
              <TextInput
                label="Value"
                value={rule.value ?? ''}
                onChange={(event) => onUpdateRule(index, 'value', event.target.value)}
                placeholder="north-london"
              />
              <div className="md:col-span-3 flex justify-end">
                <Button type="button" variant="ghost" onClick={() => onRemoveRule(index)}>
                  Remove rule
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={onSave} disabled={saving || targetingRules.length === 0}>
          Save targeting
        </Button>
      </div>
    </Card>
  );
}

TargetingPanel.propTypes = {
  targetingRules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      ruleType: PropTypes.string,
      operator: PropTypes.string,
      value: PropTypes.string
    })
  ),
  onAddRule: PropTypes.func.isRequired,
  onUpdateRule: PropTypes.func.isRequired,
  onRemoveRule: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

TargetingPanel.defaultProps = {
  targetingRules: [],
  saving: false
};
