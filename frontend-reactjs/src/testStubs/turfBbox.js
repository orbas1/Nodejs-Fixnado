function collectPoints(coords, points) {
  if (!Array.isArray(coords)) {
    return;
  }
  if (coords.length && typeof coords[0] === 'number') {
    points.push(coords);
    return;
  }
  coords.forEach((value) => collectPoints(value, points));
}

export function bbox(collection) {
  const points = [];
  collection?.features?.forEach((feat) => {
    collectPoints(feat.geometry?.coordinates, points);
  });

  if (points.length === 0) {
    return [0, 0, 0, 0];
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach(([x, y]) => {
    if (typeof x !== 'number' || typeof y !== 'number') {
      return;
    }
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  return [minX, minY, maxX, maxY];
}

export default bbox;
