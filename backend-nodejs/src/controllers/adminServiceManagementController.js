import { validationResult } from 'express-validator';
import {
  listServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  archiveServiceCategory,
  listAdminServiceListings,
  createAdminServiceListing,
  updateAdminServiceListing,
  updateAdminServiceListingStatus,
  archiveAdminServiceListing,
  getServiceManagementSnapshot
} from '../services/adminServiceManagementService.js';

function parseStatuses(queryValue) {
  if (!queryValue) {
    return null;
  }
  if (Array.isArray(queryValue)) {
    return queryValue;
  }
  return String(queryValue)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function listCategories(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive !== 'false';
    const categories = await listServiceCategories({ includeInactive });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const category = await createServiceCategory(req.body);
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const category = await updateServiceCategory(req.params.categoryId, req.body);
    res.json({ category });
  } catch (error) {
    next(error);
  }
}

export async function archiveCategory(req, res, next) {
  try {
    const category = await archiveServiceCategory(req.params.categoryId);
    res.json({ category });
  } catch (error) {
    next(error);
  }
}

export async function listListings(req, res, next) {
  try {
    const limit = Number.parseInt(req.query.limit ?? '25', 10);
    const offset = Number.parseInt(req.query.offset ?? '0', 10);
    const statuses = parseStatuses(req.query.statuses);
    const visibility = req.query.visibility ? String(req.query.visibility).trim() : null;
    const categoryId = req.query.categoryId || null;
    const providerId = req.query.providerId || null;
    const companyId = req.query.companyId || null;
    const search = req.query.search || null;

    const payload = await listAdminServiceListings({
      limit: Number.isNaN(limit) ? 25 : limit,
      offset: Number.isNaN(offset) ? 0 : offset,
      statuses,
      visibility,
      categoryId,
      providerId,
      companyId,
      search
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createListing(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const listing = await createAdminServiceListing(req.body);
    res.status(201).json({ listing });
  } catch (error) {
    next(error);
  }
}

export async function updateListing(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const listing = await updateAdminServiceListing(req.params.serviceId, req.body);
    res.json({ listing });
  } catch (error) {
    next(error);
  }
}

export async function updateListingStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const listing = await updateAdminServiceListingStatus(req.params.serviceId, req.body.status);
    res.json({ listing });
  } catch (error) {
    next(error);
  }
}

export async function archiveListing(req, res, next) {
  try {
    const listing = await archiveAdminServiceListing(req.params.serviceId);
    res.json({ listing });
  } catch (error) {
    next(error);
  }
}

export async function getServiceSnapshot(req, res, next) {
  try {
    const listingLimit = Number.parseInt(req.query.listingLimit ?? '12', 10);
    const packageLimit = Number.parseInt(req.query.packageLimit ?? '6', 10);
    const snapshot = await getServiceManagementSnapshot({
      listingLimit: Number.isNaN(listingLimit) ? 12 : listingLimit,
      packageLimit: Number.isNaN(packageLimit) ? 6 : packageLimit
    });
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
}

export default {
  listCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  listListings,
  createListing,
  updateListing,
  updateListingStatus,
  archiveListing,
  getServiceSnapshot
};
