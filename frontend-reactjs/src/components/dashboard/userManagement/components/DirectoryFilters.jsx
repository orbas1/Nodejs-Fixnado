import PropTypes from 'prop-types';
import { TextInput } from '../../../ui/index.js';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../constants.js';

function DirectoryFilters({ filters, onChange }) {
  return (
    <div className="border-b border-slate-200 px-6 py-4">
      <div className="grid gap-4 md:grid-cols-4">
        <TextInput
          label="Search"
          placeholder="Name or email"
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
        />
        <div>
          <label className="block text-sm font-semibold text-slate-600">Role</label>
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={filters.role}
            onChange={(event) => onChange('role', event.target.value)}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600">Status</label>
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

DirectoryFilters.propTypes = {
  filters: PropTypes.shape({
    role: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default DirectoryFilters;
