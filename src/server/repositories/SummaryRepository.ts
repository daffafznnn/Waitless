/* FILE: src/server/repositories/SummaryRepository.ts */
import { Transaction, Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../db';
import { DailySummary, DailySummaryCreationAttributes } from '../models/daily_summary.model';
import { ServiceLocation } from '../models/service_location.model';

export class SummaryRepository {
  /**
   * Create or update daily summary
   */
  async upsert(summaryData: DailySummaryCreationAttributes, transaction?: Transaction): Promise<[DailySummary, boolean]> {
    return DailySummary.upsert(summaryData, { transaction }) as Promise<[DailySummary, boolean]>;
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
      include: [
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'name'],
        },
      ],
      transaction,
    });
  }

  /**
   * Get summaries for a location within date range
   */
  async findByLocationAndDateRange(
    locationId: number,
    startDate: string,
    endDate: string,
    transaction?: Transaction
  ): Promise<DailySummary[]> {
    
    return DailySummary.findAll({
      where: {
        location_id: locationId,
        date_for: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['date_for', 'DESC']],
      transaction,
    });
  }

  /**
   * Get summaries for multiple locations on a specific date
   */
  async findByDate(date: string, transaction?: Transaction): Promise<DailySummary[]> {
    return DailySummary.findAll({
      where: { date_for: date },
      include: [
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'name'],
        },
      ],
      order: [['total_issued', 'DESC']],
      transaction,
    });
  }

  /**
   * Calculate and create/update daily summary for a location
   */
  async calculateAndStoreDailySummary(
    locationId: number,
    date: string,
    transaction?: Transaction
  ): Promise<DailySummary> {
    
    // Calculate summary statistics from tickets
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(CASE WHEN status IN ('WAITING', 'CALLING', 'SERVING', 'HOLD', 'DONE', 'CANCELLED') THEN 1 END) as total_issued,
        COUNT(CASE WHEN status = 'DONE' THEN 1 END) as total_done,
        COUNT(CASE WHEN status = 'HOLD' THEN 1 END) as total_hold,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as total_cancel,
        COALESCE(AVG(
          CASE 
            WHEN status = 'DONE' AND started_at IS NOT NULL AND finished_at IS NOT NULL 
            THEN TIMESTAMPDIFF(SECOND, started_at, finished_at)
          END
        ), 0) as avg_service_seconds
      FROM tickets 
      WHERE location_id = ? AND date_for = ?
    `, {
      replacements: [locationId, date],
      type: sequelize.QueryTypes.SELECT,
      transaction,
    });

    const summaryData: DailySummaryCreationAttributes = {
      location_id: locationId,
      date_for: date,
      total_issued: parseInt(summary?.total_issued || '0'),
      total_done: parseInt(summary?.total_done || '0'),
      total_hold: parseInt(summary?.total_hold || '0'),
      total_cancel: parseInt(summary?.total_cancel || '0'),
      avg_service_seconds: Math.round(parseFloat(summary?.avg_service_seconds || '0')),
    };

    const [dailySummary] = await this.upsert(summaryData, transaction);
    return dailySummary;
  }

  /**
   * Get aggregated statistics for a location over a date range
   */
  async getAggregatedStats(
    locationId: number,
    startDate: string,
    endDate: string,
    transaction?: Transaction
  ): Promise<{
    totalIssued: number;
    totalDone: number;
    totalHold: number;
    totalCancel: number;
    avgServiceSeconds: number;
    completionRate: number;
    daysCount: number;
  }> {
    
    const stats = await DailySummary.findOne({
      attributes: [
        [fn('SUM', col('total_issued')), 'totalIssued'],
        [fn('SUM', col('total_done')), 'totalDone'],
        [fn('SUM', col('total_hold')), 'totalHold'],
        [fn('SUM', col('total_cancel')), 'totalCancel'],
        [fn('AVG', col('avg_service_seconds')), 'avgServiceSeconds'],
        [fn('COUNT', '*'), 'daysCount'],
      ],
      where: {
        location_id: locationId,
        date_for: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true,
      transaction,
    });

    const totalIssued = parseInt(String(stats?.total_issued || '0'));
    const totalDone = parseInt(String(stats?.total_done || '0'));
    const completionRate = totalIssued > 0 ? (totalDone / totalIssued) * 100 : 0;

    return {
      totalIssued,
      totalDone: totalDone,
      totalHold: parseInt(String(stats?.total_hold || '0')),
      totalCancel: parseInt(String(stats?.total_cancel || '0')),
      avgServiceSeconds: Math.round(parseFloat(String(stats?.avg_service_seconds || '0'))),
      completionRate: Math.round(completionRate * 100) / 100,
      daysCount: parseInt(String((stats as any)?.daysCount || '0')),
    };
  }

  /**
   * Get top performing locations by completion rate
   */
  async getTopPerformingLocations(
    date: string,
    limit: number = 10,
    transaction?: Transaction
  ): Promise<Array<DailySummary & { completionRate: number }>> {
    
    const summaries = await DailySummary.findAll({
      where: { date_for: date },
      attributes: {
        include: [
          [
            literal('CASE WHEN total_issued > 0 THEN (total_done * 100.0 / total_issued) ELSE 0 END'),
            'completionRate'
          ]
        ]
      },
      include: [
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'name', 'city'],
        },
      ],
      order: [
        [literal('completionRate'), 'DESC'],
        ['total_done', 'DESC']
      ],
      limit,
      transaction,
    });

    return summaries.map(summary => ({
      ...summary.toJSON(),
      completionRate: parseFloat(summary.get('completionRate') as string),
    })) as Array<DailySummary & { completionRate: number }>;
  }

  /**
   * Get summary statistics for dashboard
   */
  async getDashboardStats(
    locationId: number,
    date: string,
    transaction?: Transaction
  ): Promise<{
    today: DailySummary | null;
    yesterday?: DailySummary | null;
    thisWeek: {
      totalIssued: number;
      totalDone: number;
      avgServiceSeconds: number;
      completionRate: number;
    };
    thisMonth: {
      totalIssued: number;
      totalDone: number;
      avgServiceSeconds: number;
      completionRate: number;
    };
  }> {
    // Get today's summary
    const today = await this.findByLocationAndDate(locationId, date, transaction);

    // Get yesterday's summary
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdaySummary = await this.findByLocationAndDate(locationId, yesterdayStr, transaction);

    // Get this week's stats (last 7 days)
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const thisWeekStats = await this.getAggregatedStats(locationId, weekStartStr, date, transaction);

    // Get this month's stats
    const monthStart = new Date(date);
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const thisMonthStats = await this.getAggregatedStats(locationId, monthStartStr, date, transaction);

    return {
      today,
      yesterday: yesterdaySummary,
      thisWeek: {
        totalIssued: thisWeekStats.totalIssued,
        totalDone: thisWeekStats.totalDone,
        avgServiceSeconds: thisWeekStats.avgServiceSeconds,
        completionRate: thisWeekStats.completionRate,
      },
      thisMonth: {
        totalIssued: thisMonthStats.totalIssued,
        totalDone: thisMonthStats.totalDone,
        avgServiceSeconds: thisMonthStats.avgServiceSeconds,
        completionRate: thisMonthStats.completionRate,
      },
    };
  }

  /**
   * Delete summary
   */
  async delete(locationId: number, date: string, transaction?: Transaction): Promise<number> {
    return DailySummary.destroy({
      where: {
        location_id: locationId,
        date_for: date,
      },
      transaction,
    });
  }

  /**
   * Bulk calculate summaries for multiple dates
   */
  async bulkCalculateSummaries(
    locationId: number,
    startDate: string,
    endDate: string,
    transaction?: Transaction
  ): Promise<DailySummary[]> {
    const summaries: DailySummary[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const summary = await this.calculateAndStoreDailySummary(locationId, dateStr, transaction);
      summaries.push(summary);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return summaries;
  }
}