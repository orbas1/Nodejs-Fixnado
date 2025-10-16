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
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  listWalletAccountsHandler,
  createWalletAccountHandler,
  getWalletAccountHandler,
  updateWalletAccountHandler,
  listWalletTransactionsHandler,
  createWalletTransactionHandler,
  listWalletPaymentMethodsHandler,
  createWalletPaymentMethodHandler,
  updateWalletPaymentMethodHandler,
  getWalletSummaryHandler
} from '../controllers/walletController.js';

const router = Router();

router.get('/accounts', enforcePolicy('wallet.accounts.read'), listWalletAccountsHandler);
router.post('/accounts', enforcePolicy('wallet.accounts.create'), createWalletAccountHandler);
router.get('/accounts/:accountId', enforcePolicy('wallet.accounts.read'), getWalletAccountHandler);
router.patch('/accounts/:accountId', enforcePolicy('wallet.accounts.update'), updateWalletAccountHandler);

router.get(
  '/accounts/:accountId/transactions',
  enforcePolicy('wallet.transactions.read'),
  listWalletTransactionsHandler
);
router.post(
  '/accounts/:accountId/transactions',
  enforcePolicy('wallet.transactions.create'),
  createWalletTransactionHandler
);

router.get(
  '/accounts/:accountId/payment-methods',
  enforcePolicy('wallet.payment-methods.read'),
  listWalletPaymentMethodsHandler
);
router.post(
  '/accounts/:accountId/payment-methods',
  enforcePolicy('wallet.payment-methods.manage'),
  createWalletPaymentMethodHandler
);
router.patch(
  '/accounts/:accountId/payment-methods/:methodId',
  enforcePolicy('wallet.payment-methods.manage'),
  updateWalletPaymentMethodHandler
);

router.get('/summary', enforcePolicy('wallet.summary.read'), getWalletSummaryHandler);

export default router;
