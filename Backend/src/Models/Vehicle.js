import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Please add a vehicle number'],
    unique: true,
    trim: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['Semi-Truck', 'Box Truck', 'Cargo Van', 'Flatbed'],
    required: [true, 'Please add a vehicle type'],
  },
  capacity: {
    type: Number,
    required: [true, 'Please add cargo capacity in kg'],
  },
  fuelStatus: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  maintenanceStatus: {
    type: String,
    enum: ['Satisfactory', 'Service Due', 'Under Repair'],
    default: 'Satisfactory',
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

VehicleSchema.virtual('availability').get(function () {
  return this.maintenanceStatus === 'Satisfactory';
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;
