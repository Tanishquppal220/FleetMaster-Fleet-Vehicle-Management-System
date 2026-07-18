import express from 'express';
import { 
  register, 
  login, 
  logout, 
  refresh, 
  getMe, 
  updateProfile,
  getMechanics,
  getUsers,
  createUser,
  updateUser,
  deleteUser
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

// Protected User Profile Routes (Requires Valid JWT Access Token)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

// Admin-only routes
router.get('/mechanics', protect, authorize('admin'), getMechanics);

// User management (admin only)
router.route('/users').get(protect, authorize('admin'), getUsers);
router.route('/users').post(protect, authorize('admin'), createUser);
router.route('/users/:id').put(protect, authorize('admin'), updateUser);
router.route('/users/:id').delete(protect, authorize('admin'), deleteUser);

export default router;