import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null means broadcast to a role or everyone
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'driver', 'mechanic', 'all'], // Aligned exactly with User.js
      default: 'all',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'MAINTENANCE_DUE',      // Requirement 2: For scheduling repairs
        'EXPENSE_ALERT',        // Requirement 3: High costs / fuel logs
        'DRIVER_UPDATE',        // Requirement 1: Driver profile shifts
        'SYSTEM_ALERT'
      ],
      required: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // Stores extra context like vehicleId or expenseId
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;