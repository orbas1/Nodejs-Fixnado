import PropTypes from 'prop-types';
import {
  ArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  PhotoIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  SegmentedControl,
  StatusPill,
  TextInput,
  Textarea
} from '../../../components/ui/index.js';
import {
  ASSET_TYPE_OPTIONS,
  DENSITY_OPTIONS,
  NAV_STYLE_OPTIONS,
  PUBLISH_STATE_OPTIONS,
  SHADOW_OPTIONS,
  STAT_COLUMN_OPTIONS
} from '../constants.js';

function AssetRow({
  asset,
  index,
  total,
  onChange,
  onMetadataChange,
  onMove,
  onRemove
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4" data-qa-asset-row={asset.id ?? index}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id={`asset-type-${index}`} label="Asset type">
              <select
                id={`asset-type-${index}`}
                className="fx-text-input"
                value={asset.assetType}
                onChange={(event) => onChange(index, 'assetType', event.target.value)}
              >
                {ASSET_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <TextInput
              label="Label"
              value={asset.label}
              onChange={(event) => onChange(index, 'label', event.target.value)}
            />
            <TextInput
              label="URL"
              value={asset.url}
              placeholder="https://"
              onChange={(event) => onChange(index, 'url', event.target.value)}
            />
            <TextInput
              label="Alt text"
              value={asset.altText}
              onChange={(event) => onChange(index, 'altText', event.target.value)}
            />
          </div>
          <Textarea
            label="Description"
            rows={3}
            value={asset.description}
            onChange={(event) => onChange(index, 'description', event.target.value)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Usage context"
              value={asset.metadata?.usage || ''}
              placeholder="Where should this appear?"
              onChange={(event) => onMetadataChange(index, 'usage', event.target.value)}
            />
            <TextInput
              label="Background guidance"
              value={asset.metadata?.background || ''}
              placeholder="Light / dark / gradient"
              onChange={(event) => onMetadataChange(index, 'background', event.target.value)}
            />
          </div>
          <TextInput
            label="Sort order"
            type="number"
            value={asset.sortOrder ?? index}
            onChange={(event) => onChange(index, 'sortOrder', event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 self-stretch md:w-36">
          <Button variant="ghost" size="sm" icon={ArrowUpIcon} disabled={index === 0} onClick={() => onMove(index, -1)}>
            Move up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowDownIcon}
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            Move down
          </Button>
          <Button variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemove(index)}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

AssetRow.propTypes = {
  asset: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onMetadataChange: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

function VariantRow({
  variant,
  index,
  total,
  onChange,
  onCopyChange,
  onMove,
  onRemove,
  onPreview,
  canPreview
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4" data-qa-variant-row={variant.id ?? index}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Variant name"
              value={variant.name}
              placeholder="Seasonal hero"
              onChange={(event) => onChange(index, 'name', event.target.value)}
            />
            <TextInput
              label="Variant key"
              value={variant.variantKey}
              placeholder="Automatically used in URLs"
              onChange={(event) => onChange(index, 'variantKey', event.target.value)}
            />
            <TextInput
              label="CTA label"
              value={variant.ctaLabel}
              onChange={(event) => onChange(index, 'ctaLabel', event.target.value)}
            />
            <TextInput
              label="CTA URL"
              value={variant.ctaUrl}
              placeholder="https://"
              onChange={(event) => onChange(index, 'ctaUrl', event.target.value)}
            />
            <TextInput
              label="Hero image URL"
              value={variant.heroImageUrl}
              placeholder="https://"
              onChange={(event) => onChange(index, 'heroImageUrl', event.target.value)}
            />
            <TextInput
              label="Hero video URL"
              value={variant.heroVideoUrl}
              placeholder="https://"
              onChange={(event) => onChange(index, 'heroVideoUrl', event.target.value)}
            />
          </div>
          <Textarea
            label="Headline"
            rows={2}
            placeholder="Main message for the hero"
            value={variant.headline}
            onChange={(event) => onChange(index, 'headline', event.target.value)}
          />
          <Textarea
            label="Subheadline"
            rows={3}
            placeholder="Supporting copy"
            value={variant.subheadline}
            onChange={(event) => onChange(index, 'subheadline', event.target.value)}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <FormField id={`variant-state-${index}`} label="State">
              <select
                id={`variant-state-${index}`}
                className="fx-text-input"
                value={variant.publishState}
                onChange={(event) => onChange(index, 'publishState', event.target.value)}
              >
                {PUBLISH_STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <TextInput
              label="Scheduled date"
              type="date"
              value={variant.scheduledFor ? variant.scheduledFor.slice(0, 10) : ''}
              onChange={(event) => onChange(index, 'scheduledFor', event.target.value)}
            />
            <TextInput
              label="Audience"
              value={variant.marketingCopy?.audience || ''}
              placeholder="Who is this for?"
              onChange={(event) => onCopyChange(index, 'audience', event.target.value)}
            />
            <TextInput
              className="md:col-span-2"
              label="Keywords"
              hint="Comma separated"
              value={variant.marketingCopy?.keywords?.join(', ') || ''}
              onChange={(event) => onCopyChange(index, 'keywords', event.target.value)}
            />
            <TextInput
              label="Sort order"
              type="number"
              value={variant.sortOrder ?? index}
              onChange={(event) => onChange(index, 'sortOrder', event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 self-stretch md:w-36">
          <Button variant="ghost" size="sm" icon={ArrowUpIcon} disabled={index === 0} onClick={() => onMove(index, -1)}>
            Move up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowDownIcon}
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            Move down
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowTopRightOnSquareIcon}
            disabled={!canPreview}
            onClick={() => onPreview(variant.variantKey)}
          >
            Preview
          </Button>
          <Button variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemove(index)}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

VariantRow.propTypes = {
  variant: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onCopyChange: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  canPreview: PropTypes.bool
};

export default function AppearanceProfileEditor({
  form,
  onFieldChange,
  onGovernanceChange,
  onColorChange,
  onTypographyChange,
  onLayoutChange,
  onImageryChange,
  onWidgetChange,
  onAddAsset,
  onAssetChange,
  onAssetMetadataChange,
  onMoveAsset,
  onRemoveAsset,
  onAddVariant,
  onVariantChange,
  onVariantCopyChange,
  onMoveVariant,
  onRemoveVariant,
  onPreviewVariant,
  previewHref
}) {
  return (
    <section className="space-y-8">
      <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">Profile overview</h2>
          <p className="text-sm text-slate-600">
            Provide a human-readable name, description, and governance metadata. Slugs are used for preview links.
          </p>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          <TextInput
            label="Profile name"
            value={form.name}
            onChange={(event) => onFieldChange('name', event.target.value)}
          />
          <TextInput
            label="Slug"
            hint="Used in URLs and analytics events"
            value={form.slug}
            onChange={(event) => onFieldChange('slug', event.target.value)}
          />
          <Textarea
            className="md:col-span-2"
            label="Description"
            rows={4}
            value={form.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
          />
          <div className="space-y-3">
            <Checkbox
              label="Mark as default profile"
              description="Applies to new admin sessions after publish."
              checked={form.isDefault}
              onChange={(event) => onFieldChange('isDefault', event.target.checked)}
            />
            <TextInput
              type="date"
              label="Publish date"
              value={form.publishedAt ? form.publishedAt.slice(0, 10) : ''}
              onChange={(event) => onFieldChange('publishedAt', event.target.value || null)}
            />
          </div>
          <div>
            <TextInput
              label="Review owner"
              value={form.governance?.lastReviewedBy || ''}
              onChange={(event) => onGovernanceChange('lastReviewedBy', event.target.value)}
            />
            <TextInput
              className="mt-3"
              type="date"
              label="Last reviewed on"
              value={form.governance?.lastReviewedAt ? form.governance.lastReviewedAt.slice(0, 10) : ''}
              onChange={(event) => onGovernanceChange('lastReviewedAt', event.target.value || null)}
            />
          </div>
          <Textarea
            className="md:col-span-2"
            label="Governance notes"
            rows={3}
            value={form.governance?.notes || ''}
            onChange={(event) => onGovernanceChange('notes', event.target.value)}
          />
        </div>
      </Card>

      <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Colour palette</h2>
            <p className="text-sm text-slate-600">
              Define accessible colour tokens for admin shells, charts, and call-to-actions.
            </p>
          </div>
          <StatusPill tone="info">WCAG AA baseline</StatusPill>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(form.colorPalette || {}).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-slate-700 capitalize" htmlFor={`palette-${key}`}>
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`palette-${key}`}
                  type="color"
                  className="h-12 w-12 rounded-lg border border-slate-200"
                  value={value}
                  onChange={(event) => onColorChange(key, event.target.value)}
                  aria-label={`${key} colour`}
                />
                <TextInput value={value} onChange={(event) => onColorChange(key, event.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">Typography & layout</h2>
          <p className="text-sm text-slate-600">
            Align typography, density, and elevation tokens with the brand system. These values sync to our token pipeline.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Heading font"
            value={form.typography?.heading}
            onChange={(event) => onTypographyChange('heading', event.target.value)}
          />
          <TextInput
            label="Body font"
            value={form.typography?.body}
            onChange={(event) => onTypographyChange('body', event.target.value)}
          />
          <Textarea
            label="Fallback stack"
            rows={2}
            value={form.typography?.fallbackStack}
            onChange={(event) => onTypographyChange('fallbackStack', event.target.value)}
          />
          <TextInput
            label="Scale ratio"
            type="number"
            step="0.05"
            value={form.typography?.scaleRatio}
            onChange={(event) => onTypographyChange('scaleRatio', event.target.value)}
          />
          <TextInput
            label="Letter tracking"
            value={form.typography?.tracking}
            onChange={(event) => onTypographyChange('tracking', event.target.value)}
          />

          <div className="space-y-4">
            <FormField id="density" label="Density mode">
              <SegmentedControl
                name="density"
                value={form.layout?.density}
                options={DENSITY_OPTIONS}
                onChange={(value) => onLayoutChange('density', value)}
              />
            </FormField>
            <FormField id="cardShadow" label="Card elevation">
              <SegmentedControl
                name="cardShadow"
                value={form.layout?.cardShadow}
                options={SHADOW_OPTIONS}
                onChange={(value) => onLayoutChange('cardShadow', value)}
              />
            </FormField>
            <FormField id="navStyle" label="Navigation style">
              <SegmentedControl
                name="navigationStyle"
                value={form.layout?.navigationStyle}
                options={NAV_STYLE_OPTIONS}
                onChange={(value) => onLayoutChange('navigationStyle', value)}
              />
            </FormField>
            <TextInput
              label="Corner radius"
              type="number"
              value={form.layout?.cornerRadius}
              onChange={(event) => onLayoutChange('cornerRadius', event.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Imagery principles</h2>
            <p className="text-sm text-slate-600">
              Document the story, iconography, and photography guidance teams should follow.
            </p>
          </div>
          <StatusPill tone="info">Creative alignment</StatusPill>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <Textarea
            label="Hero narrative"
            rows={5}
            value={form.imagery?.heroGuidelines}
            onChange={(event) => onImageryChange('heroGuidelines', event.target.value)}
          />
          <Textarea
            label="Iconography"
            rows={5}
            value={form.imagery?.iconographyGuidelines}
            onChange={(event) => onImageryChange('iconographyGuidelines', event.target.value)}
          />
          <Textarea
            label="Photography checklist"
            rows={5}
            value={form.imagery?.photographyChecklist}
            onChange={(event) => onImageryChange('photographyChecklist', event.target.value)}
          />
        </div>
      </Card>

      <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Widgets</h2>
            <p className="text-sm text-slate-600">
              Toggle hero modules, stats rails, and announcement treatments for the admin home experience.
            </p>
          </div>
          <StatusPill tone="info">Workspace layout</StatusPill>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Hero banner</h3>
              <Checkbox
                label="Enabled"
                className="text-xs"
                checked={form.widgets?.heroBanner?.enabled}
                onChange={(event) => onWidgetChange('heroBanner', 'enabled', event.target.checked)}
              />
            </div>
            <TextInput
              className="mt-3"
              label="Headline"
              value={form.widgets?.heroBanner?.headline}
              onChange={(event) => onWidgetChange('heroBanner', 'headline', event.target.value)}
            />
            <Textarea
              className="mt-3"
              label="Subheadline"
              rows={3}
              value={form.widgets?.heroBanner?.subheadline}
              onChange={(event) => onWidgetChange('heroBanner', 'subheadline', event.target.value)}
            />
            <TextInput
              className="mt-3"
              label="CTA label"
              value={form.widgets?.heroBanner?.ctaLabel}
              onChange={(event) => onWidgetChange('heroBanner', 'ctaLabel', event.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Stats rail</h3>
              <Checkbox
                label="Enabled"
                className="text-xs"
                checked={form.widgets?.statsRail?.enabled}
                onChange={(event) => onWidgetChange('statsRail', 'enabled', event.target.checked)}
              />
            </div>
            <TextInput
              className="mt-3"
              label="Title"
              value={form.widgets?.statsRail?.title}
              onChange={(event) => onWidgetChange('statsRail', 'title', event.target.value)}
            />
            <TextInput
              className="mt-3"
              label="Metric slots"
              type="number"
              value={form.widgets?.statsRail?.metricSlots}
              onChange={(event) => onWidgetChange('statsRail', 'metricSlots', event.target.value)}
            />
            <FormField id="stats-columns" label="Column layout">
              <SegmentedControl
                name="stats-columns"
                value={form.widgets?.statsRail?.columns}
                options={STAT_COLUMN_OPTIONS}
                onChange={(value) => onWidgetChange('statsRail', 'columns', value)}
              />
            </FormField>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Announcements</h3>
              <Checkbox
                label="Enabled"
                className="text-xs"
                checked={form.widgets?.announcementRail?.enabled}
                onChange={(event) => onWidgetChange('announcementRail', 'enabled', event.target.checked)}
              />
            </div>
            <Textarea
              className="mt-3"
              label="Guidance"
              rows={3}
              value={form.widgets?.announcementRail?.guidance}
              onChange={(event) => onWidgetChange('announcementRail', 'guidance', event.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Quick actions</h3>
              <Checkbox
                label="Enabled"
                className="text-xs"
                checked={form.widgets?.quickActions?.enabled}
                onChange={(event) => onWidgetChange('quickActions', 'enabled', event.target.checked)}
              />
            </div>
            <Textarea
              className="mt-3"
              label="Guidance"
              rows={3}
              value={form.widgets?.quickActions?.guidance}
              onChange={(event) => onWidgetChange('quickActions', 'guidance', event.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Brand assets</h2>
            <p className="text-sm text-slate-600">
              Store logos, hero imagery, and iconography so they are reusable across dashboards.
            </p>
          </div>
          <Button variant="secondary" icon={PhotoIcon} onClick={onAddAsset}>
            Add asset
          </Button>
        </header>
        {form.assets?.length ? (
          <div className="space-y-6">
            {form.assets.map((asset, index) => (
              <AssetRow
                key={asset.id ?? `asset-${index}`}
                asset={asset}
                index={index}
                total={form.assets.length}
                onChange={onAssetChange}
                onMetadataChange={onAssetMetadataChange}
                onMove={onMoveAsset}
                onRemove={onRemoveAsset}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No assets yet. Upload logos, photography, and UI elements to keep teams aligned.
          </div>
        )}
      </Card>

      <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Marketing variants</h2>
            <p className="text-sm text-slate-600">
              Manage hero copy and calls-to-action for campaigns tied to this appearance.
            </p>
          </div>
          <Button variant="secondary" icon={PlusIcon} onClick={onAddVariant}>
            Add variant
          </Button>
        </header>
        {form.variants?.length ? (
          <div className="space-y-6">
            {form.variants.map((variant, index) => (
              <VariantRow
                key={variant.id ?? `variant-${index}`}
                variant={variant}
                index={index}
                total={form.variants.length}
                onChange={onVariantChange}
                onCopyChange={onVariantCopyChange}
                onMove={onMoveVariant}
                onRemove={onRemoveVariant}
                onPreview={onPreviewVariant}
                canPreview={Boolean(form.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No marketing variants configured. Add seasonal or campaign-specific copy blocks.
          </div>
        )}
      </Card>

      <Card padding="lg" className="border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Preview in Theme Studio</h2>
            <p className="text-sm text-slate-600">
              Launch the Theme Studio to validate applied changes in context before publishing.
            </p>
          </div>
          <Button
            as="a"
            href={previewHref ?? undefined}
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            icon={Squares2X2Icon}
            disabled={!previewHref}
          >
            Open preview workspace
          </Button>
        </div>
      </Card>
    </section>
  );
}

AppearanceProfileEditor.propTypes = {
  form: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onGovernanceChange: PropTypes.func.isRequired,
  onColorChange: PropTypes.func.isRequired,
  onTypographyChange: PropTypes.func.isRequired,
  onLayoutChange: PropTypes.func.isRequired,
  onImageryChange: PropTypes.func.isRequired,
  onWidgetChange: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onAssetChange: PropTypes.func.isRequired,
  onAssetMetadataChange: PropTypes.func.isRequired,
  onMoveAsset: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  onAddVariant: PropTypes.func.isRequired,
  onVariantChange: PropTypes.func.isRequired,
  onVariantCopyChange: PropTypes.func.isRequired,
  onMoveVariant: PropTypes.func.isRequired,
  onRemoveVariant: PropTypes.func.isRequired,
  onPreviewVariant: PropTypes.func.isRequired,
  previewHref: PropTypes.string
};
