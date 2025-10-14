import { validationResult } from 'express-validator';
import {
  listLiveFeed,
  listMarketplaceFeed,
  createLiveFeedPost,
  submitCustomJobBid,
  addCustomJobBidMessage
} from '../services/feedService.js';

function handleServiceError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return next(error);
}

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

export async function createLiveFeedPostHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const post = await createLiveFeedPost({
      userId: req.user?.id,
      title: req.body.title,
      description: req.body.description,
      budgetLabel: req.body.budgetLabel,
      budgetAmount: req.body.budgetAmount,
      budgetCurrency: req.body.budgetCurrency,
      category: req.body.category,
      categoryOther: req.body.categoryOther,
      metadata: req.body.metadata,
      images: req.body.images,
      location: req.body.location,
      zoneId: req.body.zoneId,
      allowOutOfZone: req.body.allowOutOfZone,
      bidDeadline: req.body.bidDeadline
    });

    res.status(201).json(post);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function submitCustomJobBidHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const bid = await submitCustomJobBid({
      postId: req.params.postId,
      providerId: req.user?.id,
      providerRole: req.user?.type,
      amount: req.body.amount,
      currency: req.body.currency,
      message: req.body.message,
      attachments: req.body.attachments
    });

    res.status(201).json(bid);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function addCustomJobBidMessageHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const message = await addCustomJobBidMessage({
      postId: req.params.postId,
      bidId: req.params.bidId,
      authorId: req.user?.id,
      authorRole: req.user?.type,
      body: req.body.body,
      attachments: req.body.attachments
    });

    res.status(201).json(message);
  } catch (error) {
    handleServiceError(res, next, error);
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
