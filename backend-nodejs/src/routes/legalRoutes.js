import { Router } from 'express';
import { getPublishedLegalDocument } from '../controllers/legalController.js';

const router = Router();

router.get('/:slug', getPublishedLegalDocument);

export default router;
