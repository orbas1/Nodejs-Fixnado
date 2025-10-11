import { validationResult, body } from 'express-validator';
import {
  getFeatureToggle,
  listFeatureToggles,
  upsertFeatureToggle
} from '../services/featureToggleService.js';

export const upsertToggleValidators = [
  body('state')
    .optional()
    .isIn(['enabled', 'disabled', 'pilot', 'staging', 'sunset'])
    .withMessage('state must be one of enabled|disabled|pilot|staging|sunset'),
  body('rollout')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('rollout must be between 0 and 1'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('description must be 1000 characters or fewer'),
  body('ticket')
    .optional()
    .isLength({ max: 120 })
    .withMessage('ticket reference must be 120 characters or fewer'),
  body('owner')
    .optional()
    .isLength({ max: 120 })
    .withMessage('owner must be 120 characters or fewer')
];

export async function getToggles(req, res, next) {
  try {
    const toggles = await listFeatureToggles({ forceRefresh: req.query.refresh === 'true' });
    res.json({ toggles });
  } catch (error) {
    next(error);
  }
}

export async function getToggle(req, res, next) {
  try {
    const toggle = await getFeatureToggle(req.params.key);
    if (!toggle) {
      return res.status(404).json({ message: `Toggle ${req.params.key} not found` });
    }
    res.json({ toggle });
  } catch (error) {
    next(error);
  }
}

export async function updateToggle(req, res, next) {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    return res.status(422).json({ errors: validation.array() });
  }

  try {
    const toggle = await upsertFeatureToggle(req.params.key, req.body, req.user?.id ?? 'system');
    res.json({ toggle });
  } catch (error) {
    next(error);
  }
}
