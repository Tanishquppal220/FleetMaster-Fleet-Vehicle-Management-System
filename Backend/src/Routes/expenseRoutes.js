import express from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../Controllers/expenseController.js';
import { protect, authorize } from '../Middlewares/auth.js';

const router = express.Router();

// Protect all routes under /api/expenses
router.use(protect);

// Routes for listing and logging expenses
router
  .route('/')
  .get(getExpenses)
  .post(authorize('admin', 'driver'), createExpense);

// Routes for manipulating individual expense entries
router
  .route('/:id')
  .get(getExpenseById)
  .put(authorize('admin'), updateExpense)
  .delete(authorize('admin'), deleteExpense);

export default router;