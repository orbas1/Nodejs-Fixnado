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
  listPurchaseOrdersHandler,
  getPurchaseOrderHandler,
  createPurchaseOrderHandler,
  updatePurchaseOrderHandler,
  updatePurchaseOrderStatusHandler,
  recordPurchaseReceiptHandler,
  addPurchaseAttachmentHandler,
  deletePurchaseAttachmentHandler,
  listSuppliersHandler,
  upsertSupplierHandler,
  updateSupplierStatusHandler,
  listPurchaseBudgetsHandler,
  upsertPurchaseBudgetHandler
} from '../controllers/purchaseManagementController.js';
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
  '/purchases/orders',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'orders', status: req.query?.status ?? 'all' })
  }),
  listPurchaseOrdersHandler
);
router.post(
  '/purchases/orders',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'create', supplierId: req.body?.supplierId ?? null })
  }),
  createPurchaseOrderHandler
);
router.get(
  '/purchases/orders/:orderId',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'orders', action: 'view', orderId: req.params.orderId })
  }),
  getPurchaseOrderHandler
);
router.put(
  '/purchases/orders/:orderId',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'update', orderId: req.params.orderId })
  }),
  updatePurchaseOrderHandler
);
router.patch(
  '/purchases/orders/:orderId/status',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'status', orderId: req.params.orderId, nextStatus: req.body?.status })
  }),
  updatePurchaseOrderStatusHandler
);
router.post(
  '/purchases/orders/:orderId/receipts',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'receipt', orderId: req.params.orderId })
  }),
  recordPurchaseReceiptHandler
);
router.post(
  '/purchases/orders/:orderId/attachments',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'add-attachment', orderId: req.params.orderId })
  }),
  addPurchaseAttachmentHandler
);
router.delete(
  '/purchases/orders/:orderId/attachments/:attachmentId',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'remove-attachment', orderId: req.params.orderId })
  }),
  deletePurchaseAttachmentHandler
);

router.get(
  '/purchases/suppliers',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'suppliers', status: req.query?.status ?? 'all' })
  }),
  listSuppliersHandler
);
router.post(
  '/purchases/suppliers',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: () => ({ scope: 'suppliers', action: 'create' })
  }),
  upsertSupplierHandler
);
router.put(
  '/purchases/suppliers/:supplierId',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'suppliers', action: 'update', supplierId: req.params.supplierId })
  }),
  upsertSupplierHandler
);
router.patch(
  '/purchases/suppliers/:supplierId/status',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'suppliers', action: 'status', supplierId: req.params.supplierId, status: req.body?.status })
  }),
  updateSupplierStatusHandler
);

router.get(
  '/purchases/budgets',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'budgets', fiscalYear: req.query?.fiscalYear ?? null })
  }),
  listPurchaseBudgetsHandler
);
router.post(
  '/purchases/budgets',
  authenticate,
  enforcePolicy('admin.purchases.budget', {
    metadata: (req) => ({ scope: 'budgets', action: 'create', category: req.body?.category ?? null })
  }),
  upsertPurchaseBudgetHandler
);
router.put(
  '/purchases/budgets/:budgetId',
  authenticate,
  enforcePolicy('admin.purchases.budget', {
    metadata: (req) => ({ scope: 'budgets', action: 'update', budgetId: req.params.budgetId })
  }),
  upsertPurchaseBudgetHandler
);

export default router;
