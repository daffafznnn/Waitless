/* FILE: src/server/services/AdminService.ts */
/**
 * Admin Service - Optimized
 * 
 * Handles admin-related operations with:
 * - BaseService integration for common functionality
 * - Jakarta timezone for date handling
 * - Proper error classes
 * - Extracted helper methods
 */

import { Transaction } from 'sequelize';
import { BaseService } from './BaseService';
import { CounterRepository } from '../repositories/CounterRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { TicketRepository } from '../repositories/TicketRepository';
import { EventRepository } from '../repositories/EventRepository';
import { SummaryRepository } from '../repositories/SummaryRepository';
import { LocationMemberRepository } from '../repositories/LocationMemberRepository';
import { Counter } from '../models/counter.model';
import { 
  NotFoundError, 
  ConflictError,
  BusinessLogicError,
  ForbiddenError 
} from '../types/errors';
import type { CreateCounterRequest, UpdateCounterRequest } from '../types';

// Re-export types for backwards compatibility
export type { CreateCounterRequest, UpdateCounterRequest };

export class AdminService extends BaseService {
  private counterRepository: CounterRepository;
  private locationRepository: LocationRepository;
  private ticketRepository: TicketRepository;
  private eventRepository: EventRepository;
  private summaryRepository: SummaryRepository;
  private locationMemberRepository: LocationMemberRepository;

  constructor() {
    super('AdminService');
    this.counterRepository = new CounterRepository();
    this.locationRepository = new LocationRepository();
    this.ticketRepository = new TicketRepository();
    this.eventRepository = new EventRepository();
    this.summaryRepository = new SummaryRepository();
    this.locationMemberRepository = new LocationMemberRepository();
  }

  // ============================================
  // Counter Management
  // ============================================

  /**
   * Create a new counter
   */
  async createCounter(adminUserId: number, counterData: CreateCounterRequest): Promise<Counter> {
    const validLocationId = this.validateId(counterData.locationId, 'Location ID');
    
    this.log('Creating new counter', { 
      adminUserId, 
      locationId: validLocationId, 
      counterName: counterData.name 
    });

    return this.withTransaction(async (t) => {
      await this.validateLocationAccess(adminUserId, validLocationId, t);

      // Check unique constraints
      await this.ensureCounterNameUnique(validLocationId, counterData.name, undefined, t);
      await this.ensureCounterPrefixUnique(validLocationId, counterData.prefix, undefined, t);

      const counter = await this.counterRepository.create({
        location_id: validLocationId,
        name: counterData.name,
        description: counterData.description,
        prefix: counterData.prefix.toUpperCase(),
        open_time: counterData.openTime || '08:00',
        close_time: counterData.closeTime || '17:00',
        capacity_per_day: counterData.capacityPerDay || 100,
        is_active: true,
      }, t);

      this.log('Counter created successfully', { 
        counterId: counter.id, 
        counterName: counter.name 
      });
      
      return counter;
    });
  }

  /**
   * Update a counter
   */
  async updateCounter(
    adminUserId: number,
    counterId: number,
    updates: UpdateCounterRequest
  ): Promise<Counter> {
    const validCounterId = this.validateId(counterId, 'Counter ID');
    
    this.log('Updating counter', { 
      adminUserId, 
      counterId: validCounterId, 
      updates: Object.keys(updates) 
    });

    return this.withTransaction(async (t) => {
      const counter = await this.getCounterOrThrow(validCounterId, t);
      await this.validateLocationAccess(adminUserId, counter.location_id, t);

      // Validate unique constraints if updating name or prefix
      if (updates.name && updates.name !== counter.name) {
        await this.ensureCounterNameUnique(counter.location_id, updates.name, validCounterId, t);
      }

      if (updates.prefix && updates.prefix !== counter.prefix) {
        await this.ensureCounterPrefixUnique(counter.location_id, updates.prefix, validCounterId, t);
      }

      // Build update data
      const updateData = this.buildCounterUpdateData(updates);
      await this.counterRepository.update(validCounterId, updateData, t);

      const updatedCounter = await this.counterRepository.findById(validCounterId, t);
      
      this.log('Counter updated successfully', { 
        counterId: validCounterId, 
        counterName: updatedCounter!.name 
      });
      
      return updatedCounter!;
    });
  }

