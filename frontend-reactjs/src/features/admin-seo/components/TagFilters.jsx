import PropTypes from 'prop-types';
import { Button, SegmentedControl, TextInput } from '../../../components/ui/index.js';
import { ROLE_OPTIONS } from '../constants.js';

const INDEXING_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'indexable', label: 'Indexable' },
  { value: 'noindex', label: 'Noindex' }
];

const SORT_OPTIONS = [
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'createdAt:desc', label: 'Recently created' },
  { value: 'name:asc', label: 'Name A → Z' }
];

function TagFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  onCreate,
  onExport,
  exporting,
  disabled
}) {
  const sortValue = `${filters.sort}:${filters.direction}`;

  const handleIndexingChange = (value) => {
    if (disabled) return;
    if (filters.indexing === value) return;
    onFiltersChange({ indexing: value });
  };

  const handleRoleChange = (event) => {
    if (filters.role === event.target.value) return;
    onFiltersChange({ role: event.target.value });
  };

  const handleSortChange = (event) => {
    if (sortValue === event.target.value) return;
    const [sort, direction] = event.target.value.split(':');
    onFiltersChange({ sort, direction });
  };

  const clearFilters = () => {
    if (disabled) return;
    onClearFilters();
  };

  const hasActiveFilters =
    Boolean(filters.search?.trim()) || filters.indexing !== 'all' || filters.role !== 'all';

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextInput
          label="Search"
          value={filters.search}
          onChange={(event) => onFiltersChange({ search: event.target.value })}
          placeholder="Find by name, slug, or description"
          disabled={disabled}
        />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Indexing</p>
          <SegmentedControl
            name="tag-indexing"
            value={filters.indexing}
            options={INDEXING_OPTIONS}
            onChange={handleIndexingChange}
            className="max-w-xs"
          />
        </div>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          Role visibility
          <select
            value={filters.role}
            onChange={handleRoleChange}
            className="w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={disabled}
          >
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          Sort order
          <select
            value={sortValue}
            onChange={handleSortChange}
            className="w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={disabled}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <p>Filters refine the tag catalogue for faster governance reviews.</p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-transparent bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-200 hover:text-primary"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRefresh} disabled={disabled}>
            Refresh
          </Button>
          <Button variant="ghost" onClick={onExport} disabled={disabled || exporting}>
            {exporting ? 'Exporting…' : 'Export JSON'}
          </Button>
          <Button onClick={onCreate} disabled={disabled}>Create tag metadata</Button>
        </div>
      </div>
    </div>
  );
}

TagFilters.propTypes = {
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
  onExport: PropTypes.func.isRequired,
  exporting: PropTypes.bool,
  disabled: PropTypes.bool
};

TagFilters.defaultProps = {
  exporting: false,
  disabled: false
};

export default TagFilters;
