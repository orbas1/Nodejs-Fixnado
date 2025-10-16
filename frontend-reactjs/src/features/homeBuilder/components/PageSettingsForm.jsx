import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowUpOnSquareIcon, ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, StatusPill, TextInput } from '../../../components/ui/index.js';
import { LAYOUT_OPTIONS, HERO_LAYOUT_OPTIONS, STATUS_TONE } from '../constants.js';

function buildStatusMeta(status, publishedAt) {
  if (status === 'published') {
    return publishedAt ? `Published ${new Date(publishedAt).toLocaleString()}` : 'Published';
  }
  if (status === 'archived') {
    return 'Archived – changes locked';
  }
  return 'Draft – not visible to visitors';
}

export default function PageSettingsForm({
  value,
  status,
  publishedAt,
  saving,
  disabled,
  onChange,
  onSubmit,
  onPublish,
  onArchive,
  onDelete
}) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  const statusCaption = useMemo(() => buildStatusMeta(status, publishedAt), [status, publishedAt]);

  const updateField = (key, next) => {
    onChange?.({ ...value, [key]: next });
  };

  const updateSetting = (key, next) => {
    onChange?.({ ...value, settings: { ...value.settings, [key]: next } });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value);
  };

  return (
    <Card as="section" className="space-y-6" aria-labelledby="home-page-settings-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="home-page-settings-heading" className="text-xl font-semibold text-primary">
            Page settings
          </h2>
          <p className="text-sm text-slate-500">
            Manage the metadata, layout, and theme for the selected marketing home page.
          </p>
        </div>
        <StatusPill tone={tone}>{status}</StatusPill>
      </div>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Page name"
            value={value.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
            disabled={disabled}
          />
          <TextInput
            label="Slug"
            hint="The public URL will use /{slug}."
            value={value.slug}
            onChange={(event) => updateField('slug', event.target.value)}
            disabled={disabled}
          />
        </div>

        <TextInput
          label="Description"
          value={value.description}
          onChange={(event) => updateField('description', event.target.value)}
          disabled={disabled}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <label className="fx-field">
            <span className="fx-field__label">Primary theme</span>
            <select
              className="fx-select"
              value={value.theme}
              onChange={(event) => updateField('theme', event.target.value)}
              disabled={disabled}
            >
              <option value="standard">Standard</option>
              <option value="vibrant">Vibrant</option>
              <option value="minimal">Minimal</option>
            </select>
          </label>
          <label className="fx-field">
            <span className="fx-field__label">Layout</span>
            <select
              className="fx-select"
              value={value.layout}
              onChange={(event) => updateField('layout', event.target.value)}
              disabled={disabled}
            >
              {LAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            type="color"
            label="Accent colour"
            value={value.accentColor}
            onChange={(event) => updateField('accentColor', event.target.value)}
            disabled={disabled}
          />
          <TextInput
            type="color"
            label="Background colour"
            value={value.backgroundColor}
            onChange={(event) => updateField('backgroundColor', event.target.value)}
            disabled={disabled}
          />
        </div>

        <label className="fx-field">
          <span className="fx-field__label">Hero layout</span>
          <select
            className="fx-select"
            value={value.heroLayout}
            onChange={(event) => updateField('heroLayout', event.target.value)}
            disabled={disabled}
          >
            {HERO_LAYOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="SEO title"
            value={value.seoTitle}
            onChange={(event) => updateField('seoTitle', event.target.value)}
            disabled={disabled}
          />
          <TextInput
            label="SEO description"
            value={value.seoDescription}
            onChange={(event) => updateField('seoDescription', event.target.value)}
            disabled={disabled}
          />
        </div>

        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4">
          <legend className="text-sm font-semibold text-slate-600">Announcement banner</legend>
          <Checkbox
            label="Enable hero announcement"
            checked={Boolean(value.settings.announcementEnabled)}
            onChange={(event) => updateSetting('announcementEnabled', event.target.checked)}
            disabled={disabled}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Message"
              value={value.settings.announcementMessage ?? ''}
              onChange={(event) => updateSetting('announcementMessage', event.target.value)}
              disabled={disabled}
            />
            <TextInput
              label="Link label"
              value={value.settings.announcementLinkLabel ?? ''}
              onChange={(event) => updateSetting('announcementLinkLabel', event.target.value)}
              disabled={disabled}
            />
            <TextInput
              label="Link URL"
              value={value.settings.announcementLinkHref ?? ''}
              onChange={(event) => updateSetting('announcementLinkHref', event.target.value)}
              disabled={disabled}
            />
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            type="color"
            label="Primary palette"
            value={value.settings.palettePrimary ?? '#1445E0'}
            onChange={(event) => updateSetting('palettePrimary', event.target.value)}
            disabled={disabled}
          />
          <TextInput
            type="color"
            label="Secondary palette"
            value={value.settings.paletteSecondary ?? '#0EA5E9'}
            onChange={(event) => updateSetting('paletteSecondary', event.target.value)}
            disabled={disabled}
          />
          <TextInput
            type="color"
            label="Accent palette"
            value={value.settings.paletteAccent ?? '#38BDF8'}
            onChange={(event) => updateSetting('paletteAccent', event.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={disabled || saving} loading={saving}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={ArrowUpOnSquareIcon}
            onClick={() => onPublish?.()}
            disabled={disabled || status === 'archived' || saving}
          >
            Publish
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={ArchiveBoxIcon}
            onClick={() => onArchive?.()}
            disabled={disabled || status === 'archived' || saving}
          >
            Archive
          </Button>
          <Button
            type="button"
            variant="danger"
            icon={TrashIcon}
            onClick={() => onDelete?.()}
            disabled={disabled || saving}
          >
            Delete page
          </Button>
        </div>

        <p className="text-xs text-slate-500">{statusCaption}</p>
      </form>
    </Card>
  );
}

PageSettingsForm.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string,
    description: PropTypes.string,
    theme: PropTypes.string,
    layout: PropTypes.string,
    accentColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    heroLayout: PropTypes.string,
    seoTitle: PropTypes.string,
    seoDescription: PropTypes.string,
    settings: PropTypes.object
  }).isRequired,
  status: PropTypes.string.isRequired,
  publishedAt: PropTypes.string,
  saving: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onPublish: PropTypes.func,
  onArchive: PropTypes.func,
  onDelete: PropTypes.func
};

PageSettingsForm.defaultProps = {
  publishedAt: undefined,
  saving: false,
  disabled: false,
  onChange: undefined,
  onSubmit: undefined,
  onPublish: undefined,
  onArchive: undefined,
  onDelete: undefined
};
