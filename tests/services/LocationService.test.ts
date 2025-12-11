import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { LocationService } from '../../src/server/services/LocationService';
import { ServiceLocationRepository } from '../../src/server/repositories/ServiceLocationRepository';
import { CounterRepository } from '../../src/server/repositories/CounterRepository';
import { LocationMemberRepository } from '../../src/server/repositories/LocationMemberRepository';
import { TicketRepository } from '../../src/server/repositories/TicketRepository';
import { Role } from '../../src/server/models/user.model';

vi.mock('../../src/server/repositories/ServiceLocationRepository');
vi.mock('../../src/server/repositories/CounterRepository');
vi.mock('../../src/server/repositories/LocationMemberRepository');
vi.mock('../../src/server/repositories/TicketRepository');

describe('LocationService', () => {
  let locationService: LocationService;
  let mockLocationRepository: ServiceLocationRepository;
  let mockCounterRepository: CounterRepository;
  let mockMemberRepository: LocationMemberRepository;
  let mockTicketRepository: TicketRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLocationRepository = new ServiceLocationRepository();
    mockCounterRepository = new CounterRepository();
    mockMemberRepository = new LocationMemberRepository();
    mockTicketRepository = new TicketRepository();
    
    locationService = new LocationService();
    (locationService as any).locationRepository = mockLocationRepository;
    (locationService as any).counterRepository = mockCounterRepository;
    (locationService as any).memberRepository = mockMemberRepository;
    (locationService as any).ticketRepository = mockTicketRepository;
  });

  describe('getLocations', () => {
    it('should get paginated locations successfully', async () => {
      const mockLocations = {
        rows: [
          { id: 1, name: 'Location 1' },
          { id: 2, name: 'Location 2' },
        ],
        count: 2,
      };

      (mockLocationRepository.findAllPaginated as Mock).mockResolvedValue(mockLocations);

      const result = await locationService.getLocations(1, 20);

      expect(mockLocationRepository.findAllPaginated).toHaveBeenCalledWith(0, 20);
      expect(result).toEqual(mockLocations);
    });

    it('should handle custom page and limit', async () => {
      const mockLocations = { rows: [], count: 0 };
      (mockLocationRepository.findAllPaginated as Mock).mockResolvedValue(mockLocations);

      await locationService.getLocations(3, 10);

      expect(mockLocationRepository.findAllPaginated).toHaveBeenCalledWith(20, 10);
    });
  });

  describe('getLocationById', () => {
    it('should get location by ID successfully', async () => {
      const mockLocation = {
        id: 1,
        name: 'Test Location',
        address: '123 Test St',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);

      const result = await locationService.getLocationById(1);

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLocation);
    });
  });

  describe('createLocation', () => {
    it('should create location successfully', async () => {
      const locationData = {
        name: 'New Location',
        address: '123 New St',
        phone: '+1234567890',
        description: 'Test location',
        ownerId: 1,
      };

      const mockCreatedLocation = {
        id: 1,
        owner_id: 1,
        name: 'New Location',
        address: '123 New St',
        city: 'Unknown',
        phone: '+1234567890',
        description: 'Test location',
        is_active: true,
      };

      (mockLocationRepository.create as Mock).mockResolvedValue(mockCreatedLocation);

      const result = await locationService.createLocation(locationData);

      expect(mockLocationRepository.create).toHaveBeenCalledWith({
        owner_id: 1,
        name: 'New Location',
        address: '123 New St',
        city: 'Unknown',
        phone: '+1234567890',
        description: 'Test location',
        is_active: true,
      });
      expect(result).toEqual(mockCreatedLocation);
    });

    it('should handle optional fields', async () => {
      const locationData = {
        name: 'Simple Location',
        ownerId: 1,
      };

      (mockLocationRepository.create as Mock).mockResolvedValue({});

      await locationService.createLocation(locationData);

      expect(mockLocationRepository.create).toHaveBeenCalledWith({
        owner_id: 1,
        name: 'Simple Location',
        address: '',
        city: 'Unknown',
        phone: undefined,
        description: undefined,
        is_active: true,
      });
    });
  });

  describe('updateLocation', () => {
    it('should update location successfully', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Location',
      };

      const mockUpdatedLocation = {
        id: 1,
        name: 'Updated Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockLocationRepository.update as Mock).mockResolvedValue(mockUpdatedLocation);

      const result = await locationService.updateLocation(1, { name: 'Updated Location' }, 1);

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockLocationRepository.update).toHaveBeenCalledWith(1, { name: 'Updated Location' });
      expect(result).toEqual(mockUpdatedLocation);
    });

    it('should throw error if location not found', async () => {
      (mockLocationRepository.findById as Mock).mockResolvedValue(null);

      await expect(locationService.updateLocation(1, {}, 1)).rejects.toThrow('Location not found');
    });

    it('should throw error if user is not the owner', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(null);

      await expect(locationService.updateLocation(1, {}, 1)).rejects.toThrow('Access denied - only location owner can update');
    });
  });

  describe('deleteLocation', () => {
    it('should delete location successfully', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockLocationRepository.delete as Mock).mockResolvedValue(1);

      const result = await locationService.deleteLocation(1, 1);

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockLocationRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(1);
    });

    it('should throw error if location not found', async () => {
      (mockLocationRepository.findById as Mock).mockResolvedValue(null);

      await expect(locationService.deleteLocation(1, 1)).rejects.toThrow('Location not found');
    });

    it('should throw error if user is not the owner', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(null);

      await expect(locationService.deleteLocation(1, 1)).rejects.toThrow('Access denied - only location owner can delete');
    });
  });

  describe('getLocationCounters', () => {
    it('should get location counters successfully', async () => {
      const mockLocation = {
        id: 1,
        name: 'Test Location',
      };

      const mockCounters = [
        { id: 1, name: 'Counter 1' },
        { id: 2, name: 'Counter 2' },
      ];

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockCounterRepository.findActiveByLocationId as Mock).mockResolvedValue(mockCounters);

      const result = await locationService.getLocationCounters(1);

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCounterRepository.findActiveByLocationId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCounters);
    });

    it('should throw error if location not found', async () => {
      (mockLocationRepository.findById as Mock).mockResolvedValue(null);

      await expect(locationService.getLocationCounters(1)).rejects.toThrow('Location not found');
    });
  });

  describe('getLocationStatus', () => {
    it('should get location status successfully', async () => {
      const mockLocation = {
        id: 1,
        name: 'Test Location',
      };

      const mockCounters = [
        {
          id: 1,
          name: 'Counter 1',
          capacityStatus: { capacity: 50, issued: 30, available: 20 },
        },
        {
          id: 2,
          name: 'Counter 2',
          capacityStatus: { capacity: 30, issued: 25, available: 5 },
        },
      ];

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockCounterRepository.findAllWithStatus as Mock).mockResolvedValue(mockCounters);

      const result = await locationService.getLocationStatus(1, '2023-12-01');

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCounterRepository.findAllWithStatus).toHaveBeenCalledWith(1, '2023-12-01');
      expect(result).toEqual({
        location: mockLocation,
        date: '2023-12-01',
        counters: mockCounters,
        summary: {
          totalCapacity: 80,
          totalIssued: 55,
          totalAvailable: 25,
          utilizationRate: 69,
        },
      });
    });

    it('should use current date if not provided', async () => {
      const mockLocation = { id: 1, name: 'Test Location' };
      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockCounterRepository.findAllWithStatus as Mock).mockResolvedValue([]);

      const result = await locationService.getLocationStatus(1);

      expect(result.date).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should handle zero capacity gracefully', async () => {
      const mockLocation = { id: 1, name: 'Test Location' };
      const mockCounters = [
        {
          id: 1,
          name: 'Counter 1',
          capacityStatus: { capacity: 0, issued: 0, available: 0 },
        },
      ];

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockCounterRepository.findAllWithStatus as Mock).mockResolvedValue(mockCounters);

      const result = await locationService.getLocationStatus(1, '2023-12-01');

      expect(result.summary.utilizationRate).toBe(0);
    });
  });

  describe('addLocationMember', () => {
    it('should add location member successfully', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Location',
      };

      const mockNewMember = {
        id: 1,
        location_id: 1,
        user_id: 2,
        role: Role.ADMIN,
        is_active: true,
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.create as Mock).mockResolvedValue(mockNewMember);

      const result = await locationService.addLocationMember(1, 2, 1);

      expect(mockMemberRepository.create).toHaveBeenCalledWith({
        location_id: 1,
        user_id: 2,
        role: Role.ADMIN,
        is_active: true,
      });
      expect(result).toEqual(mockNewMember);
    });

    it('should throw error if user is not the owner', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(null);

      await expect(locationService.addLocationMember(1, 2, 1)).rejects.toThrow('Access denied - only location owner can add members');
    });
  });

  describe('removeLocationMember', () => {
    it('should remove location member successfully', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.deleteByLocationAndUser as Mock).mockResolvedValue(1);

      const result = await locationService.removeLocationMember(1, 2, 1);

      expect(mockMemberRepository.deleteByLocationAndUser).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(1);
    });

    it('should throw error if user is not the owner', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(null);

      await expect(locationService.removeLocationMember(1, 2, 1)).rejects.toThrow('Access denied - only location owner can remove members');
    });
  });

  describe('getLocationMembers', () => {
    it('should get location members successfully for owner', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Location',
      };

      const mockMembers = [
        { id: 1, user_id: 2, role: Role.ADMIN },
        { id: 2, user_id: 3, role: Role.ADMIN },
      ];

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationId as Mock).mockResolvedValue(mockMembers);

      const result = await locationService.getLocationMembers(1, 1);

      expect(mockMemberRepository.findByLocationId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMembers);
    });

    it('should get location members successfully for admin member', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      const mockMember = {
        id: 1,
        user_id: 1,
        role: Role.ADMIN,
        is_active: true,
      };

      const mockMembers = [
        { id: 1, user_id: 2, role: Role.ADMIN },
      ];

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(mockMember);
      (mockMemberRepository.findByLocationId as Mock).mockResolvedValue(mockMembers);

      const result = await locationService.getLocationMembers(1, 1);

      expect(result).toEqual(mockMembers);
    });

    it('should throw error if user has no access', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(null);

      await expect(locationService.getLocationMembers(1, 1)).rejects.toThrow('Access denied - insufficient permissions');
    });
  });

  describe('checkLocationAccess', () => {
    it('should allow access for location owner', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);

      const result = await (locationService as any).checkLocationAccess(1, 1, [Role.OWNER]);

      expect(result).toBe(true);
    });

    it('should allow access for active admin member', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      const mockMember = {
        id: 1,
        user_id: 1,
        role: Role.ADMIN,
        is_active: true,
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(mockMember);

      const result = await (locationService as any).checkLocationAccess(1, 1, [Role.ADMIN]);

      expect(result).toBe(true);
    });

    it('should deny access for inactive member', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      const mockMember = {
        id: 1,
        user_id: 1,
        role: Role.ADMIN,
        is_active: false, // Inactive member
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(mockMember);

      const result = await (locationService as any).checkLocationAccess(1, 1, [Role.ADMIN]);

      expect(result).toBe(false);
    });

    it('should deny access for member with wrong role', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      const mockMember = {
        id: 1,
        user_id: 1,
        role: Role.VISITOR,
        is_active: true,
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(mockMember);

      const result = await (locationService as any).checkLocationAccess(1, 1, [Role.ADMIN]);

      expect(result).toBe(false);
    });

    it('should deny access for non-member non-owner', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Location',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      (mockMemberRepository.findByLocationAndUser as Mock).mockResolvedValue(null);

      const result = await (locationService as any).checkLocationAccess(1, 1, [Role.ADMIN]);

      expect(result).toBe(false);
    });
  });
});