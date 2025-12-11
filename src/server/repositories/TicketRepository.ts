/* FILE: src/server/repositories/TicketRepository.ts */
import { Transaction } from 'sequelize';
import { Ticket, TicketAttributes, TicketCreationAttributes, TicketStatus } from '../models/ticket.model';
import { Counter } from '../models/counter.model';
import { User } from '../models/user.model';
import { ServiceLocation } from '../models/service_location.model';

export class TicketRepository {
  /**
   * Create a new ticket with transaction support and locking
   */
  async createTicket(ticketData: TicketCreationAttributes, transaction: Transaction): Promise<Ticket> {
    // Get the next sequence number for this counter and date with row lock
    const { sequelize } = require('../db');
    
    const [result] = await sequelize.query(`
      SELECT COALESCE(MAX(sequence), 0) + 1 as next_sequence 
      FROM tickets 
      WHERE counter_id = ? AND date_for = ?
      FOR UPDATE
    `, {
      replacements: [ticketData.counter_id, ticketData.date_for],
      type: sequelize.QueryTypes.SELECT,
      transaction,
    });

    const nextSequence = result?.next_sequence || 1;

    // Get counter prefix for queue number generation
    const counter = await Counter.findByPk(ticketData.counter_id, {
      attributes: ['prefix'],
      transaction,
    });

    if (!counter) {
      throw new Error('Counter not found');
    }

    // Generate queue number: PREFIX + sequence (padded to 3 digits)
    const queueNumber = `${counter.prefix}${String(nextSequence).padStart(3, '0')}`;

    const completeTicketData = {
      ...ticketData,
      sequence: nextSequence,
      queue_number: queueNumber,
    };

    return Ticket.create(completeTicketData, { transaction });
  }

