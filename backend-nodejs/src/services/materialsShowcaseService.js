import config from '../config/index.js';
import { listInventoryItems } from './inventoryService.js';

const FALLBACK_DATA = Object.freeze({
  generatedAt: new Date().toISOString(),
  hero: {
    title: 'Materials control tower',
    subtitle: 'Govern consumables, replenishment cadences, and supplier risk from one command surface.',
    metrics: [
      { label: 'Fill rate', value: 97 },
      { label: 'Stockouts this quarter', value: 1 },
      { label: 'Average lead time (days)', value: 4 }
    ],
    actions: [
      { label: 'Launch replenishment planner', href: '/materials/planner' },
      { label: 'Download compliance pack', href: '/materials/compliance-pack.pdf' }
    ]
  },
  stats: {
    totalSkus: 24,
    totalOnHand: 1820,
    valueOnHand: 28640,
    alerts: 3,
    fillRate: 0.97,
    replenishmentEta: '2025-02-18T08:00:00.000Z'
  },
  categories: [
    {
      id: 'cabling',
      name: 'Structured cabling',
      share: 0.34,
      safetyStockBreaches: 0,
      availability: 0.92
    },
    {
      id: 'fire-safety',
      name: 'Fire safety',
      share: 0.27,
      safetyStockBreaches: 1,
      availability: 0.88
    },
    {
      id: 'mechanical',
      name: 'Mechanical consumables',
      share: 0.21,
      safetyStockBreaches: 1,
      availability: 0.9
    },
    {
      id: 'ppe',
      name: 'PPE & welfare',
      share: 0.18,
      safetyStockBreaches: 1,
      availability: 0.99
    }
  ],
  featured: [
    {
      id: 'material-1',
      sku: 'CAB-6A-500',
      name: 'Cat6A bulk cable drums',
      category: 'Structured cabling',
      unitType: 'drum',
      quantityOnHand: 24,
      quantityReserved: 6,
      safetyStock: 12,
      unitCost: 240,
      supplier: 'Metro Cabling Co',
      leadTimeDays: 3,
      compliance: ['CE', 'RoHS'],
      nextArrival: '2025-02-15T09:00:00.000Z',
      alerts: []
    },
    {
      id: 'material-2',
      sku: 'FS-CO2-60',
      name: '6kg CO2 extinguishers',
      category: 'Fire safety',
      unitType: 'unit',
      quantityOnHand: 56,
      quantityReserved: 12,
      safetyStock: 48,
      unitCost: 68,
      supplier: 'Civic Compliance',
      leadTimeDays: 5,
      compliance: ['BS EN3'],
      nextArrival: '2025-02-21T10:00:00.000Z',
      alerts: [
        {
          id: 'alert-1',
          type: 'low_stock',
          severity: 'warning',
          status: 'active',
          triggeredAt: '2025-02-05T08:30:00.000Z'
        }
      ]
    }
  ],
  inventory: [],
  collections: [
    {
      id: 'rapid-response',
      name: 'Rapid response outage kit',
      description: 'Pre-packed assemblies for campus outages including switchgear spares, fuses, PPE, and thermal paste.',
      composition: [
        '4 × Cat6A cable drums',
        '12 × MCCB kits',
        'Thermal imaging consumables',
        'Arc-flash PPE rotation pack'
      ],
      slaHours: 4,
      coverageZones: ['London Docklands', 'Canary Wharf'],
      automation: ['Auto-replenish to 2 kits per zone', 'Escrow-backed courier dispatch']
    },
    {
      id: 'planned-maintenance',
      name: 'Planned maintenance stack',
      description: '90-day rolling consumables aligned with monthly PPM schedules and vendor compliance expiries.',
      composition: [
        'Filter and belt assortment',
        'Sealant & lubrication caddies',
        'PAT testing consumables',
        'Permit documentation packs'
      ],
      slaHours: 24,
      coverageZones: ['Manchester Science Park', 'Birmingham Innovation Hub'],
      automation: ['Lead time buffers by supplier tier', 'Compliance auto-escalations']
    }
  ],
  suppliers: [
    {
      id: 'metro',
      name: 'Metro Cabling Co',
      tier: 'Preferred',
      leadTimeDays: 3,
      reliability: 0.98,
      annualSpend: 82000,
      carbonScore: 72
    },
    {
      id: 'civic',
      name: 'Civic Compliance',
      tier: 'Strategic',
      leadTimeDays: 5,
      reliability: 0.95,
      annualSpend: 61000,
      carbonScore: 66
    },
    {
      id: 'northern',
      name: 'Northern Plant Logistics',
      tier: 'Regional',
      leadTimeDays: 2,
      reliability: 0.91,
      annualSpend: 38000,
      carbonScore: 59
    }
  ],
  logistics: [
    {
      id: 'inbound',
      label: 'Inbound consolidation',
      status: 'on_track',
      eta: '2025-02-15T08:00:00.000Z',
      detail: 'Consolidated supplier shipments staged at Milton Keynes hub with telemetry seal checks complete.'
    },
    {
      id: 'quality',
      label: 'Quality assurance',
      status: 'attention',
      eta: '2025-02-16T12:00:00.000Z',
      detail: 'Fire safety lot pending QA retest following revised BS EN3 documentation release.'
    },
    {
      id: 'last-mile',
      label: 'Last-mile dispatch',
      status: 'scheduled',
      eta: '2025-02-17T06:00:00.000Z',
      detail: 'Dedicated EV couriers aligned with SLAs and geofenced drop windows for Docklands campus.'
    }
  ],
  insights: {
    compliance: {
      passingRate: 0.94,
      upcomingAudits: 3,
      expiringCertifications: [
        { name: 'Fire suppression media', expiresAt: '2025-03-01T00:00:00.000Z' },
        { name: 'Lifting accessories', expiresAt: '2025-03-12T00:00:00.000Z' }
      ]
    },
    sustainability: {
      recycledShare: 0.32,
      co2SavingsTons: 18.4,
      initiatives: ['Closed-loop cable drum programme', 'EV last-mile fleet fully deployed']
    }
  }
});

