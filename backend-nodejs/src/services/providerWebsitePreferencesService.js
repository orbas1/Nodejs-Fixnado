import { randomUUID } from 'crypto';
import { z } from 'zod';
import ProviderWebsitePreference from '../models/providerWebsitePreference.js';
import { resolveCompanyForActor, toSlug } from './companyAccessService.js';

const DEFAULT_PREVIEW_ORIGIN =
  process.env.PROVIDER_STOREFRONT_ORIGIN || process.env.SITE_ORIGIN || 'https://providers.fixnado.com';

const COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const THEME_OPTIONS = new Set(['light', 'dark', 'system']);
const TEXT_TONE_OPTIONS = new Set(['light', 'dark', 'contrast']);
const CTA_BEHAVIOURS = new Set(['link', 'modal', 'download']);
const CHANNEL_TYPES = new Set(['email', 'phone', 'sms', 'portal', 'chat', 'slack', 'teams', 'whatsapp']);

function trimToNull(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normaliseColor(value, fallback) {
  const candidate = trimToNull(value);
  if (!candidate) {
    return fallback;
  }
  return COLOR_PATTERN.test(candidate) ? candidate : fallback;
}

function normaliseUrl(value) {
  const candidate = trimToNull(value);
  if (!candidate) {
    return null;
  }
  if (/^(https?:|mailto:|tel:)/i.test(candidate)) {
    return candidate;
  }
  if (candidate.startsWith('/')) {
    return candidate;
  }
  return `https://${candidate.replace(/^https?:\/\//i, '')}`;
}

function sanitiseDomain(value) {
  const candidate = trimToNull(value);
  if (!candidate) {
    return null;
  }
  return candidate.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function buildPreviewUrl(slug, domain) {
  if (domain) {
    return `https://${domain.replace(/^https?:\/\//i, '').replace(/\/$/, '')}`;
  }
  const origin = DEFAULT_PREVIEW_ORIGIN.replace(/\/$/, '');
  return `${origin}/${slug}`;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueKeywords(input) {
  const keywords = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : [];
  const seen = new Set();
  const result = [];
  keywords.forEach((keyword) => {
    const candidate = trimToNull(keyword);
    if (!candidate) {
      return;
    }
    const lower = candidate.toLowerCase();
    if (seen.has(lower)) {
      return;
    }
    seen.add(lower);
    result.push(candidate);
  });
  return result.slice(0, 16);
}

function normaliseHighlights(items, fallback = []) {
  const highlights = ensureArray(items)
    .map((item) => trimToNull(item))
    .filter(Boolean);
  if (highlights.length === 0) {
    return fallback;
  }
  return highlights.slice(0, 6);
}

function normaliseCta(input, fallback) {
  if (!input || typeof input !== 'object') {
    return fallback;
  }
  const label = trimToNull(input.label) ?? fallback.label ?? null;
  const url = normaliseUrl(input.url) ?? fallback.url ?? null;
  const behaviour = trimToNull(input.behaviour);
  return {
    label,
    url,
    behaviour: behaviour && CTA_BEHAVIOURS.has(behaviour) ? behaviour : fallback.behaviour ?? null
  };
}

function normaliseGalleryItem(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const id = trimToNull(item.id) ?? `gallery-${randomUUID()}`;
  const imageUrl = normaliseUrl(item.imageUrl);
  if (!imageUrl) {
    return null;
  }
  return {
    id,
    title: trimToNull(item.title) ?? `Gallery item ${index + 1}`,
    caption: trimToNull(item.caption) ?? trimToNull(item.description),
    imageUrl,
    altText: trimToNull(item.altText) ?? trimToNull(item.title) ?? 'Showcase image'
  };
}

function normaliseProject(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const id = trimToNull(item.id) ?? `project-${randomUUID()}`;
  const title = trimToNull(item.title);
  const summary = trimToNull(item.summary) ?? trimToNull(item.description);
  const imageUrl = normaliseUrl(item.imageUrl);
  return {
    id,
    title: title ?? `Flagship programme ${index + 1}`,
    summary: summary ?? 'Telemetry-governed engagement with enterprise client.',
    imageUrl,
    ctaLabel: trimToNull(item.ctaLabel) ?? trimToNull(item.ctaText) ?? null,
    ctaUrl: normaliseUrl(item.ctaUrl)
  };
}

function normaliseBadge(badge, index) {
  if (!badge || typeof badge !== 'object') {
    return null;
  }
  const id = trimToNull(badge.id) ?? `badge-${randomUUID()}`;
  const label = trimToNull(badge.label);
  if (!label) {
    return null;
  }
  return {
    id,
    label,
    description: trimToNull(badge.description) ?? trimToNull(badge.caption),
    iconUrl: normaliseUrl(badge.iconUrl) ?? normaliseUrl(badge.imageUrl),
    evidenceUrl: normaliseUrl(badge.evidenceUrl)
  };
}

function normaliseTestimonial(testimonial, index) {
  if (!testimonial || typeof testimonial !== 'object') {
    return null;
  }
  const id = trimToNull(testimonial.id) ?? `testimonial-${randomUUID()}`;
  const quote = trimToNull(testimonial.quote) ?? trimToNull(testimonial.body);
  if (!quote) {
    return null;
  }
  return {
    id,
    quote,
    author: trimToNull(testimonial.author) ?? trimToNull(testimonial.client) ?? 'Enterprise partner',
    role: trimToNull(testimonial.role) ?? trimToNull(testimonial.title) ?? null
  };
}

function normaliseChannel(channel, index) {
  if (!channel || typeof channel !== 'object') {
    return null;
  }
  const id = trimToNull(channel.id) ?? `channel-${randomUUID()}`;
  const type = trimToNull(channel.type);
  const destination = trimToNull(channel.destination) ?? trimToNull(channel.value);
  if (!destination) {
    return null;
  }
  const resolvedType = type && CHANNEL_TYPES.has(type) ? type : 'email';
  return {
    id,
    type: resolvedType,
    label: trimToNull(channel.label) ?? resolvedType.toUpperCase(),
    destination,
    notes: trimToNull(channel.notes) ?? trimToNull(channel.description)
  };
}

function defaultHero(company, slug) {
  const tradingName = trimToNull(company.contactName) ?? 'Provider';
  return {
    heading: `Showcase ${tradingName}`,
    subheading:
      'Curate hero messaging, calls to action, and feature highlights that convert high-intent buyers.',
    tagline: 'Escrow-backed • Telemetry-visible • Enterprise ready',
    highlights: ['Geo-zonal coverage', 'Escrow milestones', 'Compliance telemetry'],
    primaryCta: {
      label: 'View storefront',
      url: `/providers/${slug}`,
      behaviour: 'link'
    },
    secondaryCta: {
      label: 'Book discovery call',
      url: 'https://fixnado.com/contact',
      behaviour: 'link'
    }
  };
}

function defaultBranding() {
  return {
    theme: 'light',
    brandColor: '#0f172a',
    accentColor: '#38bdf8',
    backgroundColor: '#f8fafc',
    textTone: 'dark',
    layout: 'modular',
    typography: 'sans-serif'
  };
}

function defaultSupport(company) {
  return {
    email: trimToNull(company.contactEmail) ?? null,
    phone: trimToNull(company.contactPhone) ?? null,
    hours: '24/7 concierge for enterprise programmes',
    responseTime: 'Under 60 minutes',
    conciergeName: trimToNull(company.contactName) ?? null,
    channels: []
  };
}

function defaultTrust() {
  return {
    showTrustScore: true,
    showResponseTime: true,
    testimonialsEnabled: true,
    testimonials: [],
    badges: [],
    metrics: [
      { id: 'sla', label: 'SLA hit rate', value: '98%', format: 'percentage' },
      { id: 'response', label: 'Median response', value: '35 mins', format: 'duration' }
    ],
    reviewWidget: {
      enabled: false,
      display: 'inline',
      providerId: null,
      url: null
    }
  };
}

function defaultModules() {
  return {
    showProjects: true,
    showCertifications: true,
    showAvailability: true,
    allowEnquiryForm: true,
    enableLiveChat: false,
    allowDownloads: true,
    highlightGeoCoverage: true
  };
}

function normalisePreferenceInput(parsed, { company, existing }) {
  const baseSlug = toSlug(
    parsed.slug || existing?.slug || company.contactName || company.legalStructure || 'provider',
    `provider-${company.id.slice(0, 8)}`
  );
  const customDomain = sanitiseDomain(parsed.customDomain ?? existing?.customDomain ?? null);

  const heroDefaults = defaultHero(company, baseSlug);
  const heroInput = parsed.hero ?? {};
  const hero = {
    heading: trimToNull(heroInput.heading) ?? heroDefaults.heading,
    subheading: trimToNull(heroInput.subheading) ?? heroDefaults.subheading,
    tagline: trimToNull(heroInput.tagline) ?? heroDefaults.tagline,
    highlights: normaliseHighlights(heroInput.highlights, heroDefaults.highlights),
    mediaAlignment: trimToNull(heroInput.mediaAlignment) ?? 'right',
    primaryCta: normaliseCta(heroInput.primaryCta, heroDefaults.primaryCta),
    secondaryCta: normaliseCta(heroInput.secondaryCta, heroDefaults.secondaryCta)
  };

  const brandingDefaults = defaultBranding();
  const brandingInput = parsed.branding ?? {};
  const branding = {
    theme: THEME_OPTIONS.has(trimToNull(brandingInput.theme))
      ? trimToNull(brandingInput.theme)
      : brandingDefaults.theme,
    brandColor: normaliseColor(brandingInput.brandColor, brandingDefaults.brandColor),
    accentColor: normaliseColor(brandingInput.accentColor, brandingDefaults.accentColor),
    backgroundColor: normaliseColor(brandingInput.backgroundColor, brandingDefaults.backgroundColor),
    textTone: TEXT_TONE_OPTIONS.has(trimToNull(brandingInput.textTone))
      ? trimToNull(brandingInput.textTone)
      : brandingDefaults.textTone,
    layout: trimToNull(brandingInput.layout) ?? brandingDefaults.layout,
    typography: trimToNull(brandingInput.typography) ?? brandingDefaults.typography
  };

  const mediaInput = parsed.media ?? {};
  const gallery = ensureArray(mediaInput.gallery)
    .map((item, index) => normaliseGalleryItem(item, index))
    .filter(Boolean);
  const media = {
    logoUrl: normaliseUrl(mediaInput.logoUrl) ?? normaliseUrl(existing?.media?.logoUrl),
    heroImageUrl: normaliseUrl(mediaInput.heroImageUrl) ?? normaliseUrl(existing?.media?.heroImageUrl),
    brandImageUrl: normaliseUrl(mediaInput.brandImageUrl) ?? normaliseUrl(existing?.media?.brandImageUrl),
    brandVideoUrl: normaliseUrl(mediaInput.brandVideoUrl) ?? normaliseUrl(existing?.media?.brandVideoUrl),
    gallery
  };

  const supportDefaults = defaultSupport(company);
  const supportInput = parsed.support ?? {};
  const support = {
    email: trimToNull(supportInput.email) ?? supportDefaults.email,
    phone: trimToNull(supportInput.phone) ?? supportDefaults.phone,
    hours: trimToNull(supportInput.hours) ?? supportDefaults.hours,
    responseTime: trimToNull(supportInput.responseTime) ?? supportDefaults.responseTime,
    conciergeName: trimToNull(supportInput.conciergeName) ?? supportDefaults.conciergeName,
    channels: ensureArray(supportInput.channels)
      .map((channel, index) => normaliseChannel(channel, index))
      .filter(Boolean)
  };

  const seoInput = parsed.seo ?? {};
  const seo = {
    title:
      trimToNull(seoInput.title) ??
      `${trimToNull(company.contactName) ?? 'Provider'} • Fixnado enterprise marketplace`,
    description:
      trimToNull(seoInput.description) ??
      'Control storefront SEO metadata, social preview tags, and discoverability heuristics.',
    keywords: uniqueKeywords(seoInput.keywords ?? existing?.seo?.keywords ?? []),
    ogImageUrl: normaliseUrl(seoInput.ogImageUrl) ?? normaliseUrl(existing?.seo?.ogImageUrl)
  };

  const socialLinks = ensureArray(parsed.socialLinks ?? existing?.socialLinks ?? [])
    .map((link, index) => {
      const url = normaliseUrl(link.url);
      if (!url) {
        return null;
      }
      return {
        id: trimToNull(link.id) ?? `social-${randomUUID()}`,
        label: trimToNull(link.label) ?? `Link ${index + 1}`,
        url,
        icon: trimToNull(link.icon)
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  const trustDefaults = defaultTrust();
  const trustInput = parsed.trust ?? {};
  const trust = {
    showTrustScore:
      typeof trustInput.showTrustScore === 'boolean' ? trustInput.showTrustScore : trustDefaults.showTrustScore,
    showResponseTime:
      typeof trustInput.showResponseTime === 'boolean' ? trustInput.showResponseTime : trustDefaults.showResponseTime,
    testimonialsEnabled:
      typeof trustInput.testimonialsEnabled === 'boolean'
        ? trustInput.testimonialsEnabled
        : trustDefaults.testimonialsEnabled,
    testimonials: ensureArray(trustInput.testimonials ?? existing?.trust?.testimonials)
      .map((item, index) => normaliseTestimonial(item, index))
      .filter(Boolean)
      .slice(0, 8),
    badges: ensureArray(trustInput.badges ?? existing?.trust?.badges)
      .map((badge, index) => normaliseBadge(badge, index))
      .filter(Boolean)
      .slice(0, 8),
    metrics: ensureArray(trustInput.metrics ?? trustDefaults.metrics)
      .map((metric, index) => ({
        id: trimToNull(metric.id) ?? `metric-${index + 1}`,
        label: trimToNull(metric.label) ?? `Metric ${index + 1}`,
        value: trimToNull(metric.value) ?? null,
        format: trimToNull(metric.format) ?? 'number'
      }))
      .filter((metric) => metric.value)
      .slice(0, 6),
    reviewWidget: {
      enabled:
        typeof trustInput.reviewWidget?.enabled === 'boolean'
          ? trustInput.reviewWidget.enabled
          : trustDefaults.reviewWidget.enabled,
      display:
        trimToNull(trustInput.reviewWidget?.display) ?? trustDefaults.reviewWidget.display,
      providerId: trimToNull(trustInput.reviewWidget?.providerId) ?? null,
      url: normaliseUrl(trustInput.reviewWidget?.url) ?? null
    }
  };

  const modulesDefaults = defaultModules();
  const modulesInput = parsed.modules ?? {};
  const modules = {
    showProjects:
      typeof modulesInput.showProjects === 'boolean' ? modulesInput.showProjects : modulesDefaults.showProjects,
    showCertifications:
      typeof modulesInput.showCertifications === 'boolean'
        ? modulesInput.showCertifications
        : modulesDefaults.showCertifications,
    showAvailability:
      typeof modulesInput.showAvailability === 'boolean'
        ? modulesInput.showAvailability
        : modulesDefaults.showAvailability,
    allowEnquiryForm:
      typeof modulesInput.allowEnquiryForm === 'boolean'
        ? modulesInput.allowEnquiryForm
        : modulesDefaults.allowEnquiryForm,
    enableLiveChat:
      typeof modulesInput.enableLiveChat === 'boolean'
        ? modulesInput.enableLiveChat
        : modulesDefaults.enableLiveChat,
    allowDownloads:
      typeof modulesInput.allowDownloads === 'boolean'
        ? modulesInput.allowDownloads
        : modulesDefaults.allowDownloads,
    highlightGeoCoverage:
      typeof modulesInput.highlightGeoCoverage === 'boolean'
        ? modulesInput.highlightGeoCoverage
        : modulesDefaults.highlightGeoCoverage
  };

  const featuredProjects = ensureArray(parsed.featuredProjects ?? existing?.featuredProjects)
    .map((item, index) => normaliseProject(item, index))
    .filter(Boolean)
    .slice(0, 8);

  const metadataInput = parsed.metadata ?? {};
  const metadata = {
    ...existing?.metadata,
    notes: trimToNull(metadataInput.notes) ?? trimToNull(existing?.metadata?.notes) ?? null,
    lastPublishedAt: metadataInput.lastPublishedAt
      ? new Date(metadataInput.lastPublishedAt).toISOString()
      : existing?.metadata?.lastPublishedAt ?? null
  };

  return {
    slug: baseSlug,
    customDomain,
    hero,
    branding,
    media,
    support,
    seo,
    socialLinks,
    trust,
    modules,
    featuredProjects,
    metadata
  };
}

function normaliseProviderWebsitePreference(record, company) {
  const baseSlug = toSlug(
    record?.slug || company.contactName || company.legalStructure || 'provider',
    `provider-${company.id.slice(0, 8)}`
  );
  const customDomain = sanitiseDomain(record?.customDomain);
  const heroDefaults = defaultHero(company, baseSlug);
  const brandingDefaults = defaultBranding();
  const supportDefaults = defaultSupport(company);
  const trustDefaults = defaultTrust();
  const modulesDefaults = defaultModules();

  const hero = {
    heading: trimToNull(record?.hero?.heading) ?? heroDefaults.heading,
    subheading: trimToNull(record?.hero?.subheading) ?? heroDefaults.subheading,
    tagline: trimToNull(record?.hero?.tagline) ?? heroDefaults.tagline,
    highlights: normaliseHighlights(record?.hero?.highlights, heroDefaults.highlights),
    mediaAlignment: trimToNull(record?.hero?.mediaAlignment) ?? 'right',
    primaryCta: normaliseCta(record?.hero?.primaryCta, heroDefaults.primaryCta),
    secondaryCta: normaliseCta(record?.hero?.secondaryCta, heroDefaults.secondaryCta)
  };

  const branding = {
    theme: THEME_OPTIONS.has(trimToNull(record?.branding?.theme))
      ? trimToNull(record?.branding?.theme)
      : brandingDefaults.theme,
    brandColor: normaliseColor(record?.branding?.brandColor, brandingDefaults.brandColor),
    accentColor: normaliseColor(record?.branding?.accentColor, brandingDefaults.accentColor),
    backgroundColor: normaliseColor(
      record?.branding?.backgroundColor,
      brandingDefaults.backgroundColor
    ),
    textTone: TEXT_TONE_OPTIONS.has(trimToNull(record?.branding?.textTone))
      ? trimToNull(record?.branding?.textTone)
      : brandingDefaults.textTone,
    layout: trimToNull(record?.branding?.layout) ?? brandingDefaults.layout,
    typography: trimToNull(record?.branding?.typography) ?? brandingDefaults.typography
  };

  const media = {
    logoUrl: normaliseUrl(record?.media?.logoUrl),
    heroImageUrl: normaliseUrl(record?.media?.heroImageUrl),
    brandImageUrl: normaliseUrl(record?.media?.brandImageUrl),
    brandVideoUrl: normaliseUrl(record?.media?.brandVideoUrl),
    gallery: ensureArray(record?.media?.gallery)
      .map((item, index) => normaliseGalleryItem(item, index))
      .filter(Boolean)
  };

  const support = {
    email: trimToNull(record?.support?.email) ?? supportDefaults.email,
    phone: trimToNull(record?.support?.phone) ?? supportDefaults.phone,
    hours: trimToNull(record?.support?.hours) ?? supportDefaults.hours,
    responseTime: trimToNull(record?.support?.responseTime) ?? supportDefaults.responseTime,
    conciergeName: trimToNull(record?.support?.conciergeName) ?? supportDefaults.conciergeName,
    channels: ensureArray(record?.support?.channels)
      .map((channel, index) => normaliseChannel(channel, index))
      .filter(Boolean)
  };

  const seo = {
    title:
      trimToNull(record?.seo?.title) ??
      `${trimToNull(company.contactName) ?? 'Provider'} • Fixnado enterprise marketplace`,
    description:
      trimToNull(record?.seo?.description) ??
      'Control storefront SEO metadata, social preview tags, and discoverability heuristics.',
    keywords: uniqueKeywords(record?.seo?.keywords ?? []),
    ogImageUrl: normaliseUrl(record?.seo?.ogImageUrl)
  };

  const socialLinks = ensureArray(record?.socialLinks)
    .map((link, index) => {
      const url = normaliseUrl(link.url);
      if (!url) {
        return null;
      }
      return {
        id: trimToNull(link.id) ?? `social-${randomUUID()}`,
        label: trimToNull(link.label) ?? `Link ${index + 1}`,
        url,
        icon: trimToNull(link.icon)
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  const trust = {
    showTrustScore:
      typeof record?.trust?.showTrustScore === 'boolean'
        ? record.trust.showTrustScore
        : trustDefaults.showTrustScore,
    showResponseTime:
      typeof record?.trust?.showResponseTime === 'boolean'
        ? record.trust.showResponseTime
        : trustDefaults.showResponseTime,
    testimonialsEnabled:
      typeof record?.trust?.testimonialsEnabled === 'boolean'
        ? record.trust.testimonialsEnabled
        : trustDefaults.testimonialsEnabled,
    testimonials: ensureArray(record?.trust?.testimonials)
      .map((item, index) => normaliseTestimonial(item, index))
      .filter(Boolean)
      .slice(0, 8),
    badges: ensureArray(record?.trust?.badges)
      .map((badge, index) => normaliseBadge(badge, index))
      .filter(Boolean)
      .slice(0, 8),
    metrics: ensureArray(record?.trust?.metrics ?? trustDefaults.metrics)
      .map((metric, index) => ({
        id: trimToNull(metric.id) ?? `metric-${index + 1}`,
        label: trimToNull(metric.label) ?? `Metric ${index + 1}`,
        value: trimToNull(metric.value) ?? null,
        format: trimToNull(metric.format) ?? 'number'
      }))
      .filter((metric) => metric.value)
      .slice(0, 6),
    reviewWidget: {
      enabled:
        typeof record?.trust?.reviewWidget?.enabled === 'boolean'
          ? record.trust.reviewWidget.enabled
          : trustDefaults.reviewWidget.enabled,
      display:
        trimToNull(record?.trust?.reviewWidget?.display) ?? trustDefaults.reviewWidget.display,
      providerId: trimToNull(record?.trust?.reviewWidget?.providerId) ?? null,
      url: normaliseUrl(record?.trust?.reviewWidget?.url) ?? null
    }
  };

  const modules = {
    showProjects:
      typeof record?.modules?.showProjects === 'boolean'
        ? record.modules.showProjects
        : modulesDefaults.showProjects,
    showCertifications:
      typeof record?.modules?.showCertifications === 'boolean'
        ? record.modules.showCertifications
        : modulesDefaults.showCertifications,
    showAvailability:
      typeof record?.modules?.showAvailability === 'boolean'
        ? record.modules.showAvailability
        : modulesDefaults.showAvailability,
    allowEnquiryForm:
      typeof record?.modules?.allowEnquiryForm === 'boolean'
        ? record.modules.allowEnquiryForm
        : modulesDefaults.allowEnquiryForm,
    enableLiveChat:
      typeof record?.modules?.enableLiveChat === 'boolean'
        ? record.modules.enableLiveChat
        : modulesDefaults.enableLiveChat,
    allowDownloads:
      typeof record?.modules?.allowDownloads === 'boolean'
        ? record.modules.allowDownloads
        : modulesDefaults.allowDownloads,
    highlightGeoCoverage:
      typeof record?.modules?.highlightGeoCoverage === 'boolean'
        ? record.modules.highlightGeoCoverage
        : modulesDefaults.highlightGeoCoverage
  };

  const featuredProjects = ensureArray(record?.featuredProjects)
    .map((item, index) => normaliseProject(item, index))
    .filter(Boolean)
    .slice(0, 8);

  const metadata = {
    notes: trimToNull(record?.metadata?.notes) ?? null,
    lastPublishedAt: record?.metadata?.lastPublishedAt ?? null,
    updatedAt: record?.metadata?.updatedAt ?? record?.updatedAt?.toISOString?.() ?? null,
    updatedBy: record?.metadata?.updatedBy ?? null,
    createdAt: record?.metadata?.createdAt ?? record?.createdAt?.toISOString?.() ?? null,
    createdBy: record?.metadata?.createdBy ?? null
  };

  const previewUrl = buildPreviewUrl(baseSlug, customDomain);

  return {
    slug: baseSlug,
    customDomain,
    previewUrl,
    hero,
    branding,
    media,
    support,
    seo,
    socialLinks,
    trust,
    modules,
    featuredProjects,
    metadata
  };
}

const ctaSchema = z
  .object({
    label: z.string().trim().max(120).optional(),
    url: z.string().trim().max(1024).optional(),
    behaviour: z.string().trim().max(40).optional()
  })
  .partial();

const heroSchema = z
  .object({
    heading: z.string().trim().max(160).optional(),
    subheading: z.string().trim().max(600).optional(),
    tagline: z.string().trim().max(200).optional(),
    primaryCta: ctaSchema.optional(),
    secondaryCta: ctaSchema.optional(),
    highlights: z.array(z.string().trim().max(180)).optional(),
    mediaAlignment: z.string().trim().max(40).optional()
  })
  .partial();

const brandingSchema = z
  .object({
    theme: z.string().trim().max(20).optional(),
    brandColor: z.string().trim().max(20).optional(),
    accentColor: z.string().trim().max(20).optional(),
    backgroundColor: z.string().trim().max(20).optional(),
    textTone: z.string().trim().max(20).optional(),
    layout: z.string().trim().max(40).optional(),
    typography: z.string().trim().max(60).optional()
  })
  .partial();

const mediaSchema = z
  .object({
    logoUrl: z.string().trim().max(1024).optional(),
    heroImageUrl: z.string().trim().max(1024).optional(),
    brandImageUrl: z.string().trim().max(1024).optional(),
    brandVideoUrl: z.string().trim().max(1024).optional(),
    gallery: z
      .array(
        z
          .object({
            id: z.string().trim().max(120).optional(),
            title: z.string().trim().max(160).optional(),
            caption: z.string().trim().max(400).optional(),
            description: z.string().trim().max(400).optional(),
            imageUrl: z.string().trim().max(1024).optional(),
            altText: z.string().trim().max(160).optional()
          })
          .partial()
      )
      .optional()
  })
  .partial();

const supportSchema = z
  .object({
    email: z.string().trim().max(180).optional(),
    phone: z.string().trim().max(60).optional(),
    hours: z.string().trim().max(200).optional(),
    responseTime: z.string().trim().max(160).optional(),
    conciergeName: z.string().trim().max(160).optional(),
    channels: z
      .array(
        z
          .object({
            id: z.string().trim().max(120).optional(),
            type: z.string().trim().max(40).optional(),
            label: z.string().trim().max(160).optional(),
            destination: z.string().trim().max(512).optional(),
            value: z.string().trim().max(512).optional(),
            notes: z.string().trim().max(400).optional(),
            description: z.string().trim().max(400).optional()
          })
          .partial()
      )
      .optional()
  })
  .partial();

const seoSchema = z
  .object({
    title: z.string().trim().max(180).optional(),
    description: z.string().trim().max(600).optional(),
    keywords: z.union([
      z.array(z.string().trim().max(80)),
      z.string().trim().max(400)
    ]).optional(),
    ogImageUrl: z.string().trim().max(1024).optional()
  })
  .partial();

const socialLinkSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    label: z.string().trim().max(80).optional(),
    url: z.string().trim().max(1024).optional(),
    icon: z.string().trim().max(80).optional()
  })
  .partial();

const badgeSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    label: z.string().trim().max(160).optional(),
    description: z.string().trim().max(400).optional(),
    caption: z.string().trim().max(400).optional(),
    iconUrl: z.string().trim().max(1024).optional(),
    imageUrl: z.string().trim().max(1024).optional(),
    evidenceUrl: z.string().trim().max(1024).optional()
  })
  .partial();

const testimonialSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    quote: z.string().trim().max(600).optional(),
    body: z.string().trim().max(600).optional(),
    author: z.string().trim().max(160).optional(),
    client: z.string().trim().max(160).optional(),
    role: z.string().trim().max(160).optional(),
    title: z.string().trim().max(160).optional()
  })
  .partial();

const trustSchema = z
  .object({
    showTrustScore: z.boolean().optional(),
    showResponseTime: z.boolean().optional(),
    testimonialsEnabled: z.boolean().optional(),
    testimonials: z.array(testimonialSchema).optional(),
    badges: z.array(badgeSchema).optional(),
    metrics: z
      .array(
        z
          .object({
            id: z.string().trim().max(120).optional(),
            label: z.string().trim().max(160).optional(),
            value: z.string().trim().max(160).optional(),
            format: z.string().trim().max(40).optional()
          })
          .partial()
      )
      .optional(),
    reviewWidget: z
      .object({
        enabled: z.boolean().optional(),
        display: z.string().trim().max(40).optional(),
        providerId: z.string().trim().max(160).optional(),
        url: z.string().trim().max(1024).optional()
      })
      .partial()
      .optional()
  })
  .partial();

const modulesSchema = z
  .object({
    showProjects: z.boolean().optional(),
    showCertifications: z.boolean().optional(),
    showAvailability: z.boolean().optional(),
    allowEnquiryForm: z.boolean().optional(),
    enableLiveChat: z.boolean().optional(),
    allowDownloads: z.boolean().optional(),
    highlightGeoCoverage: z.boolean().optional()
  })
  .partial();

const projectSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    title: z.string().trim().max(180).optional(),
    summary: z.string().trim().max(500).optional(),
    description: z.string().trim().max(500).optional(),
    imageUrl: z.string().trim().max(1024).optional(),
    ctaLabel: z.string().trim().max(120).optional(),
    ctaText: z.string().trim().max(120).optional(),
    ctaUrl: z.string().trim().max(1024).optional()
  })
  .partial();

const metadataSchema = z
  .object({
    notes: z.string().trim().max(800).optional(),
    lastPublishedAt: z.union([z.string(), z.date()]).optional()
  })
  .partial();

const preferenceSchema = z
  .object({
    slug: z.string().trim().max(160).optional(),
    customDomain: z.string().trim().max(255).optional(),
    hero: heroSchema.optional(),
    branding: brandingSchema.optional(),
    media: mediaSchema.optional(),
    support: supportSchema.optional(),
    seo: seoSchema.optional(),
    socialLinks: z.array(socialLinkSchema).optional(),
    trust: trustSchema.optional(),
    modules: modulesSchema.optional(),
    featuredProjects: z.array(projectSchema).optional(),
    metadata: metadataSchema.optional()
  })
  .strict();

export async function getProviderWebsitePreferences({ companyId, actor }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const record = await ProviderWebsitePreference.findOne({ where: { companyId: company.id }, raw: true });
  return normaliseProviderWebsitePreference(record, company);
}

export async function updateProviderWebsitePreferences({ companyId, actor, payload }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  const parsed = preferenceSchema.parse(payload ?? {});

  const existing = await ProviderWebsitePreference.findOne({ where: { companyId: company.id } });
  const normalisedInput = normalisePreferenceInput(parsed, {
    company,
    existing: existing ? existing.get({ plain: true }) : undefined
  });

  const metadata = {
    ...normalisedInput.metadata,
    updatedAt: new Date().toISOString(),
    updatedBy: actorRecord.email ?? actorRecord.id ?? 'provider-user'
  };

  if (!existing) {
    metadata.createdAt = metadata.updatedAt;
    metadata.createdBy = actorRecord.email ?? actorRecord.id ?? 'provider-user';
  } else if (existing.metadata?.createdAt && !metadata.createdAt) {
    metadata.createdAt = existing.metadata.createdAt;
  }
  if (existing?.metadata?.createdBy && !metadata.createdBy) {
    metadata.createdBy = existing.metadata.createdBy;
  }

  const persistencePayload = {
    companyId: company.id,
    slug: normalisedInput.slug,
    customDomain: normalisedInput.customDomain,
    hero: normalisedInput.hero,
    branding: normalisedInput.branding,
    media: normalisedInput.media,
    support: normalisedInput.support,
    seo: normalisedInput.seo,
    socialLinks: normalisedInput.socialLinks,
    trust: normalisedInput.trust,
    modules: normalisedInput.modules,
    featuredProjects: normalisedInput.featuredProjects,
    metadata
  };

  let record;
  if (existing) {
    await existing.update(persistencePayload);
    record = existing.get({ plain: true });
  } else {
    const created = await ProviderWebsitePreference.create(persistencePayload);
    record = created.get({ plain: true });
  }

  record.metadata = metadata;
  return normaliseProviderWebsitePreference(record, company);
}

export { normaliseProviderWebsitePreference };
