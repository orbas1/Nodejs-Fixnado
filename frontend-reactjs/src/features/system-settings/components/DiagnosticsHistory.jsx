import PropTypes from 'prop-types';
import { ArrowPathIcon, EyeIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import { Button, Card, Select, Spinner, StatusPill } from '../../../components/ui/index.js';
import { DATE_FORMATTER, SECTION_LABELS, STATUS_TONES } from '../utils.js';

function uniqueSections(sections = []) {
  const seen = new Set();
  return sections.filter((section) => {
    if (!section?.value || seen.has(section.value)) {
      return false;
    }
    seen.add(section.value);
    return true;
  });
}

function DiagnosticsHistory({
  diagnostics,
  loading,
  sections,
  filter,
  onFilterChange,
  onRefresh,
  onInspect,
  onRetry
}) {
  const options = [
    { value: 'all', label: 'All sections' },
    ...uniqueSections(sections ?? [])
  ];

  const handleFilterChange = (event) => {
    onFilterChange(event.target.value);
  };

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Recent diagnostics</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track the latest health checks across email, storage, messaging, and developer integrations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            label="Filter"
            value={filter}
            onChange={handleFilterChange}
            options={options}
            className="min-w-[180px]"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={ArrowPathIcon}
            loading={loading}
            onClick={onRefresh}
          >
            Refresh history
          </Button>
        </div>
      </div>
      {diagnostics.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-sm text-slate-600">
          {loading ? <Spinner className="h-5 w-5" /> : null}
          <span>{loading ? 'Loading diagnostics…' : 'No diagnostics have been run yet.'}</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Run by</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/70">
              {diagnostics.map((entry) => {
                const label = entry.metadata?.sectionLabel || SECTION_LABELS[entry.section] || entry.section;
                const tone = STATUS_TONES[entry.status] ?? 'warning';
                const durationValue =
                  typeof entry.metadata?.durationMs === 'number'
                    ? `${entry.metadata.durationMs.toFixed(1)} ms`
                    : '—';
                const timestamp =
                  entry.createdAt instanceof Date && !Number.isNaN(entry.createdAt.valueOf())
                    ? DATE_FORMATTER.format(entry.createdAt)
                    : '';
                return (
                  <tr key={`${entry.section}-${entry.id}`} className="align-top">
                    <td className="px-4 py-3 font-medium text-slate-800">{label}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={tone}>{entry.status}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{entry.message}</td>
                    <td className="px-4 py-3 text-slate-600">{durationValue}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.performedBy || 'System'}</td>
                    <td className="px-4 py-3 text-slate-600">{timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon={EyeIcon}
                          onClick={() => onInspect(entry)}
                        >
                          View details
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon={PlayCircleIcon}
                          onClick={() => onRetry(entry.section)}
                        >
                          Re-run test
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

DiagnosticsHistory.propTypes = {
  diagnostics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      section: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      metadata: PropTypes.object,
      performedBy: PropTypes.string,
      createdAt: PropTypes.instanceOf(Date)
    })
  ).isRequired,
  loading: PropTypes.bool,
  sections: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onInspect: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired
};

DiagnosticsHistory.defaultProps = {
  loading: false,
  sections: []
};

export default DiagnosticsHistory;
