/* FILE: src/server/routes/auth.routes.ts */
import { Router } from 'express';
import { asyncHandler } from '../utils/response';
import { requireAuth } from '../utils/auth-middleware';
import * as authController from '../controllers/auth.controller';
import * as googleOAuthController from '../controllers/google-oauth.controller';

const router = Router();

// Conventional auth
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', requireAuth, asyncHandler(authController.logout));
router.get('/me', requireAuth, asyncHandler(authController.getProfile));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/set-token', asyncHandler(authController.setToken));

router.get('/profile', requireAuth, asyncHandler(authController.getProfile));
router.put('/profile', requireAuth, asyncHandler(authController.updateProfile));
router.post('/change-password', requireAuth, asyncHandler(authController.changePassword));

// Google OAuth
router.get('/google', asyncHandler(googleOAuthController.initiateGoogle));
router.get('/google/callback', asyncHandler(googleOAuthController.handleGoogleCallback));
router.get('/google/status', asyncHandler(googleOAuthController.checkGoogleStatus));

export { router as authRoutes };