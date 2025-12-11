import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { AuthService, RegisterRequest, LoginRequest } from '../../src/server/services/AuthService';
import { UserRepository } from '../../src/server/repositories/UserRepository';
import { Role } from '../../src/server/models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../../src/server/repositories/UserRepository');
vi.mock('../../src/server/db', () => ({
  sequelize: {
    transaction: vi.fn(() => ({
      commit: vi.fn(),
      rollback: vi.fn(),
    })),
  },
}));
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: UserRepository;
  let mockTransaction: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockTransaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
    };

    const { sequelize } = await import('../../src/server/db');
    sequelize.transaction.mockResolvedValue(mockTransaction);

    mockUserRepository = new UserRepository();
    authService = new AuthService();
    (authService as any).userRepository = mockUserRepository;
  });

  describe('register', () => {
    const validRegisterData: RegisterRequest = {
      email: 'test@example.com',
      password: 'TestPassword123',
      name: 'Test User',
      phone: '+1234567890',
      role: Role.VISITOR,
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        role: Role.VISITOR,
      };

      (mockUserRepository.findByEmail as Mock).mockResolvedValue(null);
      (bcrypt.hash as Mock).mockResolvedValue('hashed-password');
      (mockUserRepository.create as Mock).mockResolvedValue(mockUser);
      (jwt.sign as Mock).mockReturnValue('mock-token');

      const result = await authService.register(validRegisterData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com', mockTransaction);
      expect(bcrypt.hash).toHaveBeenCalledWith('TestPassword123', 12);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        phone: '+1234567890',
        role: Role.VISITOR,
      }, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token',
      });
    });

    it('should throw error if email already exists', async () => {
      const existingUser = { id: 1, email: 'test@example.com' };
      (mockUserRepository.findByEmail as Mock).mockResolvedValue(existingUser);

      await expect(authService.register(validRegisterData)).rejects.toThrow('Email already registered');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      (mockUserRepository.findByEmail as Mock).mockResolvedValue(null);
      (bcrypt.hash as Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(authService.register(validRegisterData)).rejects.toThrow('Hashing failed');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const validLoginData: LoginRequest = {
      email: 'test@example.com',
      password: 'TestPassword123',
    };

    it('should login user successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        role: Role.VISITOR,
        password_hash: 'hashed-password',
      };

      (mockUserRepository.findByEmail as Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as Mock).mockResolvedValue(true);
      (jwt.sign as Mock).mockReturnValue('mock-token');

      const result = await authService.login(validLoginData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('TestPassword123', 'hashed-password');
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          phone: '+1234567890',
          role: Role.VISITOR,
        },
        token: 'mock-token',
      });
    });

    it('should throw error if user not found', async () => {
      (mockUserRepository.findByEmail as Mock).mockResolvedValue(null);

      await expect(authService.login(validLoginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if user has no password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: null,
      };

      (mockUserRepository.findByEmail as Mock).mockResolvedValue(mockUser);

      await expect(authService.login(validLoginData)).rejects.toThrow('Account does not have a password set');
    });

    it('should throw error if password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
      };

      (mockUserRepository.findByEmail as Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as Mock).mockResolvedValue(false);

      await expect(authService.login(validLoginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', async () => {
      const mockPayload = {
        userId: 1,
        email: 'test@example.com',
        role: Role.VISITOR,
      };
      const mockUser = { id: 1, email: 'test@example.com' };

      (jwt.verify as Mock).mockReturnValue(mockPayload);
      (mockUserRepository.findById as Mock).mockResolvedValue(mockUser);

      const result = await authService.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPayload);
    });

    it('should throw error if token is invalid', async () => {
      (jwt.verify as Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('should throw error if token is expired', async () => {
      (jwt.verify as Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await expect(authService.verifyToken('expired-token')).rejects.toThrow('Token expired');
    });

    it('should throw error if user not found', async () => {
      const mockPayload = {
        userId: 1,
        email: 'test@example.com',
        role: Role.VISITOR,
      };

      (jwt.verify as Mock).mockReturnValue(mockPayload);
      (mockUserRepository.findById as Mock).mockResolvedValue(null);

      await expect(authService.verifyToken('valid-token')).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 1,
        password_hash: 'old-hashed-password',
      };

      (mockUserRepository.findById as Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as Mock).mockResolvedValue(true);
      (bcrypt.hash as Mock).mockResolvedValue('new-hashed-password');
      (mockUserRepository.update as Mock).mockResolvedValue([1, []]);

      await authService.changePassword(1, 'oldPassword', 'newPassword');

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1, mockTransaction);
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'old-hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 12);
      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        password_hash: 'new-hashed-password',
      }, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (mockUserRepository.findById as Mock).mockResolvedValue(null);

      await expect(authService.changePassword(1, 'oldPassword', 'newPassword'))
        .rejects.toThrow('User not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if current password is incorrect', async () => {
      const mockUser = {
        id: 1,
        password_hash: 'old-hashed-password',
      };

      (mockUserRepository.findById as Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as Mock).mockResolvedValue(false);

      await expect(authService.changePassword(1, 'wrongPassword', 'newPassword'))
        .rejects.toThrow('Current password is incorrect');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        role: Role.VISITOR,
        created_at: new Date('2023-01-01'),
      };

      (mockUserRepository.findById as Mock).mockResolvedValue(mockUser);

      const result = await authService.getProfile(1);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      (mockUserRepository.findById as Mock).mockResolvedValue(null);

      await expect(authService.getProfile(1)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        role: Role.VISITOR,
      };

      const updatedUser = {
        ...mockUser,
        name: 'Updated User',
        phone: '+9876543210',
      };

      (mockUserRepository.findById as Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      (mockUserRepository.update as Mock).mockResolvedValue([1, []]);

      const result = await authService.updateProfile(1, {
        name: 'Updated User',
        phone: '+9876543210',
      });

      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        name: 'Updated User',
        phone: '+9876543210',
      }, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Updated User',
        phone: '+9876543210',
        role: Role.VISITOR,
      });
    });

    it('should throw error if user not found', async () => {
      (mockUserRepository.findById as Mock).mockResolvedValue(null);

      await expect(authService.updateProfile(1, { name: 'New Name' }))
        .rejects.toThrow('User not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if no valid fields to update', async () => {
      const mockUser = { id: 1 };
      (mockUserRepository.findById as Mock).mockResolvedValue(mockUser);

      await expect(authService.updateProfile(1, {}))
        .rejects.toThrow('No valid fields to update');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = authService.validatePassword('StrongPass123');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const testCases = [
        { password: 'short', expectedErrors: ['Password must be at least 8 characters long', 'Password must contain at least one uppercase letter', 'Password must contain at least one number'] },
        { password: 'nouppercase123', expectedErrors: ['Password must contain at least one uppercase letter'] },
        { password: 'NOLOWERCASE123', expectedErrors: ['Password must contain at least one lowercase letter'] },
        { password: 'NoNumbers', expectedErrors: ['Password must contain at least one number'] },
      ];

      testCases.forEach(({ password, expectedErrors }) => {
        const result = authService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach(error => {
          expect(result.errors).toContain(error);
        });
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockPayload = {
        userId: 1,
        email: 'test@example.com',
        role: Role.VISITOR,
      };
      const mockUser = { id: 1, email: 'test@example.com' };

      (jwt.verify as Mock).mockReturnValue(mockPayload);
      (mockUserRepository.findById as Mock).mockResolvedValue(mockUser);
      (jwt.sign as Mock).mockReturnValue('new-token');

      const result = await authService.refreshToken('old-token');

      expect(result).toBe('new-token');
      expect(jwt.sign).toHaveBeenCalledWith(mockPayload, 'test-jwt-secret', {
        expiresIn: '7d',
        issuer: 'waitless-app',
        audience: 'waitless-users',
      });
    });
  });
});