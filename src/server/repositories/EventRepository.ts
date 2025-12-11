/* FILE: src/server/repositories/EventRepository.ts */
import { Transaction } from 'sequelize';
import { TicketEvent, TicketEventCreationAttributes, EventType } from '../models/ticket_event.model';
import { User } from '../models/user.model';
import { Ticket } from '../models/ticket.model';

export class EventRepository {
  /**
   * Create a new ticket event
   */
  async create(eventData: TicketEventCreationAttributes, transaction?: Transaction): Promise<TicketEvent> {
    return TicketEvent.create(eventData, { transaction });
  }

  /**
   * Find event by ID
   */
  async findById(id: number, transaction?: Transaction): Promise<TicketEvent | null> {
    return TicketEvent.findByPk(id, {
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'queue_number', 'status'],
        },
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name'],
        },
      ],
      transaction,
    });
  }

  /**
   * Get all events for a ticket
   */
  async findByTicketId(ticketId: number, transaction?: Transaction): Promise<TicketEvent[]> {
    return TicketEvent.findAll({
      where: { ticket_id: ticketId },
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name'],
        },
      ],
      order: [['created_at', 'ASC']],
      transaction,
    });
  }

  /**
   * Get events by actor (user)
   */
  async findByActorId(
    actorId: number,
    offset: number = 0,
    limit: number = 50,
    transaction?: Transaction
  ): Promise<{ rows: TicketEvent[]; count: number }> {
    return TicketEvent.findAndCountAll({
      where: { actor_id: actorId },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'queue_number', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit,
      transaction,
    });
  }

  /**
   * Get events by type
   */
  async findByEventType(
    eventType: EventType,
    offset: number = 0,
    limit: number = 50,
    transaction?: Transaction
  ): Promise<{ rows: TicketEvent[]; count: number }> {
    return TicketEvent.findAndCountAll({
      where: { event_type: eventType },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'queue_number', 'status'],
        },
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit,
      transaction,
    });
  }

  /**
   * Get events for a date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    offset: number = 0,
    limit: number = 100,
    transaction?: Transaction
  ): Promise<{ rows: TicketEvent[]; count: number }> {
    const { Op } = require('sequelize');
    
    return TicketEvent.findAndCountAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'queue_number', 'counter_id', 'location_id'],
        },
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit,
      transaction,
    });
  }

  /**
   * Get activity log for a location
   */
  async getLocationActivityLog(
    locationId: number,
    date: string,
    offset: number = 0,
    limit: number = 100,
    transaction?: Transaction
  ): Promise<{ rows: TicketEvent[]; count: number }> {
    const { Op } = require('sequelize');
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    return TicketEvent.findAndCountAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'queue_number', 'counter_id'],
          where: { location_id: locationId },
          required: true,
        },
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name'],
        },
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['created_at', 'DESC']],
      offset,
      limit,
      transaction,
    });
  }

  /**
   * Get counter activity log
   */
  async getCounterActivityLog(
    counterId: number,
    date: string,
    offset: number = 0,
    limit: number = 100,
    transaction?: Transaction
  ): Promise<{ rows: TicketEvent[]; count: number }> {
    const { Op } = require('sequelize');
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    return TicketEvent.findAndCountAll({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'queue_number', 'date_for'],
          where: { 
            counter_id: counterId,
            date_for: date,
          },
          required: true,
        },
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name'],
        },
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['created_at', 'DESC']],
      offset,
      limit,
      transaction,
    });
  }

  /**
   * Get event statistics for a date
   */
  async getEventStatistics(
    locationId: number,
    date: string,
    transaction?: Transaction
  ): Promise<Record<EventType, number>> {
    const { Op, fn } = require('sequelize');
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    const stats = await TicketEvent.findAll({
      attributes: [
        'event_type',
        [fn('COUNT', '*'), 'count'],
      ],
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: [],
          where: { location_id: locationId },
          required: true,
        },
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: ['event_type'],
      raw: true,
      transaction,
    });

    // Initialize all event types with 0
    const result: Record<EventType, number> = {
      [EventType.ISSUED]: 0,
      [EventType.CALLED]: 0,
      [EventType.RESUMED]: 0,
      [EventType.HELD]: 0,
      [EventType.DONE]: 0,
      [EventType.CANCELLED]: 0,
      [EventType.EXPIRED]: 0,
    };

    // Fill in actual counts
    stats.forEach((stat: any) => {
      result[stat.event_type as EventType] = parseInt(stat.count);
    });

    return result;
  }

  /**
   * Create multiple events in batch
   */
  async createBatch(events: TicketEventCreationAttributes[], transaction?: Transaction): Promise<TicketEvent[]> {
    return TicketEvent.bulkCreate(events, { transaction });
  }

  /**
   * Get latest event for a ticket by type
   */
  async getLatestByTicketAndType(
    ticketId: number,
    eventType: EventType,
    transaction?: Transaction
  ): Promise<TicketEvent | null> {
    return TicketEvent.findOne({
      where: { 
        ticket_id: ticketId,
        event_type: eventType,
      },
      order: [['created_at', 'DESC']],
      transaction,
    });
  }

  /**
   * Count events by type for a location and date
   */
  async countByTypeAndDate(
    locationId: number,
    eventType: EventType,
    date: string,
    transaction?: Transaction
  ): Promise<number> {
    const { Op } = require('sequelize');
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    return TicketEvent.count({
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: [],
          where: { location_id: locationId },
          required: true,
        },
      ],
      where: {
        event_type: eventType,
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      transaction,
    });
  }
}