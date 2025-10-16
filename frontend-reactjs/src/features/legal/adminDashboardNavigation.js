function formatPublishedVersion(doc, formatDateLabel, formatRelativeMoment) {
  return [
    {
      id: `${doc.slug}-published-version`,
      label: 'Published version',
      helper: doc.publishedVersion
        ? `Effective ${formatDateLabel(doc.publishedVersion.effectiveAt)}`
        : 'No published version yet',
      value: doc.publishedVersion ? `v${doc.publishedVersion.version}` : 'Not published'
    },
    {
      id: `${doc.slug}-draft-version`,
      label: 'Draft in progress',
      helper: doc.draftVersion
        ? `Last updated ${formatRelativeMoment(doc.draftVersion.updatedAt)}`
        : 'No draft in progress',
      value: doc.draftVersion ? `v${doc.draftVersion.version}` : '—'
    },
    {
      id: `${doc.slug}-next-effective`,
      label: 'Next scheduled effective date',
      helper: 'Upcoming policy activation window',
      value: doc.health?.nextEffective ? formatDateLabel(doc.health.nextEffective) : 'Not scheduled'
    },
    {
      id: `${doc.slug}-editor`,
      label: 'Legal editor',
      helper: 'Manage content, sections, and metadata',
      type: 'action',
      href: `/admin/legal/${doc.slug}`,
      cta: 'Open editor'
    },
    {
      id: `${doc.slug}-preview`,
      label: 'Public preview',
      helper: 'Review published version in a new tab',
      type: 'action',
      href: doc.previewPath,
      cta: 'View live policy'
    }
  ];
}

export function buildLegalAdminNavigation(legalSummary, { formatDateLabel, formatRelativeMoment }) {
  const documents = legalSummary?.documents ?? [];
  if (!documents.length) {
    return { section: null, sidebarLinks: [] };
  }

  const panels = documents.map((doc) => ({
    id: doc.slug,
    title: doc.title,
    description: doc.summary,
    status: doc.statusLabel,
    items: formatPublishedVersion(doc, formatDateLabel, formatRelativeMoment)
  }));

  if (legalSummary?.timeline?.length) {
    panels.push({
      id: 'legal-timeline',
      title: 'Recent activity',
      description: 'Audit trail of updates across legal documents.',
      items: legalSummary.timeline.slice(0, 6).map((entry) => ({
        id: entry.id,
        label: `${entry.title ?? 'Document'} • v${entry.version ?? '—'}`,
        helper: `Status: ${entry.status} • ${formatDateLabel(entry.updatedAt)}`,
        value: entry.actor ? `By ${entry.actor}` : 'Automated'
      }))
    });
  }

  const section = {
    id: 'legal-management',
    label: 'Legal management',
    description: 'Control platform terms and privacy policies with auditable drafts and publication scheduling.',
    type: 'settings',
    icon: 'documents',
    data: { panels }
  };

  const sidebarLinks = documents.map((doc) => ({
    id: doc.slug,
    label: doc.title,
    description: doc.statusLabel,
    href: `/admin/legal/${doc.slug}`
  }));

  return { section, sidebarLinks };
}

export default { buildLegalAdminNavigation };
