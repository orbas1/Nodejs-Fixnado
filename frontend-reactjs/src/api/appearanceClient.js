const API_ROOT = '/api/admin/appearance/profiles';

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function ensureObject(value, fallback = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback };
  }
  return { ...fallback, ...value };
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  const payload = await response.json().catch(() => ({}));
  const error = new Error(payload?.message || fallbackMessage);
  error.status = response.status;
  error.details = payload?.details;
  throw error;
}

const DEFAULT_PROFILE = {
  id: null,
  name: 'Appearance profile',
  slug: '',
  description: '',
  isDefault: false,
  allowedRoles: ['admin'],
  colorPalette: {
    primary: '#1445E0',
    accent: '#1F75FE',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#111827',
    success: '#047857',
    warning: '#B45309',
    danger: '#B91C1C'
  },
  typography: {
    heading: 'Manrope',
    body: 'Inter',
    fallbackStack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    scaleRatio: 1.1,
    tracking: '0.01em'
  },
  layout: {
    density: 'comfortable',
    cornerRadius: 16,
    cardShadow: 'md',
    navigationStyle: 'pill'
  },
  imagery: {
    heroGuidelines: '',
    iconographyGuidelines: '',
    photographyChecklist: ''
  },
  widgets: {
    heroBanner: { enabled: true, headline: '', subheadline: '', ctaLabel: '' },
    statsRail: { enabled: true, columns: 3, dataSource: 'operations.metrics' },
    announcementBar: { enabled: false, channel: 'operations' }
  },
  governance: {
    lastReviewedBy: null,
    lastReviewedAt: null,
    notes: ''
  },
  publishedAt: null,
  assets: [],
  variants: []
};

export function normaliseAppearanceProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return { ...DEFAULT_PROFILE, id: profile?.id ?? null };
  }

  const allowedRoles = ensureArray(profile.allowedRoles)
    .map((role) => (typeof role === 'string' ? role : ''))
    .filter(Boolean);

  const assets = ensureArray(profile.assets)
    .map((asset, index) => ({
      id: asset?.id ?? null,
      profileId: asset?.profileId ?? profile.id ?? null,
      assetType: asset?.assetType || 'other',
      label: asset?.label || '',
      description: asset?.description || '',
      url: asset?.url || '',
      altText: asset?.altText || '',
      metadata: ensureObject(asset?.metadata, {}),
      sortOrder: Number.isFinite(asset?.sortOrder)
        ? asset.sortOrder
        : Number.parseInt(asset?.sortOrder ?? index, 10) || index,
      createdAt: asset?.createdAt || null,
      updatedAt: asset?.updatedAt || null
    }))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.label.localeCompare(b.label);
    });

  const variants = ensureArray(profile.variants)
    .map((variant, index) => ({
      id: variant?.id ?? null,
      profileId: variant?.profileId ?? profile.id ?? null,
      variantKey: variant?.variantKey || `variant-${index + 1}`,
      name: variant?.name || '',
      headline: variant?.headline || '',
      subheadline: variant?.subheadline || '',
      ctaLabel: variant?.ctaLabel || '',
      ctaUrl: variant?.ctaUrl || '',
      heroImageUrl: variant?.heroImageUrl || '',
      heroVideoUrl: variant?.heroVideoUrl || '',
      publishState: variant?.publishState || 'draft',
      scheduledFor: variant?.scheduledFor || null,
      marketingCopy: {
        audience: variant?.marketingCopy?.audience || '',
        keywords: ensureArray(variant?.marketingCopy?.keywords).map((item) => String(item))
      },
      sortOrder: Number.isFinite(variant?.sortOrder)
        ? variant.sortOrder
        : Number.parseInt(variant?.sortOrder ?? index, 10) || index,
      createdAt: variant?.createdAt || null,
      updatedAt: variant?.updatedAt || null
    }))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

  return {
    ...DEFAULT_PROFILE,
    ...profile,
    allowedRoles: allowedRoles.length ? allowedRoles : DEFAULT_PROFILE.allowedRoles,
    colorPalette: ensureObject(profile.colorPalette, DEFAULT_PROFILE.colorPalette),
    typography: ensureObject(profile.typography, DEFAULT_PROFILE.typography),
    layout: ensureObject(profile.layout, DEFAULT_PROFILE.layout),
    imagery: ensureObject(profile.imagery, DEFAULT_PROFILE.imagery),
    widgets: ensureObject(profile.widgets, DEFAULT_PROFILE.widgets),
    governance: ensureObject(profile.governance, DEFAULT_PROFILE.governance),
    assets,
    variants
  };
}

