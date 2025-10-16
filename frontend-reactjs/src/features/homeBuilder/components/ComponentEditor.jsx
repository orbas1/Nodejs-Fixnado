import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  TrashIcon,
  PhotoIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';
import {
  ALIGNMENT_OPTIONS,
  ANIMATION_OPTIONS,
  COMPONENT_LAYOUTS,
  COMPONENT_TYPES,
  COMPONENT_VARIANTS,
  DEFAULT_COMPONENT_FORM,
  DENSITY_OPTIONS
} from '../constants.js';

function parseList(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ComponentEditor({
  component,
  canMoveUp,
  canMoveDown,
  saving,
  disabled,
  onMove,
  onSave,
  onDelete,
  onDuplicate
}) {
  const [form, setForm] = useState(() => ({
    ...DEFAULT_COMPONENT_FORM,
    ...component,
    media: { ...DEFAULT_COMPONENT_FORM.media, ...(component.media ?? {}) },
    config: { ...DEFAULT_COMPONENT_FORM.config, ...(component.config ?? {}) }
  }));

  useEffect(() => {
    setForm({
      ...DEFAULT_COMPONENT_FORM,
      ...component,
      media: { ...DEFAULT_COMPONENT_FORM.media, ...(component.media ?? {}) },
      config: { ...DEFAULT_COMPONENT_FORM.config, ...(component.config ?? {}) }
    });
  }, [component]);

  const metricsText = useMemo(
    () => (form.config.metrics ?? []).map((metric) => `${metric.label}:${metric.value ?? ''}`).join(', '),
    [form.config.metrics]
  );
  const tagsText = useMemo(() => (form.config.tags ?? []).join(', '), [form.config.tags]);

  const updateField = (key, next) => {
    setForm((current) => ({ ...current, [key]: next }));
  };

  const updateMedia = (key, next) => {
    setForm((current) => ({ ...current, media: { ...current.media, [key]: next } }));
  };

  const updateConfig = (key, next) => {
    setForm((current) => ({ ...current, config: { ...current.config, [key]: next } }));
  };

  const handleSave = () => {
    const metrics = parseList(metricsText).map((entry) => {
      const [label, value] = entry.split(':');
      return label ? { label: label.trim(), value: value?.trim() ?? '' } : null;
    });
    const tags = parseList(tagsText);
    const payload = {
      ...form,
      media: { ...form.media },
      config: {
        ...form.config,
        metrics: metrics.filter(Boolean),
        tags
      }
    };
    onSave?.(payload);
  };

  const handleMoveUp = () => onMove?.('up');
  const handleMoveDown = () => onMove?.('down');

  return (
    <Card className="space-y-5 border border-slate-200" aria-label={`Component ${form.title || component.type}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Component</p>
          <h4 className="text-lg font-semibold text-primary">{form.title || 'Untitled component'}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            icon={ArrowUpIcon}
            onClick={handleMoveUp}
            disabled={!canMoveUp || disabled || saving}
            aria-label="Move component up"
          />
          <Button
            type="button"
            variant="ghost"
            icon={ArrowDownIcon}
            onClick={handleMoveDown}
            disabled={!canMoveDown || disabled || saving}
            aria-label="Move component down"
          />
          <Button
            type="button"
            variant="ghost"
            icon={Squares2X2Icon}
            onClick={() => onDuplicate?.()}
            disabled={disabled || saving}
            aria-label="Duplicate component"
          />
          <Button
            type="button"
            variant="ghost"
            icon={TrashIcon}
            onClick={() => onDelete?.()}
            disabled={disabled || saving}
            aria-label="Delete component"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="fx-field">
          <span className="fx-field__label">Component type</span>
          <select
            className="fx-select"
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
            disabled={disabled || saving}
          >
            {COMPONENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fx-field">
          <span className="fx-field__label">Layout</span>
          <select
            className="fx-select"
            value={form.layout}
            onChange={(event) => updateField('layout', event.target.value)}
            disabled={disabled || saving}
          >
            {COMPONENT_LAYOUTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fx-field">
          <span className="fx-field__label">Variant</span>
          <select
            className="fx-select"
            value={form.variant}
            onChange={(event) => updateField('variant', event.target.value)}
            disabled={disabled || saving}
          >
            {COMPONENT_VARIANTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fx-field">
          <span className="fx-field__label">Alignment</span>
          <select
            className="fx-select"
            value={form.config.alignment}
            onChange={(event) => updateConfig('alignment', event.target.value)}
            disabled={disabled || saving}
          >
            {ALIGNMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fx-field">
          <span className="fx-field__label">Density</span>
          <select
            className="fx-select"
            value={form.config.density}
            onChange={(event) => updateConfig('density', event.target.value)}
            disabled={disabled || saving}
          >
            {DENSITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fx-field">
          <span className="fx-field__label">Entrance animation</span>
          <select
            className="fx-select"
            value={form.config.animation}
            onChange={(event) => updateConfig('animation', event.target.value)}
            disabled={disabled || saving}
          >
            {ANIMATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Title"
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          label="Subheading"
          value={form.subheading}
          onChange={(event) => updateField('subheading', event.target.value)}
          disabled={disabled || saving}
        />
        <label className="fx-field md:col-span-2">
          <span className="fx-field__label">Body copy</span>
          <textarea
            className="fx-text-input"
            style={{ minHeight: '120px', paddingBlock: '1rem' }}
            value={form.body}
            onChange={(event) => updateField('body', event.target.value)}
            disabled={disabled || saving}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Badge"
          value={form.badge}
          onChange={(event) => updateField('badge', event.target.value)}
          disabled={disabled || saving}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            type="color"
            label="Background"
            value={form.backgroundColor}
            onChange={(event) => updateField('backgroundColor', event.target.value)}
            disabled={disabled || saving}
          />
          <TextInput
            type="color"
            label="Text colour"
            value={form.textColor}
            onChange={(event) => updateField('textColor', event.target.value)}
            disabled={disabled || saving}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Primary CTA label"
          value={form.callToActionLabel}
          onChange={(event) => updateField('callToActionLabel', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          label="Primary CTA URL"
          value={form.callToActionHref}
          onChange={(event) => updateField('callToActionHref', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          label="Secondary CTA label"
          value={form.secondaryActionLabel}
          onChange={(event) => updateField('secondaryActionLabel', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          label="Secondary CTA URL"
          value={form.secondaryActionHref}
          onChange={(event) => updateField('secondaryActionHref', event.target.value)}
          disabled={disabled || saving}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TextInput
          label="Image URL"
          value={form.media.primaryUrl}
          onChange={(event) => updateMedia('primaryUrl', event.target.value)}
          prefix={<PhotoIcon className="h-4 w-4 text-slate-400" />}
          disabled={disabled || saving}
        />
        <TextInput
          label="Alt text"
          value={form.media.altText}
          onChange={(event) => updateMedia('altText', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          label="Video URL"
          value={form.media.videoUrl}
          onChange={(event) => updateMedia('videoUrl', event.target.value)}
          prefix={<LinkIcon className="h-4 w-4 text-slate-400" />}
          disabled={disabled || saving}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="fx-field">
          <span className="fx-field__label">Metrics (label:value)</span>
          <textarea
            className="fx-text-input"
            style={{ minHeight: '96px', paddingBlock: '0.75rem' }}
            value={metricsText}
            onChange={(event) => {
              const items = parseList(event.target.value).map((entry) => {
                const [label, value] = entry.split(':');
                return label ? { label: label.trim(), value: value?.trim() ?? '' } : null;
              });
              updateConfig(
                'metrics',
                items.filter(Boolean)
              );
            }}
            disabled={disabled || saving}
          />
        </label>
        <label className="fx-field">
          <span className="fx-field__label">Tags</span>
          <textarea
            className="fx-text-input"
            style={{ minHeight: '96px', paddingBlock: '0.75rem' }}
            value={tagsText}
            onChange={(event) => updateConfig('tags', parseList(event.target.value))}
            disabled={disabled || saving}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Checkbox
          label="Show badge"
          checked={Boolean(form.config.showBadge)}
          onChange={(event) => updateConfig('showBadge', event.target.checked)}
          disabled={disabled || saving}
        />
        <Checkbox
          label="Show secondary action"
          checked={Boolean(form.config.showSecondaryAction)}
          onChange={(event) => updateConfig('showSecondaryAction', event.target.checked)}
          disabled={disabled || saving}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" onClick={handleSave} disabled={disabled || saving} loading={saving}>
          Save component
        </Button>
        <Button
          type="button"
          variant="ghost"
          icon={ArrowPathIcon}
          onClick={() => setForm({
            ...DEFAULT_COMPONENT_FORM,
            ...component,
            media: { ...DEFAULT_COMPONENT_FORM.media, ...(component.media ?? {}) },
            config: { ...DEFAULT_COMPONENT_FORM.config, ...(component.config ?? {}) }
          })}
          disabled={disabled || saving}
        >
          Reset
        </Button>
      </div>
    </Card>
  );
}

ComponentEditor.propTypes = {
  component: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string,
    title: PropTypes.string,
    subheading: PropTypes.string,
    body: PropTypes.string,
    badge: PropTypes.string,
    layout: PropTypes.string,
    variant: PropTypes.string,
    backgroundColor: PropTypes.string,
    textColor: PropTypes.string,
    media: PropTypes.object,
    config: PropTypes.object,
    callToActionLabel: PropTypes.string,
    callToActionHref: PropTypes.string,
    secondaryActionLabel: PropTypes.string,
    secondaryActionHref: PropTypes.string
  }).isRequired,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
  saving: PropTypes.bool,
  disabled: PropTypes.bool,
  onMove: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func
};

ComponentEditor.defaultProps = {
  canMoveUp: false,
  canMoveDown: false,
  saving: false,
  disabled: false,
  onMove: undefined,
  onSave: undefined,
  onDelete: undefined,
  onDuplicate: undefined
};
