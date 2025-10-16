import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import { Card, Spinner, StatusPill } from '../components/ui/index.js';
import LegalDocumentToolbar from '../features/legal/admin/LegalDocumentToolbar.jsx';
import LegalDocumentMetadataCard from '../features/legal/admin/LegalDocumentMetadataCard.jsx';
import LegalHeroCard from '../features/legal/admin/LegalHeroCard.jsx';
import LegalSectionsCard from '../features/legal/admin/LegalSectionsCard.jsx';
import LegalAttachmentsCard from '../features/legal/admin/LegalAttachmentsCard.jsx';
import LegalPublishingCard from '../features/legal/admin/LegalPublishingCard.jsx';
import LegalSidebar from '../features/legal/admin/LegalSidebar.jsx';
import LegalCreateModal from '../features/legal/admin/LegalCreateModal.jsx';
import {
  listAdminLegalDocuments,
  getAdminLegalDocument,
  createAdminLegalDocument,
  createAdminLegalDraft,
  updateAdminLegalDraft,
  updateAdminLegalDocument,
  publishAdminLegalVersion,
  archiveAdminLegalDraft,
  deleteAdminLegalDocument
} from '../api/legalAdminClient.js';

const DATE_INPUT_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, DATE_INPUT_OPTIONS);
  } catch (error) {
    return value;
  }
}

function toInputDateTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const iso = parsed.toISOString();
  return iso.slice(0, 16);
}

