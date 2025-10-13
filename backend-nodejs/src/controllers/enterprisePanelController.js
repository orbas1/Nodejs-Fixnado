import { validationResult } from 'express-validator';
import { getEnterprisePanelOverview } from '../services/enterprisePanelService.js';

export async function getEnterprisePanelHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = await getEnterprisePanelOverview({
      companyId: req.query.companyId,
      timezone: req.query.timezone
    });

    res.json(payload);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}
