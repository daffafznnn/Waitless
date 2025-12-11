import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { AdminService, CreateCounterRequest, UpdateCounterRequest } from '../../src/server/services/AdminService';
import { CounterRepository } from '../../src/server/repositories/CounterRepository';
import { LocationRepository } from '../../src/server/repositories/LocationRepository';
import { TicketRepository } from '../../src/server/repositories/TicketRepository';
import { EventRepository } from '../../src/server/repositories/EventRepository';
import { SummaryRepository } from '../../src/server/repositories/SummaryRepository';

vi.mock('../../src/server/repositories/CounterRepository');
vi.mock('../../src/server/repositories/LocationRepository');
vi.mock('../../src/server/repositories/TicketRepository');
vi.mock('../../src/server/repositories/EventRepository');
vi.mock('../../src/server/repositories/SummaryRepository');
vi.mock('../../src/server/db', () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));

describe('AdminService', () => {
  let adminService: AdminService;
  let mockCounterRepository: CounterRepository;
  let mockLocationRepository: LocationRepository;
  let mockTicketRepository: TicketRepository;
  let mockEventRepository: EventRepository;
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

    mockCounterRepository = new CounterRepository();
    mockLocationRepository = new LocationRepository();
    mockTicketRepository = new TicketRepository();
    mockEventRepository = new EventRepository();
    mockSummaryRepository = new SummaryRepository();
    
    adminService = new AdminService();
    (adminService as any).counterRepository = mockCounterRepository;
    (adminService as any).locationRepository = mockLocationRepository;
    (adminService as any).ticketRepository = mockTicketRepository;
    (adminService as any).eventRepository = mockEventRepository;
    (adminService as any).summaryRepository = mockSummaryRepository;
  });

  describe('createCounter', () => {
    const validCreateRequest: CreateCounterRequest = {
      locationId: 1,
      name: 'Service Counter 1',
      description: 'Main service counter',
      prefix: 'SC',
      openTime: '08:00',
      closeTime: '17:00',
      capacityPerDay: 100,
    };

    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should create a new counter successfully', async () => {
      const mockCounter = {
        id: 1,
        location_id: 1,
        name: 'Service Counter 1',
        description: 'Main service counter',
        prefix: 'SC',
        open_time: '08:00',
        close_time: '17:00',
        capacity_per_day: 100,
        is_active: true,
      };

      (mockCounterRepository.existsByNameInLocation as Mock).mockResolvedValue(false);
      (mockCounterRepository.existsByPrefixInLocation as Mock).mockResolvedValue(false);
      (mockCounterRepository.create as Mock).mockResolvedValue(mockCounter);

      const result = await adminService.createCounter(1, validCreateRequest);

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockCounterRepository.existsByNameInLocation).toHaveBeenCalledWith(1, 'Service Counter 1', undefined, mockTransaction);
      expect(mockCounterRepository.existsByPrefixInLocation).toHaveBeenCalledWith(1, 'SC', undefined, mockTransaction);
      expect(mockCounterRepository.create).toHaveBeenCalledWith({
        location_id: 1,
        name: 'Service Counter 1',
        description: 'Main service counter',
        prefix: 'SC',
        open_time: '08:00',
        close_time: '17:00',
        capacity_per_day: 100,
        is_active: true,
      }, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockCounter);
    });

    it('should throw error if location not found', async () => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(null);

      await expect(adminService.createCounter(1, validCreateRequest)).rejects.toThrow('Location not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if counter name already exists', async () => {
      (mockCounterRepository.existsByNameInLocation as Mock).mockResolvedValue(true);

      await expect(adminService.createCounter(1, validCreateRequest)).rejects.toThrow('Counter name already exists in this location');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if counter prefix already exists', async () => {
      (mockCounterRepository.existsByNameInLocation as Mock).mockResolvedValue(false);
      (mockCounterRepository.existsByPrefixInLocation as Mock).mockResolvedValue(true);

      await expect(adminService.createCounter(1, validCreateRequest)).rejects.toThrow('Counter prefix already exists in this location');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('updateCounter', () => {
    const validUpdateRequest: UpdateCounterRequest = {
      name: 'Updated Counter',
      description: 'Updated description',
      isActive: false,
    };

    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should update counter successfully', async () => {
      const existingCounter = {
        id: 1,
        location_id: 1,
        name: 'Old Counter',
        prefix: 'OC',
      };

      const updatedCounter = {
        id: 1,
        location_id: 1,
        name: 'Updated Counter',
        description: 'Updated description',
        is_active: false,
      };

      (mockCounterRepository.findById as Mock)
        .mockResolvedValueOnce(existingCounter)
        .mockResolvedValueOnce(updatedCounter);
      (mockCounterRepository.existsByNameInLocation as Mock).mockResolvedValue(false);
      (mockCounterRepository.update as Mock).mockResolvedValue([1, []]);

      const result = await adminService.updateCounter(1, 1, validUpdateRequest);

      expect(mockCounterRepository.findById).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockCounterRepository.existsByNameInLocation).toHaveBeenCalledWith(1, 'Updated Counter', 1, mockTransaction);
      expect(mockCounterRepository.update).toHaveBeenCalledWith(1, {
        name: 'Updated Counter',
        description: 'Updated description',
        is_active: false,
      }, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(updatedCounter);
    });

    it('should throw error if counter not found', async () => {
      (mockCounterRepository.findById as Mock).mockResolvedValue(null);

      await expect(adminService.updateCounter(1, 1, validUpdateRequest)).rejects.toThrow('Counter not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if new name already exists', async () => {
      const existingCounter = {
        id: 1,
        location_id: 1,
        name: 'Old Counter',
        prefix: 'OC',
      };

      (mockCounterRepository.findById as Mock).mockResolvedValue(existingCounter);
      (mockCounterRepository.existsByNameInLocation as Mock).mockResolvedValue(true);

      await expect(adminService.updateCounter(1, 1, { name: 'Duplicate Name' }))
        .rejects.toThrow('Counter name already exists in this location');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('deleteCounter', () => {
    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should delete counter successfully', async () => {
      const existingCounter = {
        id: 1,
        location_id: 1,
        name: 'Test Counter',
      };

      (mockCounterRepository.findById as Mock).mockResolvedValue(existingCounter);
      (mockTicketRepository.findByCounterAndDate as Mock).mockResolvedValue([]);
      (mockCounterRepository.delete as Mock).mockResolvedValue(1);

      await adminService.deleteCounter(1, 1);

      expect(mockCounterRepository.findById).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockTicketRepository.findByCounterAndDate).toHaveBeenCalledWith(
        1,
        expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
        mockTransaction
      );
      expect(mockCounterRepository.delete).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw error if counter not found', async () => {
      (mockCounterRepository.findById as Mock).mockResolvedValue(null);

      await expect(adminService.deleteCounter(1, 1)).rejects.toThrow('Counter not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error if counter has existing tickets', async () => {
      const existingCounter = {
        id: 1,
        location_id: 1,
        name: 'Test Counter',
      };

      const existingTickets = [{ id: 1 }, { id: 2 }];

      (mockCounterRepository.findById as Mock).mockResolvedValue(existingCounter);
      (mockTicketRepository.findByCounterAndDate as Mock).mockResolvedValue(existingTickets);

      await expect(adminService.deleteCounter(1, 1)).rejects.toThrow('Cannot delete counter with existing tickets. Deactivate instead.');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getLocationCounters', () => {
    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should get location counters successfully', async () => {
      const mockCounters = [
        { id: 1, name: 'Counter 1' },
        { id: 2, name: 'Counter 2' },
      ];

      (mockCounterRepository.findByLocationId as Mock).mockResolvedValue(mockCounters);

      const result = await adminService.getLocationCounters(1, 1);

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockCounterRepository.findByLocationId).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockCounters);
    });
  });

  describe('getCountersWithStatus', () => {
    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should get counters with status successfully', async () => {
      const mockCountersWithStatus = [
        { id: 1, name: 'Counter 1', waiting: 5, serving: 1 },
        { id: 2, name: 'Counter 2', waiting: 3, serving: 0 },
      ];

      (mockCounterRepository.findAllWithStatus as Mock).mockResolvedValue(mockCountersWithStatus);

      const result = await adminService.getCountersWithStatus(1, 1, '2023-12-01');

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockCounterRepository.findAllWithStatus).toHaveBeenCalledWith(1, '2023-12-01', mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockCountersWithStatus);
    });

    it('should use current date if not provided', async () => {
      (mockCounterRepository.findAllWithStatus as Mock).mockResolvedValue([]);

      await adminService.getCountersWithStatus(1, 1);

      expect(mockCounterRepository.findAllWithStatus).toHaveBeenCalledWith(
        1,
        expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
        mockTransaction
      );
    });
  });

  describe('getQueueStatus', () => {
    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should get queue status successfully', async () => {
      const existingCounter = {
        id: 1,
        location_id: 1,
        name: 'Test Counter',
      };

      const mockQueueStatus = {
        waiting: 5,
        serving: 1,
        done: 10,
        cancelled: 2,
      };

      (mockCounterRepository.findById as Mock).mockResolvedValue(existingCounter);
      (mockTicketRepository.getQueueStatus as Mock).mockResolvedValue(mockQueueStatus);

      const result = await adminService.getQueueStatus(1, 1, '2023-12-01');

      expect(mockCounterRepository.findById).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockTicketRepository.getQueueStatus).toHaveBeenCalledWith(1, '2023-12-01', mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockQueueStatus);
    });

    it('should throw error if counter not found', async () => {
      (mockCounterRepository.findById as Mock).mockResolvedValue(null);

      await expect(adminService.getQueueStatus(1, 1)).rejects.toThrow('Counter not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getDailySummary', () => {
    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should get daily summary successfully', async () => {
      const mockSummary = {
        location_id: 1,
        date: '2023-12-01',
        total_tickets: 50,
        completed_tickets: 45,
        cancelled_tickets: 5,
      };

      (mockSummaryRepository.findByLocationAndDate as Mock).mockResolvedValue(mockSummary);

      const result = await adminService.getDailySummary(1, 1, '2023-12-01');

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockSummaryRepository.findByLocationAndDate).toHaveBeenCalledWith(1, '2023-12-01', mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getDashboardStats', () => {
    beforeEach(() => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue({ id: 1, name: 'Test Location' });
    });

    it('should get dashboard stats successfully', async () => {
      const mockStats = {
        totalTicketsToday: 50,
        completedTicketsToday: 45,
        activeCounters: 3,
        averageWaitTime: 15.5,
      };

      (mockSummaryRepository.getDashboardStats as Mock).mockResolvedValue(mockStats);

      const result = await adminService.getDashboardStats(1, 1, '2023-12-01');

      expect(mockLocationRepository.findByIdSimple).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockSummaryRepository.getDashboardStats).toHaveBeenCalledWith(1, '2023-12-01', mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('validateLocationAccess', () => {
    it('should throw error if location not found', async () => {
      (mockLocationRepository.findByIdSimple as Mock).mockResolvedValue(null);

      await expect(adminService.getLocationCounters(1, 999)).rejects.toThrow('Location not found');
    });
  });
});