import PropTypes from 'prop-types';
import { Button, StatusPill, TextInput } from '../../../components/ui/index.js';
import FormField from '../../../components/ui/FormField.jsx';
import { STATUS_FILTER_OPTIONS, HOLD_OPTIONS } from '../constants.js';

export default function EscrowFilters({
  filters,
  onFilterChange,
  availablePolicies,
  onRefresh,
  loading,
  isFallback,
  servedFromCache,
  error
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
          <FormField id="status-filter" label="Status">
            <select
              id="status-filter"
              className="fx-text-input"
              value={filters.status}
              onChange={(event) => onFilterChange('status', event.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="policy-filter" label="Policy">
            <select
              id="policy-filter"
              className="fx-text-input"
              value={filters.policyId}
              onChange={(event) => onFilterChange('policyId', event.target.value)}
            >
              <option value="all">All policies</option>
              {availablePolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="hold-filter" label="Hold state">
            <select
              id="hold-filter"
              className="fx-text-input"
              value={filters.onHold}
              onChange={(event) => onFilterChange('onHold', event.target.value)}
            >
              {HOLD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <TextInput
            label="Search"
            value={filters.search}
            onChange={(event) => onFilterChange('search', event.target.value)}
            placeholder="Order, buyer, policy..."
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" size="sm" variant="secondary" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {isFallback ? <StatusPill tone="warning">Showing cached insights</StatusPill> : null}
        {servedFromCache ? <StatusPill tone="info">Served from cache</StatusPill> : null}
        {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      </div>
    </div>
  );
}

EscrowFilters.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    policyId: PropTypes.string,
    onHold: PropTypes.string,
    search: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  availablePolicies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  isFallback: PropTypes.bool,
  servedFromCache: PropTypes.bool,
  error: PropTypes.string
};

EscrowFilters.defaultProps = {
  availablePolicies: [],
  onRefresh: undefined,
  loading: false,
  isFallback: false,
  servedFromCache: false,
  error: null
};
