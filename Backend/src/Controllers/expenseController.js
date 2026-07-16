import Expense from '../Models/Expense.js';
import Vehicle from '../Models/Vehicle.js';
import Driver from '../Models/Driver.js';
import { asyncHandler } from '../Middlewares/errorHandler.js';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = asyncHandler(async (req, res, next) => {
  const { vehicle, driver, trip } = req.query;
  const filter = {};

  if (vehicle) filter.vehicle = vehicle;
  if (driver) filter.driver = driver;
  if (trip) filter.trip = trip;

  // If driver user logs in, they should only see their own expenses
  if (req.user.role === 'driver') {
    const driverProfile = await Driver.findOne({ name: req.user._id });
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
      populate: { path: 'name', select: 'name email phone' }
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
      populate: { path: 'name', select: 'name email phone' }
    });

  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  res.status(200).json({ success: true, data: expense });
});

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private (Admin, Driver)
export const createExpense = asyncHandler(async (req, res, next) => {
  const { vehicle, driver, fuelLiters, fuelCost, miscExpense, expenseDate, receiptUrl, trip } = req.body;

  if (!vehicle || !fuelLiters || !fuelCost || !expenseDate) {
    return res.status(400).json({ success: false, message: 'Vehicle, fuel liters, fuel cost, and date are required' });
  }

  // Validate vehicle exists
  const targetVehicle = await Vehicle.findById(vehicle);
  if (!targetVehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  // Resolve driver profile
  let driverId = driver;
  if (!driverId) {
    if (req.user.role === 'driver') {
      const driverProfile = await Driver.findOne({ name: req.user._id });
      if (!driverProfile) {
        return res.status(400).json({ success: false, message: 'No driver profile associated with this account' });
      }
      driverId = driverProfile._id;
    } else {
      return res.status(400).json({ success: false, message: 'Driver profile ID is required' });
    }
  } else {
    // Validate driver exists
    const targetDriver = await Driver.findById(driverId);
    if (!targetDriver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }
  }

  // Generate unique expenseId
  const expenseId = 'EXP-' + Date.now() + Math.floor(Math.random() * 1000);

  const expense = await Expense.create({
    expenseId,
    trip,
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

  expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
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