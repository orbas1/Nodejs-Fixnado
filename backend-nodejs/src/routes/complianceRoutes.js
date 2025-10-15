import { Router } from 'express';
import {
  createComplianceDocument,
  evaluateCompliance,
  getComplianceSummary,
  reviewComplianceDocumentAction,
  suspendCompany,
  toggleBadgeVisibility,
  createDataSubjectRequest,
  getDataSubjectRequests,
  generateDataSubjectRequestExport,
  updateDataSubjectRequest,
  getWarehouseExportRuns,
  createWarehouseExportRun
} from '../controllers/complianceController.js';

const router = Router();

router.post('/documents', createComplianceDocument);
router.post('/documents/:documentId/review', reviewComplianceDocumentAction);
router.get('/companies/:companyId', getComplianceSummary);
router.post('/companies/:companyId/evaluate', evaluateCompliance);
router.post('/companies/:companyId/badge', toggleBadgeVisibility);
router.post('/companies/:companyId/suspend', suspendCompany);
router.post('/data-requests', createDataSubjectRequest);
router.get('/data-requests', getDataSubjectRequests);
router.post('/data-requests/:requestId/export', generateDataSubjectRequestExport);
router.post('/data-requests/:requestId/status', updateDataSubjectRequest);
router.get('/data-warehouse/runs', getWarehouseExportRuns);
router.post('/data-warehouse/runs', createWarehouseExportRun);

export default router;
