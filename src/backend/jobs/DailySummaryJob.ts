/* FILE: src/server/jobs/DailySummaryJob.ts */
import { DailySummaryRepository } from '../repositories/DailySummaryRepository';
import { CounterRepository } from '../repositories/CounterRepository';
import { TicketStatus } from '../models/ticket.model';
import { sequelize } from '../db';

export class DailySummaryJob {
  private dailySummaryRepository: DailySummaryRepository;
  private counterRepository: CounterRepository;

  constructor() {
    this.dailySummaryRepository = new DailySummaryRepository();
    this.counterRepository = new CounterRepository();
  }

  async generateDailySummary(locationId: number, date?: string): Promise<void> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      console.log(`Starting daily summary generation for location ${locationId} on ${targetDate}`);

      await this.generateLocationSummary(locationId, targetDate);

      console.log(`Daily summary generation completed for location ${locationId}`);
    } catch (error) {
      console.error(`Error generating daily summary for location ${locationId}:`, error);
      throw error;
    }
  }

  async generateLocationSummary(locationId: number, date: string): Promise<void> {
    try {
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);

      // Get all tickets for all counters in this location
      const tickets = await sequelize.query(`
        SELECT t.* FROM tickets t
        JOIN counters c ON t.counter_id = c.id
        WHERE c.location_id = ? 
          AND t.created_at >= ? 
          AND t.created_at <= ?
      `, {
        replacements: [locationId, startDate, endDate],
        type: (sequelize as any).QueryTypes.SELECT,
      });

      const totalTicketsIssued = tickets.length;
      const totalTicketsServed = tickets.filter((t: any) => t.status === TicketStatus.DONE).length;
      const totalTicketsHold = tickets.filter((t: any) => t.status === TicketStatus.HOLD).length;
      const totalTicketsCancelled = tickets.filter((t: any) => t.status === TicketStatus.CANCELLED).length;

      let totalServiceTime = 0;
      let servedTicketsCount = 0;

      for (const ticket of tickets) {
        const t = ticket as any;
        if (t.started_at && t.finished_at) {
          const serviceTime = new Date(t.finished_at).getTime() - new Date(t.started_at).getTime();
          totalServiceTime += serviceTime;
          servedTicketsCount++;
        }
      }

      const avgServiceTimeSeconds = servedTicketsCount > 0 ? Math.round(totalServiceTime / 1000 / servedTicketsCount) : 0;
      
      const summaryData = {
        location_id: locationId,
        date_for: date,
        total_issued: totalTicketsIssued,
        total_done: totalTicketsServed,
        total_hold: totalTicketsHold,
        total_cancel: totalTicketsCancelled,
        avg_service_seconds: avgServiceTimeSeconds,
      };

      const existingSummary = await this.dailySummaryRepository.findByLocationAndDate(
        locationId,
        date
      );

      if (existingSummary) {
        await this.dailySummaryRepository.update(existingSummary.id, summaryData);
        console.log(`Updated daily summary for location ${locationId} on ${date}`);
      } else {
        await this.dailySummaryRepository.create(summaryData);
        console.log(`Created daily summary for location ${locationId} on ${date}`);
      }
    } catch (error) {
      console.error(`Error generating summary for location ${locationId} on ${date}:`, error);
      throw error;
    }
  }


  async generateSummariesForAllLocations(date?: string): Promise<void> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Generating daily summaries for all locations on ${targetDate}`);

      const counters = await this.counterRepository.findAll();
      const locationIds = [...new Set(counters.map((c: any) => c.location_id))];

      for (const locationId of locationIds) {
        await this.generateDailySummary(locationId as number, targetDate);
      }

      console.log(`Completed daily summary generation for all locations`);
    } catch (error) {
      console.error('Error generating daily summaries for all locations:', error);
      throw error;
    }
  }

  async cleanupOldSummaries(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await this.dailySummaryRepository.deleteOlderThan(cutoffDate);
      
      console.log(`Cleaned up ${deletedCount} old daily summaries older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error cleaning up old summaries:', error);
      throw error;
    }
  }

  static async runDailyJob(): Promise<void> {
    const job = new DailySummaryJob();
    
    try {
      await job.generateSummariesForAllLocations();
      await job.cleanupOldSummaries();
    } catch (error) {
      console.error('Daily summary job failed:', error);
      throw error;
    }
  }
}