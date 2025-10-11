import {
  createMarketplaceItem,
  listApprovedMarketplaceItems,
  listModerationQueue,
  moderateMarketplaceItem,
  submitMarketplaceItemForReview
} from '../services/marketplaceService.js';

export async function createItem(req, res, next) {
  try {
    const item = await createMarketplaceItem(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function submitForReview(req, res, next) {
  try {
    const { itemId } = req.params;
    const item = await submitMarketplaceItemForReview(itemId, req.body || {});
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function moderateItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const item = await moderateMarketplaceItem(itemId, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function getModerationQueue(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const queue = await listModerationQueue({
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined
    });
    res.json(queue);
  } catch (error) {
    next(error);
  }
}

export async function listApprovedItems(req, res, next) {
  try {
    const { limit } = req.query;
    const items = await listApprovedMarketplaceItems({
      limit: limit ? Number.parseInt(limit, 10) : undefined
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
}
