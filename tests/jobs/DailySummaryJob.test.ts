import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { DailySummaryJob } from '../../src/server/jobs/DailySummaryJob';
import { DailySummaryRepository } from '../../src/server/repositories/DailySummaryRepository';
import { TicketRepository } from '../../src/server/repositories/TicketRepository';
import { CounterRepository } from '../../src/server/repositories/CounterRepository';
import { TicketStatus } from '../../src/server/models/ticket.model';

vi.mock('../../src/server/repositories/DailySummaryRepository');
vi.mock('../../src/server/repositories/TicketRepository');
vi.mock('../../src/server/repositories/CounterRepository');

vi.mock('../../src/server/db', () => ({
  sequelize: {
    query: vi.fn(),
    QueryTypes: { SELECT: 'SELECT' },
  },
}));

describe('DailySummaryJob', () => {
  let dailySummaryJob: DailySummaryJob;
  let mockDailySummaryRepository: DailySummaryRepository;
  let mockTicketRepository: TicketRepository;
  let mockCounterRepository: CounterRepository;
  let mockSequelize: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked sequelize instance
    const { sequelize } = await import('../../src/server/db');
    mockSequelize = sequelize;
    
    mockDailySummaryRepository = new DailySummaryRepository();
    mockTicketRepository = new TicketRepository();
    mockCounterRepository = new CounterRepository();
    
    dailySummaryJob = new DailySummaryJob();
    (dailySummaryJob as any).dailySummaryRepository = mockDailySummaryRepository;
    (dailySummaryJob as any).ticketRepository = mockTicketRepository;
    (dailySummaryJob as any).counterRepository = mockCounterRepository;
  });

  describe('generateDailySummary', () => {
    it('should generate daily summary for location successfully', async () => {
      vi.spyOn(dailySummaryJob, 'generateLocationSummary').mockResolvedValue();
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await dailySummaryJob.generateDailySummary(1, '2023-12-01');

      expect(dailySummaryJob.generateLocationSummary).toHaveBeenCalledWith(1, '2023-12-01');
      expect(console.log).toHaveBeenCalledWith('Starting daily summary generation for location 1 on 2023-12-01');
      expect(console.log).toHaveBeenCalledWith('Daily summary generation completed for location 1');
    });

    it('should use current date if not provided', async () => {
      vi.spyOn(dailySummaryJob, 'generateLocationSummary').mockResolvedValue();
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await dailySummaryJob.generateDailySummary(1);

      expect(dailySummaryJob.generateLocationSummary).toHaveBeenCalledWith(1, expect.stringMatching(/\d{4}-\d{2}-\d{2}/));
    });

    it('should handle and log errors', async () => {
      const error = new Error('Test error');
      vi.spyOn(dailySummaryJob, 'generateLocationSummary').mockRejectedValue(error);
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(dailySummaryJob.generateDailySummary(1, '2023-12-01')).rejects.toThrow('Test error');
      expect(console.error).toHaveBeenCalledWith('Error generating daily summary for location 1:', error);
    });
  });

  describe('generateLocationSummary', () => {
    const mockTickets = [
      {
        id: 1,
        status: TicketStatus.DONE,
        started_at: '2023-12-01T10:00:00.000Z',
        finished_at: '2023-12-01T10:15:00.000Z',
      },
      {
        id: 2,
        status: TicketStatus.DONE,
        started_at: '2023-12-01T11:00:00.000Z',
        finished_at: '2023-12-01T11:10:00.000Z',
      },
      {
        id: 3,
        status: TicketStatus.HOLD,
        started_at: null,
        finished_at: null,
      },
      {
        id: 4,
        status: TicketStatus.CANCELLED,
        started_at: null,
        finished_at: null,
      },
      {
        id: 5,
        status: TicketStatus.WAITING,
        started_at: null,
        finished_at: null,
      },
    ];

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should create new summary when none exists', async () => {
      mockSequelize.query.mockResolvedValue(mockTickets);
      (mockDailySummaryRepository.findByLocationAndDate as Mock).mockResolvedValue(null);
      (mockDailySummaryRepository.create as Mock).mockResolvedValue({});

      await dailySummaryJob.generateLocationSummary(1, '2023-12-01');

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          replacements: [1, expect.any(Date), expect.any(Date)],
          type: 'SELECT',
        })
      );

      expect(mockDailySummaryRepository.create).toHaveBeenCalledWith({
        location_id: 1,
        date_for: '2023-12-01',
        total_issued: 5,
        total_done: 2,
        total_hold: 1,
        total_cancel: 1,
        avg_service_seconds: 750, // (15*60 + 10*60) / 2 = 750
      });

      expect(console.log).toHaveBeenCalledWith('Created daily summary for location 1 on 2023-12-01');
    });

    it('should update existing summary', async () => {
      const existingSummary = {
        id: 1,
        location_id: 1,
        date_for: '2023-12-01',
      };

      mockSequelize.query.mockResolvedValue(mockTickets);
      (mockDailySummaryRepository.findByLocationAndDate as Mock).mockResolvedValue(existingSummary);
      (mockDailySummaryRepository.update as Mock).mockResolvedValue({});

      await dailySummaryJob.generateLocationSummary(1, '2023-12-01');

      expect(mockDailySummaryRepository.update).toHaveBeenCalledWith(1, {
        location_id: 1,
        date_for: '2023-12-01',
        total_issued: 5,
        total_done: 2,
        total_hold: 1,
        total_cancel: 1,
        avg_service_seconds: 750,
      });

      expect(console.log).toHaveBeenCalledWith('Updated daily summary for location 1 on 2023-12-01');
    });

    it('should handle empty ticket list', async () => {
      mockSequelize.query.mockResolvedValue([]);
      (mockDailySummaryRepository.findByLocationAndDate as Mock).mockResolvedValue(null);
      (mockDailySummaryRepository.create as Mock).mockResolvedValue({});

      await dailySummaryJob.generateLocationSummary(1, '2023-12-01');

      expect(mockDailySummaryRepository.create).toHaveBeenCalledWith({
        location_id: 1,
        date_for: '2023-12-01',
        total_issued: 0,
        total_done: 0,
        total_hold: 0,
        total_cancel: 0,
        avg_service_seconds: 0,
      });
    });

    it('should handle tickets without service time', async () => {
      const ticketsWithoutServiceTime = [
        {
          id: 1,
          status: TicketStatus.DONE,
          started_at: null,
          finished_at: null,
        },
        {
          id: 2,
          status: TicketStatus.WAITING,
          started_at: null,
          finished_at: null,
        },
      ];

      mockSequelize.query.mockResolvedValue(ticketsWithoutServiceTime);
      (mockDailySummaryRepository.findByLocationAndDate as Mock).mockResolvedValue(null);
      (mockDailySummaryRepository.create as Mock).mockResolvedValue({});

      await dailySummaryJob.generateLocationSummary(1, '2023-12-01');

      expect(mockDailySummaryRepository.create).toHaveBeenCalledWith({
        location_id: 1,
        date_for: '2023-12-01',
        total_issued: 2,
        total_done: 1,
        total_hold: 0,
        total_cancel: 0,
        avg_service_seconds: 0, // No valid service times
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockSequelize.query.mockRejectedValue(error);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(dailySummaryJob.generateLocationSummary(1, '2023-12-01')).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('Error generating summary for location 1 on 2023-12-01:', error);
    });
  });

  describe('generateSummariesForAllLocations', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should generate summaries for all unique locations', async () => {
      const mockCounters = [
        { id: 1, location_id: 1 },
        { id: 2, location_id: 1 }, // Duplicate location
        { id: 3, location_id: 2 },
        { id: 4, location_id: 3 },
      ];

      (mockCounterRepository.findAll as Mock).mockResolvedValue(mockCounters);
      vi.spyOn(dailySummaryJob, 'generateDailySummary').mockResolvedValue();

      await dailySummaryJob.generateSummariesForAllLocations('2023-12-01');

      expect(mockCounterRepository.findAll).toHaveBeenCalled();
      expect(dailySummaryJob.generateDailySummary).toHaveBeenCalledTimes(3); // Only unique location IDs
      expect(dailySummaryJob.generateDailySummary).toHaveBeenCalledWith(1, '2023-12-01');
      expect(dailySummaryJob.generateDailySummary).toHaveBeenCalledWith(2, '2023-12-01');
      expect(dailySummaryJob.generateDailySummary).toHaveBeenCalledWith(3, '2023-12-01');
      expect(console.log).toHaveBeenCalledWith('Generating daily summaries for all locations on 2023-12-01');
      expect(console.log).toHaveBeenCalledWith('Completed daily summary generation for all locations');
    });

    it('should use current date if not provided', async () => {
      (mockCounterRepository.findAll as Mock).mockResolvedValue([]);
      vi.spyOn(dailySummaryJob, 'generateDailySummary').mockResolvedValue();

      await dailySummaryJob.generateSummariesForAllLocations();

      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/Generating daily summaries for all locations on \d{4}-\d{2}-\d{2}/));
    });

    it('should handle errors', async () => {
      const error = new Error('Counter fetch error');
      (mockCounterRepository.findAll as Mock).mockRejectedValue(error);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(dailySummaryJob.generateSummariesForAllLocations()).rejects.toThrow('Counter fetch error');
      expect(console.error).toHaveBeenCalledWith('Error generating daily summaries for all locations:', error);
    });
  });

  describe('cleanupOldSummaries', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should cleanup old summaries successfully', async () => {
      (mockDailySummaryRepository.deleteOlderThan as Mock).mockResolvedValue(5);

      await dailySummaryJob.cleanupOldSummaries(30);

      expect(mockDailySummaryRepository.deleteOlderThan).toHaveBeenCalledWith(expect.any(Date));
      expect(console.log).toHaveBeenCalledWith('Cleaned up 5 old daily summaries older than 30 days');
    });

    it('should use default retention period', async () => {
      (mockDailySummaryRepository.deleteOlderThan as Mock).mockResolvedValue(10);

      await dailySummaryJob.cleanupOldSummaries();

      expect(mockDailySummaryRepository.deleteOlderThan).toHaveBeenCalledWith(expect.any(Date));
      expect(console.log).toHaveBeenCalledWith('Cleaned up 10 old daily summaries older than 90 days');
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup error');
      (mockDailySummaryRepository.deleteOlderThan as Mock).mockRejectedValue(error);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(dailySummaryJob.cleanupOldSummaries()).rejects.toThrow('Cleanup error');
      expect(console.error).toHaveBeenCalledWith('Error cleaning up old summaries:', error);
    });

    it('should calculate correct cutoff date', async () => {
      const mockDate = new Date('2023-12-01');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      (mockDailySummaryRepository.deleteOlderThan as Mock).mockResolvedValue(0);

      await dailySummaryJob.cleanupOldSummaries(30);

      const expectedCutoffDate = new Date('2023-11-01'); // 30 days before 2023-12-01
      expect(mockDailySummaryRepository.deleteOlderThan).toHaveBeenCalledWith(expectedCutoffDate);

      vi.useRealTimers();
    });
  });

  describe('runDailyJob', () => {
    it('should run daily job successfully', async () => {
      vi.spyOn(DailySummaryJob.prototype, 'generateSummariesForAllLocations').mockResolvedValue();
      vi.spyOn(DailySummaryJob.prototype, 'cleanupOldSummaries').mockResolvedValue();

      await DailySummaryJob.runDailyJob();

      expect(DailySummaryJob.prototype.generateSummariesForAllLocations).toHaveBeenCalled();
      expect(DailySummaryJob.prototype.cleanupOldSummaries).toHaveBeenCalled();
    });

    it('should handle job errors', async () => {
      const error = new Error('Job error');
      vi.spyOn(DailySummaryJob.prototype, 'generateSummariesForAllLocations').mockRejectedValue(error);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(DailySummaryJob.runDailyJob()).rejects.toThrow('Job error');
      expect(console.error).toHaveBeenCalledWith('Daily summary job failed:', error);
    });
  });
});