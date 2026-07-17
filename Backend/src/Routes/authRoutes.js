import express from 'express';
import { 
  register, 
  login, 
  logout, 
  refresh, 
  getMe, 
  googleLogin,
  updateProfile
} from '../Controllers/authController.js';
import { protect } from '../Middlewares/auth.js';
import { authLimiter } from '../Middlewares/rateLimiter.js';

const router = express.Router();

router.use(authLimiter);

// Public Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/google-login', googleLogin);

// Protected User Profile Routes (Requires Valid JWT Access Token)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

export default router;