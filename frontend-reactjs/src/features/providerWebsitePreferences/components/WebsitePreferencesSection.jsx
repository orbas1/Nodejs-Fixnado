import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  PlusSmallIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Checkbox,
  Select,
  TextArea,
  TextInput
} from '../../../components/ui/index.js';
import Skeleton from '../../../components/ui/Skeleton.jsx';
import {
  getProviderWebsitePreferences,
  updateProviderWebsitePreferences
} from '../../../api/panelClient.js';

function trimToNull(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function PreferencesGroup({ title, description, children, id }) {
  return (
    <section id={id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </header>
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}

PreferencesGroup.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  id: PropTypes.string
};

PreferencesGroup.defaultProps = {
  description: null,
  id: undefined
};

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
];

const textToneOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'contrast', label: 'High contrast' }
];

const layoutOptions = [
  { value: 'modular', label: 'Modular' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'timeline', label: 'Timeline' }
];

const moduleToggleFields = [
  { field: 'showProjects', label: 'Show featured projects' },
  { field: 'showCertifications', label: 'Show certifications' },
  { field: 'showAvailability', label: 'Show availability banner' },
  { field: 'allowEnquiryForm', label: 'Allow enquiry form submissions' },
  { field: 'enableLiveChat', label: 'Enable live chat widget' },
  { field: 'allowDownloads', label: 'Allow resource downloads' },
  { field: 'highlightGeoCoverage', label: 'Highlight geographic coverage map' }
];

const channelTypeOptions = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'portal', label: 'Portal' },
  { value: 'chat', label: 'Chat' },
  { value: 'slack', label: 'Slack' },
  { value: 'teams', label: 'Teams' },
  { value: 'whatsapp', label: 'WhatsApp' }
];

