import { Router } from 'express';
import {
  getFinanceWorkspaceHandler,
  updateFinancialProfileHandler,
  listEarningsHandler,
  createEarningHandler,
  updateEarningHandler,
  updateEarningStatusHandler,
  listExpensesHandler,
  createExpenseHandler,
  updateExpenseHandler,
  updateExpenseStatusHandler,
  listAllowancesHandler,
  upsertAllowanceHandler,
  deleteAllowanceHandler
} from '../controllers/servicemanFinanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getFinanceWorkspaceHandler);
router.put('/profile', updateFinancialProfileHandler);

router.get('/earnings', listEarningsHandler);
router.post('/earnings', createEarningHandler);
router.put('/earnings/:earningId', updateEarningHandler);
router.patch('/earnings/:earningId/status', updateEarningStatusHandler);

router.get('/expenses', listExpensesHandler);
router.post('/expenses', createExpenseHandler);
router.put('/expenses/:expenseId', updateExpenseHandler);
router.patch('/expenses/:expenseId/status', updateExpenseStatusHandler);

router.get('/allowances', listAllowancesHandler);
router.post('/allowances', upsertAllowanceHandler);
router.put('/allowances/:allowanceId', upsertAllowanceHandler);
router.delete('/allowances/:allowanceId', deleteAllowanceHandler);

export default router;
