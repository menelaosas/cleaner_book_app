// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
  getCurrentUser,
  googleAuth,
  googleCallback,
  appleAuth,
  appleCallback,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Regular auth routes
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').optional().isIn(['USER', 'CLEANER']),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  login
);

router.post('/logout', authenticate, logout);

router.post(
  '/verify-email',
  [body('token').notEmpty(), validate],
  verifyEmail
);

router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail(), validate],
  resendVerification
);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail(), validate],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    validate,
  ],
  resetPassword
);

router.post('/refresh-token', refreshToken);

router.get('/me', authenticate, getCurrentUser);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

router.post('/apple', appleAuth);
router.post('/apple/callback', appleCallback);

export default router;
