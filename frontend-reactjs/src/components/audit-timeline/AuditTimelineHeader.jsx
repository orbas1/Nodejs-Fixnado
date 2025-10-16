import PropTypes from 'prop-types';
import { Button, SegmentedControl } from '../ui/index.js';
import { CATEGORY_OPTIONS, STATUS_OPTIONS, TIMEFRAME_OPTIONS } from './constants.js';

const AuditTimelineHeader = ({
  label,
  description,
  timeframe,
  onTimeframeChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  onCreate,
  onRefresh,
  onExport,
  busy,
  canExport
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-semibold text-primary">{label}</h2>
      {description ? <p className="text-sm text-slate-600 max-w-2xl">{description}</p> : null}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl
        name="Audit timeframe"
        value={timeframe}
        options={TIMEFRAME_OPTIONS}
        onChange={onTimeframeChange}
        size="sm"
      />
      <select
        className="rounded-full border border-accent/20 bg-white px-4 py-2 text-sm text-primary shadow-sm"
        value={categoryFilter}
        onChange={(event) => onCategoryChange(event.target.value)}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-full border border-accent/20 bg-white px-4 py-2 text-sm text-primary shadow-sm"
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button variant="ghost" size="sm" onClick={onRefresh} disabled={busy}>
        Refresh
      </Button>
      <Button variant="secondary" size="sm" onClick={onExport} disabled={!canExport}>
        Export CSV
      </Button>
      <Button size="sm" onClick={onCreate}>
        Add audit entry
      </Button>
    </div>
  </div>
);

AuditTimelineHeader.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  timeframe: PropTypes.string.isRequired,
  onTimeframeChange: PropTypes.func.isRequired,
  categoryFilter: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  canExport: PropTypes.bool
};

AuditTimelineHeader.defaultProps = {
  busy: false,
  canExport: false
};

export default AuditTimelineHeader;