const CACHE_TTL_MS = Math.max((config.materialsShowcase?.cacheSeconds ?? 45) * 1000, 5000);
const FALLBACK_CACHE_TTL_MS = Math.max(
  (config.materialsShowcase?.fallbackCacheSeconds ?? 10) * 1000,
  5000
);
const MAX_CACHE_ENTRIES = Math.max(config.materialsShowcase?.maxCacheEntries ?? 24, 1);

const materialsCache = new Map();

function buildCacheKey(companyId) {
  return companyId ? `materials:company:${companyId}` : 'materials:global';
}

function pruneCache() {
  if (materialsCache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const now = Date.now();
  for (const [key, entry] of materialsCache.entries()) {
    if (entry?.promise) {
      continue;
    }
    if (entry.expiresAt <= now) {
      materialsCache.delete(key);
    }
  }

  if (materialsCache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  for (const [key, entry] of materialsCache.entries()) {
    if (entry?.promise) {
      continue;
    }
    materialsCache.delete(key);
    if (materialsCache.size <= MAX_CACHE_ENTRIES) {
      break;
    }
  }
}

function buildResponse(entry, { hit, key }) {
  const { value, expiresAt, ttlMs, cachedAt } = entry;
  const baseMeta = value.meta ?? {};
  return {
    data: value.data,
    meta: {
      ...baseMeta,
      cache: {
        ...(baseMeta.cache ?? {}),
        key,
        hit,
        cachedAt: new Date(cachedAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        ttlSeconds: Math.max(Math.round(ttlMs / 1000), 1)
      }
    }
  };
}

function cacheResolvedEntry(key, payload, ttlMs) {
  const cachedAt = Date.now();
  const entry = {
    value: payload,
    expiresAt: cachedAt + ttlMs,
    ttlMs,
    cachedAt
  };
  materialsCache.set(key, entry);
  pruneCache();
  return buildResponse(entry, { hit: false, key });
}

async function computeAndStore(key, params, token) {
  let result;
  try {
    result = await buildMaterialsShowcase(params);
  } catch (error) {
    const current = materialsCache.get(key);
    if (current?.token === token) {
      materialsCache.delete(key);
    }
    throw error;
  }

  const ttlMs = result.meta?.fallback ? FALLBACK_CACHE_TTL_MS : CACHE_TTL_MS;
  const payload = {
    data: result.data,
    meta: { ...result.meta }
  };
  const current = materialsCache.get(key);
  if (!current || current.token !== token) {
    const cachedAt = Date.now();
    const entry = {
      value: payload,
      ttlMs,
      cachedAt,
      expiresAt: cachedAt + ttlMs
    };
    return buildResponse(entry, { hit: false, key });
  }

  return cacheResolvedEntry(key, payload, ttlMs);
}

function getCacheEntry(key) {
  const entry = materialsCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.promise) {
    return entry;
  }
  if (entry.expiresAt <= Date.now()) {
    materialsCache.delete(key);
    return null;
  }
  return entry;
}

export function clearMaterialsShowcaseCache({ companyId } = {}) {
  if (companyId) {
    materialsCache.delete(buildCacheKey(companyId));
    return;
  }
  materialsCache.clear();
}

function normaliseString(value) {
  if (!value) return null;
  return String(value).trim();
}

function toTitleCase(value) {
  const input = normaliseString(value);
  if (!input) return null;
  return input
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function resolveUnitCost(metadata, item) {
  const values = [
    metadata?.unitCost,
    metadata?.valuation?.unitCost,
    metadata?.unit_price,
    metadata?.unit_cost,
    metadata?.pricePerUnit,
    metadata?.price_per_unit,
    item?.replacementCost
  ]
    .map((entry) => (entry != null ? Number.parseFloat(entry) : null))
    .filter((entry) => Number.isFinite(entry));
  return values.length ? values[0] : 0;
}

function mapInventoryItem(itemInstance) {
  const json = itemInstance.toJSON();
  const metadata = json.metadata ?? {};
  const alerts = Array.isArray(json.InventoryAlerts)
    ? json.InventoryAlerts.map((alert) => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        triggeredAt: alert.triggeredAt
      }))
    : [];

  const available = Math.max(0, (json.quantityOnHand ?? 0) - (json.quantityReserved ?? 0));
  const unitCost = resolveUnitCost(metadata, json);
  const supplier = metadata.supplier?.name || metadata.supplier || metadata.vendor || null;
  const leadTimeDays = Number.isFinite(Number.parseFloat(metadata.leadTimeDays))
    ? Number.parseFloat(metadata.leadTimeDays)
    : Number.isFinite(Number.parseFloat(metadata.lead_time_days))
    ? Number.parseFloat(metadata.lead_time_days)
    : null;

  return {
    id: json.id,
    sku: json.sku,
    name: json.name,
    category: toTitleCase(json.category) ?? 'Materials',
    unitType: json.unitType,
    quantityOnHand: json.quantityOnHand ?? 0,
    quantityReserved: json.quantityReserved ?? 0,
    safetyStock: json.safetyStock ?? 0,
    available,
    unitCost,
    supplier,
    leadTimeDays,
    compliance: Array.isArray(metadata.compliance)
      ? metadata.compliance.map((entry) => String(entry))
      : metadata.compliance
      ? [String(metadata.compliance)]
      : [],
    nextArrival: metadata.nextArrival || metadata.next_arrival || null,
    alerts,
    carbonCategory: metadata.carbonCategory || metadata.carbon_category || null,
    warehouseZone: metadata.zone || metadata.location || null
  };
}

function computeCategoryMix(materials) {
  const totalUnits = materials.reduce((sum, item) => sum + (item.quantityOnHand ?? 0), 0);
  if (totalUnits === 0) {
    return [];
  }

  const grouped = new Map();
  materials.forEach((item) => {
    const key = item.category || 'Materials';
    const current = grouped.get(key) ?? {
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: key,
      units: 0,
      safetyStockBreaches: 0,
      availability: []
    };
    current.units += item.quantityOnHand ?? 0;
    if (item.available <= item.safetyStock) {
      current.safetyStockBreaches += 1;
    }
    const totalPossible = (item.quantityOnHand ?? 0) + (item.quantityReserved ?? 0);
    const availability = totalPossible > 0 ? (item.available ?? 0) / totalPossible : 1;
    current.availability.push(availability);
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((entry) => ({
    id: entry.id,
    name: entry.name,
    share: entry.units / totalUnits,
    safetyStockBreaches: entry.safetyStockBreaches,
    availability:
      entry.availability.length === 0
        ? 1
        : entry.availability.reduce((sum, value) => sum + value, 0) / entry.availability.length
  }));
}

function computeStats(materials) {
  const totalSkus = materials.length;
  const totalOnHand = materials.reduce((sum, item) => sum + (item.quantityOnHand ?? 0), 0);
  const totalReserved = materials.reduce((sum, item) => sum + (item.quantityReserved ?? 0), 0);
  const valueOnHand = materials.reduce((sum, item) => sum + (item.unitCost * (item.quantityOnHand ?? 0)), 0);
  const alerts = materials.filter((item) => item.alerts.some((alert) => alert.status !== 'resolved')).length;
  const fillRateDenominator = totalOnHand + totalReserved;
  const fillRate = fillRateDenominator > 0 ? (totalOnHand - totalReserved) / fillRateDenominator : 1;

  const replenishmentCandidates = materials
    .map((item) => item.nextArrival)
    .filter((value) => value != null)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const replenishmentEta = replenishmentCandidates.length ? replenishmentCandidates[0].toISOString() : null;

  return {
    totalSkus,
    totalOnHand,
    valueOnHand: Math.round(valueOnHand),
    alerts,
    fillRate: Number.isFinite(fillRate) ? Math.max(0, Math.min(1, fillRate)) : 1,
    replenishmentEta
  };
}

function buildSupplierSummary(materials) {
  const suppliers = new Map();

  materials.forEach((item) => {
    if (!item.supplier) {
      return;
    }
    const key = item.supplier.toLowerCase();
    const record = suppliers.get(key) ?? {
      id: key.replace(/[^a-z0-9]+/g, '-'),
      name: item.supplier,
      totalUnits: 0,
      orders: 0,
      leadTimes: [],
      alerts: 0,
      carbonCategory: item.carbonCategory
    };
    record.totalUnits += item.quantityOnHand ?? 0;
    record.orders += 1;
    if (Number.isFinite(item.leadTimeDays)) {
      record.leadTimes.push(item.leadTimeDays);
    }
    if (item.alerts.some((alert) => alert.status !== 'resolved')) {
      record.alerts += 1;
    }
    suppliers.set(key, record);
  });

  return Array.from(suppliers.values()).map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    tier: supplier.alerts > 1 ? 'Strategic' : supplier.alerts === 1 ? 'Preferred' : 'Partner',
    leadTimeDays:
      supplier.leadTimes.length === 0
        ? null
        : supplier.leadTimes.reduce((sum, value) => sum + value, 0) / supplier.leadTimes.length,
    reliability:
      supplier.orders === 0 ? 1 : (supplier.orders - supplier.alerts) / supplier.orders,
    annualSpend: Math.round(supplier.totalUnits * 120),
    carbonScore: supplier.carbonCategory === 'low' ? 78 : supplier.carbonCategory === 'medium' ? 64 : 58
  }));
}

