import { Router } from 'express';
import {
  getServicemanPaymentsWorkspaceHandler,
  createServicemanPaymentHandler,
  updateServicemanPaymentHandler,
  deleteServicemanPaymentHandler,
  listServicemanCommissionRulesHandler,
  createServicemanCommissionRuleHandler,
  updateServicemanCommissionRuleHandler,
  archiveServicemanCommissionRuleHandler
} from '../controllers/providerServicemanFinanceController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(authenticate);

router.get(
  '/payments',
  enforcePolicy('panel.provider.servicemen.finance.read', {
    metadata: (req) => ({
      companyId: req.query.companyId || null,
      status: req.query.status || 'all'
    })
  }),
  getServicemanPaymentsWorkspaceHandler
);

router.post(
  '/payments',
  enforcePolicy('panel.provider.servicemen.finance.manage', {
    metadata: (req) => ({
      companyId: req.body?.companyId || req.query.companyId || null,
      action: 'create-payment'
    })
  }),
  createServicemanPaymentHandler
);

router.put(
  '/payments/:paymentId',
  enforcePolicy('panel.provider.servicemen.finance.manage', {
    metadata: (req) => ({
      companyId: req.body?.companyId || req.query.companyId || null,
      action: 'update-payment',
      paymentId: req.params.paymentId
    })
  }),
  updateServicemanPaymentHandler
);

router.delete(
  '/payments/:paymentId',
  enforcePolicy('panel.provider.servicemen.finance.manage', {
    metadata: (req) => ({
      companyId: req.query.companyId || req.body?.companyId || null,
      action: 'delete-payment',
      paymentId: req.params.paymentId
    })
  }),
  deleteServicemanPaymentHandler
);

router.get(
  '/commissions',
  enforcePolicy('panel.provider.servicemen.finance.read', {
    metadata: (req) => ({
      companyId: req.query.companyId || null,
      action: 'list-commission-rules'
    })
  }),
  listServicemanCommissionRulesHandler
);

router.post(
  '/commissions',
  enforcePolicy('panel.provider.servicemen.finance.manage', {
    metadata: (req) => ({
      companyId: req.body?.companyId || req.query.companyId || null,
      action: 'create-commission-rule'
    })
  }),
  createServicemanCommissionRuleHandler
);

router.put(
  '/commissions/:ruleId',
  enforcePolicy('panel.provider.servicemen.finance.manage', {
    metadata: (req) => ({
      companyId: req.body?.companyId || req.query.companyId || null,
      action: 'update-commission-rule',
      ruleId: req.params.ruleId
    })
  }),
  updateServicemanCommissionRuleHandler
);

router.delete(
  '/commissions/:ruleId',
  enforcePolicy('panel.provider.servicemen.finance.manage', {
    metadata: (req) => ({
      companyId: req.query.companyId || req.body?.companyId || null,
      action: 'archive-commission-rule',
      ruleId: req.params.ruleId
    })
  }),
  archiveServicemanCommissionRuleHandler
);

export default router;
