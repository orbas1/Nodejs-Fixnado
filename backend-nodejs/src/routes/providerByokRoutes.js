import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  archiveProviderByokIntegrationHandler,
  createProviderByokIntegrationHandler,
  listProviderByokAuditLogsHandler,
  listProviderByokIntegrationsHandler,
  testProviderByokIntegrationHandler,
  updateProviderByokIntegrationHandler
} from '../controllers/providerByokController.js';

const router = Router({ mergeParams: true });

const integrationIdParam = param('integrationId').isUUID(4);

const baseValidators = [body().isObject().withMessage('Request body must be an object')];

const createValidators = [
  body('integration').isString().trim().isLength({ min: 2, max: 64 }),
  body('displayName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('status').optional().isString().trim().isLength({ min: 2, max: 32 }),
  body('settings').optional().isObject(),
  body('credentials').optional().isObject(),
  body('metadata').optional().isObject()
];

const updateValidators = [
  body('displayName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('status').optional().isString().trim().isLength({ min: 2, max: 32 }),
  body('settings').optional().isObject(),
  body('credentials').optional().isObject(),
  body('metadata').optional().isObject()
];

router.get('/', listProviderByokIntegrationsHandler);

router.post('/', [...baseValidators, ...createValidators], createProviderByokIntegrationHandler);

router.put('/:integrationId', [integrationIdParam, ...updateValidators], updateProviderByokIntegrationHandler);
router.patch('/:integrationId', [integrationIdParam, ...updateValidators], updateProviderByokIntegrationHandler);

router.delete('/:integrationId', [integrationIdParam], archiveProviderByokIntegrationHandler);

router.post('/:integrationId/test', [integrationIdParam], testProviderByokIntegrationHandler);

router.get(
  '/:integrationId/audit',
  [integrationIdParam, query('limit').optional().isInt({ min: 1, max: 100 })],
  listProviderByokAuditLogsHandler
);

router.get(
  '/audit',
  [query('limit').optional().isInt({ min: 1, max: 100 })],
  listProviderByokAuditLogsHandler
);

export default router;
