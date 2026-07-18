import mongoose from 'mongoose';
import Driver from '../Models/Driver.js';
import User from '../Models/User.js';
import Vehicle from '../Models/Vehicle.js';
import Expense from '../Models/Expense.js';
import { asyncHandler } from '../Middlewares/errorHandler.js';
import { syncVehicleDriverAssignment } from '../Services/vehicleDriverSync.js';

// @desc    Get all drivers with profiles
// @route   GET /api/drivers
// @access  Private (Admin, Dispatcher)
export const getDrivers = asyncHandler(async (req, res, next) => {
  const drivers = await Driver.find()
    .populate('user', 'name email phone avatar status')
    .populate('assignedVehicle', 'vehicleNumber type capacity');

  res.status(200).json({ success: true, count: drivers.length, data: drivers });
});

// @desc    Get single driver by ID
// @route   GET /api/drivers/:id
// @access  Private
export const getDriverById = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id)
    .populate('user', 'name email phone avatar status')
    .populate('assignedVehicle', 'vehicleNumber type capacity');

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver profile not found' });
  }

  res.status(200).json({ success: true, data: driver });
});

// @desc    Update driver profile & status
// @route   PUT /api/drivers/:id
// @access  Private (Admin, Driver)
export const updateDriverStatus = asyncHandler(async (req, res, next) => {
  const { status, experience, licenseNumber, licensePhoto, assignedVehicle } = req.body;

  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver profile not found' });
  }

  if (req.user.role === 'driver' && driver.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You are not authorized to update this driver profile' });
  }

  const oldStatus = driver.status;

  if (status) driver.status = status;
  if (experience !== undefined) driver.experience = experience;
  if (licenseNumber) driver.licenseNumber = licenseNumber;
  if (licensePhoto !== undefined) driver.licensePhoto = licensePhoto;

  if (assignedVehicle !== undefined && req.user.role === 'admin') {
    if (assignedVehicle) {
      const vehicleExists = await Vehicle.findById(assignedVehicle);
      if (!vehicleExists) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
    }

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      driver.assignedVehicle = assignedVehicle;
      await driver.save({ session });

      const prevVehicleId = driver.assignedVehicle?.toString() ?? null;
      const newVehicleId = assignedVehicle?.toString() ?? null;

      if (prevVehicleId !== newVehicleId) {
        if (prevVehicleId) {
          await Vehicle.findByIdAndUpdate(prevVehicleId, { assignedDriver: null }, { session });
        }

        if (newVehicleId) {
          const targetVehicle = await Vehicle.findById(newVehicleId).session(session);
          if (targetVehicle?.assignedDriver) {
            const displacedDriverUserId = targetVehicle.assignedDriver.toString();
            if (displacedDriverUserId !== driver.user.toString()) {
              await Driver.findOneAndUpdate(
                { user: displacedDriverUserId },
                { assignedVehicle: null },
                { session }
              );
            }
          }
          await Vehicle.findByIdAndUpdate(newVehicleId, { assignedDriver: driver.user }, { session });
        }
      }
    });

    session.endSession();
  } else {
    await driver.save();
  }

  const updatedDriver = await Driver.findById(driver._id)
    .populate('user', 'name email phone avatar status')
    .populate('assignedVehicle', 'vehicleNumber type capacity');

  res.status(200).json({ success: true, data: updatedDriver });
});

// @desc    Delete a driver profile (with cascade cleanup)
// @route   DELETE /api/drivers/:id
// @access  Private (Admin)
export const deleteDriver = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver profile not found' });
  }

  const session = await mongoose.startSession();

  await session.withTransaction(async () => {
    if (driver.assignedVehicle) {
      await Vehicle.findByIdAndUpdate(
        driver.assignedVehicle,
        { assignedDriver: null },
        { session }
      );
    }

    await Expense.deleteMany({ driver: driver._id }, { session });
    await Driver.findByIdAndDelete(driver._id, { session });
  });

  session.endSession();
  res.status(200).json({ success: true, message: 'Driver profile deleted successfully' });
});
