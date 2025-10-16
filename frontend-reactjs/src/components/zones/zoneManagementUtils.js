export const DEMAND_LEVELS = [
  { value: 'high', label: 'High demand', tone: 'bg-rose-100 text-rose-700 border border-rose-200' },
  { value: 'medium', label: 'Balanced demand', tone: 'bg-amber-100 text-amber-700 border border-amber-200' },
  { value: 'low', label: 'Emerging demand', tone: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
];

export function demandTone(level) {
  const entry = DEMAND_LEVELS.find((option) => option.value === level);
  return entry?.tone ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}

export function determineCompliance(zone) {
  const compliance = zone?.metadata?.compliance?.openStreetMap;
  if (!compliance) {
    return { status: 'pending', label: 'Pending verification' };
  }
  if (compliance.status === 'verified') {
    return { status: 'verified', label: 'Verified via OpenStreetMap', payload: compliance };
  }
  return { status: 'error', label: 'Verification failed', payload: compliance };
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export function toFeatureCollection(zones) {
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

export function toMultiPolygon(geometry) {
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

export function parseTagList(input) {
  return input
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
