import PropTypes from 'prop-types';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button, Card, SegmentedControl } from '../ui/index.js';

function StatusControls({ statusFilter, statusOptions, onFilterChange, onRefresh, loading, message, error }) {
  return (
    <Card className="w-full max-w-sm border border-accent/10 bg-white/95 shadow-sm" padding="lg">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-primary">Status filter</h3>
        <SegmentedControl
          name="services-status-filter"
          value={statusFilter}
          onChange={onFilterChange}
          options={statusOptions}
        />
        <Button type="button" variant="secondary" size="sm" onClick={onRefresh} loading={loading} icon={ArrowPathIcon}>
          Refresh data
        </Button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
    </Card>
  );
}

StatusControls.propTypes = {
  statusFilter: PropTypes.string.isRequired,
  statusOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })
  ).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  message: PropTypes.string,
  error: PropTypes.string
};

StatusControls.defaultProps = {
  loading: false,
  message: null,
  error: null
};

export default StatusControls;
