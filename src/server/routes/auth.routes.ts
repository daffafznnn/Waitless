/* FILE: src/server/routes/auth.routes.ts */
import { Router } from 'express';
import { asyncHandler } from '../utils/response';
import { requireAuth } from '../utils/auth-middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', requireAuth, asyncHandler(authController.logout));
router.get('/me', requireAuth, asyncHandler(authController.getProfile));
router.post('/refresh', asyncHandler(authController.refreshToken));

router.get('/profile', requireAuth, asyncHandler(authController.getProfile));
router.put('/profile', requireAuth, asyncHandler(authController.updateProfile));
router.post('/change-password', requireAuth, asyncHandler(authController.changePassword));

export { router as authRoutes };