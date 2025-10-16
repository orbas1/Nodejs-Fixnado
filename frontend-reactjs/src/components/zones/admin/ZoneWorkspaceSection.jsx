import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsPointingInIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  MapIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, Spinner, StatusPill, TextInput } from '../../ui/index.js';
import ZoneDrawingMap from '../ZoneDrawingMap.jsx';

function formatLocationBadge(location) {
  if (location.status === 'resolved') {
    const accuracy = location.coords?.accuracy;
    const accuracyLabel = accuracy ? `±${accuracy.toFixed?.(0) ?? accuracy}m` : 'High accuracy';
    return { tone: 'success', label: `Location locked • ${accuracyLabel}` };
  }
  if (location.status === 'pending') {
    return { tone: 'info', label: 'Requesting location' };
  }
  if (location.status === 'error') {
    return { tone: 'danger', label: location.error ?? 'Location denied' };
  }
  if (location.status === 'unsupported') {
    return { tone: 'warning', label: 'Geolocation unavailable' };
  }
  return { tone: 'neutral', label: 'Manual location' };
}

function AnalyticsSummary({ analytics }) {
  if (!analytics) {
    return null;
  }

  const bookingTotals = Object.values(analytics.bookingTotals || {}).reduce((sum, value) => sum + value, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <h4 className="text-sm font-semibold text-primary">Analytics snapshot</h4>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Bookings</p>
          <p className="text-lg font-semibold text-primary">{bookingTotals}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">SLA breaches</p>
          <p className="text-lg font-semibold text-primary">{analytics.slaBreaches ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Avg acceptance</p>
          <p className="text-lg font-semibold text-primary">
            {analytics.averageAcceptanceMinutes ? `${analytics.averageAcceptanceMinutes.toFixed(1)} mins` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

AnalyticsSummary.propTypes = {
  analytics: PropTypes.shape({
    bookingTotals: PropTypes.object,
    slaBreaches: PropTypes.number,
    averageAcceptanceMinutes: PropTypes.number
  })
};

AnalyticsSummary.defaultProps = {
  analytics: null
};

export default function ZoneWorkspaceSection({
  id,
  geometry,
  existingZones,
  onGeometryChange,
  onClearGeometry,
  onFileImport,
  fileError,
  location,
  onRequestLocation,
  zonesState,
  onSelectZone,
  selectedZoneId,
  selectedZone,
  selectedMetadata,
  selectedTags,
  allowedRoleLabels,
  fallbackServiceIds,
  dispatchSummary,
  workspaceSlug,
  contactDetails,
  selectedAnalytics,
  onManageServices,
  onRefreshAnalytics,
  analyticsRefreshing,
  onDownloadGeoJson,
  onOpenInWorkspace,
  onDeleteZone,
  deleting,
  demandTone,
  determineCompliance,
  form,
  onFieldChange,
  onDemandChange,
  demandLevels,
  onVisibilityChange,
  visibilityOptions,
  onRoleToggle,
  roleOptions,
  roleLabels,
  formatRoleLabel,
  onBooleanToggle,
  feedback,
  isEditing,
  saving,
  onSubmit,
  onReset
}) {
  const locationBadge = formatLocationBadge(location);

  return (
    <section id={id} className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Zone workspace</p>
        <h2 className="text-2xl font-semibold text-primary">Draw, govern, and publish service zones</h2>
        <p className="text-sm text-slate-600">
          Maintain a live catalogue of polygons, metadata, and automation policies. Draw directly on the map, import GeoJSON
          payloads, and update dispatch settings with full audit coverage.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-primary/5">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Zone design</p>
                <h3 className="text-2xl font-semibold text-primary">Draw and enforce coverage polygons</h3>
                <p className="text-sm text-slate-600">
                  Use the tools on the map to sketch a polygon or import GeoJSON. Each submission is validated against
                  OpenStreetMap before persisting to ensure launch readiness and compliance parity across web and mobile.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={ArrowsPointingInIcon}
                  onClick={onClearGeometry}
                >
                  Clear draft
                </Button>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  <input type="file" accept=".json,.geojson" className="hidden" onChange={onFileImport} />
                  <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" /> Import GeoJSON
                </label>
                {fileError ? <span className="text-xs text-danger">{fileError}</span> : null}
              </div>
            </header>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/80">
              <ZoneDrawingMap
                draftGeometry={geometry}
                onGeometryChange={onGeometryChange}
                existingZones={existingZones}
                focus={location.coords}
              />
            </div>

            <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                <GlobeAltIcon className="h-4 w-4" aria-hidden="true" /> Tile source: Carto basemaps
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                <MapIcon className="h-4 w-4" aria-hidden="true" /> Draw polygons or import GeoJSON
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={onRequestLocation}>
                Re-centre to my location
              </Button>
            </footer>
          </Card>

          <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-primary/5">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">Existing zones</h3>
                <p className="text-sm text-slate-600">
                  Select a zone to inspect metadata, OpenStreetMap verification details, and analytics snapshots. Updates can be
                  drafted directly on the map before committing.
                </p>
              </div>
              <StatusPill tone={locationBadge.tone}>{locationBadge.label}</StatusPill>
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
                No service zones have been configured yet. Draw a polygon on the map and publish it to seed analytics and
                dispatch coverage.
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {zonesState.data.map((entry) => {
                const zone = entry.zone;
                const compliance = determineCompliance(zone);
                const analytics = entry.analytics;
                const totalBookings = analytics?.bookingTotals
                  ? Object.values(analytics.bookingTotals).reduce((sum, value) => sum + value, 0)
                  : 0;
                return (
                  <Card
                    key={zone.id}
                    interactive
                    padding="md"
                    className={`border ${selectedZoneId === zone.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-200'}`}
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
                      <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
                        <span className="font-semibold text-primary">{totalBookings.toLocaleString()} bookings</span>
                        <span className="text-xs text-slate-500">SLA breaches last capture: {analytics?.slaBreaches ?? 0}</span>
                        <span className="text-xs text-slate-500">
                          Average acceptance:{' '}
                          {analytics?.averageAcceptanceMinutes ? `${analytics.averageAcceptanceMinutes.toFixed(1)} mins` : 'n/a'}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {selectedZone ? (
              <div className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 text-sm text-slate-600">
                {(() => {
                  const compliance = determineCompliance(selectedZone);
                  const osm = compliance.payload;
                  const Icon = compliance.status === 'verified' ? ShieldCheckIcon : ExclamationTriangleIcon;
                  const tone =
                    compliance.status === 'verified'
                      ? 'text-emerald-700'
                      : compliance.status === 'pending'
                        ? 'text-amber-600'
                        : 'text-danger';
                  return (
                    <div className={`space-y-3 text-sm font-semibold ${tone}`}>
                      <div className="flex items-center gap-2">
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

                {selectedMetadata.heroImageUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <img
                      src={selectedMetadata.heroImageUrl}
                      alt={selectedMetadata.heroImageAlt || `${selectedZone.name} hero`}
                      className="h-48 w-full object-cover"
                    />
                    {selectedMetadata.heroImageAlt ? (
                      <p className="bg-slate-100 px-4 py-2 text-xs text-slate-500">{selectedMetadata.heroImageAlt}</p>
                    ) : null}
                  </div>
                ) : null}

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-600">Company</dt>
                    <dd className="text-slate-500">{selectedZone.companyId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Demand level</dt>
                    <dd className="capitalize text-slate-500">{selectedZone.demandLevel ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Visibility</dt>
                    <dd className="text-slate-500">{selectedMetadata.visibilityLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Operational tags</dt>
                    <dd>
                      {selectedTags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedTags.map((tag, index) => (
                            <span
                              key={`${tag}-${index}`}
                              className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Role allowance</dt>
                    <dd>
                      {allowedRoleLabels.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {allowedRoleLabels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">All authenticated roles</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Operating hours</dt>
                    <dd className="text-slate-500">{selectedMetadata.operatingHours ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Dispatch contact</dt>
                    <dd className="text-slate-500">{contactDetails || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Dispatch automation</dt>
                    <dd className="text-slate-500">{dispatchSummary.join(' • ')}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Fallback services</dt>
                    <dd>
                      {fallbackServiceIds.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {fallbackServiceIds.map((serviceId) => (
                            <span
                              key={serviceId}
                              className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                            >
                              {serviceId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Notes</dt>
                    <dd className="text-slate-500">{selectedMetadata.notes ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Workspace slug</dt>
                    <dd className="text-slate-500">{workspaceSlug || '—'}</dd>
                  </div>
                </dl>

                <AnalyticsSummary analytics={selectedAnalytics} />

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" icon={Cog6ToothIcon} onClick={onManageServices}>
                    Manage services
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={ChartBarIcon}
                    loading={analyticsRefreshing}
                    onClick={onRefreshAnalytics}
                  >
                    Refresh analytics
                  </Button>
                  <Button type="button" variant="secondary" icon={DocumentArrowDownIcon} onClick={onDownloadGeoJson}>
                    Download GeoJSON
                  </Button>
                  <Button type="button" variant="ghost" icon={ArrowTopRightOnSquareIcon} onClick={onOpenInWorkspace}>
                    Open in dashboard
                  </Button>
                  <Button type="button" variant="danger" icon={TrashIcon} loading={deleting} onClick={onDeleteZone}>
                    Delete zone
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Select a zone to review OpenStreetMap verification metadata.</p>
            )}
          </Card>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-primary/5"
        >
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">
              {isEditing ? 'Edit zone' : 'Create zone'}
            </p>
            <h3 className="text-xl font-semibold text-primary">
              {isEditing ? `Update ${selectedZone?.name ?? 'selected zone'}` : 'Persist to production registry'}
            </h3>
            <p className="text-sm text-slate-600">
              {isEditing
                ? 'Adjust metadata, demand levels, contacts, or redraw the polygon. All updates are versioned and audited.'
                : 'Draw or import a polygon, add metadata, and publish it once compliance checks succeed.'}
            </p>
          </header>

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
              {demandLevels.map((option) => (
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
                  <CheckCircleIcon className={`h-4 w-4 ${form.demandLevel === option.value ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true" />
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

          <TextInput
            label="Hero image URL"
            value={form.heroImage}
            onChange={onFieldChange('heroImage')}
            placeholder="https://cdn.fixnado.com/zones/london.jpg"
            hint="Optional cover image for dashboards and mobile previews."
          />

          <TextInput
            label="Hero image alt text"
            value={form.heroImageAlt}
            onChange={onFieldChange('heroImageAlt')}
            placeholder="Accessible description for the hero image"
            hint="Surface helpful context for screen readers and analytics exports."
          />

          <TextInput
            label="Accent colour"
            value={form.accentColor}
            onChange={onFieldChange('accentColor')}
            placeholder="#0284c7"
            hint="Hex colour applied to map outlines and widgets."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="fx-field">
              <span className="fx-field__label">Visibility</span>
              <select className="fx-text-input" value={form.visibility} onChange={onVisibilityChange}>
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <TextInput
              label="Workspace slug"
              value={form.workspaceSlug}
              onChange={onFieldChange('workspaceSlug')}
              placeholder="zone-london-docklands"
              hint="Optional slug for deep links into analytics or partner tools."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput
              label="Dispatch contact"
              value={form.contactName}
              onChange={onFieldChange('contactName')}
              placeholder="Name"
            />
            <TextInput
              label="Contact email"
              type="email"
              value={form.contactEmail}
              onChange={onFieldChange('contactEmail')}
              placeholder="ops@company.com"
            />
            <TextInput
              label="Contact phone"
              value={form.contactPhone}
              onChange={onFieldChange('contactPhone')}
              placeholder="+44 20 1234 5678"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-primary">Role allowances</span>
            <p className="text-xs text-slate-500">
              Choose which authenticated roles can manage or dispatch work within this zone. Leave blank to allow any permitted
              admin role.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <Checkbox
                  key={role}
                  label={roleLabels[role] || formatRoleLabel(role)}
                  checked={form.allowedRoles.includes(role)}
                  onChange={onRoleToggle(role)}
                />
              ))}
            </div>
          </div>

          <TextInput
            label="Operating hours"
            value={form.operatingHours}
            onChange={onFieldChange('operatingHours')}
            placeholder="Mon-Fri 08:00-20:00, Sat 09:00-14:00"
            hint="Displayed to crews before accepting a dispatch."
          />

          <div className="space-y-2">
            <span className="text-sm font-semibold text-primary">Dispatch automation</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox
                label="Auto-dispatch to crews"
                description="Instantly routes bookings to the best matched crew."
                checked={form.autoDispatch}
                onChange={onBooleanToggle('autoDispatch')}
              />
              <Checkbox
                label="Require operations approval"
                description="Hold new jobs until an operations manager confirms."
                checked={form.requiresOpsApproval}
                onChange={onBooleanToggle('requiresOpsApproval')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Max concurrent jobs"
                type="number"
                min="1"
                value={form.maxConcurrentJobs}
                onChange={onFieldChange('maxConcurrentJobs')}
                placeholder="5"
                hint="Optional guardrail to prevent overloading local crews."
              />
              <TextInput
                label="SLA target (minutes)"
                type="number"
                min="1"
                value={form.slaMinutes}
                onChange={onFieldChange('slaMinutes')}
                placeholder="60"
                hint="Used for analytics alerts and dashboard breaching."
              />
            </div>
          </div>

          <TextInput
            label="Fallback service IDs"
            value={form.fallbackServices}
            onChange={onFieldChange('fallbackServices')}
            placeholder="service-id-a, service-id-b"
            hint="Comma-separated service IDs to try when no primary coverage is available."
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
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={saving} icon={ShieldCheckIcon} iconPosition="start">
                {isEditing ? 'Save changes' : 'Publish zone'}
              </Button>
              <Button type="button" variant="ghost" icon={ArrowPathIcon} onClick={onReset}>
                {isEditing ? 'Start new zone' : 'Reset form'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Submissions require an authenticated operations admin session. Tokens rotate every 8 hours.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

ZoneWorkspaceSection.propTypes = {
  id: PropTypes.string.isRequired,
  geometry: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  existingZones: PropTypes.object,
  onGeometryChange: PropTypes.func.isRequired,
  onClearGeometry: PropTypes.func.isRequired,
  onFileImport: PropTypes.func.isRequired,
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
  onRequestLocation: PropTypes.func.isRequired,
  zonesState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    data: PropTypes.array
  }).isRequired,
  onSelectZone: PropTypes.func.isRequired,
  selectedZoneId: PropTypes.string,
  selectedZone: PropTypes.object,
  selectedMetadata: PropTypes.shape({
    heroImageUrl: PropTypes.string,
    heroImageAlt: PropTypes.string,
    operatingHours: PropTypes.string,
    notes: PropTypes.string,
    visibilityLabel: PropTypes.string
  }),
  selectedTags: PropTypes.arrayOf(PropTypes.string),
  allowedRoleLabels: PropTypes.arrayOf(PropTypes.string),
  fallbackServiceIds: PropTypes.arrayOf(PropTypes.string),
  dispatchSummary: PropTypes.arrayOf(PropTypes.string),
  workspaceSlug: PropTypes.string,
  contactDetails: PropTypes.string,
  selectedAnalytics: PropTypes.object,
  onManageServices: PropTypes.func.isRequired,
  onRefreshAnalytics: PropTypes.func.isRequired,
  analyticsRefreshing: PropTypes.bool,
  onDownloadGeoJson: PropTypes.func.isRequired,
  onOpenInWorkspace: PropTypes.func.isRequired,
  onDeleteZone: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
  demandTone: PropTypes.func.isRequired,
  determineCompliance: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onDemandChange: PropTypes.func.isRequired,
  demandLevels: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      tone: PropTypes.string
    })
  ).isRequired,
  onVisibilityChange: PropTypes.func.isRequired,
  visibilityOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onRoleToggle: PropTypes.func.isRequired,
  roleOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  roleLabels: PropTypes.object.isRequired,
  formatRoleLabel: PropTypes.func.isRequired,
  onBooleanToggle: PropTypes.func.isRequired,
  feedback: PropTypes.shape({
    tone: PropTypes.string,
    message: PropTypes.string
  }),
  isEditing: PropTypes.bool,
  saving: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
};

ZoneWorkspaceSection.defaultProps = {
  geometry: null,
  existingZones: null,
  fileError: null,
  selectedZoneId: null,
  selectedZone: null,
  selectedMetadata: {},
  selectedTags: [],
  allowedRoleLabels: [],
  fallbackServiceIds: [],
  dispatchSummary: [],
  workspaceSlug: '',
  contactDetails: '',
  selectedAnalytics: null,
  analyticsRefreshing: false,
  deleting: false,
  feedback: null,
  isEditing: false,
  saving: false
};
