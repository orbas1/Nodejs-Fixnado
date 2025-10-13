import { searchNetwork, searchProviders } from '../services/searchService.js';

export async function search(req, res, next) {
  try {
    const data = await searchNetwork({
      term: req.query.q,
      limit: Number(req.query.limit),
      category: req.query.category,
      serviceType: req.query.serviceType,
      zoneId: req.query.zoneId
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function searchTalent(req, res, next) {
  try {
    const data = await searchProviders(req.query.q || '');
    res.json(data);
  } catch (error) {
    next(error);
  }
}
