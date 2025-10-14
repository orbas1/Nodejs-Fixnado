import { getMaterialsShowcase } from '../services/materialsShowcaseService.js';

export async function materialsShowcase(req, res, next) {
  try {
    const companyId = req.query.companyId || null;
    const { data, meta } = await getMaterialsShowcase({ companyId });
    res.json({ data, meta });
  } catch (error) {
    next(error);
  }
}
