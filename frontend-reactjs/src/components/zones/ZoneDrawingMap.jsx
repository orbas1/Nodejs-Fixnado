import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import { loadMapLibre, preloadMapLibre } from '../../lib/mapLibreLoader.js';
import { createFeature, ensurePolygonWinding, geometriesAreEqual } from '../../lib/geojson.js';
import './zoneDrawingMap.css';

const DEFAULT_CENTER = [-0.118092, 51.509865];
const DEFAULT_ZOOM = 5;
const DRAFT_FEATURE_ID = 'fx-zone-draft';

function isPolygonLike(feature) {
  const geometry = feature?.geometry;
  return geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon');
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
  const maplibreRef = useRef(null);
  const drawRef = useRef(null);
  const mapReadyRef = useRef(false);
  const hasInitialFit = useRef(false);
  const lastEmittedGeometryRef = useRef(null);

  const onGeometryChangeRef = useRef(onGeometryChange);
  useEffect(() => {
    onGeometryChangeRef.current = onGeometryChange;
  }, [onGeometryChange]);

  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  const existingZonesRef = useRef(existingZones);
  useEffect(() => {
    existingZonesRef.current = existingZones;
  }, [existingZones]);

  const draftGeometryRef = useRef(draftGeometry);
  useEffect(() => {
    draftGeometryRef.current = draftGeometry;
  }, [draftGeometry]);

  useEffect(() => {
    preloadMapLibre();
  }, []);

  const syncGeometryFromStore = useCallback((ids = []) => {
    const draw = drawRef.current;
    if (!draw) {
      return;
    }

    const snapshot = draw.getSnapshot();
    const polygonFeatures = snapshot.filter((feature) => isPolygonLike(feature));

    if (polygonFeatures.length === 0) {
      if (lastEmittedGeometryRef.current !== null) {
        lastEmittedGeometryRef.current = null;
        if (typeof onGeometryChangeRef.current === 'function') {
          onGeometryChangeRef.current(null);
        }
      }
      return;
    }

    const preferredId = ids.find((id) => polygonFeatures.some((feature) => feature.id === id));
    const activeFeature =
      polygonFeatures.find((feature) => feature.id === preferredId) ??
      polygonFeatures[polygonFeatures.length - 1];

    const redundantIds = polygonFeatures
      .filter((feature) => feature.id !== activeFeature.id)
      .map((feature) => feature.id);
    if (redundantIds.length > 0) {
      draw.removeFeatures(redundantIds);
    }

    const geometry = ensurePolygonWinding(activeFeature.geometry);
    if (!geometry) {
      return;
    }

    if (!geometriesAreEqual(lastEmittedGeometryRef.current, geometry)) {
      lastEmittedGeometryRef.current = geometry;
      if (typeof onGeometryChangeRef.current === 'function') {
        onGeometryChangeRef.current(geometry);
      }
    }

    try {
      if (draw.getMode() !== 'select') {
        draw.setMode('select');
      }
      draw.selectFeature(activeFeature.id);
    } catch (error) {
      console.warn('[ZoneDrawingMap] failed to select active feature', error);
    }
  }, []);

  const applyDraftGeometry = useCallback((geometry) => {
    const draw = drawRef.current;
    if (!draw || !mapReadyRef.current) {
      return;
    }

    const sanitised = geometry ? ensurePolygonWinding(geometry) : null;
    const snapshot = draw.getSnapshot();
    const existing = snapshot.find((feature) => feature.id === DRAFT_FEATURE_ID);

    const staleIds = snapshot
      .filter((feature) => feature.id !== DRAFT_FEATURE_ID)
      .map((feature) => feature.id);
    if (staleIds.length > 0) {
      draw.removeFeatures(staleIds);
    }

    if (!sanitised) {
      if (existing) {
        draw.removeFeatures([DRAFT_FEATURE_ID]);
      }
      lastEmittedGeometryRef.current = null;
      return;
    }

    if (!existing) {
      const feature = createFeature(sanitised, { mode: 'polygon', label: 'service-zone-draft' }, { id: DRAFT_FEATURE_ID });
      if (feature) {
        draw.addFeatures([feature]);
      }
    } else if (!geometriesAreEqual(existing.geometry, sanitised)) {
      draw.updateFeatureGeometry(DRAFT_FEATURE_ID, sanitised);
    }

    lastEmittedGeometryRef.current = sanitised;

    try {
      draw.setMode('select');
      draw.selectFeature(DRAFT_FEATURE_ID);
    } catch (error) {
      console.warn('[ZoneDrawingMap] draft selection failed', error);
    }
  }, []);

  const applyExistingZonesToMap = useCallback((zones, { shouldFit = false } = {}) => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !mapReadyRef.current || !maplibregl) {
      return;
    }

    if (!zones) {
      if (map.getLayer('existing-zones-fill')) {
        map.removeLayer('existing-zones-fill');
      }
      if (map.getLayer('existing-zones-outline')) {
        map.removeLayer('existing-zones-outline');
      }
      if (map.getSource('existing-zones')) {
        map.removeSource('existing-zones');
      }
      return;
    }

    if (!map.getSource('existing-zones')) {
      map.addSource('existing-zones', {
        type: 'geojson',
        data: zones
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
    } else {
      map.getSource('existing-zones').setData(zones);
    }

    if (shouldFit && !hasInitialFit.current && Array.isArray(zones.features) && zones.features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      zones.features.forEach((feature) => {
        const geom = feature.geometry?.type === 'Feature' ? feature.geometry.geometry : feature.geometry;
        if (!geom?.coordinates) {
          return;
        }
        const coordinateSets =
          geom.type === 'Polygon' ? geom.coordinates : geom.coordinates?.flat?.(1) ?? [];
        coordinateSets
          .flat()
          .forEach(([lng, lat]) => {
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
              bounds.extend([lng, lat]);
            }
          });
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 48, duration: 0 });
        hasInitialFit.current = true;
      }
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let removeHandlers = () => {};
    let mapInstance;
    let drawInstance;

    const initialise = async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (disposed || !containerRef.current) {
          return;
        }

        maplibreRef.current = maplibregl;

        mapInstance = new maplibregl.Map({
          container: containerRef.current,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: focus ? [focus.longitude, focus.latitude] : DEFAULT_CENTER,
          zoom: focus ? 11 : DEFAULT_ZOOM,
          attributionControl: true
        });
        mapRef.current = mapInstance;

        mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

        const polygonMode = new TerraDrawPolygonMode({
          pointerDistance: 24,
          editable: true,
          showCoordinatePoints: true,
          keyEvents: { finish: 'Enter', cancel: 'Escape' }
        });
        const selectMode = new TerraDrawSelectMode({
          pointerDistance: 24,
          allowManualDeselection: true,
          flags: {
            polygon: {
              feature: {
                draggable: true,
                rotateable: false,
                scaleable: false,
                coordinates: {
                  draggable: true,
                  deletable: true,
                  midpoints: true
                }
              }
            }
          }
        });

        drawInstance = new TerraDraw({
          adapter: new TerraDrawMapLibreGLAdapter({
            map: mapInstance,
            prefixId: 'fx-zone'
          }),
          modes: [polygonMode, selectMode]
        });
        drawRef.current = drawInstance;

        const handleReady = () => {
          drawInstance.setMode('polygon');
        };
        const handleChange = (ids) => {
          syncGeometryFromStore(ids);
        };
        const handleFinish = (id) => {
          syncGeometryFromStore([id]);
        };
        const handleLoad = () => {
          mapReadyRef.current = true;
          applyExistingZonesToMap(existingZonesRef.current, { shouldFit: true });
          applyDraftGeometry(draftGeometryRef.current);
          syncGeometryFromStore();
          if (typeof onMapReadyRef.current === 'function') {
            onMapReadyRef.current({ map: mapInstance, draw: drawInstance });
          }
        };

        drawInstance.on('ready', handleReady);
        drawInstance.on('change', handleChange);
        drawInstance.on('finish', handleFinish);
        drawInstance.start();

        mapInstance.on('load', handleLoad);

        removeHandlers = () => {
          mapInstance.off('load', handleLoad);
          drawInstance.off('ready', handleReady);
          drawInstance.off('change', handleChange);
          drawInstance.off('finish', handleFinish);
        };
      } catch (error) {
        console.error('Failed to initialise zone drawing map', error);
      }
    };

    initialise();

    return () => {
      disposed = true;
      removeHandlers();
      mapReadyRef.current = false;
      hasInitialFit.current = false;
      lastEmittedGeometryRef.current = null;

      if (drawInstance) {
        try {
          drawInstance.stop();
        } catch (error) {
          console.warn('[ZoneDrawingMap] failed to stop Terra Draw cleanly', error);
        }
      }
      if (mapInstance) {
        mapInstance.remove();
      }
      drawRef.current = null;
      mapRef.current = null;
      maplibreRef.current = null;
    };
  }, [applyDraftGeometry, applyExistingZonesToMap, focus, syncGeometryFromStore]);

  useEffect(() => {
    if (!mapReadyRef.current) {
      return;
    }
    const map = mapRef.current;
    if (!map || !focus) {
      return;
    }
    map.flyTo({ center: [focus.longitude, focus.latitude], zoom: 12, essential: true });
  }, [focus]);

  useEffect(() => {
    if (!mapReadyRef.current) {
      return;
    }
    const shouldFit = !hasInitialFit.current;
    applyExistingZonesToMap(existingZones, { shouldFit });
  }, [existingZones, applyExistingZonesToMap]);

  useEffect(() => {
    if (!mapReadyRef.current) {
      return;
    }
    applyDraftGeometry(draftGeometry);
  }, [draftGeometry, applyDraftGeometry]);

  return (
    <div className="fx-zone-drawing-map" aria-label="Draw service zones">
      <div ref={containerRef} className="fx-zone-drawing-map__canvas" role="presentation" />
    </div>
  );
}

ZoneDrawingMap.propTypes = {
  draftGeometry: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onGeometryChange: PropTypes.func.isRequired,
  existingZones: PropTypes.shape({
    type: PropTypes.string,
    features: PropTypes.array
  }),
  focus: PropTypes.shape({
    longitude: PropTypes.number,
    latitude: PropTypes.number
  }),
  onMapReady: PropTypes.func
};

ZoneDrawingMap.defaultProps = {
  draftGeometry: null,
  existingZones: null,
  focus: null,
  onMapReady: undefined
};
