import { Router } from 'express';
import {
  getTasks,
  postTask,
  patchTask,
  postTaskUpdate
} from '../controllers/accountSupportController.js';

const router = Router();

router.get('/tasks', getTasks);
router.post('/tasks', postTask);
router.patch('/tasks/:taskId', patchTask);
router.post('/tasks/:taskId/activity', postTaskUpdate);

export default router;
