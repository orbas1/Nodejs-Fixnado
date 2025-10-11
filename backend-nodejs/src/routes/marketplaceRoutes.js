import { Router } from 'express';
import {
  createItem,
  getModerationQueue,
  listApprovedItems,
  moderateItem,
  submitForReview
} from '../controllers/marketplaceController.js';

const router = Router();

router.post('/items', createItem);
router.post('/items/:itemId/submit', submitForReview);
router.post('/items/:itemId/moderate', moderateItem);
router.get('/moderation/queue', getModerationQueue);
router.get('/items/approved', listApprovedItems);

export default router;
