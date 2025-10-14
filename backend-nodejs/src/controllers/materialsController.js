import { getMaterialsShowcase } from '../services/materialsShowcaseService.js';

export async function materialsShowcase(req, res, next) {
  try {
    const companyId = req.query.companyId || null;
    const forceRefreshValue = typeof req.query.forceRefresh === 'string' ? req.query.forceRefresh : undefined;
    const forceRefresh =
      forceRefreshValue && ['1', 'true', 'yes'].includes(forceRefreshValue.toLowerCase());

    const { data, meta } = await getMaterialsShowcase({ companyId, forceRefresh });

    if (meta?.cache?.ttlSeconds) {
      res.set('Cache-Control', `private, max-age=${meta.cache.ttlSeconds}`);
    }

    res.json({ data, meta });
  } catch (error) {
    next(error);
  }
}
