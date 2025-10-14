import { Router } from 'express';
import { listBlogPosts, fetchBlogPost, fetchDashboardBlogPosts } from '../controllers/blogController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', listBlogPosts);
router.get('/dashboard', authenticate, fetchDashboardBlogPosts);
router.get('/:slug', fetchBlogPost);

export default router;