  /**
   * Delete a counter
   */
  async deleteCounter(adminUserId: number, counterId: number): Promise<void> {
    const validCounterId = this.validateId(counterId, 'Counter ID');
    
    this.log('Deleting counter', { adminUserId, counterId: validCounterId });

    return this.withTransaction(async (t) => {
      const counter = await this.getCounterOrThrow(validCounterId, t);
      await this.validateLocationAccess(adminUserId, counter.location_id, t);

      // Check for existing tickets
      const hasTickets = await this.ticketRepository.findByCounterAndDate(
        validCounterId,
        this.getTodayDate(),
        t
      );

      if (hasTickets.length > 0) {
        throw new BusinessLogicError(
          'Tidak dapat menghapus loket dengan tiket yang ada. Nonaktifkan saja.'
        );
      }

      await this.counterRepository.delete(validCounterId, t);
      
      this.log('Counter deleted successfully', { 
        counterId: validCounterId, 
        counterName: counter.name 
      });
    });
  }

  /**
   * Get all counters for a location
   */
  async getLocationCounters(adminUserId: number, locationId: number): Promise<Counter[]> {
    const validLocationId = this.validateId(locationId, 'Location ID');
    
    return this.withTransaction(async (t) => {
      await this.validateLocationAccess(adminUserId, validLocationId, t);
      return this.counterRepository.findByLocationId(validLocationId, t);
    });
  }

  /**
   * Get counters with status for a specific date
   */
  async getCountersWithStatus(
    adminUserId: number, 
    locationId: number, 
    date?: string
  ): Promise<any[]> {
    const validLocationId = this.validateId(locationId, 'Location ID');
    const targetDate = this.getQueryDate(date);

    return this.withTransaction(async (t) => {
      await this.validateLocationAccess(adminUserId, validLocationId, t);
      return this.counterRepository.findAllWithStatus(validLocationId, targetDate, t);
    });
  }

  // ============================================
  // Queue & Activity
  // ============================================

  /**
   * Get queue status for admin's counters
   */
  async getQueueStatus(adminUserId: number, counterId: number, date?: string) {
    const validCounterId = this.validateId(counterId, 'Counter ID');
    const targetDate = this.getQueryDate(date);

    return this.withTransaction(async (t) => {
      const counter = await this.getCounterOrThrow(validCounterId, t);
      await this.validateLocationAccess(adminUserId, counter.location_id, t);
      return this.ticketRepository.getQueueStatus(validCounterId, targetDate, t);
    });
  }

  /**
   * Get activity log for a location
   */
  async getLocationActivity(
    adminUserId: number, 
    locationId: number, 
    date?: string,
    page: number = 1,
    limit: number = 50
  ) {
    const validLocationId = this.validateId(locationId, 'Location ID');
    const targetDate = this.getQueryDate(date);
    const { offset, limit: validLimit } = this.parsePagination(page, limit);

    return this.withTransaction(async (t) => {
      await this.validateLocationAccess(adminUserId, validLocationId, t);
      return this.eventRepository.getLocationActivityLog(
        validLocationId,
        targetDate,
        offset,
        validLimit,
        t
      );
    });
  }

  /**
   * Get counter activity log
   */
  async getCounterActivity(
    adminUserId: number,
    counterId: number,
    date?: string,
    page: number = 1,
    limit: number = 50
  ) {
    const validCounterId = this.validateId(counterId, 'Counter ID');
    const targetDate = this.getQueryDate(date);
    const { offset, limit: validLimit } = this.parsePagination(page, limit);

    return this.withTransaction(async (t) => {
      const counter = await this.getCounterOrThrow(validCounterId, t);
      await this.validateLocationAccess(adminUserId, counter.location_id, t);
      return this.eventRepository.getCounterActivityLog(
        validCounterId,
        targetDate,
        offset,
        validLimit,
        t
      );
    });
  }

  // ============================================
  // Dashboard & Stats
  // ============================================

  /**
   * Get daily summary for admin's location
   */
  async getDailySummary(adminUserId: number, locationId: number, date?: string) {
    const validLocationId = this.validateId(locationId, 'Location ID');
    const targetDate = this.getQueryDate(date);

    return this.withTransaction(async (t) => {
      await this.validateLocationAccess(adminUserId, validLocationId, t);
      return this.summaryRepository.findByLocationAndDate(validLocationId, targetDate, t);
    });
  }

