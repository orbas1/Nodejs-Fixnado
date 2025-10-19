import { validationResult } from 'express-validator';

import {
  getCommerceSnapshot,
  getPersonaCommerceDashboard
} from '../services/commerceEngineService.js';

function buildActorContext(req) {
  const personaHeader = `${req.headers['x-fixnado-persona'] ?? ''}`.toLowerCase();
  const actor = req.auth?.actor ?? {};
  const user = req.user ?? {};
  return {
    persona: personaHeader || actor.persona || user.persona || user.type || null,
    actorId: actor.id ?? user.id ?? null,
    providerId: req.query.providerId || actor.providerId || user.providerId || null,
    companyId: req.query.companyId || actor.companyId || user.companyId || null,
    servicemanId: req.query.servicemanId || actor.servicemanId || null,
    userId: req.query.userId || user.id || null,
    regionId: req.query.regionId || actor.regionId || null
  };
}

export async function getCommerceSnapshotHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const persona = req.query.persona ?? buildActorContext(req).persona;
    const context = {
      ...buildActorContext(req),
      timeframe: req.query.timeframe,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      timezone: req.query.timezone,
      currency: req.query.currency
    };

    const snapshot = await getCommerceSnapshot(persona, context);
    res.json(snapshot);
  } catch (error) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ message: 'persona_not_supported' });
    }
    if (error?.statusCode === 422) {
      return res.status(422).json({ message: error.message });
    }
    next(error);
  }
}

export async function getPersonaCommerceDashboardHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const persona = req.params.persona ?? buildActorContext(req).persona;
    const context = {
      ...buildActorContext(req),
      timeframe: req.query.timeframe,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      timezone: req.query.timezone,
      currency: req.query.currency
    };

    const snapshot = await getPersonaCommerceDashboard(persona, context);
    res.json(snapshot);
  } catch (error) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ message: 'persona_not_supported' });
    }
    if (error?.statusCode === 422) {
      return res.status(422).json({ message: error.message });
    }
    next(error);
  }
}
