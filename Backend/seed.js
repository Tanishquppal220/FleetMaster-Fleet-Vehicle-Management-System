import dns from 'dns';

// Only bypass DNS locally (where process.env.NODE_ENV is not 'production')
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

import 'dotenv/config';
import mongoose from "mongoose";
import User from "./src/Models/User.js";
import connectDB from "./src/Config/db.js";

const seedAdmin = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Safely read your admin configuration from the .env file
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@fleetmaster.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('Error: SEED_ADMIN_PASSWORD is not defined in the .env file.');
      process.exit(1);
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists. Seeding skipped.');
      process.exit(0);
    }

    // 4. Create the admin object matching your exact userSchema fields
    const adminData = {
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      status: 'active'
    };

    await User.create(adminData);
    console.log('Admin user seeded securely!');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();

