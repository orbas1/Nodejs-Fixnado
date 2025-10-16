import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx';
import { DASHBOARD_ROLES } from '../../constants/dashboardConfig.js';
import {
  listAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  publishAdminBlogPost,
  archiveAdminBlogPost,
  deleteAdminBlogPost,
  duplicateAdminBlogPost,
  listAdminBlogCategories,
  upsertAdminBlogCategory,
  deleteAdminBlogCategory,
  listAdminBlogTags,
  upsertAdminBlogTag,
  deleteAdminBlogTag,
  listAdminBlogPostRevisions,
  restoreAdminBlogPostRevision
} from '../../api/adminBlogClient.js';
import { useAdminSession } from '../../providers/AdminSessionProvider.jsx';
import BlogPostsSection from './components/BlogPostsSection.jsx';
import BlogComposerSection from './components/BlogComposerSection.jsx';
import BlogTaxonomySection from './components/BlogTaxonomySection.jsx';
import BlogRevisionsSection from './components/BlogRevisionsSection.jsx';

const statusFilters = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

const pageSizeOptions = [10, 20, 50, 100];

const filterDefaults = {
  status: 'all',
  search: '',
  pageSize: 20,
  category: 'all',
  tag: 'all'
};

const createEmptyDraft = () => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  heroImageUrl: '',
  heroImageAlt: '',
  readingTimeMinutes: 6,
  status: 'draft',
  categories: [],
  tags: [],
  media: [],
  publishedAt: '',
  scheduledAt: '',
  metadata: {
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    ogImageUrl: '',
    previewSubtitle: '',
    heroCaption: '',
    newsletterHeadline: '',
    callToActionLabel: '',
    callToActionUrl: '',
    featured: false,
    allowComments: true,
    sendToSubscribers: false,
    pinned: false
  }
});