function buildCollections(materials) {
  if (!materials.length) {
    return FALLBACK_DATA.collections;
  }

  const highVelocity = materials
    .filter((item) => item.quantityReserved > item.quantityOnHand * 0.4)
    .slice(0, 4)
    .map((item) => item.name);

  const complianceCritical = materials
    .filter((item) => item.compliance.length)
    .slice(0, 4)
    .map((item) => `${item.name} (${item.compliance[0]})`);

  return [
    {
      id: 'high-velocity',
      name: 'High velocity replenishment kit',
      description: 'Automatically staged inventory for the highest burn-rate materials across managed campuses.',
      composition: highVelocity.length ? highVelocity : FALLBACK_DATA.collections[0].composition,
      slaHours: 6,
      coverageZones: FALLBACK_DATA.collections[0].coverageZones,
      automation: ['Predictive reorder triggers', 'Escrow release on goods-in scans']
    },
    {
      id: 'compliance-core',
      name: 'Compliance core pack',
      description: 'Ensures mandatory compliance consumables are always site-ready ahead of certification windows.',
      composition: complianceCritical.length ? complianceCritical : FALLBACK_DATA.collections[1].composition,
      slaHours: 24,
      coverageZones: FALLBACK_DATA.collections[1].coverageZones,
      automation: ['Expiry tracking and auto-escalations', 'Digital sign-off workflow']
    }
  ];
}

