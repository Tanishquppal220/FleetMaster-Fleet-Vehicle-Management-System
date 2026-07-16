import Driver from '../Models/Driver.js';
import User from '../Models/User.js';
import Vehicle from '../Models/Vehicle.js';
import { asyncHandler } from '../Middlewares/errorHandler.js';
import { dispatchNotification } from '../Services/notificationService.js';

// @desc    Get all drivers with profiles
// @route   GET /api/drivers
// @access  Private (Admin, Dispatcher)
export const getDrivers = asyncHandler(async (req, res, next) => {
  const drivers = await Driver.find()
    .populate('name', 'name email phone avatar status')
    .populate('assignedVehicle', 'vehicleNumber make model status');

  res.status(200).json({ success: true, count: drivers.length, data: drivers });
});

// @desc    Get single driver by ID
// @route   GET /api/drivers/:id
// @access  Private
export const getDriverById = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id)
    .populate('name', 'name email phone avatar status')
    .populate('assignedVehicle', 'vehicleNumber make model status');

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

  if (req.user.role === 'driver' && driver.name.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You are not authorized to update this driver profile' });
  }

  const oldStatus = driver.status;

  if (status) driver.status = status;
  if (experience !== undefined) driver.experience = experience;
  if (licenseNumber) driver.licenseNumber = licenseNumber;
  if (licensePhoto !== undefined) driver.licensePhoto = licensePhoto;

  if (assignedVehicle !== undefined && req.user.role === 'admin') {
    // If assigning a new vehicle, verify its existence
    if (assignedVehicle) {
      const vehicleExists = await Vehicle.findById(assignedVehicle);
      if (!vehicleExists) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
    }
    driver.assignedVehicle = assignedVehicle;
  }

  await driver.save();

  if (status && status !== oldStatus) {
    await dispatchNotification({
      recipient: driver.name,
      title: 'Profile Status Updated',
      message: `Your driver status has been updated to ${status}.`,
      type: 'SYSTEM_ALERT',
    });

    if (status === 'Off Duty' || status === 'In Maintenance') {
      await dispatchNotification({
        recipientRole: 'admin',
        title: 'Driver Status Alert',
        message: `Driver profile associated with User ID: ${driver.name} is now ${status}.`,
        type: 'SYSTEM_ALERT',
        metadata: { driverId: driver._id },
      });
    }
  }

  const updatedDriver = await Driver.findById(driver._id)
    .populate('name', 'name email phone avatar status')
    .populate('assignedVehicle', 'vehicleNumber make model');

  res.status(200).json({ success: true, data: updatedDriver });
});

// @desc    Delete a driver profile
// @route   DELETE /api/drivers/:id
// @access  Private (Admin)
export const deleteDriver = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id);
  
  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver profile not found' });
  }

  await Driver.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Driver profile deleted successfully' });
});
