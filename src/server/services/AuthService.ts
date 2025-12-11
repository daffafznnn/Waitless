/* FILE: src/server/services/AuthService.ts */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { UserCreationAttributes, Role } from '../models/user.model';
import { sequelize } from '../db';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: Role;
  };
  token: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email, transaction);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const userCreationData: UserCreationAttributes = {
        email: userData.email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: userData.name.trim(),
        phone: userData.phone?.trim(),
        role: userData.role || Role.VISITOR,
      };

      const user = await this.userRepository.create(userCreationData, transaction);
      
      await transaction.commit();

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user has a password (some users might be created without password)
    if (!user.password_hash) {
      throw new Error('Account does not have a password set');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      // Optional: Check if user still exists and is active
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'waitless-app',
      audience: 'waitless-users',
    } as jwt.SignOptions);
  }

  /**
   * Refresh token (generate new token with same payload)
   */
  async refreshToken(oldToken: string): Promise<string> {
    const payload = await this.verifyToken(oldToken);
    return this.generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await this.userRepository.findById(userId, transaction);
      if (!user) {
        throw new Error('User not found');
      }

      // Check current password if user has one
      if (user.password_hash) {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
          throw new Error('Current password is incorrect');
        }
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.userRepository.update(userId, { password_hash: newPasswordHash }, transaction);
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: number): Promise<{
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: Role;
    created_at: Date;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updates: { name?: string; phone?: string }
  ): Promise<{
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: Role;
  }> {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await this.userRepository.findById(userId, transaction);
      if (!user) {
        throw new Error('User not found');
      }

      const updateData: any = {};
      if (updates.name?.trim()) {
        updateData.name = updates.name.trim();
      }
      if (updates.phone !== undefined) {
        updateData.phone = updates.phone?.trim() || null;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      await this.userRepository.update(userId, updateData, transaction);
      
      // Get updated user
      const updatedUser = await this.userRepository.findById(userId, transaction);
      
      await transaction.commit();

      return {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        phone: updatedUser!.phone,
        role: updatedUser!.role,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}