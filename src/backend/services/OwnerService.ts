/* FILE: src/server/services/OwnerService.ts */
/**
 * Owner Service - Optimized
 * 
 * Handles owner-related operations with:
 * - BaseService integration for common functionality
 * - Jakarta timezone for date handling
 * - Proper error classes
 * - Extracted helper methods
 */

import { Transaction, Op } from 'sequelize';
import { BaseService } from './BaseService';
import { UserRepository } from '../repositories/UserRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { SummaryRepository } from '../repositories/SummaryRepository';
import { LocationMemberRepository } from '../repositories/LocationMemberRepository';
import { ServiceLocation } from '../models/service_location.model';
import { Counter } from '../models/counter.model';
import { User, Role } from '../models/user.model';
import { Ticket } from '../models/ticket.model';
import { TicketEvent } from '../models/ticket_event.model';
import bcrypt from 'bcrypt';
import { 
  NotFoundError, 
  ConflictError,
  ForbiddenError,
  BusinessLogicError
} from '../types/errors';
import type { 
  CreateLocationRequest, 
  UpdateLocationRequest, 
  CreateCounterRequest, 
  UpdateCounterRequest,
  InviteStaffRequest,
  UpdateStaffRequest 
} from '../types';

// Re-export types for backwards compatibility
export type { 
  CreateLocationRequest, 
  UpdateLocationRequest,
  CreateCounterRequest,
  UpdateCounterRequest,
  InviteStaffRequest,
  UpdateStaffRequest
};

export class OwnerService extends BaseService {
  private userRepository: UserRepository;
  private locationRepository: LocationRepository;
  private summaryRepository: SummaryRepository;
  private memberRepository: LocationMemberRepository;

  constructor() {
    super('OwnerService');
    this.userRepository = new UserRepository();
    this.locationRepository = new LocationRepository();
    this.summaryRepository = new SummaryRepository();
    this.memberRepository = new LocationMemberRepository();
  }

  // ============================================
  // Location Management
  // ============================================

  /**
   * Create a new service location
   */
  async createLocation(ownerId: number, locationData: CreateLocationRequest): Promise<ServiceLocation> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');

