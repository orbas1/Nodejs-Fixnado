import PropTypes from 'prop-types';
import { MapPinIcon, ClockIcon, UsersIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Spinner } from '../../../../components/ui/index.js';
import FormStatus from './FormStatus.jsx';

const coverageShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  zoneId: PropTypes.string.isRequired,
  zoneName: PropTypes.string,
  coverageType: PropTypes.string,
  slaMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxCapacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  notes: PropTypes.string,
  metadata: PropTypes.object
});

function CoverageRow({ coverage, onEdit, onDelete }) {
  const metadataEntries = Object.entries(coverage.metadata ?? {}).filter(([, value]) => value != null && value !== '');

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-primary">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm">
            <MapPinIcon aria-hidden="true" className="h-5 w-5" /> {coverage.zoneName || coverage.zoneId}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {coverage.coverageType}
          </span>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <p className="flex items-center gap-2">
            <ClockIcon aria-hidden="true" className="h-4 w-4 text-primary" />
            SLA {coverage.slaMinutes} mins
          </p>
          <p className="flex items-center gap-2">
            <UsersIcon aria-hidden="true" className="h-4 w-4 text-primary" />
            Capacity {coverage.maxCapacity}
          </p>
        </div>
        {coverage.notes ? <p className="text-sm text-slate-600">{coverage.notes}</p> : null}
        {metadataEntries.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</p>
            <dl className="mt-2 space-y-1 text-sm text-slate-600">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="w-28 shrink-0 uppercase tracking-wide text-xs text-slate-500">{key}</dt>
                  <dd className="flex-1 break-words">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
      <div className="flex gap-3 md:flex-col">
        <Button type="button" variant="secondary" size="sm" icon={PencilSquareIcon} onClick={() => onEdit(coverage)}>
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={TrashIcon}
          className="text-rose-600"
          onClick={() => onDelete(coverage)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

CoverageRow.propTypes = {
  coverage: coverageShape.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

function CoveragePanel({ coverage, loading, status, onCreate, onEdit, onDelete }) {
  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Coverage</p>
          <h3 className="text-2xl font-semibold text-primary">Zones & SLA commitments</h3>
          <p className="text-sm text-slate-600">
            Map your guaranteed response windows and crew capacity to each service zone Fixnado routes to your organisation.
          </p>
        </div>
        <Button type="button" variant="secondary" icon={PlusIcon} onClick={onCreate}>
          Add coverage
        </Button>
      </div>

      <FormStatus status={status} />

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
          <Spinner className="h-5 w-5" /> Loading coverage…
        </div>
      ) : coverage.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/40 p-6 text-sm text-slate-500">
          No coverage commitments recorded yet. Add your core and standby zones so scheduling and automation stay compliant.
        </div>
      ) : (
        <div className="space-y-4">
          {coverage.map((entry) => (
            <CoverageRow key={entry.id} coverage={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}

CoveragePanel.propTypes = {
  coverage: PropTypes.arrayOf(coverageShape).isRequired,
  loading: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  }),
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

CoveragePanel.defaultProps = {
  loading: false,
  status: null
};

export default CoveragePanel;
