/* FILE: src/server/services/OwnerService.ts */
import { UserRepository } from '../repositories/UserRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { SummaryRepository } from '../repositories/SummaryRepository';
import { sequelize } from '../db';
import { ServiceLocation } from '../models/service_location.model';
import { Role } from '../models/user.model';

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

export class OwnerService {
  private userRepository: UserRepository;
  private locationRepository: LocationRepository;
  private summaryRepository: SummaryRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.locationRepository = new LocationRepository();
    this.summaryRepository = new SummaryRepository();
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

      // Check if location has active counters or tickets
      // For safety, we might want to soft delete or require confirmation
      // This is a simplified implementation

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
}