    return this.withTransaction(async (t) => {
      await this.ensureIsOwner(validOwnerId, t);
      await this.ensureLocationNameUnique(validOwnerId, locationData.name, t);

      return this.locationRepository.create({
        owner_id: validOwnerId,
        name: locationData.name,
        address: locationData.address,
        city: locationData.city,
        lat: locationData.lat,
        lng: locationData.lng,
        is_active: true,
      }, t);
    });
  }

  /**
   * Update a location
   */
  async updateLocation(
    ownerId: number,
    locationId: number,
    updates: UpdateLocationRequest
  ): Promise<ServiceLocation> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validLocationId = this.validateId(locationId, 'Location ID');

    return this.withTransaction(async (t) => {
      const location = await this.getLocationOrThrow(validLocationId, t);
      this.ensureOwnership(location, validOwnerId);

      if (updates.name && updates.name !== location.name) {
        await this.ensureLocationNameUnique(validOwnerId, updates.name, t);
      }

      const updateData = this.buildLocationUpdateData(updates);
      await this.locationRepository.update(validLocationId, updateData, t);

      return (await this.locationRepository.findById(validLocationId, t))!;
    });
  }

  /**
   * Delete a location
   */
  async deleteLocation(ownerId: number, locationId: number): Promise<void> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validLocationId = this.validateId(locationId, 'Location ID');

    return this.withTransaction(async (t) => {
      const location = await this.getLocationOrThrow(validLocationId, t);
      this.ensureOwnership(location, validOwnerId);
      await this.locationRepository.delete(validLocationId, t);
    });
  }

  /**
   * Get all locations for an owner
   */
  async getMyLocations(ownerId: number): Promise<ServiceLocation[]> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    return this.locationRepository.findByOwnerId(validOwnerId);
  }

  /**
   * Get location details by ID
   */
  async getLocationById(ownerId: number, locationId: number): Promise<ServiceLocation> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validLocationId = this.validateId(locationId, 'Location ID');

    const location = await this.locationRepository.findById(validLocationId);
    if (!location) throw new NotFoundError('Cabang');
    this.ensureOwnership(location, validOwnerId);

    return location;
  }

  // ============================================
  // Analytics & Dashboard
  // ============================================

  /**
   * Get location performance analytics
   */
  async getLocationAnalytics(
    ownerId: number,
    locationId: number,
    startDate: string,
    endDate: string
  ) {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validLocationId = this.validateId(locationId, 'Location ID');

    return this.withTransaction(async (t) => {
      const location = await this.getLocationOrThrow(validLocationId, t);
      this.ensureOwnership(location, validOwnerId);

      const [stats, dailySummaries] = await Promise.all([
        this.summaryRepository.getAggregatedStats(validLocationId, startDate, endDate, t),
        this.summaryRepository.findByLocationAndDateRange(validLocationId, startDate, endDate, t),
      ]);

      return {
        locationId: validLocationId,
        locationName: location.name,
        period: { startDate, endDate },
        aggregated: stats,
        daily: dailySummaries,
      };
    });
  }

  /**
   * Get multi-location dashboard for owner - Fetches real-time data from tickets
   */
  async getOwnerDashboard(ownerId: number, date?: string) {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const targetDate = this.getQueryDate(date);
    
    const locations = await this.locationRepository.findByOwnerId(validOwnerId);
    
    // Use imported Ticket model
    
    const locationStats = await Promise.all(
      locations.map(async (location) => {
        // Fetch tickets directly for real-time data
        const tickets = await Ticket.findAll({
          where: {
            location_id: location.id,
            date_for: targetDate
          },
          attributes: ['id', 'status', 'started_at', 'finished_at', 'created_at']
        });
        
        // Calculate stats from tickets
        const totalIssued = tickets.length;
        const totalDone = tickets.filter((t: any) => t.status === 'DONE').length;
        const totalHold = tickets.filter((t: any) => t.status === 'HOLD').length;
        const totalCancel = tickets.filter((t: any) => t.status === 'CANCELLED').length;
        
        // Calculate average service time for completed tickets
        let avgServiceSeconds = 0;
        const doneTickets = tickets.filter((t: any) => t.status === 'DONE' && t.started_at && t.finished_at);
        if (doneTickets.length > 0) {
          const totalServiceTime = doneTickets.reduce((acc: number, t: any) => {
            const start = new Date(t.started_at).getTime();
            const end = new Date(t.finished_at).getTime();
            return acc + (end - start) / 1000;
          }, 0);
          avgServiceSeconds = Math.round(totalServiceTime / doneTickets.length);
        }
        
        return {
          location: {
            id: location.id,
            name: location.name,
            city: location.city,
            isActive: location.is_active,
          },
          summary: {
            total_issued: totalIssued,
            total_done: totalDone,
            total_hold: totalHold,
            total_cancel: totalCancel,
            avg_service_seconds: avgServiceSeconds,
          },
        };
      })
    );

    const totals = this.calculateDashboardTotals(locationStats);
    const completionRate = totals.totalIssued > 0 ? (totals.totalDone / totals.totalIssued) * 100 : 0;

    return {
      date: targetDate,
      locationsCount: locations.length,
      activeLocationsCount: locations.filter(l => l.is_active).length,
      totals: { ...totals, completionRate: Math.round(completionRate * 100) / 100 },
      locations: locationStats,
    };
  }

  /**
   * Get top performing locations
   */
  async getTopPerformingLocations(ownerId: number, date?: string, limit: number = 5) {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const targetDate = this.getQueryDate(date);
    
    const locations = await this.locationRepository.findByOwnerId(validOwnerId);
    const locationIds = new Set(locations.map(l => l.id));
    
    const allPerformance = await this.summaryRepository.getTopPerformingLocations(targetDate, 50);
    
    return allPerformance
      .filter(perf => locationIds.has(perf.location_id))
      .slice(0, limit);
  }

  /**
   * Generate location reports
   */
  async generateLocationReport(
    ownerId: number,
    locationId: number,
    startDate: string,
    endDate: string
  ) {
    const analytics = await this.getLocationAnalytics(ownerId, locationId, startDate, endDate);
    
    return {
      ...analytics,
      generatedAt: new Date(),
      generatedBy: ownerId,
      reportType: 'location_performance',
    };
  }

  /**
   * Get all tickets for owner's locations in date range (for reports)
   */
  async getOwnerTickets(
    ownerId: number,
    startDate: string,
    endDate: string,
    locationId?: number,
    status?: string
  ) {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    
    // Get owner's locations
    const locations = await this.locationRepository.findByOwnerId(validOwnerId);
    if (locations.length === 0) {
      return { tickets: [], counters: [], locations: [] };
    }
    
    // Filter by specific location if provided
    let targetLocations = locations;
    if (locationId) {
      const validLocationId = this.validateId(locationId, 'Location ID');
      targetLocations = locations.filter(l => l.id === validLocationId);
      if (targetLocations.length === 0) {
        throw new ForbiddenError('Location not found or not owned by you');
      }
    }
    
    // Use imported models
    
    // Build where clause
    const whereClause: any = {
      location_id: targetLocations.map(l => l.id),
      date_for: {
        [Op.between]: [startDate, endDate]
      }
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    // Fetch tickets with relations
    const tickets = await Ticket.findAll({
      where: whereClause,
      include: [
        {
          model: Counter,
          as: 'counter',
          attributes: ['id', 'name', 'prefix', 'location_id'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: TicketEvent,
          as: 'events',
          attributes: ['id', 'event_type', 'actor_id', 'note', 'created_at'],
          include: [{
            model: User,
            as: 'actor',
            attributes: ['id', 'name'],
          }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 1000, // Safety limit
    });
    
    // Get all counters for owner's locations
    const counters: Counter[] = [];
    for (const location of targetLocations) {
      const locationCounters = await this.locationRepository.getCountersByLocationId(location.id);
      counters.push(...locationCounters);
    }
    
    return {
      tickets,
      counters,
      locations: targetLocations.map(l => ({ id: l.id, name: l.name, city: l.city })),
    };
  }

  /**
   * Search locations by criteria
   */
  async searchLocations(
    query: string,
    _city?: string,
    _isActive?: boolean,
    page: number = 1,
    limit: number = 20
  ) {
    const { offset, limit: validLimit } = this.parsePagination(page, limit);
    return this.locationRepository.search(query, offset, validLimit);
  }

  /**
   * Find locations near coordinates
   */
  async findNearbyLocations(lat: number, lng: number, radiusKm: number = 10): Promise<ServiceLocation[]> {
    return this.locationRepository.findNearby(lat, lng, radiusKm);
  }

  // ============================================
  // Counter Management
  // ============================================

  /**
   * Get all counters for a location (owner-only)
   */
  async getLocationCounters(ownerId: number, locationId: number): Promise<Counter[]> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validLocationId = this.validateId(locationId, 'Location ID');

    const location = await this.getLocationOrThrow(validLocationId);
    this.ensureOwnership(location, validOwnerId);
    
    return this.locationRepository.getCountersByLocationId(validLocationId);
  }

  /**
   * Create a new counter in a location (owner-only)
   */
  async createCounter(
    ownerId: number,
    locationId: number,
    counterData: CreateCounterRequest
  ): Promise<Counter> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validLocationId = this.validateId(locationId, 'Location ID');

    return this.withTransaction(async (t) => {
      const location = await this.getLocationOrThrow(validLocationId, t);
      this.ensureOwnership(location, validOwnerId);

      return Counter.create({
        location_id: validLocationId,
        name: counterData.name,
        description: counterData.description,
        prefix: counterData.prefix?.toUpperCase() || 'A',
        open_time: counterData.openTime || '08:00:00',
        close_time: counterData.closeTime || '17:00:00',
        capacity_per_day: counterData.capacityPerDay || 100,
        is_active: true,
      }, { transaction: t });
    });
  }

  /**
   * Update a counter (owner-only)
   */
  async updateCounter(
    ownerId: number,
    counterId: number,
    updates: UpdateCounterRequest
  ): Promise<Counter> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validCounterId = this.validateId(counterId, 'Counter ID');

    return this.withTransaction(async (t) => {
      const counter = await Counter.findByPk(validCounterId, { transaction: t });
      if (!counter) throw new NotFoundError('Loket');
      
      const location = await this.getLocationOrThrow(counter.location_id, t);
      this.ensureOwnership(location, validOwnerId);

      const updateData = this.buildCounterUpdateData(updates);
      await counter.update(updateData, { transaction: t });
      
      return counter;
    });
  }

  /**
   * Delete a counter (owner-only)
   */
  async deleteCounter(ownerId: number, counterId: number): Promise<void> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validCounterId = this.validateId(counterId, 'Counter ID');

    return this.withTransaction(async (t) => {
      const counter = await Counter.findByPk(validCounterId, { transaction: t });
      if (!counter) throw new NotFoundError('Loket');
      
      const location = await this.getLocationOrThrow(counter.location_id, t);
      this.ensureOwnership(location, validOwnerId);

      await counter.destroy({ transaction: t });
    });
  }

  // ============================================
  // Staff Management
  // ============================================

  /**
   * Get all staff across owner's locations
   */
  async getAllStaffForOwner(ownerId: number): Promise<any[]> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const locations = await this.locationRepository.findByOwnerId(validOwnerId);
    
    if (locations.length === 0) return [];

    const staffMap = new Map<number, any>();
    
    for (const location of locations) {
      const members = await this.memberRepository.findByLocationId(location.id);
      
      for (const member of members) {
        const user = (member as any).user;
        if (!user) continue;
        
        if (staffMap.has(user.id)) {
          staffMap.get(user.id).locations.push({ id: location.id, name: location.name });
        } else {
          staffMap.set(user.id, {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: member.role,
            is_active: member.is_active,
            created_at: member.created_at,
            locations: [{ id: location.id, name: location.name }]
          });
        }
      }
    }
    
    return Array.from(staffMap.values());
  }

  /**
   * Invite/create a new staff member
   */
  async inviteStaff(ownerId: number, data: InviteStaffRequest): Promise<any> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validLocationId = this.validateId(data.locationId, 'Location ID');

    return this.withTransaction(async (t) => {
      const location = await this.getLocationOrThrow(validLocationId, t);
      this.ensureOwnership(location, validOwnerId);

      let user = await this.userRepository.findByEmail(data.email, t);
      
      if (!user) {
        const passwordHash = await bcrypt.hash(data.password || 'waitless123', 10);
        user = await this.userRepository.create({
          email: data.email,
          name: data.name,
          password_hash: passwordHash,
          role: Role.ADMIN,
        }, t);
      }

      const existingMember = await this.memberRepository.findByLocationAndUser(
        validLocationId, user.id, t
      );
      
      if (existingMember) {
        throw new ConflictError('User sudah menjadi member cabang ini');
      }

      const member = await this.memberRepository.create({
        location_id: validLocationId,
        user_id: user.id,
        role: data.role === 'ADMIN' ? Role.ADMIN : Role.VISITOR,
        is_active: true,
      }, t);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: member.role,
        is_active: member.is_active,
        created_at: member.created_at,
        locations: [{ id: location.id, name: location.name }]
      };
    });
  }

  /**
   * Update staff member details
   */
  async updateStaff(ownerId: number, staffId: number, data: UpdateStaffRequest): Promise<any> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validStaffId = this.validateId(staffId, 'Staff ID');

    return this.withTransaction(async (t) => {
      const user = await this.userRepository.findById(validStaffId, t);
      if (!user) throw new NotFoundError('Staf');

      const { ownerLocationIds, relevantMemberships } = await this.getOwnerStaffMemberships(
        validOwnerId, validStaffId, t
      );
      
      if (relevantMemberships.length === 0) throw new ForbiddenError();

      // Update user name if provided
      if (data.name) {
        await this.userRepository.update(validStaffId, { name: data.name }, t);
      }

      // Update location if provided
      if (data.locationId) {
        if (!ownerLocationIds.includes(data.locationId)) {
          throw new BusinessLogicError('Lokasi tidak valid: Hanya dapat assign staf ke cabang milik Anda');
        }
        const currentMembership = relevantMemberships[0];
        if (currentMembership.location_id !== data.locationId) {
          await this.memberRepository.update(currentMembership.id, { location_id: data.locationId }, t);
        }
      }

      // Update role if provided
      if (data.role) {
        const newRole = data.role === 'ADMIN' ? Role.ADMIN : Role.VISITOR;
        for (const m of relevantMemberships) {
          await this.memberRepository.update(m.id, { role: newRole }, t);
        }
      }

      // Update is_active if provided
      if (data.is_active !== undefined) {
        for (const m of relevantMemberships) {
          await this.memberRepository.update(m.id, { is_active: data.is_active }, t);
        }
      }

      const updatedStaff = await this.getAllStaffForOwner(validOwnerId);
      return updatedStaff.find(s => s.id === validStaffId);
    });
  }

  /**
   * Toggle staff active status
   */
  async toggleStaffStatus(ownerId: number, staffId: number): Promise<any> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validStaffId = this.validateId(staffId, 'Staff ID');

    return this.withTransaction(async (t) => {
      const { relevantMemberships } = await this.getOwnerStaffMemberships(validOwnerId, validStaffId, t);
      
      if (relevantMemberships.length === 0) throw new ForbiddenError();

      const newStatus = !relevantMemberships[0].is_active;
      
      for (const m of relevantMemberships) {
        await this.memberRepository.update(m.id, { is_active: newStatus }, t);
      }

      const updatedStaff = await this.getAllStaffForOwner(validOwnerId);
      return updatedStaff.find(s => s.id === validStaffId) || { id: validStaffId, is_active: newStatus };
    });
  }

  /**
   * Remove staff from owner's locations
   */
  async removeStaff(ownerId: number, staffId: number): Promise<void> {
    const validOwnerId = this.validateId(ownerId, 'Owner ID');
    const validStaffId = this.validateId(staffId, 'Staff ID');

    return this.withTransaction(async (t) => {
      const { relevantMemberships } = await this.getOwnerStaffMemberships(validOwnerId, validStaffId, t);
      
      if (relevantMemberships.length === 0) throw new ForbiddenError();

      for (const m of relevantMemberships) {
        await this.memberRepository.delete(m.id, t);
      }
    });
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async getLocationOrThrow(locationId: number, t?: Transaction): Promise<ServiceLocation> {
    const location = await this.locationRepository.findByIdSimple(locationId, t);
    if (!location) throw new NotFoundError('Cabang');
    return location;
  }

  private ensureOwnership(location: ServiceLocation, ownerId: number): void {
    if (location.owner_id !== ownerId) {
      throw new ForbiddenError('Anda hanya dapat mengelola cabang milik Anda');
    }
  }

  private async ensureIsOwner(userId: number, t?: Transaction): Promise<void> {
    const owner = await this.userRepository.findById(userId, t);
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenError('Hanya owner yang dapat melakukan tindakan ini');
    }
  }

  private async ensureLocationNameUnique(
    ownerId: number,
    name: string,
    t?: Transaction
  ): Promise<void> {
    const exists = await this.locationRepository.existsForOwner(ownerId, name, t);
    if (exists) {
      throw new ConflictError('Nama cabang sudah ada untuk owner ini');
    }
  }

  private buildLocationUpdateData(updates: UpdateLocationRequest): Record<string, any> {
    const data: Record<string, any> = {};
    if (updates.name) data.name = updates.name;
    if (updates.address !== undefined) data.address = updates.address;
    if (updates.city !== undefined) data.city = updates.city;
    if (updates.lat !== undefined) data.lat = updates.lat;
    if (updates.lng !== undefined) data.lng = updates.lng;
    if (updates.isActive !== undefined) data.is_active = updates.isActive;
    return data;
  }

  private buildCounterUpdateData(updates: UpdateCounterRequest): Record<string, any> {
    const data: Record<string, any> = {};
    if (updates.name) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.prefix) data.prefix = updates.prefix.toUpperCase();
    if (updates.openTime) data.open_time = updates.openTime;
    if (updates.closeTime) data.close_time = updates.closeTime;
    if (updates.capacityPerDay !== undefined) data.capacity_per_day = updates.capacityPerDay;
    if (updates.isActive !== undefined) data.is_active = updates.isActive;
    return data;
  }

  private async getOwnerStaffMemberships(ownerId: number, staffId: number, t?: Transaction) {
    const ownerLocations = await this.locationRepository.findByOwnerId(ownerId, t);
    const ownerLocationIds = ownerLocations.map(l => l.id);
    
    const memberships = await this.memberRepository.findByUserId(staffId, t);
    const relevantMemberships = memberships.filter((m: any) => ownerLocationIds.includes(m.location_id));
    
    return { ownerLocationIds, relevantMemberships };
  }



  private calculateDashboardTotals(locationStats: any[]) {
    return locationStats.reduce(
      (acc, stat) => ({
        totalIssued: acc.totalIssued + stat.summary.total_issued,
        totalDone: acc.totalDone + stat.summary.total_done,
        totalHold: acc.totalHold + stat.summary.total_hold,
        totalCancel: acc.totalCancel + stat.summary.total_cancel,
        avgServiceSeconds: acc.avgServiceSeconds + stat.summary.avg_service_seconds,
      }),
      { totalIssued: 0, totalDone: 0, totalHold: 0, totalCancel: 0, avgServiceSeconds: 0 }
    );
  }
}