/* FILE: src/server/utils/validators.ts */
/**
 * Validation Utilities for Waitless Backend
 * 
 * Centralized validation functions to ensure consistent
 * input validation across all services.
 */

import { InvalidIdError, ValidationError } from '../types/errors';

/**
 * Validate and convert to positive integer
 * Handles BIGINT returned as string, BigInt, or number
 */
export function validateId(value: unknown, paramName: string = 'ID'): number {
  if (value === undefined || value === null) {
    throw new InvalidIdError(paramName);
  }
  
  let numValue: number;
  
  if (typeof value === 'bigint') {
    numValue = Number(value);
  } else if (typeof value === 'string') {
    numValue = parseInt(value, 10);
  } else if (typeof value === 'number') {
    numValue = value;
  } else {
    throw new InvalidIdError(paramName);
  }
  
  if (isNaN(numValue) || numValue <= 0 || !Number.isInteger(numValue)) {
    throw new InvalidIdError(paramName);
  }
  
  return numValue;
}

/**
 * Validate positive integer (for counts, limits, etc.)
 */
export function validatePositiveInteger(
  value: unknown,
  paramName: string,
  options?: { min?: number; max?: number }
): number {
  if (value === undefined || value === null) {
    throw new ValidationError(`${paramName} wajib diisi`);
  }
  
  const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  
  if (isNaN(numValue) || !Number.isInteger(numValue)) {
    throw new ValidationError(`${paramName} harus berupa angka bulat`);
  }
  
  if (numValue < 1) {
    throw new ValidationError(`${paramName} harus lebih dari 0`);
  }
  
  if (options?.min !== undefined && numValue < options.min) {
    throw new ValidationError(`${paramName} minimal ${options.min}`);
  }
  
  if (options?.max !== undefined && numValue > options.max) {
    throw new ValidationError(`${paramName} maksimal ${options.max}`);
  }
  
  return numValue;
}

/**
 * Validate non-negative integer (for counts that can be 0)
 */
export function validateNonNegativeInteger(
  value: unknown,
  paramName: string
): number {
  if (value === undefined || value === null) {
    throw new ValidationError(`${paramName} wajib diisi`);
  }
  
  const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  
  if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
    throw new ValidationError(`${paramName} harus berupa angka non-negatif`);
  }
  
  return numValue;
}

/**
 * Validate date string in YYYY-MM-DD format
 */
export function validateDateString(
  value: unknown,
  paramName: string = 'Tanggal'
): string {
  if (typeof value !== 'string' || !value) {
    throw new ValidationError(`${paramName} wajib diisi`);
  }
  
  // Check YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${paramName} harus dalam format YYYY-MM-DD`);
  }
  
  // Validate it's a real date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${paramName} tidak valid`);
  }
  
  return value;
}

/**
 * Validate optional date string
 */
export function validateOptionalDateString(
  value: unknown,
  paramName: string = 'Tanggal'
): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return validateDateString(value, paramName);
}

/**
 * Validate time string in HH:MM:SS or HH:MM format
 */
export function validateTimeString(
  value: unknown,
  paramName: string = 'Waktu'
): string {
  if (typeof value !== 'string' || !value) {
    throw new ValidationError(`${paramName} wajib diisi`);
  }
  
  // Accept HH:MM or HH:MM:SS
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    throw new ValidationError(`${paramName} harus dalam format HH:MM atau HH:MM:SS`);
  }
  
  const parts = value.split(':').map(Number);
  const [hours, minutes, seconds = 0] = parts;
  
  if (hours < 0 || hours > 23) {
    throw new ValidationError(`${paramName}: jam harus antara 00-23`);
  }
  
  if (minutes < 0 || minutes > 59) {
    throw new ValidationError(`${paramName}: menit harus antara 00-59`);
  }
  
  if (seconds < 0 || seconds > 59) {
    throw new ValidationError(`${paramName}: detik harus antara 00-59`);
  }
  
  // Normalize to HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Validate time range (start < end)
 */
