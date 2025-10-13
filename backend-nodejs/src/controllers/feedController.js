import { listLiveFeed, listMarketplaceFeed } from '../services/feedService.js';

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => parseBoolean(entry, defaultValue));
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function coerceArray(value) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((entry) =>
      String(entry)
        .split(',')
        .map((token) => token.trim())
    )
    .filter(Boolean);
}

export async function getLiveFeed(req, res, next) {
  try {
    const zoneIds = coerceArray(req.query.zoneIds);
    const singleZoneIds = coerceArray(req.query.zoneId);
    const resolvedZoneIds = Array.from(new Set([...zoneIds, ...singleZoneIds]));

    const limit = Array.isArray(req.query.limit)
      ? Number.parseInt(req.query.limit.at(0), 10)
      : req.query.limit
        ? Number.parseInt(req.query.limit, 10)
        : undefined;

    const posts = await listLiveFeed({
      zoneIds: resolvedZoneIds,
      includeOutOfZone: parseBoolean(req.query.includeOutOfZone),
      outOfZoneOnly: parseBoolean(req.query.outOfZoneOnly),
      limit: Number.isFinite(limit) ? limit : undefined
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

export async function getMarketplaceFeed(req, res, next) {
  try {
    const { limit } = req.query;
    const items = await listMarketplaceFeed({
      limit: limit ? Number.parseInt(limit, 10) : undefined
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
}
