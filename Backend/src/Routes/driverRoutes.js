import express from 'express';
import {
  getDrivers,
  getDriverById,
  updateDriverStatus,
  deleteDriver,
} from '../Controllers/driverController.js';
import { protect, authorize } from '../Middlewares/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'dispatcher'), getDrivers);

router
  .route('/:id')
  .get(getDriverById)
  .put(authorize('admin', 'driver'), updateDriverStatus)
  .delete(authorize('admin'), deleteDriver);

export default router;