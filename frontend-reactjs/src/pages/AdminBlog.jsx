import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  publishAdminBlogPost,
  archiveAdminBlogPost,
  deleteAdminBlogPost,
  listAdminBlogCategories,
  upsertAdminBlogCategory,
  deleteAdminBlogCategory,
  listAdminBlogTags,
  upsertAdminBlogTag,
  deleteAdminBlogTag
} from '../api/adminBlogClient.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const emptyDraft = {
  title: '',
  excerpt: '',
  content: '',
  heroImageUrl: '',
  heroImageAlt: '',
  readingTimeMinutes: 6,
  status: 'draft',
  categories: [],
  tags: [],
  media: []
};

const AdminBlog = () => {
  const { isAuthenticated } = useAdminSession();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingPostId, setEditingPostId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [busy, setBusy] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [tagName, setTagName] = useState('');

  const facets = useMemo(
    () => ({
      categories: categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug })),
      tags: tags.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug }))
    }),
    [categories, tags]
  );

  const loadReferenceData = useCallback(async () => {
    try {
      const [categoryPayload, tagPayload] = await Promise.all([listAdminBlogCategories(), listAdminBlogTags()]);
      setCategories(categoryPayload?.data ?? []);
      setTags(tagPayload?.data ?? []);
    } catch (caught) {
      console.warn('Failed to load blog taxonomy', caught);
    }
  }, []);

  const loadPosts = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await listAdminBlogPosts({ page });
        setPosts(payload?.data ?? []);
        setPagination(payload?.pagination ?? { page, total: 0, pageSize: 20 });
      } catch (caught) {
        console.error('Failed to load admin blog posts', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load blog posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    loadReferenceData();
    loadPosts(1);
  }, [isAuthenticated, loadReferenceData, loadPosts]);

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingPostId(null);
  };

  const handleEdit = (post) => {
    setEditingPostId(post.id);
    setDraft({
      title: post.title,
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      heroImageUrl: post.heroImageUrl ?? '',
      heroImageAlt: post.heroImageAlt ?? '',
      readingTimeMinutes: post.readingTimeMinutes ?? 6,
      status: post.status,
      categories: post.categories?.map((category) => category.id) ?? [],
      tags: post.tags?.map((tag) => tag.id) ?? [],
      media: post.media?.map((asset) => ({ url: asset.url, altText: asset.altText ?? '', type: asset.type })) ?? []
    });
  };

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submitDraft = async (statusOverride = null) => {
    setBusy(true);
    try {
      const payload = {
        title: draft.title,
        excerpt: draft.excerpt,
        content: draft.content,
        heroImageUrl: draft.heroImageUrl || undefined,
        heroImageAlt: draft.heroImageAlt || undefined,
        readingTimeMinutes: draft.readingTimeMinutes,
        status: statusOverride ?? draft.status,
        categories: draft.categories
          .map((id) => categories.find((category) => category.id === id))
          .filter(Boolean)
          .map((category) => ({ id: category.id })),
        tags: draft.tags
          .map((id) => tags.find((tag) => tag.id === id))
          .filter(Boolean)
          .map((tag) => ({ id: tag.id })),
        media: draft.media
      };

      if (editingPostId) {
        await updateAdminBlogPost(editingPostId, payload);
      } else {
        await createAdminBlogPost(payload);
      }
      await loadPosts(pagination.page);
      resetDraft();
    } catch (caught) {
      console.error('Failed to save blog post', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to save blog post');
    } finally {
      setBusy(false);
    }
  };

  const publishPost = async (postId) => {
    setBusy(true);
    try {
      await publishAdminBlogPost(postId, { publishedAt: new Date().toISOString() });
      await loadPosts(pagination.page);
    } catch (caught) {
      console.error('Failed to publish blog post', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to publish blog post');
    } finally {
      setBusy(false);
    }
  };

  const archivePost = async (postId) => {
    setBusy(true);
    try {
      await archiveAdminBlogPost(postId);
      await loadPosts(pagination.page);
    } catch (caught) {
      console.error('Failed to archive blog post', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to archive blog post');
    } finally {
      setBusy(false);
    }
  };

  const removePost = async (postId) => {
    if (!window.confirm('Delete this blog post? This cannot be undone.')) {
      return;
    }
    setBusy(true);
    try {
      await deleteAdminBlogPost(postId);
      await loadPosts(pagination.page);
    } catch (caught) {
      console.error('Failed to delete blog post', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to delete blog post');
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await upsertAdminBlogCategory({ name: categoryName.trim() });
      setCategoryName('');
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to save category', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to save category');
    }
  };

  const removeCategory = async (categoryId) => {
    try {
      await deleteAdminBlogCategory(categoryId);
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to delete category', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to delete category');
    }
  };

  const addTag = async () => {
    if (!tagName.trim()) return;
    try {
      await upsertAdminBlogTag({ name: tagName.trim() });
      setTagName('');
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to save tag', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to save tag');
    }
  };

  const removeTag = async (tagId) => {
    try {
      await deleteAdminBlogTag(tagId);
      await loadReferenceData();
    } catch (caught) {
      console.error('Failed to delete tag', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to delete tag');
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/50 to-white px-6 py-12">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Editorial control</p>
            <h1 className="text-4xl font-semibold text-primary">Blog management console</h1>
          </div>
          <div className="flex gap-3 text-xs text-primary/60">
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">Live</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">Secure</span>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border border-accent/10 bg-white/80" role="status" aria-live="polite">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="sr-only">Loading blog posts</span>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-primary">Posts</h2>
                  <span className="text-xs uppercase tracking-[0.3em] text-primary/50">
                    Page {pagination.page} • {pagination.total} total
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-accent/10">
                  <table className="min-w-full divide-y divide-accent/10 text-sm">
                    <thead className="bg-secondary">
                      <tr className="text-left text-xs uppercase tracking-[0.25em] text-primary/60">
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Published</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-accent/10 bg-white/60">
                      {posts.map((post) => (
                        <tr key={post.id} className="align-top text-primary/80">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-primary">{post.title}</div>
                            <div className="text-xs text-primary/60">{post.excerpt?.slice(0, 120)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                post.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : post.status === 'scheduled'
                                    ? 'bg-amber-100 text-amber-700'
                                    : post.status === 'archived'
                                      ? 'bg-slate-200 text-slate-600'
                                      : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {post.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-primary/60">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(post)}
                                className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
                              >
                                Edit
                              </button>
                              {post.status !== 'published' ? (
                                <button
                                  type="button"
                                  onClick={() => publishPost(post.id)}
                                  className="rounded-full bg-primary px-3 py-1 font-semibold text-white shadow hover:bg-primary/90"
                                  disabled={busy}
                                >
                                  Publish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => archivePost(post.id)}
                                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-semibold text-amber-700 hover:border-amber-400"
                                  disabled={busy}
                                >
                                  Archive
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removePost(post.id)}
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700 hover:border-rose-300"
                                disabled={busy}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-primary">Compose post</h2>
                  {editingPostId ? (
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60"
                    >
                      Cancel editing
                    </button>
                  ) : null}
                </div>
                <form
                  className="mt-6 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitDraft();
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                      Title
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(event) => handleChange('title', event.target.value)}
                        required
                        className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </label>
                    <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                      Reading time (minutes)
                      <input
                        type="number"
                        min="1"
                        max="45"
                        value={draft.readingTimeMinutes}
                        onChange={(event) => handleChange('readingTimeMinutes', Number(event.target.value))}
                        className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </label>
                  </div>
                  <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                    Executive summary
                    <textarea
                      value={draft.excerpt}
                      onChange={(event) => handleChange('excerpt', event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </label>
                  <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                    Article body
                    <textarea
                      value={draft.content}
                      onChange={(event) => handleChange('content', event.target.value)}
                      rows={8}
                      required
                      className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                      Hero image URL
                      <input
                        type="url"
                        value={draft.heroImageUrl}
                        onChange={(event) => handleChange('heroImageUrl', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </label>
                    <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                      Hero image alt text
                      <input
                        type="text"
                        value={draft.heroImageAlt}
                        onChange={(event) => handleChange('heroImageAlt', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                      Categories
                      <select
                        multiple
                        value={draft.categories}
                        onChange={(event) =>
                          handleChange(
                            'categories',
                            Array.from(event.target.selectedOptions).map((option) => option.value)
                          )
                        }
                        className="mt-2 h-32 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        {facets.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
                      Tags
                      <select
                        multiple
                        value={draft.tags}
                        onChange={(event) =>
                          handleChange('tags', Array.from(event.target.selectedOptions).map((option) => option.value))
                        }
                        className="mt-2 h-32 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        {facets.tags.map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            #{tag.slug}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-4">
                    <button
                      type="submit"
                      className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
                      disabled={busy}
                    >
                      {editingPostId ? 'Update draft' : 'Save draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitDraft('published')}
                      className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 hover:border-emerald-400 disabled:opacity-60"
                      disabled={busy}
                    >
                      Publish now
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
                <h2 className="text-lg font-semibold text-primary">Categories</h2>
                <div className="mt-4 flex gap-3">
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder="Add category"
                    className="flex-1 rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-primary/90"
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {categories.map((category) => (
                    <li key={category.id} className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-2">
                      <span className="font-semibold text-primary">{category.name}</span>
                      <button
                        type="button"
                        onClick={() => removeCategory(category.id)}
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
                <h2 className="text-lg font-semibold text-primary">Tags</h2>
                <div className="mt-4 flex gap-3">
                  <input
                    type="text"
                    value={tagName}
                    onChange={(event) => setTagName(event.target.value)}
                    placeholder="Add tag"
                    className="flex-1 rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-primary/90"
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-primary/60">
                  {tags.map((tag) => (
                    <li key={tag.id} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-primary">
                      #{tag.slug}
                      <button type="button" onClick={() => removeTag(tag.id)} className="text-[0.6rem] uppercase">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlog;
