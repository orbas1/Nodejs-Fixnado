import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';

function resolveAvailabilityTone(availabilityPercentage) {
  if (!Number.isFinite(availabilityPercentage)) {
    return 'neutral';
  }
  if (availabilityPercentage >= 75) {
    return 'success';
  }
  if (availabilityPercentage <= 35) {
    return 'danger';
  }
  if (availabilityPercentage <= 55) {
    return 'warning';
  }
  return 'neutral';
}

export default function ServicemanDirectory({
  servicemen,
  selectedId,
  onSelect,
  onCreate,
  loading,
  onRefresh,
  filter,
  onFilterChange,
  error
}) {
  const filtered = useMemo(() => {
    const query = filter?.trim().toLowerCase() ?? '';
    if (!query) {
      return servicemen;
    }
    return servicemen.filter((member) => {
      const haystack = [member.name, member.role, member.status, member.availabilityStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [servicemen, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-primary">Servicemen</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
          <Button size="sm" onClick={onCreate}>
            Add serviceman
          </Button>
        </div>
      </div>
      <TextInput
        value={filter}
        onChange={(event) => onFilterChange(event.target.value)}
        placeholder="Search by name, role, or status"
      />
      {error ? (
        <StatusPill tone="danger">{error.message ?? 'Unable to load servicemen'}</StatusPill>
      ) : null}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-accent/40 bg-secondary/40 p-4 text-sm text-slate-600">
            <Spinner size="sm" />
            <span className="ml-2">Loading servicemen…</span>
          </div>
        ) : null}
        {filtered.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-accent/40 bg-secondary/40 p-4 text-sm text-slate-600">
            No servicemen found. Create a crew member to begin managing availability and coverage.
          </div>
        ) : null}
        <ul className="space-y-2">
          {filtered.map((member) => {
            const tone = resolveAvailabilityTone(member.availabilityPercentage);
            return (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => onSelect(member.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    selectedId === member.id
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role ?? 'Technician'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={member.status === 'active' ? 'success' : member.status === 'inactive' ? 'neutral' : 'warning'}>
                        {member.status?.replace(/_/g, ' ') ?? 'Status'}
                      </StatusPill>
                      <StatusPill tone={tone}>
                        {`${member.availabilityPercentage ?? 0}% free`}
                      </StatusPill>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {member.availabilityStatus?.replace(/_/g, ' ') ?? 'Availability unknown'}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

ServicemanDirectory.propTypes = {
  servicemen: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string,
      status: PropTypes.string,
      availabilityStatus: PropTypes.string,
      availabilityPercentage: PropTypes.number
    })
  ).isRequired,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  filter: PropTypes.string,
  onFilterChange: PropTypes.func.isRequired,
  error: PropTypes.instanceOf(Error)
};

ServicemanDirectory.defaultProps = {
  selectedId: null,
  loading: false,
  filter: '',
  error: null
};
