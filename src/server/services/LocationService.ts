/* FILE: src/server/services/LocationService.ts */
import { ServiceLocationRepository } from '../repositories/ServiceLocationRepository';
import { CounterRepository } from '../repositories/CounterRepository';
import { LocationMemberRepository } from '../repositories/LocationMemberRepository';
import { Role } from '../models/user.model';

export class LocationService {
  private locationRepository: ServiceLocationRepository;
  private counterRepository: CounterRepository;
  private memberRepository: LocationMemberRepository;
  // private ticketRepository: TicketRepository;

  constructor() {
    this.locationRepository = new ServiceLocationRepository();
    this.counterRepository = new CounterRepository();
    this.memberRepository = new LocationMemberRepository();
    // this.ticketRepository = new TicketRepository();
  }

  async getLocations(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    return this.locationRepository.findAllPaginated(offset, limit);
  }

  async getLocationById(locationId: number) {
    return this.locationRepository.findById(locationId);
  }

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

  async updateLocation(locationId: number, updates: any, userId: number) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const canUpdate = await this.checkLocationAccess(locationId, userId, [Role.OWNER]);
    if (!canUpdate) {
      throw new Error('Access denied - only location owner can update');
    }

    return this.locationRepository.update(locationId, updates);
  }

  async deleteLocation(locationId: number, userId: number) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const canDelete = await this.checkLocationAccess(locationId, userId, [Role.OWNER]);
    if (!canDelete) {
      throw new Error('Access denied - only location owner can delete');
    }

    return this.locationRepository.delete(locationId);
  }

  async getLocationCounters(locationId: number) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    return this.counterRepository.findActiveByLocationId(locationId);
  }

  async getLocationStatus(locationId: number, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const counters = await this.counterRepository.findAllWithStatus(locationId, targetDate);
    
    const totalCapacity = counters.reduce((sum, c) => sum + c.capacityStatus.capacity, 0);
    const totalIssued = counters.reduce((sum, c) => sum + c.capacityStatus.issued, 0);
    const totalAvailable = counters.reduce((sum, c) => sum + c.capacityStatus.available, 0);

    return {
      location,
      date: targetDate,
      counters,
      summary: {
        totalCapacity,
        totalIssued,
        totalAvailable,
        utilizationRate: totalCapacity > 0 ? Math.round((totalIssued / totalCapacity) * 100) : 0,
      },
    };
  }

  async addLocationMember(locationId: number, userId: number, ownerId: number) {
    const canManage = await this.checkLocationAccess(locationId, ownerId, [Role.OWNER]);
    if (!canManage) {
      throw new Error('Access denied - only location owner can add members');
    }

    const memberData = {
      location_id: locationId,
      user_id: userId,
      role: Role.ADMIN,
      is_active: true,
    };

    return this.memberRepository.create(memberData);
  }

  async removeLocationMember(locationId: number, userId: number, ownerId: number) {
    const canManage = await this.checkLocationAccess(locationId, ownerId, [Role.OWNER]);
    if (!canManage) {
      throw new Error('Access denied - only location owner can remove members');
    }

    return this.memberRepository.deleteByLocationAndUser(locationId, userId);
  }

  async getLocationMembers(locationId: number, requestUserId: number) {
    const canView = await this.checkLocationAccess(locationId, requestUserId, [Role.OWNER, Role.ADMIN]);
    if (!canView) {
      throw new Error('Access denied - insufficient permissions');
    }

    return this.memberRepository.findByLocationId(locationId);
  }

  private async checkLocationAccess(locationId: number, userId: number, allowedRoles: Role[]): Promise<boolean> {
    // Check if user is the owner
    const location = await this.locationRepository.findById(locationId);
    if (location && location.owner_id === userId && allowedRoles.includes(Role.OWNER)) {
      return true;
    }

    // Check if user is a member with appropriate role
    const member = await this.memberRepository.findByLocationAndUser(locationId, userId);
    if (member && member.is_active && allowedRoles.includes(member.role)) {
      return true;
    }

    return false;
  }
}