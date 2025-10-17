import PropTypes from 'prop-types';
import { Button, StatusPill, TextInput } from '../../../components/ui/index.js';
import FormField from '../../../components/ui/FormField.jsx';
import { STATUS_FILTER_OPTIONS, HOLD_OPTIONS } from '../../escrowManagement/constants.js';

export default function ServicemanEscrowFilters({
  filters,
  onFilterChange,
  policies,
  onRefresh,
  loading,
  error
}) {
  const hasPolicies = Array.isArray(policies) && policies.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))]">
        <FormField id="serviceman-escrow-status" label="Status">
          <select
            id="serviceman-escrow-status"
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
        <FormField id="serviceman-escrow-hold" label="Hold state">
          <select
            id="serviceman-escrow-hold"
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
        {hasPolicies ? (
          <FormField id="serviceman-escrow-policy" label="Policy">
            <select
              id="serviceman-escrow-policy"
              className="fx-text-input"
              value={filters.policyId}
              onChange={(event) => onFilterChange('policyId', event.target.value)}
            >
              <option value="all">All policies</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name || policy.id}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}
        <TextInput
          label="Search"
          value={filters.search}
          onChange={(event) => onFilterChange('search', event.target.value)}
          placeholder="Order, service, or reference"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" size="sm" variant="secondary" onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
        <div className="flex flex-wrap gap-2">
          {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
        </div>
      </div>
    </div>
  );
}

ServicemanEscrowFilters.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    onHold: PropTypes.string,
    policyId: PropTypes.string,
    search: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  policies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string
    })
  ),
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string
};

ServicemanEscrowFilters.defaultProps = {
  policies: [],
  onRefresh: undefined,
  loading: false,
  error: null
};
