import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  GlobeAltIcon,
  MapIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ZoneDrawingMap from './ZoneDrawingMap.jsx';
import { Button, Card, Spinner, StatusPill, TextInput } from '../ui/index.js';
import {
  DEMAND_LEVELS,
  demandTone,
  determineCompliance
} from './zoneManagementUtils.js';

const locationTone = {
  resolved: 'success',
  pending: 'info',
  error: 'danger',
  unsupported: 'warning',
  idle: 'neutral'
};

function formatLocationStatus(location) {
  if (location.status === 'resolved') {
    const accuracy = location.coords?.accuracy;
    const formattedAccuracy = typeof accuracy === 'number' ? accuracy.toFixed(0) : '30';
    return `Location locked • ±${formattedAccuracy}m`;
  }
  if (location.status === 'pending') {
    return 'Requesting location';
  }
  if (location.status === 'error') {
    return location.error ?? 'Location denied';
  }
  if (location.status === 'unsupported') {
    return 'Geolocation unavailable';
  }
  return 'Manual location';
}

export default function ZoneWorkspace({
  geometry,
  existingFeatures,
  focus,
  onGeometryChange,
  onClearDraft,
  onImportGeoJson,
  fileError,
  location,
  zonesState,
  selectedZoneId,
  onSelectZone,
  form,
  onFieldChange,
  onDemandChange,
  onSubmit,
  onReset,
  onDelete,
  saving,
  feedback
}) {
  const locationStatus = locationTone[location.status] ?? 'neutral';

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-primary/5">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Zone design</p>
              <h2 className="text-2xl font-semibold text-primary">Draw and enforce coverage polygons</h2>
              <p className="text-sm text-slate-600">
                Use the tools on the map to sketch a polygon or import GeoJSON. Each submission is validated against OpenStreetMap
                before persisting to ensure launch readiness and compliance parity across web and mobile.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button type="button" variant="secondary" size="sm" icon={ArrowsPointingInIcon} onClick={onClearDraft}>
                Clear draft
              </Button>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                <input type="file" accept=".json,.geojson" className="hidden" onChange={onImportGeoJson} />
                <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" /> Import GeoJSON
              </label>
              {fileError ? <span className="text-xs text-danger">{fileError}</span> : null}
            </div>
          </header>
          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/80">
            <ZoneDrawingMap
              draftGeometry={geometry}
              onGeometryChange={onGeometryChange}
              existingZones={existingFeatures}
              focus={focus}
            />
          </div>
          <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> OSM enforced
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700">
              <GlobeAltIcon className="h-4 w-4" aria-hidden="true" /> Tile source: Carto basemaps
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              <MapIcon className="h-4 w-4" aria-hidden="true" /> Draw polygons or import GeoJSON
            </span>
          </footer>
        </Card>

        <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-primary/5">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary">Existing zones</h3>
              <p className="text-sm text-slate-600">
                Select a zone to inspect metadata, OpenStreetMap verification details, and analytics snapshots. Updates can be drafted directly on the map before committing.
              </p>
            </div>
            <StatusPill tone={locationStatus}>{formatLocationStatus(location)}</StatusPill>
          </header>

          {zonesState.loading ? (
            <div className="flex min-h-[120px] items-center justify-center" role="status" aria-live="polite">
              <Spinner className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm text-slate-500">Loading service zones…</span>
            </div>
          ) : null}

          {zonesState.error ? (
            <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {zonesState.error}
            </div>
          ) : null}

          {!zonesState.loading && zonesState.data.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No service zones have been configured yet. Draw a polygon on the map and publish it to seed analytics and dispatch coverage.
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {zonesState.data.map((entry) => {
              const zone = entry.zone;
              const compliance = determineCompliance(zone);
              const analytics = entry.analytics;
              const isSelected = selectedZoneId === zone.id;
              return (
                <Card
                  key={zone.id}
                  interactive
                  padding="md"
                  className={`border ${isSelected ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-200'}`}
                  onClick={() => onSelectZone(entry)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-primary">{zone.name}</h4>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{zone.companyId}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${demandTone(zone.demandLevel)}`}
                        >
                          {zone.demandLevel}
                        </span>
                        <StatusPill
                          tone={
                            compliance.status === 'verified'
                              ? 'success'
                              : compliance.status === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {compliance.label}
                        </StatusPill>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-right text-xs text-slate-500">
                      <span>{analytics?.bookingTotals ? `${Object.values(analytics.bookingTotals).reduce((sum, value) => sum + Number(value ?? 0), 0)} bookings` : 'No bookings'}</span>
                      <span>{analytics?.metadata?.sampleSize ? `${analytics.metadata.sampleSize} samples` : 'No sample size'}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-primary/5">
          <header className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Zone metadata</p>
            <h3 className="text-lg font-semibold text-primary">
              {selectedZoneId ? 'Update zone details' : 'Publish a new service zone'}
            </h3>
            <p className="text-sm text-slate-600">
              Supply the zone name, operating company identifier, and optional operational metadata before persisting.
            </p>
          </header>

          <div className="mt-4 space-y-4">
            <TextInput
              label="Zone name"
              value={form.name}
              onChange={onFieldChange('name')}
              placeholder="eg. London Docklands"
              required
            />

            <TextInput
              label="Company ID"
              value={form.companyId}
              onChange={onFieldChange('companyId')}
              placeholder="UUID of the operating company"
              required
              hint="Locate the company UUID from the enterprise panel or onboarding records."
            />

            <div className="space-y-2">
              <span className="text-sm font-semibold text-primary">Demand level</span>
              <div className="flex flex-wrap gap-3">
                {DEMAND_LEVELS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onDemandChange(option.value)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      form.demandLevel === option.value
                        ? option.tone
                        : 'border border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CheckCircleIcon
                      className={`h-4 w-4 ${form.demandLevel === option.value ? 'opacity-100' : 'opacity-40'}`}
                      aria-hidden="true"
                    />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <TextInput
              label="Operational tags"
              value={form.tags}
              onChange={onFieldChange('tags')}
              placeholder="hvac, solar, 24-7-response"
              hint="Comma-separated list to accelerate analytics filtering and service linking."
            />

            <label className="fx-field">
              <span className="fx-field__label">Ops notes</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={onFieldChange('notes')}
                className="fx-text-input"
                placeholder="Playbook references, staging instructions, or guardrail notes."
              />
            </label>

            {feedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  feedback.tone === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-danger/40 bg-danger/10 text-danger'
                }`}
              >
                {feedback.message}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" loading={saving} icon={ShieldCheckIcon} iconPosition="start">
                  {selectedZoneId ? 'Update zone' : 'Persist zone'}
                </Button>
                <Button type="button" variant="ghost" icon={ArrowPathIcon} onClick={onReset}>
                  Reset form
                </Button>
                {selectedZoneId ? (
                  <Button type="button" variant="danger" icon={TrashIcon} onClick={onDelete}>
                    Delete zone
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">
                Submissions require an authenticated operations admin session. Tokens rotate every 8 hours.
              </p>
            </div>
          </div>
        </Card>
      </form>
    </section>
  );
}

ZoneWorkspace.propTypes = {
  geometry: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  existingFeatures: PropTypes.shape({
    type: PropTypes.string,
    features: PropTypes.array
  }).isRequired,
  focus: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    accuracy: PropTypes.number
  }),
  onGeometryChange: PropTypes.func.isRequired,
  onClearDraft: PropTypes.func.isRequired,
  onImportGeoJson: PropTypes.func.isRequired,
  fileError: PropTypes.string,
  location: PropTypes.shape({
    status: PropTypes.string,
    coords: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number,
      accuracy: PropTypes.number
    }),
    error: PropTypes.string
  }).isRequired,
  zonesState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  selectedZoneId: PropTypes.string,
  onSelectZone: PropTypes.func.isRequired,
  form: PropTypes.shape({
    name: PropTypes.string,
    companyId: PropTypes.string,
    demandLevel: PropTypes.string,
    tags: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onDemandChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool,
  feedback: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'danger']),
    message: PropTypes.string
  })
};

ZoneWorkspace.defaultProps = {
  geometry: null,
  focus: null,
  fileError: null,
  selectedZoneId: null,
  onDelete: undefined,
  saving: false,
  feedback: null
};
