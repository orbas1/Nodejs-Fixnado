import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import {
  fetchZonesWithAnalytics,
  createZone,
  updateZone,
  deleteZone,
  fetchZoneServices,
  syncZoneServices,
  removeZoneService
} from '../api/zoneAdminClient.js';
import { fetchServiceCatalogue } from '../api/serviceAdminClient.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';
import ZoneServiceEditor from '../components/zones/ZoneServiceEditor.jsx';
import ZoneWorkspace from '../components/zones/ZoneWorkspace.jsx';
import ZoneInsights from '../components/zones/ZoneInsights.jsx';
import ZoneGuardrails from '../components/zones/ZoneGuardrails.jsx';
import {
  determineCompliance,
  parseTagList,
  toFeatureCollection,
  toMultiPolygon
} from '../components/zones/zoneManagementUtils.js';

const INITIAL_FORM = {
  name: '',
  companyId: '',
  demandLevel: 'medium',
  tags: '',
  notes: ''
};

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

function openInNewTab(url) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }
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
  const [geometryDirty, setGeometryDirty] = useState(false);
  const [zoneServicesState, setZoneServicesState] = useState({ loading: false, error: null, data: [] });
  const [serviceCatalogueState, setServiceCatalogueState] = useState({
    companyId: null,
    loading: false,
    error: null,
    data: []
  });
  const [serviceFeedback, setServiceFeedback] = useState(null);
  const [coverageModal, setCoverageModal] = useState({ open: false, coverage: null });
  const [coverageSaving, setCoverageSaving] = useState(false);
  const [coverageError, setCoverageError] = useState(null);
  const catalogueCacheRef = useRef(new Map());

  const actor = useMemo(
    () =>
      user
        ? {
            id: user.id,
            email: user.email,
            type: user.type
          }
        : null,
    [user]
  );

  const meta = useMemo(() => computeMeta(zonesState.data, user), [zonesState.data, user]);
  const existingFeatures = useMemo(() => toFeatureCollection(zonesState.data), [zonesState.data]);
  const selectedZone = useMemo(
    () => zonesState.data.find((entry) => entry.zone?.id === selectedZoneId) ?? null,
    [zonesState.data, selectedZoneId]
  );
  const selectedZoneCompliance = useMemo(
    () => (selectedZone ? determineCompliance(selectedZone.zone) : null),
    [selectedZone]
  );

  const analytics = selectedZone?.analytics ?? null;
  const bookingTotals = analytics?.bookingTotals ?? {};
  const bookingStatusEntries = Object.entries(bookingTotals).map(([status, count]) => ({
    status,
    count: Number.isFinite(Number(count)) ? Number(count) : 0
  }));
  const totalBookings = bookingStatusEntries.reduce((sum, entry) => sum + entry.count, 0);

  const handleOpenLink = useCallback((path) => {
    if (path) {
      openInNewTab(path);
    }
  }, []);

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

  const requestZoneServices = useCallback(
    async ({ zoneId, signal } = {}) => {
      if (!zoneId) {
        setZoneServicesState({ loading: false, error: null, data: [] });
        return;
      }
      setZoneServicesState((current) => ({ ...current, loading: true, error: null }));
      try {
        const coverages = await fetchZoneServices(zoneId, { signal });
        setZoneServicesState({ loading: false, error: null, data: coverages });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setZoneServicesState({
          loading: false,
          error: error.message ?? 'Unable to load zone service coverage',
          data: []
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedZoneId) {
      setZoneServicesState({ loading: false, error: null, data: [] });
      return;
    }
    const controller = new AbortController();
    requestZoneServices({ zoneId: selectedZoneId, signal: controller.signal });
    return () => controller.abort();
  }, [selectedZoneId, requestZoneServices]);

  useEffect(() => {
    const companyId = selectedZone?.zone?.companyId ?? null;
    if (!companyId) {
      setServiceCatalogueState({ companyId: null, loading: false, error: null, data: [] });
      return;
    }

    if (catalogueCacheRef.current.has(companyId)) {
      setServiceCatalogueState({
        companyId,
        loading: false,
        error: null,
        data: catalogueCacheRef.current.get(companyId)
      });
      return;
    }

    const controller = new AbortController();
    setServiceCatalogueState({ companyId, loading: true, error: null, data: [] });
    fetchServiceCatalogue({ companyId, limit: 100, signal: controller.signal })
      .then((services) => {
        catalogueCacheRef.current.set(companyId, services);
        setServiceCatalogueState({ companyId, loading: false, error: null, data: services });
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return;
        }
        setServiceCatalogueState({
          companyId,
          loading: false,
          error: error.message ?? 'Unable to load available services',
          data: []
        });
      });

    return () => controller.abort();
  }, [selectedZone?.zone?.companyId]);

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
    setGeometryDirty(true);
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
      setGeometryDirty(true);
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
    setGeometryDirty(false);
    setZoneServicesState({ loading: false, error: null, data: [] });
    setServiceCatalogueState({ companyId: null, loading: false, error: null, data: [] });
    setServiceFeedback(null);
    setCoverageModal({ open: false, coverage: null });
    setCoverageSaving(false);
    setCoverageError(null);
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
    setGeometryDirty(false);
    setServiceFeedback(null);
    setCoverageModal({ open: false, coverage: null });
    setCoverageError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedCompany = form.companyId.trim();
    if (!trimmedName || !trimmedCompany) {
      setFeedback({ tone: 'danger', message: 'Provide both a zone name and company identifier.' });
      return;
    }

    if (!selectedZoneId && !geometry) {
      setFeedback({ tone: 'danger', message: 'Draw a polygon before saving the zone.' });
      return;
    }

    if (geometryDirty && !geometry) {
      setFeedback({ tone: 'danger', message: 'Draw a polygon before saving your changes.' });
      return;
    }

    const baseMetadata = selectedZone?.zone?.metadata ?? {};
    const metadata = { ...baseMetadata, source: 'admin-zones-ui' };
    const tags = parseTagList(form.tags);
    if (tags.length > 0) {
      metadata.tags = tags;
    } else {
      delete metadata.tags;
    }
    const notes = form.notes.trim();
    if (notes) {
      metadata.notes = notes;
    } else {
      delete metadata.notes;
    }
    if (actor?.email) {
      metadata.updatedBy = actor.email;
    }

    const payload = {
      name: trimmedName,
      companyId: trimmedCompany,
      demandLevel: form.demandLevel,
      metadata,
      actor
    };

    if (!selectedZoneId || geometryDirty) {
      if (geometry) {
        payload.geometry = geometry;
      }
    }

    setSaving(true);
    setFeedback(null);

    try {
      if (selectedZoneId) {
        const updated = await updateZone(selectedZoneId, payload);
        setFeedback({ tone: 'success', message: `Zone "${updated.name}" updated successfully.` });
        setGeometry(updated.boundary ?? geometry ?? null);
        setGeometryDirty(false);
        await requestZones();
      } else {
        const created = await createZone({ ...payload, geometry });
        setFeedback({
          tone: 'success',
          message: `Zone "${created.name}" persisted and verified via OpenStreetMap.`
        });
        setSelectedZoneId(created.id);
        setGeometry(created.boundary ?? geometry);
        setGeometryDirty(false);
        await requestZones();
      }
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error.message ?? 'Unable to save zone. Check polygon validity and retry.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedZoneId) {
      return;
    }
    const zoneLabel = selectedZone?.zone?.name ?? 'this zone';
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Deleting ${zoneLabel} will remove analytics and service coverage links. Continue?`
      );
      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    setFeedback(null);
    try {
      await deleteZone(selectedZoneId, { actor });
      setFeedback({ tone: 'success', message: `Zone "${zoneLabel}" deleted.` });
      setForm(INITIAL_FORM);
      setGeometry(null);
      setSelectedZoneId(null);
      setGeometryDirty(false);
      setZoneServicesState({ loading: false, error: null, data: [] });
      setServiceCatalogueState({ companyId: null, loading: false, error: null, data: [] });
      setServiceFeedback(null);
      setCoverageModal({ open: false, coverage: null });
      setCoverageSaving(false);
      setCoverageError(null);
      await requestZones();
    } catch (error) {
      setFeedback({ tone: 'danger', message: error.message ?? 'Unable to delete zone.' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCoverageEditor = (coverage = null) => {
    setCoverageModal({ open: true, coverage });
    setCoverageError(null);
  };

  const handleCloseCoverageEditor = () => {
    setCoverageModal({ open: false, coverage: null });
    setCoverageSaving(false);
    setCoverageError(null);
  };

  const handlePersistCoverage = async (payload) => {
    if (!selectedZoneId) {
      setCoverageError('Select a zone before attaching coverage.');
      return;
    }
    setCoverageSaving(true);
    setCoverageError(null);
    setServiceFeedback(null);
    try {
      const metadata = { ...(coverageModal.coverage?.metadata ?? {}) };
      if (payload.notes) {
        metadata.notes = payload.notes;
      } else {
        delete metadata.notes;
      }
      await syncZoneServices(
        selectedZoneId,
        {
          coverages: [
            {
              serviceId: payload.serviceId,
              coverageType: payload.coverageType,
              priority: payload.priority,
              effectiveFrom: payload.effectiveFrom,
              effectiveTo: payload.effectiveTo,
              metadata
            }
          ],
          replace: false,
          actor
        }
      );
      setCoverageModal({ open: false, coverage: null });
      setServiceFeedback({ tone: 'success', message: 'Service coverage saved.' });
      await requestZoneServices({ zoneId: selectedZoneId });
    } catch (error) {
      setCoverageError(error.message ?? 'Unable to persist service coverage.');
    } finally {
      setCoverageSaving(false);
    }
  };

  const handleRemoveCoverage = async (coverage) => {
    if (!selectedZoneId || !coverage) {
      return;
    }
    const serviceLabel = coverage.service?.title ?? 'service';
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Detach ${serviceLabel} from ${selectedZone?.zone?.name ?? 'the zone'}?`
      );
      if (!confirmed) {
        return;
      }
    }
    setCoverageSaving(true);
    setCoverageError(null);
    setServiceFeedback(null);
    try {
      await removeZoneService(selectedZoneId, coverage.id, { actor });
      setServiceFeedback({ tone: 'success', message: `${serviceLabel} detached from the zone.` });
      await requestZoneServices({ zoneId: selectedZoneId });
    } catch (error) {
      setServiceFeedback({
        tone: 'danger',
        message: error.message ?? 'Unable to detach service coverage.'
      });
    } finally {
      setCoverageSaving(false);
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
            onClick: requestZones,
            variant: 'secondary'
          }
        ]}
        meta={meta}
      />

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-10">
        <ZoneWorkspace
          geometry={geometry}
          existingFeatures={existingFeatures}
          focus={location.coords}
          onGeometryChange={handleGeometryChange}
          onClearDraft={() => setGeometry(null)}
          onImportGeoJson={handleFileImport}
          fileError={fileError}
          location={location}
          zonesState={zonesState}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelectZone}
          form={form}
          onFieldChange={handleFieldChange}
          onDemandChange={handleDemandChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          onDelete={handleDeleteZone}
          saving={saving}
          feedback={feedback}
        />

        <ZoneInsights
          zone={selectedZone}
          compliance={selectedZoneCompliance}
          analytics={analytics}
          bookingStatusEntries={bookingStatusEntries}
          totalBookings={totalBookings}
          serviceCatalogueState={serviceCatalogueState}
          zoneServicesState={zoneServicesState}
          serviceFeedback={serviceFeedback}
          onOpenCoverageEditor={handleOpenCoverageEditor}
          onRemoveCoverage={handleRemoveCoverage}
          onOpenLink={handleOpenLink}
          coverageSaving={coverageSaving}
        />

        <ZoneGuardrails />
      </main>
      <ZoneServiceEditor
        open={coverageModal.open}
        services={serviceCatalogueState.data}
        coverage={coverageModal.coverage}
        onClose={handleCloseCoverageEditor}
        onSubmit={handlePersistCoverage}
        saving={coverageSaving}
        error={coverageError}
        zoneName={selectedZone?.zone?.name ?? null}
      />
    </div>
  );
}
