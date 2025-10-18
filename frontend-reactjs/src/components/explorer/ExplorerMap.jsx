import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { loadMapLibre, preloadMapLibre } from '../../lib/mapLibreLoader.js';
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
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const hasFitInitialBoundsRef = useRef(false);
  const dataRef = useRef(data);
  const selectedZoneRef = useRef(selectedZoneId);
  const onSelectZoneRef = useRef(onSelectZone);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    selectedZoneRef.current = selectedZoneId;
  }, [selectedZoneId]);

  useEffect(() => {
    onSelectZoneRef.current = onSelectZone;
  }, [onSelectZone]);

  useEffect(() => {
    preloadMapLibre();
  }, []);

  useEffect(() => {
    let disposed = false;
    let mapInstance;

    const initialise = async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (disposed || !containerRef.current) {
          return;
        }

        mapInstance = new maplibregl.Map({
          container: containerRef.current,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: true
        });
        mapRef.current = mapInstance;

        mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

        const handleLoad = () => {
          mapReadyRef.current = true;

          mapInstance.addSource('explorer-zones', {
            type: 'geojson',
            data: dataRef.current
          });

          mapInstance.addLayer({
            id: 'explorer-zones-fill',
            type: 'fill',
            source: 'explorer-zones',
            paint: {
              'fill-color': zoneFillColorExpression(),
              'fill-opacity': [
                'case',
                ['==', ['get', 'id'], selectedZoneRef.current ?? ''],
                0.55,
                0.32
              ]
            }
          });

          mapInstance.addLayer({
            id: 'explorer-zones-outline',
            type: 'line',
            source: 'explorer-zones',
            paint: {
              'line-color': '#1e293b',
              'line-width': 1.5,
              'line-opacity': 0.6
            }
          });

          mapInstance.addLayer({
            id: 'explorer-zones-outline-selected',
            type: 'line',
            source: 'explorer-zones',
            paint: {
              'line-color': '#0f172a',
              'line-width': 3,
              'line-opacity': 0.8
            },
            filter: ['==', ['get', 'id'], selectedZoneRef.current ?? '']
          });

          mapInstance.on('click', 'explorer-zones-fill', (event) => {
            const feature = event.features?.[0];
            if (!feature) {
              return;
            }

            const zoneId = feature.properties?.id;
            if (zoneId && typeof onSelectZoneRef.current === 'function') {
              onSelectZoneRef.current(zoneId);
            }
          });

          mapInstance.on('mouseenter', 'explorer-zones-fill', () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });

          mapInstance.on('mouseleave', 'explorer-zones-fill', () => {
            mapInstance.getCanvas().style.cursor = '';
          });
        };

        mapInstance.on('load', handleLoad);
      } catch (error) {
        console.error('Failed to initialise explorer map', error);
      }
    };

    initialise();

    return () => {
      disposed = true;
      mapReadyRef.current = false;
      if (mapInstance) {
        mapInstance.remove();
      }
      mapRef.current = null;
      hasFitInitialBoundsRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) {
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
    if (!map || !mapReadyRef.current || !bounds || bounds.length !== 4) {
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
