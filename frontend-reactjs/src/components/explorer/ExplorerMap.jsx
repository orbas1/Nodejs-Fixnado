import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import maplibregl from 'maplibre-gl';
import './explorer.css';

const DEFAULT_CENTER = [-0.118092, 51.509865]; // London fallback
const DEFAULT_ZOOM = 4.5;

const demandColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e'
};

function zoneFillColorExpression() {
  return [
    'case',
    ['==', ['get', 'demand'], 'high'],
    demandColors.high,
    ['==', ['get', 'demand'], 'low'],
    demandColors.low,
    demandColors.medium
  ];
}

export default function ExplorerMap({ data, selectedZoneId, onSelectZone, bounds }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const hasFitInitialBoundsRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) {
      return () => {};
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

    const handleLoad = () => {
      map.addSource('explorer-zones', {
        type: 'geojson',
        data
      });

      map.addLayer({
        id: 'explorer-zones-fill',
        type: 'fill',
        source: 'explorer-zones',
        paint: {
          'fill-color': zoneFillColorExpression(),
          'fill-opacity': [
            'case',
            ['==', ['get', 'id'], selectedZoneId ?? ''],
            0.55,
            0.32
          ]
        }
      });

      map.addLayer({
        id: 'explorer-zones-outline',
        type: 'line',
        source: 'explorer-zones',
        paint: {
          'line-color': '#1e293b',
          'line-width': 1.5,
          'line-opacity': 0.6
        }
      });

      map.addLayer({
        id: 'explorer-zones-outline-selected',
        type: 'line',
        source: 'explorer-zones',
        paint: {
          'line-color': '#0f172a',
          'line-width': 3,
          'line-opacity': 0.8
        },
        filter: ['==', ['get', 'id'], selectedZoneId ?? '']
      });

      map.on('click', 'explorer-zones-fill', (event) => {
        const feature = event.features?.[0];
        if (!feature) {
          return;
        }

        const zoneId = feature.properties?.id;
        if (zoneId) {
          onSelectZone(zoneId);
        }
      });

      map.on('mouseenter', 'explorer-zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'explorer-zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    };

    map.on('load', handleLoad);

    mapRef.current = map;

    return () => {
      map.off('load', handleLoad);
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectZone, selectedZoneId, data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const source = map.getSource('explorer-zones');
    if (source) {
      source.setData(data);
    }

    if (map.getLayer('explorer-zones-fill')) {
      map.setPaintProperty('explorer-zones-fill', 'fill-opacity', [
        'case',
        ['==', ['get', 'id'], selectedZoneId ?? ''],
        0.55,
        0.32
      ]);
    }

    if (map.getLayer('explorer-zones-outline-selected')) {
      map.setFilter('explorer-zones-outline-selected', [
        '==',
        ['get', 'id'],
        selectedZoneId ?? ''
      ]);
    }
  }, [data, selectedZoneId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bounds || bounds.length !== 4) {
      return;
    }

    if (!hasFitInitialBoundsRef.current) {
      map.fitBounds(bounds, { padding: 40, duration: 0 });
      hasFitInitialBoundsRef.current = true;
      return;
    }

    if (selectedZoneId) {
      map.fitBounds(bounds, { padding: 60, duration: 600 });
    }
  }, [bounds, selectedZoneId]);

  return (
    <div className="fx-explorer-map" aria-label="Zone map">
      <div ref={containerRef} className="fx-explorer-map__canvas" role="presentation" />
      <div className="fx-explorer-map__legend" aria-hidden="true">
        <strong>Demand</strong>
        <ul>
          <li><span style={{ backgroundColor: demandColors.high }} /> High</li>
          <li><span style={{ backgroundColor: demandColors.medium }} /> Balanced</li>
          <li><span style={{ backgroundColor: demandColors.low }} /> Emerging</li>
        </ul>
      </div>
    </div>
  );
}

ExplorerMap.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.string,
    features: PropTypes.array
  }).isRequired,
  selectedZoneId: PropTypes.string,
  onSelectZone: PropTypes.func.isRequired,
  bounds: PropTypes.arrayOf(PropTypes.number)
};

ExplorerMap.defaultProps = {
  selectedZoneId: undefined,
  bounds: undefined
};
