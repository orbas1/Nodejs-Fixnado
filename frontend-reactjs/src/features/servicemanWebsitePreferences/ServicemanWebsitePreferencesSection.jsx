import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';
import TextInput from '../../components/ui/TextInput.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import FormField from '../../components/ui/FormField.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import {
  DEFAULT_SERVICEMAN_WEBSITE_META,
  DEFAULT_SERVICEMAN_WEBSITE_PREFERENCES,
  fetchServicemanWebsitePreferences,
  persistServicemanWebsitePreferences
} from '../../api/servicemanWebsitePreferencesClient.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

function mergeSnapshot(preferences = null, meta = null) {
  const mergedPreferences = clone(DEFAULT_SERVICEMAN_WEBSITE_PREFERENCES);
  if (preferences && typeof preferences === 'object') {
    Object.keys(mergedPreferences).forEach((sectionKey) => {
      mergedPreferences[sectionKey] = {
        ...mergedPreferences[sectionKey],
        ...(preferences[sectionKey] ?? {})
      };
    });
  }
  return {
    preferences: mergedPreferences,
    meta: { ...DEFAULT_SERVICEMAN_WEBSITE_META, ...(meta ?? {}) }
  };
}

function SectionCard({ title, description, children, actions }) {
  return (
    <section className="rounded-3xl border border-accent/10 bg-white shadow-sm">
      <header className="flex flex-col gap-2 border-b border-accent/10 bg-gradient-to-r from-secondary/40 via-white to-white px-6 py-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          {description ? <p className="text-sm text-slate-600 max-w-2xl">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </header>
      <div className="space-y-6 px-6 py-6">{children}</div>
    </section>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node
};

SectionCard.defaultProps = {
  description: undefined,
  actions: null
};

function ChipList({ label, values, onRemove }) {
  if (!values || values.length === 0) {
    return (
      <p className="text-sm text-slate-500" data-qa={`${label}-empty`}>
        No entries yet.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2" aria-label={label}>
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 text-sm text-primary"
        >
          <span>{value}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs font-semibold uppercase tracking-wide text-accent hover:text-accent/80"
            aria-label={`Remove ${value}`}
          >
            Remove
          </button>
        </span>
      ))}
    </div>
  );
}

ChipList.propTypes = {
  label: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.string),
  onRemove: PropTypes.func.isRequired
};

ChipList.defaultProps = {
  values: []
};

function ListEditor({
  id,
  label,
  hint,
  placeholder,
  values,
  onChange,
  buttonLabel
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (values.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...values, trimmed]);
    setInputValue('');
  }, [inputValue, onChange, values]);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div className="space-y-3">
      <FormField id={`${id}-input`} label={label} hint={hint}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <TextInput
            id={`${id}-input`}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={handleAdd} disabled={!inputValue.trim()}>
            {buttonLabel}
          </Button>
        </div>
      </FormField>
      <ChipList label={label} values={values} onRemove={(index) => onChange(values.filter((_, i) => i !== index))} />
    </div>
  );
}

ListEditor.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  placeholder: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string
};

ListEditor.defaultProps = {
  hint: undefined,
  placeholder: '',
  values: [],
  buttonLabel: 'Add'
};

function TextareaField({ id, label, value, onChange, hint, placeholder, rows }) {
  return (
    <FormField id={id} label={label} hint={hint}>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="fx-text-input fx-textarea w-full"
      />
    </FormField>
  );
}

TextareaField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  hint: PropTypes.string,
  placeholder: PropTypes.string,
  rows: PropTypes.number
};

TextareaField.defaultProps = {
  hint: undefined,
  placeholder: '',
  rows: 4
};

