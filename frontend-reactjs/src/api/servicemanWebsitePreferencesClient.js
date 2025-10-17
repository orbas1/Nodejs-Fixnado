const ENDPOINT = '/api/serviceman/website-preferences';

function normaliseList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item != null);
}

function normaliseKeyValueList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => ({
      label: typeof entry?.label === 'string' ? entry.label : '',
      value: typeof entry?.value === 'string' ? entry.value : ''
    }))
    .filter((entry) => entry.label || entry.value);
}

function normaliseSocialLinks(value) {
  if (typeof value !== 'object' || !value) {
    return {
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      twitter: ''
    };
  }
  return {
    facebook: value.facebook ?? '',
    instagram: value.instagram ?? '',
    linkedin: value.linkedin ?? '',
    youtube: value.youtube ?? '',
    twitter: value.twitter ?? ''
  };
}

function normaliseGallery(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => ({
      url: typeof item?.url === 'string' ? item.url : '',
      altText: typeof item?.altText === 'string' ? item.altText : ''
    }))
    .filter((entry) => entry.url);
}

function normaliseTestimonials(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => ({
      name: typeof item?.name === 'string' ? item.name : '',
      role: typeof item?.role === 'string' ? item.role : '',
      quote: typeof item?.quote === 'string' ? item.quote : ''
    }))
    .filter((entry) => entry.name && entry.quote);
}

function normaliseProjects(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => ({
      title: typeof item?.title === 'string' ? item.title : '',
      summary: typeof item?.summary === 'string' ? item.summary : typeof item?.description === 'string' ? item.description : '',
      imageUrl: typeof item?.imageUrl === 'string' ? item.imageUrl : '',
      link: typeof item?.link === 'string' ? item.link : ''
    }))
    .filter((entry) => entry.title);
}

const DEFAULT_PREFERENCES = Object.freeze({
  general: {
    heroTitle: 'Crew performance microsite',
    heroSubtitle: '',
    heroTagline: '',
    callToActionLabel: 'Request a crew',
    callToActionUrl: '',
    heroImageUrl: '',
    aboutContent: ''
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
    contactEmail: '',
    contactPhone: '',
    emergencyPhone: '',
    bookingUrl: '',
    serviceAreas: [],
    serviceTags: [],
    contactHours: [],
    languages: [],
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      twitter: ''
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
    highlights: [],
    testimonials: [],
    featuredProjects: []
  },
  seo: {
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
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

export const DEFAULT_SERVICEMAN_WEBSITE_PREFERENCES = DEFAULT_PREFERENCES;
export const DEFAULT_SERVICEMAN_WEBSITE_META = DEFAULT_META;

function buildSnapshot(payload = {}) {
  const preferences = payload.preferences ?? payload;
  return {
    preferences: {
      general: {
        ...DEFAULT_PREFERENCES.general,
        ...(preferences.general ?? {})
      },
      branding: {
        ...DEFAULT_PREFERENCES.branding,
        ...(preferences.branding ?? {}),
        galleryMedia: normaliseGallery(preferences.branding?.galleryMedia ?? preferences.branding?.gallery ?? [])
      },
      contact: {
        ...DEFAULT_PREFERENCES.contact,
        ...(preferences.contact ?? {}),
        serviceAreas: normaliseList(preferences.contact?.serviceAreas),
        serviceTags: normaliseList(preferences.contact?.serviceTags),
        contactHours: normaliseKeyValueList(preferences.contact?.contactHours),
        languages: normaliseList(preferences.contact?.languages),
        socialLinks: normaliseSocialLinks(preferences.contact?.socialLinks)
      },
      operations: {
        ...DEFAULT_PREFERENCES.operations,
        ...(preferences.operations ?? {})
      },
      content: {
        ...DEFAULT_PREFERENCES.content,
        ...(preferences.content ?? {}),
        highlights: normaliseList(preferences.content?.highlights),
        testimonials: normaliseTestimonials(preferences.content?.testimonials),
        featuredProjects: normaliseProjects(preferences.content?.featuredProjects)
      },
      seo: {
        ...DEFAULT_PREFERENCES.seo,
        ...(preferences.seo ?? {}),
        seoKeywords: normaliseList(preferences.seo?.seoKeywords)
      },
      access: {
        ...DEFAULT_PREFERENCES.access,
        ...(preferences.access ?? {}),
        allowedRoles: normaliseList(preferences.access?.allowedRoles)
      }
    },
    meta: {
      ...DEFAULT_META,
      ...(payload.meta ?? {})
    }
  };
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  const errorBody = await response.json().catch(() => ({}));
  const error = new Error(errorBody?.message || fallbackMessage);
  error.status = response.status;
  error.details = errorBody?.details;
  throw error;
}

export async function fetchServicemanWebsitePreferences({ signal } = {}) {
  const response = await fetch(ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load website preferences');
  return buildSnapshot(payload);
}

export async function persistServicemanWebsitePreferences(body) {
  const response = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to save website preferences');
  return buildSnapshot(payload);
}

export default {
  fetchServicemanWebsitePreferences,
  persistServicemanWebsitePreferences
};