export function validateTimeRange(
  startTime: string,
  endTime: string,
  startParamName: string = 'Waktu mulai',
  endParamName: string = 'Waktu selesai'
): { startTime: string; endTime: string } {
  const start = validateTimeString(startTime, startParamName);
  const end = validateTimeString(endTime, endParamName);
  
  if (start >= end) {
    throw new ValidationError(`${startParamName} harus sebelum ${endParamName.toLowerCase()}`);
  }
  
  return { startTime: start, endTime: end };
}

/**
 * Validate required string
 */
export function validateRequiredString(
  value: unknown,
  paramName: string,
  options?: { minLength?: number; maxLength?: number }
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`${paramName} wajib diisi`);
  }
  
  const trimmed = value.trim();
  
  if (options?.minLength !== undefined && trimmed.length < options.minLength) {
    throw new ValidationError(`${paramName} minimal ${options.minLength} karakter`);
  }
  
  if (options?.maxLength !== undefined && trimmed.length > options.maxLength) {
    throw new ValidationError(`${paramName} maksimal ${options.maxLength} karakter`);
  }
  
  return trimmed;
}

/**
 * Validate optional string
 */
export function validateOptionalString(
  value: unknown,
  paramName: string,
  options?: { maxLength?: number }
): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  
  if (typeof value !== 'string') {
    throw new ValidationError(`${paramName} harus berupa teks`);
  }
  
  const trimmed = value.trim();
  
  if (options?.maxLength !== undefined && trimmed.length > options.maxLength) {
    throw new ValidationError(`${paramName} maksimal ${options.maxLength} karakter`);
  }
  
  return trimmed;
}

/**
 * Validate email format
 */
export function validateEmail(value: unknown, paramName: string = 'Email'): string {
  const email = validateRequiredString(value, paramName);
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`${paramName} tidak valid`);
  }
  
  return email.toLowerCase();
}

/**
 * Validate phone number (Indonesian format)
 */
export function validatePhone(
  value: unknown,
  paramName: string = 'Nomor telepon'
): string {
  const phone = validateRequiredString(value, paramName);
  
  // Remove common formatting
  const normalized = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for valid Indonesian phone format
  if (!/^(\+?62|0)8\d{8,11}$/.test(normalized)) {
    throw new ValidationError(`${paramName} tidak valid`);
  }
  
  return normalized;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page: unknown,
  limit: unknown,
  options?: { maxLimit?: number }
): { page: number; limit: number; offset: number } {
  const maxLimit = options?.maxLimit || 100;
  
  const validPage = page ? validatePositiveInteger(page, 'Page') : 1;
  let validLimit = limit ? validatePositiveInteger(limit, 'Limit') : 20;
  
  // Cap limit to maxLimit
  if (validLimit > maxLimit) {
    validLimit = maxLimit;
  }
  
  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit,
  };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  enumValues: readonly T[],
  paramName: string
): T {
  if (typeof value !== 'string') {
    throw new ValidationError(`${paramName} wajib diisi`);
  }
  
  if (!enumValues.includes(value as T)) {
    throw new ValidationError(
      `${paramName} harus salah satu dari: ${enumValues.join(', ')}`
    );
  }
  
  return value as T;
}

/**
 * Validate latitude
 */
export function validateLatitude(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  
  const lat = Number(value);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new ValidationError('Latitude harus antara -90 dan 90');
  }
  
  return lat;
}

/**
 * Validate longitude
 */
export function validateLongitude(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  
  const lng = Number(value);
  if (isNaN(lng) || lng < -180 || lng > 180) {
    throw new ValidationError('Longitude harus antara -180 dan 180');
  }
  
  return lng;
}

/**
 * Validate counter prefix (uppercase letters only, 1-5 chars)
 */
export function validateCounterPrefix(
  value: unknown,
  paramName: string = 'Prefix'
): string {
  const prefix = validateRequiredString(value, paramName, { minLength: 1, maxLength: 5 });
  
  if (!/^[A-Za-z]+$/.test(prefix)) {
    throw new ValidationError(`${paramName} hanya boleh berisi huruf`);
  }
  
  return prefix.toUpperCase();
}
