import jwt from 'jsonwebtoken';
import { asyncHandler } from '../Middlewares/errorHandler.js';
import User from '../Models/User.js';
import Driver from '../Models/Driver.js';
import { generateToken, generateRefreshToken } from '../Utils/genreateTokens.js'; 

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'; 

// @desc    Register a new user (and Driver profile if role is 'Driver')
// @route   POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, licenseNumber, experience } = req.body;
  const requestedRole = 'driver';

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
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.id !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Invalid token payload' });
    }

    // Rotate: invalidate the old refresh token and issue a new one
    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    const newAccessToken = generateToken(user._id);
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
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

// @desc    Verify Google ID token and login/register user
// @route   POST /api/auth/google
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Google ID token is required' });
  }

  let payload;
  try {
    const response = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${idToken}`);
    if (!response.ok) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
    payload = await response.json();
  } catch {
    return res.status(501).json({ success: false, message: 'Failed to verify Google token' });
  }

  const { sub: googleId, email, name, picture } = payload;

  if (!email || !googleId) {
    return res.status(400).json({ success: false, message: 'Invalid Google token payload' });
  }

  const normalizedEmail = email.toLowerCase();

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval',
        code: 'PENDING_APPROVAL',
      });
    }

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
  }

  user = await User.create({
    name: name || 'Google User',
    email: normalizedEmail,
    googleId,
    avatar: picture || '',
    role: 'driver',
    status: 'inactive',
  });

  return res.status(403).json({
    success: true,
    message: 'Your account has been created and is pending admin approval',
    code: 'PENDING_APPROVAL',
  });
});

// @desc    Get all users pending admin approval
// @route   GET /api/auth/pending-users
export const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ status: 'inactive' }).select('name email avatar googleId createdAt');

  return res.status(200).json({
    success: true,
    data: users,
  });
});

// @desc    Approve a pending user
// @route   PUT /api/auth/approve-user/:id
export const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.status !== 'inactive') {
    return res.status(400).json({ success: false, message: 'User is not pending approval' });
  }

  user.status = 'active';
  await user.save();

  return res.status(200).json({
    success: true,
    message: `User ${user.name} has been approved`,
  });
});

// @desc    Reject and delete a pending user
// @route   DELETE /api/auth/reject-user/:id
export const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.status !== 'inactive') {
    return res.status(400).json({ success: false, message: 'User is not pending approval' });
  }

  await User.findByIdAndDelete(user._id);

  return res.status(200).json({
    success: true,
    message: `User ${user.name} has been rejected and removed`,
  });
});
