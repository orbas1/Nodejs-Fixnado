import { Router } from 'express';
import {
  createComplianceDocument,
  evaluateCompliance,
  getComplianceSummary,
  reviewComplianceDocumentAction,
  suspendCompany,
  toggleBadgeVisibility
} from '../controllers/complianceController.js';

const router = Router();

router.post('/documents', createComplianceDocument);
router.post('/documents/:documentId/review', reviewComplianceDocumentAction);
router.get('/companies/:companyId', getComplianceSummary);
router.post('/companies/:companyId/evaluate', evaluateCompliance);
router.post('/companies/:companyId/badge', toggleBadgeVisibility);
router.post('/companies/:companyId/suspend', suspendCompany);

export default router;
