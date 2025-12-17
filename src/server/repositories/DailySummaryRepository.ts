/* FILE: src/server/repositories/DailySummaryRepository.ts */
import { Transaction, Op, QueryTypes } from 'sequelize';
import { sequelize } from '../db';
import { DailySummary, DailySummaryAttributes, DailySummaryCreationAttributes } from '../models/daily_summary.model';
import { Counter } from '../models/counter.model';

export class DailySummaryRepository {
  /**
   * Create a new daily summary
   */
  async create(summaryData: DailySummaryCreationAttributes, transaction?: Transaction): Promise<DailySummary> {
    return DailySummary.create(summaryData, { transaction });
  }

  /**
   * Update an existing daily summary
   */
  async update(
    id: number,
    updates: Partial<DailySummaryAttributes>,
    transaction?: Transaction
  ): Promise<[number, DailySummary[]]> {
    return DailySummary.update(updates, {
      where: { id },
      returning: true,
      transaction,
    });
  }

  /**
   * Find summary by location and date
   */
  async findByLocationAndDate(
    locationId: number,
    date: string,
    transaction?: Transaction
  ): Promise<DailySummary | null> {
    return DailySummary.findOne({
      where: {
        location_id: locationId,
        date_for: date,
      },
      transaction,
    });
  }

  /**
   * Find summaries by location and date range
   */
  async findByLocationAndDateRange(
    locationId: number,
    startDate: Date,
    endDate: Date,
    transaction?: Transaction
  ): Promise<DailySummary[]> {
    return DailySummary.findAll({
      include: [
        {
          model: Counter,
          as: 'counter',
          attributes: ['id', 'name', 'prefix'],
          where: { location_id: locationId },
        },
      ],
      where: {
        date_for: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['date', 'DESC'], ['counter_id', 'ASC']],
      transaction,
    });
  }

  /**
   * Delete summaries older than specified date
   */
  async deleteOlderThan(cutoffDate: Date, transaction?: Transaction): Promise<number> {
    return DailySummary.destroy({
      where: {
        date_for: { [Op.lt]: cutoffDate },
      },
      transaction,
    });
  }

  /**
   * Get summary statistics for location
   */
  async getLocationStats(
    locationId: number,
    startDate: Date,
    endDate: Date,
    transaction?: Transaction
  ): Promise<{
    totalTicketsIssued: number;
    totalTicketsServed: number;
    avgWaitTime: number;
    avgServiceTime: number;
  }> {
    const results = await sequelize.query(`
      SELECT 
        SUM(total_tickets_issued) as total_issued,
        SUM(total_tickets_served) as total_served,
        AVG(avg_wait_time_ms) as avg_wait_time,
        AVG(avg_service_time_ms) as avg_service_time
      FROM daily_summaries ds
      JOIN counters c ON ds.counter_id = c.id
      WHERE c.location_id = ? 
        AND ds.date BETWEEN ? AND ?
    `, {
      replacements: [locationId, startDate, endDate],
      type: QueryTypes.SELECT,
      transaction,
    }) as Array<{
      total_issued: string;
      total_served: string;
      avg_wait_time: string;
      avg_service_time: string;
    }>;

    const result = results[0];
    return {
      totalTicketsIssued: parseInt(result?.total_issued || '0'),
      totalTicketsServed: parseInt(result?.total_served || '0'),
      avgWaitTime: parseFloat(result?.avg_wait_time || '0'),
      avgServiceTime: parseFloat(result?.avg_service_time || '0'),
    };
  }
}