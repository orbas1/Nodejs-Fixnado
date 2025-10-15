import {
  evaluateInsuredSellerStatus,
  getCompanyComplianceSummary,
  reviewComplianceDocument,
  submitComplianceDocument,
  suspendInsuredSeller,
  toggleInsuredSellerBadge
} from '../services/complianceService.js';
import {
  submitDataSubjectRequest,
  listDataSubjectRequests,
  generateDataSubjectExport,
  updateDataSubjectRequestStatus
} from '../services/dataGovernanceService.js';

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

export async function createDataSubjectRequest(req, res, next) {
  try {
    const request = await submitDataSubjectRequest(req.body);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

export async function getDataSubjectRequests(req, res, next) {
  try {
    const requests = await listDataSubjectRequests({
      status: req.query.status,
      limit: req.query.limit ? Number(req.query.limit) : 50
    });
    res.json(requests);
  } catch (error) {
    next(error);
  }
}

export async function generateDataSubjectRequestExport(req, res, next) {
  try {
    const { requestId } = req.params;
    const { filePath, request } = await generateDataSubjectExport(requestId, req.body.actorId);
    res.json({ filePath, request });
  } catch (error) {
    next(error);
  }
}

export async function updateDataSubjectRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const { status, note, actorId } = req.body;
    const request = await updateDataSubjectRequestStatus(requestId, status, actorId, note);
    res.json(request);
  } catch (error) {
    next(error);
  }
}
