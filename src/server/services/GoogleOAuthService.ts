/* FILE: src/server/services/GoogleOAuthService.ts */
import { User, Role } from '../models/user.model';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
  }

  /**
   * Generate Google OAuth consent URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange code for tokens');
    }

    return response.json();
  }

  /**
   * Get user info from Google using access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info from Google');
    }

    return response.json();
  }

  /**
   * Find or create user from Google profile
   */
  async findOrCreateUser(googleUser: GoogleUserInfo): Promise<User> {
    // First, try to find by google_id
    let user = await User.findOne({
      where: { google_id: googleUser.id },
    });

    if (user) {
      // Update avatar if changed
      if (googleUser.picture && user.avatar_url !== googleUser.picture) {
        await user.update({ avatar_url: googleUser.picture });
      }
      return user;
    }

    // Try to find by email (in case user registered with email first)
    user = await User.findOne({
      where: { email: googleUser.email },
    });

    if (user) {
      // Link Google account to existing user
      await user.update({
        google_id: googleUser.id,
        avatar_url: googleUser.picture || user.avatar_url,
      });
      return user;
    }

    // Create new user
    user = await User.create({
      email: googleUser.email,
      name: googleUser.name,
      google_id: googleUser.id,
      avatar_url: googleUser.picture,
      role: Role.VISITOR,
      // No password for OAuth users
    });

    return user;
  }

  /**
   * Complete OAuth flow: exchange code and get/create user
   */
  async handleCallback(code: string): Promise<{ user: User; isNewUser: boolean }> {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // Get user info from Google
    const googleUser = await this.getUserInfo(tokens.access_token);

    // Check if email is verified
    if (!googleUser.verified_email) {
      throw new Error('Email belum terverifikasi oleh Google');
    }

    // Check if user exists before creating
    const existingUser = await User.findOne({
      where: { google_id: googleUser.id },
    });

    const isNewUser = !existingUser;

    // Find or create user
    const user = await this.findOrCreateUser(googleUser);

    return { user, isNewUser };
  }

  /**
   * Check if OAuth is configured
   */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }
}
