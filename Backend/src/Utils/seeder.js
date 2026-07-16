import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';

import connectDB from '../Config/db.js';
import Driver from '../Models/Driver.js';
import Expense from '../Models/Expense.js';
import Maintenance from '../Models/Maintenance.js';
import User from '../Models/User.js';
import Vehicle from '../Models/Vehicle.js';

if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const defaultPassword = process.env.SEED_USER_PASSWORD || 'Fleet@123';

const driverUsers = [
  {
    name: 'Shubham Kumar',
    email: 'shubham@fleet-management.com',
    password: defaultPassword,
    role: 'driver',
    phone: '+91 98765 10001',
    address: 'Jalandhar, Punjab',
  },
  {
    name: 'Aman Verma',
    email: 'aman.driver@fleetmaster.com',
    password: defaultPassword,
    role: 'driver',
    phone: '+91 98765 10002',
    address: 'Ludhiana, Punjab',
  },
  {
    name: 'Neha Sharma',
    email: 'neha.driver@fleetmaster.com',
    password: defaultPassword,
    role: 'driver',
    phone: '+91 98765 10003',
    address: 'Noida, Uttar Pradesh',
  },
  {
    name: 'Rahul Singh',
    email: 'rahul.driver@fleetmaster.com',
    password: defaultPassword,
    role: 'driver',
    phone: '+91 98765 10004',
    address: 'Gurugram, Haryana',
  },
];

const driverProfiles = [
  { email: 'shubham@fleet-management.com', licenseNumber: 'DL-PB-2026-1001', experience: 3, status: 'Available' },
  { email: 'aman.driver@fleetmaster.com', licenseNumber: 'DL-PB-2026-1002', experience: 5, status: 'On Trip' },
  { email: 'neha.driver@fleetmaster.com', licenseNumber: 'DL-UP-2026-1003', experience: 4, status: 'Available' },
  { email: 'rahul.driver@fleetmaster.com', licenseNumber: 'DL-HR-2026-1004', experience: 6, status: 'In Maintenance' },
];

const vehicleSeed = [
  { vehicleNumber: 'PB-10-FM-1001', type: 'Box Truck', capacity: 4200, fuelStatus: 82, maintenanceStatus: 'Satisfactory', availability: true },
  { vehicleNumber: 'PB-10-FM-1002', type: 'Cargo Van', capacity: 1800, fuelStatus: 38, maintenanceStatus: 'Service Due', availability: true },
  { vehicleNumber: 'UP-16-FM-2001', type: 'Semi-Truck', capacity: 9500, fuelStatus: 64, maintenanceStatus: 'Satisfactory', availability: false },
  { vehicleNumber: 'HR-26-FM-3001', type: 'Flatbed', capacity: 7200, fuelStatus: 18, maintenanceStatus: 'Under Repair', availability: false },
  { vehicleNumber: 'DL-01-FM-4001', type: 'Box Truck', capacity: 5100, fuelStatus: 91, maintenanceStatus: 'Satisfactory', availability: true },
];

const maintenanceSeed = [
  { vehicleNumber: 'PB-10-FM-1002', type: 'Routine Check', daysFromNow: 2, cost: 180, priority: 'Medium', status: 'Scheduled', description: 'Routine inspection and brake condition check.' },
  { vehicleNumber: 'HR-26-FM-3001', type: 'Repair', daysFromNow: 1, cost: 650, priority: 'High', status: 'In Progress', description: 'Hydraulic system repair and safety verification.' },
  { vehicleNumber: 'UP-16-FM-2001', type: 'Oil Change', daysFromNow: 5, cost: 240, priority: 'Low', status: 'Scheduled', description: 'Engine oil and filter replacement.' },
  { vehicleNumber: 'PB-10-FM-1001', type: 'Inspection', daysFromNow: -4, cost: 120, priority: 'Low', status: 'Completed', description: 'Completed roadworthiness inspection.' },
];

