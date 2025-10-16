import ServicemanWebsitePreference from '../models/servicemanWebsitePreference.js';

const DEFAULT_PREFERENCES = Object.freeze({
  general: {
    heroTitle: 'Crew performance microsite',
    heroSubtitle: 'Trusted fix experts on every dispatch',
    heroTagline: 'Rapid response coverage across Metro North and neighbouring districts.',
    callToActionLabel: 'Request a crew',
    callToActionUrl: 'https://app.fixnado.com/request',
    heroImageUrl: '',
    aboutContent:
      'Jordan Miles and the Metro North crew handle mission critical FM assignments with audited quality, rapid travel buffers, and concierge status updates.'
  },
  branding: {
    primaryColor: '#1D4ED8',
    accentColor: '#0EA5E9',
    theme: 'system',
    layout: 'spotlight',
    logoUrl: '',
    galleryMedia: [],
    heroImageUrl: ''
  },
  contact: {
    contactEmail: 'crew@fixnado.com',
    contactPhone: '+44 20 1234 5678',
    emergencyPhone: '',
    bookingUrl: 'https://app.fixnado.com/bookings',
    serviceAreas: ['Metro North'],
    serviceTags: ['HVAC', 'sanitation'],
    contactHours: [
      { label: 'Weekdays', value: '06:00 - 20:00' },
      { label: 'Weekends', value: '08:00 - 18:00' }
    ],
    languages: ['English'],
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: 'https://www.linkedin.com/company/fixnado',
      youtube: ''
    }
  },
  operations: {
    allowOnlineBooking: true,
    enableEnquiryForm: true,
    showTravelRadius: true,
    travelRadiusKm: 25,
    averageResponseMinutes: 90,
    emergencySupport: false
  },
  content: {
    highlights: ['Fixnado certified technicians', 'Rapid response within 2 hours', 'Dedicated compliance reporting'],
    testimonials: [],
    featuredProjects: []
  },
  seo: {
    seoTitle: 'Jordan Miles Crew | Fixnado Technicians',
    seoDescription:
      'Book Jordan Miles and the Fixnado Metro North crew for rapid response FM, HVAC, and critical sanitation assignments.',
    seoKeywords: ['fixnado crew', 'jordan miles', 'metro north technicians'],
    seoIndexable: true,
    seoMetaImageUrl: ''
  },
  access: {
    allowedRoles: ['serviceman'],
    publishedAt: null
  }
});

const DEFAULT_META = Object.freeze({
  persona: 'serviceman',
  updatedAt: null,
  updatedBy: null,
  publishedAt: null,
  allowedRoles: ['serviceman']
});

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const HTTP_URL_PATTERN = /^https?:\/\//i;

const clone = (value) => JSON.parse(JSON.stringify(value));

function validationError(message, field) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = field ? [{ field, message }] : [];
  return error;
}

function toStringValue(input, fallback = '') {
  if (typeof input === 'string') {
    return input.trim();
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input);
  }
  return fallback;
}

function normaliseUrl(value, fallback = '', field = null, { allowRelative = true } = {}) {
  const input = toStringValue(value, '').trim();
  if (!input) {
    return fallback;
  }
  if (HTTP_URL_PATTERN.test(input)) {
    return input;
  }
  if (allowRelative && input.startsWith('/')) {
    return input;
  }
  throw validationError('Enter a valid URL including http(s) protocol.', field);
}

function normaliseColor(value, fallback, field) {
  const input = toStringValue(value, fallback).trim();
  if (!input) {
    return fallback;
  }
  if (!HEX_COLOR_PATTERN.test(input)) {
    throw validationError('Colours must be a valid hex code like #1D4ED8.', field);
  }
  return input.toUpperCase();
}

function normaliseStringList(value, { fallback = [], limit = 50 } = {}) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\n]/)
      : [];
  const seen = new Set();
  const output = [];
  for (const raw of items) {
    if (output.length >= limit) break;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }
  return output.length > 0 ? output : fallback.slice();
}

