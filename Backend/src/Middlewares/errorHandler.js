// Global Centralized Error Handling Middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for development troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // 1. Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(440).json({
      success: false,
      message: `Resource not found with id of ${err.value}`
    });
  }

  // 2. Mongoose duplicate key error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate field value entered: ${field}. Please use another value.`
    });
  }

  // 3. Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message: message
    });
  }

  // 4. JWT invalid token error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token'
    });
  }

  // 5. JWT expired token error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token expired'
    });
  }

  // 6. Generic Fallback Server Error
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Server Error',
    errors: error.errors || null
  });
};

// Async middleware handler wrapper (eliminates try-catch blocks in routes/controllers)
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);