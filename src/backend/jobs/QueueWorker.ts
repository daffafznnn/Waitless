/* FILE: src/server/jobs/QueueWorker.ts */
/**
 * Queue Worker - Job Handlers for Waitless
 * 
 * Defines handlers for different job types and initializes
 * the job queue with all necessary handlers.
 */

import { jobQueue } from './JobQueue';
import type { JobHandler } from './JobQueue';
import type { JobResult, JobPayload } from '../types';
import { TicketRepository } from '../repositories/TicketRepository';
import { EventRepository } from '../repositories/EventRepository';
import { EventType } from '../models/ticket_event.model';
import { TicketStatus } from '../models/ticket.model';
import { getJakartaDateString } from '../utils/datetime';

// Repository instances (singleton pattern for worker)
let ticketRepository: TicketRepository | null = null;
let eventRepository: EventRepository | null = null;

function getTicketRepository(): TicketRepository {
  if (!ticketRepository) {
    ticketRepository = new TicketRepository();
  }
  return ticketRepository;
}

function getEventRepository(): EventRepository {
  if (!eventRepository) {
    eventRepository = new EventRepository();
  }
  return eventRepository;
}

// ============================================
// Job Type Constants
// ============================================

export const JobTypes = {
  // Event logging jobs
  LOG_TICKET_EVENT: 'log_ticket_event',
  
  // Notification jobs (future)
  SEND_NOTIFICATION: 'send_notification',
  SEND_SMS: 'send_sms',
  
  // Analytics jobs
  UPDATE_COUNTER_STATS: 'update_counter_stats',
  
  // Cleanup jobs
  EXPIRE_OLD_TICKETS: 'expire_old_tickets',
} as const;

// ============================================
// Job Handlers
// ============================================

/**
 * Handler for logging ticket events
 * This is an async operation that doesn't block the main flow
 */
const logTicketEventHandler: JobHandler = async (payload: JobPayload): Promise<JobResult> => {
  try {
    const { ticketId, actorId, eventType, note } = payload;
    
    if (!ticketId || !eventType) {
      return { success: false, error: 'Missing required fields: ticketId, eventType' };
    }

    const eventRepo = getEventRepository();
    await eventRepo.create({
      ticket_id: ticketId,
      actor_id: actorId || undefined,
      event_type: eventType as EventType,
      note: note || undefined,
    });

    return { success: true, data: { ticketId, eventType } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[QueueWorker] logTicketEvent failed:', message);
    return { success: false, error: message };
  }
};

/**
 * Handler for expiring old tickets
 * Marks tickets that have been waiting too long as expired/cancelled
 */
const expireOldTicketsHandler: JobHandler = async (payload: JobPayload): Promise<JobResult> => {
  try {
    const { locationId, maxAgeMinutes = 480 } = payload; // Default 8 hours
    const today = getJakartaDateString();
    
    const ticketRepo = getTicketRepository();
    const eventRepo = getEventRepository();
    
    // Find old waiting tickets
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    // Get tickets that have been waiting for too long
    const result = await ticketRepo.listToday(locationId, today, 0, 1000);
    const oldTickets = result.rows.filter(ticket => {
      if (ticket.status !== TicketStatus.WAITING) return false;
      const createdAt = new Date(ticket.created_at);
      return createdAt < cutoffTime;
    });

    let expiredCount = 0;
    for (const ticket of oldTickets) {
      try {
        await ticketRepo.updateStatus(ticket.id, TicketStatus.CANCELLED, {
          hold_reason: 'Expired - terlalu lama menunggu',
        });
        
        await eventRepo.create({
          ticket_id: ticket.id,
          event_type: EventType.EXPIRED,
          note: `Expired after ${maxAgeMinutes} minutes`,
        });
        
        expiredCount++;
      } catch (err) {
        console.error(`[QueueWorker] Failed to expire ticket ${ticket.id}:`, err);
      }
    }

    return { 
      success: true, 
      data: { 
        locationId, 
        checked: result.rows.length, 
        expired: expiredCount 
      } 
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[QueueWorker] expireOldTickets failed:', message);
    return { success: false, error: message };
  }
};

/**
 * Handler for sending notifications (placeholder for future implementation)
 */
const sendNotificationHandler: JobHandler = async (payload: JobPayload): Promise<JobResult> => {
  try {
    const { type, recipient, message } = payload;
    
    // TODO: Implement actual notification sending
    // For now, just log it
    console.log(`[QueueWorker] Notification: ${type} to ${recipient}: ${message}`);
    
    return { success: true, data: { sent: true } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};

/**
 * Handler for updating counter statistics
 */
const updateCounterStatsHandler: JobHandler = async (payload: JobPayload): Promise<JobResult> => {
  try {
    const { counterId } = payload;
    
    // TODO: Implement counter stats update
    // This could update cached stats or trigger summary recalculation
    console.log(`[QueueWorker] Updating stats for counter ${counterId}`);
    
    return { success: true, data: { counterId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};

// ============================================
// Worker Initialization
// ============================================

/**
 * Initialize the queue worker with all handlers
 */
export function initializeQueueWorker(): void {
  console.log('[QueueWorker] Initializing job handlers...');
  
  // Register all handlers
  jobQueue.registerHandler(JobTypes.LOG_TICKET_EVENT, logTicketEventHandler, { maxRetries: 3 });
  jobQueue.registerHandler(JobTypes.EXPIRE_OLD_TICKETS, expireOldTicketsHandler, { maxRetries: 2 });
  jobQueue.registerHandler(JobTypes.SEND_NOTIFICATION, sendNotificationHandler, { maxRetries: 5 });
  jobQueue.registerHandler(JobTypes.UPDATE_COUNTER_STATS, updateCounterStatsHandler, { maxRetries: 2 });
  
  // Start processing
  jobQueue.startProcessing(50); // Check every 50ms
  
  console.log('[QueueWorker] Job handlers initialized and processing started');
}

/**
 * Shutdown the queue worker gracefully
 */
export async function shutdownQueueWorker(timeoutMs: number = 5000): Promise<void> {
  console.log('[QueueWorker] Shutting down...');
  
  // Stop accepting new jobs
  jobQueue.stopProcessing();
  
  // Wait for queue to drain
  const drained = await jobQueue.drain(timeoutMs);
  
  if (drained) {
    console.log('[QueueWorker] Shutdown complete - queue drained');
  } else {
    console.warn('[QueueWorker] Shutdown timeout - some jobs may be incomplete');
  }
}

// ============================================
// Helper Functions for Services
// ============================================

/**
 * Enqueue a ticket event to be logged asynchronously
 */
export function enqueueEventLog(
  ticketId: number,
  eventType: EventType,
  actorId?: number,
  note?: string
): void {
  jobQueue.enqueue(JobTypes.LOG_TICKET_EVENT, {
    ticketId,
    eventType,
    actorId,
    note,
  }).catch(err => {
    console.error('[QueueWorker] Failed to enqueue event log:', err);
  });
}

/**
 * Enqueue ticket expiration check for a location
 */
export function enqueueTicketExpiration(
  locationId: number,
  maxAgeMinutes: number = 480
): void {
  jobQueue.enqueue(JobTypes.EXPIRE_OLD_TICKETS, {
    locationId,
    maxAgeMinutes,
  }).catch(err => {
    console.error('[QueueWorker] Failed to enqueue expiration check:', err);
  });
}

/**
 * Get current queue statistics
 */
export function getQueueStats() {
  return jobQueue.getStats();
}
