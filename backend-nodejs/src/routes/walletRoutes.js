import { Router } from 'express';
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
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(authenticate);

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
