import { validationResult } from 'express-validator';
import {
  createNotificationRecipient,
  deleteNotificationRecipient,
  getAccountSettings,
  updateAccountPreferences,
  updateAccountProfile,
  updateAccountSecurity,
  updateNotificationRecipient
} from '../services/accountSettingsService.js';

function hasValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

function resolveUserId(req) {
  return req.user?.id ?? null;
}

export async function getAccountSettingsHandler(req, res, next) {
  try {
    const settings = await getAccountSettings(resolveUserId(req));
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateAccountProfileHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const payload = req.body ?? {};
    const settings = await updateAccountProfile(resolveUserId(req), payload);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateAccountPreferencesHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const payload = req.body ?? {};
    const settings = await updateAccountPreferences(resolveUserId(req), payload);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateAccountSecurityHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const payload = req.body ?? {};
    const settings = await updateAccountSecurity(resolveUserId(req), payload);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function createNotificationRecipientHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const recipient = await createNotificationRecipient(resolveUserId(req), req.body ?? {});
    res.status(201).json(recipient);
  } catch (error) {
    next(error);
  }
}

export async function updateNotificationRecipientHandler(req, res, next) {
  try {
    if (hasValidationErrors(req, res)) {
      return;
    }
    const recipient = await updateNotificationRecipient(resolveUserId(req), req.params.recipientId, req.body ?? {});
    res.json(recipient);
  } catch (error) {
    next(error);
  }
}

export async function deleteNotificationRecipientHandler(req, res, next) {
  try {
    const result = await deleteNotificationRecipient(resolveUserId(req), req.params.recipientId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export default {
  getAccountSettingsHandler,
  updateAccountProfileHandler,
  updateAccountPreferencesHandler,
  updateAccountSecurityHandler,
  createNotificationRecipientHandler,
  updateNotificationRecipientHandler,
  deleteNotificationRecipientHandler
};