export async function fetchAppearanceProfiles({ signal } = {}) {
  const response = await fetch(API_ROOT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load appearance profiles');
  const profiles = ensureArray(payload?.data?.profiles ?? payload?.data ?? payload?.profiles);
  return profiles.map(normaliseAppearanceProfile);
}

export async function fetchAppearanceProfile(id, { slug, signal } = {}) {
  if (!id && !slug) {
    throw new Error('Profile id or slug is required');
  }
  const query = slug ? `?slug=${encodeURIComponent(slug)}` : '';
  const target = id ? `${API_ROOT}/${encodeURIComponent(id)}${slug ? query : ''}` : `${API_ROOT}/placeholder${query}`;
  const response = await fetch(target, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  const payload = await handleResponse(response, 'Failed to load appearance profile');
  const profile = payload?.data ?? payload?.profile ?? payload;
  return normaliseAppearanceProfile(profile);
}

export async function createAppearanceProfile(body) {
  const response = await fetch(API_ROOT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const payload = await handleResponse(response, 'Failed to create appearance profile');
  const profile = payload?.data ?? payload;
  return normaliseAppearanceProfile(profile);
}

export async function updateAppearanceProfile(id, body) {
  const response = await fetch(`${API_ROOT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const payload = await handleResponse(response, 'Failed to update appearance profile');
  const profile = payload?.data ?? payload;
  return normaliseAppearanceProfile(profile);
}

export async function archiveAppearanceProfile(id) {
  const response = await fetch(`${API_ROOT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  const payload = await handleResponse(response, 'Failed to archive appearance profile');
  const profile = payload?.data ?? payload;
  return normaliseAppearanceProfile(profile);
}

export function buildProfilePayload(form) {
  if (!form || typeof form !== 'object') {
    return { ...DEFAULT_PROFILE };
  }

  const serializeAssets = ensureArray(form.assets).map((asset, index) => ({
    id: asset?.id || null,
    assetType: asset?.assetType || 'other',
    label: asset?.label || '',
    description: asset?.description || '',
    url: asset?.url || '',
    altText: asset?.altText || '',
    metadata: ensureObject(asset?.metadata, {}),
    sortOrder: Math.max(
      0,
      Number.isFinite(asset?.sortOrder)
        ? asset.sortOrder
        : Number.parseInt(asset?.sortOrder ?? index, 10) || index
    )
  }));

  const serializeVariants = ensureArray(form.variants).map((variant, index) => ({
    id: variant?.id || null,
    variantKey: variant?.variantKey || `variant-${index + 1}`,
    name: variant?.name || '',
    headline: variant?.headline || '',
    subheadline: variant?.subheadline || '',
    ctaLabel: variant?.ctaLabel || '',
    ctaUrl: variant?.ctaUrl || '',
    heroImageUrl: variant?.heroImageUrl || '',
    heroVideoUrl: variant?.heroVideoUrl || '',
    publishState: variant?.publishState || 'draft',
    scheduledFor: variant?.scheduledFor || null,
    marketingCopy: {
      audience: variant?.marketingCopy?.audience || '',
      keywords: ensureArray(variant?.marketingCopy?.keywords)
    },
    sortOrder: Math.max(
      0,
      Number.isFinite(variant?.sortOrder)
        ? variant.sortOrder
        : Number.parseInt(variant?.sortOrder ?? index, 10) || index
    )
  }));

  return {
    name: form.name || DEFAULT_PROFILE.name,
    slug: form.slug || '',
    description: form.description || '',
    isDefault: Boolean(form.isDefault),
    allowedRoles: ensureArray(form.allowedRoles),
    colorPalette: ensureObject(form.colorPalette, DEFAULT_PROFILE.colorPalette),
    typography: ensureObject(form.typography, DEFAULT_PROFILE.typography),
    layout: ensureObject(form.layout, DEFAULT_PROFILE.layout),
    imagery: ensureObject(form.imagery, DEFAULT_PROFILE.imagery),
    widgets: ensureObject(form.widgets, DEFAULT_PROFILE.widgets),
    governance: ensureObject(form.governance, DEFAULT_PROFILE.governance),
    publishedAt: form.publishedAt || null,
    assets: serializeAssets,
    variants: serializeVariants
  };
}

export const defaults = DEFAULT_PROFILE;
