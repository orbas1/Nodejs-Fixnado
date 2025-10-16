import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  getAdminWalletOverviewHandler,
  listAdminWalletAccountsHandler,
  saveAdminWalletSettingsHandler,
  createAdminWalletAccountHandler,
  updateAdminWalletAccountHandler,
  recordAdminWalletTransactionHandler,
  listAdminWalletTransactionsHandler,
  listWalletAccountsHandler,
  createWalletAccountHandler,
  getWalletAccountHandler,
  updateWalletAccountHandler,
  listWalletTransactionsHandler,
  createWalletTransactionHandler,
  listWalletPaymentMethodsHandler,
  createWalletPaymentMethodHandler,
  updateWalletPaymentMethodHandler,
  deleteWalletPaymentMethodHandler,
  exportWalletTransactionsHandler,
  getWalletSummaryHandler
} from '../controllers/walletController.js';

const adminWalletRouter = Router();

adminWalletRouter.use(authenticate);

adminWalletRouter.get(
  '/overview',
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'overview', accountId: null, method: req.method })
  }),
  getAdminWalletOverviewHandler
);

adminWalletRouter.get(
  '/accounts',
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'accounts', accountId: null, method: req.method })
  }),
  listAdminWalletAccountsHandler
);

adminWalletRouter.get(
  '/accounts/:id/transactions',
  enforcePolicy('admin.wallets.read', {
    metadata: (req) => ({ scope: 'transactions', accountId: req.params.id, method: req.method })
  }),
  listAdminWalletTransactionsHandler
);

adminWalletRouter.put(
  '/settings',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'settings', accountId: null, method: req.method })
  }),
  saveAdminWalletSettingsHandler
);

adminWalletRouter.post(
  '/accounts',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'accounts', accountId: null, action: 'create', method: req.method })
  }),
  createAdminWalletAccountHandler
);

adminWalletRouter.patch(
  '/accounts/:id',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'accounts', accountId: req.params.id, method: req.method })
  }),
  updateAdminWalletAccountHandler
);

adminWalletRouter.post(
  '/accounts/:id/transactions',
  enforcePolicy('admin.wallets.manage', {
    metadata: (req) => ({ scope: 'transactions', accountId: req.params.id, method: req.method })
  }),
  recordAdminWalletTransactionHandler
);
  getWalletSummaryHandler
} from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const walletRouter = Router();

walletRouter.use(authenticate);
router.use(authenticate);

router.get('/accounts', enforcePolicy('wallet.accounts.read'), listWalletAccountsHandler);
router.post('/accounts', enforcePolicy('wallet.accounts.create'), createWalletAccountHandler);
router.get('/accounts/:accountId', enforcePolicy('wallet.accounts.read'), getWalletAccountHandler);
router.patch('/accounts/:accountId', enforcePolicy('wallet.accounts.update'), updateWalletAccountHandler);

walletRouter.get('/accounts', enforcePolicy('wallet.accounts.read'), listWalletAccountsHandler);
walletRouter.post('/accounts', enforcePolicy('wallet.accounts.create'), createWalletAccountHandler);
walletRouter.get('/accounts/:accountId', enforcePolicy('wallet.accounts.read'), getWalletAccountHandler);
walletRouter.patch('/accounts/:accountId', enforcePolicy('wallet.accounts.update'), updateWalletAccountHandler);

walletRouter.get(
  '/accounts/:accountId/transactions',
  enforcePolicy('wallet.transactions.read'),
  listWalletTransactionsHandler
);
walletRouter.post(
  '/accounts/:accountId/transactions',
  enforcePolicy('wallet.transactions.create'),
  createWalletTransactionHandler
);
walletRouter.get(
  '/accounts/:accountId/transactions/export',
  enforcePolicy('wallet.transactions.read'),
  exportWalletTransactionsHandler
);

walletRouter.get(
  '/accounts/:accountId/payment-methods',
  enforcePolicy('wallet.payment-methods.read'),
  listWalletPaymentMethodsHandler
);
walletRouter.post(
  '/accounts/:accountId/payment-methods',
  enforcePolicy('wallet.payment-methods.manage'),
  createWalletPaymentMethodHandler
);
walletRouter.patch(
  '/accounts/:accountId/payment-methods/:methodId',
  enforcePolicy('wallet.payment-methods.manage'),
  updateWalletPaymentMethodHandler
);
walletRouter.delete(
  '/accounts/:accountId/payment-methods/:methodId',
  enforcePolicy('wallet.payment-methods.manage'),
  deleteWalletPaymentMethodHandler
);

walletRouter.get('/summary', enforcePolicy('wallet.summary.read'), getWalletSummaryHandler);

export { adminWalletRouter, walletRouter };
export default walletRouter;
