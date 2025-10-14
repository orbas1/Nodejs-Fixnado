import { buildBusinessFront, buildProviderDashboard } from '../services/panelService.js';
import { getEnterprisePanelOverview } from '../services/enterprisePanelService.js';

export async function getProviderDashboardHandler(req, res, next) {
  try {
    const { data, meta } = await buildProviderDashboard({
      companyId: req.query.companyId,
      actor: req.user
    });
    res.json({ data, meta });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message || 'company_not_found' });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message || 'forbidden' });
    }
    next(error);
  }
}

export async function getEnterprisePanelHandler(req, res, next) {
  try {
    const payload = await getEnterprisePanelOverview({
      companyId: req.query.companyId,
      timezone: req.query.timezone
    });
    res.json({ data: payload, ...payload });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message || 'company_not_found' });
    }
    next(error);
  }
}

export async function getBusinessFrontHandler(req, res, next) {
  try {
    const slug = req.params.slug || 'featured';
    const { data, meta } = await buildBusinessFront({ slug });
    res.json({ data, meta });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message || 'company_not_found' });
    }
    next(error);
  }
}

