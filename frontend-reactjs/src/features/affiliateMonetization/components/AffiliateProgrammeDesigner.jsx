import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, SegmentedControl, TextInput, Textarea } from '../../../components/ui/index.js';

export default function AffiliateProgrammeDesigner({
  value,
  onInputChange,
  onToggle,
  onAddResource,
  onResourceFieldChange,
  onResourceTypeChange,
  onResourceToggle,
  onRemoveResource,
  onAddAsset,
  onAssetFieldChange,
  onAssetTypeChange,
  onRemoveAsset,
  onAddTier,
  onTierFieldChange,
  onRemoveTier,
  resourceTypeOptions,
  assetTypeOptions
}) {
  return (
    <div className="space-y-10">
      <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-primary">Affiliate monetisation</h2>
          <p className="text-sm text-slate-600">
            Configure the end-to-end experience for partners — from onboarding copy to payout guardrails and asset distribution.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput label="Programme name" value={value.programmeName} onChange={onInputChange('programmeName')} />
          <TextInput label="Programme tagline" value={value.programmeTagline} onChange={onInputChange('programmeTagline')} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <TextInput label="Contact email" value={value.contactEmail} onChange={onInputChange('contactEmail')} />
          <TextInput label="Partner portal URL" value={value.partnerPortalUrl} onChange={onInputChange('partnerPortalUrl')} />
          <TextInput label="Landing page URL" value={value.landingPageUrl} onChange={onInputChange('landingPageUrl')} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <TextInput label="Onboarding guide URL" value={value.onboardingGuideUrl} onChange={onInputChange('onboardingGuideUrl')} />
          <TextInput label="Disclosure policy URL" value={value.disclosureUrl} onChange={onInputChange('disclosureUrl')} />
          <TextInput label="Brand colour" value={value.brandColor} onChange={onInputChange('brandColor')} hint="Hex colour used for partner badges and dashboards." />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput label="Hero image URL" value={value.heroImageUrl} onChange={onInputChange('heroImageUrl')} optionalLabel="optional" />
          <TextInput label="Logo image URL" value={value.logoUrl} onChange={onInputChange('logoUrl')} optionalLabel="optional" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput label="Welcome email subject" value={value.welcomeEmailSubject} onChange={onInputChange('welcomeEmailSubject')} />
          <Textarea
            label="Welcome email body"
            value={value.welcomeEmailBody}
            onChange={onInputChange('welcomeEmailBody')}
            hint="Supports Markdown formatting. Sent when a provider unlocks affiliate access."
          />
        </div>
      </Card>

      <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
        <header className="space-y-2">
          <h3 className="text-2xl font-semibold text-primary">Payout and compliance</h3>
          <p className="text-sm text-slate-600">
            Guardrails for how and when your partners receive earnings. These controls sync directly with the ledger and payout scheduler.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Checkbox
            label="Auto approve referrals"
            checked={Boolean(value.autoApproveReferrals)}
            onChange={onToggle('autoApproveReferrals')}
            description="Enable to instantly approve trusted partners once conversions clear anti-fraud checks."
          />
          <TextInput label="Payout cadence (days)" type="number" min="1" value={value.payoutCadenceDays} onChange={onInputChange('payoutCadenceDays')} />
          <TextInput
            label="Minimum payout amount"
            type="number"
            min="0"
            step="0.01"
            value={value.minimumPayoutAmount}
            onChange={onInputChange('minimumPayoutAmount')}
            hint="Balances below this threshold roll into the next cycle."
          />
          <TextInput label="Attribution window (days)" type="number" min="1" value={value.referralAttributionWindowDays} onChange={onInputChange('referralAttributionWindowDays')} />
        </div>
      </Card>

      <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
        <header className="space-y-2">
          <h3 className="text-2xl font-semibold text-primary">Partner resources</h3>
          <p className="text-sm text-slate-600">
            Centralise docs, scripts, and marketing assets shared during onboarding. Role filters control visibility in the admin console.
          </p>
        </header>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Resource library</p>
              <p className="text-xs text-slate-500">
                Provide quick links to playbooks, FAQs, or assets. Roles are comma separated (for example <code>marketing, operations</code>).
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddResource}>
              Add resource
            </Button>
          </div>
          <div className="space-y-4">
            {value.resources.length === 0 ? (
              <p className="text-sm text-slate-500">No partner resources yet. Add your onboarding pack or brand hub links.</p>
            ) : (
              value.resources.map((resource, index) => (
                <div key={`affiliate-resource-${index}`} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <SegmentedControl
                    name={`Resource ${index + 1} type`}
                    value={resource.type || 'link'}
                    options={resourceTypeOptions}
                    size="sm"
                    onChange={(next) => onResourceTypeChange(index, next)}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Label" value={resource.label} onChange={onResourceFieldChange(index, 'label')} />
                    <TextInput label="URL" value={resource.url} onChange={onResourceFieldChange(index, 'url')} />
                  </div>
                  <Textarea label="Description" value={resource.description} onChange={onResourceFieldChange(index, 'description')} optionalLabel="optional" />
                  <TextInput label="Roles" value={resource.rolesText} onChange={onResourceFieldChange(index, 'rolesText')} hint="Comma separated role slugs allowed to view this resource." />
                  <Checkbox
                    label="Open in new tab"
                    checked={Boolean(resource.openInNewTab)}
                    onChange={onResourceToggle(index)}
                  />
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemoveResource(index)}>
                      Remove resource
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Asset library</p>
              <p className="text-xs text-slate-500">Upload brand artwork and collateral. Assets sync to the partner portal.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddAsset}>
              Add asset
            </Button>
          </div>
          <div className="space-y-4">
            {value.assetLibrary.length === 0 ? (
              <p className="text-sm text-slate-500">No assets uploaded yet. Add logos, banners, or social templates.</p>
            ) : (
              value.assetLibrary.map((asset, index) => (
                <div key={`affiliate-asset-${index}`} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <SegmentedControl
                    name={`Asset ${index + 1} type`}
                    value={asset.type || 'image'}
                    options={assetTypeOptions}
                    size="sm"
                    onChange={(next) => onAssetTypeChange(index, next)}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Label" value={asset.label} onChange={onAssetFieldChange(index, 'label')} />
                    <TextInput label="Download URL" value={asset.url} onChange={onAssetFieldChange(index, 'url')} />
                  </div>
                  <TextInput label="Preview image" value={asset.previewUrl} onChange={onAssetFieldChange(index, 'previewUrl')} optionalLabel="optional" />
                  <Textarea label="Description" value={asset.description} onChange={onAssetFieldChange(index, 'description')} optionalLabel="optional" />
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemoveAsset(index)}>
                      Remove asset
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Partner tiers</p>
              <p className="text-xs text-slate-500">Use tiers to power badges and dashboard gating inside the partner portal.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddTier}>
              Add tier
            </Button>
          </div>
          <div className="space-y-4">
            {value.tiers.length === 0 ? (
              <p className="text-sm text-slate-500">No partner tiers configured. Add at least one tier to unlock badge automation.</p>
            ) : (
              value.tiers.map((tier, index) => (
                <div key={`affiliate-tier-${index}`} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Tier ID" value={tier.id} onChange={onTierFieldChange(index, 'id')} />
                    <TextInput label="Display name" value={tier.label} onChange={onTierFieldChange(index, 'label')} />
                    <TextInput label="Headline" value={tier.headline} onChange={onTierFieldChange(index, 'headline')} optionalLabel="optional" />
                    <TextInput label="Requirement" value={tier.requirement} onChange={onTierFieldChange(index, 'requirement')} optionalLabel="optional" />
                    <TextInput label="Badge colour" value={tier.badgeColor} onChange={onTierFieldChange(index, 'badgeColor')} />
                    <TextInput label="Image URL" value={tier.imageUrl} onChange={onTierFieldChange(index, 'imageUrl')} optionalLabel="optional" />
                  </div>
                  <Textarea label="Benefits" value={tier.benefitsText} onChange={onTierFieldChange(index, 'benefitsText')} hint="List each perk on a new line." />
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
    </div>
  );
}

AffiliateProgrammeDesigner.propTypes = {
  value: PropTypes.shape({
    programmeName: PropTypes.string.isRequired,
    programmeTagline: PropTypes.string,
    contactEmail: PropTypes.string,
    partnerPortalUrl: PropTypes.string,
    landingPageUrl: PropTypes.string,
    onboardingGuideUrl: PropTypes.string,
    disclosureUrl: PropTypes.string,
    brandColor: PropTypes.string,
    heroImageUrl: PropTypes.string,
    logoUrl: PropTypes.string,
    welcomeEmailSubject: PropTypes.string,
    welcomeEmailBody: PropTypes.string,
    autoApproveReferrals: PropTypes.bool,
    payoutCadenceDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minimumPayoutAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    referralAttributionWindowDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    resources: PropTypes.array.isRequired,
    assetLibrary: PropTypes.array.isRequired,
    tiers: PropTypes.array.isRequired
  }).isRequired,
  onInputChange: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onAddResource: PropTypes.func.isRequired,
  onResourceFieldChange: PropTypes.func.isRequired,
  onResourceTypeChange: PropTypes.func.isRequired,
  onResourceToggle: PropTypes.func.isRequired,
  onRemoveResource: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onAssetFieldChange: PropTypes.func.isRequired,
  onAssetTypeChange: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  onAddTier: PropTypes.func.isRequired,
  onTierFieldChange: PropTypes.func.isRequired,
  onRemoveTier: PropTypes.func.isRequired,
  resourceTypeOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  assetTypeOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired
};
