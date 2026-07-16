import express from 'express';
import { 
  getMaintenanceRecords, 
  getMaintenanceRecordById, 
  createMaintenanceRecord, 
  updateMaintenanceRecord, 
  deleteMaintenanceRecord 
} from '../Controllers/maintenanceController.js';
import { protect, authorize } from '../Middlewares/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getMaintenanceRecords)
  .post(authorize('admin', 'mechanic'), createMaintenanceRecord);

router
  .route('/:id')
  .get(getMaintenanceRecordById)
  .put(authorize('admin', 'mechanic'), updateMaintenanceRecord)
  .delete(authorize('admin'), deleteMaintenanceRecord);

export default router;