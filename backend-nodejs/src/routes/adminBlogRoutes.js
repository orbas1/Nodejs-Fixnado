import { Router } from 'express';
import {
  listAdminPosts,
  createAdminPost,
  updateAdminPost,
  publishAdminPost,
  archiveAdminPost,
  deleteAdminPost,
  listAdminCategories,
  upsertAdminCategory,
  deleteAdminCategory,
  listAdminTags,
  upsertAdminTag,
  deleteAdminTag
} from '../controllers/blogAdminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Permissions } from '../services/accessControlService.js';

const router = Router();
router.use(authenticate, authorize([Permissions.ADMIN_FEATURE_WRITE]));

router.get('/posts', listAdminPosts);
router.post('/posts', createAdminPost);
router.put('/posts/:postId', updateAdminPost);
router.patch('/posts/:postId/publish', publishAdminPost);
router.patch('/posts/:postId/archive', archiveAdminPost);
router.delete('/posts/:postId', deleteAdminPost);

router.get('/categories', listAdminCategories);
router.post('/categories', upsertAdminCategory);
router.put('/categories/:categoryId', upsertAdminCategory);
router.delete('/categories/:categoryId', deleteAdminCategory);

router.get('/tags', listAdminTags);
router.post('/tags', upsertAdminTag);
router.put('/tags/:tagId', upsertAdminTag);
router.delete('/tags/:tagId', deleteAdminTag);

export default router;
