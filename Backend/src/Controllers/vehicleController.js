import Vehicle from '../Models/Vehicle.js';
import Driver from '../Models/Driver.js';
import User from '../Models/User.js'; 
import { asyncHandler } from '../Middlewares/errorHandler.js';
import { dispatchNotification } from '../Services/notificationService.js';

// @desc    Get all vehicles
// @route   GET /api/vehicles
export const getVehicles = asyncHandler(async (req, res, next) => {
  const vehicles = await Vehicle.find().populate('assignedDriver', 'name email');
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

  const vehicle = await Vehicle.create(req.body);

  // ── Bidirectional sync on creation ─────────────────────────────────────────
  // If a driver was assigned at creation time, sync the Driver document too.
  if (assignedDriverUserId) {
    const incomingDriver = await Driver.findOne({ name: assignedDriverUserId });
    if (incomingDriver) {
      // If this driver was already on a different vehicle, clear that vehicle's assignedDriver
      if (incomingDriver.assignedVehicle) {
        const oldVehicleId = incomingDriver.assignedVehicle.toString();
        if (oldVehicleId !== vehicle._id.toString()) {
          await Vehicle.findByIdAndUpdate(oldVehicleId, { assignedDriver: null });
        }
      }
      // Point the driver to the newly created vehicle
      await Driver.findOneAndUpdate(
        { name: assignedDriverUserId },
        { assignedVehicle: vehicle._id }
      );
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  res.status(201).json({ success: true, data: vehicle });
});

// @desc    Update vehicle details (including assigning drivers & triggering maintenance alerts)
// @route   PUT /api/vehicles/:id
export const updateVehicle = asyncHandler(async (req, res, next) => {
  let vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  // If assigning a driver, verify the user exists
  if (req.body.assignedDriver) {
    const user = await User.findById(req.body.assignedDriver);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Driver/User not found' });
    }
  }

  const { maintenanceStatus } = req.body;

  // Handle Maintenance Status Lifecycles & Alerts mimicking the repo
  if (maintenanceStatus && maintenanceStatus !== vehicle.maintenanceStatus) {
    if (maintenanceStatus === 'Under Repair' || maintenanceStatus === 'Service Due') {
      
      // If the vehicle is going under repair, unassign the driver and send them an alert
      if (maintenanceStatus === 'Under Repair' && vehicle.assignedDriver) {
        const driverId = vehicle.assignedDriver;
        
        // Clear driver from the vehicle update payload
        req.body.assignedDriver = null;
        
        await dispatchNotification({
          recipient: driverId,
          title: 'Vehicle Maintenance Recall',
          message: `Your assigned vehicle ${vehicle.vehicleNumber} is recalled for repairs. You are now unassigned.`,
          type: 'MAINTENANCE_DUE'
        });
      }

      // Notify administrators about the required maintenance
      await dispatchNotification({
        recipientRole: 'admin',
        title: 'Vehicle Maintenance Needed',
        message: `Vehicle ${vehicle.vehicleNumber} has maintenance status: ${maintenanceStatus}.`,
        type: 'MAINTENANCE_DUE',
        metadata: { vehicleId: vehicle._id }
      });
    }
  }

  // ── Bidirectional Driver↔Vehicle sync ──────────────────────────────────────
  // Only run sync when the assignedDriver field is explicitly present in the request
  if ('assignedDriver' in req.body) {
    const prevDriverUserId = vehicle.assignedDriver?.toString() ?? null;
    const newDriverUserId  = req.body.assignedDriver?.toString()  ?? null;

    if (prevDriverUserId !== newDriverUserId) {
      // 1. Clear assignedVehicle on the previously assigned driver (if any)
      if (prevDriverUserId) {
        await Driver.findOneAndUpdate(
          { name: prevDriverUserId },
          { assignedVehicle: null }
        );
      }

      // 2. Handle the incoming driver being assigned
      if (newDriverUserId) {
        // Edge case: the incoming driver may already be assigned to a DIFFERENT vehicle.
        // Find their Driver doc and clear that old vehicle's assignedDriver first.
        const incomingDriver = await Driver.findOne({ name: newDriverUserId });
        if (incomingDriver?.assignedVehicle) {
          const oldVehicleId = incomingDriver.assignedVehicle.toString();
          if (oldVehicleId !== vehicle._id.toString()) {
            // Clear this vehicle's assignedDriver so it no longer points to the moved driver
            await Vehicle.findByIdAndUpdate(oldVehicleId, { assignedDriver: null });
          }
        }

        // Now point the driver to this vehicle
        await Driver.findOneAndUpdate(
          { name: newDriverUserId },
          { assignedVehicle: vehicle._id }
        );
      }
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({ success: true, data: vehicle });
});

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
export const deleteVehicle = asyncHandler(async (req, res, next) => {
  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  // Clear the deleted vehicle from its assigned driver's record (if any)
  if (vehicle.assignedDriver) {
    await Driver.findOneAndUpdate(
      { name: vehicle.assignedDriver.toString() },
      { assignedVehicle: null }
    );
  }

  await Vehicle.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Vehicle deleted' });
});
