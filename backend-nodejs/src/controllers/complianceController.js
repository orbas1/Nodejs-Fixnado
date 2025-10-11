import {
  evaluateInsuredSellerStatus,
  getCompanyComplianceSummary,
  reviewComplianceDocument,
  submitComplianceDocument,
  suspendInsuredSeller,
  toggleInsuredSellerBadge
} from '../services/complianceService.js';

export async function createComplianceDocument(req, res, next) {
  try {
    const document = await submitComplianceDocument(req.body);
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export async function reviewComplianceDocumentAction(req, res, next) {
  try {
    const { documentId } = req.params;
    const document = await reviewComplianceDocument(documentId, req.body);
    res.json(document);
  } catch (error) {
    next(error);
  }
}

export async function getComplianceSummary(req, res, next) {
  try {
    const { companyId } = req.params;
    const summary = await getCompanyComplianceSummary(companyId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function evaluateCompliance(req, res, next) {
  try {
    const { companyId } = req.params;
    const application = await evaluateInsuredSellerStatus(companyId, req.body || {});
    res.json(application);
  } catch (error) {
    next(error);
  }
}

export async function toggleBadgeVisibility(req, res, next) {
  try {
    const { companyId } = req.params;
    const { visible, actorId = null } = req.body;
    const application = await toggleInsuredSellerBadge(companyId, { actorId, visible });
    res.json(application);
  } catch (error) {
    next(error);
  }
}

export async function suspendCompany(req, res, next) {
  try {
    const { companyId } = req.params;
    const application = await suspendInsuredSeller(companyId, req.body);
    res.json(application);
  } catch (error) {
    next(error);
  }
}
