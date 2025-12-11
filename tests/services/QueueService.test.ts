import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { QueueService, IssueTicketRequest, CallNextResponse } from '../../src/server/services/QueueService';
import { TicketRepository } from '../../src/server/repositories/TicketRepository';
import { EventRepository } from '../../src/server/repositories/EventRepository';
import { CounterRepository } from '../../src/server/repositories/CounterRepository';
import { TicketStatus } from '../../src/server/models/ticket.model';
import { EventType } from '../../src/server/models/ticket_event.model';
import { Transaction } from 'sequelize';

vi.mock('../../src/server/repositories/TicketRepository');
vi.mock('../../src/server/repositories/EventRepository');
vi.mock('../../src/server/repositories/CounterRepository');
vi.mock('../../src/server/db', () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));

describe('QueueService', () => {
  let queueService: QueueService;
  let mockTicketRepository: TicketRepository;
  let mockEventRepository: EventRepository;
  let mockCounterRepository: CounterRepository;
  let mockTransaction: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockTransaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
    };

    const { sequelize } = await import('../../src/server/db');
    sequelize.transaction.mockImplementation((options, callback) => {
      if (typeof options === 'function') {
        return options(mockTransaction);
      }
      return callback(mockTransaction);
    });

    mockTicketRepository = new TicketRepository();
    mockEventRepository = new EventRepository();
    mockCounterRepository = new CounterRepository();
    
    queueService = new QueueService();
    (queueService as any).ticketRepository = mockTicketRepository;
    (queueService as any).eventRepository = mockEventRepository;
    (queueService as any).counterRepository = mockCounterRepository;
  });

  describe('issue', () => {
    const validIssueRequest: IssueTicketRequest = {
      locationId: 1,
      counterId: 1,
      userId: 1,
      dateFor: '2023-12-01',
    };

    it('should issue a new ticket successfully', async () => {
      const mockCounter = {
        id: 1,
        name: 'Counter 1',
        is_active: true,
      };

      const mockCapacityStatus = {
        isAtCapacity: false,
        currentCount: 5,
        maxCapacity: 100,
      };

      const mockTicket = {
        id: 1,
        location_id: 1,
        counter_id: 1,
        user_id: 1,
        date_for: '2023-12-01',
        status: TicketStatus.WAITING,
        sequence: 6,
        queue_number: 'A006',
      };

      (mockCounterRepository.findById as Mock).mockResolvedValue(mockCounter);
      (mockCounterRepository.getCapacityStatus as Mock).mockResolvedValue(mockCapacityStatus);
      (mockTicketRepository.createTicket as Mock).mockResolvedValue(mockTicket);
      (mockEventRepository.create as Mock).mockResolvedValue({});

      const result = await queueService.issue(validIssueRequest);

      expect(mockCounterRepository.findById).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockCounterRepository.getCapacityStatus).toHaveBeenCalledWith(1, '2023-12-01', mockTransaction);
      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith({
        location_id: 1,
        counter_id: 1,
        user_id: 1,
        date_for: '2023-12-01',
        status: TicketStatus.WAITING,
        sequence: 0,
        queue_number: '',
      }, mockTransaction);
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ticket_id: 1,
        actor_id: 1,
        event_type: EventType.ISSUED,
        note: 'Ticket issued for Counter 1',
      }, mockTransaction);
      expect(result).toEqual(mockTicket);
    });

    it('should throw error if counter not found', async () => {
      (mockCounterRepository.findById as Mock).mockResolvedValue(null);

      await expect(queueService.issue(validIssueRequest)).rejects.toThrow('Counter not found or inactive');
    });

    it('should throw error if counter is inactive', async () => {
      const inactiveCounter = {
        id: 1,
        name: 'Counter 1',
        is_active: false,
      };

      (mockCounterRepository.findById as Mock).mockResolvedValue(inactiveCounter);

      await expect(queueService.issue(validIssueRequest)).rejects.toThrow('Counter not found or inactive');
    });

    it('should throw error if counter is at capacity', async () => {
      const mockCounter = {
        id: 1,
        name: 'Counter 1',
        is_active: true,
      };

      const atCapacityStatus = {
        isAtCapacity: true,
        currentCount: 100,
        maxCapacity: 100,
      };

      (mockCounterRepository.findById as Mock).mockResolvedValue(mockCounter);
      (mockCounterRepository.getCapacityStatus as Mock).mockResolvedValue(atCapacityStatus);

      await expect(queueService.issue(validIssueRequest)).rejects.toThrow('Counter has reached daily capacity');
    });
  });

  describe('callNext', () => {
    it('should call next waiting ticket successfully', async () => {
      const mockWaitingTicket = {
        id: 1,
        queue_number: 'A001',
        status: TicketStatus.WAITING,
      };

      const mockUpdatedTicket = {
        id: 1,
        queue_number: 'A001',
        status: TicketStatus.CALLING,
        called_at: expect.any(Date),
        started_at: expect.any(Date),
      };

      (mockTicketRepository.getNextWaitingTicket as Mock).mockResolvedValue(mockWaitingTicket);
      (mockTicketRepository.updateStatus as Mock).mockResolvedValue({});
      (mockEventRepository.create as Mock).mockResolvedValue({});
      (mockTicketRepository.findById as Mock).mockResolvedValue(mockUpdatedTicket);

      const result = await queueService.callNext(1, 1);

      expect(mockTicketRepository.getNextWaitingTicket).toHaveBeenCalledWith(1, mockTransaction);
      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
        1,
        TicketStatus.CALLING,
        {
          called_at: expect.any(Date),
          started_at: expect.any(Date),
        },
        mockTransaction
      );
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ticket_id: 1,
        actor_id: 1,
        event_type: EventType.CALLED,
        note: 'Ticket called by staff',
      }, mockTransaction);
      expect(result).toEqual({
        ticket: mockUpdatedTicket,
        queueNumber: 'A001',
        message: 'Called ticket A001',
      });
    });

    it('should return no tickets message when queue is empty', async () => {
      (mockTicketRepository.getNextWaitingTicket as Mock).mockResolvedValue(null);

      const result = await queueService.callNext(1, 1);

      expect(result).toEqual({
        ticket: null,
        message: 'No tickets waiting in queue',
      });
    });
  });

  describe('hold', () => {
    it('should hold a calling ticket successfully', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.CALLING,
      };

      const mockHeldTicket = {
        id: 1,
        status: TicketStatus.HOLD,
        hold_reason: 'Customer not present',
      };

      (mockTicketRepository.findById as Mock)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockHeldTicket);
      (mockTicketRepository.updateStatus as Mock).mockResolvedValue({});
      (mockEventRepository.create as Mock).mockResolvedValue({});

      const result = await queueService.hold(1, 'Customer not present', 1);

      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
        1,
        TicketStatus.HOLD,
        { hold_reason: 'Customer not present' },
        mockTransaction
      );
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ticket_id: 1,
        actor_id: 1,
        event_type: EventType.HELD,
        note: 'Customer not present',
      }, mockTransaction);
      expect(result).toEqual(mockHeldTicket);
    });

    it('should throw error if ticket not found', async () => {
      (mockTicketRepository.findById as Mock).mockResolvedValue(null);

      await expect(queueService.hold(1, 'reason', 1)).rejects.toThrow('Ticket not found');
    });

    it('should throw error if ticket cannot be held', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.WAITING,
      };

      (mockTicketRepository.findById as Mock).mockResolvedValue(mockTicket);

      await expect(queueService.hold(1, 'reason', 1)).rejects.toThrow('Can only hold tickets that are being called or served');
    });
  });

  describe('resume', () => {
    it('should resume a held ticket successfully', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.HOLD,
      };

      const mockResumedTicket = {
        id: 1,
        status: TicketStatus.WAITING,
        hold_reason: null,
        called_at: null,
        started_at: null,
      };

      (mockTicketRepository.findById as Mock)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockResumedTicket);
      (mockTicketRepository.updateStatus as Mock).mockResolvedValue({});
      (mockEventRepository.create as Mock).mockResolvedValue({});

      const result = await queueService.resume(1, 1);

      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
        1,
        TicketStatus.WAITING,
        {
          hold_reason: null,
          called_at: null,
          started_at: null,
        },
        mockTransaction
      );
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ticket_id: 1,
        actor_id: 1,
        event_type: EventType.RESUMED,
        note: 'Ticket resumed and returned to queue',
      }, mockTransaction);
      expect(result).toEqual(mockResumedTicket);
    });

    it('should throw error if ticket is not on hold', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.WAITING,
      };

      (mockTicketRepository.findById as Mock).mockResolvedValue(mockTicket);

      await expect(queueService.resume(1, 1)).rejects.toThrow('Can only resume tickets that are on hold');
    });
  });

  describe('done', () => {
    it('should mark ticket as done successfully', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.SERVING,
      };

      const mockDoneTicket = {
        id: 1,
        status: TicketStatus.DONE,
        finished_at: expect.any(Date),
      };

      (mockTicketRepository.findById as Mock)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockDoneTicket);
      (mockTicketRepository.updateStatus as Mock).mockResolvedValue({});
      (mockEventRepository.create as Mock).mockResolvedValue({});

      const result = await queueService.done(1, 1);

      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
        1,
        TicketStatus.DONE,
        { finished_at: expect.any(Date) },
        mockTransaction
      );
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ticket_id: 1,
        actor_id: 1,
        event_type: EventType.DONE,
        note: 'Service completed',
      }, mockTransaction);
      expect(result).toEqual(mockDoneTicket);
    });

    it('should throw error if ticket cannot be completed', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.WAITING,
      };

      (mockTicketRepository.findById as Mock).mockResolvedValue(mockTicket);

      await expect(queueService.done(1, 1)).rejects.toThrow('Can only complete tickets that are being served');
    });
  });

  describe('cancel', () => {
    it('should cancel a ticket successfully', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.WAITING,
      };

      const mockCancelledTicket = {
        id: 1,
        status: TicketStatus.CANCELLED,
        hold_reason: 'User requested cancellation',
      };

      (mockTicketRepository.findById as Mock)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockCancelledTicket);
      (mockTicketRepository.updateStatus as Mock).mockResolvedValue({});
      (mockEventRepository.create as Mock).mockResolvedValue({});

      const result = await queueService.cancel(1, 'User requested cancellation', 1);

      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
        1,
        TicketStatus.CANCELLED,
        { hold_reason: 'User requested cancellation' },
        mockTransaction
      );
      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ticket_id: 1,
        actor_id: 1,
        event_type: EventType.CANCELLED,
        note: 'User requested cancellation',
      }, mockTransaction);
      expect(result).toEqual(mockCancelledTicket);
    });

    it('should throw error if ticket is already done', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.DONE,
      };

      (mockTicketRepository.findById as Mock).mockResolvedValue(mockTicket);

      await expect(queueService.cancel(1, 'reason', 1)).rejects.toThrow('Cannot cancel completed or already cancelled tickets');
    });
  });

  describe('startServing', () => {
    it('should start serving a calling ticket successfully', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.CALLING,
      };

      const mockServingTicket = {
        id: 1,
        status: TicketStatus.SERVING,
        started_at: expect.any(Date),
      };

      (mockTicketRepository.findById as Mock)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(mockServingTicket);
      (mockTicketRepository.updateStatus as Mock).mockResolvedValue({});

      const result = await queueService.startServing(1, 1);

      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
        1,
        TicketStatus.SERVING,
        { started_at: expect.any(Date) },
        mockTransaction
      );
      expect(result).toEqual(mockServingTicket);
    });

    it('should throw error if ticket is not being called', async () => {
      const mockTicket = {
        id: 1,
        status: TicketStatus.WAITING,
      };

      (mockTicketRepository.findById as Mock).mockResolvedValue(mockTicket);

      await expect(queueService.startServing(1, 1)).rejects.toThrow('Can only start serving tickets that are being called');
    });
  });

  describe('getQueueStatus', () => {
    it('should get queue status successfully', async () => {
      const mockQueueStatus = {
        waiting: 5,
        serving: 2,
        done: 10,
      };

      (mockTicketRepository.getQueueStatus as Mock).mockResolvedValue(mockQueueStatus);

      const result = await queueService.getQueueStatus(1, '2023-12-01');

      expect(mockTicketRepository.getQueueStatus).toHaveBeenCalledWith(1, '2023-12-01');
      expect(result).toEqual(mockQueueStatus);
    });

    it('should use current date if not provided', async () => {
      const mockQueueStatus = {
        waiting: 5,
        serving: 2,
        done: 10,
      };

      (mockTicketRepository.getQueueStatus as Mock).mockResolvedValue(mockQueueStatus);

      const result = await queueService.getQueueStatus(1);

      expect(mockTicketRepository.getQueueStatus).toHaveBeenCalledWith(1, expect.stringMatching(/\d{4}-\d{2}-\d{2}/));
      expect(result).toEqual(mockQueueStatus);
    });
  });

  describe('getEstimatedWaitTime', () => {
    it('should calculate estimated wait time successfully', async () => {
      const mockTicket = {
        id: 1,
        counter_id: 1,
        sequence: 5,
        date_for: '2023-12-01',
      };

      const mockWaitTime = {
        estimatedMinutes: 15,
        position: 3,
      };

      (mockTicketRepository.findById as Mock).mockResolvedValue(mockTicket);
      (mockTicketRepository.getEstimatedWaitTime as Mock).mockResolvedValue(mockWaitTime);

      const result = await queueService.getEstimatedWaitTime(1);

      expect(mockTicketRepository.findById).toHaveBeenCalledWith(1);
      expect(mockTicketRepository.getEstimatedWaitTime).toHaveBeenCalledWith(1, 5, '2023-12-01');
      expect(result).toEqual(mockWaitTime);
    });

    it('should throw error if ticket not found', async () => {
      (mockTicketRepository.findById as Mock).mockResolvedValue(null);

      await expect(queueService.getEstimatedWaitTime(1)).rejects.toThrow('Ticket not found');
    });
  });
});