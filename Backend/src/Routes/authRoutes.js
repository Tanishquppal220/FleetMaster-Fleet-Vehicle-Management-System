import express from 'express';
import { 
  register, 
  login, 
  logout, 
  refresh, 
  getMe, 
  updateProfile,
  googleLogin,
  getPendingUsers,
  approveUser,
  rejectUser,
} from '../Controllers/authController.js';
import { protect, authorize } from '../Middlewares/auth.js';
import { authLimiter } from '../Middlewares/rateLimiter.js';

const router = express.Router();

router.use(authLimiter);

// Public Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/google', googleLogin);

// Protected User Profile Routes (Requires Valid JWT Access Token)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

// Admin-Only Routes
router.get('/pending-users', protect, authorize('admin'), getPendingUsers);
router.put('/approve-user/:id', protect, authorize('admin'), approveUser);
router.delete('/reject-user/:id', protect, authorize('admin'), rejectUser);

export default router;