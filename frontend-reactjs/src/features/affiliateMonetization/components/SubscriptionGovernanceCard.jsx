import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, SegmentedControl, TextInput } from '../../../components/ui/index.js';

export default function SubscriptionGovernanceCard({
  value,
  tierChoices,
  onToggle,
  onRestrictedFeaturesChange,
  onDefaultTierChange,
  onAddTier,
  onTierChange,
  onRemoveTier
}) {
  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-primary">Subscription governance</h2>
        <p className="text-sm text-slate-600">Configure subscription tiers and feature gating to regulate marketplace capabilities.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Checkbox
          label="Enable subscriptions"
          checked={value.enabled}
          onChange={(event) => onToggle('enabled', event.target.checked)}
          description="Disable to grant all features regardless of tier."
        />
        <Checkbox
          label="Enforce feature gating"
          checked={value.enforceFeatures}
          onChange={(event) => onToggle('enforceFeatures', event.target.checked)}
          description="When off, tiers remain visible but restrictions are not applied."
        />
      </div>

      <TextInput
        label="Restricted features"
        value={value.restrictedFeaturesText}
        onChange={(event) => onRestrictedFeaturesChange(event.target.value)}
        hint="Comma separated feature flags that require an active subscription."
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Subscription tiers</p>
            <p className="text-xs text-slate-500">Provide at least one tier. Default tier is assigned to new providers.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SegmentedControl
              name="Default subscription tier"
              value={value.defaultTier}
              onChange={onDefaultTierChange}
              options={tierChoices.length > 0 ? tierChoices : [{ value: value.defaultTier || 'standard', label: value.defaultTier || 'Standard' }]}
              size="sm"
            />
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddTier}>
              Add tier
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {value.tiers.length === 0 ? (
            <p className="text-xs text-slate-500">No tiers configured. Add at least one tier to enable gating.</p>
          ) : (
            value.tiers.map((tier, index) => (
              <div key={`tier-${index}`} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    label="Tier ID"
                    value={tier.id}
                    onChange={(event) => onTierChange(index, 'id', event.target.value)}
                    hint="Used for API checks and analytics labelling."
                  />
                  <TextInput label="Display name" value={tier.label} onChange={(event) => onTierChange(index, 'label', event.target.value)} />
                </div>
                <TextInput
                  label="Description"
                  value={tier.description}
                  onChange={(event) => onTierChange(index, 'description', event.target.value)}
                  optionalLabel="optional"
                />
                <TextInput
                  label="Features"
                  value={tier.featuresText}
                  onChange={(event) => onTierChange(index, 'featuresText', event.target.value)}
                  hint="Comma separated feature flags unlocked by this tier."
                />
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemoveTier(index)}>
                    Remove tier
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

SubscriptionGovernanceCard.propTypes = {
  value: PropTypes.shape({
    enabled: PropTypes.bool.isRequired,
    enforceFeatures: PropTypes.bool.isRequired,
    defaultTier: PropTypes.string,
    restrictedFeaturesText: PropTypes.string,
    tiers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        description: PropTypes.string,
        featuresText: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  tierChoices: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onToggle: PropTypes.func.isRequired,
  onRestrictedFeaturesChange: PropTypes.func.isRequired,
  onDefaultTierChange: PropTypes.func.isRequired,
  onAddTier: PropTypes.func.isRequired,
  onTierChange: PropTypes.func.isRequired,
  onRemoveTier: PropTypes.func.isRequired
};
