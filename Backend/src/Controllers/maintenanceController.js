import Maintenance from '../Models/Maintenance.js';
import Vehicle from '../Models/Vehicle.js';
import { asyncHandler } from '../Middlewares/errorHandler.js';
import { dispatchNotification } from '../Services/notificationService.js';

// @desc    Get all maintenance records with filters
// @route   GET /api/maintenance
// @access  Private
export const getMaintenanceRecords = asyncHandler(async (req, res, next) => {
  const { status, priority, vehicleId } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (vehicleId) filter.vehicle = vehicleId;

  const records = await Maintenance.find(filter)
    .populate('vehicle', 'vehicleNumber make model')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: records.length, data: records });
});

// @desc    Get single maintenance record by ID
// @route   GET /api/maintenance/:id
// @access  Private
export const getMaintenanceRecordById = asyncHandler(async (req, res, next) => {
  const record = await Maintenance.findById(req.params.id)
    .populate('vehicle', 'vehicleNumber make model')
    .populate('performedBy', 'name email');

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  res.status(200).json({ success: true, data: record });
});

// @desc    Create a maintenance record
// @route   POST /api/maintenance
// @access  Private (Admin, Mechanic)
export const createMaintenanceRecord = asyncHandler(async (req, res, next) => {
  const { vehicle, type, scheduledDate, cost, description, priority } = req.body;

  if (!vehicle || !type || !scheduledDate) {
    return res.status(400).json({ success: false, message: 'Vehicle, type, and scheduled date are required' });
  }

  // Check if target vehicle exists
  const vehicleExists = await Vehicle.findById(vehicle);
  if (!vehicleExists) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  const record = await Maintenance.create({
    vehicle,
    type,
    scheduledDate,
    cost: cost || 0,
    description,
    priority: priority || 'Medium',
    status: 'Scheduled',
    performedBy: req.user ? req.user._id : null // Tracks the creator if auth middleware is active
  });

  // Dispatch Notification to Mechanics
  await dispatchNotification({
    recipientRole: 'mechanic',
    title: 'New Maintenance Scheduled',
    message: `A new ${type} maintenance check has been scheduled for Vehicle ${vehicleExists.vehicleNumber}.`,
    type: 'MAINTENANCE_DUE',
    metadata: { maintenanceId: record._id, vehicleId: vehicle }
  });

  res.status(201).json({ success: true, data: record });
});

// @desc    Update a maintenance record (handles status lifecycles & automated status changes)
// @route   PUT /api/maintenance/:id
// @access  Private (Admin, Mechanic)
export const updateMaintenanceRecord = asyncHandler(async (req, res, next) => {
  let record = await Maintenance.findById(req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  const oldStatus = record.status;
  
  record = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Handle automatic vehicle updates based on maintenance transitions
  if (req.body.status && req.body.status !== oldStatus) {
    const vehicleObj = await Vehicle.findById(record.vehicle);
    
    if (vehicleObj) {
      if (record.status === 'Completed') {
        // Automatically restore vehicle health markers when repairs are resolved
        await Vehicle.findByIdAndUpdate(record.vehicle, { 
          maintenanceStatus: 'Satisfactory',
          availability: true 
        });

        // Notify Admins that the vehicle is healthy and available again
        await dispatchNotification({
          recipientRole: 'admin',
          title: 'Maintenance Completed',
          message: `Vehicle ${vehicleObj.vehicleNumber} has successfully completed its ${record.type} check.`,
          type: 'SYSTEM_ALERT',
          metadata: { vehicleId: record.vehicle }
        });
      } else if (record.status === 'In Progress') {
        // Automatically update vehicle status to reflect work being done
        await Vehicle.findByIdAndUpdate(record.vehicle, { 
          maintenanceStatus: 'Under Repair',
          availability: false 
        });
      }
    }
  }

  res.status(200).json({ success: true, data: record });
});

// @desc    Delete a maintenance record
// @route   DELETE /api/maintenance/:id
// @access  Private (Admin)
export const deleteMaintenanceRecord = asyncHandler(async (req, res, next) => {
  const record = await Maintenance.findById(req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  await Maintenance.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Maintenance record deleted successfully' });
});