import { Router } from 'express';
import {
  listAdminPosts,
  createAdminPost,
  updateAdminPost,
  publishAdminPost,
  archiveAdminPost,
  deleteAdminPost,
  duplicateAdminPost,
  listAdminPostRevisions,
  restoreAdminPostRevision,
  listAdminCategories,
  upsertAdminCategory,
  deleteAdminCategory,
  listAdminTags,
  upsertAdminTag,
  deleteAdminTag
} from '../controllers/blogAdminController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();
router.use(
  authenticate,
  enforcePolicy('admin.blog.manage', {
    metadata: (req) => ({
      section: 'blog-admin',
      method: req.method
    })
  })
);

router.get('/posts', listAdminPosts);
router.post('/posts', createAdminPost);
router.put('/posts/:postId', updateAdminPost);
router.patch('/posts/:postId/publish', publishAdminPost);
router.patch('/posts/:postId/archive', archiveAdminPost);
router.delete('/posts/:postId', deleteAdminPost);
router.post('/posts/:postId/duplicate', duplicateAdminPost);
router.get('/posts/:postId/revisions', listAdminPostRevisions);
router.post('/posts/:postId/revisions/:revisionId/restore', restoreAdminPostRevision);

router.get('/categories', listAdminCategories);
router.post('/categories', upsertAdminCategory);
router.put('/categories/:categoryId', upsertAdminCategory);
router.delete('/categories/:categoryId', deleteAdminCategory);

router.get('/tags', listAdminTags);
router.post('/tags', upsertAdminTag);
router.put('/tags/:tagId', upsertAdminTag);
router.delete('/tags/:tagId', deleteAdminTag);

export default router;