  /**
   * Get the next waiting ticket for a counter with row lock
   */
  async getNextWaitingTicket(counterId: number, transaction: Transaction): Promise<Ticket | null> {
    return Ticket.findOne({
      where: {
        counter_id: counterId,
        status: TicketStatus.WAITING,
      },
      order: [['created_at', 'ASC']],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
  }

  /**
   * Find ticket by ID
   */
  async findById(id: number, transaction?: Transaction): Promise<Ticket | null> {
    return Ticket.findByPk(id, {
      include: [
        {
          model: Counter,
          as: 'counter',
          attributes: ['id', 'name', 'prefix'],
          include: [
            {
              model: ServiceLocation,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      transaction,
    });
  }

  /**
   * Find ticket by queue number
   */
  async findByQueueNumber(queueNumber: string, transaction?: Transaction): Promise<Ticket | null> {
    return Ticket.findOne({
      where: { queue_number: queueNumber },
      include: [
        {
          model: Counter,
          as: 'counter',
          attributes: ['id', 'name', 'prefix'],
          include: [
            {
              model: ServiceLocation,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      transaction,
    });
  }

  /**
   * Update ticket status
   */
  async updateStatus(
    id: number,
    status: TicketStatus,
    updates?: Partial<TicketAttributes>,
    transaction?: Transaction
  ): Promise<[number, Ticket[]]> {
    const updateData = { status, ...updates };
    
    return Ticket.update(updateData, {
      where: { id },
      returning: true,
      transaction,
    });
  }

  /**
   * Get tickets for today at a location
   */
  async listToday(
    locationId: number,
    date: string,
    offset: number = 0,
    limit: number = 50,
    transaction?: Transaction
  ): Promise<{ rows: Ticket[]; count: number }> {
    return Ticket.findAndCountAll({
      where: {
        location_id: locationId,
        date_for: date,
      },
      include: [
        {
          model: Counter,
          as: 'counter',
          attributes: ['id', 'name', 'prefix'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      order: [['created_at', 'ASC']],
      offset,
      limit,
      transaction,
    });
  }

  /**
   * Get tickets by counter for a specific date
   */
  async findByCounterAndDate(
    counterId: number,
    date: string,
    transaction?: Transaction
  ): Promise<Ticket[]> {
    return Ticket.findAll({
      where: {
        counter_id: counterId,
        date_for: date,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      order: [['sequence', 'ASC']],
      transaction,
    });
  }

  /**
   * Get queue status for a counter
   */
  async getQueueStatus(
    counterId: number,
    date: string,
    transaction?: Transaction
  ): Promise<{
    total: number;
    waiting: number;
    calling: number;
    serving: number;
    hold: number;
    done: number;
    cancelled: number;
    current?: Ticket;
    nextWaiting?: Ticket;
  }> {
    const { Op } = require('sequelize');

    // Get counts by status
    const statusCounts = await Ticket.findAll({
      where: {
        counter_id: counterId,
        date_for: date,
      },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', '*'), 'count'],
      ],
      group: ['status'],
      raw: true,
      transaction,
    });

    const counts = {
      total: 0,
      waiting: 0,
      calling: 0,
      serving: 0,
      hold: 0,
      done: 0,
      cancelled: 0,
    };

    statusCounts.forEach((item: any) => {
      const status = item.status.toLowerCase();
      const count = parseInt(item.count);
      if (status in counts) {
        (counts as any)[status] = count;
      }
      counts.total += count;
    });

    // Get current ticket (CALLING or SERVING)
    const current = await Ticket.findOne({
      where: {
        counter_id: counterId,
        date_for: date,
        status: {
          [Op.in]: [TicketStatus.CALLING, TicketStatus.SERVING],
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
      order: [['called_at', 'ASC']],
      transaction,
    });

    // Get next waiting ticket
    const nextWaiting = await Ticket.findOne({
      where: {
        counter_id: counterId,
        date_for: date,
        status: TicketStatus.WAITING,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
      order: [['sequence', 'ASC']],
      transaction,
    });

    return {
      ...counts,
      current: current || undefined,
      nextWaiting: nextWaiting || undefined,
    };
  }

  /**
   * Get user's tickets for a date
   */
  async findUserTickets(
    userId: number,
    date: string,
    transaction?: Transaction
  ): Promise<Ticket[]> {
    return Ticket.findAll({
      where: {
        user_id: userId,
        date_for: date,
      },
      include: [
        {
          model: Counter,
          as: 'counter',
          attributes: ['id', 'name', 'prefix'],
          include: [
            {
              model: ServiceLocation,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      transaction,
    });
  }

  /**
   * Check if ticket can be called next
   */
  async canCallNext(ticketId: number, transaction?: Transaction): Promise<boolean> {
    const ticket = await Ticket.findByPk(ticketId, { transaction });
    if (!ticket || ticket.status !== TicketStatus.WAITING) {
      return false;
    }

    // Check if there are any earlier tickets still waiting
    const earlierWaiting = await Ticket.count({
      where: {
        counter_id: ticket.counter_id,
        date_for: ticket.date_for,
        sequence: { [require('sequelize').Op.lt]: ticket.sequence },
        status: TicketStatus.WAITING,
      },
      transaction,
    });

    return earlierWaiting === 0;
  }

  /**
   * Get estimated wait time
   */
  async getEstimatedWaitTime(
    counterId: number,
    targetSequence: number,
    date: string,
    transaction?: Transaction
  ): Promise<{ estimatedMinutes: number; position: number }> {
    const { Op } = require('sequelize');

    // Count tickets ahead in queue
    const position = await Ticket.count({
      where: {
        counter_id: counterId,
        date_for: date,
        sequence: { [Op.lt]: targetSequence },
        status: {
          [Op.in]: [TicketStatus.WAITING, TicketStatus.CALLING, TicketStatus.SERVING],
        },
      },
      transaction,
    });

    // Simple estimation: 5 minutes per ticket ahead
    // In production, this could be based on historical data
    const estimatedMinutes = position * 5;

    return {
      estimatedMinutes,
      position: position + 1, // Current position (1-based)
    };
  }

  /**
   * Find tickets by counter and date range
   */
  async findByCounterAndDateRange(
    counterId: number,
    startDate: Date,
    endDate: Date,
    transaction?: Transaction
  ): Promise<Ticket[]> {
    const { Op } = require('sequelize');
    
    return Ticket.findAll({
      where: {
        counter_id: counterId,
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      order: [['created_at', 'ASC']],
      transaction,
    });
  }
}