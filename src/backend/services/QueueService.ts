/* FILE: src/server/services/QueueService.ts */
/**
 * Queue Service - Optimized
 * 
 * Handles all queue-related operations with:
 * - BaseService integration for common functionality
 * - Jakarta timezone for date handling
 * - Proper error classes
 * - Async event logging via job queue
 */

import { Transaction } from 'sequelize';
import { BaseService } from './BaseService';
import { TicketRepository } from '../repositories/TicketRepository';
import { EventRepository } from '../repositories/EventRepository';
import { CounterRepository } from '../repositories/CounterRepository';
import { Ticket, TicketStatus } from '../models/ticket.model';
import { EventType } from '../models/ticket_event.model';
import { 
  NotFoundError, 
  BusinessLogicError,
  CapacityError,
  CounterClosedError,
  LocationClosedError,
  InvalidTicketStatusError,
  DuplicateTicketError,
} from '../types/errors';
import { getJakartaTimeString, getJakartaDateString, isWithinTimeRange } from '../utils/datetime';
import type { IssueTicketRequest, CallNextResponse } from '../types';

export class QueueService extends BaseService {
  private ticketRepository: TicketRepository;
  private eventRepository: EventRepository;
  private counterRepository: CounterRepository;

  constructor() {
    super('QueueService');
    this.ticketRepository = new TicketRepository();
    this.eventRepository = new EventRepository();
    this.counterRepository = new CounterRepository();
  }

  /**
   * Issue a new ticket with transactional safety
   */
  async issue(request: IssueTicketRequest): Promise<Ticket> {
    const { locationId, counterId, userId, dateFor } = request;
    
    // Validate IDs
    const validLocationId = this.validateId(locationId, 'Location ID');
    const validCounterId = this.validateId(counterId, 'Counter ID');
    const today = dateFor || getJakartaDateString();

    return this.withRepeatableRead(async (t) => {
      // Validate counter exists and is active
      const counter = await this.counterRepository.findById(validCounterId, t);
      if (!counter || !counter.is_active) {
        throw new NotFoundError('Loket');
      }

      // Validate location is active (open)
      const location = (counter as any).location;
      if (!location || !location.is_active) {
        throw new LocationClosedError();
      }

      // Validate counter is within open hours
      if (counter.open_time && counter.close_time) {
        const currentTime = getJakartaTimeString();
        if (!isWithinTimeRange(currentTime, counter.open_time, counter.close_time)) {
          throw new CounterClosedError(counter.open_time, counter.close_time);
        }
      }

      // Check capacity
      const capacityStatus = await this.counterRepository.getCapacityStatus(validCounterId, today, t);
      if (capacityStatus.isAtCapacity) {
        throw new CapacityError();
      }

      // Check if user already has an active ticket for this counter today
      // This enforces the rule: 1 user = 1 active ticket per counter
      if (userId) {
        const existingTicket = await this.ticketRepository.findActiveByUserAndCounter(
          userId, validCounterId, today, t
        );
        if (existingTicket) {
          const counterName = (existingTicket as any).counter?.name;
          throw new DuplicateTicketError(counterName);
        }
      }

      // Create ticket with automatic sequence generation
      const ticket = await this.ticketRepository.createTicket({
        location_id: validLocationId,
        counter_id: validCounterId,
        user_id: userId,
        date_for: today,
        status: TicketStatus.WAITING,
        sequence: 0,
        queue_number: '',
      }, t);

      // Create ISSUED event
      await this.eventRepository.create({
        ticket_id: ticket.id,
        actor_id: userId,
        event_type: EventType.ISSUED,
        note: `Ticket issued for ${counter.name}`,
      }, t);

      return ticket;
    });
  }

  /**
   * Call next waiting ticket with row locking to prevent race conditions
   */
  async callNext(counterId: number, actorId: number): Promise<CallNextResponse> {
    const validCounterId = this.validateId(counterId, 'Counter ID');
    const validActorId = this.validateId(actorId, 'Actor ID');

    return this.withRepeatableRead(async (t) => {
      // Find next waiting ticket with row lock
      const nextTicket = await this.ticketRepository.getNextWaitingTicket(validCounterId, t);
      
      if (!nextTicket) {
        return {
          ticket: null,
          message: 'Tidak ada tiket yang menunggu',
        };
      }

      const ticketId = this.parseTicketId(nextTicket.id);
      const now = new Date();
      
      // Update ticket status to CALLING
      await this.ticketRepository.updateStatus(
        ticketId,
        TicketStatus.CALLING,
        { called_at: now, started_at: now },
        t
      );

      // Create CALLED event
      await this.eventRepository.create({
        ticket_id: ticketId,
        actor_id: validActorId,
        event_type: EventType.CALLED,
        note: 'Ticket called by staff',
      }, t);

      // Refetch ticket with updated data
      const updatedTicket = await this.ticketRepository.findById(ticketId, t);

      return {
        ticket: updatedTicket,
        queueNumber: nextTicket.queue_number,
        message: `Memanggil tiket ${nextTicket.queue_number}`,
      };
    });
  }

