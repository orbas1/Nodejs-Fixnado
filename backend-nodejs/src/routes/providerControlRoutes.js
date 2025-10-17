import { Router } from 'express';
import {
  getProviderCrewManagementHandler,
  createProviderCrewMemberHandler,
  updateProviderCrewMemberHandler,
  deleteProviderCrewMemberHandler,
  upsertProviderCrewAvailabilityHandler,
  deleteProviderCrewAvailabilityHandler,
  upsertProviderCrewDeploymentHandler,
  deleteProviderCrewDeploymentHandler,
  upsertProviderCrewDelegationHandler,
  deleteProviderCrewDelegationHandler
} from '../controllers/providerCrewController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const withCrewPolicy = enforcePolicy('provider.control.crew', {
  metadata: (req) => ({
    companyId: req.query?.companyId || req.body?.companyId || null,
    path: req.path
  })
});

router.use(authenticate, withCrewPolicy);

router.get('/crew', getProviderCrewManagementHandler);
router.post('/crew-members', createProviderCrewMemberHandler);
router.put('/crew-members/:crewMemberId', updateProviderCrewMemberHandler);
router.delete('/crew-members/:crewMemberId', deleteProviderCrewMemberHandler);

router.post('/crew-members/:crewMemberId/availability', upsertProviderCrewAvailabilityHandler);
router.put(
  '/crew-members/:crewMemberId/availability/:availabilityId',
  upsertProviderCrewAvailabilityHandler
);
router.delete(
  '/crew-members/:crewMemberId/availability/:availabilityId',
  deleteProviderCrewAvailabilityHandler
);

router.post('/deployments', upsertProviderCrewDeploymentHandler);
router.put('/deployments/:deploymentId', upsertProviderCrewDeploymentHandler);
router.delete('/deployments/:deploymentId', deleteProviderCrewDeploymentHandler);

router.post('/delegations', upsertProviderCrewDelegationHandler);
router.put('/delegations/:delegationId', upsertProviderCrewDelegationHandler);
router.delete('/delegations/:delegationId', deleteProviderCrewDelegationHandler);

export default router;
