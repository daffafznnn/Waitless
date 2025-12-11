import { config } from 'dotenv';
import { vi, beforeEach, afterEach } from 'vitest';

config();

beforeEach(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.NODE_ENV = 'test';
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});