import { Router } from 'express';
import {
  getWalletOverviewHandler,
  getWalletAccountsHandler,
  saveWalletSettingsHandler,
  createWalletAccountHandler,
  updateWalletAccountHandler,
  recordWalletTransactionHandler,
  getWalletTransactionsHandler
} from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/overview',
  authenticate,
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'overview', accountId: null, method: req.method })
  }),
  getWalletOverviewHandler
);

router.get(
  '/accounts',
  authenticate,
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'accounts', accountId: null, method: req.method })
  }),
  getWalletAccountsHandler
);

router.get(
  '/accounts/:id/transactions',
  authenticate,
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'transactions', accountId: req.params.id, method: req.method })
  }),
  getWalletTransactionsHandler
);

router.put(
  '/settings',
  authenticate,
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'settings', accountId: null, method: req.method })
  }),
  saveWalletSettingsHandler
);

router.post(
  '/accounts',
  authenticate,
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'accounts', accountId: null, action: 'create', method: req.method })
  }),
  createWalletAccountHandler
);

router.patch(
  '/accounts/:id',
  authenticate,
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'accounts', accountId: req.params.id, method: req.method })
  }),
  updateWalletAccountHandler
);

router.post(
  '/accounts/:id/transactions',
  authenticate,
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'transactions', accountId: req.params.id, method: req.method })
  }),
  recordWalletTransactionHandler
);

export default router;