function fromInputDateTime(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

function splitBody(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function slugifyInput(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
}

function createLocalId(prefix) {
  const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  const raw =
    globalCrypto && typeof globalCrypto.randomUUID === 'function'
      ? globalCrypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  const token = raw.replace(/-/g, '').slice(0, 8);
  return `${prefix}-${token}`;
}

function reorderList(list, fromIndex, toIndex) {
  if (!Array.isArray(list)) {
    return list;
  }
  if (toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function buildFormState(document) {
  if (!document) {
    return null;
  }

  const draftSource = document.draftVersion || document.currentVersion || null;
  const content = draftSource?.content || {};
  const hero = content.hero || {};
  const attachmentSource = draftSource?.attachments?.length
    ? draftSource.attachments
    : document.currentVersion?.attachments || [];

  return {
    title: document.title || '',
    summary: document.summary || '',
    heroImageUrl: document.heroImageUrl || '',
    owner: document.owner || '',
    contactEmail: document.contactEmail || '',
    contactPhone: document.contactPhone || '',
    contactUrl: document.contactUrl || '',
    reviewCadence: document.reviewCadence || '',
    heroEyebrow: hero.eyebrow || '',
    heroTitle: hero.title || document.title || '',
    heroSummary: hero.summary || document.summary || '',
    sections: Array.isArray(content.sections)
      ? content.sections.map((section) => ({
          id: section.id || '',
          anchor: section.anchor || '',
          title: section.title || '',
          summary: section.summary || '',
          body: Array.isArray(section.body) ? section.body.join('\n\n') : ''
        }))
      : [],
    attachments: Array.isArray(attachmentSource)
      ? attachmentSource.map((attachment) => ({
          id: attachment.id || '',
          label: attachment.label || '',
          url: attachment.url || '',
          description: attachment.description || '',
          type: attachment.type || ''
        }))
      : [],
    changeNotes: draftSource?.changeNotes || '',
    effectiveAt: document.draftVersion?.effectiveAt
      ? toInputDateTime(document.draftVersion.effectiveAt)
      : ''
  };
}

function serialiseFormPayload(form) {
  if (!form) return {};
  return {
    title: form.title?.trim() || '',
    summary: form.summary?.trim() || '',
    heroImageUrl: form.heroImageUrl?.trim() || null,
    owner: form.owner?.trim() || '',
    contactEmail: form.contactEmail?.trim() || null,
    contactPhone: form.contactPhone?.trim() || null,
    contactUrl: form.contactUrl?.trim() || null,
    reviewCadence: form.reviewCadence?.trim() || null,
    hero: {
      eyebrow: form.heroEyebrow?.trim() || '',
      title: form.heroTitle?.trim() || '',
      summary: form.heroSummary?.trim() || ''
    },
    sections: form.sections.map((section, index) => ({
      id: section.id?.trim() || `section-${index + 1}`,
      anchor: section.anchor?.trim() || '',
      title: section.title?.trim() || `Section ${index + 1}`,
      summary: section.summary?.trim() || '',
      body: splitBody(section.body)
    })),
    attachments: form.attachments
      .map((attachment, index) => {
        const url = attachment?.url?.trim();
        if (!url) {
          return null;
        }
        return {
          id: attachment?.id?.trim() || undefined,
          label: attachment?.label?.trim() || `Attachment ${index + 1}`,
          url,
          description: attachment?.description?.trim() || undefined,
          type: attachment?.type?.trim() || undefined
        };
      })
      .filter(Boolean),
    changeNotes: form.changeNotes?.trim() || '',
    effectiveAt: fromInputDateTime(form.effectiveAt)
  };
}

function filterTimelineForSlug(timeline, slug) {
  if (!Array.isArray(timeline)) {
    return [];
  }
  return timeline.filter((entry) => entry.slug === slug).slice(0, 6);
}

export default function AdminLegal() {
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ documents: [], stats: { publishedCount: 0, draftCount: 0 }, timeline: [] });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    summary: '',
    owner: '',
    contactEmail: '',
    contactPhone: '',
    contactUrl: '',
    heroImageUrl: '',
    reviewCadence: ''
  });

  const documentOptions = useMemo(
    () => summary.documents.map((doc) => ({ value: doc.slug, label: doc.title })),
    [summary.documents]
  );

  const selectedSlug = routeSlug || (summary.documents[0]?.slug ?? '');
  const slugPreview = useMemo(() => slugifyInput(createForm.slug || createForm.title), [createForm.slug, createForm.title]);
  const selectedDocumentSummary = useMemo(
    () => summary.documents.find((doc) => doc.slug === selectedSlug) || null,
    [summary.documents, selectedSlug]
  );

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const payload = await listAdminLegalDocuments();
      setSummary(payload);
      setError(null);
      return payload;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to load legal summary';
      setError(message);
      return null;
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (summaryLoading) {
      return;
    }
    if (!selectedSlug && summary.documents.length > 0) {
      navigate(`/admin/legal/${summary.documents[0].slug}`, { replace: true });
    }
    if (selectedSlug && summary.documents.length > 0 && !summary.documents.some((doc) => doc.slug === selectedSlug)) {
      navigate(`/admin/legal/${summary.documents[0].slug}`, { replace: true });
    }
  }, [summaryLoading, summary.documents, selectedSlug, navigate]);

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      setForm(null);
      return;
    }

    const controller = new AbortController();
    setDetailLoading(true);
    setError(null);
    setSuccess(null);

    (async () => {
      try {
        const payload = await getAdminLegalDocument(selectedSlug, { signal: controller.signal });
        setDetail(payload);
        setForm(buildFormState(payload));
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message = caught instanceof Error ? caught.message : 'Unable to load document';
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [selectedSlug]);

  const handleDocumentChange = (value) => {
    if (!value) return;
    navigate(`/admin/legal/${value}`);
  };

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSectionChange = (index, field, value) => {
    setForm((current) => {
      const nextSections = current.sections.map((section, idx) =>
        idx === index ? { ...section, [field]: value } : section
      );
      return { ...current, sections: nextSections };
    });
  };

  const handleRemoveSection = (index) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.filter((_, idx) => idx !== index)
    }));
  };

  const handleAddSection = () => {
    setForm((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: createLocalId('section'),
          anchor: '',
          title: '',
          summary: '',
          body: ''
        }
      ]
    }));
  };

  const handleMoveSection = (index, direction) => {
    setForm((current) => {
      if (!current?.sections?.length) {
        return current;
      }
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.sections.length) {
        return current;
      }
      return {
        ...current,
        sections: reorderList(current.sections, index, nextIndex)
      };
    });
  };

  const handleDuplicateSection = (index) => {
    setForm((current) => {
      const section = current.sections[index];
      if (!section) {
        return current;
      }
      const baseId = slugifyInput(section.id || section.title || `section-${index + 1}`) || `section-${index + 1}`;
      const duplicate = {
        ...section,
        id: createLocalId(baseId),
        anchor: '',
        title: section.title ? `${section.title} (Copy)` : `Section ${index + 1} copy`
      };
      const nextSections = [...current.sections];
      nextSections.splice(index + 1, 0, duplicate);
      return { ...current, sections: nextSections };
    });
  };

  const handleAttachmentChange = (index, field, value) => {
    setForm((current) => {
      const nextAttachments = current.attachments.map((attachment, idx) =>
        idx === index ? { ...attachment, [field]: value } : attachment
      );
      return { ...current, attachments: nextAttachments };
    });
  };

  const handleAddAttachment = () => {
    setForm((current) => ({
      ...current,
      attachments: [
        ...current.attachments,
        { id: createLocalId('attachment'), label: '', url: '', description: '', type: '' }
      ]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((_, idx) => idx !== index)
    }));
  };

  const handleMoveAttachment = (index, direction) => {
    setForm((current) => {
      if (!current?.attachments?.length) {
        return current;
      }
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.attachments.length) {
        return current;
      }
      return {
        ...current,
        attachments: reorderList(current.attachments, index, nextIndex)
      };
    });
  };

  const handleDuplicateAttachment = (index) => {
    setForm((current) => {
      const attachment = current.attachments[index];
      if (!attachment) {
        return current;
      }
      const baseLabel = attachment.label?.trim() || `Attachment ${index + 1}`;
      const duplicate = {
        ...attachment,
        id: createLocalId('attachment'),
        label: `${baseLabel} (Copy)`
      };
      const nextAttachments = [...current.attachments];
      nextAttachments.splice(index + 1, 0, duplicate);
      return { ...current, attachments: nextAttachments };
    });
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      slug: '',
      summary: '',
      owner: '',
      contactEmail: '',
      contactPhone: '',
      contactUrl: '',
      heroImageUrl: '',
      reviewCadence: ''
    });
  };

  const handleOpenCreateModal = () => {
    setError(null);
    setSuccess(null);
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (creating) return;
    setCreateModalOpen(false);
    resetCreateForm();
  };

  const handleCreateFieldChange = (field, value) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateDocument = async (event) => {
    event?.preventDefault();
    const resolvedSlug = slugifyInput(createForm.slug || createForm.title);
    if (!resolvedSlug) {
      setError('A title or slug is required to create a policy.');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...createForm,
        slug: resolvedSlug,
        hero: {
          eyebrow: 'Legal library',
          title: createForm.title || 'New policy',
          summary: createForm.summary || ''
        },
        sections: [],
        attachments: []
      };

      const document = await createAdminLegalDocument(payload);
      setCreateModalOpen(false);
      resetCreateForm();
      setDetail(document);
      setForm(buildFormState(document));
      setSuccess('Legal document created. Start drafting content.');
      navigate(`/admin/legal/${document.slug}`);
      await loadSummary();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to create legal document';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!selectedSlug || !form) return;
    setMetadataSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        title: form.title?.trim() || '',
        summary: form.summary?.trim() || '',
        heroImageUrl: form.heroImageUrl?.trim() || null,
        owner: form.owner?.trim() || '',
        contactEmail: form.contactEmail?.trim() || null,
        contactPhone: form.contactPhone?.trim() || null,
        contactUrl: form.contactUrl?.trim() || null,
        reviewCadence: form.reviewCadence?.trim() || null
      };
      const document = await updateAdminLegalDocument(selectedSlug, payload);
      setDetail(document);
      setForm(buildFormState(document));
      setSuccess('Metadata synced successfully.');
      await loadSummary();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to sync metadata';
      setError(message);
    } finally {
      setMetadataSaving(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedSlug || !detail) return;
    if (detail.currentVersion) {
      setError('Published policies cannot be deleted. Archive or supersede the live version first.');
      return;
    }
    const confirmed = window.confirm('Delete this policy and all associated drafts? This action cannot be undone.');
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteAdminLegalDocument(selectedSlug);
      setDetail(null);
      setForm(null);
      setSuccess('Policy deleted successfully.');
      const payload = await loadSummary();
      const fallbackSlug = payload?.documents?.[0]?.slug || '';
      if (fallbackSlug) {
        navigate(`/admin/legal/${fallbackSlug}`);
      } else {
        navigate('/admin/legal');
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to delete policy';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setForm(buildFormState(detail));
    setSuccess(null);
    setError(null);
  };

  const handleSaveDraft = async () => {
    if (!selectedSlug || !form) return;
    const payload = serialiseFormPayload(form);
    setSavingDraft(true);
    setError(null);
    setSuccess(null);
    try {
      const nextDocument = detail?.draftVersion
        ? await updateAdminLegalDraft(selectedSlug, detail.draftVersion.id, payload)
        : await createAdminLegalDraft(selectedSlug, payload);
      setDetail(nextDocument);
      setForm(buildFormState(nextDocument));
      setSuccess('Draft saved successfully.');
      await loadSummary();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to save draft';
      setError(message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSlug || !detail?.draftVersion) {
      setError('A draft must exist before publishing. Save your changes first.');
      return;
    }
    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {};
      const effectiveAt = fromInputDateTime(form.effectiveAt);
      if (effectiveAt) {
        payload.effectiveAt = effectiveAt;
      }
      const updated = await publishAdminLegalVersion(selectedSlug, detail.draftVersion.id, payload);
      setDetail(updated);
      setForm(buildFormState(updated));
      setSuccess('Legal document published successfully.');
      await loadSummary();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to publish document';
      setError(message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!selectedSlug || !detail?.draftVersion) return;
    const confirmed = window.confirm('Discard the current draft? This action cannot be undone.');
    if (!confirmed) return;
    setSavingDraft(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await archiveAdminLegalDraft(selectedSlug, detail.draftVersion.id);
      setDetail(updated);
      setForm(buildFormState(updated));
      setSuccess('Draft discarded.');
      await loadSummary();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to discard draft';
      setError(message);
    } finally {
      setSavingDraft(false);
    }
  };

  const meta = useMemo(() => {
    const publishedVersion = detail?.currentVersion;
    return [
      {
        label: 'Managed documents',
        value: summary.documents.length.toString(),
        caption: 'Legal surfaces in scope'
      },
      {
        label: 'Drafts in progress',
        value: summary.stats.draftCount.toString(),
        caption: summary.stats.draftCount ? 'Awaiting review' : 'All clear'
      },
      {
        label: 'Policy owner',
        value: detail?.owner ? detail.owner : 'Unassigned',
        caption: 'Accountable lead'
      },
      {
        label: 'Last published',
        value: publishedVersion?.publishedAt ? formatDateTime(publishedVersion.publishedAt) : 'Not published',
        caption: publishedVersion ? `Version v${publishedVersion.version}` : 'No public version'
      }
    ];
  }, [detail?.currentVersion, detail?.owner, summary.documents.length, summary.stats.draftCount]);

  const timeline = useMemo(
    () => filterTimelineForSlug(summary.timeline, selectedSlug),
    [summary.timeline, selectedSlug]
  );

  const versionHistory = useMemo(() => detail?.versions ?? [], [detail?.versions]);

  const statusPills = (
    <div className="flex flex-wrap items-center gap-3">
      {detail?.draftVersion ? <StatusPill tone="warning">Draft awaiting publication</StatusPill> : null}
      {detail?.currentVersion ? (
        <StatusPill tone="success">Published v{detail.currentVersion.version}</StatusPill>
      ) : (
        <StatusPill tone="neutral">Not yet published</StatusPill>
      )}
      {savingDraft ? (
        <StatusPill tone="info" aria-live="polite">
          <span className="inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving draft…
          </span>
        </StatusPill>
      ) : null}
      {metadataSaving ? (
        <StatusPill tone="info" aria-live="polite">
          <span className="inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Syncing metadata…
          </span>
        </StatusPill>
      ) : null}
      {publishing ? (
        <StatusPill tone="info" aria-live="polite">
          <span className="inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Publishing…
          </span>
        </StatusPill>
      ) : null}
      {creating ? (
        <StatusPill tone="info" aria-live="polite">
          <span className="inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Creating policy…
          </span>
        </StatusPill>
      ) : null}
      {deleting ? (
        <StatusPill tone="danger" aria-live="polite">
          <span className="inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Deleting…
          </span>
        </StatusPill>
      ) : null}
      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      {success ? <StatusPill tone="success">{success}</StatusPill> : null}
    </div>
  );

  const metadataActionsDisabled = metadataSaving || savingDraft || publishing || creating || deleting;
  const draftActionsDisabled = savingDraft || publishing || metadataSaving || creating || deleting;
  const deleteDisabled = deleting || Boolean(detail?.currentVersion);
  const publishDisabled =
    publishing || savingDraft || metadataSaving || creating || deleting || !detail?.draftVersion;

  const previewHref = selectedDocumentSummary?.previewPath || (detail?.slug ? `/legal/${detail.slug}` : null);

  const actions = [
    {
      label: 'Admin dashboard',
      to: '/admin/dashboard',
      variant: 'ghost'
    },
    {
      label: 'View public policy',
      to: selectedDocumentSummary?.previewPath || '/legal/terms',
      variant: 'secondary'
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-24">
        <PageHeader
          eyebrow="Admin legal controls"
          title={selectedDocumentSummary?.title || 'Legal management'}
        description="Draft, review, and publish legal documentation for every Fixnado experience."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Legal management' },
          selectedDocumentSummary ? { label: selectedDocumentSummary.title } : null
        ].filter(Boolean)}
        actions={actions}
        meta={meta}
      />

      <div className="mx-auto max-w-7xl px-6 pt-10 pb-24">
        <LegalDocumentToolbar
          selectedSlug={selectedSlug}
          documentOptions={documentOptions}
          onDocumentChange={handleDocumentChange}
          onCreate={handleOpenCreateModal}
          onRefresh={loadSummary}
          disableCreate={creating || summaryLoading || detailLoading}
          disableRefresh={
            summaryLoading ||
            detailLoading ||
            savingDraft ||
            metadataSaving ||
            publishing ||
            creating ||
            deleting
          }
          statusPills={statusPills}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            {detailLoading ? (
              <Card padding="lg" className="flex items-center justify-center">
                <Spinner label="Loading legal document" />
              </Card>
            ) : null}
            {form ? (
              <>
                <LegalDocumentMetadataCard
                  form={form}
                  onFieldChange={handleFieldChange}
                  onSave={handleSaveMetadata}
                  onDelete={handleDeleteDocument}
                  disableSave={metadataActionsDisabled}
                  disableDelete={deleteDisabled}
                  disableFields={metadataActionsDisabled}
                  showDeleteWarning={Boolean(detail?.currentVersion)}
                />
                <LegalHeroCard form={form} onFieldChange={handleFieldChange} disabled={draftActionsDisabled} />
                <LegalSectionsCard
                  sections={form.sections}
                  onAddSection={handleAddSection}
                  onRemoveSection={handleRemoveSection}
                  onMoveSection={handleMoveSection}
                  onDuplicateSection={handleDuplicateSection}
                  onSectionChange={handleSectionChange}
                  disabled={draftActionsDisabled}
                />
                <LegalAttachmentsCard
                  attachments={form.attachments}
                  onAddAttachment={handleAddAttachment}
                  onRemoveAttachment={handleRemoveAttachment}
                  onMoveAttachment={handleMoveAttachment}
                  onDuplicateAttachment={handleDuplicateAttachment}
                  onAttachmentChange={handleAttachmentChange}
                  disabled={draftActionsDisabled}
                />
                <LegalPublishingCard
                  form={form}
                  onFieldChange={handleFieldChange}
                  onSaveDraft={handleSaveDraft}
                  onPublish={handlePublish}
                  onReset={resetForm}
                  onDiscard={handleDiscardDraft}
                  disableActions={draftActionsDisabled}
                  disablePublish={publishDisabled}
                  showDiscard={Boolean(detail?.draftVersion)}
                  previewHref={previewHref}
                />
              </>
            ) : null}
          </div>

          <LegalSidebar
            detail={detail}
            timeline={timeline}
            versionHistory={versionHistory}
            documents={summary.documents}
            selectedSlug={selectedSlug}
            formatDateTime={formatDateTime}
          />
        </div>
      </div>
      <LegalCreateModal
        open={createModalOpen}
        form={createForm}
        onFieldChange={handleCreateFieldChange}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateDocument}
        creating={creating}
        slugPreview={slugPreview}
      />
    </div>
  </>
);
}
