import { validationResult } from 'express-validator';
import {
  getProviderSettings,
  updateProviderProfile,
  updateProviderBranding,
  updateProviderOperations,
  upsertProviderContact,
  deleteProviderContact,
  upsertProviderCoverage,
  deleteProviderCoverage
} from '../services/providerSettingsService.js';

function hasValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

function resolveCompanyOptions(req) {
  return { companyId: req.query?.companyId ?? null };
}

export async function getProviderSettingsHandler(req, res, next) {
  try {
    const settings = await getProviderSettings(req.user, resolveCompanyOptions(req));
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateProviderProfileHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const settings = await updateProviderProfile(req.user, req.body ?? {}, resolveCompanyOptions(req));
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateProviderBrandingHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const settings = await updateProviderBranding(req.user, req.body ?? {}, resolveCompanyOptions(req));
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateProviderOperationsHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const settings = await updateProviderOperations(req.user, req.body ?? {}, resolveCompanyOptions(req));
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function createProviderContactHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const settings = await upsertProviderContact(req.user, null, req.body ?? {}, resolveCompanyOptions(req));
    res.status(201).json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateProviderContactHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const settings = await upsertProviderContact(
      req.user,
      req.params.contactId,
      req.body ?? {},
      resolveCompanyOptions(req)
    );
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function deleteProviderContactHandler(req, res, next) {
  try {
    const settings = await deleteProviderContact(req.user, req.params.contactId, resolveCompanyOptions(req));
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function createProviderCoverageHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const settings = await upsertProviderCoverage(req.user, null, req.body ?? {}, resolveCompanyOptions(req));
    res.status(201).json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateProviderCoverageHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const settings = await upsertProviderCoverage(
      req.user,
      req.params.coverageId,
      req.body ?? {},
      resolveCompanyOptions(req)
    );
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function deleteProviderCoverageHandler(req, res, next) {
  try {
    const settings = await deleteProviderCoverage(req.user, req.params.coverageId, resolveCompanyOptions(req));
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export default {
  getProviderSettingsHandler,
  updateProviderProfileHandler,
  updateProviderBrandingHandler,
  updateProviderOperationsHandler,
  createProviderContactHandler,
  updateProviderContactHandler,
  deleteProviderContactHandler,
  createProviderCoverageHandler,
  updateProviderCoverageHandler,
  deleteProviderCoverageHandler
};
