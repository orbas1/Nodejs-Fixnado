import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Card, SegmentedControl, TextInput } from '../../../components/ui/index.js';
import { EVENT_TYPES, SEVERITY_OPTIONS, SORT_DIRECTIONS, SORT_FIELDS, STATUS_OPTIONS, TIMEFRAME_OPTIONS } from '../constants.js';

export default function AuditFiltersPanel({
  filters,
  onTimeframeChange,
  onCustomStartChange,
  onCustomEndChange,
  onSearchChange,
  onIncludeNotesChange,
  onToggleEventType,
  onToggleStatus,
  onToggleSeverity,
  onSortFieldChange,
  onSortDirectionChange
}) {
  return (
    <Card className="lg:col-span-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <SegmentedControl
            name="Audit timeframe"
            value={filters.timeframe}
            options={TIMEFRAME_OPTIONS}
            onChange={onTimeframeChange}
          />
          {filters.timeframe === 'custom' ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextInput
                type="datetime-local"
                label="Start"
                value={filters.customStart}
                onChange={(event) => onCustomStartChange(event.target.value)}
              />
              <TextInput
                type="datetime-local"
                label="End"
                value={filters.customEnd}
                onChange={(event) => onCustomEndChange(event.target.value)}
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-end">
          <TextInput
            label="Search"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search summary, details, or metadata"
            className="flex-1"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/60"
              checked={filters.includeNotes}
              onChange={(event) => onIncludeNotesChange(event.target.checked)}
            />
            Include notes in list
          </label>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Event types</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EVENT_TYPES.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => onToggleEventType(option.value)}
                className={clsx(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  filters.eventTypes.includes(option.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Statuses</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => onToggleStatus(option.value)}
                className={clsx(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  filters.statuses.includes(option.value)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Severity</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEVERITY_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => onToggleSeverity(option.value)}
                className={clsx(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  filters.severities.includes(option.value)
                    ? 'border-rose-500 bg-rose-50 text-rose-600'
                    : 'border-slate-200 text-slate-600 hover:border-rose-400 hover:text-rose-600'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Sort</p>
          <div className="mt-3 flex gap-2">
            <select
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={filters.sortBy}
              onChange={(event) => onSortFieldChange(event.target.value)}
            >
              {SORT_FIELDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={filters.sortDirection}
              onChange={(event) => onSortDirectionChange(event.target.value)}
            >
              {SORT_DIRECTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Card>
  );
}

AuditFiltersPanel.propTypes = {
  filters: PropTypes.shape({
    timeframe: PropTypes.string.isRequired,
    customStart: PropTypes.string,
    customEnd: PropTypes.string,
    search: PropTypes.string,
    includeNotes: PropTypes.bool.isRequired,
    eventTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    statuses: PropTypes.arrayOf(PropTypes.string).isRequired,
    severities: PropTypes.arrayOf(PropTypes.string).isRequired,
    sortBy: PropTypes.string.isRequired,
    sortDirection: PropTypes.string.isRequired
  }).isRequired,
  onTimeframeChange: PropTypes.func.isRequired,
  onCustomStartChange: PropTypes.func.isRequired,
  onCustomEndChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onIncludeNotesChange: PropTypes.func.isRequired,
  onToggleEventType: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onToggleSeverity: PropTypes.func.isRequired,
  onSortFieldChange: PropTypes.func.isRequired,
  onSortDirectionChange: PropTypes.func.isRequired
};
