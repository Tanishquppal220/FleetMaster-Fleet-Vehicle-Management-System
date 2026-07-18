import mongoose from 'mongoose';
import Vehicle from '../Models/Vehicle.js';
import Driver from '../Models/Driver.js';
import User from '../Models/User.js';
import Maintenance from '../Models/Maintenance.js';
import Expense from '../Models/Expense.js';
import { asyncHandler } from '../Middlewares/errorHandler.js';
import { syncVehicleDriverAssignment } from '../Services/vehicleDriverSync.js';

// @desc    Get all vehicles (role-filtered)
// @route   GET /api/vehicles
export const getVehicles = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.user.role === 'driver') {
    filter.assignedDriver = req.user._id;
  }

  const vehicles = await Vehicle.find(filter).populate('assignedDriver', 'name email');
  res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
});

// @desc    Create a vehicle
// @route   POST /api/vehicles
export const createVehicle = asyncHandler(async (req, res, next) => {
  const { vehicleNumber, assignedDriver: assignedDriverUserId } = req.body;

  const exists = await Vehicle.findOne({ vehicleNumber });
  if (exists) {
    return res.status(400).json({ success: false, message: 'Vehicle number already exists' });
  }

  const { type, capacity, fuelStatus, maintenanceStatus } = req.body;

  const session = await mongoose.startSession();
  let vehicle;

  await session.withTransaction(async () => {
    const created = await Vehicle.create([{
      vehicleNumber,
      type,
      capacity,
      fuelStatus,
      maintenanceStatus,
      assignedDriver: assignedDriverUserId || null,
    }], { session });

    vehicle = created[0];

    if (assignedDriverUserId) {
      await syncVehicleDriverAssignment(session, vehicle._id, assignedDriverUserId);
    }
  });

  session.endSession();
  res.status(201).json({ success: true, data: vehicle });
});

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
export const updateVehicle = asyncHandler(async (req, res, next) => {
  let vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  if (req.user.role === 'mechanic') {
    const mechanicAllowed = ['maintenanceStatus', 'availability'];
    const disallowed = Object.keys(req.body).filter((k) => !mechanicAllowed.includes(k));
    if (disallowed.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Mechanics can only update maintenance fields. Rejected: ${disallowed.join(', ')}`,
      });
    }
  }

  if (req.body.assignedDriver) {
    const user = await User.findById(req.body.assignedDriver);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Driver/User not found' });
    }
  }

  const { maintenanceStatus } = req.body;

  if (maintenanceStatus && maintenanceStatus !== vehicle.maintenanceStatus) {
    if (maintenanceStatus === 'Under Repair' && vehicle.assignedDriver) {
      req.body.assignedDriver = null;
    }
  }

  const session = await mongoose.startSession();

  await session.withTransaction(async () => {
    if ('assignedDriver' in req.body) {
      await syncVehicleDriverAssignment(session, req.params.id, req.body.assignedDriver);
    }

    const allowedFields = {};
    for (const key of ['vehicleNumber', 'type', 'capacity', 'fuelStatus', 'maintenanceStatus', 'assignedDriver']) {
      if (key in req.body) allowedFields[key] = req.body[key];
    }

    if (Object.keys(allowedFields).length > 0) {
      await Vehicle.findByIdAndUpdate(req.params.id, allowedFields, {
        session,
        runValidators: true,
      });
    }
  });

  session.endSession();

  vehicle = await Vehicle.findById(req.params.id);
  res.status(200).json({ success: true, data: vehicle });
});

// @desc    Delete vehicle (with cascade cleanup)
// @route   DELETE /api/vehicles/:id
export const deleteVehicle = asyncHandler(async (req, res, next) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  const session = await mongoose.startSession();

  await session.withTransaction(async () => {
    if (vehicle.assignedDriver) {
      await Driver.findOneAndUpdate(
        { user: vehicle.assignedDriver.toString() },
        { assignedVehicle: null },
        { session }
      );
    }

    await Maintenance.deleteMany({ vehicle: vehicle._id }, { session });
    await Expense.deleteMany({ vehicle: vehicle._id }, { session });
    await Vehicle.findByIdAndDelete(vehicle._id, { session });
  });

  session.endSession();
  res.status(200).json({ success: true, message: 'Vehicle deleted' });
});