function buildLogistics(materials) {
  const earliestAlert = materials
    .flatMap((item) => item.alerts)
    .filter((alert) => alert.status === 'active')
    .map((alert) => alert.triggeredAt)
    .filter(Boolean)
    .map((timestamp) => new Date(timestamp))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!earliestAlert.length) {
    return FALLBACK_DATA.logistics;
  }

  const nextMilestone = new Date(earliestAlert[0].getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      id: 'triage',
      label: 'Alert triage',
      status: 'attention',
      eta: earliestAlert[0].toISOString(),
      detail: 'Supply manager reviewing low stock alerts across strategic categories.'
    },
    {
      id: 'vendor-engagement',
      label: 'Vendor engagement',
      status: 'on_track',
      eta: nextMilestone.toISOString(),
      detail: 'Preferred vendor proposals collected with SLA-backed replenishment windows.'
    },
    FALLBACK_DATA.logistics[2]
  ];
}

function buildInsights(materials) {
  const complianceCounts = materials.filter((item) => item.compliance.length > 0).length;
  const sustainabilityScore = materials.filter((item) => item.carbonCategory === 'low').length;

  return {
    compliance: {
      passingRate: materials.length === 0 ? 1 : complianceCounts / materials.length,
      upcomingAudits: Math.max(1, Math.round(materials.length / 8)),
      expiringCertifications: FALLBACK_DATA.insights.compliance.expiringCertifications
    },
    sustainability: {
      recycledShare: materials.length === 0 ? 0.25 : sustainabilityScore / materials.length,
      co2SavingsTons: 12 + sustainabilityScore * 1.5,
      initiatives: FALLBACK_DATA.insights.sustainability.initiatives
    }
  };
}

