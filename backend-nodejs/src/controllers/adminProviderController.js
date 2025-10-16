import { body, param, query, validationResult } from 'express-validator';
import {
  listProviders,
  createProvider,
  getProvider,
  updateProvider,
  archiveProvider,
  upsertProviderContact,
  deleteProviderContact,
  upsertProviderCoverage,
  deleteProviderCoverage,
  PROVIDER_STATUS_OPTIONS,
  PROVIDER_STAGE_OPTIONS,
  PROVIDER_TIER_OPTIONS,
  PROVIDER_RISK_OPTIONS,
  PROVIDER_COVERAGE_OPTIONS,
  PROVIDER_INSURED_OPTIONS
} from '../services/adminProviderService.js';

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return false;
  }
  return true;
}

export const listProvidersValidators = [
  query('status').optional().isIn(PROVIDER_STATUS_OPTIONS),
  query('search').optional().isString().trim().isLength({ min: 2 })
];

export async function listProvidersHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await listProviders({
      limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query.offset ? Number.parseInt(req.query.offset, 10) : undefined,
      status: req.query.status,
      search: req.query.search
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export const getProviderValidators = [param('companyId').isUUID(4)];

export async function getProviderHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await getProvider(req.params.companyId);
    res.json(payload);
  } catch (error) {
    if (error.message === 'Provider not found') {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }
    next(error);
  }
}

const profileValidators = [
  body('profile.displayName').optional().isString().trim().isLength({ min: 2, max: 120 }),
  body('profile.tradingName').optional().isString().trim().isLength({ min: 2, max: 120 }),
  body('profile.status').optional().isIn(PROVIDER_STATUS_OPTIONS),
  body('profile.onboardingStage').optional().isIn(PROVIDER_STAGE_OPTIONS),
  body('profile.tier').optional().isIn(PROVIDER_TIER_OPTIONS),
  body('profile.riskRating').optional().isIn(PROVIDER_RISK_OPTIONS),
  body('profile.supportEmail').optional().isEmail(),
  body('profile.supportPhone').optional().isString().trim().isLength({ min: 4, max: 40 }),
  body('profile.websiteUrl').optional().isURL({ require_tld: false }),
  body('profile.logoUrl').optional().isURL({ require_tld: false }),
  body('profile.heroImageUrl').optional().isURL({ require_tld: false }),
  body('profile.storefrontSlug').optional().isString().trim().isLength({ min: 3, max: 160 }),
  body('profile.tags').optional().isArray(),
  body('profile.tags.*').optional().isString().trim().isLength({ min: 1, max: 60 })
];

const companyValidators = [
  body('company.contactName').optional().isString().trim().isLength({ min: 2, max: 160 }),
  body('company.contactEmail').optional().isEmail(),
  body('company.serviceRegions').optional().isString().trim(),
  body('company.marketplaceIntent').optional().isString().trim(),
  body('company.verified').optional().isBoolean(),
  body('company.insuredSellerStatus').optional().isIn(PROVIDER_INSURED_OPTIONS),
  body('company.insuredSellerBadgeVisible').optional().isBoolean(),
  body('company.complianceScore').optional().isFloat({ min: 0, max: 100 }),
  body('company.regionId').optional().isUUID(4)
];

export const createProviderValidators = [
  body('owner.firstName').isString().trim().isLength({ min: 2, max: 120 }),
  body('owner.lastName').isString().trim().isLength({ min: 2, max: 120 }),
  body('owner.email').isEmail(),
  body('owner.temporaryPassword').isLength({ min: 12 }),
  body('owner.phone').optional().isString().trim().isLength({ min: 6, max: 40 }),
  ...profileValidators,
  ...companyValidators
];

export async function createProviderHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await createProvider(req.body);
    res.status(201).json(payload);
  } catch (error) {
    if (error.message === 'Email already in use') {
      res.status(409).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const updateProviderValidators = [param('companyId').isUUID(4), ...profileValidators, ...companyValidators];

export async function updateProviderHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await updateProvider(req.params.companyId, req.body);
    res.json(payload);
  } catch (error) {
    if (error.message === 'Provider not found') {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }
    next(error);
  }
}

export const archiveProviderValidators = [
  param('companyId').isUUID(4),
  body('reason').optional().isString().trim().isLength({ min: 3, max: 500 }),
  body('actor').optional().isString().trim().isLength({ min: 2, max: 160 })
];

export async function archiveProviderHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await archiveProvider(req.params.companyId, {
      reason: req.body?.reason,
      actor: req.body?.actor
    });
    res.json(payload);
  } catch (error) {
    if (error.message === 'Provider not found') {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }
    next(error);
  }
}

export const upsertContactValidators = [
  param('companyId').isUUID(4),
  param('contactId').optional().isUUID(4),
  body('name').isString().trim().isLength({ min: 2, max: 160 }),
  body('email').optional().isEmail(),
  body('phone').optional().isString().trim().isLength({ min: 6, max: 40 }),
  body('role').optional().isString().trim().isLength({ min: 2, max: 120 }),
  body('type').optional().isIn(['owner', 'operations', 'finance', 'compliance', 'support', 'sales', 'other']),
  body('isPrimary').optional().isBoolean(),
  body('notes').optional().isString().trim(),
  body('avatarUrl').optional().isURL({ require_tld: false })
];

export async function upsertProviderContactHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await upsertProviderContact(req.params.companyId, req.params.contactId, req.body);
    res.status(req.params.contactId ? 200 : 201).json(payload);
  } catch (error) {
    if (error.message === 'Provider not found' || error.message === 'Contact not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const deleteContactValidators = [param('companyId').isUUID(4), param('contactId').isUUID(4)];

export async function deleteProviderContactHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    await deleteProviderContact(req.params.companyId, req.params.contactId);
    res.status(204).end();
  } catch (error) {
    if (error.message === 'Contact not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const upsertCoverageValidators = [
  param('companyId').isUUID(4),
  param('coverageId').optional().isUUID(4),
  body('zoneId').isUUID(4),
  body('coverageType').optional().isIn(PROVIDER_COVERAGE_OPTIONS),
  body('slaMinutes').optional().isInt({ min: 0 }),
  body('maxCapacity').optional().isInt({ min: 0 }),
  body('effectiveFrom').optional().isISO8601(),
  body('effectiveTo').optional().isISO8601(),
  body('notes').optional().isString().trim()
];

export async function upsertProviderCoverageHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await upsertProviderCoverage(req.params.companyId, req.params.coverageId, req.body);
    res.status(req.params.coverageId ? 200 : 201).json(payload);
  } catch (error) {
    if (error.message === 'Provider not found' || error.message === 'Coverage not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const deleteCoverageValidators = [param('companyId').isUUID(4), param('coverageId').isUUID(4)];

export async function deleteProviderCoverageHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    await deleteProviderCoverage(req.params.companyId, req.params.coverageId);
    res.status(204).end();
  } catch (error) {
    if (error.message === 'Coverage not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}