function StructuredListEditor({
  id,
  label,
  values,
  onChange,
  schema,
  emptyLabel,
  maxItems
}) {
  const handleAdd = useCallback(() => {
    if (maxItems && values.length >= maxItems) {
      return;
    }
    const blank = Object.fromEntries(schema.map((field) => [field.name, '']));
    onChange([...values, blank]);
  }, [maxItems, onChange, schema, values]);

  const handleUpdate = useCallback(
    (index, field, value) => {
      const next = values.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      );
      onChange(next);
    },
    [onChange, values]
  );

  const handleRemove = useCallback(
    (index) => {
      onChange(values.filter((_, itemIndex) => itemIndex !== index));
    },
    [onChange, values]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/70">{label}</h4>
        <Button type="button" variant="secondary" onClick={handleAdd} disabled={maxItems && values.length >= maxItems}>
          Add
        </Button>
      </div>
      {values.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="space-y-4">
          {values.map((item, index) => (
            <div key={`${id}-${index}`} className="rounded-2xl border border-accent/10 bg-secondary/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-primary">Entry {index + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(index)}>
                  Remove
                </Button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {schema.map((field) => (
                  <TextInput
                    key={field.name}
                    label={field.label}
                    value={item[field.name] ?? ''}
                    onChange={(event) => handleUpdate(index, field.name, event.target.value)}
                    placeholder={field.placeholder}
                    className={field.fullWidth ? 'md:col-span-2' : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

StructuredListEditor.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func.isRequired,
  schema: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      placeholder: PropTypes.string,
      fullWidth: PropTypes.bool
    })
  ).isRequired,
  emptyLabel: PropTypes.string,
  maxItems: PropTypes.number
};

StructuredListEditor.defaultProps = {
  values: [],
  emptyLabel: 'No entries added yet.',
  maxItems: undefined
};

export default function ServicemanWebsitePreferencesSection({ data }) {
  const initialSnapshot = useMemo(
    () => (data?.initialPreferences || data?.meta ? mergeSnapshot(data.initialPreferences, data.meta) : null),
    [data]
  );
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [form, setForm] = useState(initialSnapshot?.preferences ?? clone(DEFAULT_SERVICEMAN_WEBSITE_PREFERENCES));
  const [meta, setMeta] = useState(initialSnapshot?.meta ?? { ...DEFAULT_SERVICEMAN_WEBSITE_META });
  const [loading, setLoading] = useState(!initialSnapshot);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!initialSnapshot) {
      return;
    }
    setSnapshot(initialSnapshot);
    setForm(initialSnapshot.preferences);
    setMeta(initialSnapshot.meta);
  }, [initialSnapshot]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchServicemanWebsitePreferences({ signal: controller.signal })
      .then((response) => {
        setSnapshot(response);
        setForm(response.preferences);
        setMeta(response.meta);
        setError(null);
      })
      .catch((caught) => {
        if (caught?.name === 'AbortError') {
          return;
        }
        setError(caught?.message || 'Failed to load website preferences.');
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, []);

  const updateSection = useCallback((section, updates) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  }, []);

  const dirty = useMemo(() => {
    if (!snapshot) {
      return true;
    }
    return JSON.stringify(snapshot.preferences) !== JSON.stringify(form);
  }, [form, snapshot]);

  const handleReset = useCallback(() => {
    if (!snapshot) {
      setForm(clone(DEFAULT_SERVICEMAN_WEBSITE_PREFERENCES));
      setMeta({ ...DEFAULT_SERVICEMAN_WEBSITE_META });
      return;
    }
    setForm(snapshot.preferences);
    setMeta(snapshot.meta);
    setError(null);
    setSuccess(null);
  }, [snapshot]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchServicemanWebsitePreferences()
      .then((response) => {
        setSnapshot(response);
        setForm(response.preferences);
        setMeta(response.meta);
        setError(null);
      })
      .catch((caught) => {
        if (caught?.name === 'AbortError') {
          return;
        }
        setError(caught?.message || 'Failed to refresh website preferences.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        const payload = await persistServicemanWebsitePreferences(form);
        setSnapshot(payload);
        setForm(payload.preferences);
        setMeta(payload.meta);
        setSuccess('Website preferences saved successfully.');
      } catch (caught) {
        setError(caught?.message || 'Failed to save website preferences.');
      } finally {
        setSaving(false);
      }
    },
    [form]
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!meta?.updatedAt) {
      return 'Not saved yet';
    }
    try {
      return new Date(meta.updatedAt).toLocaleString();
    } catch {
      return meta.updatedAt;
    }
  }, [meta?.updatedAt]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-accent/20 bg-gradient-to-r from-primary/5 via-white to-secondary/40 px-6 py-6 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Serviceman control centre</p>
          <h2 className="text-2xl font-semibold text-primary">Website Preferences</h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Configure how your crew microsite looks, how enquiries flow into the pipeline, and who can publish updates.
          </p>
        </div>
        <div className="rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-primary">Last updated</p>
          <p>{lastUpdatedLabel}</p>
          <p className="mt-1 text-xs text-slate-500">Roles allowed to edit: {meta?.allowedRoles?.join(', ') || 'serviceman'}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard
          title="General setup"
          description="Hero messaging, microsite hero imagery, and the primary call-to-action."
        >
          <TextInput
            label="Hero title"
            value={form.general.heroTitle}
            onChange={(event) => updateSection('general', { heroTitle: event.target.value })}
            required
          />
          <TextInput
            label="Hero subtitle"
            value={form.general.heroSubtitle}
            onChange={(event) => updateSection('general', { heroSubtitle: event.target.value })}
          />
          <TextareaField
            id="general-hero-tagline"
            label="Hero tagline"
            value={form.general.heroTagline}
            onChange={(event) => updateSection('general', { heroTagline: event.target.value })}
            rows={3}
          />
          <TextareaField
            id="general-about"
            label="About the crew"
            value={form.general.aboutContent}
            onChange={(event) => updateSection('general', { aboutContent: event.target.value })}
            hint="This appears in the microsite about panel and for search snippets."
            rows={5}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Primary call to action"
              value={form.general.callToActionLabel}
              onChange={(event) => updateSection('general', { callToActionLabel: event.target.value })}
              required
            />
            <TextInput
              label="Call to action URL"
              value={form.general.callToActionUrl}
              onChange={(event) => updateSection('general', { callToActionUrl: event.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Hero image URL"
              value={form.general.heroImageUrl}
              onChange={(event) => updateSection('general', { heroImageUrl: event.target.value })}
              placeholder="https://cdn.fixnado.com/crew-hero.jpg"
            />
            <TextInput
              label="Logo URL"
              value={form.branding.logoUrl}
              onChange={(event) => updateSection('branding', { logoUrl: event.target.value })}
              placeholder="https://cdn.fixnado.com/crew-logo.png"
            />
          </div>
        </SectionCard>

        <SectionCard title="Branding & gallery" description="Control colours, layout, and showcase media.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Primary colour"
              value={form.branding.primaryColor}
              onChange={(event) => updateSection('branding', { primaryColor: event.target.value })}
              placeholder="#1D4ED8"
            />
            <TextInput
              label="Accent colour"
              value={form.branding.accentColor}
              onChange={(event) => updateSection('branding', { accentColor: event.target.value })}
              placeholder="#0EA5E9"
            />
            <TextInput
              label="Theme"
              hint="Allowed: light, dark, system"
              value={form.branding.theme}
              onChange={(event) => updateSection('branding', { theme: event.target.value })}
            />
            <TextInput
              label="Layout"
              hint="Allowed: spotlight, columns, split"
              value={form.branding.layout}
              onChange={(event) => updateSection('branding', { layout: event.target.value })}
            />
          </div>

          <StructuredListEditor
            id="gallery"
            label="Gallery media"
            values={form.branding.galleryMedia}
            onChange={(entries) => updateSection('branding', { galleryMedia: entries })}
            schema={[
              { name: 'url', label: 'Image URL', placeholder: 'https://cdn.fixnado.com/crew.jpg', fullWidth: true },
              { name: 'altText', label: 'Alt text', placeholder: 'Crew on site', fullWidth: true }
            ]}
            emptyLabel="No gallery images added yet."
            maxItems={12}
          />
        </SectionCard>

        <SectionCard title="Contact & servicing" description="How customers can reach you and which zones you cover.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Crew contact email"
              value={form.contact.contactEmail}
              onChange={(event) => updateSection('contact', { contactEmail: event.target.value })}
              required
              type="email"
            />
            <TextInput
              label="Crew phone"
              value={form.contact.contactPhone}
              onChange={(event) => updateSection('contact', { contactPhone: event.target.value })}
              placeholder="+44 20 1234 5678"
            />
            <TextInput
              label="Emergency phone"
              value={form.contact.emergencyPhone}
              onChange={(event) => updateSection('contact', { emergencyPhone: event.target.value })}
              placeholder="+44 20 7654 3210"
            />
            <TextInput
              label="Booking URL"
              value={form.contact.bookingUrl}
              onChange={(event) => updateSection('contact', { bookingUrl: event.target.value })}
              placeholder="https://app.fixnado.com/bookings"
            />
          </div>

          <ListEditor
            id="service-areas"
            label="Service areas"
            hint="Regions or zones you actively cover."
            placeholder="Metro North"
            values={form.contact.serviceAreas}
            onChange={(next) => updateSection('contact', { serviceAreas: next })}
          />

          <ListEditor
            id="service-tags"
            label="Service tags"
            hint="These inform search and SEO keywords."
            placeholder="HVAC"
            values={form.contact.serviceTags}
            onChange={(next) => updateSection('contact', { serviceTags: next })}
          />

          <StructuredListEditor
            id="contact-hours"
            label="Contact hours"
            values={form.contact.contactHours}
            onChange={(entries) => updateSection('contact', { contactHours: entries })}
            schema={[
              { name: 'label', label: 'Label', placeholder: 'Weekdays 06:00 - 20:00', fullWidth: true },
              { name: 'value', label: 'Detail', placeholder: 'Response in 1 hour', fullWidth: true }
            ]}
            emptyLabel="No contact hours configured."
            maxItems={10}
          />

          <ListEditor
            id="languages"
            label="Languages supported"
            placeholder="English"
            values={form.contact.languages}
            onChange={(next) => updateSection('contact', { languages: next })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Facebook URL"
              value={form.contact.socialLinks.facebook}
              onChange={(event) =>
                updateSection('contact', {
                  socialLinks: { ...form.contact.socialLinks, facebook: event.target.value }
                })
              }
              placeholder="https://facebook.com/crew"
            />
            <TextInput
              label="Instagram URL"
              value={form.contact.socialLinks.instagram}
              onChange={(event) =>
                updateSection('contact', {
                  socialLinks: { ...form.contact.socialLinks, instagram: event.target.value }
                })
              }
              placeholder="https://instagram.com/crew"
            />
            <TextInput
              label="LinkedIn URL"
              value={form.contact.socialLinks.linkedin}
              onChange={(event) =>
                updateSection('contact', {
                  socialLinks: { ...form.contact.socialLinks, linkedin: event.target.value }
                })
              }
              placeholder="https://www.linkedin.com/company/fixnado"
            />
            <TextInput
              label="YouTube URL"
              value={form.contact.socialLinks.youtube}
              onChange={(event) =>
                updateSection('contact', {
                  socialLinks: { ...form.contact.socialLinks, youtube: event.target.value }
                })
              }
              placeholder="https://youtube.com/@crew"
            />
            <TextInput
              label="Twitter / X URL"
              value={form.contact.socialLinks.twitter}
              onChange={(event) =>
                updateSection('contact', {
                  socialLinks: { ...form.contact.socialLinks, twitter: event.target.value }
                })
              }
              placeholder="https://x.com/crew"
            />
          </div>
        </SectionCard>

        <SectionCard title="Operational guardrails" description="Booking flow, response times, and travel limits.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Travel radius (km)"
              type="number"
              value={form.operations.travelRadiusKm}
              onChange={(event) =>
                updateSection('operations', {
                  travelRadiusKm: Number.parseInt(event.target.value, 10) || 0
                })
              }
              min={0}
            />
            <TextInput
              label="Average response minutes"
              type="number"
              value={form.operations.averageResponseMinutes}
              onChange={(event) =>
                updateSection('operations', {
                  averageResponseMinutes: Number.parseInt(event.target.value, 10) || 0
                })
              }
              min={0}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Checkbox
              label="Allow instant booking"
              checked={form.operations.allowOnlineBooking}
              onChange={(event) =>
                updateSection('operations', { allowOnlineBooking: event.target.checked })
              }
            />
            <Checkbox
              label="Enable enquiry form"
              checked={form.operations.enableEnquiryForm}
              onChange={(event) =>
                updateSection('operations', { enableEnquiryForm: event.target.checked })
              }
            />
            <Checkbox
              label="Show travel radius"
              checked={form.operations.showTravelRadius}
              onChange={(event) => updateSection('operations', { showTravelRadius: event.target.checked })}
            />
            <Checkbox
              label="Offer emergency support"
              checked={form.operations.emergencySupport}
              onChange={(event) => updateSection('operations', { emergencySupport: event.target.checked })}
              className="md:col-span-3"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Highlights & testimonials"
          description="What makes the crew special and customer feedback to feature."
        >
          <ListEditor
            id="highlights"
            label="Crew highlights"
            placeholder="Fixnado certified technicians"
            values={form.content.highlights}
            onChange={(next) => updateSection('content', { highlights: next })}
          />
          <StructuredListEditor
            id="testimonials"
            label="Testimonials"
            values={form.content.testimonials}
            onChange={(entries) => updateSection('content', { testimonials: entries })}
            schema={[
              { name: 'name', label: 'Name', placeholder: 'Jordan Miles' },
              { name: 'role', label: 'Role / Company', placeholder: 'Facilities Director' },
              { name: 'quote', label: 'Quote', placeholder: 'Fixnado crews are dependable every time.', fullWidth: true }
            ]}
            emptyLabel="No testimonials captured yet."
            maxItems={8}
          />
          <StructuredListEditor
            id="projects"
            label="Featured projects"
            values={form.content.featuredProjects}
            onChange={(entries) => updateSection('content', { featuredProjects: entries })}
            schema={[
              { name: 'title', label: 'Project title', placeholder: 'Metro North rapid response' },
              { name: 'summary', label: 'Summary', placeholder: 'Completed in 48 hours', fullWidth: true },
              { name: 'imageUrl', label: 'Image URL', placeholder: 'https://cdn.fixnado.com/project.jpg', fullWidth: true },
              { name: 'link', label: 'Project link', placeholder: 'https://app.fixnado.com/cases/metro-north', fullWidth: true }
            ]}
            emptyLabel="Add flagship jobs or case studies to highlight delivery."
            maxItems={8}
          />
        </SectionCard>

        <SectionCard title="SEO & publishing" description="Search metadata and which roles can publish changes.">
          <TextInput
            label="SEO title"
            value={form.seo.seoTitle}
            onChange={(event) => updateSection('seo', { seoTitle: event.target.value })}
            required
          />
          <TextareaField
            id="seo-description"
            label="SEO description"
            value={form.seo.seoDescription}
            onChange={(event) => updateSection('seo', { seoDescription: event.target.value })}
            hint="Recommended under 320 characters."
            rows={4}
          />
          <ListEditor
            id="seo-keywords"
            label="SEO keywords"
            placeholder="fixnado crew"
            values={form.seo.seoKeywords}
            onChange={(next) => updateSection('seo', { seoKeywords: next })}
          />
          <TextInput
            label="Open graph image URL"
            value={form.seo.seoMetaImageUrl}
            onChange={(event) => updateSection('seo', { seoMetaImageUrl: event.target.value })}
            placeholder="https://cdn.fixnado.com/og-image.jpg"
          />
          <Checkbox
            label="Allow search indexing"
            checked={form.seo.seoIndexable}
            onChange={(event) => updateSection('seo', { seoIndexable: event.target.checked })}
          />
          <ListEditor
            id="allowed-roles"
            label="Roles allowed to edit"
            hint="Lowercase role names such as serviceman, provider, admin."
            placeholder="serviceman"
            values={form.access.allowedRoles}
            onChange={(next) => updateSection('access', { allowedRoles: next })}
          />
          <TextInput
            label="Published at"
            value={form.access.publishedAt ?? ''}
            onChange={(event) => updateSection('access', { publishedAt: event.target.value })}
            placeholder="2025-03-18T09:00:00Z"
            hint="Optional ISO timestamp when the microsite was last published."
          />
        </SectionCard>

        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-accent/10 bg-white px-6 py-4 shadow-sm md:flex-row md:items-center">
          <p className="text-sm text-slate-600">
            Changes publish instantly to the crew microsite once saved. Use refresh to pull stored configuration from the API.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={saving || !dirty}>
              Reset
            </Button>
            <Button type="button" variant="secondary" onClick={handleRefresh} disabled={saving || loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={saving || !dirty}>
              Save changes
            </Button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-accent/10 bg-white px-6 py-8 text-primary" aria-live="polite">
          <Spinner className="h-6 w-6" />
          <span>Loading live preferences…</span>
        </div>
      ) : null}
    </div>
  );
}

ServicemanWebsitePreferencesSection.propTypes = {
  data: PropTypes.shape({
    initialPreferences: PropTypes.object,
    meta: PropTypes.object
  })
};

ServicemanWebsitePreferencesSection.defaultProps = {
  data: null
};
