import { Router } from 'express';
import { getLiveFeed, getMarketplaceFeed } from '../controllers/feedController.js';

const router = Router();

router.get('/live', getLiveFeed);
router.get('/marketplace', getMarketplaceFeed);

export default router;
