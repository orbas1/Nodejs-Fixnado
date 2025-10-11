import { listLiveFeed, listMarketplaceFeed } from '../services/feedService.js';

export async function getLiveFeed(req, res, next) {
  try {
    const posts = await listLiveFeed();
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
