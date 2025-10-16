import { Router } from 'express';
import {
  listHomePagesHandler,
  getHomePageHandler,
  createHomePageHandler,
  updateHomePageHandler,
  publishHomePageHandler,
  archiveHomePageHandler,
  deleteHomePageHandler,
  duplicateHomePageHandler,
  createSectionHandler,
  updateSectionHandler,
  reorderSectionHandler,
  deleteSectionHandler,
  duplicateSectionHandler,
  createComponentHandler,
  updateComponentHandler,
  reorderComponentHandler,
  deleteComponentHandler,
  duplicateComponentHandler
} from '../controllers/homePageBuilderController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(
  authenticate,
  enforcePolicy('admin.home-builder.manage', {
    metadata: (req) => ({
      method: req.method,
      pageId: req.params?.pageId ?? null,
      sectionId: req.params?.sectionId ?? null,
      componentId: req.params?.componentId ?? null
    })
  })
);

router.get('/pages', listHomePagesHandler);
router.post('/pages', createHomePageHandler);
router.get('/pages/:pageId', getHomePageHandler);
router.put('/pages/:pageId', updateHomePageHandler);
router.post('/pages/:pageId/duplicate', duplicateHomePageHandler);
router.patch('/pages/:pageId/publish', publishHomePageHandler);
router.patch('/pages/:pageId/archive', archiveHomePageHandler);
router.delete('/pages/:pageId', deleteHomePageHandler);

router.post('/pages/:pageId/sections', createSectionHandler);
router.put('/sections/:sectionId', updateSectionHandler);
router.patch('/sections/:sectionId/reorder', reorderSectionHandler);
router.delete('/sections/:sectionId', deleteSectionHandler);
router.post('/sections/:sectionId/duplicate', duplicateSectionHandler);

router.post('/sections/:sectionId/components', createComponentHandler);
router.put('/components/:componentId', updateComponentHandler);
router.patch('/components/:componentId/reorder', reorderComponentHandler);
router.delete('/components/:componentId', deleteComponentHandler);
router.post('/components/:componentId/duplicate', duplicateComponentHandler);

export default router;