  /**
   * Re-call a ticket that's already in CALLING status
   * This updates the updated_at timestamp and creates a RECALLED event
   */
  async recall(ticketId: number, actorId: number): Promise<CallNextResponse> {
    const validTicketId = this.validateId(ticketId, 'Ticket ID');
    const validActorId = this.validateId(actorId, 'Actor ID');

    return this.withTransaction(async (t) => {
      const ticket = await this.getTicketOrThrow(validTicketId, t);

      // Only allow recall for CALLING status tickets
      this.validateTicketStatus(
        ticket.status,
        [TicketStatus.CALLING],
        'memanggil ulang'
      );

      const now = new Date();
      
      // Update called_at to trigger updated_at change
      await this.ticketRepository.updateStatus(
        validTicketId,
        TicketStatus.CALLING,
        { called_at: now },
        t
      );

      // Create RECALLED event (reuse CALLED event type with different note)
      await this.eventRepository.create({
        ticket_id: validTicketId,
        actor_id: validActorId,
        event_type: EventType.CALLED,
        note: 'Ticket re-called by staff',
      }, t);

      // Refetch ticket with updated data
      const updatedTicket = await this.ticketRepository.findById(validTicketId, t);

      return {
        ticket: updatedTicket,
        queueNumber: ticket.queue_number,
        message: `Memanggil ulang tiket ${ticket.queue_number}`,
      };
    });
  }

  /**
   * Hold a ticket with reason
   */
  async hold(ticketId: number, reason: string, actorId: number): Promise<Ticket> {
    const validTicketId = this.validateId(ticketId, 'Ticket ID');
    const validActorId = this.validateId(actorId, 'Actor ID');
    
    return this.withTransaction(async (t) => {
      const ticket = await this.getTicketOrThrow(validTicketId, t);

      this.validateTicketStatus(
        ticket.status,
        [TicketStatus.CALLING, TicketStatus.SERVING, TicketStatus.WAITING],
        'menahan'
      );

      await this.ticketRepository.updateStatus(
        validTicketId,
        TicketStatus.HOLD,
        { hold_reason: reason },
        t
      );

      await this.eventRepository.create({
        ticket_id: validTicketId,
        actor_id: validActorId,
        event_type: EventType.HELD,
        note: reason,
      }, t);

      return this.ticketRepository.findById(validTicketId, t) as Promise<Ticket>;
    });
  }

  /**
   * Resume a held ticket
   */
  async resume(ticketId: number, actorId: number): Promise<Ticket> {
    const validTicketId = this.validateId(ticketId, 'Ticket ID');
    const validActorId = this.validateId(actorId, 'Actor ID');
    
    return this.withTransaction(async (t) => {
      const ticket = await this.getTicketOrThrow(validTicketId, t);

      this.validateTicketStatus(ticket.status, [TicketStatus.HOLD], 'melanjutkan');

      await this.ticketRepository.updateStatus(
        validTicketId,
        TicketStatus.WAITING,
        { 
          hold_reason: undefined,
          called_at: undefined,
          started_at: undefined,
        },
        t
      );

      await this.eventRepository.create({
        ticket_id: validTicketId,
        actor_id: validActorId,
        event_type: EventType.RESUMED,
        note: 'Ticket resumed and returned to queue',
      }, t);

      return this.ticketRepository.findById(validTicketId, t) as Promise<Ticket>;
    });
  }

  /**
   * Mark ticket as done/completed
   */
  async done(ticketId: number, actorId: number): Promise<Ticket> {
    const validTicketId = this.validateId(ticketId, 'Ticket ID');
    const validActorId = this.validateId(actorId, 'Actor ID');
    
    return this.withTransaction(async (t) => {
      const ticket = await this.getTicketOrThrow(validTicketId, t);

      this.validateTicketStatus(
        ticket.status,
        [TicketStatus.CALLING, TicketStatus.SERVING],
        'menyelesaikan'
      );

      await this.ticketRepository.updateStatus(
        validTicketId,
        TicketStatus.DONE,
        { finished_at: new Date() },
        t
      );

      await this.eventRepository.create({
        ticket_id: validTicketId,
        actor_id: validActorId,
        event_type: EventType.DONE,
        note: 'Service completed',
      }, t);

      return this.ticketRepository.findById(validTicketId, t) as Promise<Ticket>;
    });
  }

