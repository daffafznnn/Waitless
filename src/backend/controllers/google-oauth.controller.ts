/* FILE: src/server/controllers/google-oauth.controller.ts */
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GoogleOAuthService } from '../services/GoogleOAuthService';

const googleOAuthService = new GoogleOAuthService();
const JWT_SECRET = process.env.JWT_SECRET || 'waitless-jwt-secret-key';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen
 */
export const initiateGoogle = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!googleOAuthService.isConfigured()) {
      res.status(503).json({
        ok: false,
        error: 'Google OAuth belum dikonfigurasi'
      });
      return;
    }

    const authUrl = googleOAuthService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Google OAuth initiate error:', error);
    res.status(500).json({
      ok: false,
      error: 'Gagal menginisiasi login Google'
    });
  }
};

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, error: oauthError } = req.query;

    // Handle OAuth errors
    if (oauthError) {
      console.error('Google OAuth error:', oauthError);
      res.redirect(`${CLIENT_URL}/login?error=oauth_denied`);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.redirect(`${CLIENT_URL}/login?error=no_code`);
      return;
    }

    // Process the OAuth callback
    const { user, isNewUser } = await googleOAuthService.handleCallback(code);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token in URL (frontend will store it)
    const message = isNewUser ? 'Akun berhasil dibuat!' : 'Login berhasil!';
    res.redirect(`${CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}&message=${encodeURIComponent(message)}&newUser=${isNewUser}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent(error.message || 'oauth_failed')}`);
  }
};

/**
 * GET /api/auth/google/status
 * Check if Google OAuth is configured
 */
export const checkGoogleStatus = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    ok: true,
    data: {
      configured: googleOAuthService.isConfigured()
    }
  });
};
