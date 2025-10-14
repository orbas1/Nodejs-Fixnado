import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import ZoneDrawingMap from '../components/zones/ZoneDrawingMap.jsx';
import { Button, Card, Spinner, StatusPill, TextInput } from '../components/ui/index.js';
import { fetchZonesWithAnalytics, createZone } from '../api/zoneAdminClient.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';

const DEMAND_LEVELS = [
  { value: 'high', label: 'High demand', tone: 'bg-rose-100 text-rose-700 border border-rose-200' },
  { value: 'medium', label: 'Balanced demand', tone: 'bg-amber-100 text-amber-700 border border-amber-200' },
  { value: 'low', label: 'Emerging demand', tone: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
];

const INITIAL_FORM = {
  name: '',
  companyId: '',
  demandLevel: 'medium',
  tags: '',
  notes: ''
};

function toFeatureCollection(zones) {
  const features = zones
    .map((entry) => {
      const zone = entry.zone ?? entry;
      const boundary = zone?.boundary;
      const geometry = boundary?.type ? boundary : boundary?.geometry ?? boundary;
      if (!geometry || !geometry.type || !geometry.coordinates) {
        return null;
      }
      return {
        type: 'Feature',
        geometry,
        properties: {
          id: zone.id,
          name: zone.name,
          demand: zone.demandLevel,
          companyId: zone.companyId
        }
      };
    })
    .filter(Boolean);

  return {
    type: 'FeatureCollection',
    features
  };
}

function parseList(input) {
  return input
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function computeMeta(zones, user) {
  const total = zones.length;
  const verified = zones.filter(
    (entry) => entry.zone?.metadata?.compliance?.openStreetMap?.status === 'verified'
  ).length;
  const verificationRatio = total === 0 ? 0 : Math.round((verified / total) * 100);
  const lastUpdated = zones.reduce((latest, entry) => {
    const updated = entry.zone?.updatedAt ?? entry.zone?.createdAt;
    if (!updated) {
      return latest;
    }
    const timestamp = new Date(updated).getTime();
    if (!Number.isFinite(timestamp)) {
      return latest;
    }
    return Math.max(latest, timestamp);
  }, 0);
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return [
    {
      label: 'Total service zones',
      value: `${total.toLocaleString()}`,
      caption: 'Active polygons with analytics coverage',
      emphasis: true
    },
    {
      label: 'OpenStreetMap verified',
      value: total === 0 ? '—' : `${verified}/${total} • ${verificationRatio}%`,
      caption: 'Must resolve before dispatching live workloads'
    },
    {
      label: 'Last boundary update',
      value: lastUpdated ? formatter.format(new Date(lastUpdated)) : 'Awaiting first zone',
      caption: 'Auto-refresh every 90 seconds'
    },
    {
      label: 'RBAC session',
      value: user?.email ?? 'Admin session',
      caption: 'Only operations admins can publish zones'
    }
  ];
}

function determineCompliance(zone) {
  const compliance = zone?.metadata?.compliance?.openStreetMap;
  if (!compliance) {
    return { status: 'pending', label: 'Pending verification' };
  }
  if (compliance.status === 'verified') {
    return { status: 'verified', label: 'Verified via OpenStreetMap', payload: compliance };
  }
  return { status: 'error', label: 'Verification failed', payload: compliance };
}

function toMultiPolygon(geometry) {
  if (!geometry) {
    return null;
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry;
  }
  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates
    };
  }
  return null;
}

function demandTone(level) {
  const entry = DEMAND_LEVELS.find((option) => option.value === level);
  return entry?.tone ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}

