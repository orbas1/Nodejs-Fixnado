import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './zoneDrawingMap.css';

const DEFAULT_CENTER = [-0.118092, 51.509865];
const DEFAULT_ZOOM = 5;

function toFeature(geometry) {
  if (!geometry) {
    return null;
  }
  if (geometry.type === 'Feature') {
    return geometry;
  }
  return {
    type: 'Feature',
    properties: {},
    geometry
  };
}

function normaliseGeometry(feature) {
  if (!feature?.geometry) {
    return null;
  }
  if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
    return feature.geometry;
  }
  if (feature.geometry.type === 'Feature' && feature.geometry.geometry) {
    return normaliseGeometry(feature.geometry);
  }
  return null;
}

export default function ZoneDrawingMap({
  draftGeometry,
  onGeometryChange,
  existingZones,
  focus,
  onMapReady
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const hasInitialFit = useRef(false);

  useEffect(() => {
    if (!containerRef.current) {
      return () => {};
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: focus ? [focus.longitude, focus.latitude] : DEFAULT_CENTER,
      zoom: focus ? 11 : DEFAULT_ZOOM,
      attributionControl: true
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      }
    });

    map.addControl(draw, 'top-left');

    const handleLoad = () => {
      if (existingZones) {
        map.addSource('existing-zones', {
          type: 'geojson',
          data: existingZones
        });

        map.addLayer({
          id: 'existing-zones-fill',
          type: 'fill',
          source: 'existing-zones',
          paint: {
            'fill-color': '#38bdf8',
            'fill-opacity': 0.18
          }
        });

        map.addLayer({
          id: 'existing-zones-outline',
          type: 'line',
          source: 'existing-zones',
          paint: {
            'line-color': '#0ea5e9',
            'line-opacity': 0.65,
            'line-width': 1.5
          }
        });

        if (existingZones.features?.length && !hasInitialFit.current) {
          const bounds = new maplibregl.LngLatBounds();
          existingZones.features.forEach((feature) => {
            const geom = feature.geometry?.type === 'Feature' ? feature.geometry.geometry : feature.geometry;
            if (!geom?.coordinates) {
              return;
            }
            const coords = geom.type === 'Polygon' ? geom.coordinates : geom.coordinates?.flat?.(1) ?? [];
            coords.flat().forEach(([lng, lat]) => bounds.extend([lng, lat]));
          });
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 48, duration: 0 });
            hasInitialFit.current = true;
          }
        }
      }

      if (draftGeometry) {
        const feature = toFeature(draftGeometry);
        if (feature) {
          draw.add(feature);
        }
      }

      if (typeof onMapReady === 'function') {
        onMapReady({ map, draw });
      }
    };

    const handleChange = () => {
      const collection = draw.getAll();
      if (collection.features.length > 1) {
        const [latest] = collection.features.slice(-1);
        const older = collection.features.slice(0, -1).map((feature) => feature.id);
        if (older.length > 0) {
          draw.delete(older);
        }
        onGeometryChange(normaliseGeometry(latest));
        return;
      }
      const [feature] = collection.features;
      onGeometryChange(normaliseGeometry(feature));
    };

    map.on('load', handleLoad);
    map.on('draw.create', handleChange);
    map.on('draw.update', handleChange);
    map.on('draw.delete', handleChange);

    mapRef.current = map;
    drawRef.current = draw;

    return () => {
      map.off('load', handleLoad);
      map.off('draw.create', handleChange);
      map.off('draw.update', handleChange);
      map.off('draw.delete', handleChange);
      draw.deleteAll();
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !existingZones) {
      return;
    }
    if (!map.getSource('existing-zones')) {
      return;
    }
    map.getSource('existing-zones').setData(existingZones);
  }, [existingZones]);

  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) {
      return;
    }
    draw.deleteAll();
    if (draftGeometry) {
      const feature = toFeature(draftGeometry);
      if (feature) {
        draw.add(feature);
      }
    }
  }, [draftGeometry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) {
      return;
    }
    map.flyTo({ center: [focus.longitude, focus.latitude], zoom: 12, essential: true });
  }, [focus]);

  return <div ref={containerRef} className="fx-zone-drawing-map" aria-label="Zone drawing map" />;
}

ZoneDrawingMap.propTypes = {
  draftGeometry: PropTypes.oneOfType([
    PropTypes.shape({ type: PropTypes.string, coordinates: PropTypes.array }),
    PropTypes.shape({ type: PropTypes.string, geometry: PropTypes.object })
  ]),
  onGeometryChange: PropTypes.func.isRequired,
  existingZones: PropTypes.shape({ type: PropTypes.string, features: PropTypes.array }),
  focus: PropTypes.shape({ latitude: PropTypes.number, longitude: PropTypes.number }),
  onMapReady: PropTypes.func
};

ZoneDrawingMap.defaultProps = {
  draftGeometry: null,
  existingZones: null,
  focus: null,
  onMapReady: undefined
};
