import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Squares2X2Icon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';
import { DEFAULT_COMPONENT_FORM, DEFAULT_SECTION_FORM } from '../constants.js';
import ComponentEditor from './ComponentEditor.jsx';

export default function SectionEditor({
  section,
  canMoveUp,
  canMoveDown,
  disabled,
  saving,
  componentSavingIds,
  onSave,
  onMove,
  onDelete,
  onDuplicate,
  onCreateComponent,
  onUpdateComponent,
  onDeleteComponent,
  onReorderComponent,
  onDuplicateComponent
}) {
  const [form, setForm] = useState(() => ({
    ...DEFAULT_SECTION_FORM,
    ...section,
    settings: { ...DEFAULT_SECTION_FORM.settings, ...(section.settings ?? {}) }
  }));
  const [newComponent, setNewComponent] = useState({
    type: DEFAULT_COMPONENT_FORM.type,
    title: '',
    layout: DEFAULT_COMPONENT_FORM.layout
  });

  useEffect(() => {
    setForm({
      ...DEFAULT_SECTION_FORM,
      ...section,
      settings: { ...DEFAULT_SECTION_FORM.settings, ...(section.settings ?? {}) }
    });
  }, [section]);

  const updateField = (key, next) => setForm((current) => ({ ...current, [key]: next }));
  const updateSetting = (key, next) =>
    setForm((current) => ({ ...current, settings: { ...current.settings, [key]: next } }));

  const handleSave = () => {
    const payload = {
      title: form.title,
      handle: form.handle,
      description: form.description,
      layout: form.layout,
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      accentColor: form.accentColor,
      settings: form.settings
    };
    onSave?.(payload);
  };

  const handleCreateComponent = () => {
    onCreateComponent?.({
      ...DEFAULT_COMPONENT_FORM,
      type: newComponent.type,
      title: newComponent.title,
      layout: newComponent.layout
    });
    setNewComponent({ type: DEFAULT_COMPONENT_FORM.type, title: '', layout: DEFAULT_COMPONENT_FORM.layout });
  };

  return (
    <Card as="section" className="space-y-6" aria-labelledby={`section-${section.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Section</p>
          <h3 id={`section-${section.id}`} className="text-xl font-semibold text-primary">
            {form.title || 'Untitled section'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            icon={ArrowUpIcon}
            onClick={() => onMove?.('up')}
            disabled={!canMoveUp || disabled || saving}
            aria-label="Move section up"
          />
          <Button
            type="button"
            variant="ghost"
            icon={ArrowDownIcon}
            onClick={() => onMove?.('down')}
            disabled={!canMoveDown || disabled || saving}
            aria-label="Move section down"
          />
          <Button
            type="button"
            variant="ghost"
            icon={Squares2X2Icon}
            onClick={() => onDuplicate?.()}
            disabled={disabled || saving}
            aria-label="Duplicate section"
          />
          <Button
            type="button"
            variant="ghost"
            icon={TrashIcon}
            onClick={() => onDelete?.()}
            disabled={disabled || saving}
            aria-label="Delete section"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Title"
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          label="Handle"
          hint="Used for anchors and analytics."
          value={form.handle}
          onChange={(event) => updateField('handle', event.target.value)}
          disabled={disabled || saving}
        />
        <label className="fx-field md:col-span-2">
          <span className="fx-field__label">Description</span>
          <textarea
            className="fx-text-input"
            style={{ minHeight: '100px', paddingBlock: '0.75rem' }}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            disabled={disabled || saving}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="fx-field">
          <span className="fx-field__label">Layout</span>
          <select
            className="fx-select"
            value={form.layout}
            onChange={(event) => updateField('layout', event.target.value)}
            disabled={disabled || saving}
          >
            <option value="full-width">Full width</option>
            <option value="split">Split</option>
            <option value="grid">Grid</option>
            <option value="feature">Feature highlight</option>
          </select>
        </label>
        <TextInput
          type="color"
          label="Background"
          value={form.backgroundColor}
          onChange={(event) => updateField('backgroundColor', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          type="color"
          label="Text"
          value={form.textColor}
          onChange={(event) => updateField('textColor', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          type="color"
          label="Accent"
          value={form.accentColor}
          onChange={(event) => updateField('accentColor', event.target.value)}
          disabled={disabled || saving}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Anchor ID"
          value={form.settings.anchorId}
          onChange={(event) => updateSetting('anchorId', event.target.value)}
          disabled={disabled || saving}
        />
        <TextInput
          label="Navigation label"
          value={form.settings.navigationLabel}
          onChange={(event) => updateSetting('navigationLabel', event.target.value)}
          disabled={disabled || saving}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="fx-field">
          <span className="fx-field__label">Max width</span>
          <select
            className="fx-select"
            value={form.settings.maxWidth}
            onChange={(event) => updateSetting('maxWidth', event.target.value)}
            disabled={disabled || saving}
          >
            <option value="5xl">Medium</option>
            <option value="7xl">Wide</option>
            <option value="full">Edge to edge</option>
          </select>
        </label>
        <TextInput
          label="Columns"
          value={form.settings.columns}
          onChange={(event) => updateSetting('columns', event.target.value)}
          disabled={disabled || saving}
        />
        <label className="fx-field">
          <span className="fx-field__label">Vertical padding</span>
          <select
            className="fx-select"
            value={form.settings.paddingY}
            onChange={(event) => updateSetting('paddingY', event.target.value)}
            disabled={disabled || saving}
          >
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra large</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Checkbox
          label="Show top divider"
          checked={Boolean(form.settings.showTopDivider)}
          onChange={(event) => updateSetting('showTopDivider', event.target.checked)}
          disabled={disabled || saving}
        />
        <Checkbox
          label="Show bottom divider"
          checked={Boolean(form.settings.showBottomDivider)}
          onChange={(event) => updateSetting('showBottomDivider', event.target.checked)}
          disabled={disabled || saving}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" onClick={handleSave} disabled={disabled || saving} loading={saving}>
          Save section
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-primary">Components</h4>
          <div className="flex flex-wrap items-center gap-3">
            <label className="fx-field">
              <span className="fx-field__label">Type</span>
              <select
                className="fx-select"
                value={newComponent.type}
                onChange={(event) => setNewComponent((current) => ({ ...current, type: event.target.value }))}
                disabled={disabled || saving}
              >
                <option value="hero">Hero banner</option>
                <option value="story">Story block</option>
                <option value="cta">Call to action</option>
                <option value="stats">Metrics grid</option>
                <option value="testimonial">Testimonial</option>
                <option value="gallery">Gallery</option>
              </select>
            </label>
            <TextInput
              label="Title"
              value={newComponent.title}
              onChange={(event) => setNewComponent((current) => ({ ...current, title: event.target.value }))}
              disabled={disabled || saving}
            />
            <Button
              type="button"
              icon={PlusIcon}
              onClick={handleCreateComponent}
              disabled={disabled || saving}
            >
              Add component
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {section.components?.map((component, index) => (
            <ComponentEditor
              key={component.id}
              component={component}
              canMoveUp={index > 0}
              canMoveDown={index < section.components.length - 1}
              disabled={disabled}
              saving={componentSavingIds.includes(component.id)}
              onMove={(direction) => onReorderComponent?.(component.id, direction)}
              onSave={(payload) => onUpdateComponent?.(component.id, payload)}
              onDelete={() => onDeleteComponent?.(component.id)}
              onDuplicate={() => onDuplicateComponent?.(component.id)}
            />
          ))}
          {!section.components?.length && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-500">
              No components yet. Create your first component to populate this section.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

SectionEditor.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    handle: PropTypes.string,
    description: PropTypes.string,
    layout: PropTypes.string,
    backgroundColor: PropTypes.string,
    textColor: PropTypes.string,
    accentColor: PropTypes.string,
    settings: PropTypes.object,
    components: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
  disabled: PropTypes.bool,
  saving: PropTypes.bool,
  componentSavingIds: PropTypes.arrayOf(PropTypes.string),
  onSave: PropTypes.func,
  onMove: PropTypes.func,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onCreateComponent: PropTypes.func,
  onUpdateComponent: PropTypes.func,
  onDeleteComponent: PropTypes.func,
  onReorderComponent: PropTypes.func,
  onDuplicateComponent: PropTypes.func
};

SectionEditor.defaultProps = {
  canMoveUp: false,
  canMoveDown: false,
  disabled: false,
  saving: false,
  componentSavingIds: [],
  onSave: undefined,
  onMove: undefined,
  onDelete: undefined,
  onDuplicate: undefined,
  onCreateComponent: undefined,
  onUpdateComponent: undefined,
  onDeleteComponent: undefined,
  onReorderComponent: undefined,
  onDuplicateComponent: undefined
};