function mergeWithFallback(dynamic) {
  return {
    generatedAt: dynamic.generatedAt ?? FALLBACK_DATA.generatedAt,
    hero: {
      ...FALLBACK_DATA.hero,
      ...(dynamic.hero ?? {})
    },
    stats: {
      ...FALLBACK_DATA.stats,
      ...(dynamic.stats ?? {})
    },
    categories: dynamic.categories?.length ? dynamic.categories : FALLBACK_DATA.categories,
    featured: dynamic.featured?.length ? dynamic.featured : FALLBACK_DATA.featured,
    inventory: dynamic.inventory ?? [],
    collections: dynamic.collections?.length ? dynamic.collections : FALLBACK_DATA.collections,
    suppliers: dynamic.suppliers?.length ? dynamic.suppliers : FALLBACK_DATA.suppliers,
    logistics: dynamic.logistics?.length ? dynamic.logistics : FALLBACK_DATA.logistics,
    insights: {
      compliance: {
        ...FALLBACK_DATA.insights.compliance,
        ...(dynamic.insights?.compliance ?? {})
      },
      sustainability: {
        ...FALLBACK_DATA.insights.sustainability,
        ...(dynamic.insights?.sustainability ?? {})
      }
    }
  };
}

async function buildMaterialsShowcase({ companyId } = {}) {
  try {
    const materialsRaw = await listInventoryItems({
      companyId,
      includeAlerts: true
    });

    const materials = materialsRaw
      .filter((item) => {
        const category = normaliseString(item.category);
        return category ? /material|consumable|ppe|cable|fire/i.test(category) : true;
      })
      .map((item) => mapInventoryItem(item));

    if (materials.length === 0) {
      return {
        data: FALLBACK_DATA,
        meta: {
          fallback: true,
          reason: 'empty',
          generatedAt: FALLBACK_DATA.generatedAt,
          companyId: companyId ?? null,
          source: 'fallback',
          materialsCount: 0
        }
      };
    }

    const stats = computeStats(materials);
    const categoryMix = computeCategoryMix(materials);
    const suppliers = buildSupplierSummary(materials);
    const collections = buildCollections(materials);
    const logistics = buildLogistics(materials);
    const insights = buildInsights(materials);

    const featured = materials
      .slice()
      .sort((a, b) => {
        const aScore = (a.alerts.length ? 10 : 0) + (a.quantityReserved ?? 0);
        const bScore = (b.alerts.length ? 10 : 0) + (b.quantityReserved ?? 0);
        return bScore - aScore;
      })
      .slice(0, 4);

    const dynamicPayload = {
      generatedAt: new Date().toISOString(),
      hero: {
        title: 'Materials control tower',
        subtitle: `Monitoring ${stats.totalSkus} active SKUs with automated replenishment guardrails.`,
        metrics: [
          { label: 'Fill rate', value: Math.round(stats.fillRate * 100) },
          { label: 'Stock alerts', value: stats.alerts },
          { label: 'On-hand value', value: stats.valueOnHand }
        ],
        actions: FALLBACK_DATA.hero.actions
      },
      stats,
      categories: categoryMix,
      featured,
      inventory: materials,
      collections,
      suppliers,
      logistics,
      insights
    };

    return {
      data: mergeWithFallback(dynamicPayload),
      meta: {
        fallback: false,
        generatedAt: dynamicPayload.generatedAt,
        companyId: companyId ?? null,
        source: 'inventory',
        materialsCount: materials.length
      }
    };
  } catch (error) {
    console.warn('[materialsShowcase] falling back to static payload', error);
    return {
      data: FALLBACK_DATA,
      meta: {
        fallback: true,
        reason: 'error',
        generatedAt: FALLBACK_DATA.generatedAt,
        companyId: companyId ?? null,
        source: 'fallback',
        materialsCount: 0,
        error: { message: error.message }
      }
    };
  }
}

export async function getMaterialsShowcase({ companyId, forceRefresh = false } = {}) {
  const key = buildCacheKey(companyId);

  if (!forceRefresh) {
    const cached = getCacheEntry(key);
    if (cached) {
      if (cached.promise) {
        return cached.promise;
      }
      materialsCache.delete(key);
      materialsCache.set(key, cached);
      return buildResponse(cached, { hit: true, key });
    }
  } else {
    materialsCache.delete(key);
  }

  const token = Symbol('materials-cache');
  const promise = computeAndStore(key, { companyId }, token);
  materialsCache.set(key, { promise, token });
  return promise;
}

export { FALLBACK_DATA };
