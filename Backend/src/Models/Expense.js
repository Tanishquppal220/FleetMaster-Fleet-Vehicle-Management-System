import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    expenseId: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: false,
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    fuelLiters: { 
      type: Number, 
      required: true, 
      min: [0, 'Fuel liters cannot be negative'] 
    },
    fuelCost: { 
      type: Number, 
      required: true, 
      min: [0, 'Fuel cost cannot be negative'] 
    },
    miscExpense: { 
      type: Number, 
      default: 0, 
      min: [0, 'Miscellaneous expense cannot be negative'] 
    },
    expenseDate: { 
      type: Date, 
      required: true 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property to dynamically calculate total operational cost
ExpenseSchema.virtual('totalOperationalCost').get(function () {
  return (this.fuelCost || 0) + (this.miscExpense || 0);
});

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;