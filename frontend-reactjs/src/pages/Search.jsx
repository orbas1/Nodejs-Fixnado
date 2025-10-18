import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';
import {
  EXPLORER_DEFAULT_FILTERS,
  parseFiltersFromSearchParams,
  toSearchParams,
  applyExplorerFilters,
  filterZonesByDemand,
  computeZoneMatchIndex,
  summariseZoneAnalytics,
  buildZoneFeatureCollection,
  determineExplorerBounds,
  extractServiceCategories
} from './explorerUtils.js';
import { fetchExplorerResults, fetchZones, ExplorerApiError } from '../api/explorerClient.js';
import ExplorerFilters from '../components/explorer/ExplorerFilters.jsx';
import ExplorerMap from '../components/explorer/ExplorerMap.jsx';
import ExplorerResultList from '../components/explorer/ExplorerResultList.jsx';
import ZoneInsightPanel from '../components/explorer/ZoneInsightPanel.jsx';
import '../styles.css';
import { SERVICE_TYPES, SERVICE_CATEGORIES } from '../constants/services.js';

function normaliseFilters(filters) {
  return {
    ...EXPLORER_DEFAULT_FILTERS,
    ...filters,
    demand: Array.isArray(filters.demand) && filters.demand.length > 0 ? filters.demand : EXPLORER_DEFAULT_FILTERS.demand
  };
}

