import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
    },
    email : {
        type: String,
        required: [true, 'Please add email'],
        unique: true,
        match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
        lowercase: true,
        index: true,
    },
    password : {
        type: String,
        minlength: 6,
        select: false,
    },
    googleId: {
        type: String,
        default: null,
    },
    role: {
      type: String,
      enum: ['admin', 'driver', 'mechanic', 'dispatcher'],
      default: 'driver',
    },
    phone: {
      type: String,
      trim: true,
    },
    address:{
        type: String,
        trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    avatar: {
      type: String,
      default: '',
    },
    refreshTokens: [String], // Store active refresh tokens for rotation/logout
  },
{
    timestamps: true,
})

// Encryption using bcrypt
userSchema.pre('save', async function () {

    if (!this.isModified('password') || !this.password){
      return;
    }

    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

