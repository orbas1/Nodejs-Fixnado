import { useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowTopRightOnSquareIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { Button, FormField, TextInput } from '../../../components/ui/index.js';
import { useStorefrontManagement } from '../StorefrontManagementProvider.jsx';

const MAX_GALLERY_ITEMS = 12;
const MAX_EXPERIENCES = 12;
const MAX_SKILLS = 40;
const MAX_CATEGORIES = 20;
const MAX_TAGS = 60;
const MAX_KEYWORDS = 48;

function generateLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortByPosition(list) {
  return coerceArray(list)
    .map((item, index) => ({
      ...item,
      position: Number.isFinite(item?.position) ? item.position : index
    }))
    .sort((a, b) => {
      const aPos = Number.isFinite(a.position) ? a.position : 0;
      const bPos = Number.isFinite(b.position) ? b.position : 0;
      return aPos - bPos;
    });
}

function mapGalleryEntries(gallery = []) {
  return sortByPosition(gallery).map((entry, index) => ({
    id: entry.id || generateLocalId('gallery'),
    position: Number.isFinite(entry.position) ? entry.position : index,
    label: entry.label || '',
    url: entry.url || '',
    altText: entry.altText || '',
    description: entry.description || ''
  }));
}

function mapExperiences(experiences = []) {
  return sortByPosition(experiences).map((entry, index) => ({
    id: entry.id || generateLocalId('experience'),
    position: Number.isFinite(entry.position) ? entry.position : index,
    title: entry.title || '',
    organisation: entry.organisation || '',
    location: entry.location || '',
    years: entry.years || '',
    startYear: entry.startYear || '',
    endYear: entry.endYear || '',
    summary: entry.summary || '',
    proofUrl: entry.proofUrl || ''
  }));
}

function buildFormState(storefront) {
  const metadata = storefront.metadata || {};
  return {
    tagline: storefront.tagline || '',
    description: storefront.description || '',
    heroImageUrl: storefront.heroImageUrl || '',
    showcaseVideo: {
      url: metadata.showcaseVideo?.url || '',
      caption: metadata.showcaseVideo?.caption || '',
      thumbnailUrl: metadata.showcaseVideo?.thumbnailUrl || ''
    },
    gallery: mapGalleryEntries(metadata.gallery),
    experiences: mapExperiences(metadata.experiences),
    skills: [...coerceArray(metadata.skills)],
    categories: [...coerceArray(metadata.categories)],
    wordTags: [...coerceArray(metadata.wordTags)],
    seo: {
      pageTitle: metadata.seo?.pageTitle || '',
      metaDescription: metadata.seo?.metaDescription || '',
      canonicalUrl: metadata.seo?.canonicalUrl || '',
      socialImageUrl: metadata.seo?.socialImageUrl || '',
      keywords: [...coerceArray(metadata.seo?.keywords)]
    }
  };
}

function nullify(value) {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function normaliseStringList(values, { limit, maxLength }) {
  const list = coerceArray(values);
  const seen = new Set();
  const result = [];
  for (const raw of list) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const shortened = trimmed.slice(0, maxLength);
    const fingerprint = shortened.toLowerCase();
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    result.push(shortened);
    if (result.length >= limit) break;
  }
  return result;
}

function buildPayload(formState) {
  const gallery = formState.gallery
    .map((item, index) => ({
      id: item.id || generateLocalId(`gallery-${index}`),
      position: index,
      label: nullify(item.label),
      url: nullify(item.url),
      altText: nullify(item.altText),
      description: nullify(item.description)
    }))
    .filter((item) => Boolean(item.url))
    .slice(0, MAX_GALLERY_ITEMS);

  const experiences = formState.experiences
    .map((item, index) => ({
      id: item.id || generateLocalId(`experience-${index}`),
      position: index,
      title: nullify(item.title),
      organisation: nullify(item.organisation),
      location: nullify(item.location),
      years: nullify(item.years),
      startYear: nullify(item.startYear),
      endYear: nullify(item.endYear),
      summary: nullify(item.summary),
      proofUrl: nullify(item.proofUrl)
    }))
    .filter((item) =>
      Boolean(
        item.title ||
          item.organisation ||
          item.location ||
          item.summary ||
          item.years ||
          item.startYear ||
          item.endYear ||
          item.proofUrl
      )
    )
    .slice(0, MAX_EXPERIENCES);

  const metadata = {
    showcaseVideo: {
      url: nullify(formState.showcaseVideo.url),
      caption: nullify(formState.showcaseVideo.caption),
      thumbnailUrl: nullify(formState.showcaseVideo.thumbnailUrl)
    },
    gallery,
    experiences,
    skills: normaliseStringList(formState.skills, { limit: MAX_SKILLS, maxLength: 80 }),
    categories: normaliseStringList(formState.categories, { limit: MAX_CATEGORIES, maxLength: 80 }),
    wordTags: normaliseStringList(formState.wordTags, { limit: MAX_TAGS, maxLength: 60 }),
    seo: {
      pageTitle: nullify(formState.seo.pageTitle),
      metaDescription: nullify(formState.seo.metaDescription),
      canonicalUrl: nullify(formState.seo.canonicalUrl),
      socialImageUrl: nullify(formState.seo.socialImageUrl),
      keywords: normaliseStringList(formState.seo.keywords, { limit: MAX_KEYWORDS, maxLength: 60 })
    }
  };

  return {
    tagline: nullify(formState.tagline),
    description: nullify(formState.description),
    heroImageUrl: nullify(formState.heroImageUrl),
    metadata
  };
}

function MultiEntryInput({
  id,
  label,
  description,
  values,
  onChange,
  addLabel,
  placeholder,
  limit
}) {
  const safeValues = values.length > 0 ? values : [''];
  const limitReached = safeValues.length >= limit;

  const handleUpdate = (index, value) => {
    const next = [...safeValues];
    next[index] = value;
    onChange(next);
  };

  const handleRemove = (index) => {
    const next = safeValues.filter((_, idx) => idx !== index);
    onChange(next.length ? next : ['']);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{label}</p>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="space-y-3">
        {safeValues.map((value, index) => (
          <div key={`${id}-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <TextInput
              id={`${id}-${index}`}
              value={value}
              onChange={(event) => handleUpdate(index, event.target.value)}
              placeholder={placeholder}
              inputClassName="w-full"
            />
            <Button type="button" variant="ghost" onClick={() => handleRemove(index)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" onClick={() => onChange([...safeValues, ''])} disabled={limitReached}>
        {addLabel}
      </Button>
    </div>
  );
}

MultiEntryInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  addLabel: PropTypes.string,
  placeholder: PropTypes.string,
  limit: PropTypes.number
};

MultiEntryInput.defaultProps = {
  description: undefined,
  values: [],
  addLabel: 'Add entry',
  placeholder: undefined,
  limit: 10
};

export default function BusinessFrontComposer() {
  const { data, actions, status } = useStorefrontManagement();
  const storefront = data.storefront;

  const [formState, setFormState] = useState(() => buildFormState(storefront));
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setFormState(buildFormState(storefront));
  }, [storefront]);

  const galleryLimitReached = formState.gallery.length >= MAX_GALLERY_ITEMS;
  const experienceLimitReached = formState.experiences.length >= MAX_EXPERIENCES;

  const summaryStats = useMemo(() => {
    const galleryCount = formState.gallery.filter((item) => typeof item.url === 'string' && item.url.trim()).length;
    const experienceCount = formState.experiences.filter((item) => {
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const organisation = typeof item.organisation === 'string' ? item.organisation.trim() : '';
      return Boolean(title || organisation);
    }).length;
    const skillsCount = formState.skills.filter((value) => typeof value === 'string' && value.trim()).length;
    const tagsCount = formState.wordTags.filter((value) => typeof value === 'string' && value.trim()).length;
    return { galleryCount, experienceCount, skillsCount, tagsCount };
  }, [formState.gallery, formState.experiences, formState.skills, formState.wordTags]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      const payload = buildPayload(formState);
      await actions.saveSettings(payload);
      setFeedback({ tone: 'success', message: 'Business front updated successfully.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message || 'Unable to update business front.' });
    }
  };

  const updateForm = (updater) => {
    setFormState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...current, ...next };
    });
    setFeedback(null);
  };

  const updateShowcase = (field, value) => {
    updateForm((current) => ({ showcaseVideo: { ...current.showcaseVideo, [field]: value } }));
  };

  const updateGalleryItem = (id, field, value) => {
    updateForm((current) => ({
      gallery: current.gallery.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    }));
  };

  const removeGalleryItem = (id) => {
    updateForm((current) => ({
      gallery: current.gallery
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, position: index }))
    }));
  };

  const reorderList = (list, startIndex, endIndex) => {
    if (startIndex === endIndex) {
      return list;
    }
    const next = [...list];
    const [moved] = next.splice(startIndex, 1);
    next.splice(endIndex, 0, moved);
    return next.map((item, index) => ({ ...item, position: index }));
  };

  const moveGalleryItem = (id, direction) => {
    updateForm((current) => {
      const index = current.gallery.findIndex((item) => item.id === id);
      if (index === -1) {
        return {};
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.gallery.length) {
        return {};
      }
      return { gallery: reorderList(current.gallery, index, targetIndex) };
    });
  };

  const addGalleryItem = () => {
    if (galleryLimitReached) return;
    updateForm((current) => ({
      gallery: [
        ...current.gallery,
        {
          id: generateLocalId('gallery'),
          position: current.gallery.length,
          label: '',
          url: '',
          altText: '',
          description: ''
        }
      ]
    }));
  };

  const updateExperience = (id, field, value) => {
    updateForm((current) => ({
      experiences: current.experiences.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    }));
  };

  const removeExperience = (id) => {
    updateForm((current) => ({
      experiences: current.experiences
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, position: index }))
    }));
  };

  const moveExperience = (id, direction) => {
    updateForm((current) => {
      const index = current.experiences.findIndex((item) => item.id === id);
      if (index === -1) {
        return {};
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.experiences.length) {
        return {};
      }
      return { experiences: reorderList(current.experiences, index, targetIndex) };
    });
  };

  const addExperience = () => {
    if (experienceLimitReached) return;
    updateForm((current) => ({
      experiences: [
        ...current.experiences,
        {
          id: generateLocalId('experience'),
          position: current.experiences.length,
          title: '',
          organisation: '',
          location: '',
          years: '',
          startYear: '',
          endYear: '',
          summary: '',
          proofUrl: ''
        }
      ]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {feedback ? (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
              : 'border-rose-200 bg-rose-50/90 text-rose-600'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Business narrative</p>
          <h3 className="text-lg font-semibold text-primary">Storytelling & positioning</h3>
          <p className="text-sm text-slate-600">
            Refresh the hero messaging that appears on your public business front, including the strapline and overview copy.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Tagline"
            value={formState.tagline}
            onChange={(event) => updateForm({ tagline: event.target.value })}
            placeholder="Trusted electrical resilience partners"
          />
          <TextInput
            label="Hero image URL"
            value={formState.heroImageUrl}
            onChange={(event) => updateForm({ heroImageUrl: event.target.value })}
            placeholder="https://cdn.fixnado.com/hero.jpg"
          />
        </div>
        <FormField id="business-description" label="Business overview">
          <textarea
            id="business-description"
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Share the services, assurances, and differentiators that keep customers coming back."
            value={formState.description}
            onChange={(event) => updateForm({ description: event.target.value })}
          />
        </FormField>
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Showcase media</p>
          <h3 className="text-lg font-semibold text-primary">Imagery & video spotlight</h3>
          <p className="text-sm text-slate-600">
            Curate rich media that brings your capabilities to life. Add gallery assets and a showcase reel for the concierge team.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Showcase video URL"
            value={formState.showcaseVideo.url}
            onChange={(event) => updateShowcase('url', event.target.value)}
            placeholder="https://stream.fixnado.com/showcase.mp4"
          />
          <TextInput
            label="Video thumbnail URL"
            value={formState.showcaseVideo.thumbnailUrl}
            onChange={(event) => updateShowcase('thumbnailUrl', event.target.value)}
            placeholder="https://cdn.fixnado.com/showcase-thumbnail.jpg"
          />
        </div>
        <FormField id="showcase-caption" label="Video caption">
          <textarea
            id="showcase-caption"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Outline what customers will learn from this showcase."
            value={formState.showcaseVideo.caption}
            onChange={(event) => updateShowcase('caption', event.target.value)}
          />
        </FormField>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Gallery assets</p>
              <p className="text-xs text-slate-500">
                {summaryStats.galleryCount} published • {MAX_GALLERY_ITEMS - formState.gallery.length} slots remaining
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={addGalleryItem} disabled={galleryLimitReached}>
              Add gallery asset
            </Button>
          </div>

          {formState.gallery.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No gallery assets added yet. Upload imagery, infographics, or case study visuals to build trust.
            </p>
          ) : (
            <div className="space-y-4">
              {formState.gallery.map((item, index) => (
                <div key={item.id} className="space-y-3 rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-inner">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-primary">Asset {index + 1}</p>
                      <p className="text-xs text-slate-500">Display order #{index + 1}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.url ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          icon={ArrowTopRightOnSquareIcon}
                        >
                          View asset
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={ArrowUpIcon}
                        onClick={() => moveGalleryItem(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <span className="sr-only">Move asset up</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={ArrowDownIcon}
                        onClick={() => moveGalleryItem(item.id, 'down')}
                        disabled={index === formState.gallery.length - 1}
                      >
                        <span className="sr-only">Move asset down</span>
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeGalleryItem(item.id)}>
                        Remove asset
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextInput
                      label="Media URL"
                      value={item.url}
                      onChange={(event) => updateGalleryItem(item.id, 'url', event.target.value)}
                      placeholder="https://cdn.fixnado.com/gallery/asset.jpg"
                    />
                    <TextInput
                      label="Display label"
                      value={item.label}
                      onChange={(event) => updateGalleryItem(item.id, 'label', event.target.value)}
                      placeholder="Critical power upgrade"
                    />
                    <TextInput
                      label="Alt text"
                      value={item.altText}
                      onChange={(event) => updateGalleryItem(item.id, 'altText', event.target.value)}
                      placeholder="Generator retrofit at data centre"
                    />
                    <FormField id={`gallery-description-${item.id}`} label="Description">
                      <textarea
                        id={`gallery-description-${item.id}`}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Outline the result, stakeholders, and measurable impact."
                        value={item.description}
                        onChange={(event) => updateGalleryItem(item.id, 'description', event.target.value)}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Experience & credentials</p>
          <h3 className="text-lg font-semibold text-primary">Flagship engagements</h3>
          <p className="text-sm text-slate-600">
            Showcase standout programmes, milestone achievements, and proof links that validate your team&apos;s expertise.
          </p>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Published experiences</p>
            <p className="text-xs text-slate-500">
              {summaryStats.experienceCount} published • {MAX_EXPERIENCES - formState.experiences.length} slots remaining
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={addExperience} disabled={experienceLimitReached}>
            Add experience
          </Button>
        </div>
        {formState.experiences.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No flagship engagements added. Capture enterprise rollouts, complex recoveries, or time-critical activations.
          </p>
        ) : (
          <div className="space-y-4">
            {formState.experiences.map((experience, index) => (
              <div key={experience.id} className="space-y-3 rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">Experience {index + 1}</p>
                    <p className="text-xs text-slate-500">Display order #{index + 1}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {experience.proofUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        href={experience.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        icon={ArrowTopRightOnSquareIcon}
                      >
                        View proof
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={ArrowUpIcon}
                      onClick={() => moveExperience(experience.id, 'up')}
                      disabled={index === 0}
                    >
                      <span className="sr-only">Move experience up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={ArrowDownIcon}
                      onClick={() => moveExperience(experience.id, 'down')}
                      disabled={index === formState.experiences.length - 1}
                    >
                      <span className="sr-only">Move experience down</span>
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(experience.id)}>
                      Remove experience
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    label="Title"
                    value={experience.title}
                    onChange={(event) => updateExperience(experience.id, 'title', event.target.value)}
                    placeholder="Emergency generator retrofit"
                  />
                  <TextInput
                    label="Client or programme"
                    value={experience.organisation}
                    onChange={(event) => updateExperience(experience.id, 'organisation', event.target.value)}
                    placeholder="NorthGrid Data Centres"
                  />
                  <TextInput
                    label="Location"
                    value={experience.location}
                    onChange={(event) => updateExperience(experience.id, 'location', event.target.value)}
                    placeholder="London Docklands"
                  />
                  <TextInput
                    label="Duration or years"
                    value={experience.years}
                    onChange={(event) => updateExperience(experience.id, 'years', event.target.value)}
                    placeholder="2019 - 2022"
                  />
                  <TextInput
                    label="Start year"
                    value={experience.startYear}
                    onChange={(event) => updateExperience(experience.id, 'startYear', event.target.value)}
                    placeholder="2019"
                  />
                  <TextInput
                    label="End year"
                    value={experience.endYear}
                    onChange={(event) => updateExperience(experience.id, 'endYear', event.target.value)}
                    placeholder="2022"
                  />
                  <FormField id={`experience-summary-${experience.id}`} label="Summary">
                    <textarea
                      id={`experience-summary-${experience.id}`}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Outline the scope, delivery milestones, and measurable outcome."
                      value={experience.summary}
                      onChange={(event) => updateExperience(experience.id, 'summary', event.target.value)}
                    />
                  </FormField>
                  <TextInput
                    label="Proof or case study URL"
                    value={experience.proofUrl}
                    onChange={(event) => updateExperience(experience.id, 'proofUrl', event.target.value)}
                    placeholder="https://cdn.fixnado.com/case-studies/northgrid.pdf"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Skills & categorisation</p>
          <h3 className="text-lg font-semibold text-primary">Taxonomy & expertise tags</h3>
          <p className="text-sm text-slate-600">
            Help search and concierge teams surface your business front with structured skills, categories, and tags.
          </p>
        </header>
        <MultiEntryInput
          id="business-skills"
          label="Core skills"
          description="Add the capabilities you want procurement teams to recognise instantly."
          values={formState.skills}
          onChange={(next) => updateForm({ skills: next })}
          placeholder="High-voltage switching"
          addLabel="Add skill"
          limit={MAX_SKILLS}
        />
        <MultiEntryInput
          id="business-categories"
          label="Service categories"
          description="Group your offers under customer-friendly categories."
          values={formState.categories}
          onChange={(next) => updateForm({ categories: next })}
          placeholder="Critical power"
          addLabel="Add category"
          limit={MAX_CATEGORIES}
        />
        <MultiEntryInput
          id="business-tags"
          label="Word tags"
          description="Add additional keywords that power on-site search and concierge filters."
          values={formState.wordTags}
          onChange={(next) => updateForm({ wordTags: next })}
          placeholder="Resilience"
          addLabel="Add tag"
          limit={MAX_TAGS}
        />
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/60">SEO & discoverability</p>
          <h3 className="text-lg font-semibold text-primary">Meta data & previews</h3>
          <p className="text-sm text-slate-600">
            Optimise how your business front appears in search engines, social previews, and Fixnado&rsquo;s own search surfaces.
          </p>
        </header>
        <TextInput
          label="SEO page title"
          value={formState.seo.pageTitle}
          onChange={(event) => updateForm((current) => ({ seo: { ...current.seo, pageTitle: event.target.value } }))}
          placeholder="Metro Power Services | Critical power resilience partners"
        />
        <FormField id="seo-description" label="Meta description">
          <textarea
            id="seo-description"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Summarise your differentiators, coverage, and assurances for search engines."
            value={formState.seo.metaDescription}
            onChange={(event) => updateForm((current) => ({ seo: { ...current.seo, metaDescription: event.target.value } }))}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Canonical URL"
            value={formState.seo.canonicalUrl}
            onChange={(event) => updateForm((current) => ({ seo: { ...current.seo, canonicalUrl: event.target.value } }))}
            placeholder="https://fixnado.com/providers/metro-power-services"
          />
          <TextInput
            label="Social image URL"
            value={formState.seo.socialImageUrl}
            onChange={(event) => updateForm((current) => ({ seo: { ...current.seo, socialImageUrl: event.target.value } }))}
            placeholder="https://cdn.fixnado.com/social/metro-power.jpg"
          />
        </div>
        <MultiEntryInput
          id="seo-keywords"
          label="SEO keywords"
          description="Optional set of keywords to help search engines categorise your business front."
          values={formState.seo.keywords}
          onChange={(next) => updateForm((current) => ({ seo: { ...current.seo, keywords: next } }))}
          placeholder="critical power maintenance"
          addLabel="Add keyword"
          limit={MAX_KEYWORDS}
        />
      </section>

      <footer className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          <p>
            Gallery assets: {summaryStats.galleryCount} • Experiences: {summaryStats.experienceCount} • Skills: {summaryStats.skillsCount}{' '}
            • Tags: {summaryStats.tagsCount}
          </p>
        </div>
        <Button type="submit" variant="primary" loading={status.savingSettings} disabled={status.savingSettings}>
          Save business front
        </Button>
      </footer>
    </form>
  );
}
