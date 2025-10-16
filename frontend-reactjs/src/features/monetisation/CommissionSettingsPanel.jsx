import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  PencilSquareIcon,
  PlusIcon,
  ScaleIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, StatusPill, TextInput } from '../../components/ui/index.js';

function CommissionSettingsPanel({
  form,
  onToggle,
  onRateChange,
  onOpenStructureEditor,
  onStructureRemove,
  onAddCustomRate,
  onCustomRateChange,
  onRemoveCustomRate,
  describeStructureRate,
  deriveStructureId
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
          checked={form.enabled}
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
          value={form.baseRatePercent}
          onChange={onRateChange}
          placeholder="2.5"
          hint="Applies when no demand-specific override is matched. Default platform share is 2.5%."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Commission structures</p>
            <p className="text-xs text-slate-500">
              Create specialised commission rules for verticals, partners, or service categories. Structures are evaluated
              before custom rate overrides.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={() => onOpenStructureEditor()}>
            New structure
          </Button>
        </div>

        <div className="space-y-3">
          {form.structures.length === 0 ? (
            <p className="text-xs text-slate-500">No bespoke structures defined. Global base rate will apply.</p>
          ) : (
            form.structures.map((structure, index) => (
              <div key={`structure-${index}`} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-primary">
                        {structure.name || 'Untitled structure'}
                      </h3>
                      <StatusPill tone={structure.active ? 'success' : 'warning'}>
                        {structure.active ? 'Active' : 'Disabled'}
                      </StatusPill>
                    </div>
                    <p className="text-sm text-slate-600">
                      {structure.description || 'No explanatory copy provided for operators yet.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{describeStructureRate(structure)}</span>
                      {structure.appliesToText ? <span>Applies to: {structure.appliesToText}</span> : <span>Applies globally</span>}
                      {structure.payoutDelayDays ? <span>{structure.payoutDelayDays}-day payout delay</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={PencilSquareIcon}
                      onClick={() => onOpenStructureEditor(index)}
                    >
                      Edit structure
                    </Button>
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      icon={ArrowTopRightOnSquareIcon}
                      href={`/admin/dashboard/commission-structures/${deriveStructureId(structure)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open dashboard
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={TrashIcon}
                      onClick={() => onStructureRemove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                {structure.imageUrl ? (
                  <img
                    src={structure.imageUrl}
                    alt={`${structure.name || 'Structure'} visual`}
                    className="h-28 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
            ))
          )}
        </div>
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
          {form.customRates.length === 0 ? (
            <p className="text-xs text-slate-500">No custom rates configured.</p>
          ) : (
            form.customRates.map((entry, index) => (
              <div
                key={`custom-rate-${index}`}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto]"
              >
                <TextInput
                  label="Key"
                  value={entry.key}
                  onChange={(event) => onCustomRateChange(index, 'key', event.target.value)}
                  hint="Matches booking type and demand e.g. scheduled:high"
                />
                <TextInput
                  label="Rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  suffix="%"
                  value={entry.ratePercent}
                  onChange={(event) => onCustomRateChange(index, 'ratePercent', event.target.value)}
                />
                <Button type="button" variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemoveCustomRate(index)}>
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Platform policy highlights</h3>
        <ul className="space-y-3 text-sm text-primary">
          <li className="flex items-start gap-3">
            <ShieldCheckIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
            <div>
              Default owner commission is fixed at <strong>2.5%</strong> of every booking unless you explicitly override the rate
              for specific demand bands.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <BanknotesIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
            <div>
              Providers retain full control over how much they pay their servicemen. The platform only records ledger references
              for payouts.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <ScaleIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
            <div>
              Commission structures are evaluated in descending order. The first active structure that matches the booking wins.
            </div>
          </li>
        </ul>
      </div>
    </Card>
  );
}

CommissionSettingsPanel.propTypes = {
  form: PropTypes.shape({
    enabled: PropTypes.bool.isRequired,
    baseRatePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    structures: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string,
        rateType: PropTypes.string,
        ratePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        flatAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        currency: PropTypes.string,
        appliesToText: PropTypes.string,
        payoutDelayDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        imageUrl: PropTypes.string,
        active: PropTypes.bool
      })
    ).isRequired,
    customRates: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        ratePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      })
    ).isRequired
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onRateChange: PropTypes.func.isRequired,
  onOpenStructureEditor: PropTypes.func.isRequired,
  onStructureRemove: PropTypes.func.isRequired,
  onAddCustomRate: PropTypes.func.isRequired,
  onCustomRateChange: PropTypes.func.isRequired,
  onRemoveCustomRate: PropTypes.func.isRequired,
  describeStructureRate: PropTypes.func.isRequired,
  deriveStructureId: PropTypes.func.isRequired
};

export default CommissionSettingsPanel;
