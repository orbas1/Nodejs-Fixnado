import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import {
  getProviderOnboardingWorkspaceHandler,
  createProviderOnboardingTaskHandler,
  updateProviderOnboardingTaskHandler,
  updateProviderOnboardingTaskStatusHandler,
  deleteProviderOnboardingTaskHandler,
  createProviderOnboardingRequirementHandler,
  updateProviderOnboardingRequirementHandler,
  updateProviderOnboardingRequirementStatusHandler,
  deleteProviderOnboardingRequirementHandler,
  createProviderOnboardingNoteHandler,
  getWorkspaceValidators,
  createTaskValidators,
  updateTaskValidators,
  updateTaskStatusValidators,
  deleteTaskValidators,
  createRequirementValidators,
  updateRequirementValidators,
  updateRequirementStatusValidators,
  deleteRequirementValidators,
  createNoteValidators
} from '../controllers/providerOnboardingController.js';
import { authenticate, maybeAuthenticate, requireStorefrontRole } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/provider/dashboard',
  authenticate,
  enforcePolicy('panel.provider.dashboard', { metadata: () => ({ section: 'provider-dashboard' }) }),
  getProviderDashboardHandler
);
router.get(
  '/provider/onboarding',
  authenticate,
  enforcePolicy('panel.provider.onboarding.read', { metadata: () => ({ section: 'provider-onboarding' }) }),
  ...getWorkspaceValidators,
  getProviderOnboardingWorkspaceHandler
);
router.post(
  '/provider/onboarding/tasks',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: () => ({ section: 'provider-onboarding', entity: 'tasks', action: 'create' })
  }),
  ...createTaskValidators,
  createProviderOnboardingTaskHandler
);
router.put(
  '/provider/onboarding/tasks/:taskId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'tasks',
      action: 'update',
      taskId: req.params.taskId
    })
  }),
  ...updateTaskValidators,
  updateProviderOnboardingTaskHandler
);
router.patch(
  '/provider/onboarding/tasks/:taskId/status',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'tasks',
      action: 'status',
      taskId: req.params.taskId,
      status: req.body?.status
    })
  }),
  ...updateTaskStatusValidators,
  updateProviderOnboardingTaskStatusHandler
);
router.delete(
  '/provider/onboarding/tasks/:taskId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'tasks',
      action: 'delete',
      taskId: req.params.taskId
    })
  }),
  ...deleteTaskValidators,
  deleteProviderOnboardingTaskHandler
);
router.post(
  '/provider/onboarding/requirements',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: () => ({ section: 'provider-onboarding', entity: 'requirements', action: 'create' })
  }),
  ...createRequirementValidators,
  createProviderOnboardingRequirementHandler
);
router.put(
  '/provider/onboarding/requirements/:requirementId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'requirements',
      action: 'update',
      requirementId: req.params.requirementId
    })
  }),
  ...updateRequirementValidators,
  updateProviderOnboardingRequirementHandler
);
router.patch(
  '/provider/onboarding/requirements/:requirementId/status',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'requirements',
      action: 'status',
      requirementId: req.params.requirementId,
      status: req.body?.status
    })
  }),
  ...updateRequirementStatusValidators,
  updateProviderOnboardingRequirementStatusHandler
);
router.delete(
  '/provider/onboarding/requirements/:requirementId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'requirements',
      action: 'delete',
      requirementId: req.params.requirementId
    })
  }),
  ...deleteRequirementValidators,
  deleteProviderOnboardingRequirementHandler
);
router.post(
  '/provider/onboarding/notes',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: () => ({ section: 'provider-onboarding', entity: 'notes', action: 'create' })
  }),
  ...createNoteValidators,
  createProviderOnboardingNoteHandler
);
router.get(
  '/enterprise/overview',
  authenticate,
  enforcePolicy('panel.enterprise.dashboard', { metadata: () => ({ section: 'enterprise-overview' }) }),
  getEnterprisePanelHandler
);
router.get('/provider/storefront', maybeAuthenticate, requireStorefrontRole, getProviderStorefrontHandler);

export default router;