function buildPayload(form) {
  const payload = {
    slug: trimToNull(form.slug) ?? undefined,
    customDomain: trimToNull(form.customDomain) ?? undefined,
    hero: {
      heading: trimToNull(form.hero?.heading) ?? undefined,
      subheading: trimToNull(form.hero?.subheading) ?? undefined,
      tagline: trimToNull(form.hero?.tagline) ?? undefined,
      mediaAlignment: trimToNull(form.hero?.mediaAlignment) ?? undefined,
      highlights: (form.hero?.highlights ?? []).map((item) => trimToNull(item)).filter(Boolean),
      primaryCta: {
        label: trimToNull(form.hero?.primaryCta?.label) ?? undefined,
        url: trimToNull(form.hero?.primaryCta?.url) ?? undefined,
        behaviour: trimToNull(form.hero?.primaryCta?.behaviour) ?? undefined
      },
      secondaryCta: {
        label: trimToNull(form.hero?.secondaryCta?.label) ?? undefined,
        url: trimToNull(form.hero?.secondaryCta?.url) ?? undefined,
        behaviour: trimToNull(form.hero?.secondaryCta?.behaviour) ?? undefined
      }
    },
    branding: {
      theme: trimToNull(form.branding?.theme) ?? undefined,
      brandColor: trimToNull(form.branding?.brandColor) ?? undefined,
      accentColor: trimToNull(form.branding?.accentColor) ?? undefined,
      backgroundColor: trimToNull(form.branding?.backgroundColor) ?? undefined,
      textTone: trimToNull(form.branding?.textTone) ?? undefined,
      layout: trimToNull(form.branding?.layout) ?? undefined,
      typography: trimToNull(form.branding?.typography) ?? undefined
    },
    media: {
      logoUrl: trimToNull(form.media?.logoUrl) ?? undefined,
      heroImageUrl: trimToNull(form.media?.heroImageUrl) ?? undefined,
      brandImageUrl: trimToNull(form.media?.brandImageUrl) ?? undefined,
      brandVideoUrl: trimToNull(form.media?.brandVideoUrl) ?? undefined,
      gallery: (form.media?.gallery ?? [])
        .map((item) => ({
          id: item.id,
          title: trimToNull(item.title) ?? undefined,
          caption: trimToNull(item.caption) ?? undefined,
          imageUrl: trimToNull(item.imageUrl) ?? undefined,
          altText: trimToNull(item.altText) ?? undefined
        }))
        .filter((item) => item.imageUrl)
    },
    support: {
      email: trimToNull(form.support?.email) ?? undefined,
      phone: trimToNull(form.support?.phone) ?? undefined,
      hours: trimToNull(form.support?.hours) ?? undefined,
      responseTime: trimToNull(form.support?.responseTime) ?? undefined,
      conciergeName: trimToNull(form.support?.conciergeName) ?? undefined,
      channels: (form.support?.channels ?? [])
        .map((channel) => ({
          id: channel.id,
          type: trimToNull(channel.type) ?? undefined,
          label: trimToNull(channel.label) ?? undefined,
          destination: trimToNull(channel.destination) ?? undefined,
          notes: trimToNull(channel.notes) ?? undefined
        }))
        .filter((channel) => channel.destination)
    },
    seo: {
      title: trimToNull(form.seo?.title) ?? undefined,
      description: trimToNull(form.seo?.description) ?? undefined,
      keywords: (form.seo?.keywords ?? []).map((keyword) => trimToNull(keyword)).filter(Boolean),
      ogImageUrl: trimToNull(form.seo?.ogImageUrl) ?? undefined
    },
    socialLinks: (form.socialLinks ?? [])
      .map((link) => ({
        id: link.id,
        label: trimToNull(link.label) ?? undefined,
        url: trimToNull(link.url) ?? undefined,
        icon: trimToNull(link.icon) ?? undefined
      }))
      .filter((link) => link.url),
    trust: {
      showTrustScore: Boolean(form.trust?.showTrustScore),
      showResponseTime: Boolean(form.trust?.showResponseTime),
      testimonialsEnabled: Boolean(form.trust?.testimonialsEnabled),
      testimonials: (form.trust?.testimonials ?? [])
        .map((item) => ({
          id: item.id,
          quote: trimToNull(item.quote) ?? undefined,
          author: trimToNull(item.author) ?? undefined,
          role: trimToNull(item.role) ?? undefined
        }))
        .filter((item) => item.quote),
      badges: (form.trust?.badges ?? [])
        .map((badge) => ({
          id: badge.id,
          label: trimToNull(badge.label) ?? undefined,
          description: trimToNull(badge.description) ?? undefined,
          iconUrl: trimToNull(badge.iconUrl) ?? undefined,
          evidenceUrl: trimToNull(badge.evidenceUrl) ?? undefined
        }))
        .filter((badge) => badge.label),
      metrics: (form.trust?.metrics ?? [])
        .map((metric) => ({
          id: metric.id,
          label: trimToNull(metric.label) ?? undefined,
          value: trimToNull(metric.value) ?? undefined,
          format: trimToNull(metric.format) ?? undefined
        }))
        .filter((metric) => metric.value),
      reviewWidget: {
        enabled: Boolean(form.trust?.reviewWidget?.enabled),
        display: trimToNull(form.trust?.reviewWidget?.display) ?? undefined,
        providerId: trimToNull(form.trust?.reviewWidget?.providerId) ?? undefined,
        url: trimToNull(form.trust?.reviewWidget?.url) ?? undefined
      }
    },
    modules: moduleToggleFields.reduce((acc, item) => {
      acc[item.field] = Boolean(form.modules?.[item.field]);
      return acc;
    }, {}),
    featuredProjects: (form.featuredProjects ?? [])
      .map((project) => ({
        id: project.id,
        title: trimToNull(project.title) ?? undefined,
        summary: trimToNull(project.summary) ?? undefined,
        imageUrl: trimToNull(project.imageUrl) ?? undefined,
        ctaLabel: trimToNull(project.ctaLabel) ?? undefined,
        ctaUrl: trimToNull(project.ctaUrl) ?? undefined
      }))
      .filter((project) => project.title || project.summary || project.imageUrl || project.ctaUrl),
    metadata: {
      notes: trimToNull(form.metadata?.notes) ?? undefined,
      lastPublishedAt: trimToNull(form.metadata?.lastPublishedAt) ?? undefined
    }
  };

  return payload;
}

