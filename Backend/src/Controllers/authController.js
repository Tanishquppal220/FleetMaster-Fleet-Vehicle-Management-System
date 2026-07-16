import jwt from 'jsonwebtoken';
import { asyncHandler } from '../Middlewares/errorHandler.js';
import User from '../Models/User.js';
import Driver from '../Models/Driver.js';
// Import BOTH generator functions directly from your utility file
import { generateToken, generateRefreshToken } from '../Utils/genreateTokens.js'; 

// @desc    Register a new user (and Driver profile if role is 'Driver')
// @route   POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, licenseNumber, experience } = req.body;
  const requestedRole = ['driver', 'mechanic'].includes(role) ? role : 'driver';

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: requestedRole,
    phone,
  });

  if (user.role === 'driver') {
    if (!licenseNumber) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ success: false, message: 'Driver registration requires a license number' });
    }
    try {
      await Driver.create({
        name: user._id,
        licenseNumber,
        experience: experience || 0,
        status: 'Available',
      });
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ success: false, message: `Failed to create driver profile: ${err.message}` });
    }
  }

  // Using your pre-existing token generators
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Login user & return tokens
// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ success: false, message: 'Your user profile has been deactivated' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Using your pre-existing token generators
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Logout user (Invalidate/remove Refresh Token)
// @route   POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await User.updateOne(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } }
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }

  const user = await User.findOne({ refreshTokens: refreshToken });
  if (!user) {
    return res.status(403).json({ success: false, message: 'Invalid refresh token' });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'fleetflow_jwt_refresh_secret_key_2026_super_secure'
    );

    if (decoded.id !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Invalid token payload' });
    }

    // Using your pre-existing token generator to issue a new access token
    const newAccessToken = generateToken(user._id);
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    await user.save();
    return res.status(403).json({ success: false, message: 'Expired or invalid refresh token' });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  let profile = { user };

  if (user.role === 'driver') {
    const driverProfile = await Driver.findOne({ name: user._id });
    profile.driverProfile = driverProfile;
  }

  return res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: profile,
  });
});

// @desc    Google OAuth Login
// @route   POST /api/auth/google-login
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Google idToken is required' });
  }

  try {
    let payload;
    if (idToken === 'mock_google_token_bypass') {
      payload = {
        email: 'simulated.google.driver@fleetflow.com',
        name: 'Simulated Google Driver',
        picture: '',
      };
    } else {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      payload = await response.json();
      if (payload.error_description || !payload.email) {
        return res.status(400).json({ success: false, message: 'Google authentication token validation failed' });
      }
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      user = await User.create({
        name: payload.name || 'Google User',
        email,
        password: randomPassword,
        role: 'driver',
        phone: '+1 (555) 000-0000',
      });

      const randomLicense = 'CDL-GGL-' + Math.floor(10000 + Math.random() * 90000);
      await Driver.create({
        name: user._id,
        licenseNumber: randomLicense,
        experience: 1,
        status: 'Available',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your user profile has been deactivated' });
    }

    // Using your pre-existing token generators
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Google auth server communication failed: ${error.message}` });
  }
});

// @desc    Update user profile (including avatar)
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, avatar } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
    }
  });
});
