import PropTypes from 'prop-types';
import Spinner from '../../../components/ui/Spinner.jsx';

const statusBadgeClass = (status) => {
  if (status === 'published') return 'bg-emerald-100 text-emerald-700';
  if (status === 'scheduled') return 'bg-amber-100 text-amber-700';
  if (status === 'archived') return 'bg-slate-200 text-slate-600';
  return 'bg-primary/10 text-primary';
};

const BlogPostsSection = ({
  sessionRole,
  pagination,
  posts,
  filterDraft,
  onFilterDraftChange,
  onApplyFilters,
  onResetFilters,
  statusFilters,
  categoryFilters,
  tagFilters,
  pageSizeOptions,
  loading,
  busy,
  onEdit,
  onDuplicate,
  onPublish,
  onArchive,
  onDelete,
  onResetDraft,
  onPageChange,
  error
}) => {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / (pagination.pageSize || 1)));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Editorial control</p>
          <h2 className="text-2xl font-semibold text-primary">Blog management console</h2>
          <p className="mt-2 max-w-2xl text-sm text-primary/60">
            Publish announcements, long-form stories, and product updates. All tooling below is production-ready and scoped to
            your administrator permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-primary/60">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">Live</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">Secure</span>
          <a
            href="/admin/dashboard?panel=blog-insights"
            className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
          >
            Open analytics
          </a>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-primary/20 px-3 py-1 font-semibold text-primary hover:border-primary"
          >
            View live site
          </a>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary">Posts</h3>
            <p className="text-xs text-primary/60">
              {pagination.total} total entries • {sessionRole ?? 'Admin'} permissions applied
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onResetDraft}
              className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
            >
              New draft
            </button>
            <button
              type="button"
              onClick={() => window.open('/admin/dashboard?panel=calendar', '_blank', 'noopener')}
              className="rounded-full border border-primary/20 px-3 py-1 font-semibold text-primary hover:border-primary"
            >
              Editorial calendar
            </button>
          </div>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-[2fr,1fr,1fr,1fr,1fr,auto]" onSubmit={onApplyFilters}>
          <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-primary/60">
            Search
            <input
              type="search"
              value={filterDraft.search}
              onChange={(event) => onFilterDraftChange('search', event.target.value)}
              placeholder="Search titles or excerpts"
              className="mt-2 rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-primary/60">
            Status
            <select
              value={filterDraft.status}
              onChange={(event) => onFilterDraftChange('status', event.target.value)}
              className="mt-2 rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {statusFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-primary/60">
            Category
            <select
              value={filterDraft.category}
              onChange={(event) => onFilterDraftChange('category', event.target.value)}
              className="mt-2 rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {categoryFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-primary/60">
            Tag
            <select
              value={filterDraft.tag}
              onChange={(event) => onFilterDraftChange('tag', event.target.value)}
              className="mt-2 rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {tagFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-primary/60">
            Page size
            <select
              value={filterDraft.pageSize}
              onChange={(event) => onFilterDraftChange('pageSize', Number(event.target.value))}
              className="mt-2 rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-primary/90"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-full border border-accent/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:border-accent"
            >
              Reset
            </button>
          </div>
        </form>

        {loading ? (
          <div
            className="mt-6 flex min-h-[20vh] items-center justify-center rounded-2xl border border-accent/10 bg-secondary/50"
            role="status"
            aria-live="polite"
          >
            <Spinner className="h-8 w-8 text-primary" />
            <span className="sr-only">Loading blog posts</span>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-hidden rounded-2xl border border-accent/10">
              <table className="min-w-full divide-y divide-accent/10 text-sm">
                <thead className="bg-secondary">
                  <tr className="text-left text-xs uppercase tracking-[0.25em] text-primary/60">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Published</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/10 bg-white/60">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-primary/50">
                        No posts match the current filters. Create a draft or adjust your search criteria.
                      </td>
                    </tr>
                  ) : null}
                  {posts.map((post) => (
                    <tr key={post.id} className="align-top text-primary/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-primary">{post.title}</div>
                        <div className="text-xs text-primary/60">{post.excerpt?.slice(0, 140)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-primary/60">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-primary/60">
                        {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(post)}
                            className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicate(post.id)}
                            className="rounded-full border border-secondary/40 px-3 py-1 font-semibold text-primary hover:border-secondary disabled:opacity-60"
                            disabled={busy}
                          >
                            Duplicate
                          </button>
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-primary/20 px-3 py-1 font-semibold text-primary hover:border-primary"
                          >
                            Preview
                          </a>
                          <a
                            href={`/admin/dashboard?panel=blog-insights&post=${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-secondary/40 px-3 py-1 font-semibold text-primary hover:border-secondary"
                          >
                            Analytics
                          </a>
                          <button
                            type="button"
                            onClick={() => window.open(`/admin/dashboard?panel=blog-revisions&post=${post.id}`, '_blank', 'noopener')}
                            className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
                          >
                            History
                          </button>
                          {post.status !== 'published' ? (
                            <button
                              type="button"
                              onClick={() => onPublish(post.id)}
                              className="rounded-full bg-primary px-3 py-1 font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
                              disabled={busy}
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onArchive(post.id)}
                              className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-semibold text-amber-700 hover:border-amber-400 disabled:opacity-60"
                              disabled={busy}
                            >
                              Archive
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDelete(post.id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700 hover:border-rose-300 disabled:opacity-60"
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

            <div className="mt-4 flex flex-col gap-2 border-t border-accent/10 pt-4 text-xs text-primary/60 md:flex-row md:items-center md:justify-between">
              <span>
                Page {pagination.page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page - 1)}
                  className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent disabled:opacity-40"
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page + 1)}
                  className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent disabled:opacity-40"
                  disabled={pagination.page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

BlogPostsSection.propTypes = {
  sessionRole: PropTypes.string,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number
  }).isRequired,
  posts: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired })
  ).isRequired,
  filterDraft: PropTypes.shape({
    status: PropTypes.string,
    search: PropTypes.string,
    pageSize: PropTypes.number,
    category: PropTypes.string,
    tag: PropTypes.string
  }).isRequired,
  onFilterDraftChange: PropTypes.func.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  statusFilters: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  categoryFilters: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  tagFilters: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  loading: PropTypes.bool.isRequired,
  busy: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onResetDraft: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  error: PropTypes.string
};

BlogPostsSection.defaultProps = {
  sessionRole: 'Admin',
  error: null
};

export default BlogPostsSection;
