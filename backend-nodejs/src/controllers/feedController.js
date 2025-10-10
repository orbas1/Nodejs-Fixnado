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
    const items = await listMarketplaceFeed();
    res.json(items);
  } catch (error) {
    next(error);
  }
}
