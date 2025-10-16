import { ROLE_OPTIONS, SEO_ALLOWED_ROLES } from './constants.js';

export function slugify(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 120);
}

export function uniqueList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
  }
  if (typeof value !== 'string') {
    return [];
  }
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function ensureRoleAccess(roles) {
  const input = Array.isArray(roles) ? roles : [];
  const cleaned = input.map((role) => role.toLowerCase()).filter((role) => SEO_ALLOWED_ROLES.has(role));
  if (!cleaned.includes('admin')) cleaned.push('admin');
  return cleaned;
}

export function buildSeoFormState(seo) {
  const form = seo && typeof seo === 'object' ? seo : {};
  return {
    siteName: form.siteName ?? 'Fixnado',
    defaultTitle: form.defaultTitle ?? '',
    titleTemplate: form.titleTemplate ?? '%s • Fixnado',
    defaultDescription: form.defaultDescription ?? '',
    defaultKeywordsText:
      form.defaultKeywordsText ?? (Array.isArray(form.defaultKeywords) ? form.defaultKeywords.join(', ') : ''),
    canonicalHost: form.canonicalHost ?? '',
    robots: {
      index: form.robots?.index !== false,
      follow: form.robots?.follow !== false,
      advancedDirectives: form.robots?.advancedDirectives ?? ''
    },
    sitemap: {
      autoGenerate: form.sitemap?.autoGenerate !== false,
      pingSearchEngines: form.sitemap?.pingSearchEngines !== false,
      lastGeneratedAt: form.sitemap?.lastGeneratedAt ?? null
    },
    social: {
      twitterHandle: form.social?.twitterHandle ?? '',
      facebookAppId: form.social?.facebookAppId ?? '',
      defaultImageUrl: form.social?.defaultImageUrl ?? '',
      defaultImageAlt: form.social?.defaultImageAlt ?? ''
    },
    structuredData: {
      organisationJsonLd: form.structuredData?.organisationJsonLd ?? '',
      enableAutoBreadcrumbs: form.structuredData?.enableAutoBreadcrumbs !== false
    },
    tagDefaults: {
      metaTitleTemplate: form.tagDefaults?.metaTitleTemplate ?? '%tag% • Fixnado',
      metaDescriptionTemplate: form.tagDefaults?.metaDescriptionTemplate ?? '',
      defaultRoleAccess:
        Array.isArray(form.tagDefaults?.defaultRoleAccess) && form.tagDefaults.defaultRoleAccess.length
          ? ensureRoleAccess(form.tagDefaults.defaultRoleAccess)
          : ['admin'],
      ownerRole: form.tagDefaults?.ownerRole ?? 'admin',
      defaultOgImageAlt: form.tagDefaults?.defaultOgImageAlt ?? '',
      autoPopulateOg: form.tagDefaults?.autoPopulateOg !== false
    },
    governance: {
      lockSlugEdits: form.governance?.lockSlugEdits === true,
      requireOwnerForPublish: form.governance?.requireOwnerForPublish === true
    }
  };
}

export function applyTagTemplate(template, { tagName, siteName }) {
  if (typeof template !== 'string') return '';
  return template.replace(/%tag%/gi, tagName ?? '').replace(/%site%/gi, siteName ?? 'Fixnado');
}

export function buildTagForm(tag, seoForm) {
  const defaults = seoForm?.tagDefaults ?? {};
  const social = seoForm?.social ?? {};
  const structuredDefault = seoForm?.structuredData?.organisationJsonLd ?? '';
  const name = tag?.name ?? '';
  const structured = (() => {
    if (typeof tag?.structuredData === 'string') {
      return tag.structuredData;
    }
    if (tag?.structuredData && typeof tag.structuredData === 'object' && Object.keys(tag.structuredData).length) {
      try {
        return JSON.stringify(tag.structuredData, null, 2);
      } catch {
        return '';
      }
    }
    return structuredDefault;
  })();

  const ownerRole = tag?.ownerRole ?? defaults.ownerRole ?? 'admin';
  const defaultAccess = ensureRoleAccess(defaults.defaultRoleAccess);
  if (!defaultAccess.includes(ownerRole)) {
    defaultAccess.push(ownerRole);
  }
  const resolvedAccess = Array.isArray(tag?.roleAccess) && tag.roleAccess.length ? ensureRoleAccess(tag.roleAccess) : defaultAccess;
  if (!resolvedAccess.includes(ownerRole)) {
    resolvedAccess.push(ownerRole);
  }

  return {
    id: tag?.id ?? null,
    name,
    slug: tag?.slug ?? slugify(name),
    slugTouched: Boolean(tag?.id),
    description: tag?.description ?? '',
    metaTitle: tag?.metaTitle ?? '',
    metaDescription: tag?.metaDescription ?? '',
    metaKeywordsText: Array.isArray(tag?.metaKeywords) ? tag.metaKeywords.join(', ') : '',
    canonicalUrl: tag?.canonicalUrl ?? '',
    ogImageUrl:
      tag?.ogImageUrl ?? (defaults.autoPopulateOg !== false ? social.defaultImageUrl ?? '' : ''),
    ogImageAlt: tag?.ogImageAlt ?? defaults.defaultOgImageAlt ?? '',
    noindex: Boolean(tag?.noindex),
    structuredDataInput: structured,
    synonymsText: Array.isArray(tag?.synonyms) ? tag.synonyms.join(', ') : '',
    roleAccess: resolvedAccess,
    ownerRole
  };
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never generated';
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) {
    const minutes = Math.round(diffMs / 60000);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffMs < 86400000) {
    const hours = Math.round(diffMs / 3600000);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(diffMs / 86400000);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function resolveRoleLabel(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
