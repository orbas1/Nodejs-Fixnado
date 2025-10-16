import { Router } from 'express';
import { dashboard } from '../controllers/adminController.js';
import {
  getToggle,
  getToggles,
  updateToggle,
  upsertToggleValidators
} from '../controllers/featureToggleController.js';
import {
  fetchPlatformSettings,
  savePlatformSettings
} from '../controllers/platformSettingsController.js';
import {
  getAffiliateSettingsHandler,
  saveAffiliateSettingsHandler,
  listAffiliateCommissionRulesHandler,
  upsertAffiliateCommissionRuleHandler,
  deactivateAffiliateCommissionRuleHandler
} from '../controllers/adminAffiliateController.js';
import {
  listLegalDocuments,
  getLegalDocument,
  createLegalDocumentHandler,
  updateLegalDocumentHandler,
  createDraft,
  updateDraft,
  publishVersion,
  archiveDraft,
  deleteLegalDocumentHandler
} from '../controllers/legalAdminController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  enforcePolicy('admin.dashboard.view', { metadata: () => ({ section: 'dashboard' }) }),
  dashboard
);
router.get(
  '/feature-toggles',
  authenticate,
  enforcePolicy('admin.features.read', { metadata: () => ({ scope: 'all' }) }),
  getToggles
);
router.get(
  '/feature-toggles/:key',
  authenticate,
  enforcePolicy('admin.features.read', {
    metadata: (req) => ({ scope: 'single', key: req.params.key })
  }),
  getToggle
);
router.patch(
  '/feature-toggles/:key',
  authenticate,
  enforcePolicy('admin.features.write', {
    metadata: (req) => ({ key: req.params.key, method: req.method })
  }),
  upsertToggleValidators,
  updateToggle
);

router.get(
  '/platform-settings',
  authenticate,
  enforcePolicy('admin.platform.read', { metadata: () => ({ section: 'platform-settings' }) }),
  fetchPlatformSettings
);
router.put(
  '/platform-settings',
  authenticate,
  enforcePolicy('admin.platform.write', { metadata: () => ({ section: 'platform-settings' }) }),
  savePlatformSettings
);

router.get(
  '/affiliate/settings',
  authenticate,
  enforcePolicy('admin.affiliates.read', { metadata: () => ({ entity: 'settings' }) }),
  getAffiliateSettingsHandler
);
router.put(
  '/affiliate/settings',
  authenticate,
  enforcePolicy('admin.affiliates.write', { metadata: () => ({ entity: 'settings' }) }),
  saveAffiliateSettingsHandler
);
router.get(
  '/affiliate/rules',
  authenticate,
  enforcePolicy('admin.affiliates.read', { metadata: () => ({ entity: 'commission-rules' }) }),
  listAffiliateCommissionRulesHandler
);
router.post(
  '/affiliate/rules',
  authenticate,
  enforcePolicy('admin.affiliates.write', { metadata: () => ({ entity: 'commission-rules' }) }),
  upsertAffiliateCommissionRuleHandler
);
router.patch(
  '/affiliate/rules/:id',
  authenticate,
  enforcePolicy('admin.affiliates.write', {
    metadata: (req) => ({ entity: 'commission-rules', ruleId: req.params.id })
  }),
  upsertAffiliateCommissionRuleHandler
);
router.delete(
  '/affiliate/rules/:id',
  authenticate,
  enforcePolicy('admin.affiliates.write', {
    metadata: (req) => ({ entity: 'commission-rules', ruleId: req.params.id })
  }),
  deactivateAffiliateCommissionRuleHandler
);

router.get(
  '/legal',
  authenticate,
  enforcePolicy('admin.legal.read', { metadata: () => ({ scope: 'collection' }) }),
  listLegalDocuments
);

router.get(
  '/legal/:slug',
  authenticate,
  enforcePolicy('admin.legal.read', {
    metadata: (req) => ({ scope: 'single', slug: req.params.slug })
  }),
  getLegalDocument
);

router.post(
  '/legal',
  authenticate,
  enforcePolicy('admin.legal.write', { metadata: () => ({ action: 'create-document' }) }),
  createLegalDocumentHandler
);

router.put(
  '/legal/:slug',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'update-metadata', slug: req.params.slug })
  }),
  updateLegalDocumentHandler
);

router.post(
  '/legal/:slug/versions',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'create-draft', slug: req.params.slug })
  }),
  createDraft
);

router.put(
  '/legal/:slug/versions/:versionId',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'update-draft', slug: req.params.slug, versionId: req.params.versionId })
  }),
  updateDraft
);

router.post(
  '/legal/:slug/versions/:versionId/publish',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'publish', slug: req.params.slug, versionId: req.params.versionId })
  }),
  publishVersion
);

router.post(
  '/legal/:slug/versions/:versionId/archive',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'archive-draft', slug: req.params.slug, versionId: req.params.versionId })
  }),
  archiveDraft
);

router.delete(
  '/legal/:slug',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'delete-document', slug: req.params.slug })
  }),
  deleteLegalDocumentHandler
);

export default router;
