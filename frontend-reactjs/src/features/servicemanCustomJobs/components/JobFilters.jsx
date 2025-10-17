import PropTypes from 'prop-types';
import { Button, Select, TextInput } from '../../../components/ui/index.js';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open opportunities' },
  { value: 'pending', label: 'Pending decision' },
  { value: 'awarded', label: 'Awarded jobs' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' }
];

export default function JobFilters({
  filters,
  searchInput,
  onSearchChange,
  onStatusChange,
  onZoneChange,
  zones,
  onRefresh
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-accent/10 bg-white/90 p-4">
      <div className="flex min-w-[240px] flex-1 items-center gap-2">
        <label htmlFor="serviceman-custom-jobs-search" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Search
        </label>
        <TextInput
          id="serviceman-custom-jobs-search"
          value={searchInput}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title, budget or location"
          className="w-full"
        />
      </div>
      <div className="flex min-w-[200px] flex-1 items-center gap-2">
        <label htmlFor="serviceman-custom-jobs-status" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Status
        </label>
        <Select
          id="serviceman-custom-jobs-status"
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value)}
          options={STATUS_OPTIONS}
        />
      </div>
      <div className="flex min-w-[200px] flex-1 items-center gap-2">
        <label htmlFor="serviceman-custom-jobs-zone" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Zone
        </label>
        <Select
          id="serviceman-custom-jobs-zone"
          value={filters.zoneId}
          onChange={(event) => onZoneChange(event.target.value)}
          options={[{ value: '', label: 'All zones' }, ...zones.map((zone) => ({ value: zone.id, label: zone.name }))]}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onRefresh} size="sm">
          Refresh
        </Button>
      </div>
    </div>
  );
}

JobFilters.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    zoneId: PropTypes.string
  }).isRequired,
  searchInput: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onZoneChange: PropTypes.func.isRequired,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  onRefresh: PropTypes.func
};

JobFilters.defaultProps = {
  zones: [],
  onRefresh: () => {}
};
