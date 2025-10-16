const BASE_ENDPOINT = '/api/admin/legal';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    const payload = await response.json().catch(() => ({}));
    return payload;
  }

  let errorMessage = fallbackMessage;
  try {
    const payload = await response.json();
    errorMessage = payload?.message || fallbackMessage;
  } catch (error) {
    errorMessage = fallbackMessage;
  }

  const error = new Error(errorMessage);
  error.status = response.status;
  throw error;
}

function normaliseSummaryDocument(document) {
  if (!document) {
    return null;
  }

  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    heroImageUrl: document.heroImageUrl,
    owner: document.owner,
    contactEmail: document.contactEmail,
    contactPhone: document.contactPhone,
    contactUrl: document.contactUrl,
    reviewCadence: document.reviewCadence,
    statusLabel: document.statusLabel,
    health: {
      nextEffective: document.health?.nextEffective || null,
      lastPublished: document.health?.lastPublished || null,
      reviewCadence: document.health?.reviewCadence || null
    },
    publishedVersion: document.publishedVersion || null,
    draftVersion: document.draftVersion || null,
    previewPath: document.previewPath
  };
}

function normaliseTimelineEntry(entry) {
  if (!entry) return null;
  return {
    id: entry.id,
    documentId: entry.documentId,
    slug: entry.slug,
    title: entry.title,
    version: entry.version,
    status: entry.status,
    updatedAt: entry.updatedAt,
    actor: entry.actor
  };
}

function normaliseSection(section) {
  return {
    id: section?.id || '',
    anchor: section?.anchor || '',
    title: section?.title || 'Section',
    summary: section?.summary || '',
    body: Array.isArray(section?.body) ? section.body : [],
    kind: section?.kind || 'paragraphs',
    attachments: Array.isArray(section?.attachments) ? section.attachments : []
  };
}

function normaliseVersion(version) {
  if (!version) return null;
  return {
    id: version.id,
    documentId: version.documentId,
    version: version.version,
    status: version.status,
    changeNotes: version.changeNotes || '',
    effectiveAt: version.effectiveAt || null,
    publishedAt: version.publishedAt || null,
    createdAt: version.createdAt || null,
    updatedAt: version.updatedAt || null,
    createdBy: version.createdBy || null,
    publishedBy: version.publishedBy || null,
    attachments: Array.isArray(version.attachments) ? version.attachments : [],
    content: {
      hero: version.content?.hero || { eyebrow: '', title: '', summary: '' },
      contact: version.content?.contact || { email: '', phone: '', url: '' },
      metadata: version.content?.metadata || {},
      sections: Array.isArray(version.content?.sections)
        ? version.content.sections.map(normaliseSection)
        : []
    }
  };
}

function normaliseDocument(payload) {
  if (!payload) {
    return null;
  }

  return {
    id: payload.id,
    slug: payload.slug,
    title: payload.title,
    summary: payload.summary,
    owner: payload.owner,
    heroImageUrl: payload.heroImageUrl,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    contactUrl: payload.contactUrl,
    reviewCadence: payload.reviewCadence,
    currentVersion: normaliseVersion(payload.currentVersion),
    draftVersion: normaliseVersion(payload.draftVersion),
    versions: Array.isArray(payload.versions) ? payload.versions.map(normaliseVersion) : []
  };
}

export async function listAdminLegalDocuments({ signal } = {}) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load legal documents');
  return {
    documents: Array.isArray(payload.documents) ? payload.documents.map(normaliseSummaryDocument) : [],
    stats: {
      publishedCount: payload.stats?.publishedCount ?? 0,
      draftCount: payload.stats?.draftCount ?? 0
    },
    timeline: Array.isArray(payload.timeline) ? payload.timeline.map(normaliseTimelineEntry).filter(Boolean) : []
  };
}

export async function getAdminLegalDocument(slug, { signal } = {}) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load legal document');
  return normaliseDocument(payload.document);
}

export async function createAdminLegalDraft(slug, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(slug)}/versions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to create legal draft');
  return normaliseDocument(payload.document);
}

export async function updateAdminLegalDraft(slug, versionId, body) {
  const response = await fetch(
    `${BASE_ENDPOINT}/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(body)
    }
  );

  const payload = await handleResponse(response, 'Failed to update legal draft');
  return normaliseDocument(payload.document);
}

export async function publishAdminLegalVersion(slug, versionId, body = {}) {
  const response = await fetch(
    `${BASE_ENDPOINT}/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/publish`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(body)
    }
  );

  const payload = await handleResponse(response, 'Failed to publish legal version');
  return normaliseDocument(payload.document);
}

export async function archiveAdminLegalDraft(slug, versionId) {
  const response = await fetch(
    `${BASE_ENDPOINT}/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/archive`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include'
    }
  );

  const payload = await handleResponse(response, 'Failed to archive legal draft');
  return normaliseDocument(payload.document);
}

export async function createAdminLegalDocument(body) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to create legal document');
  return normaliseDocument(payload.document);
}

export async function updateAdminLegalDocument(slug, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to update legal document');
  return normaliseDocument(payload.document);
}

export async function deleteAdminLegalDocument(slug) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  if (response.status === 204) {
    return true;
  }

  await handleResponse(response, 'Failed to delete legal document');
  return true;
}

export default {
  listAdminLegalDocuments,
  getAdminLegalDocument,
  createAdminLegalDocument,
  createAdminLegalDraft,
  updateAdminLegalDraft,
  publishAdminLegalVersion,
  archiveAdminLegalDraft,
  updateAdminLegalDocument,
  deleteAdminLegalDocument
};
