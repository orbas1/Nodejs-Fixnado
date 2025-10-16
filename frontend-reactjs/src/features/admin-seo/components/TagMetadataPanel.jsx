import PropTypes from 'prop-types';
import { Button, Spinner, StatusPill } from '../../../components/ui/index.js';
import TagFilters from './TagFilters.jsx';
import TagStats from './TagStats.jsx';
import { formatRelativeTime, resolveRoleLabel } from '../utils.js';

function TagMetadataPanel({
  tags,
  loading,
  pagination,
  stats,
  filters,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  onCreate,
  onEdit,
  onDuplicate,
  onPageChange,
  onExport,
  exporting,
  error,
  success
}) {
  const page = pagination?.page ?? 1;
  const fallbackPageSize = tags.length || 1;
  const pageSize = pagination?.pageSize ?? fallbackPageSize;
  const total = pagination?.total ?? tags.length;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + tags.length - 1, total);
  const hasPrev = page > 1;
  const hasNext = pagination?.hasMore ?? end < total;

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
            <Spinner className="mr-2 inline h-4 w-4 text-primary" /> Loading tags…
          </td>
        </tr>
      );
    }

    if (tags.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
            No tags found for the current filters.
          </td>
        </tr>
      );
    }

    return tags.map((tag) => {
      const updatedRelative = formatRelativeTime(tag.updatedAt);
      const updatedAbsolute = tag.updatedAt ? new Date(tag.updatedAt).toLocaleString() : 'Never updated';
      const canonical = tag.canonicalUrl || '—';
      const synonymsCount = Array.isArray(tag.synonyms) ? tag.synonyms.length : 0;
      const keywordCount = Array.isArray(tag.metaKeywords) ? tag.metaKeywords.length : 0;
      const roleAccess = Array.isArray(tag.roleAccess) && tag.roleAccess.length ? tag.roleAccess : ['admin'];

      return (
        <tr key={tag.id ?? tag.slug} className="hover:bg-slate-50">
          <td className="px-4 py-3 text-primary">
            <div className="font-semibold">{tag.name}</div>
            <div className="text-xs text-slate-500">{tag.metaTitle || 'No meta title configured'}</div>
            <div className="text-xs text-slate-400">{keywordCount} keywords • {synonymsCount} synonyms</div>
          </td>
          <td className="px-4 py-3 text-slate-600">
            <div className="font-mono text-xs text-slate-500">{tag.slug}</div>
            <div className="text-xs text-slate-400 truncate" title={canonical}>
              {canonical}
            </div>
          </td>
          <td className="px-4 py-3">
            <StatusPill tone={tag.noindex ? 'warning' : 'success'}>
              {tag.noindex ? 'Noindex' : 'Indexable'}
            </StatusPill>
          </td>
          <td className="px-4 py-3 text-slate-600">
            {roleAccess.map((role) => resolveRoleLabel(role)).join(', ')}
          </td>
          <td className="px-4 py-3 text-slate-600">{resolveRoleLabel(tag.ownerRole)}</td>
          <td className="px-4 py-3 text-slate-600" title={updatedAbsolute}>
            {updatedRelative}
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => onEdit(tag)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDuplicate(tag)}>
                Duplicate
              </Button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <section id="tags" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Tag metadata</h2>
          <p className="mt-2 text-sm text-slate-600">
            Manage tag-level metadata, Open Graph assets, and role-based visibility controls.
          </p>
        </div>
      </div>

      <TagStats stats={stats} loading={loading && tags.length === 0} />

      <TagFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
        onRefresh={onRefresh}
        onCreate={onCreate}
        onExport={onExport}
        exporting={exporting}
        disabled={loading}
      />

      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      {success ? <StatusPill tone="success">{success}</StatusPill> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-[0.3em] text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Tag
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Slug & canonical
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Indexing
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Roles
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Owner
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Updated
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">{renderTableBody()}</tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-500">
        <p>
          {total === 0 ? 'No records to display.' : `Showing ${start} – ${end} of ${total} tags`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={!hasPrev || loading}>
            Previous
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={!hasNext || loading}>
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

TagMetadataPanel.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number,
    hasMore: PropTypes.bool
  }),
  stats: PropTypes.shape({
    total: PropTypes.number,
    indexable: PropTypes.number,
    noindex: PropTypes.number,
    restricted: PropTypes.number,
    roleDistribution: PropTypes.object
  }),
  filters: PropTypes.shape({
    search: PropTypes.string,
    indexing: PropTypes.string,
    role: PropTypes.string,
    sort: PropTypes.string,
    direction: PropTypes.string
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  exporting: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.string
};

TagMetadataPanel.defaultProps = {
  loading: false,
  pagination: null,
  stats: null,
  exporting: false,
  error: null,
  success: null
};

export default TagMetadataPanel;
