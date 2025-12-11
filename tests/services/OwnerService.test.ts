import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { OwnerService, CreateLocationRequest, UpdateLocationRequest } from '../../src/server/services/OwnerService';
import { UserRepository } from '../../src/server/repositories/UserRepository';
import { LocationRepository } from '../../src/server/repositories/LocationRepository';
import { SummaryRepository } from '../../src/server/repositories/SummaryRepository';
import { Role } from '../../src/server/models/user.model';

vi.mock('../../src/server/repositories/UserRepository');
vi.mock('../../src/server/repositories/LocationRepository');
vi.mock('../../src/server/repositories/SummaryRepository');
vi.mock('../../src/server/db', () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));

describe('OwnerService', () => {
  let ownerService: OwnerService;
  let mockUserRepository: UserRepository;
  let mockLocationRepository: LocationRepository;
  let mockSummaryRepository: SummaryRepository;
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
    mockLocationRepository = new LocationRepository();
    mockSummaryRepository = new SummaryRepository();
    
    ownerService = new OwnerService();
    (ownerService as any).userRepository = mockUserRepository;
    (ownerService as any).locationRepository = mockLocationRepository;
    (ownerService as any).summaryRepository = mockSummaryRepository;
  });

  describe('createLocation', () => {
    const validCreateRequest: CreateLocationRequest = {
      name: 'Test Clinic',
      address: '123 Main St',
      city: 'Test City',
      lat: -6.2,
      lng: 106.8,
    };

    it('should create a new location successfully', async () => {
      const mockOwner = {
        id: 1,
        email: 'owner@test.com',
        role: Role.OWNER,
      };

      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Clinic',
        address: '123 Main St',
        city: 'Test City',
        lat: -6.2,
        lng: 106.8,
        is_active: true,
      };

      (mockUserRepository.findById as Mock).mockResolvedValue(mockOwner);
      (mockLocationRepository.existsForOwner as Mock).mockResolvedValue(false);
      (mockLocationRepository.create as Mock).mockResolvedValue(mockLocation);

      const result = await ownerService.createLocation(1, validCreateRequest);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockLocationRepository.existsForOwner).toHaveBeenCalledWith(1, 'Test Clinic', mockTransaction);
      expect(mockLocationRepository.create).toHaveBeenCalledWith({
        owner_id: 1,
        name: 'Test Clinic',
        address: '123 Main St',
        city: 'Test City',
        lat: -6.2,
        lng: 106.8,
        is_active: true,
      }, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockLocation);
    });

    it('should throw error if user is not an owner', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        role: Role.ADMIN,
      };

      (mockUserRepository.findById as Mock).mockResolvedValue(mockUser);

      await expect(ownerService.createLocation(1, validCreateRequest)).rejects.toThrow('Only owners can create locations');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (mockUserRepository.findById as Mock).mockResolvedValue(null);

      await expect(ownerService.createLocation(1, validCreateRequest)).rejects.toThrow('Only owners can create locations');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if location name already exists', async () => {
      const mockOwner = {
        id: 1,
        email: 'owner@test.com',
        role: Role.OWNER,
      };

      (mockUserRepository.findById as Mock).mockResolvedValue(mockOwner);
      (mockLocationRepository.existsForOwner as Mock).mockResolvedValue(true);

      await expect(ownerService.createLocation(1, validCreateRequest)).rejects.toThrow('Location name already exists for this owner');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('updateLocation', () => {
    const validUpdateRequest: UpdateLocationRequest = {
      name: 'Updated Clinic',
      address: '456 New St',
      isActive: false,
    };

    it('should update location successfully', async () => {
      const existingLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Clinic',
        address: '123 Main St',
      };

      const updatedLocation = {
        id: 1,
        owner_id: 1,
        name: 'Updated Clinic',
        address: '456 New St',
        is_active: false,
      };

      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(existingLocation);
      (mockLocationRepository.existsForOwner as Mock).mockResolvedValue(false);
      (mockLocationRepository.update as Mock).mockResolvedValue([1, []]);
      (mockLocationRepository.findById as Mock).mockResolvedValue(updatedLocation);

      const result = await ownerService.updateLocation(1, 1, validUpdateRequest);

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockLocationRepository.existsForOwner).toHaveBeenCalledWith(1, 'Updated Clinic', mockTransaction);
      expect(mockLocationRepository.update).toHaveBeenCalledWith(1, {
        name: 'Updated Clinic',
        address: '456 New St',
        is_active: false,
      }, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(updatedLocation);
    });

    it('should throw error if location not found', async () => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(null);

      await expect(ownerService.updateLocation(1, 1, validUpdateRequest)).rejects.toThrow('Location not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if user is not the owner', async () => {
      const existingLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Clinic',
      };

      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(existingLocation);

      await expect(ownerService.updateLocation(1, 1, validUpdateRequest)).rejects.toThrow('You can only update your own locations');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if new name already exists', async () => {
      const existingLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Clinic',
      };

      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(existingLocation);
      (mockLocationRepository.existsForOwner as Mock).mockResolvedValue(true);

      await expect(ownerService.updateLocation(1, 1, { name: 'Duplicate Name' }))
        .rejects.toThrow('Location name already exists for this owner');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('deleteLocation', () => {
    it('should delete location successfully', async () => {
      const existingLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Clinic',
      };

      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(existingLocation);
      (mockLocationRepository.delete as Mock).mockResolvedValue(1);

      await ownerService.deleteLocation(1, 1);

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockLocationRepository.delete).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if location not found', async () => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(null);

      await expect(ownerService.deleteLocation(1, 1)).rejects.toThrow('Location not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if user is not the owner', async () => {
      const existingLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Clinic',
      };

      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(existingLocation);

      await expect(ownerService.deleteLocation(1, 1)).rejects.toThrow('You can only delete your own locations');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getMyLocations', () => {
    it('should get all owner locations successfully', async () => {
      const mockLocations = [
        { id: 1, name: 'Clinic 1', city: 'City 1' },
        { id: 2, name: 'Clinic 2', city: 'City 2' },
      ];

      (mockLocationRepository.findByOwnerId as Mock).mockResolvedValue(mockLocations);

      const result = await ownerService.getMyLocations(1);

      expect(mockLocationRepository.findByOwnerId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLocations);
    });
  });

  describe('getLocationById', () => {
    it('should get location by ID successfully', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Clinic',
        city: 'Test City',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);

      const result = await ownerService.getLocationById(1, 1);

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLocation);
    });

    it('should throw error if location not found', async () => {
      (mockLocationRepository.findById as Mock).mockResolvedValue(null);

      await expect(ownerService.getLocationById(1, 1)).rejects.toThrow('Location not found');
    });

    it('should throw error if access denied', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 2, // Different owner
        name: 'Test Clinic',
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);

      await expect(ownerService.getLocationById(1, 1)).rejects.toThrow('Access denied');
    });
  });

  describe('getLocationAnalytics', () => {
    it('should get location analytics successfully', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Clinic',
      };

      const mockStats = {
        totalTickets: 100,
        completedTickets: 85,
        averageWaitTime: 15.5,
      };

      const mockDailySummaries = [
        { date: '2023-12-01', total_issued: 50, total_done: 45 },
        { date: '2023-12-02', total_issued: 50, total_done: 40 },
      ];

      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(mockLocation);
      (mockSummaryRepository.getAggregatedStats as Mock).mockResolvedValue(mockStats);
      (mockSummaryRepository.findByLocationAndDateRange as Mock).mockResolvedValue(mockDailySummaries);

      const result = await ownerService.getLocationAnalytics(1, 1, '2023-12-01', '2023-12-02');

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockSummaryRepository.getAggregatedStats).toHaveBeenCalledWith(1, '2023-12-01', '2023-12-02', mockTransaction);
      expect(mockSummaryRepository.findByLocationAndDateRange).toHaveBeenCalledWith(1, '2023-12-01', '2023-12-02', mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({
        locationId: 1,
        locationName: 'Test Clinic',
        period: { startDate: '2023-12-01', endDate: '2023-12-02' },
        aggregated: mockStats,
        daily: mockDailySummaries,
      });
    });

    it('should throw error if location not found or access denied', async () => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(null);

      await expect(ownerService.getLocationAnalytics(1, 1, '2023-12-01', '2023-12-02'))
        .rejects.toThrow('Location not found or access denied');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getOwnerDashboard', () => {
    it('should get owner dashboard successfully', async () => {
      const mockLocations = [
        { id: 1, name: 'Clinic 1', city: 'City 1', is_active: true },
        { id: 2, name: 'Clinic 2', city: 'City 2', is_active: true },
      ];

      const mockSummaries = [
        {
          total_issued: 50,
          total_done: 45,
          total_hold: 2,
          total_cancel: 3,
          avg_service_seconds: 300,
        },
        {
          total_issued: 30,
          total_done: 28,
          total_hold: 1,
          total_cancel: 1,
          avg_service_seconds: 250,
        },
      ];

      (mockLocationRepository.findByOwnerId as Mock).mockResolvedValue(mockLocations);
      (mockSummaryRepository.findByLocationAndDate as Mock)
        .mockResolvedValueOnce(mockSummaries[0])
        .mockResolvedValueOnce(mockSummaries[1]);

      const result = await ownerService.getOwnerDashboard(1, '2023-12-01');

      expect(mockLocationRepository.findByOwnerId).toHaveBeenCalledWith(1);
      expect(mockSummaryRepository.findByLocationAndDate).toHaveBeenCalledWith(1, '2023-12-01');
      expect(mockSummaryRepository.findByLocationAndDate).toHaveBeenCalledWith(2, '2023-12-01');
      
      expect(result.date).toBe('2023-12-01');
      expect(result.locationsCount).toBe(2);
      expect(result.activeLocationsCount).toBe(2);
      expect(result.totals.totalIssued).toBe(80);
      expect(result.totals.totalDone).toBe(73);
      expect(result.totals.completionRate).toBe(91.25);
    });

    it('should use current date if not provided', async () => {
      (mockLocationRepository.findByOwnerId as Mock).mockResolvedValue([]);

      const result = await ownerService.getOwnerDashboard(1);

      expect(result.date).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('getTopPerformingLocations', () => {
    it('should get top performing locations for owner', async () => {
      const mockLocations = [
        { id: 1, name: 'Clinic 1' },
        { id: 2, name: 'Clinic 2' },
      ];

      const mockAllPerformance = [
        { location_id: 1, performance_score: 95 },
        { location_id: 3, performance_score: 90 }, // Not owned by this owner
        { location_id: 2, performance_score: 85 },
      ];

      (mockLocationRepository.findByOwnerId as Mock).mockResolvedValue(mockLocations);
      (mockSummaryRepository.getTopPerformingLocations as Mock).mockResolvedValue(mockAllPerformance);

      const result = await ownerService.getTopPerformingLocations(1, '2023-12-01', 5);

      expect(mockLocationRepository.findByOwnerId).toHaveBeenCalledWith(1);
      expect(mockSummaryRepository.getTopPerformingLocations).toHaveBeenCalledWith('2023-12-01', 50);
      expect(result).toHaveLength(2);
      expect(result[0].location_id).toBe(1);
      expect(result[1].location_id).toBe(2);
    });
  });

  describe('generateLocationReport', () => {
    it('should generate location report successfully', async () => {
      const mockLocation = {
        id: 1,
        owner_id: 1,
        name: 'Test Clinic',
      };

      // Mock the getLocationAnalytics method
      const mockAnalytics = {
        locationId: 1,
        locationName: 'Test Clinic',
        period: { startDate: '2023-12-01', endDate: '2023-12-02' },
        aggregated: { totalTickets: 100 },
        daily: [],
      };

      (mockLocationRepository.findById as Mock).mockResolvedValue(mockLocation);
      vi.spyOn(ownerService, 'getLocationAnalytics').mockResolvedValue(mockAnalytics);

      const result = await ownerService.generateLocationReport(1, 1, '2023-12-01', '2023-12-02');

      expect(mockLocationRepository.findById).toHaveBeenCalledWith(1, mockTransaction);
      expect(result.reportType).toBe('location_performance');
      expect(result.generatedBy).toBe(1);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.locationId).toBe(1);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if location not found or access denied', async () => {
      (mockLocationRepository.findById as Mock).mockResolvedValue(null);

      await expect(ownerService.generateLocationReport(1, 1, '2023-12-01', '2023-12-02'))
        .rejects.toThrow('Location not found or access denied');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('searchLocations', () => {
    it('should search locations successfully', async () => {
      const mockSearchResults = [
        { id: 1, name: 'Test Clinic', city: 'Test City' },
        { id: 2, name: 'Another Clinic', city: 'Test City' },
      ];

      (mockLocationRepository.search as Mock).mockResolvedValue(mockSearchResults);

      const result = await ownerService.searchLocations('Test', 'Test City', true, 1, 20);

      expect(mockLocationRepository.search).toHaveBeenCalledWith('Test', 0, 20);
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('findNearbyLocations', () => {
    it('should find nearby locations successfully', async () => {
      const mockNearbyLocations = [
        { id: 1, name: 'Nearby Clinic 1', lat: -6.2, lng: 106.8 },
        { id: 2, name: 'Nearby Clinic 2', lat: -6.21, lng: 106.81 },
      ];

      (mockLocationRepository.findNearby as Mock).mockResolvedValue(mockNearbyLocations);

      const result = await ownerService.findNearbyLocations(-6.2, 106.8, 5);

      expect(mockLocationRepository.findNearby).toHaveBeenCalledWith(-6.2, 106.8, 5);
      expect(result).toEqual(mockNearbyLocations);
    });
  });
});