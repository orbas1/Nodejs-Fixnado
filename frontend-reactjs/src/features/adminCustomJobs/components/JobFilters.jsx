import PropTypes from 'prop-types';
import { FILTER_STATUSES } from '../constants.js';
import { TextInput } from '../../../components/ui/index.js';

export default function JobFilters({ filters, onStatusChange, onZoneChange, zones, searchInput, onSearchChange }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Status</span>
          <select
            value={filters.status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-accent focus:outline-none"
          >
            {FILTER_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Zone</span>
          <select
            value={filters.zoneId}
            onChange={(event) => onZoneChange(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-accent focus:outline-none"
          >
            <option value="">All zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full max-w-sm">
        <TextInput
          label="Search"
          placeholder="Search by title, brief, or budget"
          value={searchInput}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  );
}

JobFilters.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    zoneId: PropTypes.string
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onZoneChange: PropTypes.func.isRequired,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  searchInput: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired
};
