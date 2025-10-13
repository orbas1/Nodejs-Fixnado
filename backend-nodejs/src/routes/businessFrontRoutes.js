import { Router } from 'express';
import { getBusinessFrontHandler } from '../controllers/panelController.js';

const router = Router();

router.get('/:slug', getBusinessFrontHandler);
router.get('/', (req, res, next) => {
  req.params.slug = 'featured';
  return getBusinessFrontHandler(req, res, next);
});

export default router;

