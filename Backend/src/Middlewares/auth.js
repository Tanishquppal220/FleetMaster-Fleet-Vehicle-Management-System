import jwt from 'jsonwebtoken';
import { asyncHandler } from './errorHandler.js';
import User from '../Models/User.js'; 

// Protect routes (Verify JWT token)
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check for token in authorization headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header (e.g., "Bearer <token>")
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token missing',
    });
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fleetflow_jwt_secret_key_2026_super_secure'
    );

    // 4. Get user from database (excluding password for security)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token does not exist',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your user profile has been deactivated',
      });
    }

    // 5. Attach user to the request object so downstream routes can use it
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token validation failed',
    });
  }
});

// Grant access to specific roles (e.g., admin, driver)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};
