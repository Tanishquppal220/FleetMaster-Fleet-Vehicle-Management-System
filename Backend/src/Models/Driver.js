import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Please add a license number'],
      unique: true,
      trim: true,
    },
    licensePhoto: {
      type: String,
      default: '',
    },
    experience: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'In Maintenance', 'Off Duty'],
      default: 'Available',
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
