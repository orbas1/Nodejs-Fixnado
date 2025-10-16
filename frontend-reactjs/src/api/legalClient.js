const BASE_ENDPOINT = '/api/legal';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  let message = fallbackMessage;
  try {
    const payload = await response.json();
    message = payload?.message || fallbackMessage;
  } catch (error) {
    message = fallbackMessage;
  }

  const error = new Error(message);
  error.status = response.status;
  throw error;
}

function normaliseSection(section) {
  return {
    id: section?.id || '',
    anchor: section?.anchor || '',
    title: section?.title || '',
    summary: section?.summary || '',
    body: Array.isArray(section?.body) ? section.body : [],
    kind: section?.kind || 'paragraphs'
  };
}

export async function getPublishedLegalDocument(slug, { signal } = {}) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Unable to load legal document');
  const document = payload?.document;

  if (!document) {
    return null;
  }

  const version = document.version || {};
  const content = version.content || {};

  return {
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    owner: document.owner,
    heroImageUrl: document.heroImageUrl,
    contactEmail: document.contactEmail,
    contactPhone: document.contactPhone,
    reviewCadence: document.reviewCadence,
    version: {
      id: version.id,
      version: version.version,
      effectiveAt: version.effectiveAt,
      publishedAt: version.publishedAt,
      changeNotes: version.changeNotes || '',
      hero: content.hero || { eyebrow: '', title: document.title, summary: document.summary },
      contact: content.contact || { email: document.contactEmail, phone: document.contactPhone, url: 'https://fixnado.com/legal' },
      metadata: content.metadata || {},
      sections: Array.isArray(content.sections) ? content.sections.map(normaliseSection) : [],
      attachments: Array.isArray(version.attachments) ? version.attachments : []
    }
  };
}

export default { getPublishedLegalDocument };
