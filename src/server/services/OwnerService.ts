/* FILE: src/server/services/OwnerService.ts */
import { UserRepository } from '../repositories/UserRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { SummaryRepository } from '../repositories/SummaryRepository';
import { LocationMemberRepository } from '../repositories/LocationMemberRepository';
import { sequelize } from '../db';
import { ServiceLocation } from '../models/service_location.model';
import { Counter } from '../models/counter.model';
import { User, Role } from '../models/user.model';
import bcrypt from 'bcrypt';

export interface CreateLocationRequest {
  name: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateLocationRequest {
  name?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
}

export interface AddLocationMemberRequest {
  userId?: number;
  email?: string;
  role: Role;
}

export interface CreateCounterRequest {
  name: string;
  description?: string;
  prefix: string;
  openTime?: string;
  closeTime?: string;
  capacityPerDay?: number;
}

export interface UpdateCounterRequest {
  name?: string;
  description?: string;
  prefix?: string;
  openTime?: string;
  closeTime?: string;
  capacityPerDay?: number;
  isActive?: boolean;
}

export interface InviteStaffRequest {
  email: string;
  name: string;
  locationId: number;
  role: string;
  password?: string;
}

export interface UpdateStaffRequest {
  name?: string;
  role?: string;
  locationId?: number;
  is_active?: boolean;
}

export class OwnerService {
  private userRepository: UserRepository;
  private locationRepository: LocationRepository;
  private summaryRepository: SummaryRepository;
  private memberRepository: LocationMemberRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.locationRepository = new LocationRepository();
    this.summaryRepository = new SummaryRepository();
    this.memberRepository = new LocationMemberRepository();
  }

