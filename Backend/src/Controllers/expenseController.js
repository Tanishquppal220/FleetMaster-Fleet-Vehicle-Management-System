import crypto from 'crypto';
import Expense from '../Models/Expense.js';
import Vehicle from '../Models/Vehicle.js';
import Driver from '../Models/Driver.js';
import { asyncHandler } from '../Middlewares/errorHandler.js';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = asyncHandler(async (req, res, next) => {
  const { vehicle, driver } = req.query;
  const filter = {};

  if (vehicle) filter.vehicle = vehicle;
  if (driver) filter.driver = driver;

  if (req.user.role === 'driver') {
    const driverProfile = await Driver.findOne({ user: req.user._id });
    if (driverProfile) {
      filter.driver = driverProfile._id;
    } else {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
  }

  const expenses = await Expense.find(filter)
    .populate('vehicle', 'vehicleNumber type capacity')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'name email phone' },
    })
    .sort({ expenseDate: -1 });

  res.status(200).json({ success: true, count: expenses.length, data: expenses });
});

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id)
    .populate('vehicle', 'vehicleNumber type capacity')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'name email phone' },
    });

  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  if (req.user.role === 'driver') {
    const driverProfile = await Driver.findOne({ user: req.user._id });
    if (!driverProfile || expense.driver._id.toString() !== driverProfile._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this expense' });
    }
  }

  res.status(200).json({ success: true, data: expense });
});

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private (Admin, Driver)
export const createExpense = asyncHandler(async (req, res, next) => {
  const { vehicle, driver, fuelLiters, fuelCost, miscExpense, expenseDate, receiptUrl } = req.body;

  if (!vehicle || !fuelLiters || !fuelCost || !expenseDate) {
    return res.status(400).json({ success: false, message: 'Vehicle, fuel liters, fuel cost, and date are required' });
  }

  const targetVehicle = await Vehicle.findById(vehicle);
  if (!targetVehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  let driverId = driver;
  if (!driverId) {
    if (req.user.role === 'driver') {
      const driverProfile = await Driver.findOne({ user: req.user._id });
      if (!driverProfile) {
        return res.status(400).json({ success: false, message: 'No driver profile associated with this account' });
      }
      driverId = driverProfile._id;
    } else {
      return res.status(400).json({ success: false, message: 'Driver profile ID is required' });
    }
  } else {
    if (req.user.role === 'driver') {
      return res.status(403).json({ success: false, message: 'Drivers cannot create expenses for other drivers' });
    }
    const targetDriver = await Driver.findById(driverId);
    if (!targetDriver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }
  }

  const expenseId = 'EXP-' + crypto.randomUUID().slice(0, 12).toUpperCase();

  const expense = await Expense.create({
    expenseId,
    vehicle,
    driver: driverId,
    fuelLiters,
    fuelCost,
    miscExpense: miscExpense || 0,
    expenseDate,
    receiptUrl: receiptUrl || '',
  });

  res.status(201).json({ success: true, data: expense });
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin)
export const updateExpense = asyncHandler(async (req, res, next) => {
  let expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  if (req.body.vehicle) {
    const targetVehicle = await Vehicle.findById(req.body.vehicle);
    if (!targetVehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
  }

  if (req.body.driver) {
    const targetDriver = await Driver.findById(req.body.driver);
    if (!targetDriver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }
  }

  const allowedFields = {};
  for (const key of ['vehicle', 'driver', 'fuelLiters', 'fuelCost', 'miscExpense', 'expenseDate', 'receiptUrl']) {
    if (key in req.body) allowedFields[key] = req.body[key];
  }

  expense = await Expense.findByIdAndUpdate(req.params.id, allowedFields, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({ success: true, data: expense });
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin)
export const deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  await Expense.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Expense record deleted successfully' });
});