  /**
   * Get dashboard stats for admin
   */
  async getDashboardStats(adminUserId: number, locationId: number, date?: string) {
    const validLocationId = this.validateId(locationId, 'Location ID');
    const targetDate = this.getQueryDate(date);

    return this.withTransaction(async (t) => {
      await this.validateLocationAccess(adminUserId, validLocationId, t);
      return this.summaryRepository.getDashboardStats(validLocationId, targetDate, t);
    });
  }

  /**
   * Get general dashboard stats for admin (aggregated from all accessible locations)
   */
  async getGeneralDashboardStats(adminUserId: number, date?: string) {
    const targetDate = this.getQueryDate(date);

    return this.withTransaction(async (t) => {
      const locations = await this.getUserAccessibleLocations(adminUserId, t);
      
      if (locations.length === 0) {
        return this.getDefaultDashboardStats();
      }

      const allStats = await Promise.all(
        locations.map(loc => 
          this.summaryRepository.getDashboardStats(loc.id, targetDate, t)
        )
      );

      return this.aggregateLocationStats(allStats);
    });
  }

  /**
   * Get active queues from all accessible locations
   */
  async getActiveQueues(adminUserId: number) {
    const targetDate = this.getTodayDate();

    return this.withTransaction(async (t) => {
      const locations = await this.getUserAccessibleLocations(adminUserId, t);
      
      if (locations.length === 0) {
        return [];
      }

      const allQueues = await Promise.all(
        locations.map(loc => 
          this.counterRepository.findAllWithStatus(loc.id, targetDate, t)
        )
      );

      return allQueues.flat().filter(counter => counter?.is_active);
    });
  }

  /**
   * Get all counters accessible to admin (across all locations)
   */
  async getAllAccessibleCounters(adminUserId: number) {
    return this.withTransaction(async (t) => {
      const locations = await this.getUserAccessibleLocations(adminUserId, t);
      
      if (locations.length === 0) {
        return [];
      }

      const allCounters = await Promise.all(
        locations.map(loc => this.counterRepository.findByLocationId(loc.id, t))
      );

      return allCounters.flat().filter(Boolean);
    });
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Get counter or throw NotFoundError
   */
  private async getCounterOrThrow(counterId: number, t?: Transaction): Promise<Counter> {
    const counter = await this.counterRepository.findById(counterId, t);
    if (!counter) {
      throw new NotFoundError('Loket');
    }
    return counter;
  }

  /**
   * Ensure counter name is unique in location
   */
  private async ensureCounterNameUnique(
    locationId: number,
    name: string,
    excludeCounterId?: number,
    t?: Transaction
  ): Promise<void> {
    const exists = await this.counterRepository.existsByNameInLocation(
      locationId, name, excludeCounterId, t
    );
    if (exists) {
      throw new ConflictError('Nama loket sudah ada di cabang ini');
    }
  }

  /**
   * Ensure counter prefix is unique in location
   */
  private async ensureCounterPrefixUnique(
    locationId: number,
    prefix: string,
    excludeCounterId?: number,
    t?: Transaction
  ): Promise<void> {
    const exists = await this.counterRepository.existsByPrefixInLocation(
      locationId, prefix, excludeCounterId, t
    );
    if (exists) {
      throw new ConflictError('Prefix loket sudah ada di cabang ini');
    }
  }

  /**
   * Build update data object from update request
   */
  private buildCounterUpdateData(updates: UpdateCounterRequest): Record<string, any> {
    const data: Record<string, any> = {};
    
    if (updates.name) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.prefix) data.prefix = updates.prefix.toUpperCase();
    if (updates.openTime) data.open_time = updates.openTime;
    if (updates.closeTime) data.close_time = updates.closeTime;
    if (updates.capacityPerDay) data.capacity_per_day = updates.capacityPerDay;
    if (updates.isActive !== undefined) data.is_active = updates.isActive;
    
    return data;
  }