function normaliseKeyValueList(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback.slice();
  }
  return value
    .map((entry) => ({
      label: toStringValue(entry?.label, '').trim(),
      value: toStringValue(entry?.value, '').trim()
    }))
    .filter((entry) => entry.label || entry.value)
    .slice(0, 12);
}

function normaliseGallery(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback.slice();
  }
  return value
    .map((item) => {
      const url = normaliseUrl(item?.url, '', null, { allowRelative: true });
      const altText = toStringValue(item?.altText, '').trim();
      if (!url) return null;
      return { url, altText };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normaliseTestimonials(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback.slice();
  }
  return value
    .map((item) => ({
      name: toStringValue(item?.name, '').trim(),
      role: toStringValue(item?.role, '').trim(),
      quote: toStringValue(item?.quote, '').trim()
    }))
    .filter((entry) => entry.name && entry.quote)
    .slice(0, 8);
}

function normaliseProjects(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback.slice();
  }
  return value
    .map((item) => {
      const title = toStringValue(item?.title, '').trim();
      const summary = toStringValue(item?.summary ?? item?.description, '').trim();
      const imageUrl = normaliseUrl(item?.imageUrl, '', null, { allowRelative: true });
      const link = normaliseUrl(item?.link, '', null, { allowRelative: true });
      if (!title) {
        return null;
      }
      return {
        title,
        summary,
        imageUrl,
        link
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

function normaliseSocialLinks(value, fallback = {}) {
  const source = typeof value === 'object' && value ? value : {};
  const normaliseOptional = (raw, fallbackValue) => {
    const trimmed = toStringValue(raw, '').trim();
    if (!trimmed) {
      return '';
    }
    return normaliseUrl(trimmed, fallbackValue ?? '', null, { allowRelative: false });
  };
  return {
    facebook: normaliseOptional(source.facebook, ''),
    instagram: normaliseOptional(source.instagram, ''),
    linkedin: normaliseOptional(source.linkedin, fallback.linkedin ?? ''),
    youtube: normaliseOptional(source.youtube, ''),
    twitter: normaliseOptional(source.twitter, '')
  };
}

let cachedSnapshot = null;
let inflight = null;

async function fetchSnapshot() {
  const record = await ServicemanWebsitePreference.findOne({ where: { persona: 'serviceman' } });
  if (!record) {
    cachedSnapshot = {
      preferences: clone(DEFAULT_PREFERENCES),
      meta: { ...DEFAULT_META }
    };
    return cachedSnapshot;
  }

  const preferences = {
    general: {
      heroTitle: record.heroTitle,
      heroSubtitle: record.heroSubtitle ?? '',
      heroTagline: record.heroTagline ?? '',
      callToActionLabel: record.callToActionLabel,
      callToActionUrl: record.callToActionUrl ?? '',
      heroImageUrl: record.heroImageUrl ?? '',
      aboutContent: record.aboutContent ?? ''
    },
    branding: {
      primaryColor: record.primaryColor,
      accentColor: record.accentColor,
      theme: record.theme,
      layout: record.layout,
      logoUrl: record.logoUrl ?? '',
      galleryMedia: Array.isArray(record.galleryMedia) ? record.galleryMedia : [],
      heroImageUrl: record.heroImageUrl ?? ''
    },
    contact: {
      contactEmail: record.contactEmail,
      contactPhone: record.contactPhone ?? '',
      emergencyPhone: record.emergencyPhone ?? '',
      bookingUrl: record.bookingUrl ?? '',
      serviceAreas: Array.isArray(record.serviceAreas) ? record.serviceAreas : [],
      serviceTags: Array.isArray(record.serviceTags) ? record.serviceTags : [],
      contactHours: Array.isArray(record.contactHours) ? record.contactHours : [],
      languages: Array.isArray(record.languages) ? record.languages : [],
      socialLinks: typeof record.socialLinks === 'object' && record.socialLinks ? record.socialLinks : {}
    },
    operations: {
      allowOnlineBooking: Boolean(record.allowOnlineBooking),
      enableEnquiryForm: Boolean(record.enableEnquiryForm),
      showTravelRadius: Boolean(record.showTravelRadius),
      travelRadiusKm: record.travelRadiusKm,
      averageResponseMinutes: record.averageResponseMinutes,
      emergencySupport: Boolean(record.emergencySupport)
    },
    content: {
      highlights: Array.isArray(record.highlights) ? record.highlights : [],
      testimonials: Array.isArray(record.testimonials) ? record.testimonials : [],
      featuredProjects: Array.isArray(record.featuredProjects) ? record.featuredProjects : []
    },
    seo: {
      seoTitle: record.seoTitle,
      seoDescription: record.seoDescription ?? '',
      seoKeywords: Array.isArray(record.seoKeywords) ? record.seoKeywords : [],
      seoIndexable: Boolean(record.seoIndexable),
      seoMetaImageUrl: record.seoMetaImageUrl ?? ''
    },
    access: {
      allowedRoles: Array.isArray(record.allowedRoles) ? record.allowedRoles : ['serviceman'],
      publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null
    }
  };

  cachedSnapshot = {
    preferences,
    meta: {
      persona: 'serviceman',
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
      updatedBy: record.updatedBy ?? null,
      publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
      allowedRoles: Array.isArray(record.allowedRoles) ? record.allowedRoles : ['serviceman']
    }
  };
  return cachedSnapshot;
}

async function ensureSnapshot(forceRefresh = false) {
  if (cachedSnapshot && !forceRefresh) {
    return clone(cachedSnapshot);
  }
  if (!inflight || forceRefresh) {
    inflight = fetchSnapshot().finally(() => {
      inflight = null;
    });
  }
  const snapshot = await inflight;
  return clone(snapshot);
}

export async function getServicemanWebsitePreferences({ forceRefresh = false } = {}) {
  return ensureSnapshot(forceRefresh);
}

function sanitiseGeneral(input = {}, current = DEFAULT_PREFERENCES.general) {
  const heroTitle = toStringValue(input.heroTitle, current.heroTitle).trim();
  if (!heroTitle) {
    throw validationError('Hero title is required.', 'general.heroTitle');
  }
  const contactLabel = toStringValue(input.callToActionLabel, current.callToActionLabel).trim();
  if (!contactLabel) {
    throw validationError('Provide a call to action label.', 'general.callToActionLabel');
  }

  return {
    heroTitle,
    heroSubtitle: toStringValue(input.heroSubtitle, current.heroSubtitle).trim(),
    heroTagline: toStringValue(input.heroTagline, current.heroTagline).trim(),
    callToActionLabel: contactLabel,
    callToActionUrl: (() => {
      const raw = toStringValue(input.callToActionUrl, '').trim();
      return raw ? normaliseUrl(raw, current.callToActionUrl, 'general.callToActionUrl') : '';
    })(),
    heroImageUrl: (() => {
      const raw = toStringValue(input.heroImageUrl, '').trim();
      return raw ? normaliseUrl(raw, current.heroImageUrl, 'general.heroImageUrl') : '';
    })(),
    aboutContent: toStringValue(input.aboutContent, current.aboutContent)
  };
}

function sanitiseBranding(input = {}, current = DEFAULT_PREFERENCES.branding) {
  const theme = toStringValue(input.theme, current.theme).toLowerCase();
  const layout = toStringValue(input.layout, current.layout).toLowerCase();
  const themeOptions = new Set(['light', 'dark', 'system']);
  const layoutOptions = new Set(['spotlight', 'columns', 'split']);
  if (!themeOptions.has(theme)) {
    throw validationError('Theme must be light, dark, or system.', 'branding.theme');
  }
  if (!layoutOptions.has(layout)) {
    throw validationError('Layout must be spotlight, columns, or split.', 'branding.layout');
  }

  return {
    primaryColor: normaliseColor(input.primaryColor, current.primaryColor, 'branding.primaryColor'),
    accentColor: normaliseColor(input.accentColor, current.accentColor, 'branding.accentColor'),
    theme,
    layout,
    logoUrl: (() => {
      const raw = toStringValue(input.logoUrl, '').trim();
      return raw ? normaliseUrl(raw, current.logoUrl, 'branding.logoUrl') : '';
    })(),
    galleryMedia: normaliseGallery(input.galleryMedia, current.galleryMedia),
    heroImageUrl: (() => {
      const raw = toStringValue(input.heroImageUrl, '').trim();
      return raw ? normaliseUrl(raw, current.heroImageUrl, 'branding.heroImageUrl') : '';
    })()
  };
}

function sanitiseContact(input = {}, current = DEFAULT_PREFERENCES.contact) {
  const email = toStringValue(input.contactEmail, current.contactEmail).trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError('Enter a valid crew contact email.', 'contact.contactEmail');
  }

  return {
    contactEmail: email,
    contactPhone: toStringValue(input.contactPhone, current.contactPhone).trim(),
    emergencyPhone: toStringValue(input.emergencyPhone, current.emergencyPhone).trim(),
    bookingUrl: (() => {
      const raw = toStringValue(input.bookingUrl, '').trim();
      return raw ? normaliseUrl(raw, current.bookingUrl, 'contact.bookingUrl') : '';
    })(),
    serviceAreas: normaliseStringList(input.serviceAreas, { fallback: current.serviceAreas }),
    serviceTags: normaliseStringList(input.serviceTags, { fallback: current.serviceTags }),
    contactHours: normaliseKeyValueList(input.contactHours, current.contactHours),
    languages: normaliseStringList(input.languages, { fallback: current.languages }),
    socialLinks: normaliseSocialLinks(input.socialLinks, current.socialLinks)
  };
}

function sanitiseOperations(input = {}, current = DEFAULT_PREFERENCES.operations) {
  const travelRadius = Number.parseInt(input.travelRadiusKm ?? current.travelRadiusKm, 10);
  const responseMinutes = Number.parseInt(
    input.averageResponseMinutes ?? current.averageResponseMinutes,
    10
  );
  return {
    allowOnlineBooking: Boolean(input.allowOnlineBooking ?? current.allowOnlineBooking),
    enableEnquiryForm: Boolean(input.enableEnquiryForm ?? current.enableEnquiryForm),
    showTravelRadius: Boolean(input.showTravelRadius ?? current.showTravelRadius),
    travelRadiusKm: Number.isFinite(travelRadius) && travelRadius > 0 ? Math.min(travelRadius, 250) : current.travelRadiusKm,
    averageResponseMinutes:
      Number.isFinite(responseMinutes) && responseMinutes > 0
        ? Math.min(responseMinutes, 720)
        : current.averageResponseMinutes,
    emergencySupport: Boolean(input.emergencySupport ?? current.emergencySupport)
  };
}

function sanitiseContent(input = {}, current = DEFAULT_PREFERENCES.content) {
  return {
    highlights: normaliseStringList(input.highlights, { fallback: current.highlights, limit: 10 }),
    testimonials: normaliseTestimonials(input.testimonials, current.testimonials),
    featuredProjects: normaliseProjects(input.featuredProjects, current.featuredProjects)
  };
}

function sanitiseSeo(input = {}, current = DEFAULT_PREFERENCES.seo) {
  const title = toStringValue(input.seoTitle, current.seoTitle).trim();
  if (!title) {
    throw validationError('SEO title is required.', 'seo.seoTitle');
  }
  const description = toStringValue(input.seoDescription, current.seoDescription);
  if (description.length > 320) {
    throw validationError('SEO description must be 320 characters or fewer.', 'seo.seoDescription');
  }
  return {
    seoTitle: title,
    seoDescription: description,
    seoKeywords: normaliseStringList(input.seoKeywords, { fallback: current.seoKeywords, limit: 20 }),
    seoIndexable: Boolean(input.seoIndexable ?? current.seoIndexable),
    seoMetaImageUrl: (() => {
      const raw = toStringValue(input.seoMetaImageUrl, '').trim();
      return raw ? normaliseUrl(raw, current.seoMetaImageUrl, 'seo.seoMetaImageUrl') : '';
    })()
  };
}

function sanitiseAccess(input = {}, current = DEFAULT_PREFERENCES.access) {
  const allowedRoles = normaliseStringList(input.allowedRoles, {
    fallback: current.allowedRoles,
    limit: 10
  }).map((role) => role.toLowerCase());
  if (allowedRoles.length === 0) {
    throw validationError('At least one allowed role is required.', 'access.allowedRoles');
  }
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  return {
    allowedRoles,
    publishedAt: publishedAt instanceof Date && !Number.isNaN(publishedAt) ? publishedAt.toISOString() : null
  };
}

function flattenPreferences(preferences) {
  return {
    heroTitle: preferences.general.heroTitle,
    heroSubtitle: preferences.general.heroSubtitle,
    heroTagline: preferences.general.heroTagline,
    callToActionLabel: preferences.general.callToActionLabel,
    callToActionUrl: preferences.general.callToActionUrl,
    heroImageUrl: preferences.general.heroImageUrl || preferences.branding.heroImageUrl,
    aboutContent: preferences.general.aboutContent,
    primaryColor: preferences.branding.primaryColor,
    accentColor: preferences.branding.accentColor,
    theme: preferences.branding.theme,
    layout: preferences.branding.layout,
    logoUrl: preferences.branding.logoUrl,
    galleryMedia: preferences.branding.galleryMedia,
    contactEmail: preferences.contact.contactEmail,
    contactPhone: preferences.contact.contactPhone,
    emergencyPhone: preferences.contact.emergencyPhone,
    bookingUrl: preferences.contact.bookingUrl,
    serviceAreas: preferences.contact.serviceAreas,
    serviceTags: preferences.contact.serviceTags,
    contactHours: preferences.contact.contactHours,
    languages: preferences.contact.languages,
    socialLinks: preferences.contact.socialLinks,
    allowOnlineBooking: preferences.operations.allowOnlineBooking,
    enableEnquiryForm: preferences.operations.enableEnquiryForm,
    showTravelRadius: preferences.operations.showTravelRadius,
    travelRadiusKm: preferences.operations.travelRadiusKm,
    averageResponseMinutes: preferences.operations.averageResponseMinutes,
    emergencySupport: preferences.operations.emergencySupport,
    highlights: preferences.content.highlights,
    testimonials: preferences.content.testimonials,
    featuredProjects: preferences.content.featuredProjects,
    seoTitle: preferences.seo.seoTitle,
    seoDescription: preferences.seo.seoDescription,
    seoKeywords: preferences.seo.seoKeywords,
    seoIndexable: preferences.seo.seoIndexable,
    seoMetaImageUrl: preferences.seo.seoMetaImageUrl,
    allowedRoles: preferences.access.allowedRoles,
    publishedAt: preferences.access.publishedAt ? new Date(preferences.access.publishedAt) : null
  };
}

export async function updateServicemanWebsitePreferences(updates = {}, actorId = 'system') {
  const snapshot = await ensureSnapshot();
  const current = snapshot.preferences;

  const next = {
    general: sanitiseGeneral(updates.general, current.general),
    branding: sanitiseBranding(updates.branding, current.branding),
    contact: sanitiseContact(updates.contact, current.contact),
    operations: sanitiseOperations(updates.operations, current.operations),
    content: sanitiseContent(updates.content, current.content),
    seo: sanitiseSeo(updates.seo, current.seo),
    access: sanitiseAccess(updates.access, current.access)
  };

  const flattened = flattenPreferences(next);

  const [record, created] = await ServicemanWebsitePreference.findOrCreate({
    where: { persona: 'serviceman' },
    defaults: {
      persona: 'serviceman',
      ...flattened,
      createdBy: actorId,
      updatedBy: actorId
    }
  });

  if (!created) {
    await record.update({
      ...flattened,
      updatedBy: actorId,
      createdBy: record.createdBy ?? actorId
    });
  }

  cachedSnapshot = null;
  return ensureSnapshot(true);
}

export default {
  getServicemanWebsitePreferences,
  updateServicemanWebsitePreferences
};
