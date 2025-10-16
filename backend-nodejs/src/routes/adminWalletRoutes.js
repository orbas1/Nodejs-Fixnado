import { Router } from 'express';
import {
  getAdminWalletOverviewHandler,
  getAdminWalletAccountsHandler,
  saveAdminWalletSettingsHandler,
  createAdminWalletAccountHandler,
  updateAdminWalletAccountHandler,
  recordAdminWalletTransactionHandler,
  getAdminWalletTransactionsHandler
} from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(authenticate);

router.get(
  '/overview',
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'overview', accountId: null, method: req.method })
  }),
  getAdminWalletOverviewHandler
);

router.get(
  '/accounts',
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'accounts', accountId: null, method: req.method })
  }),
  getAdminWalletAccountsHandler
);

router.get(
  '/accounts/:id/transactions',
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'transactions', accountId: req.params.id, method: req.method })
  }),
  getAdminWalletTransactionsHandler
);

router.put(
  '/settings',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'settings', accountId: null, method: req.method })
  }),
  saveAdminWalletSettingsHandler
);

router.post(
  '/accounts',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'accounts', accountId: null, action: 'create', method: req.method })
  }),
  createAdminWalletAccountHandler
);

router.patch(
  '/accounts/:id',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'accounts', accountId: req.params.id, method: req.method })
  }),
  updateAdminWalletAccountHandler
);

router.post(
  '/accounts/:id/transactions',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'transactions', accountId: req.params.id, method: req.method })
  }),
  recordAdminWalletTransactionHandler
);

export default router;
