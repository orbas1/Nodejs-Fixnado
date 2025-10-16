import PropTypes from 'prop-types';
import { PlusIcon, ShieldCheckIcon, BanknotesIcon, ScaleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';

function CommissionPolicyHighlights() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Platform policy highlights</h3>
      <ul className="space-y-3 text-sm text-primary">
        <li className="flex items-start gap-3">
          <ShieldCheckIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
          <div>
            Default owner commission is fixed at <strong>2.5%</strong> of every booking unless you explicitly override the rate for
            specific demand bands.
          </div>
        </li>
        <li className="flex items-start gap-3">
          <BanknotesIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
          <div>
            Providers retain full control over how much they pay their servicemen. The platform only records ledger references and
            does not intermediate crew wages.
          </div>
        </li>
        <li className="flex items-start gap-3">
          <ScaleIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
          <div>
            Wallet and ledger operations operate as pass-through accounting so Fixnado is not holding client funds—keeping us
            outside FCA regulated activities and aligned with Apple App Store rules that exempt real-world services from in-app
            purchase flows.
          </div>
        </li>
      </ul>
    </div>
  );
}

export default function CommissionManagementCard({
  value,
  onToggle,
  onBaseRateChange,
  onAddCustomRate,
  onCustomRateChange,
  onRemoveCustomRate
}) {
  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-primary">Commission management</h2>
        <p className="text-sm text-slate-600">
          Define cross-marketplace commission earnings from escrow transactions and staged releases.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Checkbox
          label="Enable commissions"
          checked={value.enabled}
          onChange={onToggle}
          description="Disable to waive platform earnings across all transactions."
        />

        <TextInput
          label="Default commission rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          suffix="%"
          value={value.baseRatePercent}
          onChange={onBaseRateChange}
          placeholder="2.5"
          hint="Applies when no demand-specific override is matched. Default platform share is 2.5%."
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Custom rate overrides</p>
            <p className="text-xs text-slate-500">
              Provide keys like <code>scheduled:high</code> or <code>on_demand</code>. Empty entries are ignored.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddCustomRate}>
            Add override
          </Button>
        </div>
        <div className="space-y-3">
          {value.customRates.length === 0 ? (
            <p className="text-xs text-slate-500">No overrides defined. Platform defaults will apply everywhere.</p>
          ) : (
            value.customRates.map((entry, index) => (
              <div key={`custom-rate-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,200px)]">
                <TextInput
                  label="Key"
                  value={entry.key}
                  onChange={(event) => onCustomRateChange(index, 'key', event.target.value)}
                />
                <div className="flex items-end gap-2">
                  <TextInput
                    label="Commission rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    suffix="%"
                    value={entry.ratePercent}
                    onChange={(event) => onCustomRateChange(index, 'ratePercent', event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={TrashIcon}
                    onClick={() => onRemoveCustomRate(index)}
                    aria-label="Remove custom rate"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CommissionPolicyHighlights />
    </Card>
  );
}

CommissionManagementCard.propTypes = {
  value: PropTypes.shape({
    enabled: PropTypes.bool.isRequired,
    baseRatePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    customRates: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        ratePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      })
    ).isRequired
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onBaseRateChange: PropTypes.func.isRequired,
  onAddCustomRate: PropTypes.func.isRequired,
  onCustomRateChange: PropTypes.func.isRequired,
  onRemoveCustomRate: PropTypes.func.isRequired
};