  /**
   * Aggregate stats from multiple locations
   */
  private aggregateLocationStats(locationStats: any[]): any {
    const aggregated = {
      totalQueues: 0,
      activeUsers: 0,
      avgWaitTime: 0,
      totalLocations: locationStats.length,
      queuesTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      usersTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      waitTimeTrend: { value: 0, type: 'decrease' as const, period: 'today' },
      locationsTrend: { value: 0, type: 'neutral' as const, period: 'today' }
    };

    let totalWaitTime = 0;
    let locationsWithWaitTime = 0;
    let totalIssuedToday = 0;
    let totalDoneToday = 0;
    let totalIssuedYesterday = 0;
    let totalDoneYesterday = 0;

    for (const stats of locationStats) {
      if (!stats?.today) continue;
      
      totalIssuedToday += stats.today.total_issued || 0;
      totalDoneToday += stats.today.total_done || 0;
      
      if (stats.today.avg_service_seconds > 0) {
        totalWaitTime += Math.round(stats.today.avg_service_seconds / 60);
        locationsWithWaitTime++;
      }
      
      if (stats.yesterday) {
        totalIssuedYesterday += stats.yesterday.total_issued || 0;
        totalDoneYesterday += stats.yesterday.total_done || 0;
      }
    }

    aggregated.totalQueues = totalIssuedToday;
    aggregated.activeUsers = totalDoneToday;

    if (locationsWithWaitTime > 0) {
      aggregated.avgWaitTime = Math.round(totalWaitTime / locationsWithWaitTime);
    }

    // Calculate trends
    if (totalIssuedYesterday > 0) {
      const change = ((totalIssuedToday - totalIssuedYesterday) / totalIssuedYesterday) * 100;
      aggregated.queuesTrend = {
        value: Math.abs(Math.round(change)),
        type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
        period: 'vs yesterday'
      } as any;
    }

    if (totalDoneYesterday > 0) {
      const change = ((totalDoneToday - totalDoneYesterday) / totalDoneYesterday) * 100;
      aggregated.usersTrend = {
        value: Math.abs(Math.round(change)),
        type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
        period: 'vs yesterday'
      } as any;
    }

    return aggregated;
  }

  /**
   * Get default dashboard stats when no locations are available
   */
  private getDefaultDashboardStats(): any {
    return {
      totalQueues: 0,
      activeUsers: 0,
      avgWaitTime: 0,
      totalLocations: 0,
      queuesTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      usersTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      waitTimeTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      locationsTrend: { value: 0, type: 'neutral' as const, period: 'today' }
    };
  }

  /**
   * Get locations accessible to admin user (only active memberships)
   */
  private async getUserAccessibleLocations(adminUserId: number, t?: Transaction) {
    try {
      const memberLocations = await this.locationMemberRepository.findByUserId(adminUserId, t);
      
      if (!memberLocations?.length) {
        return [];
      }

      // Only return locations where membership is active
      return memberLocations
        .filter((member: any) => member.is_active === true)
        .map((member: any) => member.location)
        .filter((loc): loc is { id: number; name: string } => loc && typeof loc.id === 'number');
    } catch {
      return [];
    }
  }

  /**
   * Get the single location this admin is assigned to
   * (ADMIN can only be assigned to ONE location)
   */
  async getAdminAssignedLocation(adminUserId: number): Promise<{ id: number; name: string } | null> {
    const locations = await this.getUserAccessibleLocations(adminUserId);
    return locations.length > 0 ? locations[0] : null;
  }

  /**
   * Validate admin has access to location
   * - Checks if user is a member of the location
   * - Verifies membership is_active = true
   * - Throws ForbiddenError if not authorized
   */
  private async validateLocationAccess(
    adminUserId: number, 
    locationId: number, 
    t?: Transaction
  ): Promise<void> {
    // First check if location exists
    const location = await this.locationRepository.findByIdSimple(locationId, t);
    if (!location) {
      throw new NotFoundError('Cabang');
    }

    // Check if admin is the owner (owners have full access)
    if (location.owner_id === adminUserId) {
      return; // Owner has access to all their locations
    }

    // Check if admin is an active member of this location
    const membership = await this.locationMemberRepository.findByLocationAndUser(
      locationId,
      adminUserId,
      t
    );

    if (!membership) {
      throw new ForbiddenError('Anda tidak memiliki akses ke cabang ini');
    }

    if (!membership.is_active) {
      throw new ForbiddenError('Akses Anda ke cabang ini telah dinonaktifkan');
    }
  }
}