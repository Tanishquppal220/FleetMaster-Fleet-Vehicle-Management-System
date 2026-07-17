import 'dotenv/config';
import dns from 'dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import connectDB from './src/Config/db.js';
import { errorHandler } from './src/Middlewares/errorHandler.js';
import { globalLimiter } from './src/Middlewares/rateLimiter.js';

import authRoutes from './src/Routes/authRoutes.js';
import vehicleRoutes from './src/Routes/vehicleRoutes.js';
import maintenanceRoutes from './src/Routes/maintenanceRoutes.js';
import expenseRoutes from './src/Routes/expenseRoutes.js';
import driverRoutes from './src/Routes/driverRoutes.js';
import uploadRoutes from './src/Routes/uploadRoutes.js';

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JSON_LIMIT = process.env.JSON_LIMIT || '10mb';

if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));

app.use(globalLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FleetMaster Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`FleetMaster API running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down server...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('HTTP server and MongoDB connection closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
