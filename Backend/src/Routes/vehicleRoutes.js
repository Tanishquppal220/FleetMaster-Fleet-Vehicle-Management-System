import express from 'express';
const router = express.Router();
import { 
  getVehicles, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle 
} from '../Controllers/vehicleController.js';

import { protect, authorize } from '../Middlewares/auth.js'; 

router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(authorize('admin'), createVehicle); 

router.route('/:id')
  .put(authorize('admin', 'mechanic'), updateVehicle) 
  .delete(authorize('admin'), deleteVehicle);         

export default router;