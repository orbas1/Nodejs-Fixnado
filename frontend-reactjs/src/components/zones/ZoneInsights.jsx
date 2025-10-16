import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Spinner, StatusPill } from '../ui/index.js';
import { demandTone, formatDateTime } from './zoneManagementUtils.js';

function BookingStatusList({ entries }) {
  if (!entries.length) {
    return (
      <li className="rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-center text-slate-500">
        No bookings captured for this zone yet.
      </li>
    );
  }

  return entries.map((entry) => (
    <li key={entry.status} className="flex items-center justify-between rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-500">
      <span className="font-semibold uppercase tracking-wide text-slate-600">{entry.status}</span>
      <span className="font-semibold text-primary">{entry.count.toLocaleString()}</span>
    </li>
  ));
}

BookingStatusList.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};

function CoverageFeedback({ feedback }) {
  if (!feedback) {
    return null;
  }

  const toneClasses =
    feedback.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-danger/40 bg-danger/10 text-danger';

  return (
    <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}>{feedback.message}</div>
  );
}

CoverageFeedback.propTypes = {
  feedback: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'danger']),
    message: PropTypes.string
  })
};

CoverageFeedback.defaultProps = {
  feedback: null
};

export default function ZoneInsights({
  zone,
  compliance,
  analytics,
  bookingStatusEntries,
  totalBookings,
  serviceCatalogueState,
  zoneServicesState,
  serviceFeedback,
  onOpenCoverageEditor,
  onRemoveCoverage,
  onOpenLink,
  coverageSaving
}) {
  if (!zone) {
    return (
      <section>
        <Card className="border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-600">
          Select a zone above to review analytics, manage service attachments, and open specialist dashboards in new tabs.
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Operational profile</p>
              <h3 className="text-xl font-semibold text-primary">{zone.zone.name}</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{zone.zone.id}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <StatusPill
                tone={
                  compliance?.status === 'verified' ? 'success' : compliance?.status === 'pending' ? 'warning' : 'danger'
                }
              >
                {compliance?.label ?? 'Pending verification'}
              </StatusPill>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={ArrowTopRightOnSquareIcon}
                onClick={() => onOpenLink(`/search?zoneId=${zone.zone.id}`)}
              >
                Open in explorer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={ArrowTopRightOnSquareIcon}
                onClick={() => onOpenLink(`/admin/dashboard?panel=zones&zoneId=${zone.zone.id}`)}
              >
                Open admin view
              </Button>
            </div>
          </header>
          <dl className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-700">Company</dt>
              <dd className="break-all text-slate-500">{zone.zone.companyId}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Demand level</dt>
              <dd>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${demandTone(zone.zone.demandLevel)}`}
                >
                  {zone.zone.demandLevel}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Created</dt>
              <dd>{formatDateTime(zone.zone.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Last updated</dt>
              <dd>{formatDateTime(zone.zone.updatedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Centroid</dt>
              <dd>
                {zone.zone.centroid?.coordinates
                  ? `${zone.zone.centroid.coordinates[1].toFixed(4)}, ${zone.zone.centroid.coordinates[0].toFixed(4)}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Bounding box</dt>
              <dd>
                {zone.zone.boundingBox
                  ? `${zone.zone.boundingBox.south?.toFixed?.(4) ?? '—'}, ${
                      zone.zone.boundingBox.west?.toFixed?.(4) ?? '—'
                    } → ${zone.zone.boundingBox.north?.toFixed?.(4) ?? '—'}, ${
                      zone.zone.boundingBox.east?.toFixed?.(4) ?? '—'
                    }`
                  : '—'}
              </dd>
            </div>
          </dl>
          {Array.isArray(zone.zone.metadata?.tags) && zone.zone.metadata.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {zone.zone.metadata.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {zone.zone.metadata?.notes ? (
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{zone.zone.metadata.notes}</div>
          ) : null}
        </Card>

        <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Coverage orchestration</p>
              <h3 className="text-lg font-semibold text-primary">Linked services</h3>
              <p className="text-sm text-slate-600">
                Attach services to govern dispatch eligibility, priority, and escalation windows for crews operating in this zone.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={PlusIcon}
              onClick={() => onOpenCoverageEditor(null)}
              disabled={serviceCatalogueState.loading || serviceCatalogueState.data.length === 0 || coverageSaving}
            >
              Add coverage
            </Button>
          </header>

          {serviceCatalogueState.loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500" role="status">
              <Spinner className="h-4 w-4 text-primary" /> Loading service catalogue…
            </div>
          ) : null}

          {serviceCatalogueState.error ? (
            <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {serviceCatalogueState.error}
            </div>
          ) : null}

          {!serviceCatalogueState.loading && serviceCatalogueState.data.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No eligible services detected for this company. Configure the catalogue from Service Admin to link coverage.
            </p>
          ) : null}

          {zoneServicesState.error ? (
            <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {zoneServicesState.error}
            </div>
          ) : null}

          <CoverageFeedback feedback={serviceFeedback} />

          <ul className="mt-4 space-y-4">
            {zoneServicesState.loading ? (
              <li className="flex items-center gap-2 text-sm text-slate-500" role="status">
                <Spinner className="h-4 w-4 text-primary" /> Loading service coverage…
              </li>
            ) : null}
            {zoneServicesState.data.map((coverage) => (
              <li key={coverage.id} className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm shadow-primary/10">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-primary">{coverage.service?.title ?? 'Service'}</h4>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{coverage.coverageType}</p>
                    <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-slate-600">Priority</dt>
                        <dd>{coverage.priority ?? 'Standard'}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-600">Effective window</dt>
                        <dd>
                          {coverage.effectiveFrom ? formatDateTime(coverage.effectiveFrom) : 'Immediate'} →{' '}
                          {coverage.effectiveTo ? formatDateTime(coverage.effectiveTo) : 'Open'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-600">Coverage ID</dt>
                        <dd className="break-all">{coverage.id}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-600">Service ID</dt>
                        <dd className="break-all">{coverage.serviceId}</dd>
                      </div>
                    </dl>
                    {coverage.metadata?.notes ? (
                      <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{coverage.metadata.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {coverage.metadata?.status === 'pending-approval' ? (
                      <StatusPill tone="warning" className="w-fit">
                        <ExclamationTriangleIcon className="mr-1 h-4 w-4" aria-hidden="true" /> Pending approval
                      </StatusPill>
                    ) : null}
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={PencilSquareIcon}
                        onClick={() => onOpenCoverageEditor(coverage)}
                        disabled={coverageSaving}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon={TrashIcon}
                        onClick={() => onRemoveCoverage(coverage)}
                        disabled={coverageSaving}
                      >
                        Remove
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon={ArrowTopRightOnSquareIcon}
                        onClick={() => onOpenLink(`/admin/dashboard?panel=services&serviceId=${coverage.serviceId}`)}
                      >
                        Service view
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Analytics snapshot</p>
              <h3 className="text-lg font-semibold text-primary">Latest performance</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={ArrowTopRightOnSquareIcon}
              onClick={() => onOpenLink(`/admin/dashboard?panel=analytics&zoneId=${zone.zone.id}`)}
            >
              Analytics hub
            </Button>
          </header>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total bookings</dt>
              <dd className="text-lg font-semibold text-primary">{totalBookings.toLocaleString()}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">SLA breaches</dt>
              <dd className="text-lg font-semibold text-primary">{analytics?.slaBreaches ?? 0}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Avg acceptance</dt>
              <dd className="text-lg font-semibold text-primary">
                {analytics?.averageAcceptanceMinutes ? `${analytics.averageAcceptanceMinutes.toFixed(1)} mins` : 'n/a'}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sample size</dt>
              <dd className="text-lg font-semibold text-primary">
                {analytics?.metadata?.sampleSize ? analytics.metadata.sampleSize.toLocaleString() : '—'}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-2 text-xs text-slate-500">
            <BookingStatusList entries={bookingStatusEntries} />
          </ul>
        </Card>

        <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
          <header>
            <h3 className="text-lg font-semibold text-primary">Quick actions</h3>
            <p className="mt-1 text-sm text-slate-600">
              Launch downstream dashboards in a new tab to coordinate service teams and compliance stakeholders.
            </p>
          </header>
          <div className="mt-4 space-y-3">
            <Button
              type="button"
              variant="ghost"
              icon={ArrowTopRightOnSquareIcon}
              onClick={() => onOpenLink(`/admin/dashboard?panel=dispatch&zoneId=${zone.zone.id}`)}
            >
              Open dispatch board
            </Button>
            <Button
              type="button"
              variant="ghost"
              icon={ArrowTopRightOnSquareIcon}
              onClick={() => onOpenLink(`/admin/dashboard?panel=inventory&zoneId=${zone.zone.id}`)}
            >
              Inspect inventory readiness
            </Button>
            <Button
              type="button"
              variant="ghost"
              icon={ArrowTopRightOnSquareIcon}
              onClick={() => onOpenLink(`/api/zones/${zone.zone.id}`)}
            >
              Download zone JSON
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

ZoneInsights.propTypes = {
  zone: PropTypes.shape({
    zone: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      companyId: PropTypes.string,
      demandLevel: PropTypes.string,
      metadata: PropTypes.object,
      centroid: PropTypes.shape({ coordinates: PropTypes.array }),
      boundingBox: PropTypes.object,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string
    }).isRequired,
    analytics: PropTypes.object
  }),
  compliance: PropTypes.shape({
    status: PropTypes.string,
    label: PropTypes.string
  }),
  analytics: PropTypes.object,
  bookingStatusEntries: PropTypes.arrayOf(
    PropTypes.shape({ status: PropTypes.string.isRequired, count: PropTypes.number.isRequired })
  ).isRequired,
  totalBookings: PropTypes.number.isRequired,
  serviceCatalogueState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  zoneServicesState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  serviceFeedback: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'danger']),
    message: PropTypes.string
  }),
  onOpenCoverageEditor: PropTypes.func.isRequired,
  onRemoveCoverage: PropTypes.func.isRequired,
  onOpenLink: PropTypes.func.isRequired,
  coverageSaving: PropTypes.bool
};

ZoneInsights.defaultProps = {
  zone: null,
  compliance: null,
  analytics: null,
  serviceFeedback: null,
  coverageSaving: false
};
