import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Spinner, StatusPill } from '../../components/ui/index.js';
import {
  deleteAdminBlogTag,
  listAdminBlogTags,
  upsertAdminBlogTag
} from '../../api/adminBlogClient.js';
import { fetchPlatformSettings, persistPlatformSettings } from '../../api/platformSettingsClient.js';
import { SEO_ALLOWED_ROLES } from './constants.js';
import {
  applyTagTemplate,
  buildSeoFormState,
  buildTagForm,
  ensureRoleAccess,
  formatRelativeTime,
  slugify,
  uniqueList
} from './utils.js';
import SeoSettingsForm from './components/SeoSettingsForm.jsx';
import TagMetadataPanel from './components/TagMetadataPanel.jsx';
import TagEditorDialog from './components/TagEditorDialog.jsx';
const TAG_PAGE_SIZE = 12;
const DEFAULT_TAG_FILTERS = Object.freeze({
  search: '',
  indexing: 'all',
  role: 'all',
  sort: 'updatedAt',
  direction: 'desc',
  page: 1,
  pageSize: TAG_PAGE_SIZE
});

function AdminSeoPage() {
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [seoForm, setSeoForm] = useState(null);
  const [tags, setTags] = useState([]);
  const [error, setError] = useState(null);
  const [seoError, setSeoError] = useState(null);
  const [seoSuccess, setSeoSuccess] = useState(null);
  const [tagError, setTagError] = useState(null);
  const [tagSuccess, setTagSuccess] = useState(null);
  const [seoSaving, setSeoSaving] = useState(false);
  const [tagSaving, setTagSaving] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagForm, setTagForm] = useState(null);
  const [tagFilters, setTagFilters] = useState(DEFAULT_TAG_FILTERS);
  const [tagPagination, setTagPagination] = useState({
    page: DEFAULT_TAG_FILTERS.page,
    pageSize: DEFAULT_TAG_FILTERS.pageSize,
    total: 0,
    hasMore: false
  });
  const [tagStats, setTagStats] = useState(null);
  const [tagExporting, setTagExporting] = useState(false);

  const fetchTags = useCallback(async (filters) => {
    const applied = filters ?? DEFAULT_TAG_FILTERS;
    setTagsLoading(true);
    setTagError(null);
    try {
      const payload = await listAdminBlogTags({
        page: applied.page,
        pageSize: applied.pageSize,
        search: applied.search?.trim() || undefined,
        role: applied.role !== 'all' ? applied.role : undefined,
        indexing: applied.indexing !== 'all' ? applied.indexing : undefined,
        sort: applied.sort,
        direction: applied.direction
      });
      setTags(payload?.data ?? []);
      setTagPagination(
        payload?.pagination ?? {
          page: applied.page,
          pageSize: applied.pageSize,
          total: payload?.data?.length ?? 0,
          hasMore: false
        }
      );
      setTagStats(payload?.stats ?? null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load tags';
      setTagError(message);
      setTags([]);
      setTagPagination({
        page: applied.page,
        pageSize: applied.pageSize,
        total: 0,
        hasMore: false
      });
      setTagStats(null);
    } finally {
      setTagsLoading(false);
    }
  }, []);

  const updateTagFilters = useCallback(
    (updater) => {
      setTagSuccess(null);
      setTagFilters((current) => {
        const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
        fetchTags(next);
        return next;
      });
    },
    [fetchTags]
  );

  const handleTagFilterChange = useCallback(
    (updates) => {
      updateTagFilters((current) => {
        const next = { ...current, ...updates };
        if (!Object.hasOwn(updates, 'page')) {
          next.page = 1;
        }
        return next;
      });
    },
    [updateTagFilters]
  );

  const handleTagPageChange = useCallback(
    (nextPage) => {
      updateTagFilters((current) => ({
        ...current,
        page: Math.max(nextPage, 1)
      }));
    },
    [updateTagFilters]
  );

  const resetTagFilters = useCallback(() => {
    updateTagFilters(() => ({ ...DEFAULT_TAG_FILTERS }));
  }, [updateTagFilters]);

  const handleTagRefresh = useCallback(() => {
    fetchTags(tagFilters);
  }, [fetchTags, tagFilters]);

  const handleTagExport = useCallback(async () => {
    setTagExporting(true);
    setTagError(null);
    setTagSuccess(null);
    try {
      const pageSize = Math.max(tagFilters.pageSize ?? TAG_PAGE_SIZE, 100);
      const collected = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const payload = await listAdminBlogTags({
          page: currentPage,
          pageSize,
          search: tagFilters.search?.trim() || undefined,
          role: tagFilters.role !== 'all' ? tagFilters.role : undefined,
          indexing: tagFilters.indexing !== 'all' ? tagFilters.indexing : undefined,
          sort: tagFilters.sort,
          direction: tagFilters.direction
        });
        collected.push(...(payload?.data ?? []));

        const pagination = payload?.pagination ?? {};
        if (pagination.hasMore) {
          currentPage = (pagination.page ?? currentPage) + 1;
          if (currentPage > 50) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      const unique = [];
      const seen = new Set();
      for (const record of collected) {
        const key = record?.id ?? record?.slug;
        if (key && seen.has(key)) {
          continue;
        }
        if (key) {
          seen.add(key);
        }
        unique.push(record);
      }

      const blob = new Blob([JSON.stringify(unique, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `fixnado-tags-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setTagSuccess('Tags exported successfully.');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to export tags';
      setTagError(message);
    } finally {
      setTagExporting(false);
    }
  }, [tagFilters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await fetchPlatformSettings();
      setSeoForm(buildSeoFormState(settings.seo));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load SEO settings';
      setError(message);
      setSeoForm(buildSeoFormState({}));
    }
    setTagFilters(() => ({ ...DEFAULT_TAG_FILTERS }));
    setTags([]);
    setTagPagination({
      page: DEFAULT_TAG_FILTERS.page,
      pageSize: DEFAULT_TAG_FILTERS.pageSize,
      total: 0,
      hasMore: false
    });
    setTagStats(null);
    await fetchTags({ ...DEFAULT_TAG_FILTERS });
    setLoading(false);
  }, [fetchTags]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeoChange = useCallback((path, value) => {
    setSeoForm((current) => {
      if (!current) return current;
      switch (path) {
        case 'siteName':
        case 'defaultTitle':
        case 'titleTemplate':
        case 'defaultDescription':
        case 'defaultKeywordsText':
        case 'canonicalHost':
          return { ...current, [path]: value };
        case 'robots.index':
          return { ...current, robots: { ...current.robots, index: Boolean(value) } };
        case 'robots.follow':
          return { ...current, robots: { ...current.robots, follow: Boolean(value) } };
        case 'robots.advancedDirectives':
          return { ...current, robots: { ...current.robots, advancedDirectives: value } };
        case 'sitemap.autoGenerate':
          return { ...current, sitemap: { ...current.sitemap, autoGenerate: Boolean(value) } };
        case 'sitemap.pingSearchEngines':
          return { ...current, sitemap: { ...current.sitemap, pingSearchEngines: Boolean(value) } };
        case 'social.twitterHandle':
          return { ...current, social: { ...current.social, twitterHandle: value } };
        case 'social.facebookAppId':
          return { ...current, social: { ...current.social, facebookAppId: value } };
        case 'social.defaultImageUrl':
          return { ...current, social: { ...current.social, defaultImageUrl: value } };
        case 'social.defaultImageAlt':
          return { ...current, social: { ...current.social, defaultImageAlt: value } };
        case 'structuredData.organisationJsonLd':
          return { ...current, structuredData: { ...current.structuredData, organisationJsonLd: value } };
        case 'structuredData.enableAutoBreadcrumbs':
          return {
            ...current,
            structuredData: { ...current.structuredData, enableAutoBreadcrumbs: Boolean(value) }
          };
        case 'tagDefaults.metaTitleTemplate':
          return { ...current, tagDefaults: { ...current.tagDefaults, metaTitleTemplate: value } };
        case 'tagDefaults.metaDescriptionTemplate':
          return { ...current, tagDefaults: { ...current.tagDefaults, metaDescriptionTemplate: value } };
        case 'tagDefaults.defaultRoleAccess': {
          const nextAccess = ensureRoleAccess(value);
          const ownerRole = current.tagDefaults?.ownerRole ?? 'admin';
          if (!nextAccess.includes(ownerRole)) {
            nextAccess.push(ownerRole);
          }
          return { ...current, tagDefaults: { ...current.tagDefaults, defaultRoleAccess: nextAccess } };
        }
        case 'tagDefaults.ownerRole': {
          const ownerRoleCandidate = typeof value === 'string' ? value.toLowerCase() : '';
          const ownerRole = SEO_ALLOWED_ROLES.has(ownerRoleCandidate) ? ownerRoleCandidate : 'admin';
          const currentAccess = ensureRoleAccess(current.tagDefaults?.defaultRoleAccess ?? ['admin']);
          if (!currentAccess.includes(ownerRole)) {
            currentAccess.push(ownerRole);
          }
          return {
            ...current,
            tagDefaults: { ...current.tagDefaults, ownerRole, defaultRoleAccess: currentAccess }
          };
        }
        case 'tagDefaults.defaultOgImageAlt':
          return { ...current, tagDefaults: { ...current.tagDefaults, defaultOgImageAlt: value } };
        case 'tagDefaults.autoPopulateOg':
          return { ...current, tagDefaults: { ...current.tagDefaults, autoPopulateOg: Boolean(value) } };
        case 'governance.lockSlugEdits':
          return { ...current, governance: { ...current.governance, lockSlugEdits: Boolean(value) } };
        case 'governance.requireOwnerForPublish':
          return {
            ...current,
            governance: { ...current.governance, requireOwnerForPublish: Boolean(value) }
          };
        default:
          return current;
      }
    });
  }, []);

  const handleSeoSubmit = async (event) => {
    event.preventDefault();
    if (!seoForm) return;
    setSeoSaving(true);
    setSeoError(null);
    setSeoSuccess(null);
    try {
      const payload = {
        siteName: seoForm.siteName,
        defaultTitle: seoForm.defaultTitle,
        titleTemplate: seoForm.titleTemplate,
        defaultDescription: seoForm.defaultDescription,
        defaultKeywords: uniqueList(seoForm.defaultKeywordsText),
        canonicalHost: seoForm.canonicalHost,
        robots: {
          index: seoForm.robots.index,
          follow: seoForm.robots.follow,
          advancedDirectives: seoForm.robots.advancedDirectives
        },
        sitemap: {
          autoGenerate: seoForm.sitemap.autoGenerate,
          pingSearchEngines: seoForm.sitemap.pingSearchEngines,
          lastGeneratedAt: seoForm.sitemap.lastGeneratedAt
        },
        social: { ...seoForm.social },
        structuredData: { ...seoForm.structuredData },
        tagDefaults: {
          ...seoForm.tagDefaults,
          defaultRoleAccess: (() => {
            const roles = ensureRoleAccess(seoForm.tagDefaults.defaultRoleAccess);
            const ownerRole = seoForm.tagDefaults.ownerRole;
            if (ownerRole && !roles.includes(ownerRole)) {
              roles.push(ownerRole);
            }
            return Array.from(new Set(roles));
          })()
        },
        governance: { ...seoForm.governance }
      };
      const response = await persistPlatformSettings({ seo: payload });
      setSeoForm(buildSeoFormState(response.seo));
      setSeoSuccess('SEO settings updated successfully.');
    } catch (caught) {
      if (caught instanceof Error) {
        const detailMessage = Array.isArray(caught.details)
          ? caught.details
              .map((detail) => `${detail.field ?? 'field'} ${detail.message ?? 'invalid'}`)
              .join('; ')
          : null;
        setSeoError(detailMessage ? `${caught.message}. ${detailMessage}` : caught.message);
      } else {
        setSeoError('Unable to save SEO settings.');
      }
    } finally {
      setSeoSaving(false);
    }
  };

  const handleSitemapRefresh = async () => {
    if (!seoForm) return;
    setSeoSaving(true);
    setSeoError(null);
    setSeoSuccess(null);
    try {
      const timestamp = new Date().toISOString();
      const response = await persistPlatformSettings({
        seo: { sitemap: { lastGeneratedAt: timestamp } }
      });
      setSeoForm(buildSeoFormState(response.seo));
      setSeoSuccess('Sitemap timestamp refreshed. Schedule generation to apply.');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to refresh sitemap timestamp';
      setSeoError(message);
    } finally {
      setSeoSaving(false);
    }
  };

  const openCreateTag = () => {
    if (!seoForm) return;
    setTagError(null);
    setTagSuccess(null);
    setTagForm(buildTagForm(null, seoForm));
    setTagModalOpen(true);
  };

  const openEditTag = (tag) => {
    if (!seoForm) return;
    setTagError(null);
    setTagSuccess(null);
    setTagForm(buildTagForm(tag, seoForm));
    setTagModalOpen(true);
  };

  const handleTagDuplicate = (tag) => {
    if (!seoForm) return;
    setTagError(null);
    setTagSuccess(null);
    const duplicate = {
      ...tag,
      id: null,
      name: tag?.name ? `${tag.name} copy` : 'Tag copy',
      slug: '',
      structuredData: tag?.structuredData
    };
    const form = buildTagForm(duplicate, seoForm);
    setTagForm({ ...form, slugTouched: false });
    setTagModalOpen(true);
  };

  const handleTagFieldChange = (field, value, options = {}) => {
    setTagForm((current) => {
      if (!current) return current;
      if (field === 'name') {
        const next = { ...current, name: value };
        if (!current.slugTouched) {
          next.slug = slugify(value);
        }
        return next;
      }
      if (field === 'slug') {
        if (seoForm?.governance?.lockSlugEdits && current.id) {
          return current;
        }
        return {
          ...current,
          slug: slugify(value),
          slugTouched: options.manual ? true : current.slugTouched
        };
      }
      if (field === 'roleAccess') {
        const role = value;
        if (!SEO_ALLOWED_ROLES.has(role)) {
          return current;
        }
        const currentRoles = new Set(current.roleAccess ?? []);
        if (options.checked) {
          currentRoles.add(role);
        } else {
          currentRoles.delete(role);
        }
        currentRoles.add('admin');
        if (current.ownerRole) {
          currentRoles.add(current.ownerRole);
        }
        return { ...current, roleAccess: Array.from(currentRoles) };
      }
      if (field === 'ownerRole') {
        if (!SEO_ALLOWED_ROLES.has(value)) {
          return current;
        }
        const nextRoles = new Set(current.roleAccess ?? []);
        nextRoles.add('admin');
        nextRoles.add(value);
        return { ...current, ownerRole: value, roleAccess: Array.from(nextRoles) };
      }
      return { ...current, [field]: value };
    });
  };

  const handleApplyTagDefaults = () => {
    setTagForm((current) => {
      if (!current || !seoForm) return current;
      const tagName = current.name || 'Tag';
      const siteName = seoForm.siteName ?? 'Fixnado';
      const ownerRole = seoForm.tagDefaults?.ownerRole ?? current.ownerRole ?? 'admin';
      const defaultRoles = ensureRoleAccess(seoForm.tagDefaults?.defaultRoleAccess);
      if (!defaultRoles.includes(ownerRole)) {
        defaultRoles.push(ownerRole);
      }
      return {
        ...current,
        metaTitle:
          current.metaTitle || applyTagTemplate(seoForm.tagDefaults?.metaTitleTemplate, { tagName, siteName }),
        metaDescription:
          current.metaDescription || applyTagTemplate(seoForm.tagDefaults?.metaDescriptionTemplate, { tagName, siteName }),
        ogImageAlt:
          current.ogImageAlt || seoForm.tagDefaults?.defaultOgImageAlt || seoForm.social?.defaultImageAlt || '',
        ogImageUrl:
          current.ogImageUrl || (seoForm.tagDefaults?.autoPopulateOg !== false ? seoForm.social?.defaultImageUrl || '' : ''),
        roleAccess: defaultRoles,
        ownerRole
      };
    });
  };

  const handleTagSave = async () => {
    if (!tagForm) return;
    if (!tagForm.name?.trim() || !tagForm.slug?.trim()) {
      setTagError('Tag name and slug are required.');
      return;
    }
    const structuredPayload = tagForm.structuredDataInput?.trim();
    let parsedStructured = null;
    if (structuredPayload) {
      try {
        parsedStructured = JSON.parse(structuredPayload);
      } catch {
        setTagError('Structured data must be valid JSON.');
        return;
      }
    }
    setTagSaving(true);
    setTagError(null);
    setTagSuccess(null);
    try {
      const cleanedRoles = ensureRoleAccess(tagForm.roleAccess);
      if (tagForm.ownerRole && !cleanedRoles.includes(tagForm.ownerRole)) {
        cleanedRoles.push(tagForm.ownerRole);
      }
      const roleAccess = Array.from(new Set(cleanedRoles));
      await upsertAdminBlogTag({
        id: tagForm.id ?? undefined,
        name: tagForm.name.trim(),
        slug: tagForm.slug.trim(),
        description: tagForm.description?.trim() || undefined,
        metaTitle: tagForm.metaTitle?.trim() || undefined,
        metaDescription: tagForm.metaDescription?.trim() || undefined,
        metaKeywords: uniqueList(tagForm.metaKeywordsText),
        canonicalUrl: tagForm.canonicalUrl?.trim() || undefined,
        ogImageUrl: tagForm.ogImageUrl?.trim() || undefined,
        ogImageAlt: tagForm.ogImageAlt?.trim() || undefined,
        noindex: Boolean(tagForm.noindex),
        structuredData:
          parsedStructured ?? (structuredPayload ? {} : undefined),
        synonyms: uniqueList(tagForm.synonymsText),
        roleAccess,
        ownerRole: tagForm.ownerRole
      });
      setTagModalOpen(false);
      setTagForm(null);
      updateTagFilters((current) => ({ ...current, page: 1 }));
      setTagSuccess(tagForm.id ? 'Tag updated.' : 'Tag created.');
    } catch (caught) {
      if (caught instanceof Error) {
        const detailMessage = Array.isArray(caught.details)
          ? caught.details
              .map((detail) => `${detail.field ?? 'field'} ${detail.message ?? 'invalid'}`)
              .join('; ')
          : null;
        setTagError(detailMessage ? `${caught.message}. ${detailMessage}` : caught.message);
      } else {
        setTagError('Unable to save tag.');
      }
    } finally {
      setTagSaving(false);
    }
  };

  const handleTagDelete = async () => {
    if (!tagForm?.id) return;
    if (!window.confirm('Delete this tag metadata? This cannot be undone.')) {
      return;
    }
    setTagSaving(true);
    setTagError(null);
    setTagSuccess(null);
    try {
      await deleteAdminBlogTag(tagForm.id);
      setTagModalOpen(false);
      setTagForm(null);
      updateTagFilters((current) => ({ ...current, page: 1 }));
      setTagSuccess('Tag deleted.');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to delete tag';
      setTagError(message);
    } finally {
      setTagSaving(false);
    }
  };

  const closeTagModal = () => {
    setTagModalOpen(false);
    setTagForm(null);
  };

  const defaultKeywordsCount = useMemo(
    () => uniqueList(seoForm?.defaultKeywordsText ?? '').length,
    [seoForm?.defaultKeywordsText]
  );

  const headerMeta = useMemo(() => {
    const canonicalHost = seoForm?.canonicalHost ?? '';
    return [
      {
        label: 'Canonical host',
        value: canonicalHost || 'Not configured',
        caption: 'Used for sitemap generation and canonical URLs'
      },
      {
        label: 'Indexing state',
        value: seoForm?.robots?.index ? 'Indexing enabled' : 'Indexing disabled',
        caption: seoForm?.robots?.advancedDirectives ? seoForm.robots.advancedDirectives : 'Robots.txt directives'
      },
      {
        label: 'Tag records',
        value: (tagPagination?.total ?? tags.length).toString(),
        caption: 'Managed tag metadata entries'
      }
    ];
  }, [
    seoForm?.canonicalHost,
    seoForm?.robots?.index,
    seoForm?.robots?.advancedDirectives,
    tagPagination?.total,
    tags.length
  ]);

  if (loading || !seoForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" role="status">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="sr-only">Loading Tags &amp; SEO settings</span>
      </div>
    );
  }

  const sitemapLastGenerated = formatRelativeTime(seoForm.sitemap.lastGeneratedAt);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Admin Control Centre"
        title="Tags & SEO management"
        description="Configure search metadata, indexing controls, and structured data for Fixnado content surfaces."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Tags & SEO' }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
        {error ? <StatusPill tone="danger">{error}</StatusPill> : null}

        <SeoSettingsForm
          seoForm={seoForm}
          onChange={handleSeoChange}
          onSubmit={handleSeoSubmit}
          onSitemapRefresh={handleSitemapRefresh}
          saving={seoSaving}
          error={seoError}
          success={seoSuccess}
          defaultKeywordsCount={defaultKeywordsCount}
          sitemapLastGenerated={sitemapLastGenerated}
        />

        <TagMetadataPanel
          tags={tags}
          loading={tagsLoading}
          pagination={tagPagination}
          stats={tagStats}
          filters={tagFilters}
          onFiltersChange={handleTagFilterChange}
          onClearFilters={resetTagFilters}
          onRefresh={handleTagRefresh}
          onCreate={openCreateTag}
          onEdit={openEditTag}
          onDuplicate={handleTagDuplicate}
          onPageChange={handleTagPageChange}
          onExport={handleTagExport}
          exporting={tagExporting}
          error={tagError}
          success={tagSuccess}
        />
      </div>

      <TagEditorDialog
        open={tagModalOpen}
        tagForm={tagForm}
        onClose={closeTagModal}
        onChange={handleTagFieldChange}
        onSave={handleTagSave}
        onDelete={handleTagDelete}
        onApplyDefaults={handleApplyTagDefaults}
        saving={tagSaving}
        error={tagError}
        seoForm={seoForm}
      />
    </div>
  );
}

export default AdminSeoPage;