  /**
   * Create a new service location
   */
  async createLocation(ownerId: number, locationData: CreateLocationRequest): Promise<ServiceLocation> {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify user is owner
      const owner = await this.userRepository.findById(ownerId, transaction);
      if (!owner || owner.role !== Role.OWNER) {
        throw new Error('Only owners can create locations');
      }

      // Check if location name already exists for this owner
      const nameExists = await this.locationRepository.existsForOwner(
        ownerId,
        locationData.name,
        transaction
      );

      if (nameExists) {
        throw new Error('Location name already exists for this owner');
      }

      // Create location
      const location = await this.locationRepository.create({
        owner_id: ownerId,
        name: locationData.name,
        address: locationData.address,
        city: locationData.city,
        lat: locationData.lat,
        lng: locationData.lng,
        is_active: true,
      }, transaction);

      await transaction.commit();
      return location;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a location
   */
  async updateLocation(
    ownerId: number,
    locationId: number,
    updates: UpdateLocationRequest
  ): Promise<ServiceLocation> {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify ownership
      const location = await this.locationRepository.findByIdSimple(locationId, transaction);
      if (!location) {
        throw new Error('Location not found');
      }

      if (location.owner_id !== ownerId) {
        throw new Error('You can only update your own locations');
      }

      // Check name uniqueness if updating name
      if (updates.name && updates.name !== location.name) {
        const nameExists = await this.locationRepository.existsForOwner(
          ownerId,
          updates.name,
          transaction
        );
        if (nameExists) {
          throw new Error('Location name already exists for this owner');
        }
      }

      // Update location
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.lat !== undefined) updateData.lat = updates.lat;
      if (updates.lng !== undefined) updateData.lng = updates.lng;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      await this.locationRepository.update(locationId, updateData, transaction);

      // Get updated location
      const updatedLocation = await this.locationRepository.findById(locationId, transaction);
      
      await transaction.commit();
      return updatedLocation!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete a location
   */
  async deleteLocation(ownerId: number, locationId: number): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify ownership
      const location = await this.locationRepository.findByIdSimple(locationId, transaction);
      if (!location) {
        throw new Error('Location not found');
      }

      if (location.owner_id !== ownerId) {
        throw new Error('You can only delete your own locations');
      }

      // Delete location
      await this.locationRepository.delete(locationId, transaction);
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all locations for an owner
   */
  async getMyLocations(ownerId: number): Promise<ServiceLocation[]> {
    return this.locationRepository.findByOwnerId(ownerId);
  }

  /**
   * Get location details by ID
   */
  async getLocationById(ownerId: number, locationId: number): Promise<ServiceLocation> {
    const location = await this.locationRepository.findById(locationId);
    
    if (!location) {
      throw new Error('Location not found');
    }

    if (location.owner_id !== ownerId) {
      throw new Error('Access denied');
    }

    return location;
  }

  /**
   * Get location performance analytics
   */
  async getLocationAnalytics(
    ownerId: number,
    locationId: number,
    startDate: string,
    endDate: string
  ) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify ownership
      const location = await this.locationRepository.findByIdSimple(locationId, transaction);
      if (!location || location.owner_id !== ownerId) {
        throw new Error('Location not found or access denied');
      }

      // Get aggregated statistics
      const stats = await this.summaryRepository.getAggregatedStats(
        locationId,
        startDate,
        endDate,
        transaction
      );

      // Get daily summaries for the period
      const dailySummaries = await this.summaryRepository.findByLocationAndDateRange(
        locationId,
        startDate,
        endDate,
        transaction
      );

      await transaction.commit();

      return {
        locationId,
        locationName: location.name,
        period: { startDate, endDate },
        aggregated: stats,
        daily: dailySummaries,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get multi-location dashboard for owner
   */
  async getOwnerDashboard(ownerId: number, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get all owner's locations
    const locations = await this.locationRepository.findByOwnerId(ownerId);
    
    // Get today's summaries for all locations
    const locationStats = await Promise.all(
      locations.map(async (location) => {
        const summary = await this.summaryRepository.findByLocationAndDate(
          location.id,
          targetDate
        );
        
        return {
          location: {
            id: location.id,
            name: location.name,
            city: location.city,
            isActive: location.is_active,
          },
          summary: summary || {
            total_issued: 0,
            total_done: 0,
            total_hold: 0,
            total_cancel: 0,
            avg_service_seconds: 0,
          },
        };
      })
    );

    // Calculate totals
    const totals = locationStats.reduce(
      (acc, stat) => ({
        totalIssued: acc.totalIssued + stat.summary.total_issued,
        totalDone: acc.totalDone + stat.summary.total_done,
        totalHold: acc.totalHold + stat.summary.total_hold,
        totalCancel: acc.totalCancel + stat.summary.total_cancel,
        avgServiceSeconds: acc.avgServiceSeconds + stat.summary.avg_service_seconds,
      }),
      { totalIssued: 0, totalDone: 0, totalHold: 0, totalCancel: 0, avgServiceSeconds: 0 }
    );

    // Calculate completion rate
    const completionRate = totals.totalIssued > 0 
      ? (totals.totalDone / totals.totalIssued) * 100 
      : 0;

    return {
      date: targetDate,
      locationsCount: locations.length,
      activeLocationsCount: locations.filter(l => l.is_active).length,
      totals: {
        ...totals,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      locations: locationStats,
    };
  }

  /**
   * Get top performing locations
   */
  async getTopPerformingLocations(ownerId: number, date?: string, limit: number = 5) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get owner's locations
    const locations = await this.locationRepository.findByOwnerId(ownerId);
    const locationIds = locations.map(l => l.id);
    
    // Get performance data
    const allPerformance = await this.summaryRepository.getTopPerformingLocations(targetDate, 50);
    
    // Filter to owner's locations only
    const ownerPerformance = allPerformance.filter(perf => 
      locationIds.includes(perf.location_id)
    ).slice(0, limit);

    return ownerPerformance;
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
    const transaction = await sequelize.transaction();
    
    try {
      // Verify ownership
      const location = await this.locationRepository.findById(locationId, transaction);
      if (!location || location.owner_id !== ownerId) {
        throw new Error('Location not found or access denied');
      }

      // Get analytics data
      const analytics = await this.getLocationAnalytics(ownerId, locationId, startDate, endDate);
      
      // Get additional metadata
      const report = {
        ...analytics,
        generatedAt: new Date(),
        generatedBy: ownerId,
        reportType: 'location_performance',
      };

      await transaction.commit();
      return report;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
    const offset = (page - 1) * limit;
    return this.locationRepository.search(query, offset, limit);
  }

  /**
   * Find locations near coordinates
   */
  async findNearbyLocations(
    lat: number,
    lng: number,
    radiusKm: number = 10
  ): Promise<ServiceLocation[]> {
    return this.locationRepository.findNearby(lat, lng, radiusKm);
  }

  // ========== COUNTER MANAGEMENT ==========

  /**
   * Get all counters for a location (owner-only)
   */
  async getLocationCounters(ownerId: number, locationId: number): Promise<Counter[]> {
    // Verify ownership
    const location = await this.locationRepository.findByIdSimple(locationId);
    
    if (!location) {
      throw new Error('Location not found');
    }
    
    if (location.owner_id !== ownerId) {
      throw new Error('Access denied');
    }
    
    return this.locationRepository.getCountersByLocationId(locationId);
  }

  /**
   * Create a new counter in a location (owner-only)
   */
  async createCounter(
    ownerId: number,
    locationId: number,
    counterData: CreateCounterRequest
  ): Promise<Counter> {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify ownership
      const location = await this.locationRepository.findByIdSimple(locationId, transaction);
      
      if (!location) {
        throw new Error('Location not found');
      }
      
      if (location.owner_id !== ownerId) {
        throw new Error('Access denied');
      }

      // Create counter
      const counter = await Counter.create({
        location_id: locationId,
        name: counterData.name,
        description: counterData.description,
        prefix: counterData.prefix,
        open_time: counterData.openTime || '08:00:00',
        close_time: counterData.closeTime || '17:00:00',
        capacity_per_day: counterData.capacityPerDay || 100,
        is_active: true,
      }, { transaction });

      await transaction.commit();
      return counter;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a counter (owner-only)
   */
  async updateCounter(
    ownerId: number,
    counterId: number,
    updates: UpdateCounterRequest
  ): Promise<Counter> {
    const transaction = await sequelize.transaction();
    
    try {
      const counter = await Counter.findByPk(counterId, { transaction });
      
      if (!counter) {
        throw new Error('Counter not found');
      }
      
      // Verify ownership via location
      const location = await this.locationRepository.findByIdSimple(counter.location_id, transaction);
      
      if (!location || location.owner_id !== ownerId) {
        throw new Error('Access denied');
      }

      // Build update data
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.prefix) updateData.prefix = updates.prefix;
      if (updates.openTime) updateData.open_time = updates.openTime;
      if (updates.closeTime) updateData.close_time = updates.closeTime;
      if (updates.capacityPerDay !== undefined) updateData.capacity_per_day = updates.capacityPerDay;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      await counter.update(updateData, { transaction });
      
      await transaction.commit();
      return counter;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete a counter (owner-only)
   */
  async deleteCounter(ownerId: number, counterId: number): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const counter = await Counter.findByPk(counterId, { transaction });
      
      if (!counter) {
        throw new Error('Counter not found');
      }
      
      // Verify ownership via location
      const location = await this.locationRepository.findByIdSimple(counter.location_id, transaction);
      
      if (!location || location.owner_id !== ownerId) {
        throw new Error('Access denied');
      }

      await counter.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ========== STAFF MANAGEMENT ==========

  /**
   * Get all staff across owner's locations
   */
  async getAllStaffForOwner(ownerId: number): Promise<any[]> {
    // Get all locations owned by this owner
    const locations = await this.locationRepository.findByOwnerId(ownerId);
    const locationIds = locations.map(loc => loc.id);
    
    if (locationIds.length === 0) {
      return [];
    }

    // Get all members for these locations
    const staffMap = new Map<number, any>();
    
    for (const location of locations) {
      const members = await this.memberRepository.findByLocationId(location.id);
      
      for (const member of members) {
        const user = (member as any).user;
        if (!user) continue;
        
        if (staffMap.has(user.id)) {
          // Add location to existing staff
          staffMap.get(user.id).locations.push({
            id: location.id,
            name: location.name
          });
        } else {
          // Create new staff entry
          staffMap.set(user.id, {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: member.role,
            is_active: member.is_active,
            created_at: member.created_at,
            locations: [{
              id: location.id,
              name: location.name
            }]
          });
        }
      }
    }
    
    return Array.from(staffMap.values());
  }

  /**
   * Invite/create a new staff member
   */
  async inviteStaff(
    ownerId: number,
    data: InviteStaffRequest
  ): Promise<any> {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify owner owns this location
      const location = await this.locationRepository.findByIdSimple(data.locationId, transaction);
      
      if (!location) {
        throw new Error('Location not found');
      }
      
      if (location.owner_id !== ownerId) {
        throw new Error('Access denied');
      }

      // Check if user exists by email
      let user = await this.userRepository.findByEmail(data.email, transaction);
      
      if (!user) {
        // Create new user
        const passwordHash = await bcrypt.hash(data.password || 'waitless123', 10);
        user = await this.userRepository.create({
          email: data.email,
          name: data.name,
          password_hash: passwordHash,
          role: Role.ADMIN,
        }, transaction);
      }

      // Check if already member of this location
      const existingMember = await this.memberRepository.findByLocationAndUser(
        data.locationId,
        user.id,
        transaction
      );
      
      if (existingMember) {
        throw new Error('User is already a member of this location');
      }

      // Create location membership
      const member = await this.memberRepository.create({
        location_id: data.locationId,
        user_id: user.id,
        role: data.role === 'ADMIN' ? Role.ADMIN : Role.VISITOR,
        is_active: true,
      }, transaction);

      await transaction.commit();
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: member.role,
        is_active: member.is_active,
        created_at: member.created_at,
        locations: [{
          id: location.id,
          name: location.name
        }]
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update staff member details
   */
  async updateStaff(
    ownerId: number,
    staffId: number,
    data: UpdateStaffRequest
  ): Promise<any> {
    const transaction = await sequelize.transaction();
    
    try {
      // Get user
      const user = await this.userRepository.findById(staffId, transaction);
      
      if (!user) {
        throw new Error('Staff not found');
      }

      // Verify this staff is a member of one of owner's locations
      const ownerLocations = await this.locationRepository.findByOwnerId(ownerId, transaction);
      const ownerLocationIds = ownerLocations.map(l => l.id);
      
      const memberships = await this.memberRepository.findByUserId(staffId, transaction);
      const relevantMemberships = memberships.filter(m => ownerLocationIds.includes(m.location_id));
      
      if (relevantMemberships.length === 0) {
        throw new Error('Access denied');
      }

      // Update user name if provided
      if (data.name) {
        await this.userRepository.update(staffId, { name: data.name }, transaction);
      }

      // Update locationId (branch) if provided - this changes which location the staff belongs to
      if (data.locationId) {
        // Verify new location is owned by this owner
        if (!ownerLocationIds.includes(data.locationId)) {
          throw new Error('Invalid location: You can only assign staff to your own locations');
        }
        
        // Update the location_id in the membership record
        // For simplicity, update the first relevant membership to the new location
        const currentMembership = relevantMemberships[0];
        if (currentMembership.location_id !== data.locationId) {
          await this.memberRepository.update(
            currentMembership.id, 
            { location_id: data.locationId }, 
            transaction
          );
        }
      }

      // Update role in location_members if provided
      if (data.role) {
        const newRole = data.role === 'ADMIN' ? Role.ADMIN : Role.VISITOR;
        // Get fresh memberships after potential location update
        const updatedMemberships = await this.memberRepository.findByUserId(staffId, transaction);
        for (const membership of updatedMemberships) {
          if (ownerLocationIds.includes(membership.location_id)) {
            await this.memberRepository.update(membership.id, { role: newRole }, transaction);
          }
        }
      }

      // Update is_active in location_members if provided
      if (data.is_active !== undefined) {
        const updatedMemberships = await this.memberRepository.findByUserId(staffId, transaction);
        for (const membership of updatedMemberships) {
          if (ownerLocationIds.includes(membership.location_id)) {
            await this.memberRepository.update(membership.id, { is_active: data.is_active }, transaction);
          }
        }
      }

      await transaction.commit();
      
      // Return updated staff
      const updatedStaff = await this.getAllStaffForOwner(ownerId);
      return updatedStaff.find(s => s.id === staffId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Toggle staff active status
   */
  async toggleStaffStatus(ownerId: number, staffId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify owner has access to this staff
      const ownerLocations = await this.locationRepository.findByOwnerId(ownerId, transaction);
      const ownerLocationIds = ownerLocations.map(l => l.id);
      
      const memberships = await this.memberRepository.findByUserId(staffId, transaction);
      const relevantMemberships = memberships.filter(m => ownerLocationIds.includes(m.location_id));
      
      if (relevantMemberships.length === 0) {
        throw new Error('Access denied');
      }

      // Toggle status for all relevant memberships
      const currentStatus = relevantMemberships[0].is_active;
      const newStatus = !currentStatus;
      
      for (const membership of relevantMemberships) {
        await this.memberRepository.update(membership.id, { is_active: newStatus }, transaction);
      }

      await transaction.commit();
      
      // Return updated staff
      const updatedStaff = await this.getAllStaffForOwner(ownerId);
      return updatedStaff.find(s => s.id === staffId) || { id: staffId, is_active: newStatus };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Remove staff from owner's locations
   */
  async removeStaff(ownerId: number, staffId: number): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify owner has access to this staff
      const ownerLocations = await this.locationRepository.findByOwnerId(ownerId, transaction);
      const ownerLocationIds = ownerLocations.map(l => l.id);
      
      const memberships = await this.memberRepository.findByUserId(staffId, transaction);
      const relevantMemberships = memberships.filter(m => ownerLocationIds.includes(m.location_id));
      
      if (relevantMemberships.length === 0) {
        throw new Error('Access denied');
      }

      // Delete memberships
      for (const membership of relevantMemberships) {
        await this.memberRepository.delete(membership.id, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}