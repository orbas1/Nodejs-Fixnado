import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import { Button } from '../components/ui/index.js';
import ZoneOverviewSection from '../components/zones/admin/ZoneOverviewSection.jsx';
import ZoneWorkspaceSection from '../components/zones/admin/ZoneWorkspaceSection.jsx';
import ZoneBulkImportSection from '../components/zones/admin/ZoneBulkImportSection.jsx';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import {
  fetchZonesWithAnalytics,
  createZone,
  updateZone,
  deleteZone,
  fetchZone,
  createZoneAnalyticsSnapshot,
  importZonesFromGeoJson
} from '../api/zoneAdminClient.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';
import ZoneServicesManager from '../components/zones/ZoneServicesManager.jsx';
import { ROLE_DISPLAY_NAMES, formatRoleLabel } from '../constants/accessControl.js';

const DEMAND_LEVELS = [
  { value: 'high', label: 'High demand', tone: 'bg-rose-100 text-rose-700 border border-rose-200' },
  { value: 'medium', label: 'Balanced demand', tone: 'bg-amber-100 text-amber-700 border border-amber-200' },
  { value: 'low', label: 'Emerging demand', tone: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
];
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

const VISIBILITY_OPTIONS = [
  { value: 'live', label: 'Live • Dispatch ready' },
  { value: 'draft', label: 'Draft • Hidden from dispatch' },
  { value: 'paused', label: 'Paused • Temporarily disabled' }
];

const ROLE_OPTIONS = ['admin', 'operations', 'enterprise', 'provider', 'serviceman', 'support'];

const INITIAL_FORM = {
  name: '',
  companyId: '',
  demandLevel: 'medium',
  tags: '',
  notes: '',
  heroImage: '',
  heroImageAlt: '',
  accentColor: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  operatingHours: '',
  allowedRoles: [],
  visibility: 'live',
  autoDispatch: true,
  requiresOpsApproval: false,
  maxConcurrentJobs: '',
  slaMinutes: '',
  workspaceSlug: '',
  fallbackServices: ''
};

function resolveLocationBadge(location) {
  if (!location) {
    return null;
  }

  if (location.status === 'resolved') {
    const accuracy = location.coords?.accuracy;
    const label = accuracy ? `Location locked • ±${accuracy.toFixed?.(0) ?? accuracy}m` : 'Location locked';
    return { tone: 'success', label };
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

const INITIAL_BULK_IMPORT_FORM = {
  companyId: '',
  demandLevel: 'medium',
  geojson: '',
  tags: '',
  notes: '',
  allowedRoles: []
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

function parseInteger(input) {
  const value = Number.parseInt(input, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function stripCompliance(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  const rest = { ...metadata };
  delete rest.compliance;
  return rest;
}

function buildMetadataFromForm(form, currentMetadata = {}) {
  const base = stripCompliance(currentMetadata);
  const tags = parseList(form.tags);
  const heroImage = form.heroImage.trim();
  const heroImageAlt = form.heroImageAlt.trim();
  const accentColor = form.accentColor.trim();
  const operatingHours = form.operatingHours.trim();
  const contactName = form.contactName.trim();
  const contactEmail = form.contactEmail.trim();
  const contactPhone = form.contactPhone.trim();
  const workspaceSlug = form.workspaceSlug.trim();
  const fallbackServices = parseList(form.fallbackServices);
  const allowedRoles = Array.from(
    new Set(
      (form.allowedRoles || [])
        .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
        .filter(Boolean)
    )
  );
  const maxConcurrentJobs = parseInteger(form.maxConcurrentJobs);
  const slaMinutes = parseInteger(form.slaMinutes);

  const metadata = {
    ...base,
    tags,
    notes: form.notes.trim() || null,
    heroImageUrl: heroImage || null,
    heroImageAlt: heroImageAlt || null,
    accentColor: accentColor || null,
    operatingHours: operatingHours || null,
    contact:
      contactName || contactEmail || contactPhone
        ? {
            name: contactName || null,
            email: contactEmail || null,
            phone: contactPhone || null
          }
        : null,
    source: 'admin-zones-ui',
    visibilityStatus: form.visibility,
    allowedRoles,
    workspaceSlug: workspaceSlug || null,
    fallbackServices,
    dispatch: {
      autoDispatch: Boolean(form.autoDispatch),
      requiresOpsApproval: Boolean(form.requiresOpsApproval),
      maxConcurrentJobs,
      slaMinutes
    }
  };

  return metadata;
}

function formStateFromZone(zone) {
  if (!zone) {
    return { ...INITIAL_FORM };
  }
  const metadata = zone.metadata || {};
  const dispatch = metadata.dispatch || {};
  return {
    name: zone.name ?? '',
    companyId: zone.companyId ?? '',
    demandLevel: zone.demandLevel ?? 'medium',
    tags: Array.isArray(metadata.tags) ? metadata.tags.join(', ') : '',
    notes: metadata.notes ?? '',
    heroImage: metadata.heroImageUrl ?? '',
    heroImageAlt: metadata.heroImageAlt ?? '',
    accentColor: metadata.accentColor ?? '',
    contactName: metadata.contact?.name ?? '',
    contactEmail: metadata.contact?.email ?? '',
    contactPhone: metadata.contact?.phone ?? '',
    operatingHours: metadata.operatingHours ?? '',
    allowedRoles: Array.isArray(metadata.allowedRoles) ? metadata.allowedRoles : [],
    visibility: metadata.visibilityStatus ?? 'live',
    autoDispatch:
      typeof dispatch.autoDispatch === 'boolean'
        ? dispatch.autoDispatch
        : INITIAL_FORM.autoDispatch,
    requiresOpsApproval: Boolean(dispatch.requiresOpsApproval),
    maxConcurrentJobs:
      typeof dispatch.maxConcurrentJobs === 'number' && Number.isFinite(dispatch.maxConcurrentJobs)
        ? String(dispatch.maxConcurrentJobs)
        : '',
    slaMinutes:
      typeof dispatch.slaMinutes === 'number' && Number.isFinite(dispatch.slaMinutes)
        ? String(dispatch.slaMinutes)
        : '',
    workspaceSlug: metadata.workspaceSlug ?? '',
    fallbackServices: Array.isArray(metadata.fallbackServices)
      ? metadata.fallbackServices.join(', ')
      : Array.isArray(metadata.fallbackServiceIds)
      ? metadata.fallbackServiceIds.join(', ')
      : ''
  };
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

function openInNewTab(url) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }
}

export default function AdminZones() {
  const { user } = useAdminSession();
  const [zonesState, setZonesState] = useState({ loading: true, error: null, data: [] });
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM }));
  const [geometry, setGeometry] = useState(null);
  const [geometryDirty, setGeometryDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [location, setLocation] = useState({ status: 'idle', coords: null, error: null });
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [detailState, setDetailState] = useState({ loading: false, error: null, data: null });
  const [servicesManagerOpen, setServicesManagerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false);
  const bulkImportRef = useRef(null);
  const [bulkImportForm, setBulkImportForm] = useState(() => ({ ...INITIAL_BULK_IMPORT_FORM }));
  const [bulkImportFeedback, setBulkImportFeedback] = useState(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportFileError, setBulkImportFileError] = useState(null);
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
  const selectedZoneEntry = useMemo(
    () => zonesState.data.find((entry) => entry.zone?.id === selectedZoneId) ?? null,
    [zonesState.data, selectedZoneId]
  );
  const selectedZone = detailState.data?.zone ?? selectedZoneEntry?.zone ?? null;
  const selectedAnalytics = detailState.data?.analytics ?? selectedZoneEntry?.analytics ?? null;
  const isEditing = Boolean(selectedZoneId);
  const selectedMetadata = selectedZone?.metadata ?? {};
  const selectedTags = Array.isArray(selectedMetadata.tags) ? selectedMetadata.tags : [];
  const allowedRoles = Array.isArray(selectedMetadata.allowedRoles)
    ? selectedMetadata.allowedRoles
    : [];
  const allowedRoleLabels = Array.from(
    new Set(allowedRoles.map((role) => ROLE_DISPLAY_NAMES[role] || formatRoleLabel(role)))
  );
  const fallbackServiceIds = Array.isArray(selectedMetadata.fallbackServices)
    ? selectedMetadata.fallbackServices
    : Array.isArray(selectedMetadata.fallbackServiceIds)
    ? selectedMetadata.fallbackServiceIds
    : [];
  const dispatchSettings = selectedMetadata.dispatch ?? {};
  const visibilityStatus = selectedMetadata.visibilityStatus ?? 'live';
  const visibilityLabel =
    VISIBILITY_OPTIONS.find((option) => option.value === visibilityStatus)?.label ??
    formatRoleLabel(visibilityStatus);
  const dispatchSummary = [];
  if (dispatchSettings.autoDispatch) {
    dispatchSummary.push('Auto-dispatch enabled');
  } else {
    dispatchSummary.push('Manual dispatch only');
  }
  if (dispatchSettings.requiresOpsApproval) {
    dispatchSummary.push('Ops approval required');
  }
  if (dispatchSettings.maxConcurrentJobs) {
    dispatchSummary.push(`${dispatchSettings.maxConcurrentJobs} concurrent jobs`);
  }
  if (dispatchSettings.slaMinutes) {
    dispatchSummary.push(`${dispatchSettings.slaMinutes} min SLA target`);
  }
  const workspaceSlug = selectedMetadata.workspaceSlug ?? '';
  const contactDetails = [
    selectedMetadata.contact?.name,
    selectedMetadata.contact?.email,
    selectedMetadata.contact?.phone
  ]
    .filter((entry) => entry && entry.length > 0)
    .join(' • ');
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

  useEffect(() => {
    if (!selectedZoneId) {
      setDetailState({ loading: false, error: null, data: null });
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
    setDetailState({ loading: true, error: null, data: null });
    fetchZone(selectedZoneId, { signal: controller.signal })
      .then((payload) => {
        setDetailState({ loading: false, error: null, data: payload });
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
        setDetailState({
          loading: false,
          error: error.message ?? 'Unable to load zone details',
          data: null
        setServiceCatalogueState({
          companyId,
          loading: false,
          error: error.message ?? 'Unable to load available services',
          data: []
        });
      });

    return () => controller.abort();
  }, [selectedZoneId]);
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

  const handleRoleToggle = (role) => (event) => {
    const checked = event.target.checked;
    setForm((current) => {
      const next = new Set(current.allowedRoles || []);
      if (checked) {
        next.add(role);
      } else {
        next.delete(role);
      }
      return { ...current, allowedRoles: Array.from(next) };
    });
  };

  const handleBooleanToggle = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleVisibilityChange = (event) => {
    setForm((current) => ({ ...current, visibility: event.target.value }));
  };

  const handleDemandChange = (value) => {
    setForm((current) => ({ ...current, demandLevel: value }));
  };

  const handleBulkImportChange = (field) => (event) => {
    setBulkImportForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleBulkRoleToggle = (role) => (event) => {
    const checked = event.target.checked;
    setBulkImportForm((current) => {
      const next = new Set(current.allowedRoles || []);
      if (checked) {
        next.add(role);
      } else {
        next.delete(role);
      }
      return { ...current, allowedRoles: Array.from(next) };
    });
  };

  const handleBulkDemandChange = (event) => {
    setBulkImportForm((current) => ({ ...current, demandLevel: event.target.value }));
  };

  const handleBulkReset = () => {
    setBulkImportForm({ ...INITIAL_BULK_IMPORT_FORM });
    setBulkImportFeedback(null);
    setBulkImportFileError(null);
  };

  const handleBulkFileImport = async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }
    setBulkImportFileError(null);
    try {
      const text = await file.text();
      JSON.parse(text);
      setBulkImportForm((current) => ({ ...current, geojson: text }));
      setBulkImportFeedback({
        tone: 'info',
        message: `Loaded ${file.name}. Review and submit to persist zones.`
      });
    } catch (error) {
      setBulkImportFileError(error.message ?? 'Unable to parse GeoJSON file');
    }
  };

  const handleBulkImportSubmit = async (event) => {
    event.preventDefault();
    const companyId = bulkImportForm.companyId.trim();
    if (!companyId) {
      setBulkImportFeedback({ tone: 'danger', message: 'Provide a company ID before importing zones.' });
      return;
    }

    if (!bulkImportForm.geojson.trim()) {
      setBulkImportFeedback({ tone: 'danger', message: 'Paste or upload a GeoJSON payload to import.' });
      return;
    }

    let geojsonPayload;
    try {
      geojsonPayload = JSON.parse(bulkImportForm.geojson);
    } catch {
      setBulkImportFeedback({ tone: 'danger', message: 'GeoJSON payload is invalid. Validate the file and retry.' });
      return;
    }

    setBulkImportLoading(true);
    setBulkImportFeedback(null);
    setBulkImportFileError(null);

    try {
      const metadata = {};
      const tags = parseList(bulkImportForm.tags);
      if (tags.length > 0) {
        metadata.tags = tags;
      }
      if (bulkImportForm.notes.trim()) {
        metadata.notes = bulkImportForm.notes.trim();
      }
      const allowedRoles = Array.from(
        new Set(
          (bulkImportForm.allowedRoles || [])
            .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
            .filter(Boolean)
        )
      );
      if (allowedRoles.length > 0) {
        metadata.allowedRoles = allowedRoles;
      }

      const created = await importZonesFromGeoJson({
        companyId,
        demandLevel: bulkImportForm.demandLevel,
        geojson: geojsonPayload,
        metadata,
        actor
      });

      setBulkImportForm((current) => ({
        ...INITIAL_BULK_IMPORT_FORM,
        companyId,
        demandLevel: current.demandLevel,
        allowedRoles: current.allowedRoles
      }));
      setBulkImportFeedback({
        tone: 'success',
        message: `Imported ${created.length} zone${created.length === 1 ? '' : 's'} for ${companyId}.`
      });
      await requestZones();
    } catch (error) {
      setBulkImportFeedback({
        tone: 'danger',
        message: error.message ?? 'Unable to import zones. Try again shortly.'
      });
    } finally {
      setBulkImportLoading(false);
    }
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
    setForm({ ...INITIAL_FORM });
    setGeometry(null);
    setGeometryDirty(false);
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
    setForm(formStateFromZone(zone.zone));
    setGeometry(zone.zone.boundary ?? null);
    setGeometryDirty(false);
    setFeedback(null);
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.companyId.trim()) {
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

    if (!isEditing && !geometry) {
    if (!selectedZoneId && !geometry) {
      setFeedback({ tone: 'danger', message: 'Draw a polygon before saving the zone.' });
      return;
    }

    if (isEditing && geometryDirty && !geometry) {
      setFeedback({ tone: 'danger', message: 'Draw a replacement polygon or reset the draft.' });
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
      const metadata = buildMetadataFromForm(form, selectedZone?.metadata);

      if (isEditing && selectedZone) {
        const payload = {
          name: form.name.trim(),
          companyId: form.companyId.trim(),
          demandLevel: form.demandLevel,
          metadata,
          actor
        };

        if (geometryDirty && geometry) {
          payload.geometry = geometry;
        }

        const updated = await updateZone(selectedZone.id, payload);
        setFeedback({ tone: 'success', message: `Zone "${updated.name}" updated successfully.` });
        setGeometry(updated.boundary ?? geometry ?? null);
        setGeometryDirty(false);
        setDetailState((current) => ({
          loading: false,
          error: null,
          data: { zone: updated, analytics: current?.data?.analytics ?? selectedAnalytics ?? null }
        }));
        setForm(formStateFromZone(updated));
        await requestZones();
      } else {
        const created = await createZone({
          name: form.name.trim(),
          companyId: form.companyId.trim(),
          demandLevel: form.demandLevel,
          geometry,
          metadata,
          actor
        });
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
        setGeometry(created.boundary ?? geometry ?? null);
        setGeometryDirty(false);
        setForm(formStateFromZone(created));
        setDetailState({ loading: false, error: null, data: { zone: created, analytics: null } });
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

  const handleDelete = async () => {
    if (!selectedZone) {
      return;
    }

    const confirmationMessage = `Delete zone "${selectedZone.name}"? This cannot be undone.`;
    if (typeof window !== 'undefined' && !window.confirm(confirmationMessage)) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      await deleteZone(selectedZone.id);
      setFeedback({
        tone: 'success',
        message: `Zone "${selectedZone.name}" removed. Downstream services will stop receiving coverage.`
      });
      setDetailState({ loading: false, error: null, data: null });
      setSelectedZoneId(null);
      setForm({ ...INITIAL_FORM });
      setGeometry(null);
      setGeometryDirty(false);
      await requestZones();
        setGeometry(created.boundary ?? geometry);
        setGeometryDirty(false);
        await requestZones();
      }
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error.message ?? 'Unable to delete zone. Try again shortly.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRefreshAnalytics = async () => {
    if (!selectedZone) {
      return;
    }

    setAnalyticsRefreshing(true);
    setFeedback(null);
    try {
      const snapshot = await createZoneAnalyticsSnapshot(selectedZone.id);
      setDetailState({
        loading: false,
        error: null,
        data: { zone: selectedZone, analytics: snapshot }
      });
      setFeedback({
        tone: 'success',
        message: `Analytics snapshot regenerated for ${selectedZone.name}.`
      });
      await requestZones();
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error.message ?? 'Unable to refresh analytics snapshot.'
      });
    } finally {
      setAnalyticsRefreshing(false);
    }
  };

  const handleDownloadGeoJson = () => {
    if (!selectedZone?.boundary) {
      setFeedback({ tone: 'danger', message: 'No polygon available to export for this zone.' });
      return;
    }

    try {
      const payload = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: selectedZone.id, name: selectedZone.name },
            geometry: selectedZone.boundary
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
        ]
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const safeName = (selectedZone.name || 'zone').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      anchor.download = `${safeName || 'zone'}.geojson`;
      anchor.rel = 'noopener';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback({ tone: 'danger', message: error.message ?? 'Unable to export GeoJSON.' });
    }
  };

  const handleOpenInWorkspace = useCallback(() => {
    if (!selectedZone || typeof window === 'undefined') {
      return;
    }
    const url = `/admin/dashboard?zoneId=${encodeURIComponent(selectedZone.id)}`;
    window.open(url, '_blank', 'noopener');
  }, [selectedZone]);

  const handleScrollToImport = useCallback(() => {
    if (bulkImportRef.current) {
      bulkImportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleClearGeometry = () => {
    setGeometry(null);
    setGeometryDirty(true);
  };

  const navigation = useMemo(
    () => [
      {
        id: 'zone-overview',
        label: 'Overview',
        description: 'Guardrails, telemetry posture, and platform readiness.'
      },
      {
        id: 'zone-workspace',
        label: 'Workspace',
        description: 'Draw polygons, manage metadata, and review analytics.'
      },
      {
        id: 'zone-bulk-import',
        label: 'Bulk ingest',
        description: 'Import FeatureCollections with RBAC guardrails.'
      }
    ],
    []
  );

  const sidebarMeta = useMemo(
    () =>
      meta.map((entry) => ({
        label: entry.label,
        value: (
          <div className="flex flex-col">
            <span className={`text-sm font-semibold ${entry.emphasis ? 'text-primary' : 'text-slate-700'}`}>
              {entry.value}
            </span>
            {entry.caption ? <span className="text-xs text-slate-500">{entry.caption}</span> : null}
          </div>
        )
      })),
    [meta]
  );

  const locationBadge = useMemo(() => resolveLocationBadge(location), [location]);
  const heroBadges = locationBadge ? [locationBadge] : [];

  const heroAside = useMemo(
    () => (
      <div className="flex flex-wrap gap-3">
        {selectedZone ? (
          <Button type="button" variant="secondary" icon={ArrowTopRightOnSquareIcon} onClick={handleOpenInWorkspace}>
            Open zone workspace
          </Button>
        ) : null}
        <Button type="button" variant="secondary" icon={ArrowPathIcon} onClick={requestZones}>
          Refresh zones
        </Button>
        <Button type="button" variant="secondary" icon={SquaresPlusIcon} onClick={handleScrollToImport}>
          Bulk import GeoJSON
        </Button>
      </div>
    ),
    [handleOpenInWorkspace, handleScrollToImport, requestZones, selectedZone]
  );

  const selectedMetadataWithVisibility = useMemo(
    () => ({ ...(selectedZone?.metadata ?? {}), visibilityLabel }),
    [selectedZone, visibilityLabel]
  );

  return (
    <>
      <DashboardShell
        eyebrow="Admin control centre"
        title="Zone management"
        subtitle="Create, edit, and govern service zones for dispatch, analytics, and mobile workforce tools."
        navigation={navigation}
        heroBadges={heroBadges}
        heroAside={heroAside}
        sidebar={{ meta: sidebarMeta }}
      >
        <ZoneOverviewSection id="zone-overview" meta={meta} />
        <ZoneWorkspaceSection
          id="zone-workspace"
          geometry={geometry}
          existingZones={existingFeatures}
          onGeometryChange={handleGeometryChange}
          onClearGeometry={handleClearGeometry}
          onFileImport={handleFileImport}
          fileError={fileError}
          location={location}
          onRequestLocation={requestLocation}
          zonesState={zonesState}
          onSelectZone={handleSelectZone}
          selectedZoneId={selectedZoneId}
          selectedZone={selectedZone}
          selectedMetadata={selectedMetadataWithVisibility}
          selectedTags={selectedTags}
          allowedRoleLabels={allowedRoleLabels}
          fallbackServiceIds={fallbackServiceIds}
          dispatchSummary={dispatchSummary}
          workspaceSlug={workspaceSlug}
          contactDetails={contactDetails}
          selectedAnalytics={selectedAnalytics}
          onManageServices={() => setServicesManagerOpen(true)}
          onRefreshAnalytics={handleRefreshAnalytics}
          analyticsRefreshing={analyticsRefreshing}
          onDownloadGeoJson={handleDownloadGeoJson}
          onOpenInWorkspace={handleOpenInWorkspace}
          onDeleteZone={handleDelete}
          deleting={deleting}
          demandTone={demandTone}
          determineCompliance={determineCompliance}
          form={form}
          onFieldChange={handleFieldChange}
          onDemandChange={handleDemandChange}
          demandLevels={DEMAND_LEVELS}
          onVisibilityChange={handleVisibilityChange}
          visibilityOptions={VISIBILITY_OPTIONS}
          onRoleToggle={handleRoleToggle}
          roleOptions={ROLE_OPTIONS}
          roleLabels={ROLE_DISPLAY_NAMES}
          formatRoleLabel={formatRoleLabel}
          onBooleanToggle={handleBooleanToggle}
          feedback={feedback}
          isEditing={isEditing}
          saving={saving}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
        <ZoneBulkImportSection
          id="zone-bulk-import"
          ref={bulkImportRef}
          form={bulkImportForm}
          demandLevels={DEMAND_LEVELS}
          roleOptions={ROLE_OPTIONS}
          roleLabels={ROLE_DISPLAY_NAMES}
          formatRoleLabel={formatRoleLabel}
          onFieldChange={handleBulkImportChange}
          onDemandChange={handleBulkDemandChange}
          onFileImport={handleBulkFileImport}
          onRoleToggle={handleBulkRoleToggle}
          onSubmit={handleBulkImportSubmit}
          onReset={handleBulkReset}
          feedback={bulkImportFeedback}
          loading={bulkImportLoading}
          fileError={bulkImportFileError}
        />
      </DashboardShell>
      <ZoneServicesManager
        open={servicesManagerOpen}
        onClose={() => setServicesManagerOpen(false)}
        zone={selectedZone ? { id: selectedZone.id, name: selectedZone.name, companyId: selectedZone.companyId } : null}
        user={user}
      />
    </>
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