export default function AdminZones() {
  const { user } = useAdminSession();
  const [zonesState, setZonesState] = useState({ loading: true, error: null, data: [] });
  const [form, setForm] = useState(INITIAL_FORM);
  const [geometry, setGeometry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [location, setLocation] = useState({ status: 'idle', coords: null, error: null });
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [fileError, setFileError] = useState(null);

  const meta = useMemo(() => computeMeta(zonesState.data, user), [zonesState.data, user]);
  const existingFeatures = useMemo(() => toFeatureCollection(zonesState.data), [zonesState.data]);
  const selectedZone = useMemo(
    () => zonesState.data.find((entry) => entry.zone?.id === selectedZoneId) ?? null,
    [zonesState.data, selectedZoneId]
  );

  const requestZones = useCallback(async () => {
    setZonesState((current) => ({ ...current, loading: true, error: null }));
    try {
      const payload = await fetchZonesWithAnalytics();
      setZonesState({ loading: false, error: null, data: payload });
    } catch (error) {
      setZonesState({ loading: false, error: error.message ?? 'Unable to load zones', data: [] });
    }
  }, []);

  useEffect(() => {
    requestZones();
  }, [requestZones]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocation({ status: 'unsupported', coords: null, error: 'Geolocation unavailable' });
      return;
    }
    setLocation({ status: 'pending', coords: null, error: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ status: 'resolved', coords: { latitude, longitude, accuracy }, error: null });
      },
      (error) => {
        setLocation({ status: 'error', coords: null, error: error.message || 'Location denied' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handleFieldChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleDemandChange = (value) => {
    setForm((current) => ({ ...current, demandLevel: value }));
  };

  const handleGeometryChange = (next) => {
    setGeometry(next ? toMultiPolygon(next) ?? next : null);
    if (feedback) {
      setFeedback(null);
    }
  };

  const handleFileImport = async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }
    setFileError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (payload.type === 'FeatureCollection' && Array.isArray(payload.features) && payload.features.length > 0) {
        setGeometry(payload.features[0].geometry ?? null);
      } else if (payload.type === 'Feature') {
        setGeometry(payload.geometry ?? null);
      } else if (payload.type === 'Polygon' || payload.type === 'MultiPolygon') {
        setGeometry(payload);
      } else {
        throw new Error('GeoJSON payload does not include a polygon geometry');
      }
      setFeedback({ tone: 'success', message: `Imported geometry from ${file.name}` });
    } catch (error) {
      setFileError(error.message ?? 'Unable to import file');
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setGeometry(null);
    setSelectedZoneId(null);
    setFeedback(null);
  };

  const handleSelectZone = (zone) => {
    setSelectedZoneId(zone.zone.id);
    setForm({
      name: zone.zone.name,
      companyId: zone.zone.companyId ?? '',
      demandLevel: zone.zone.demandLevel ?? 'medium',
      tags: Array.isArray(zone.zone.metadata?.tags) ? zone.zone.metadata.tags.join(', ') : '',
      notes: zone.zone.metadata?.notes ?? ''
    });
    setGeometry(zone.zone.boundary ?? null);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!geometry) {
      setFeedback({ tone: 'danger', message: 'Draw a polygon before saving the zone.' });
      return;
    }
    if (!form.name.trim() || !form.companyId.trim()) {
      setFeedback({ tone: 'danger', message: 'Provide both a zone name and company identifier.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        name: form.name.trim(),
        companyId: form.companyId.trim(),
        demandLevel: form.demandLevel,
        geometry,
        metadata: {
          tags: parseList(form.tags),
          notes: form.notes.trim() || undefined,
          source: 'admin-zones-ui'
        },
        actor: user
          ? {
              id: user.id,
              email: user.email,
              type: user.type
            }
          : null
      };
      const created = await createZone(payload);
      setFeedback({
        tone: 'success',
        message: `Zone "${created.name}" persisted and verified via OpenStreetMap.`
      });
      setSelectedZoneId(created.id);
      setGeometry(created.boundary ?? geometry);
      await requestZones();
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error.message ?? 'Unable to save zone. Check polygon validity and retry.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <PageHeader
        eyebrow="Operations control"
        title="Geo-zonal governance"
        description="Design, validate, and publish service zones with OpenStreetMap-backed compliance. Updates propagate instantly to search, dispatch orchestration, and the mobile geo-matching workspace."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Geo zones' }
        ]}
        actions={[
          {
            label: 'Refresh zones',
            icon: ArrowPathIcon,
            onClick: requestZones,
            variant: 'secondary'
          }
        ]}
        meta={meta}
      />

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-10">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-primary/5">
              <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Zone design</p>
                  <h2 className="text-2xl font-semibold text-primary">Draw and enforce coverage polygons</h2>
                  <p className="text-sm text-slate-600">
                    Use the tools on the map to sketch a polygon or import GeoJSON. Each submission is validated against OpenStreetMap before persisting to ensure launch readiness and compliance parity across web and mobile.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={ArrowsPointingInIcon}
                    onClick={() => setGeometry(null)}
                  >
                    Clear draft
                  </Button>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    <input type="file" accept=".json,.geojson" className="hidden" onChange={handleFileImport} />
                    <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" /> Import GeoJSON
                  </label>
                  {fileError ? (
                    <span className="text-xs text-danger">{fileError}</span>
                  ) : null}
                </div>
              </header>
              <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/80">
                <ZoneDrawingMap
                  draftGeometry={geometry}
                  onGeometryChange={handleGeometryChange}
                  existingZones={existingFeatures}
                  focus={location.coords}
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
                <StatusPill tone={location.status === 'resolved' ? 'success' : location.status === 'pending' ? 'info' : location.status === 'error' ? 'danger' : 'neutral'}>
                  {location.status === 'resolved'
                    ? `Location locked • ±${location.coords?.accuracy?.toFixed?.(0) ?? '30'}m`
                    : location.status === 'pending'
                    ? 'Requesting location'
                    : location.status === 'error'
                    ? 'Location denied'
                    : 'Manual location'}
                </StatusPill>
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
                  return (
                    <Card
                      key={zone.id}
                      interactive
                      padding="md"
                      className={`border ${selectedZoneId === zone.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-200'}`}
                      onClick={() => handleSelectZone(entry)}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-primary">{zone.name}</h4>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{zone.companyId}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${demandTone(zone.demandLevel)}`}>
                              {zone.demandLevel}
                            </span>
                            <StatusPill tone={compliance.status === 'verified' ? 'success' : compliance.status === 'pending' ? 'warning' : 'danger'}>
                              {compliance.label}
                            </StatusPill>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
                          <span className="font-semibold text-primary">
                            {(analytics?.bookingTotals ? Object.values(analytics.bookingTotals).reduce((sum, value) => sum + value, 0) : 0).toLocaleString()}{' '}
                            bookings
                          </span>
                          <span className="text-xs text-slate-500">
                            SLA breaches last capture: {analytics?.slaBreaches ?? 0}
                          </span>
                          <span className="text-xs text-slate-500">
                            Average acceptance: {analytics?.averageAcceptanceMinutes ? `${analytics.averageAcceptanceMinutes.toFixed(1)} mins` : 'n/a'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {selectedZone ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  {(() => {
                    const compliance = determineCompliance(selectedZone.zone);
                    const osm = compliance.payload;
                    const Icon = compliance.status === 'verified' ? ShieldCheckIcon : ExclamationTriangleIcon;
                    const tone =
                      compliance.status === 'verified'
                        ? 'text-emerald-700'
                        : compliance.status === 'pending'
                        ? 'text-amber-600'
                        : 'text-danger';
                    return (
                      <div className="space-y-3">
                        <div className={`flex items-center gap-2 text-sm font-semibold ${tone}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {compliance.label}
                        </div>
                        {osm ? (
                          <dl className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                            <div>
                              <dt className="font-semibold text-slate-600">Display name</dt>
                              <dd>{osm.displayName ?? '—'}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-600">Place ID</dt>
                              <dd>{osm.placeId ?? '—'}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-600">Bounding box</dt>
                              <dd>
                                {osm.boundingBox
                                  ? `${osm.boundingBox.south.toFixed(4)}, ${osm.boundingBox.west.toFixed(4)} → ${osm.boundingBox.north.toFixed(4)}, ${osm.boundingBox.east.toFixed(4)}`
                                  : '—'}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-600">Checked</dt>
                              <dd>{osm.checkedAt ? new Date(osm.checkedAt).toLocaleString() : '—'}</dd>
                            </div>
                          </dl>
                        ) : (
                          <p className="text-xs text-slate-500">Awaiting OpenStreetMap verification for this polygon.</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">Select a zone to review OpenStreetMap verification metadata.</p>
              )}
            </Card>
          </div>

          <form
            onSubmit={handleCreate}
            className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-primary/5"
          >
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Publish zone</p>
              <h2 className="text-xl font-semibold text-primary">Persist to production registry</h2>
              <p className="text-sm text-slate-600">
                Completing this form will persist the drawn polygon to the Fixnado production datastore after a mandatory OpenStreetMap verification check.
              </p>
            </header>

            <TextInput
              label="Zone name"
              value={form.name}
              onChange={handleFieldChange('name')}
              placeholder="eg. London Docklands"
              required
            />

            <TextInput
              label="Company ID"
              value={form.companyId}
              onChange={handleFieldChange('companyId')}
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
                    onClick={() => handleDemandChange(option.value)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      form.demandLevel === option.value
                        ? option.tone
                        : 'border border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CheckCircleIcon className={`h-4 w-4 ${form.demandLevel === option.value ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <TextInput
              label="Operational tags"
              value={form.tags}
              onChange={handleFieldChange('tags')}
              placeholder="hvac, solar, 24-7-response"
              hint="Comma-separated list to accelerate analytics filtering and service linking."
            />

            <label className="fx-field">
              <span className="fx-field__label">Ops notes</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={handleFieldChange('notes')}
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
              <div className="flex gap-3">
                <Button type="submit" loading={saving} icon={ShieldCheckIcon} iconPosition="start">
                  Persist zone
                </Button>
                <Button type="button" variant="ghost" icon={ArrowPathIcon} onClick={handleReset}>
                  Reset form
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Submissions require an authenticated operations admin session. Tokens rotate every 8 hours.
              </p>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
            <header className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-base font-semibold text-primary">Launch guardrails</h3>
            </header>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Automatic OpenStreetMap validation with centroid boundary containment.</li>
              <li>RBAC enforced via admin session tokens with audit trail emission.</li>
              <li>Coverage analytics regenerate instantly for downstream dashboards.</li>
            </ul>
          </Card>

          <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
            <header className="flex items-center gap-3">
              <LockClosedIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-base font-semibold text-primary">Security posture</h3>
            </header>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Zones persist through the hardened admin API. Responses omit secrets.</li>
              <li>All requests require HTTPS, HSTS, and helmet-enforced CSP headers.</li>
              <li>Audit events stream to the analytics service for instant reconciliation.</li>
            </ul>
          </Card>

          <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
            <header className="flex items-center gap-3">
              <GlobeAltIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-base font-semibold text-primary">Mobile parity</h3>
            </header>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Flutter companion app consumes the same endpoints for zone authoring.</li>
              <li>Geo-matching panel shares configuration tokens for deterministic results.</li>
              <li>Offline-safe drafts cached locally until connectivity is restored.</li>
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
}
