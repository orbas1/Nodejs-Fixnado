import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getServicemanByokStateHandler,
  updateServicemanByokProfileHandler,
  createServicemanByokConnectorHandler,
  updateServicemanByokConnectorHandler,
  deleteServicemanByokConnectorHandler,
  rotateServicemanByokConnectorHandler,
  runServicemanByokDiagnosticHandler,
  searchServicemanByokProfilesHandler
} from '../controllers/servicemanByokController.js';

const router = Router();

router.use(authenticate);

router.get('/byok/profiles', searchServicemanByokProfilesHandler);

router.get('/:servicemanId/byok', getServicemanByokStateHandler);
router.put('/:servicemanId/byok/profile', updateServicemanByokProfileHandler);
router.post('/:servicemanId/byok/connectors', createServicemanByokConnectorHandler);
router.put('/:servicemanId/byok/connectors/:connectorId', updateServicemanByokConnectorHandler);
router.delete('/:servicemanId/byok/connectors/:connectorId', deleteServicemanByokConnectorHandler);
router.post('/:servicemanId/byok/connectors/:connectorId/rotate', rotateServicemanByokConnectorHandler);
router.post('/:servicemanId/byok/connectors/:connectorId/diagnostics', runServicemanByokDiagnosticHandler);

export default router;
