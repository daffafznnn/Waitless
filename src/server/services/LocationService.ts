/* FILE: src/server/services/LocationService.ts */
/**
 * Location Service - Refactored
 * 
 * Handles location-related operations with:
 * - Proper error classes
 * - Access control validation
 * - Active/inactive counter filtering
 */

import { ServiceLocationRepository } from '../repositories/ServiceLocationRepository';
import { CounterRepository } from '../repositories/CounterRepository';
import { LocationMemberRepository } from '../repositories/LocationMemberRepository';
import { Role } from '../models/user.model';
import { 
  NotFoundError, 
  ForbiddenError,
  BusinessLogicError 
} from '../types/errors';

export class LocationService {
  private locationRepository: ServiceLocationRepository;
  private counterRepository: CounterRepository;
  private memberRepository: LocationMemberRepository;

  constructor() {
    this.locationRepository = new ServiceLocationRepository();
    this.counterRepository = new CounterRepository();
    this.memberRepository = new LocationMemberRepository();
  }

  /**
   * Get all locations (paginated) - for public listing
   */
  async getLocations(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    return this.locationRepository.findAllPaginated(offset, limit);
  }

  /**
   * Get location by ID
   */
  async getLocationById(locationId: number) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new NotFoundError('Cabang');
    }
    return location;
  }

  /**
   * Create a new location
   */
  async createLocation(data: {
    name: string;
    address?: string;
    phone?: string;
    description?: string;
    ownerId: number;
  }) {
    const locationData = {
      owner_id: data.ownerId,
      name: data.name,
      address: data.address || '',
      city: 'Unknown',
      phone: data.phone,
      description: data.description,
      is_active: true,
    };

    return this.locationRepository.create(locationData);
  }

  /**
   * Update a location (owner only)
   */
  async updateLocation(locationId: number, updates: any, userId: number) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new NotFoundError('Cabang');
    }

    const canUpdate = await this.checkLocationAccess(locationId, userId, [Role.OWNER]);
    if (!canUpdate) {
      throw new ForbiddenError('Hanya pemilik cabang yang dapat mengupdate');
    }

    return this.locationRepository.update(locationId, updates);
  }

  /**
   * Delete a location (owner only)
   */
  async deleteLocation(locationId: number, userId: number) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new NotFoundError('Cabang');
    }

    const canDelete = await this.checkLocationAccess(locationId, userId, [Role.OWNER]);
    if (!canDelete) {
      throw new ForbiddenError('Hanya pemilik cabang yang dapat menghapus');
    }

    return this.locationRepository.delete(locationId);
  }

  /**
   * Get location counters
   * 
   * @param locationId - Location ID
   * @param onlyActive - If true, only return active counters (default: true for visitors)
   */
  async getLocationCounters(locationId: number, onlyActive: boolean = true) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new NotFoundError('Cabang');
    }

    if (onlyActive) {
      // For visitors: only show active counters
      return this.counterRepository.findActiveByLocationId(locationId);
    } else {
      // For admin/owner: show all counters
      return this.counterRepository.findByLocationId(locationId);
    }
  }

  /**
   * Get location status with counter capacities
   */
  async getLocationStatus(locationId: number, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new NotFoundError('Cabang');
    }

    // Get all counters with status (for display, we might want to filter)
    const counters = await this.counterRepository.findAllWithStatus(locationId, targetDate);
    
    // Filter to only active counters for public view
    const activeCounters = counters.filter(c => c.is_active);
    
    const totalCapacity = activeCounters.reduce((sum, c) => sum + c.capacityStatus.capacity, 0);
    const totalIssued = activeCounters.reduce((sum, c) => sum + c.capacityStatus.issued, 0);
    const totalAvailable = activeCounters.reduce((sum, c) => sum + c.capacityStatus.available, 0);

    return {
      location,
      date: targetDate,
      counters: activeCounters,
      summary: {
        totalCapacity,
        totalIssued,
        totalAvailable,
        utilizationRate: totalCapacity > 0 ? Math.round((totalIssued / totalCapacity) * 100) : 0,
      },
    };
  }

  /**
   * Add a member to location (owner only)
   */
  async addLocationMember(locationId: number, userId: number, ownerId: number) {
    const canManage = await this.checkLocationAccess(locationId, ownerId, [Role.OWNER]);
    if (!canManage) {
      throw new ForbiddenError('Hanya pemilik cabang yang dapat menambahkan staff');
    }

    // Check if member already exists
    const existing = await this.memberRepository.findByLocationAndUser(locationId, userId);
    if (existing) {
      throw new BusinessLogicError('Staff sudah terdaftar di cabang ini');
    }

    const memberData = {
      location_id: locationId,
      user_id: userId,
      role: Role.ADMIN,
      is_active: true,
    };

    return this.memberRepository.create(memberData);
  }

  /**
   * Remove a member from location (owner only)
   */
  async removeLocationMember(locationId: number, userId: number, ownerId: number) {
    const canManage = await this.checkLocationAccess(locationId, ownerId, [Role.OWNER]);
    if (!canManage) {
      throw new ForbiddenError('Hanya pemilik cabang yang dapat menghapus staff');
    }

    const member = await this.memberRepository.findByLocationAndUser(locationId, userId);
    if (!member) {
      throw new NotFoundError('Staff');
    }

    return this.memberRepository.deleteByLocationAndUser(locationId, userId);
  }

  /**
   * Get location members (owner/admin)
   */
  async getLocationMembers(locationId: number, requestUserId: number) {
    const canView = await this.checkLocationAccess(locationId, requestUserId, [Role.OWNER, Role.ADMIN]);
    if (!canView) {
      throw new ForbiddenError('Anda tidak memiliki akses untuk melihat daftar staff');
    }

    return this.memberRepository.findByLocationId(locationId);
  }

  /**
   * Toggle member active status (owner only)
   */
  async toggleMemberStatus(locationId: number, userId: number, ownerId: number, isActive: boolean) {
    const canManage = await this.checkLocationAccess(locationId, ownerId, [Role.OWNER]);
    if (!canManage) {
      throw new ForbiddenError('Hanya pemilik cabang yang dapat mengubah status staff');
    }

    const member = await this.memberRepository.findByLocationAndUser(locationId, userId);
    if (!member) {
      throw new NotFoundError('Staff');
    }

    return this.memberRepository.setActiveStatus(locationId, userId, isActive);
  }

  /**
   * Check if user has access to location with specified roles
   */
  private async checkLocationAccess(locationId: number, userId: number, allowedRoles: Role[]): Promise<boolean> {
    // Check if user is the owner
    const location = await this.locationRepository.findById(locationId);
    if (location && location.owner_id === userId && allowedRoles.includes(Role.OWNER)) {
      return true;
    }

    // Check if user is an active member with appropriate role
    const member = await this.memberRepository.findByLocationAndUser(locationId, userId);
    if (member && member.is_active && allowedRoles.includes(member.role)) {
      return true;
    }

    return false;
  }

  /**
   * Validate that user has access to location (throws if not)
   */
  async validateLocationAccess(locationId: number, userId: number, allowedRoles: Role[]): Promise<void> {
    const hasAccess = await this.checkLocationAccess(locationId, userId, allowedRoles);
    if (!hasAccess) {
      throw new ForbiddenError('Anda tidak memiliki akses ke cabang ini');
    }
  }
}