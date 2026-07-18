import Maintenance from '../Models/Maintenance.js';
import Vehicle from '../Models/Vehicle.js';
import Driver from '../Models/Driver.js';
import { asyncHandler } from '../Middlewares/errorHandler.js';

// @desc    Get maintenance records with role-based filtering
// @route   GET /api/maintenance
// @access  Private
export const getMaintenanceRecords = asyncHandler(async (req, res, next) => {
  const { status, priority, vehicleId } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (vehicleId) filter.vehicle = vehicleId;

  if (req.user.role === 'driver') {
    const driverProfile = await Driver.findOne({ user: req.user._id });
    if (driverProfile?.assignedVehicle) {
      filter.vehicle = driverProfile.assignedVehicle;
    } else {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
  } else if (req.user.role === 'mechanic') {
    filter.assignedMechanic = req.user._id;
  }

  const records = await Maintenance.find(filter)
    .populate('vehicle', 'vehicleNumber type capacity')
    .populate('performedBy', 'name email')
    .populate('assignedMechanic', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: records.length, data: records });
});

// @desc    Get single maintenance record by ID
// @route   GET /api/maintenance/:id
// @access  Private
export const getMaintenanceRecordById = asyncHandler(async (req, res, next) => {
  const record = await Maintenance.findById(req.params.id)
    .populate('vehicle', 'vehicleNumber type capacity')
    .populate('performedBy', 'name email')
    .populate('assignedMechanic', 'name email');

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  if (req.user.role === 'mechanic' && record.assignedMechanic?._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this maintenance record' });
  }

  res.status(200).json({ success: true, data: record });
});

// @desc    Create a maintenance record
// @route   POST /api/maintenance
// @access  Private (Admin, Mechanic)
export const createMaintenanceRecord = asyncHandler(async (req, res, next) => {
  const { vehicle, type, scheduledDate, cost, description, priority } = req.body;
  const assignedMechanic = req.user.role === 'admin' ? (req.body.assignedMechanic || null) : null;

  if (!vehicle || !type || !scheduledDate) {
    return res.status(400).json({ success: false, message: 'Vehicle, type, and scheduled date are required' });
  }

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
    performedBy: req.user ? req.user._id : null,
    assignedMechanic: assignedMechanic || null,
  });

  res.status(201).json({ success: true, data: record });
});

// @desc    Update a maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private (Admin, Mechanic)
export const updateMaintenanceRecord = asyncHandler(async (req, res, next) => {
  let record = await Maintenance.findById(req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  const oldStatus = record.status;

  const allowedFields = {};
  for (const key of ['vehicle', 'type', 'scheduledDate', 'cost', 'description', 'priority', 'status']) {
    if (key in req.body) allowedFields[key] = req.body[key];
  }

  if (req.user.role === 'admin' && 'assignedMechanic' in req.body) {
    allowedFields.assignedMechanic = req.body.assignedMechanic || null;
  }

  if (req.body.status && req.body.status === 'Completed' && oldStatus !== 'Completed') {
    allowedFields.completedDate = new Date();
  }

  record = await Maintenance.findByIdAndUpdate(req.params.id, allowedFields, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (req.body.status && req.body.status !== oldStatus) {
    const vehicleObj = await Vehicle.findById(record.vehicle);

    if (vehicleObj) {
      if (record.status === 'Completed') {
        await Vehicle.findByIdAndUpdate(record.vehicle, {
          maintenanceStatus: 'Satisfactory',
        });

        if (vehicleObj.assignedDriver) {
          await Driver.findOneAndUpdate(
            { user: vehicleObj.assignedDriver.toString() },
            { status: 'Available' }
          );
        }
      } else if (record.status === 'In Progress') {
        await Vehicle.findByIdAndUpdate(record.vehicle, {
          maintenanceStatus: 'Under Repair',
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
