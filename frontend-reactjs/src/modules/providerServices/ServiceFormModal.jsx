import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import TextInput from '../../components/ui/TextInput.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' }
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'public', label: 'Public' }
];

const KIND_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'package', label: 'Package' }
];

const COVERAGE_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'supplementary', label: 'Supplementary' }
];

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

function renderOption(option) {
  return (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  );
}

function generateId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyZoneAssignment(zones) {
  return {
    localId: generateId('zone'),
    id: null,
    zoneId: zones[0]?.id ?? '',
    coverageType: 'primary',
    priority: 1,
    effectiveFrom: '',
    effectiveTo: '',
    metadata: {}
  };
}

function createEmptyAvailabilityWindow() {
  return {
    localId: generateId('availability'),
    id: null,
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '18:00',
    maxBookings: '',
    label: '',
    isActive: true,
    metadata: {}
  };
}

function createEmptyMediaAsset() {
  return {
    localId: generateId('media'),
    id: null,
    mediaType: 'image',
    url: '',
    title: '',
    altText: '',
    thumbnailUrl: '',
    sortOrder: 0,
    isPrimary: false,
    metadata: {}
  };
}

export default function ServiceFormModal({
  open,
  mode,
  form,
  categories,
  zones,
  saving,
  onChange,
  onSubmit,
  onClose
}) {
  const formId = useMemo(() => `provider-service-form-${mode}`, [mode]);
  const zoneAssignments = Array.isArray(form.zoneAssignments) ? form.zoneAssignments : [];
  const availability = Array.isArray(form.availability) ? form.availability : [];
  const mediaLibrary = Array.isArray(form.mediaLibrary) ? form.mediaLibrary : [];

  const title = mode === 'create' ? 'Create new service' : 'Update service';

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const handleFieldChange = (field) => (event) => {
    onChange(field, event.target.value);
  };

  const handleZoneChange = (index, field, value) => {
    const next = zoneAssignments.map((assignment, idx) =>
      idx === index ? { ...assignment, [field]: value } : assignment
    );
    onChange('zoneAssignments', next);
  };

  const handleAvailabilityChange = (index, field, value) => {
    const next = availability.map((window, idx) => (idx === index ? { ...window, [field]: value } : window));
    onChange('availability', next);
  };

  const handleMediaChange = (index, field, value) => {
    const next = mediaLibrary.map((asset, idx) => (idx === index ? { ...asset, [field]: value } : asset));
    onChange('mediaLibrary', next);
  };

  const addZoneAssignment = () => {
    onChange('zoneAssignments', [...zoneAssignments, createEmptyZoneAssignment(zones)]);
  };

  const removeZoneAssignment = (index) => {
    const next = zoneAssignments.filter((_, idx) => idx !== index);
    onChange('zoneAssignments', next);
  };

  const addAvailabilityWindow = () => {
    onChange('availability', [...availability, createEmptyAvailabilityWindow()]);
  };

  const removeAvailabilityWindow = (index) => {
    const next = availability.filter((_, idx) => idx !== index);
    onChange('availability', next);
  };

  const addMediaAsset = () => {
    onChange('mediaLibrary', [...mediaLibrary, createEmptyMediaAsset()]);
  };

  const removeMediaAsset = (index) => {
    const next = mediaLibrary.filter((_, idx) => idx !== index);
    onChange('mediaLibrary', next);
  };

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button variant="ghost" onClick={onClose} type="button">
        Cancel
      </Button>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          form={formId}
          variant="primary"
          loading={saving}
        >
          {mode === 'create' ? 'Create service' : 'Save changes'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal open={open} title={title} onClose={onClose} size="lg" footer={footer}>
      <form id={formId} onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">Service overview</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Service title" value={form.title} onChange={handleFieldChange('title')} required />
            <TextInput label="Slug" value={form.slug} onChange={handleFieldChange('slug')} placeholder="auto-generated if blank" />
            <TextInput label="Tagline" value={form.tagline} onChange={handleFieldChange('tagline')} />
            <TextInput label="Display URL" value={form.displayUrl} onChange={handleFieldChange('displayUrl')} placeholder="https://" />
            <TextInput label="Hero image URL" value={form.heroImageUrl} onChange={handleFieldChange('heroImageUrl')} placeholder="https://" />
            <TextInput label="Showcase video URL" value={form.showcaseVideoUrl} onChange={handleFieldChange('showcaseVideoUrl')} placeholder="https://" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="fx-field__label" htmlFor={`${formId}-status`}>
                Status
              </label>
              <select
                id={`${formId}-status`}
                className="fx-text-input"
                value={form.status}
                onChange={handleFieldChange('status')}
              >
                {STATUS_OPTIONS.map(renderOption)}
              </select>
            </div>
            <div>
              <label className="fx-field__label" htmlFor={`${formId}-visibility`}>
                Visibility
              </label>
              <select
                id={`${formId}-visibility`}
                className="fx-text-input"
                value={form.visibility}
                onChange={handleFieldChange('visibility')}
              >
                {VISIBILITY_OPTIONS.map(renderOption)}
              </select>
            </div>
            <div>
              <label className="fx-field__label" htmlFor={`${formId}-kind`}>
                Kind
              </label>
              <select
                id={`${formId}-kind`}
                className="fx-text-input"
                value={form.kind}
                onChange={handleFieldChange('kind')}
              >
                {KIND_OPTIONS.map(renderOption)}
              </select>
            </div>
            <div>
              <label className="fx-field__label" htmlFor={`${formId}-category`}>
                Category
              </label>
              <select
                id={`${formId}-category`}
                className="fx-text-input"
                value={form.categoryId ?? ''}
                onChange={(event) => onChange('categoryId', event.target.value || null)}
              >
                <option value="">Unassigned</option>
                {categories.map((category) => (
                  <option key={category.id ?? category.slug ?? category.name} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleFieldChange('price')}
            />
            <TextInput
              label="Currency"
              value={form.currency}
              onChange={handleFieldChange('currency')}
              maxLength={3}
            />
            <TextInput
              label="Crew size"
              type="number"
              min="1"
              value={form.crewSize}
              onChange={handleFieldChange('crewSize')}
            />
            <TextInput
              label="Pricing model"
              value={form.pricingModel}
              onChange={handleFieldChange('pricingModel')}
              placeholder="e.g. fixed, hourly"
            />
            <TextInput
              label="Pricing unit"
              value={form.pricingUnit}
              onChange={handleFieldChange('pricingUnit')}
              placeholder="e.g. per job, per hour"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">Descriptions & media</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="fx-field__label" htmlFor={`${formId}-short-description`}>
                Short description
              </label>
              <textarea
                id={`${formId}-short-description`}
                className="fx-text-input fx-textarea"
                rows={3}
                value={form.shortDescription}
                onChange={handleFieldChange('shortDescription')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="fx-field__label" htmlFor={`${formId}-description`}>
                Detailed description
              </label>
              <textarea
                id={`${formId}-description`}
                className="fx-text-input fx-textarea"
                rows={6}
                value={form.description}
                onChange={handleFieldChange('description')}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="fx-field__label" htmlFor={`${formId}-gallery`}>
                Gallery URLs
              </label>
              <textarea
                id={`${formId}-gallery`}
                className="fx-text-input fx-textarea"
                rows={4}
                value={form.gallery}
                onChange={handleFieldChange('gallery')}
                placeholder="One URL per line. Optionally use: https://example.com | Alt text"
              />
            </div>
            <div className="grid gap-4">
              <TextInput
                label="Tags"
                value={form.tags}
                onChange={handleFieldChange('tags')}
                hint="Comma separated"
              />
              <TextInput
                label="Keyword tags"
                value={form.keywordTags}
                onChange={handleFieldChange('keywordTags')}
                hint="Comma separated for search"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">SEO</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="SEO title" value={form.seoTitle} onChange={handleFieldChange('seoTitle')} />
            <TextInput label="SEO description" value={form.seoDescription} onChange={handleFieldChange('seoDescription')} />
            <TextInput
              label="SEO keywords"
              value={form.seoKeywords}
              onChange={handleFieldChange('seoKeywords')}
              hint="Comma separated"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">Zone coverage</h3>
            <Button type="button" variant="secondary" onClick={addZoneAssignment} disabled={!zones.length}>
              Add zone
            </Button>
          </div>
          {zoneAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">No zones assigned yet. Add a service zone to govern coverage.</p>
          ) : (
            <div className="space-y-4">
              {zoneAssignments.map((assignment, index) => (
                <div
                  key={assignment.localId || assignment.id || index}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="fx-field__label" htmlFor={`${assignment.localId}-zone`}>
                        Zone
                      </label>
                      <select
                        id={`${assignment.localId}-zone`}
                        className="fx-text-input"
                        value={assignment.zoneId ?? ''}
                        onChange={(event) => handleZoneChange(index, 'zoneId', event.target.value)}
                      >
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="fx-field__label" htmlFor={`${assignment.localId}-coverage`}>
                        Coverage type
                      </label>
                      <select
                        id={`${assignment.localId}-coverage`}
                        className="fx-text-input"
                        value={assignment.coverageType ?? 'primary'}
                        onChange={(event) => handleZoneChange(index, 'coverageType', event.target.value)}
                      >
                        {COVERAGE_OPTIONS.map(renderOption)}
                      </select>
                    </div>
                    <TextInput
                      label="Priority"
                      type="number"
                      min="1"
                      value={assignment.priority ?? 1}
                      onChange={(event) => handleZoneChange(index, 'priority', event.target.value)}
                    />
                    <TextInput
                      label="Effective from"
                      type="date"
                      value={assignment.effectiveFrom ?? ''}
                      onChange={(event) => handleZoneChange(index, 'effectiveFrom', event.target.value)}
                    />
                    <TextInput
                      label="Effective to"
                      type="date"
                      value={assignment.effectiveTo ?? ''}
                      onChange={(event) => handleZoneChange(index, 'effectiveTo', event.target.value)}
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button type="button" variant="ghost" onClick={() => removeZoneAssignment(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">Availability windows</h3>
            <Button type="button" variant="secondary" onClick={addAvailabilityWindow}>
              Add window
            </Button>
          </div>
          {availability.length === 0 ? (
            <p className="text-sm text-slate-500">Define availability windows to set booking capacity by day.</p>
          ) : (
            <div className="space-y-4">
              {availability.map((window, index) => (
                <div
                  key={window.localId || window.id || index}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="fx-field__label" htmlFor={`${window.localId}-day`}>
                        Day of week
                      </label>
                      <select
                        id={`${window.localId}-day`}
                        className="fx-text-input"
                        value={window.dayOfWeek}
                        onChange={(event) => handleAvailabilityChange(index, 'dayOfWeek', Number(event.target.value))}
                      >
                        {DAY_OPTIONS.map(renderOption)}
                      </select>
                    </div>
                    <TextInput
                      label="Start time"
                      type="time"
                      value={window.startTime}
                      onChange={(event) => handleAvailabilityChange(index, 'startTime', event.target.value)}
                    />
                    <TextInput
                      label="End time"
                      type="time"
                      value={window.endTime}
                      onChange={(event) => handleAvailabilityChange(index, 'endTime', event.target.value)}
                    />
                    <TextInput
                      label="Max bookings"
                      type="number"
                      min="0"
                      value={window.maxBookings ?? ''}
                      onChange={(event) => handleAvailabilityChange(index, 'maxBookings', event.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Checkbox
                      checked={window.isActive !== false}
                      onChange={(event) => handleAvailabilityChange(index, 'isActive', event.target.checked)}
                      label="Window is active"
                    />
                    <Button type="button" variant="ghost" onClick={() => removeAvailabilityWindow(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">Media library</h3>
            <Button type="button" variant="secondary" onClick={addMediaAsset}>
              Add asset
            </Button>
          </div>
          {mediaLibrary.length === 0 ? (
            <p className="text-sm text-slate-500">Add gallery or showcase assets to enrich the service listing.</p>
          ) : (
            <div className="space-y-4">
              {mediaLibrary.map((asset, index) => (
                <div
                  key={asset.localId || asset.id || index}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="fx-field__label" htmlFor={`${asset.localId}-type`}>
                        Media type
                      </label>
                      <select
                        id={`${asset.localId}-type`}
                        className="fx-text-input"
                        value={asset.mediaType ?? 'image'}
                        onChange={(event) => handleMediaChange(index, 'mediaType', event.target.value)}
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="showcase">Showcase</option>
                      </select>
                    </div>
                    <TextInput
                      label="URL"
                      value={asset.url}
                      onChange={(event) => handleMediaChange(index, 'url', event.target.value)}
                      placeholder="https://"
                    />
                    <TextInput
                      label="Title"
                      value={asset.title ?? ''}
                      onChange={(event) => handleMediaChange(index, 'title', event.target.value)}
                    />
                    <TextInput
                      label="Alt text"
                      value={asset.altText ?? ''}
                      onChange={(event) => handleMediaChange(index, 'altText', event.target.value)}
                    />
                    <TextInput
                      label="Thumbnail URL"
                      value={asset.thumbnailUrl ?? ''}
                      onChange={(event) => handleMediaChange(index, 'thumbnailUrl', event.target.value)}
                    />
                    <TextInput
                      label="Sort order"
                      type="number"
                      value={asset.sortOrder ?? 0}
                      onChange={(event) => handleMediaChange(index, 'sortOrder', event.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Checkbox
                      checked={Boolean(asset.isPrimary)}
                      onChange={(event) => handleMediaChange(index, 'isPrimary', event.target.checked)}
                      label="Use as primary asset"
                    />
                    <Button type="button" variant="ghost" onClick={() => removeMediaAsset(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </form>
    </Modal>
  );
}

ServiceFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.shape({
    title: PropTypes.string.isRequired,
    slug: PropTypes.string,
    tagline: PropTypes.string,
    shortDescription: PropTypes.string,
    description: PropTypes.string,
    displayUrl: PropTypes.string,
    heroImageUrl: PropTypes.string,
    showcaseVideoUrl: PropTypes.string,
    gallery: PropTypes.string,
    tags: PropTypes.string,
    keywordTags: PropTypes.string,
    status: PropTypes.string.isRequired,
    visibility: PropTypes.string.isRequired,
    kind: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    crewSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pricingModel: PropTypes.string,
    pricingUnit: PropTypes.string,
    seoTitle: PropTypes.string,
    seoDescription: PropTypes.string,
    seoKeywords: PropTypes.string,
    zoneAssignments: PropTypes.arrayOf(PropTypes.object),
    availability: PropTypes.arrayOf(PropTypes.object),
    mediaLibrary: PropTypes.arrayOf(PropTypes.object),
    categoryId: PropTypes.string
  }).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string
    })
  ),
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    })
  ),
  saving: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

ServiceFormModal.defaultProps = {
  categories: [],
  zones: [],
  saving: false
};
