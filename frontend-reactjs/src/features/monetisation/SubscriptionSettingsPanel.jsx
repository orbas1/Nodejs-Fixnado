import PropTypes from 'prop-types';
import {
  ArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, SegmentedControl, StatusPill, TextInput } from '../../components/ui/index.js';

function SubscriptionSettingsPanel({
  form,
  packageChoices,
  onToggle,
  onFieldChange,
  onDefaultTierChange,
  onOpenPackageEditor,
  onMovePackage,
  onRemovePackage,
  describeBillingSummary,
  derivePackageId
}) {
  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-primary">Subscription governance</h2>
        <p className="text-sm text-slate-600">
          Control Fixnado subscription offerings, feature gating, and self-service trials.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Checkbox
          label="Enable subscriptions"
          checked={form.enabled}
          onChange={onToggle('enabled')}
          description="Disable to remove subscription requirements from the marketplace."
        />
        <Checkbox
          label="Enforce feature access"
          checked={form.enforceFeatures}
          onChange={onToggle('enforceFeatures')}
          description="Controls whether restricted features require an active package."
        />
        <TextInput
          label="Default subscription key"
          value={form.defaultTier}
          onChange={onFieldChange('defaultTier')}
          hint="Slug or identifier for the default plan assigned to new providers."
        />
      </div>

      <TextInput
        label="Restricted features"
        value={form.restrictedFeaturesText}
        onChange={onFieldChange('restrictedFeaturesText')}
        hint="Comma separated feature flags that require an active subscription."
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Subscription packages</p>
            <p className="text-xs text-slate-500">
              Build packages with pricing, billing cadence, feature access, imagery, and onboarding rules.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SegmentedControl
              name="Default subscription package"
              value={form.defaultTier}
              onChange={onDefaultTierChange}
              options={
                packageChoices.length > 0
                  ? packageChoices
                  : [
                      {
                        value: form.defaultTier || 'standard',
                        label: form.defaultTier || 'Standard'
                      }
                    ]
              }
              size="sm"
            />
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={() => onOpenPackageEditor()}>
              New package
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {form.packages.length === 0 ? (
            <p className="text-xs text-slate-500">
              No packages configured. Create at least one package to enable subscription billing and gating.
            </p>
          ) : (
            form.packages.map((pkg, index) => (
              <div key={`package-${index}`} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-primary">{pkg.label || 'Untitled package'}</h3>
                      <StatusPill tone={pkg.highlight ? 'info' : 'neutral'}>
                        {pkg.highlight ? 'Featured' : 'Standard'}
                      </StatusPill>
                      {form.defaultTier === derivePackageId(pkg) ? <StatusPill tone="success">Default</StatusPill> : null}
                    </div>
                    <p className="text-sm text-slate-600">
                      {pkg.description || 'No marketing description has been provided for this package yet.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{describeBillingSummary(pkg)}</span>
                      {pkg.trialDays > 0 ? <span>{pkg.trialDays}-day trial</span> : null}
                      {pkg.roleAccessText ? <span>Roles: {pkg.roleAccessText}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={PencilSquareIcon}
                      onClick={() => onOpenPackageEditor(index)}
                    >
                      Edit package
                    </Button>
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      icon={ArrowTopRightOnSquareIcon}
                      href={`/pricing?plan=${derivePackageId(pkg)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={ArrowUpIcon}
                      onClick={() => onMovePackage(index, -1)}
                      disabled={index === 0}
                    >
                      Move up
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={ArrowDownIcon}
                      onClick={() => onMovePackage(index, 1)}
                      disabled={index === form.packages.length - 1}
                    >
                      Move down
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={TrashIcon}
                      onClick={() => onRemovePackage(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                {pkg.featuresText ? (
                  <div className="rounded-xl bg-white/60 p-4 text-sm text-slate-600 shadow-sm">
                    <p className="font-semibold text-primary">Included capabilities</p>
                    <p className="mt-1 text-slate-600">{pkg.featuresText}</p>
                  </div>
                ) : null}
                {pkg.imageUrl ? (
                  <img
                    src={pkg.imageUrl}
                    alt={`${pkg.label || 'Package'} artwork`}
                    className="h-32 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

SubscriptionSettingsPanel.propTypes = {
  form: PropTypes.shape({
    enabled: PropTypes.bool.isRequired,
    enforceFeatures: PropTypes.bool.isRequired,
    defaultTier: PropTypes.string.isRequired,
    restrictedFeaturesText: PropTypes.string.isRequired,
    packages: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        description: PropTypes.string,
        priceAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        priceCurrency: PropTypes.string,
        billingInterval: PropTypes.string,
        billingFrequency: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        trialDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        badge: PropTypes.string,
        imageUrl: PropTypes.string,
        featuresText: PropTypes.string,
        roleAccessText: PropTypes.string,
        highlight: PropTypes.bool
      })
    ).isRequired
  }).isRequired,
  packageChoices: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onToggle: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onDefaultTierChange: PropTypes.func.isRequired,
  onOpenPackageEditor: PropTypes.func.isRequired,
  onMovePackage: PropTypes.func.isRequired,
  onRemovePackage: PropTypes.func.isRequired,
  describeBillingSummary: PropTypes.func.isRequired,
  derivePackageId: PropTypes.func.isRequired
};

export default SubscriptionSettingsPanel;