function filtersAreEqual(a, b) {
  return (
    a.term === b.term &&
    a.type === b.type &&
    a.zoneId === b.zoneId &&
    a.availability === b.availability &&
    a.serviceType === b.serviceType &&
    a.category === b.category &&
    a.limit === b.limit &&
    Array.isArray(a.demand) &&
    Array.isArray(b.demand) &&
    a.demand.length === b.demand.length &&
    a.demand.every((value, index) => value === b.demand[index])
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => normaliseFilters(parseFiltersFromSearchParams(searchParams)));
  const [manualRefreshToken, setManualRefreshToken] = useState(null);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState(null);
  const [results, setResults] = useState({ services: [], items: [], isLoading: true, error: null });
  const [activePanel, setActivePanel] = useState('list');
  const fetchAbortRef = useRef();

  const deferredTerm = useDeferredValue(filters.term);
  const effectiveFilters = useMemo(
    () => ({ ...filters, term: deferredTerm }),
    [filters, deferredTerm]
  );

  useEffect(() => {
    const parsed = normaliseFilters(parseFiltersFromSearchParams(searchParams));
    setFilters((prev) => (filtersAreEqual(prev, parsed) ? prev : parsed));
  }, [searchParams]);

  useEffect(() => {
    const params = toSearchParams(filters);
    const current = searchParams.toString();
    const next = params.toString();
    if (current !== next) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    setZonesLoading(true);
    setZonesError(null);

    fetchZones({ signal: controller.signal })
      .then((data) => {
        setZones(data);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof ExplorerApiError ? error.message : 'Unable to load service zones.';
        setZonesError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setZonesLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }

    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setResults((prev) => ({ ...prev, isLoading: true, error: null }));

    fetchExplorerResults(effectiveFilters, { signal: controller.signal })
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }

        setResults({ services: payload.services, items: payload.items, isLoading: false, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof ExplorerApiError ? error.message : 'Search failed. Please try again.';
        setResults((prev) => ({ ...prev, isLoading: false, error: message }));
      });

    return () => controller.abort();
  }, [effectiveFilters, manualRefreshToken]);

  const handleFiltersChange = useCallback((nextFilters) => {
    if (Object.prototype.hasOwnProperty.call(nextFilters, 'refreshToken')) {
      setManualRefreshToken(nextFilters.refreshToken);
      const rest = { ...nextFilters };
      delete rest.refreshToken;
      setFilters(normaliseFilters(rest));
      setActivePanel('list');
    } else {
      setFilters(normaliseFilters(nextFilters));
    }
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ ...EXPLORER_DEFAULT_FILTERS });
    setManualRefreshToken(Date.now());
    setActivePanel('filters');
  }, []);

  const handleZoneSelect = useCallback(
    (zoneId) => {
      handleFiltersChange({ ...filters, zoneId });
      setActivePanel('zone');
    },
    [filters, handleFiltersChange]
  );

  const approvedItems = useMemo(
    () =>
      results.items.filter((item) => {
        if (item.status && item.status !== 'approved') {
          return false;
        }

        if (item.complianceHoldUntil) {
          const holdUntil = new Date(item.complianceHoldUntil);
          if (Number.isFinite(holdUntil.getTime()) && holdUntil.getTime() > Date.now()) {
            return false;
          }
        }

        return true;
      }),
    [results.items]
  );

  const typeFilteredServices = useMemo(
    () =>
      filters.serviceType
        ? results.services.filter((service) => service.type === filters.serviceType)
        : results.services,
    [results.services, filters.serviceType]
  );

  const categoryFilteredServices = useMemo(
    () =>
      filters.category
        ? typeFilteredServices.filter(
            (service) => (service.categorySlug || service.category) === filters.category
          )
        : typeFilteredServices,
    [typeFilteredServices, filters.category]
  );

  const filteredResults = useMemo(
    () =>
      applyExplorerFilters(
        { services: categoryFilteredServices, items: approvedItems },
        filters,
        zones
      ),
    [categoryFilteredServices, approvedItems, filters, zones]
  );

  const zonesFilteredByDemand = useMemo(() => filterZonesByDemand(zones, filters), [zones, filters]);

  const zoneOptions = useMemo(() => {
    if (!filters.zoneId || filters.zoneId === 'all') {
      return zonesFilteredByDemand.slice().sort((a, b) => a.name.localeCompare(b.name));
    }

    const selected = zones.find((zone) => zone.id === filters.zoneId);
    const list = zonesFilteredByDemand.slice();
    if (selected && !list.some((zone) => zone.id === selected.id)) {
      list.push(selected);
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [zonesFilteredByDemand, filters.zoneId, zones]);

  const matchIndex = useMemo(() => computeZoneMatchIndex(filteredResults, zones), [filteredResults, zones]);
  const selectedZone = filteredResults.selectedZone ?? zones.find((zone) => zone.id === filters.zoneId);
  const analyticsSummary = useMemo(() => summariseZoneAnalytics(selectedZone), [selectedZone]);

  const featureCollection = useMemo(
    () => buildZoneFeatureCollection(zonesFilteredByDemand, matchIndex),
    [zonesFilteredByDemand, matchIndex]
  );

  const mapBounds = useMemo(() => {
    if (selectedZone) {
      return determineExplorerBounds([selectedZone]);
    }

    return determineExplorerBounds(zonesFilteredByDemand);
  }, [selectedZone, zonesFilteredByDemand]);

  const categories = useMemo(() => {
    const derived = extractServiceCategories(results.services);
    if (derived.length > 0) {
      return derived;
    }

    return SERVICE_CATEGORIES.map(({ value, label }) => ({ value, label }));
  }, [results.services]);

  const serviceTypes = useMemo(() => {
    const present = new Set(results.services.map((service) => service.type).filter(Boolean));
    if (present.size === 0) {
      return SERVICE_TYPES;
    }

    const filtered = SERVICE_TYPES.filter((type) => present.has(type.value));
    return filtered.length > 0 ? filtered : SERVICE_TYPES;
  }, [results.services]);

  const panelVisibility = (panel) => (activePanel === panel ? 'block' : 'hidden lg:block');

  const panelTabs = [
    { value: 'filters', label: 'Filter' },
    { value: 'map', label: 'Map' },
    { value: 'zone', label: 'Zone' },
    { value: 'list', label: 'List' }
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-6 py-10 lg:gap-10">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Services</p>
        <h1 className="text-4xl font-semibold text-primary">Search</h1>
      </header>

      <nav className="grid grid-cols-4 gap-2 lg:hidden" aria-label="Search panels">
        {panelTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={clsx(
              'rounded-full border px-3 py-2 text-sm font-medium transition',
              activePanel === tab.value
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-slate-200 bg-white/80 text-slate-600'
            )}
            onClick={() => setActivePanel(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:grid-rows-[auto_1fr] lg:gap-8">
        <aside
          className={clsx(
            panelVisibility('filters'),
            'lg:sticky lg:top-10 lg:h-fit'
          )}
        >
          <ExplorerFilters
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleReset}
            zones={zoneOptions}
            categories={categories}
            serviceTypes={serviceTypes}
            isBusy={results.isLoading || zonesLoading}
          />
        </aside>

        <section
          className={clsx(
            panelVisibility('map'),
            'lg:row-span-2'
          )}
        >
          <div className="h-full min-h-[26rem] overflow-hidden rounded-3xl bg-white shadow-sm lg:min-h-[32rem]">
            <ExplorerMap
              data={featureCollection}
              selectedZoneId={selectedZone?.id}
              onSelectZone={handleZoneSelect}
              bounds={mapBounds}
            />
          </div>
        </section>

        <aside className={clsx(panelVisibility('zone'), 'lg:row-start-2')}>
          {zonesLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">Loading zones…</div>
          ) : (
            <ZoneInsightPanel
              zone={selectedZone}
              matches={matchIndex.get(selectedZone?.id ?? '')}
              analytics={analyticsSummary}
            />
          )}
        </aside>
      </div>

      {zonesError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 lg:w-1/2">{zonesError}</div>
      ) : null}

      <section className={panelVisibility('list')}>
        <ExplorerResultList
          services={filteredResults.services}
          items={filteredResults.items}
          isLoading={results.isLoading}
          error={results.error}
          onRetry={() => {
            setManualRefreshToken(Date.now());
            setActivePanel('list');
          }}
        />
      </section>
    </div>
  );
}