const expenseSeed = [
  { expenseId: 'EXP-DEMO-1001', vehicleNumber: 'PB-10-FM-1001', driverEmail: 'shubham@fleet-management.com', fuelLiters: 45, fuelCost: 120, miscExpense: 18, daysAgo: 1 },
  { expenseId: 'EXP-DEMO-1002', vehicleNumber: 'PB-10-FM-1002', driverEmail: 'aman.driver@fleetmaster.com', fuelLiters: 38, fuelCost: 102, miscExpense: 12, daysAgo: 2 },
  { expenseId: 'EXP-DEMO-1003', vehicleNumber: 'UP-16-FM-2001', driverEmail: 'neha.driver@fleetmaster.com', fuelLiters: 62, fuelCost: 176, miscExpense: 34, daysAgo: 3 },
  { expenseId: 'EXP-DEMO-1004', vehicleNumber: 'DL-01-FM-4001', driverEmail: 'rahul.driver@fleetmaster.com', fuelLiters: 50, fuelCost: 145, miscExpense: 22, daysAgo: 4 },
  { expenseId: 'EXP-DEMO-1005', vehicleNumber: 'PB-10-FM-1001', driverEmail: 'shubham@fleet-management.com', fuelLiters: 41, fuelCost: 112, miscExpense: 9, daysAgo: 5 },
];

const dateFromToday = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const upsertDriverUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    existingUser.name = userData.name;
    existingUser.role = 'driver';
    existingUser.phone = userData.phone;
    existingUser.address = userData.address;
    existingUser.status = 'active';
    await existingUser.save();
    return existingUser;
  }

  return User.create({
    ...userData,
    status: 'active',
  });
};

const seed = async () => {
  await connectDB();

  const usersByEmail = {};
  for (const userData of driverUsers) {
    const user = await upsertDriverUser(userData);
    usersByEmail[user.email] = user;
  }

  const driversByEmail = {};
  for (const profile of driverProfiles) {
    const user = usersByEmail[profile.email];
    const driver = await Driver.findOneAndUpdate(
      { name: user._id },
      {
        name: user._id,
        licenseNumber: profile.licenseNumber,
        experience: profile.experience,
        status: profile.status,
      },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );
    driversByEmail[profile.email] = driver;
  }

  const driverEmails = Object.keys(driversByEmail);
  const vehiclesByNumber = {};
  for (const [index, vehicleData] of vehicleSeed.entries()) {
    const driverEmail = driverEmails[index % driverEmails.length];
    const assignedUser = usersByEmail[driverEmail];
    const assignedDriver = driversByEmail[driverEmail];

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleNumber: vehicleData.vehicleNumber },
      {
        ...vehicleData,
        assignedDriver: assignedUser._id,
      },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );

    assignedDriver.assignedVehicle = vehicle._id;
    await assignedDriver.save();

    vehiclesByNumber[vehicle.vehicleNumber] = vehicle;
  }

  await Maintenance.deleteMany({
    vehicle: { $in: Object.values(vehiclesByNumber).map((vehicle) => vehicle._id) },
  });

  await Maintenance.insertMany(
    maintenanceSeed.map((item) => ({
      vehicle: vehiclesByNumber[item.vehicleNumber]._id,
      type: item.type,
      scheduledDate: dateFromToday(item.daysFromNow),
      completedDate: item.status === 'Completed' ? dateFromToday(item.daysFromNow + 1) : null,
      cost: item.cost,
      description: item.description,
      priority: item.priority,
      status: item.status,
      performedBy: null,
    }))
  );

  await Expense.deleteMany({ expenseId: { $in: expenseSeed.map((item) => item.expenseId) } });

  await Expense.insertMany(
    expenseSeed.map((item) => ({
      expenseId: item.expenseId,
      vehicle: vehiclesByNumber[item.vehicleNumber]._id,
      driver: driversByEmail[item.driverEmail]._id,
      fuelLiters: item.fuelLiters,
      fuelCost: item.fuelCost,
      miscExpense: item.miscExpense,
      expenseDate: dateFromToday(-item.daysAgo),
      receiptUrl: '',
    }))
  );

  console.log('Driver, vehicle, maintenance, and expense demo data seeded successfully.');
  console.log(`Driver login: ${driverUsers[0].email} / ${defaultPassword}`);
  console.log('This file is standalone and will not run during deployment unless manually executed.');

  await mongoose.connection.close();
};

seed()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Seeder failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
