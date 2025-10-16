export function generateSlugCandidate(input) {
  const base = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (!base) {
    return '';
  }

  const normalised = base
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);

  return normalised || '';
}

export function normaliseSlugInput(value) {
  const slug = generateSlugCandidate(value);
  return slug || (value ? '' : '');
}

export function normalisePreviewPath(value, slug) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate) {
    return slug ? `/${slug}` : '';
  }
  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }
  return candidate.startsWith('/') ? candidate : `/${candidate}`;
}

export function isDefaultPreviewPath(previewPath, slug) {
  if (!previewPath) {
    return true;
  }
  if (!slug) {
    return false;
  }

  const trimmedPreview = previewPath.trim();
  if (!trimmedPreview) {
    return true;
  }

  const normalisedSlug = slug.startsWith('/') ? slug : `/${slug}`;
  const alternateSlug = normalisedSlug.endsWith('/') ? normalisedSlug.slice(0, -1) : `${normalisedSlug}/`;

  return (
    trimmedPreview === slug ||
    trimmedPreview === normalisedSlug ||
    trimmedPreview === normalisedSlug.slice(0, -1) ||
    trimmedPreview === alternateSlug
  );
}

export function stringifyJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{\n  \n}';
  }
}

export function joinRoles(roles) {
  if (!Array.isArray(roles)) {
    return '';
  }
  return roles.join(', ');
}

export function parseRoles(input) {
  if (typeof input !== 'string') {
    return [];
  }
  return input
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}

export function optionalString(value) {
  if (typeof value !== 'string') {
    return value ?? undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
