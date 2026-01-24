// backend/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config/config';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Generate JWT tokens
const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

// Register new user
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, role = 'USER' } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      status: 'PENDING_VERIFICATION',
    },
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Store verification token
  await prisma.verificationToken.create({
    data: {
      email: user.email,
      token: hashedToken,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Send verification email
  await sendVerificationEmail(user.email, user.firstName, verificationToken);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    },
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      cleanerProfile: true,
    },
  });

  if (!user || !user.password) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if user is suspended
  if (user.status === 'SUSPENDED') {
    throw new AppError('Your account has been suspended. Please contact support.', 403);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
        avatar: user.avatar,
        cleanerProfile: user.cleanerProfile ? {
          id: user.cleanerProfile.id,
          isVerified: user.cleanerProfile.isVerified,
          averageRating: user.cleanerProfile.averageRating,
        } : null,
      },
      accessToken,
      refreshToken,
    },
  });
});

// Logout user
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId: req.user!.id,
      },
    });
  }

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Verify email
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find verification token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token: hashedToken,
      type: 'email_verification',
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verificationToken) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Update user
  await prisma.user.update({
    where: { email: verificationToken.email },
    data: {
      emailVerified: new Date(),
      status: 'ACTIVE',
    },
  });

  // Delete verification token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

// Resend verification email
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.emailVerified) {
    throw new AppError('Email already verified', 400);
  }

  // Delete old verification tokens
  await prisma.verificationToken.deleteMany({
    where: {
      email: user.email,
      type: 'email_verification',
    },
  });

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  await prisma.verificationToken.create({
    data: {
      email: user.email,
      token: hashedToken,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(user.email, user.firstName, verificationToken);

  res.json({
    success: true,
    message: 'Verification email sent',
  });
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
    return;
  }

  // Delete old reset tokens
  await prisma.verificationToken.deleteMany({
    where: {
      email: user.email,
      type: 'password_reset',
    },
  });

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await prisma.verificationToken.create({
    data: {
      email: user.email,
      token: hashedToken,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetEmail(user.email, user.firstName, resetToken);

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link will be sent.',
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token: hashedToken,
      type: 'password_reset',
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verificationToken) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user password
  await prisma.user.update({
    where: { email: verificationToken.email },
    data: { password: hashedPassword },
  });

  // Delete reset token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  // Delete all refresh tokens (logout from all devices)
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.email },
  });

  if (user) {
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
  }

  res.json({
    success: true,
    message: 'Password reset successful. Please login with your new password.',
  });
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token required', 401);
  }

  // Verify refresh token
  const decoded = jwt.verify(token, config.jwtRefreshSecret) as { id: string };

  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token,
      userId: decoded.id,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    user.id,
    user.email,
    user.role
  );

  // Delete old refresh token
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      cleanerProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        cleanerProfile: user.cleanerProfile,
        createdAt: user.createdAt,
      },
    },
  });
});

// Google OAuth (placeholder - implement with passport-google-oauth20)
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  // Redirect to Google OAuth
  res.redirect('/auth/google');
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  // Handle Google OAuth callback
  res.redirect(`${config.frontendUrl}/auth/callback`);
});

// Apple OAuth (placeholder - implement with apple-signin-auth)
export const appleAuth = asyncHandler(async (req: Request, res: Response) => {
  // Handle Apple Sign In
  res.json({ success: true });
});

export const appleCallback = asyncHandler(async (req: Request, res: Response) => {
  // Handle Apple OAuth callback
  res.redirect(`${config.frontendUrl}/auth/callback`);
});