const createEmptyCategoryForm = () => ({ name: '', slug: '', description: '', displayOrder: 0 });
const createEmptyTagForm = () => ({ name: '', slug: '' });

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input) => `${input}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

const AdminBlogDashboard = () => {
  const { isAuthenticated, session, logout } = useAdminSession();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [draft, setDraft] = useState(createEmptyDraft);
  const [editingPostId, setEditingPostId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [busy, setBusy] = useState(false);
  const [taxonomyBusy, setTaxonomyBusy] = useState(false);
  const [filters, setFilters] = useState(() => ({ ...filterDefaults }));
  const [filterDraft, setFilterDraft] = useState(() => ({ ...filterDefaults }));
  const [categoryForm, setCategoryForm] = useState(createEmptyCategoryForm);
  const [tagForm, setTagForm] = useState(createEmptyTagForm);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [tagEditor, setTagEditor] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [revisionError, setRevisionError] = useState(null);
  const [restoringRevisionId, setRestoringRevisionId] = useState(null);
  const abortRef = useRef(null);

  const facets = useMemo(
    () => ({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        displayOrder: category.displayOrder ?? 0
      })),
      tags: tags.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug }))
    }),
    [categories, tags]
  );

  const categoryFilters = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...categories.map((category) => ({ value: category.id, label: category.name }))
    ],
    [categories]
  );

  const tagFilters = useMemo(
    () => [
      { value: 'all', label: 'All tags' },
      ...tags.map((tag) => ({ value: tag.id, label: `#${tag.slug}` }))
    ],
    [tags]
  );

  const totalPages = useMemo(() => {
    const calculated = Math.ceil((pagination.total || 0) / (pagination.pageSize || 1));
    return calculated > 0 ? calculated : 1;
  }, [pagination]);

  const loadRevisions = useCallback(async (postId) => {
    if (!postId) {
      setRevisions([]);
      return;
    }
    setRevisionsLoading(true);
    setRevisionError(null);
    try {
      const payload = await listAdminBlogPostRevisions(postId);
      setRevisions(payload?.data ?? []);
    } catch (caught) {
      console.error('Failed to load blog revisions', caught);
      setRevisionError(caught instanceof Error ? caught.message : 'Unable to load revisions');
      setRevisions([]);
    } finally {
      setRevisionsLoading(false);
    }
  }, []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [categoryPayload, tagPayload] = await Promise.all([listAdminBlogCategories(), listAdminBlogTags()]);
      setCategories(categoryPayload?.data ?? []);
      setTags(tagPayload?.data ?? []);
    } catch (caught) {
      console.warn('Failed to load blog taxonomy', caught);
      setError((current) => current ?? 'Unable to load blog taxonomy');
    }
  }, []);

  const loadPosts = useCallback(
    async ({ page = 1, status, search, pageSize, category, tag } = {}) => {
      setLoading(true);
      setError(null);
      const applied = {
        status: status ?? filters.status,
        search: search ?? filters.search,
        pageSize: Number(pageSize ?? filters.pageSize) || 20,
        category: category ?? filters.category,
        tag: tag ?? filters.tag
      };
      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const payload = await listAdminBlogPosts(
          {
            page,
            pageSize: applied.pageSize,
            status: applied.status === 'all' ? undefined : applied.status,
            search: applied.search || undefined,
            category: applied.category === 'all' ? undefined : applied.category,
            tag: applied.tag === 'all' ? undefined : applied.tag
          },
          { signal: controller.signal }
        );
        setPosts(payload?.data ?? []);
        setPagination(payload?.pagination ?? { page, total: 0, pageSize: applied.pageSize });
        setFilters(applied);
        setLastSyncedAt(new Date().toISOString());
      } catch (caught) {
        if (caught?.name === 'AbortError') {
          return;
        }
        console.error('Failed to load admin blog posts', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load blog posts');
        setPosts([]);
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [filters]
  );

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let mounted = true;
    (async () => {
      await loadReferenceData();
      if (!mounted) return;
      await loadPosts({ page: 1 });
    })();
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [isAuthenticated, loadReferenceData, loadPosts]);

  useEffect(() => {
    setFilterDraft({ ...filters });
  }, [filters]);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyDraft());
    setEditingPostId(null);
    setRevisions([]);
    setRevisionError(null);
    setRevisionsLoading(false);
  }, []);

  const handleEdit = useCallback(
    (post) => {
      setEditingPostId(post.id);
      setDraft({
        title: post.title ?? '',
        slug: post.slug ?? '',
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        heroImageUrl: post.heroImageUrl ?? '',
        heroImageAlt: post.heroImageAlt ?? '',
        readingTimeMinutes: post.readingTimeMinutes ?? 6,
        status: post.status ?? 'draft',
        categories: post.categories?.map((category) => category.id) ?? [],
        tags: post.tags?.map((tag) => tag.id) ?? [],
        media:
          post.media?.map((asset) => ({
            url: asset.url ?? '',
            type: asset.type ?? 'image',
            altText: asset.altText ?? '',
            title: asset.metadata?.title ?? '',
            caption: asset.metadata?.caption ?? '',
            credit: asset.metadata?.credit ?? '',
            focalPoint: asset.metadata?.focalPoint ?? ''
          })) ?? [],
        publishedAt: toDateTimeLocal(post.publishedAt),
        scheduledAt: toDateTimeLocal(post.scheduledAt),
        metadata: {
          metaTitle: post.metadata?.metaTitle ?? '',
          metaDescription: post.metadata?.metaDescription ?? '',
          canonicalUrl: post.metadata?.canonicalUrl ?? '',
          ogImageUrl: post.metadata?.ogImageUrl ?? '',
          previewSubtitle: post.metadata?.previewSubtitle ?? '',
          heroCaption: post.metadata?.heroCaption ?? '',
          newsletterHeadline: post.metadata?.newsletterHeadline ?? '',
          callToActionLabel: post.metadata?.callToActionLabel ?? '',
          callToActionUrl: post.metadata?.callToActionUrl ?? '',
          featured: Boolean(post.metadata?.featured),
          allowComments: post.metadata?.allowComments !== false,
          sendToSubscribers: Boolean(post.metadata?.sendToSubscribers),
          pinned: Boolean(post.metadata?.pinned)
        }
      });
      loadRevisions(post.id);
    },
    [loadRevisions]
  );

  const handleDraftChange = useCallback((field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleMetadataChange = useCallback((field, value) => {
    setDraft((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        [field]: value
      }
    }));
  }, []);

  const handleMediaChange = useCallback((index, field, value) => {
    setDraft((current) => {
      const next = [...current.media];
      next[index] = { ...next[index], [field]: value };
      return { ...current, media: next };
    });
  }, []);

  const addMediaAsset = useCallback(() => {
    setDraft((current) => ({
      ...current,
      media: [
        ...current.media,
        { url: '', type: 'image', altText: '', title: '', caption: '', credit: '', focalPoint: '' }
      ]
    }));
  }, []);

  const removeMediaAsset = useCallback((index) => {
    setDraft((current) => ({
      ...current,
      media: current.media.filter((_, mediaIndex) => mediaIndex !== index)
    }));
  }, []);

  const submitDraft = useCallback(
    async (statusOverride = null) => {
      if (!draft.title.trim()) {
        setError('A title is required');
        return;
      }
      if (!draft.content.trim()) {
        setError('Article body cannot be empty');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const status = statusOverride ?? draft.status;
        const basePublishedAt = draft.publishedAt ? new Date(draft.publishedAt).toISOString() : null;
        const publishedAt = status === 'published' ? basePublishedAt ?? new Date().toISOString() : undefined;
        const scheduledAt =
          status === 'scheduled' && draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : undefined;

        const payload = {
          title: draft.title.trim(),
          slug: draft.slug.trim() || undefined,
          excerpt: draft.excerpt,
          content: draft.content,
          heroImageUrl: draft.heroImageUrl,
          heroImageAlt: draft.heroImageAlt,
          readingTimeMinutes: draft.readingTimeMinutes,
          status,
          publishedAt,
          scheduledAt,
          categories: draft.categories
            .map((id) => categories.find((category) => category.id === id))
            .filter(Boolean)
            .map((category) => ({ id: category.id })),
          tags: draft.tags
            .map((id) => tags.find((tag) => tag.id === id))
            .filter(Boolean)
            .map((tag) => ({ id: tag.id })),
          media: draft.media.map((asset) => ({
            url: asset.url,
            type: asset.type ?? 'image',
            altText: asset.altText ?? '',
            title: asset.title ?? '',
            caption: asset.caption ?? '',
            credit: asset.credit ?? '',
            focalPoint: asset.focalPoint ?? ''
          })),
          metadata: {
            metaTitle: draft.metadata.metaTitle,
            metaDescription: draft.metadata.metaDescription,
            canonicalUrl: draft.metadata.canonicalUrl,
            ogImageUrl: draft.metadata.ogImageUrl,
            previewSubtitle: draft.metadata.previewSubtitle,
            heroCaption: draft.metadata.heroCaption,
            newsletterHeadline: draft.metadata.newsletterHeadline,
            callToActionLabel: draft.metadata.callToActionLabel,
            callToActionUrl: draft.metadata.callToActionUrl,
            featured: Boolean(draft.metadata.featured),
            allowComments: Boolean(draft.metadata.allowComments),
            sendToSubscribers: Boolean(draft.metadata.sendToSubscribers),
            pinned: Boolean(draft.metadata.pinned)
          }
        };

        if (editingPostId) {
          await updateAdminBlogPost(editingPostId, payload);
        } else {
          await createAdminBlogPost(payload);
        }
        await loadPosts({ page: editingPostId ? pagination.page : 1 });
        resetDraft();
      } catch (caught) {
        console.error('Failed to save blog post', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to save blog post');
      } finally {
        setBusy(false);
      }
    },
    [draft, categories, tags, editingPostId, loadPosts, pagination.page, resetDraft]
  );

  const publishPost = useCallback(
    async (postId) => {
      setBusy(true);
      setError(null);
      try {
        await publishAdminBlogPost(postId, { publishedAt: new Date().toISOString() });
        await loadPosts({ page: pagination.page });
        if (editingPostId === postId) {
          await loadRevisions(postId);
        }
      } catch (caught) {
        console.error('Failed to publish blog post', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to publish blog post');
      } finally {
        setBusy(false);
      }
    },
    [editingPostId, loadPosts, loadRevisions, pagination.page]
  );

  const archivePost = useCallback(
    async (postId) => {
      setBusy(true);
      setError(null);
      try {
        await archiveAdminBlogPost(postId);
        await loadPosts({ page: pagination.page });
        if (editingPostId === postId) {
          await loadRevisions(postId);
        }
      } catch (caught) {
        console.error('Failed to archive blog post', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to archive blog post');
      } finally {
        setBusy(false);
      }
    },
    [editingPostId, loadPosts, loadRevisions, pagination.page]
  );

  const removePost = useCallback(
    async (postId) => {
      if (!window.confirm('Delete this blog post? This cannot be undone.')) {
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await deleteAdminBlogPost(postId);
        await loadPosts({ page: pagination.page });
        if (editingPostId === postId) {
          resetDraft();
        }
      } catch (caught) {
        console.error('Failed to delete blog post', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to delete blog post');
      } finally {
        setBusy(false);
      }
    },
    [editingPostId, loadPosts, pagination.page, resetDraft]
  );

  const duplicateDraft = useCallback(
    async (postId) => {
      setBusy(true);
      setError(null);
      try {
        const payload = await duplicateAdminBlogPost(postId);
        await loadPosts({ page: 1 });
        if (payload?.data) {
          handleEdit(payload.data);
        }
      } catch (caught) {
        console.error('Failed to duplicate blog post', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to duplicate blog post');
      } finally {
        setBusy(false);
      }
    },
    [handleEdit, loadPosts]
  );

  const handleCategoryFormChange = useCallback((field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleTagFormChange = useCallback((field, value) => {
    setTagForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleCategoryEditorChange = useCallback((field, value) => {
    setCategoryEditor((current) => (current ? { ...current, [field]: value } : current));
  }, []);

  const handleTagEditorChange = useCallback((field, value) => {
    setTagEditor((current) => (current ? { ...current, [field]: value } : current));
  }, []);

  const startCategoryEdit = useCallback((category) => {
    setCategoryEditor(category);
  }, []);

  const startTagEdit = useCallback((tag) => {
    setTagEditor(tag);
  }, []);

  const cancelCategoryEdit = useCallback(() => setCategoryEditor(null), []);
  const cancelTagEdit = useCallback(() => setTagEditor(null), []);

  const addCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) return;
    setTaxonomyBusy(true);
    setError(null);
    try {
      await upsertAdminBlogCategory({
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || undefined,
        description: categoryForm.description.trim() || undefined,
        displayOrder: Number(categoryForm.displayOrder) || 0
      });
      setCategoryForm(createEmptyCategoryForm());
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to save category', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to save category');
    } finally {
      setTaxonomyBusy(false);
    }
  }, [categoryForm, loadReferenceData]);

  const updateCategory = useCallback(async () => {
    if (!categoryEditor?.name?.trim()) {
      setCategoryEditor(null);
      return;
    }
    setTaxonomyBusy(true);
    setError(null);
    try {
      await upsertAdminBlogCategory({
        id: categoryEditor.id,
        name: categoryEditor.name.trim(),
        slug: categoryEditor.slug.trim() || undefined,
        description: categoryEditor.description.trim() || undefined,
        displayOrder: Number(categoryEditor.displayOrder) || 0
      });
      setCategoryEditor(null);
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to update category', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to update category');
    } finally {
      setTaxonomyBusy(false);
    }
  }, [categoryEditor, loadReferenceData]);

  const removeCategory = useCallback(
    async (categoryId) => {
      setTaxonomyBusy(true);
      setError(null);
      try {
        await deleteAdminBlogCategory(categoryId);
        await loadReferenceData();
      } catch (caught) {
        console.error('Failed to delete category', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to delete category');
      } finally {
        setTaxonomyBusy(false);
      }
    },
    [loadReferenceData]
  );

  const addTag = useCallback(async () => {
    if (!tagForm.name.trim()) return;
    setTaxonomyBusy(true);
    setError(null);
    try {
      await upsertAdminBlogTag({
        name: tagForm.name.trim(),
        slug: tagForm.slug.trim() || undefined
      });
      setTagForm(createEmptyTagForm());
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to save tag', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to save tag');
    } finally {
      setTaxonomyBusy(false);
    }
  }, [loadReferenceData, tagForm]);

  const updateTag = useCallback(async () => {
    if (!tagEditor?.name?.trim()) {
      setTagEditor(null);
      return;
    }
    setTaxonomyBusy(true);
    setError(null);
    try {
      await upsertAdminBlogTag({
        id: tagEditor.id,
        name: tagEditor.name.trim(),
        slug: tagEditor.slug.trim() || undefined
      });
      setTagEditor(null);
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to update tag', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to update tag');
    } finally {
      setTaxonomyBusy(false);
    }
  }, [loadReferenceData, tagEditor]);

  const removeTag = useCallback(
    async (tagId) => {
      setTaxonomyBusy(true);
      setError(null);
      try {
        await deleteAdminBlogTag(tagId);
        await loadReferenceData();
      } catch (caught) {
        console.error('Failed to delete tag', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to delete tag');
      } finally {
        setTaxonomyBusy(false);
      }
    },
    [loadReferenceData]
  );

  const restoreRevision = useCallback(
    async (revisionId) => {
      if (!editingPostId) return;
      if (!window.confirm('Restore this revision? Current changes will be replaced.')) {
        return;
      }
      setRestoringRevisionId(revisionId);
      setError(null);
      try {
        const payload = await restoreAdminBlogPostRevision(editingPostId, revisionId);
        let targetPostId = editingPostId;
        if (payload?.data) {
          handleEdit(payload.data);
          targetPostId = payload.data.id ?? editingPostId;
        }
        await loadPosts({ page: pagination.page });
        if (targetPostId) {
          await loadRevisions(targetPostId);
        }
      } catch (caught) {
        console.error('Failed to restore revision', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to restore revision');
      } finally {
        setRestoringRevisionId(null);
      }
    },
    [editingPostId, handleEdit, loadPosts, loadRevisions, pagination.page]
  );

  const applyFilters = useCallback(
    async (event) => {
      event.preventDefault();
      await loadPosts({
        page: 1,
        status: filterDraft.status,
        search: filterDraft.search,
        pageSize: filterDraft.pageSize,
        category: filterDraft.category,
        tag: filterDraft.tag
      });
    },
    [filterDraft, loadPosts]
  );

  const resetFilters = useCallback(async () => {
    const defaults = { ...filterDefaults };
    setFilterDraft(defaults);
    await loadPosts({ page: 1, ...defaults });
  }, [loadPosts]);

  const handlePageChange = useCallback(
    async (nextPage) => {
      if (nextPage < 1 || nextPage > totalPages) return;
      await loadPosts({ page: nextPage });
    },
    [loadPosts, totalPages]
  );

  const handleFilterDraftChange = useCallback((field, value) => {
    setFilterDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadReferenceData(), loadPosts({ page: pagination.page })]);
    if (editingPostId) {
      await loadRevisions(editingPostId);
    }
  }, [editingPostId, loadPosts, loadReferenceData, loadRevisions, pagination.page]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center text-primary/70">
          <h1 className="text-2xl font-semibold text-primary">Administrator access required</h1>
          <p className="mt-3 text-sm">Sign in as an operations administrator to manage blog content.</p>
        </div>
      </div>
    );
  }

  const registeredRoles = DASHBOARD_ROLES;
  const adminRole = registeredRoles.find((role) => role.id === 'admin');
  const roleMeta = adminRole
    ? { ...adminRole, persona: 'Editorial operations & communications', headline: adminRole.headline }
    : { id: 'admin', name: 'Admin Control Tower', persona: 'Editorial operations & communications' };

  const navigation = [
    {
      id: 'posts',
      label: 'Posts workspace',
      description: 'Manage the editorial pipeline and run publish-ready actions.',
      icon: 'documents',
      type: 'component',
      Component: BlogPostsSection,
      props: {
        sessionRole: session?.role ?? 'Admin',
        pagination,
        posts,
        filterDraft,
        onFilterDraftChange: handleFilterDraftChange,
        onApplyFilters: applyFilters,
        onResetFilters: resetFilters,
        statusFilters,
        categoryFilters,
        tagFilters,
        pageSizeOptions,
        loading,
        busy,
        onEdit: handleEdit,
        onDuplicate: duplicateDraft,
        onPublish: publishPost,
        onArchive: archivePost,
        onDelete: removePost,
        onResetDraft: resetDraft,
        onPageChange: handlePageChange,
        error
      }
    },
    {
      id: 'composer',
      label: 'Compose & edit',
      description: 'Draft new stories, manage metadata, and control distribution settings.',
      icon: 'documents',
      type: 'component',
      Component: BlogComposerSection,
      props: {
        draft,
        facets,
        editingPostId,
        busy,
        onDraftChange: handleDraftChange,
        onMetadataChange: handleMetadataChange,
        onAddMediaAsset: addMediaAsset,
        onMediaChange: handleMediaChange,
        onRemoveMediaAsset: removeMediaAsset,
        onSubmitDraft: submitDraft,
        onSubmitWithStatus: submitDraft,
        onResetDraft: resetDraft
      }
    },
    {
      id: 'taxonomy',
      label: 'Taxonomy & widgets',
      description: 'Maintain categories, tags, and publishing guardrails used across dashboards.',
      icon: 'settings',
      type: 'component',
      Component: BlogTaxonomySection,
      props: {
        categoryForm,
        categoryEditor,
        categories: facets.categories,
        onCategoryFormChange: handleCategoryFormChange,
        onAddCategory: addCategory,
        onResetCategoryForm: () => setCategoryForm(createEmptyCategoryForm()),
        onStartCategoryEdit: startCategoryEdit,
        onCategoryEditorChange: handleCategoryEditorChange,
        onUpdateCategory: updateCategory,
        onCancelCategoryEdit: cancelCategoryEdit,
        onRemoveCategory: removeCategory,
        tagForm,
        tagEditor,
        tags: facets.tags,
        onTagFormChange: handleTagFormChange,
        onAddTag: addTag,
        onResetTagForm: () => setTagForm(createEmptyTagForm()),
        onStartTagEdit: startTagEdit,
        onTagEditorChange: handleTagEditorChange,
        onUpdateTag: updateTag,
        onCancelTagEdit: cancelTagEdit,
        onRemoveTag: removeTag,
        taxonomyBusy
      }
    },
    {
      id: 'revisions',
      label: 'Revision timeline',
      description: 'Audit every modification recorded for a given post.',
      icon: 'documents',
      type: 'component',
      Component: BlogRevisionsSection,
      props: {
        editingPostId,
        revisions,
        revisionsLoading,
        revisionError,
        restoringRevisionId,
        onRefresh: () => (editingPostId ? loadRevisions(editingPostId) : undefined),
        onRestore: restoreRevision,
        onOpenTimeline: () =>
          editingPostId
            ? window.open(`/admin/dashboard?panel=blog-revisions&post=${editingPostId}`, '_blank', 'noopener')
            : undefined
      }
    }
  ];

  const dashboard = { navigation };
  const blogRailPosts = posts.filter((post) => post.status === 'published').slice(0, 4);

  return (
    <DashboardLayout
      roleMeta={roleMeta}
      registeredRoles={registeredRoles}
      dashboard={dashboard}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      lastRefreshed={lastSyncedAt}
      onLogout={logout}
      blogPosts={blogRailPosts}
    />
  );
};

export default AdminBlogDashboard;
