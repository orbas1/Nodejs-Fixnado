let mapLibrePromise;
let cssReadyPromise;

async function ensureCssLoaded() {
  if (typeof window === 'undefined') {
    return;
  }
  if (!cssReadyPromise) {
    cssReadyPromise = import('maplibre-gl/dist/maplibre-gl.css').then(() => true);
  }
  await cssReadyPromise;
}

export async function loadMapLibre() {
  if (!mapLibrePromise) {
    mapLibrePromise = import('maplibre-gl')
      .then((module) => module?.default ?? module)
      .catch((error) => {
        mapLibrePromise = undefined;
        throw error;
      });
  }

  await ensureCssLoaded();
  return mapLibrePromise;
}

export function preloadMapLibre() {
  if (!mapLibrePromise) {
    void loadMapLibre();
  }
}