  /**
   * Cancel a ticket
   */
  async cancel(ticketId: number, reason: string, actorId?: number): Promise<Ticket> {
    const validTicketId = this.validateId(ticketId, 'Ticket ID');
    
    return this.withTransaction(async (t) => {
      const ticket = await this.getTicketOrThrow(validTicketId, t);

      if ([TicketStatus.DONE, TicketStatus.CANCELLED].includes(ticket.status)) {
        throw new BusinessLogicError('Tidak dapat membatalkan tiket yang sudah selesai atau dibatalkan');
      }

      await this.ticketRepository.updateStatus(
        validTicketId,
        TicketStatus.CANCELLED,
        { hold_reason: reason },
        t
      );

      await this.eventRepository.create({
        ticket_id: validTicketId,
        actor_id: actorId,
        event_type: EventType.CANCELLED,
        note: reason,
      }, t);

      return this.ticketRepository.findById(validTicketId, t) as Promise<Ticket>;
    });
  }

  /**
   * Start serving a ticket (transition from CALLING to SERVING)
   */
  async startServing(ticketId: number, _actorId: number): Promise<Ticket> {
    const validTicketId = this.validateId(ticketId, 'Ticket ID');
    
    return this.withTransaction(async (t) => {
      const ticket = await this.getTicketOrThrow(validTicketId, t);

      this.validateTicketStatus(ticket.status, [TicketStatus.CALLING], 'melayani');

      await this.ticketRepository.updateStatus(
        validTicketId,
        TicketStatus.SERVING,
        { started_at: new Date() },
        t
      );

      return this.ticketRepository.findById(validTicketId, t) as Promise<Ticket>;
    });
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get queue status for a counter
   */
  async getQueueStatus(counterId: number, date?: string) {
    const validCounterId = this.validateId(counterId, 'Counter ID');
    const today = this.getQueryDate(date);
    return this.ticketRepository.getQueueStatus(validCounterId, today);
  }

  /**
   * Get all tickets for today at a location
   */
  async getTodayTickets(locationId: number, date?: string, page: number = 1, limit: number = 50) {
    const validLocationId = this.validateId(locationId, 'Location ID');
    const today = this.getQueryDate(date);
    const { offset, limit: validLimit } = this.parsePagination(page, limit);
    return this.ticketRepository.listToday(validLocationId, today, offset, validLimit);
  }

  /**
   * Find ticket by queue number
   */
  async findTicketByQueueNumber(queueNumber: string) {
    if (!queueNumber || typeof queueNumber !== 'string') {
      throw new BusinessLogicError('Queue number wajib diisi');
    }
    return this.ticketRepository.findByQueueNumber(queueNumber.toUpperCase());
  }

  /**
   * Get user's tickets for today
   */
  async getUserTickets(userId: number, date?: string) {
    const validUserId = this.validateId(userId, 'User ID');
    const today = this.getQueryDate(date);
    return this.ticketRepository.findUserTickets(validUserId, today);
  }

  /**
   * Get estimated wait time for a ticket
   */
  async getEstimatedWaitTime(ticketId: number) {
    const validTicketId = this.validateId(ticketId, 'Ticket ID');
    const ticket = await this.ticketRepository.findById(validTicketId);
    
    if (!ticket) {
      throw new NotFoundError('Tiket');
    }

    return this.ticketRepository.getEstimatedWaitTime(
      ticket.counter_id,
      ticket.sequence,
      ticket.date_for
    );
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Parse ticket ID handling BIGINT as string/bigint
   */
  private parseTicketId(rawId: unknown): number {
    const ticketId = typeof rawId === 'bigint' ? Number(rawId) : 
                     typeof rawId === 'string' ? parseInt(rawId, 10) : 
                     Number(rawId);
    
    if (!ticketId || isNaN(ticketId)) {
      throw new BusinessLogicError('Invalid ticket ID returned from database');
    }
    
    return ticketId;
  }

  /**
   * Get ticket or throw NotFoundError
   */
  private async getTicketOrThrow(ticketId: number, t?: Transaction): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(ticketId, t);
    if (!ticket) {
      throw new NotFoundError('Tiket');
    }
    return ticket;
  }

  /**
   * Validate ticket status for operation
   */
  private validateTicketStatus(
    currentStatus: TicketStatus,
    allowedStatuses: TicketStatus[],
    operation: string
  ): void {
    if (!allowedStatuses.includes(currentStatus)) {
      throw new InvalidTicketStatusError(operation, allowedStatuses);
    }
  }
}