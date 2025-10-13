import { buildBusinessFront, buildEnterprisePanel, buildProviderDashboard } from '../services/panelService.js';

export async function getProviderDashboardHandler(req, res, next) {
  try {
    const { data, meta } = await buildProviderDashboard({ companyId: req.query.companyId });
    res.json({ data, meta });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message || 'company_not_found' });
    }
    next(error);
  }
}

export async function getEnterprisePanelHandler(req, res, next) {
  try {
    const { data, meta } = await buildEnterprisePanel({ companyId: req.query.companyId });
    res.json({ data, meta });
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

