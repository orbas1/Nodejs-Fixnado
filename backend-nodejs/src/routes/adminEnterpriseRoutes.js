import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  listEnterpriseAccountsHandler,
  getEnterpriseAccountHandler,
  createEnterpriseAccountHandler,
  updateEnterpriseAccountHandler,
  archiveEnterpriseAccountHandler,
  createEnterpriseSiteHandler,
  updateEnterpriseSiteHandler,
  deleteEnterpriseSiteHandler,
  createEnterpriseStakeholderHandler,
  updateEnterpriseStakeholderHandler,
  deleteEnterpriseStakeholderHandler,
  createEnterprisePlaybookHandler,
  updateEnterprisePlaybookHandler,
  deleteEnterprisePlaybookHandler
} from '../controllers/adminEnterpriseController.js';

const router = Router();

router.use(authenticate);

router.get(
  '/accounts',
  enforcePolicy('admin.enterprise.read', { metadata: () => ({ resource: 'accounts' }) }),
  listEnterpriseAccountsHandler
);

router.post(
  '/accounts',
  enforcePolicy('admin.enterprise.write', { metadata: () => ({ resource: 'accounts' }) }),
  createEnterpriseAccountHandler
);

router.get(
  '/accounts/:accountId',
  enforcePolicy('admin.enterprise.read', {
    metadata: (req) => ({ resource: 'accounts', accountId: req.params.accountId })
  }),
  getEnterpriseAccountHandler
);

router.put(
  '/accounts/:accountId',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({ resource: 'accounts', accountId: req.params.accountId })
  }),
  updateEnterpriseAccountHandler
);

router.patch(
  '/accounts/:accountId/archive',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({ resource: 'accounts', accountId: req.params.accountId, action: 'archive' })
  }),
  archiveEnterpriseAccountHandler
);

router.post(
  '/accounts/:accountId/sites',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({ resource: 'sites', accountId: req.params.accountId })
  }),
  createEnterpriseSiteHandler
);

router.put(
  '/accounts/:accountId/sites/:siteId',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({
      resource: 'sites',
      accountId: req.params.accountId,
      siteId: req.params.siteId
    })
  }),
  updateEnterpriseSiteHandler
);

router.delete(
  '/accounts/:accountId/sites/:siteId',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({
      resource: 'sites',
      accountId: req.params.accountId,
      siteId: req.params.siteId,
      action: 'delete'
    })
  }),
  deleteEnterpriseSiteHandler
);

router.post(
  '/accounts/:accountId/stakeholders',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({ resource: 'stakeholders', accountId: req.params.accountId })
  }),
  createEnterpriseStakeholderHandler
);

router.put(
  '/accounts/:accountId/stakeholders/:stakeholderId',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({
      resource: 'stakeholders',
      accountId: req.params.accountId,
      stakeholderId: req.params.stakeholderId
    })
  }),
  updateEnterpriseStakeholderHandler
);

router.delete(
  '/accounts/:accountId/stakeholders/:stakeholderId',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({
      resource: 'stakeholders',
      accountId: req.params.accountId,
      stakeholderId: req.params.stakeholderId,
      action: 'delete'
    })
  }),
  deleteEnterpriseStakeholderHandler
);

router.post(
  '/accounts/:accountId/playbooks',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({ resource: 'playbooks', accountId: req.params.accountId })
  }),
  createEnterprisePlaybookHandler
);

router.put(
  '/accounts/:accountId/playbooks/:playbookId',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({
      resource: 'playbooks',
      accountId: req.params.accountId,
      playbookId: req.params.playbookId
    })
  }),
  updateEnterprisePlaybookHandler
);

router.delete(
  '/accounts/:accountId/playbooks/:playbookId',
  enforcePolicy('admin.enterprise.write', {
    metadata: (req) => ({
      resource: 'playbooks',
      accountId: req.params.accountId,
      playbookId: req.params.playbookId,
      action: 'delete'
    })
  }),
  deleteEnterprisePlaybookHandler
);

export default router;
