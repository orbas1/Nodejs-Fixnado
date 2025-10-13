import { Router } from 'express';
import { query } from 'express-validator';
import { getEnterprisePanelHandler } from '../controllers/enterprisePanelController.js';

const router = Router();

const enterpriseValidators = [
  query('companyId').optional().isUUID(4),
  query('timezone').optional().isString().trim().isLength({ min: 2, max: 64 })
];

router.get('/enterprise/overview', enterpriseValidators, getEnterprisePanelHandler);

export default router;
