import {
  getEnterpriseUpgradeForActor,
  createEnterpriseUpgrade,
  updateEnterpriseUpgrade
} from '../services/providerUpgradeService.js';

function toErrorResponse(error, fallbackStatus = 500, fallbackMessage = 'internal_error') {
  const status = error.statusCode ?? fallbackStatus;
  const message = error.message || fallbackMessage;
  return { status, message };
}

export async function getProviderEnterpriseUpgrade(req, res, next) {
  try {
    const payload = await getEnterpriseUpgradeForActor({
      companyId: req.query.companyId,
      actor: req.user
    });
    res.json({ data: payload });
  } catch (error) {
    if (error.statusCode && [403, 404].includes(error.statusCode)) {
      const { status, message } = toErrorResponse(error, error.statusCode, error.message);
      return res.status(status).json({ message });
    }
    next(error);
  }
}

export async function createProviderEnterpriseUpgrade(req, res, next) {
  try {
    const payload = await createEnterpriseUpgrade({
      actor: req.user,
      companyId: req.body?.companyId ?? req.query.companyId,
      payload: req.body ?? {}
    });
    res.status(201).json({ data: payload });
  } catch (error) {
    if (error.statusCode && [403, 404, 409].includes(error.statusCode)) {
      const { status, message } = toErrorResponse(error, error.statusCode, error.message);
      return res.status(status).json({ message });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ message: 'invalid_payload', details: error.issues });
    }
    next(error);
  }
}

export async function updateProviderEnterpriseUpgrade(req, res, next) {
  try {
    const payload = await updateEnterpriseUpgrade({
      actor: req.user,
      companyId: req.body?.companyId ?? req.query.companyId,
      requestId: req.params.requestId,
      payload: req.body ?? {}
    });
    res.json({ data: payload });
  } catch (error) {
    if (error.statusCode && [403, 404].includes(error.statusCode)) {
      const { status, message } = toErrorResponse(error, error.statusCode, error.message);
      return res.status(status).json({ message });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ message: 'invalid_payload', details: error.issues });
    }
    next(error);
  }
}
