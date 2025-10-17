import { Router } from 'express';
import { param } from 'express-validator';
import {
  getTaxWorkspaceHandler,
  updateTaxProfileHandler,
  listTaxFilingsHandler,
  createTaxFilingHandler,
  updateTaxFilingHandler,
  updateTaxFilingStatusHandler,
  deleteTaxFilingHandler,
  listTaxTasksHandler,
  createTaxTaskHandler,
  updateTaxTaskHandler,
  updateTaxTaskStatusHandler,
  deleteTaxTaskHandler,
  listTaxDocumentsHandler,
  createTaxDocumentHandler,
  updateTaxDocumentHandler,
  deleteTaxDocumentHandler
} from '../controllers/servicemanTaxController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const guard = (surface) =>
  enforcePolicy('serviceman.tax.manage', {
    metadata: (req) => ({
      surface,
      persona: req.headers['x-fixnado-persona'] || null
    })
  });

const filingParamValidator = [param('filingId').isUUID(4)];
const taskParamValidator = [param('taskId').isUUID(4)];
const documentParamValidator = [param('documentId').isUUID(4)];

router.use(authenticate);

router.get('/', guard('tax:workspace'), getTaxWorkspaceHandler);
router.put('/profile', guard('tax:profile'), updateTaxProfileHandler);

router.get('/filings', guard('tax:filings:list'), listTaxFilingsHandler);
router.post('/filings', guard('tax:filings:create'), createTaxFilingHandler);
router.put('/filings/:filingId', guard('tax:filings:update'), filingParamValidator, updateTaxFilingHandler);
router.patch(
  '/filings/:filingId/status',
  guard('tax:filings:status'),
  filingParamValidator,
  updateTaxFilingStatusHandler
);
router.delete('/filings/:filingId', guard('tax:filings:delete'), filingParamValidator, deleteTaxFilingHandler);

router.get('/tasks', guard('tax:tasks:list'), listTaxTasksHandler);
router.post('/tasks', guard('tax:tasks:create'), createTaxTaskHandler);
router.put('/tasks/:taskId', guard('tax:tasks:update'), taskParamValidator, updateTaxTaskHandler);
router.patch(
  '/tasks/:taskId/status',
  guard('tax:tasks:status'),
  taskParamValidator,
  updateTaxTaskStatusHandler
);
router.delete('/tasks/:taskId', guard('tax:tasks:delete'), taskParamValidator, deleteTaxTaskHandler);

router.get('/documents', guard('tax:documents:list'), listTaxDocumentsHandler);
router.post('/documents', guard('tax:documents:create'), createTaxDocumentHandler);
router.put(
  '/documents/:documentId',
  guard('tax:documents:update'),
  documentParamValidator,
  updateTaxDocumentHandler
);
router.delete(
  '/documents/:documentId',
  guard('tax:documents:delete'),
  documentParamValidator,
  deleteTaxDocumentHandler
);

export default router;