function WebsitePreferencesSection({ provider, initialPreferences, onUpdated }) {
  const [loading, setLoading] = useState(!initialPreferences);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => initialPreferences ?? {});
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const providerDetails = useMemo(
    () => ({
      name: provider?.name ?? provider?.legalName ?? 'Provider',
      tradingName: provider?.tradingName ?? provider?.name ?? provider?.legalName,
      slug: provider?.slug,
      supportEmail: provider?.supportEmail,
      supportPhone: provider?.supportPhone
    }),
    [provider]
  );

  const applyPreferences = useCallback((preferences) => {
    if (!preferences) {
      return;
    }
    setForm(() => ({
      ...preferences,
      hero: {
        highlights: preferences.hero?.highlights ?? [],
        primaryCta: {
          label: preferences.hero?.primaryCta?.label ?? '',
          url: preferences.hero?.primaryCta?.url ?? '',
          behaviour: preferences.hero?.primaryCta?.behaviour ?? 'link'
        },
        secondaryCta: {
          label: preferences.hero?.secondaryCta?.label ?? '',
          url: preferences.hero?.secondaryCta?.url ?? '',
          behaviour: preferences.hero?.secondaryCta?.behaviour ?? 'link'
        },
        ...preferences.hero
      },
      seo: {
        ...preferences.seo,
        keywords: preferences.seo?.keywords ?? []
      },
      support: {
        channels: preferences.support?.channels ?? [],
        ...preferences.support
      },
      media: {
        gallery: preferences.media?.gallery ?? [],
        ...preferences.media
      },
      socialLinks: preferences.socialLinks ?? [],
      trust: {
        testimonials: preferences.trust?.testimonials ?? [],
        badges: preferences.trust?.badges ?? [],
        metrics: preferences.trust?.metrics ?? [],
        reviewWidget: {
          enabled: preferences.trust?.reviewWidget?.enabled ?? false,
          display: preferences.trust?.reviewWidget?.display ?? 'inline',
          providerId: preferences.trust?.reviewWidget?.providerId ?? '',
          url: preferences.trust?.reviewWidget?.url ?? ''
        },
        ...preferences.trust
      },
      modules: { ...preferences.modules },
      featuredProjects: preferences.featuredProjects ?? [],
      metadata: {
        notes: preferences.metadata?.notes ?? '',
        lastPublishedAt: preferences.metadata?.lastPublishedAt ?? '',
        updatedAt: preferences.metadata?.updatedAt ?? null,
        updatedBy: preferences.metadata?.updatedBy ?? null,
        createdAt: preferences.metadata?.createdAt ?? null,
        createdBy: preferences.metadata?.createdBy ?? null
      }
    }));
  }, []);

  const loadPreferences = useCallback(
    async ({ signal } = {}) => {
      try {
        setLoading(true);
        setError(null);
        const { data, meta: responseMeta } = await getProviderWebsitePreferences({
          provider: providerDetails,
          signal
        });
        applyPreferences(data);
        setMeta(responseMeta ?? null);
      } catch (loadError) {
        setError(loadError);
      } finally {
        setLoading(false);
      }
    },
    [applyPreferences, providerDetails]
  );

  useEffect(() => {
    if (initialPreferences) {
      applyPreferences(initialPreferences);
      setLoading(false);
    }
  }, [applyPreferences, initialPreferences]);

  useEffect(() => {
    if (!initialPreferences) {
      const controller = new AbortController();
      loadPreferences({ signal: controller.signal });
      return () => controller.abort();
    }
    return undefined;
  }, [initialPreferences, loadPreferences]);

  const handleHighlightChange = useCallback((index, value) => {
    setForm((prev) => {
      const highlights = [...(prev.hero?.highlights ?? [])];
      highlights[index] = value;
      return {
        ...prev,
        hero: { ...prev.hero, highlights }
      };
    });
  }, []);

  const handleAddHighlight = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      hero: { ...prev.hero, highlights: [...(prev.hero?.highlights ?? []), ''] }
    }));
  }, []);

  const handleRemoveHighlight = useCallback((index) => {
    setForm((prev) => {
      const highlights = [...(prev.hero?.highlights ?? [])];
      highlights.splice(index, 1);
      return {
        ...prev,
        hero: { ...prev.hero, highlights }
      };
    });
  }, []);

  const handleGalleryChange = useCallback((index, field, value) => {
    setForm((prev) => {
      const gallery = [...(prev.media?.gallery ?? [])];
      const current = gallery[index] ?? { id: randomId('gallery') };
      gallery[index] = { ...current, [field]: value };
      return {
        ...prev,
        media: { ...prev.media, gallery }
      };
    });
  }, []);

  const handleAddGalleryItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        gallery: [
          ...(prev.media?.gallery ?? []),
          { id: randomId('gallery'), title: '', caption: '', imageUrl: '', altText: '' }
        ]
      }
    }));
  }, []);

  const handleRemoveGalleryItem = useCallback((index) => {
    setForm((prev) => {
      const gallery = [...(prev.media?.gallery ?? [])];
      gallery.splice(index, 1);
      return {
        ...prev,
        media: { ...prev.media, gallery }
      };
    });
  }, []);

  const handleChannelChange = useCallback((index, field, value) => {
    setForm((prev) => {
      const channels = [...(prev.support?.channels ?? [])];
      const current = channels[index] ?? { id: randomId('channel') };
      channels[index] = { ...current, [field]: value };
      return {
        ...prev,
        support: { ...prev.support, channels }
      };
    });
  }, []);

  const handleAddChannel = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      support: {
        ...prev.support,
        channels: [
          ...(prev.support?.channels ?? []),
          { id: randomId('channel'), type: 'email', label: '', destination: '', notes: '' }
        ]
      }
    }));
  }, []);

  const handleRemoveChannel = useCallback((index) => {
    setForm((prev) => {
      const channels = [...(prev.support?.channels ?? [])];
      channels.splice(index, 1);
      return {
        ...prev,
        support: { ...prev.support, channels }
      };
    });
  }, []);

  const handleSocialChange = useCallback((index, field, value) => {
    setForm((prev) => {
      const socialLinks = [...(prev.socialLinks ?? [])];
      const current = socialLinks[index] ?? { id: randomId('social') };
      socialLinks[index] = { ...current, [field]: value };
      return {
        ...prev,
        socialLinks
      };
    });
  }, []);

  const handleAddSocial = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks ?? []), { id: randomId('social'), label: '', url: '', icon: '' }]
    }));
  }, []);

  const handleRemoveSocial = useCallback((index) => {
    setForm((prev) => {
      const socialLinks = [...(prev.socialLinks ?? [])];
      socialLinks.splice(index, 1);
      return {
        ...prev,
        socialLinks
      };
    });
  }, []);

  const handleTrustCollectionChange = useCallback((collection, index, field, value) => {
    setForm((prev) => {
      const items = [...(prev.trust?.[collection] ?? [])];
      const current = items[index] ?? { id: randomId(collection) };
      items[index] = { ...current, [field]: value };
      return {
        ...prev,
        trust: { ...prev.trust, [collection]: items }
      };
    });
  }, []);

  const handleAddTrustItem = useCallback((collection) => {
    setForm((prev) => {
      const defaults = {
        testimonials: { id: randomId('testimonial'), quote: '', author: '', role: '' },
        badges: { id: randomId('badge'), label: '', description: '', iconUrl: '', evidenceUrl: '' },
        metrics: { id: randomId('metric'), label: '', value: '', format: 'number' }
      };
      return {
        ...prev,
        trust: {
          ...prev.trust,
          [collection]: [...(prev.trust?.[collection] ?? []), defaults[collection]]
        }
      };
    });
  }, []);

  const handleRemoveTrustItem = useCallback((collection, index) => {
    setForm((prev) => {
      const items = [...(prev.trust?.[collection] ?? [])];
      items.splice(index, 1);
      return {
        ...prev,
        trust: { ...prev.trust, [collection]: items }
      };
    });
  }, []);

  const handleProjectChange = useCallback((index, field, value) => {
    setForm((prev) => {
      const featuredProjects = [...(prev.featuredProjects ?? [])];
      const current = featuredProjects[index] ?? { id: randomId('project') };
      featuredProjects[index] = { ...current, [field]: value };
      return {
        ...prev,
        featuredProjects
      };
    });
  }, []);

  const handleAddProject = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      featuredProjects: [
        ...(prev.featuredProjects ?? []),
        { id: randomId('project'), title: '', summary: '', imageUrl: '', ctaLabel: '', ctaUrl: '' }
      ]
    }));
  }, []);

  const handleRemoveProject = useCallback((index) => {
    setForm((prev) => {
      const featuredProjects = [...(prev.featuredProjects ?? [])];
      featuredProjects.splice(index, 1);
      return {
        ...prev,
        featuredProjects
      };
    });
  }, []);

  const handleKeywordsChange = useCallback((value) => {
    const parts = value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length);
    setForm((prev) => ({
      ...prev,
      seo: { ...prev.seo, keywords: parts }
    }));
  }, []);

  const handleMetadataChange = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving(true);
      setAlert(null);
      setError(null);

      try {
        const payload = buildPayload(form);
        const updated = await updateProviderWebsitePreferences(payload, { provider: providerDetails });
        applyPreferences(updated);
        onUpdated?.(updated);
        setAlert({ type: 'success', message: 'Website preferences saved successfully.' });
      } catch (submitError) {
        console.error('[WebsitePreferencesSection] save failed', submitError);
        setError(submitError);
        setAlert({ type: 'error', message: submitError.message || 'Unable to save preferences.' });
      } finally {
        setSaving(false);
      }
    },
    [applyPreferences, form, onUpdated, providerDetails]
  );

  const handleRefresh = useCallback(() => {
    loadPreferences();
  }, [loadPreferences]);

  if (loading) {
    return (
      <section
        id="provider-dashboard-website-preferences"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Website preferences</p>
            <h3 className="mt-2 text-2xl font-semibold text-primary">Loading preferences</h3>
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </section>
    );
  }

  return (
    <section id="provider-dashboard-website-preferences" className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Website preferences</p>
          <h2 className="text-3xl font-semibold text-primary">Website & storefront controls</h2>
          <p className="text-sm text-slate-500">
            Manage how your Fixnado storefront appears to enterprise buyers. Update hero messaging, branding, SEO metadata,
            support channels, and featured programmes.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {form?.previewUrl ? (
              <a
                href={form.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-medium text-primary transition hover:bg-primary/20"
              >
                Preview storefront <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            ) : null}
            {meta?.fromCache ? <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Cached snapshot</span> : null}
            {form?.metadata?.updatedAt ? (
              <span>Updated {new Date(form.metadata.updatedAt).toLocaleString()}</span>
            ) : null}
            {form?.metadata?.updatedBy ? <span>By {form.metadata.updatedBy}</span> : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <Button
            type="button"
            variant="secondary"
            icon={ArrowPathIcon}
            onClick={handleRefresh}
            disabled={saving}
          >
            Refresh from server
          </Button>
          {alert ? (
            <p
              className={`text-sm ${alert.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
              role={alert.type === 'error' ? 'alert' : 'status'}
            >
              {alert.message}
            </p>
          ) : null}
          {error && !alert ? (
            <p className="text-sm text-rose-600" role="alert">
              {error.message || 'Unable to load website preferences.'}
            </p>
          ) : null}
        </div>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <PreferencesGroup
          id="provider-dashboard-website-preferences-basics"
          title="Basics"
          description="Slug, preview domain, and hero call-to-actions."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Slug"
              value={form?.slug ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="metro-power-services"
            />
            <TextInput
              label="Custom domain"
              value={form?.customDomain ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, customDomain: event.target.value }))}
              placeholder="metro-power.services"
            />
          </div>
          <TextInput
            label="Hero heading"
            value={form?.hero?.heading ?? ''}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, hero: { ...prev.hero, heading: event.target.value } }))
            }
          />
          <TextArea
            label="Hero subheading"
            value={form?.hero?.subheading ?? ''}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, hero: { ...prev.hero, subheading: event.target.value } }))
            }
            rows={3}
          />
          <TextInput
            label="Hero tagline"
            value={form?.hero?.tagline ?? ''}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, hero: { ...prev.hero, tagline: event.target.value } }))
            }
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Highlights</h4>
              <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={handleAddHighlight}>
                Add highlight
              </Button>
            </div>
            <div className="space-y-3">
              {(form?.hero?.highlights ?? []).map((highlight, index) => (
                <div key={`highlight-${index}`} className="flex gap-3">
                  <TextInput
                    className="flex-1"
                    value={highlight}
                    onChange={(event) => handleHighlightChange(index, event.target.value)}
                    placeholder="24/7 concierge support"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    icon={TrashIcon}
                    onClick={() => handleRemoveHighlight(index)}
                    aria-label={`Remove highlight ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Primary CTA label"
              value={form?.hero?.primaryCta?.label ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hero: {
                    ...prev.hero,
                    primaryCta: { ...prev.hero?.primaryCta, label: event.target.value }
                  }
                }))
              }
            />
            <TextInput
              label="Primary CTA URL"
              value={form?.hero?.primaryCta?.url ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hero: {
                    ...prev.hero,
                    primaryCta: { ...prev.hero?.primaryCta, url: event.target.value }
                  }
                }))
              }
            />
            <TextInput
              label="Primary CTA behaviour"
              value={form?.hero?.primaryCta?.behaviour ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hero: {
                    ...prev.hero,
                    primaryCta: { ...prev.hero?.primaryCta, behaviour: event.target.value }
                  }
                }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Secondary CTA label"
              value={form?.hero?.secondaryCta?.label ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hero: {
                    ...prev.hero,
                    secondaryCta: { ...prev.hero?.secondaryCta, label: event.target.value }
                  }
                }))
              }
            />
            <TextInput
              label="Secondary CTA URL"
              value={form?.hero?.secondaryCta?.url ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hero: {
                    ...prev.hero,
                    secondaryCta: { ...prev.hero?.secondaryCta, url: event.target.value }
                  }
                }))
              }
            />
            <TextInput
              label="Secondary CTA behaviour"
              value={form?.hero?.secondaryCta?.behaviour ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hero: {
                    ...prev.hero,
                    secondaryCta: { ...prev.hero?.secondaryCta, behaviour: event.target.value }
                  }
                }))
              }
            />
          </div>
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-branding"
          title="Branding"
          description="Theme, brand colours, layout, and typography."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Theme"
              value={form?.branding?.theme ?? 'light'}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branding: { ...prev.branding, theme: event.target.value } }))
              }
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Text tone"
              value={form?.branding?.textTone ?? 'dark'}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branding: { ...prev.branding, textTone: event.target.value } }))
              }
            >
              {textToneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Layout"
              value={form?.branding?.layout ?? 'modular'}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branding: { ...prev.branding, layout: event.target.value } }))
              }
            >
              {layoutOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <TextInput
              label="Typography"
              value={form?.branding?.typography ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branding: { ...prev.branding, typography: event.target.value } }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Brand color"
              value={form?.branding?.brandColor ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branding: { ...prev.branding, brandColor: event.target.value } }))
              }
              placeholder="#0b1d3a"
            />
            <TextInput
              label="Accent color"
              value={form?.branding?.accentColor ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branding: { ...prev.branding, accentColor: event.target.value } }))
              }
              placeholder="#38bdf8"
            />
            <TextInput
              label="Background color"
              value={form?.branding?.backgroundColor ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branding: { ...prev.branding, backgroundColor: event.target.value } }))
              }
              placeholder="#f1f5f9"
            />
          </div>
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-media"
          title="Media"
          description="Logos, hero imagery, brand photography, and gallery assets."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Logo URL"
              value={form?.media?.logoUrl ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, media: { ...prev.media, logoUrl: event.target.value } }))
              }
            />
            <TextInput
              label="Hero image URL"
              value={form?.media?.heroImageUrl ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, media: { ...prev.media, heroImageUrl: event.target.value } }))
              }
            />
            <TextInput
              label="Brand image URL"
              value={form?.media?.brandImageUrl ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, media: { ...prev.media, brandImageUrl: event.target.value } }))
              }
            />
            <TextInput
              label="Brand video URL"
              value={form?.media?.brandVideoUrl ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, media: { ...prev.media, brandVideoUrl: event.target.value } }))
              }
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Gallery</h4>
              <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={handleAddGalleryItem}>
                Add asset
              </Button>
            </div>
            <div className="space-y-4">
              {(form?.media?.gallery ?? []).map((item, index) => (
                <div key={item.id ?? index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextInput
                      label="Title"
                      value={item.title ?? ''}
                      onChange={(event) => handleGalleryChange(index, 'title', event.target.value)}
                    />
                    <TextInput
                      label="Image URL"
                      value={item.imageUrl ?? ''}
                      onChange={(event) => handleGalleryChange(index, 'imageUrl', event.target.value)}
                    />
                  </div>
                  <TextArea
                    label="Caption"
                    value={item.caption ?? ''}
                    onChange={(event) => handleGalleryChange(index, 'caption', event.target.value)}
                    rows={2}
                  />
                  <TextInput
                    label="Alt text"
                    value={item.altText ?? ''}
                    onChange={(event) => handleGalleryChange(index, 'altText', event.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={TrashIcon}
                      onClick={() => handleRemoveGalleryItem(index)}
                    >
                      Remove asset
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-support"
          title="Support & concierge"
          description="Contact channels, concierge details, and response promises."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Support email"
              value={form?.support?.email ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, support: { ...prev.support, email: event.target.value } }))
              }
            />
            <TextInput
              label="Support phone"
              value={form?.support?.phone ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, support: { ...prev.support, phone: event.target.value } }))
              }
            />
            <TextInput
              label="Support hours"
              value={form?.support?.hours ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, support: { ...prev.support, hours: event.target.value } }))
              }
            />
            <TextInput
              label="Response time"
              value={form?.support?.responseTime ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, support: { ...prev.support, responseTime: event.target.value } }))
              }
            />
            <TextInput
              label="Concierge name"
              value={form?.support?.conciergeName ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, support: { ...prev.support, conciergeName: event.target.value } }))
              }
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Channels</h4>
              <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={handleAddChannel}>
                Add channel
              </Button>
            </div>
            <div className="space-y-4">
              {(form?.support?.channels ?? []).map((channel, index) => (
                <div key={channel.id ?? index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select
                      label="Type"
                      value={channel.type ?? 'email'}
                      onChange={(event) => handleChannelChange(index, 'type', event.target.value)}
                    >
                      {channelTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <TextInput
                      label="Label"
                      value={channel.label ?? ''}
                      onChange={(event) => handleChannelChange(index, 'label', event.target.value)}
                    />
                    <TextInput
                      label="Destination"
                      value={channel.destination ?? ''}
                      onChange={(event) => handleChannelChange(index, 'destination', event.target.value)}
                    />
                    <TextInput
                      label="Notes"
                      value={channel.notes ?? ''}
                      onChange={(event) => handleChannelChange(index, 'notes', event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={TrashIcon}
                      onClick={() => handleRemoveChannel(index)}
                    >
                      Remove channel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-seo"
          title="SEO & discovery"
          description="Metadata presented to search engines and social platforms."
        >
          <TextInput
            label="Page title"
            value={form?.seo?.title ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, title: event.target.value } }))}
          />
          <TextArea
            label="Description"
            value={form?.seo?.description ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, description: event.target.value } }))}
            rows={3}
          />
          <TextInput
            label="Keywords"
            value={(form?.seo?.keywords ?? []).join(', ')}
            onChange={(event) => handleKeywordsChange(event.target.value)}
            placeholder="critical power, hvac, telemetry"
          />
          <TextInput
            label="OpenGraph image URL"
            value={form?.seo?.ogImageUrl ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, ogImageUrl: event.target.value } }))}
          />
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-social"
          title="Social links"
          description="Surface curated social destinations alongside your storefront."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={handleAddSocial}>
                Add social link
              </Button>
            </div>
            <div className="space-y-4">
              {(form?.socialLinks ?? []).map((link, index) => (
                <div key={link.id ?? index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput
                      label="Label"
                      value={link.label ?? ''}
                      onChange={(event) => handleSocialChange(index, 'label', event.target.value)}
                    />
                    <TextInput
                      label="URL"
                      value={link.url ?? ''}
                      onChange={(event) => handleSocialChange(index, 'url', event.target.value)}
                    />
                    <TextInput
                      label="Icon"
                      value={link.icon ?? ''}
                      onChange={(event) => handleSocialChange(index, 'icon', event.target.value)}
                      placeholder="linkedin"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={TrashIcon}
                      onClick={() => handleRemoveSocial(index)}
                    >
                      Remove link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-trust"
          title="Trust signals"
          description="Testimonials, certifications, metrics, and review widgets."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Checkbox
              label="Show trust score"
              checked={Boolean(form?.trust?.showTrustScore)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trust: { ...prev.trust, showTrustScore: event.target.checked } }))
              }
            />
            <Checkbox
              label="Show response time"
              checked={Boolean(form?.trust?.showResponseTime)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trust: { ...prev.trust, showResponseTime: event.target.checked } }))
              }
            />
            <Checkbox
              label="Enable testimonials"
              checked={Boolean(form?.trust?.testimonialsEnabled)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trust: { ...prev.trust, testimonialsEnabled: event.target.checked } }))
              }
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Testimonials</h4>
              <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={() => handleAddTrustItem('testimonials')}>
                Add testimonial
              </Button>
            </div>
            <div className="space-y-4">
              {(form?.trust?.testimonials ?? []).map((item, index) => (
                <div key={item.id ?? index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <TextArea
                    label="Quote"
                    value={item.quote ?? ''}
                    onChange={(event) => handleTrustCollectionChange('testimonials', index, 'quote', event.target.value)}
                    rows={3}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextInput
                      label="Author"
                      value={item.author ?? ''}
                      onChange={(event) => handleTrustCollectionChange('testimonials', index, 'author', event.target.value)}
                    />
                    <TextInput
                      label="Role"
                      value={item.role ?? ''}
                      onChange={(event) => handleTrustCollectionChange('testimonials', index, 'role', event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={TrashIcon}
                      onClick={() => handleRemoveTrustItem('testimonials', index)}
                    >
                      Remove testimonial
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Badges</h4>
              <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={() => handleAddTrustItem('badges')}>
                Add badge
              </Button>
            </div>
            <div className="space-y-4">
              {(form?.trust?.badges ?? []).map((badge, index) => (
                <div key={badge.id ?? index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextInput
                      label="Label"
                      value={badge.label ?? ''}
                      onChange={(event) => handleTrustCollectionChange('badges', index, 'label', event.target.value)}
                    />
                    <TextInput
                      label="Icon URL"
                      value={badge.iconUrl ?? ''}
                      onChange={(event) => handleTrustCollectionChange('badges', index, 'iconUrl', event.target.value)}
                    />
                  </div>
                  <TextArea
                    label="Description"
                    value={badge.description ?? ''}
                    onChange={(event) => handleTrustCollectionChange('badges', index, 'description', event.target.value)}
                    rows={2}
                  />
                  <TextInput
                    label="Evidence URL"
                    value={badge.evidenceUrl ?? ''}
                    onChange={(event) => handleTrustCollectionChange('badges', index, 'evidenceUrl', event.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={TrashIcon}
                      onClick={() => handleRemoveTrustItem('badges', index)}
                    >
                      Remove badge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Metrics</h4>
              <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={() => handleAddTrustItem('metrics')}>
                Add metric
              </Button>
            </div>
            <div className="space-y-4">
              {(form?.trust?.metrics ?? []).map((metric, index) => (
                <div key={metric.id ?? index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput
                      label="Label"
                      value={metric.label ?? ''}
                      onChange={(event) => handleTrustCollectionChange('metrics', index, 'label', event.target.value)}
                    />
                    <TextInput
                      label="Value"
                      value={metric.value ?? ''}
                      onChange={(event) => handleTrustCollectionChange('metrics', index, 'value', event.target.value)}
                    />
                    <TextInput
                      label="Format"
                      value={metric.format ?? ''}
                      onChange={(event) => handleTrustCollectionChange('metrics', index, 'format', event.target.value)}
                      placeholder="percent"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={TrashIcon}
                      onClick={() => handleRemoveTrustItem('metrics', index)}
                    >
                      Remove metric
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Checkbox
              label="Enable review widget"
              checked={Boolean(form?.trust?.reviewWidget?.enabled)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  trust: {
                    ...prev.trust,
                    reviewWidget: { ...prev.trust?.reviewWidget, enabled: event.target.checked }
                  }
                }))
              }
            />
            <TextInput
              label="Review widget display"
              value={form?.trust?.reviewWidget?.display ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  trust: {
                    ...prev.trust,
                    reviewWidget: { ...prev.trust?.reviewWidget, display: event.target.value }
                  }
                }))
              }
            />
            <TextInput
              label="Review provider ID"
              value={form?.trust?.reviewWidget?.providerId ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  trust: {
                    ...prev.trust,
                    reviewWidget: { ...prev.trust?.reviewWidget, providerId: event.target.value }
                  }
                }))
              }
            />
          </div>
          <TextInput
            label="Review widget URL"
            value={form?.trust?.reviewWidget?.url ?? ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                trust: {
                  ...prev.trust,
                  reviewWidget: { ...prev.trust?.reviewWidget, url: event.target.value }
                }
              }))
            }
          />
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-modules"
          title="Modules"
          description="Toggle storefront modules to match your sales motion."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {moduleToggleFields.map((toggle) => (
              <Checkbox
                key={toggle.field}
                label={toggle.label}
                checked={Boolean(form?.modules?.[toggle.field])}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    modules: { ...prev.modules, [toggle.field]: event.target.checked }
                  }))
                }
              />
            ))}
          </div>
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-projects"
          title="Featured projects"
          description="Showcase strategic programmes and downloadable packs."
        >
          <div className="flex items-center justify-between">
            <Button type="button" variant="secondary" icon={PlusSmallIcon} onClick={handleAddProject}>
              Add project
            </Button>
          </div>
          <div className="space-y-4">
            {(form?.featuredProjects ?? []).map((project, index) => (
              <div key={project.id ?? index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <TextInput
                  label="Title"
                  value={project.title ?? ''}
                  onChange={(event) => handleProjectChange(index, 'title', event.target.value)}
                />
                <TextArea
                  label="Summary"
                  value={project.summary ?? ''}
                  onChange={(event) => handleProjectChange(index, 'summary', event.target.value)}
                  rows={3}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <TextInput
                    label="Image URL"
                    value={project.imageUrl ?? ''}
                    onChange={(event) => handleProjectChange(index, 'imageUrl', event.target.value)}
                  />
                  <TextInput
                    label="CTA label"
                    value={project.ctaLabel ?? ''}
                    onChange={(event) => handleProjectChange(index, 'ctaLabel', event.target.value)}
                  />
                  <TextInput
                    label="CTA URL"
                    value={project.ctaUrl ?? ''}
                    onChange={(event) => handleProjectChange(index, 'ctaUrl', event.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={TrashIcon}
                    onClick={() => handleRemoveProject(index)}
                  >
                    Remove project
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </PreferencesGroup>

        <PreferencesGroup
          id="provider-dashboard-website-preferences-metadata"
          title="Publishing metadata"
          description="Track notes, publishing history, and concierge updates."
        >
          <TextArea
            label="Publishing notes"
            value={form?.metadata?.notes ?? ''}
            onChange={(event) => handleMetadataChange('notes', event.target.value)}
            rows={3}
          />
          <TextInput
            label="Last published at"
            type="datetime-local"
            value={form?.metadata?.lastPublishedAt ? form.metadata.lastPublishedAt.slice(0, 16) : ''}
            onChange={(event) => handleMetadataChange('lastPublishedAt', event.target.value)}
          />
          <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-600">Created</p>
              <p>{form?.metadata?.createdAt ? new Date(form.metadata.createdAt).toLocaleString() : '—'}</p>
              <p>{form?.metadata?.createdBy ?? '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">Updated</p>
              <p>{form?.metadata?.updatedAt ? new Date(form.metadata.updatedAt).toLocaleString() : '—'}</p>
              <p>{form?.metadata?.updatedBy ?? '—'}</p>
            </div>
          </div>
        </PreferencesGroup>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Save changes</p>
            <p className="text-xs text-slate-500">
              Saving preferences clears dashboard and storefront caches so updates reflect immediately.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {alert && alert.type === 'error' ? (
              <span className="text-sm text-rose-600" role="alert">
                {alert.message}
              </span>
            ) : null}
            <Button type="submit" loading={saving} disabled={saving}>
              Save website preferences
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

WebsitePreferencesSection.propTypes = {
  provider: PropTypes.shape({
    name: PropTypes.string,
    legalName: PropTypes.string,
    tradingName: PropTypes.string,
    slug: PropTypes.string,
    supportEmail: PropTypes.string,
    supportPhone: PropTypes.string
  }),
  initialPreferences: PropTypes.shape({}),
  onUpdated: PropTypes.func
};

WebsitePreferencesSection.defaultProps = {
  provider: null,
  initialPreferences: null,
  onUpdated: undefined
};

export default WebsitePreferencesSection;
