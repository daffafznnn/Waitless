/* FILE: src/server/controllers/queue.controller.ts */
import { Request, Response } from 'express';
import { z } from 'zod';
import { QueueService } from '../services/QueueService';

const queueService = new QueueService();

// Validation schemas - using coerce to handle both string and number inputs
const issueTicketSchema = z.object({
  locationId: z.coerce.number().int().positive('Location ID must be a positive integer'),
  counterId: z.coerce.number().int().positive('Counter ID must be a positive integer'),
  userId: z.coerce.number().int().positive().optional(),
  dateFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

const callNextSchema = z.object({
  counterId: z.number().int().positive('Counter ID must be a positive integer'),
});

const holdTicketSchema = z.object({
  ticketId: z.number().int().positive('Ticket ID must be a positive integer'),
  reason: z.string().min(1, 'Reason is required').max(160, 'Reason must be 160 characters or less'),
});

const resumeTicketSchema = z.object({
  ticketId: z.number().int().positive('Ticket ID must be a positive integer'),
});

const doneTicketSchema = z.object({
  ticketId: z.number().int().positive('Ticket ID must be a positive integer'),
});

const cancelTicketSchema = z.object({
  ticketId: z.number().int().positive('Ticket ID must be a positive integer'),
  reason: z.string().min(1, 'Reason is required').max(160, 'Reason must be 160 characters or less'),
});

// Note: Schemas are defined but used implicitly in route handlers

/**
 * POST /api/queue/issue
 * Issue a new ticket
 */
export const issueTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = issueTicketSchema.parse(req.body);
    
    // Get user ID from auth if available
    const userId = (req as any).user?.userId || validatedData.userId;

    // Issue ticket
    const ticket = await queueService.issue({
      locationId: validatedData.locationId,
      counterId: validatedData.counterId,
      userId: userId,
      dateFor: validatedData.dateFor,
    });

    res.status(201).json({
      ok: true,
      data: { ticket },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    // Handle Sequelize validation errors with better messages
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      console.error('[QueueController] Sequelize error:', error.message, error.errors);
      const message = error.errors?.[0]?.message || 'Terjadi kesalahan validasi data';
      res.status(400).json({
        ok: false,
        error: message,
      });
      return;
    }

    // Log unexpected errors
    if (!error.statusCode) {
      console.error('[QueueController] Unexpected error issuing ticket:', error);
    }

    res.status(error.statusCode || 400).json({
      ok: false,
      error: error.message || 'Gagal mengambil nomor antrian',
    });
  }
};

/**
 * POST /api/queue/call-next
 * Call the next waiting ticket
 */
export const callNext = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = (req as any).user?.userId;
    if (!actorId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate input
    const validatedData = callNextSchema.parse(req.body);

    // Call next ticket
    const result = await queueService.callNext(validatedData.counterId, actorId);

    if (!result.ticket) {
      res.json({
        ok: true,
        data: {
          ticket: null,
          message: result.message,
        },
      });
      return;
    }

    res.json({
      ok: true,
      data: {
        ticket: result.ticket,
        queueNumber: result.queueNumber,
        message: result.message,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to call next ticket',
    });
  }
};

/**
 * POST /api/queue/recall
 * Re-call a ticket that's already in CALLING status
 */
export const recallTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = (req as any).user?.userId;
    if (!actorId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    const { ticketId } = req.body;

    if (!ticketId || isNaN(parseInt(ticketId))) {
      res.status(400).json({
        ok: false,
        error: 'Valid ticket ID is required',
      });
      return;
    }

    // Recall ticket
    const result = await queueService.recall(parseInt(ticketId), actorId);

    res.json({
      ok: true,
      data: {
        ticket: result.ticket,
        queueNumber: result.queueNumber,
        message: result.message,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to recall ticket',
    });
  }
};

/**
 * POST /api/queue/hold
 * Put a ticket on hold
 */
export const holdTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = (req as any).user?.userId;
    if (!actorId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate input
    const validatedData = holdTicketSchema.parse(req.body);

    // Hold ticket
    const ticket = await queueService.hold(
      validatedData.ticketId,
      validatedData.reason,
      actorId
    );

    res.json({
      ok: true,
      data: { ticket },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to hold ticket',
    });
  }
};

/**
 * POST /api/queue/resume
 * Resume a held ticket
 */
export const resumeTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = (req as any).user?.userId;
    if (!actorId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate input
    const validatedData = resumeTicketSchema.parse(req.body);

    // Resume ticket
    const ticket = await queueService.resume(validatedData.ticketId, actorId);

    res.json({
      ok: true,
      data: { ticket },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to resume ticket',
    });
  }
};

/**
 * POST /api/queue/done
 * Mark a ticket as completed
 */
export const markDone = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = (req as any).user?.userId;
    if (!actorId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate input
    const validatedData = doneTicketSchema.parse(req.body);

    // Mark ticket as done
    const ticket = await queueService.done(validatedData.ticketId, actorId);

    res.json({
      ok: true,
      data: { ticket },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to mark ticket as done',
    });
  }
};

/**
 * POST /api/queue/cancel
 * Cancel a ticket
 */
export const cancelTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = (req as any).user?.userId;

    // Validate input
    const validatedData = cancelTicketSchema.parse(req.body);

    // Cancel ticket
    const ticket = await queueService.cancel(
      validatedData.ticketId,
      validatedData.reason,
      actorId
    );

    res.json({
      ok: true,
      data: { ticket },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to cancel ticket',
    });
  }
};

/**
 * GET /api/queue/status/:counterId
 * Get queue status for a counter
 */
export const getQueueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const counterId = parseInt(req.params.counterId);
    const date = req.query.date as string | undefined;

    // Validate counter ID
    if (isNaN(counterId) || counterId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid counter ID',
      });
      return;
    }

    // Get queue status
    const status = await queueService.getQueueStatus(counterId, date);

    res.json({
      ok: true,
      data: { status },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get queue status',
    });
  }
};

/**
 * GET /api/queue/today/:locationId
 * Get today's tickets for a location
 */
export const getTodayTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = parseInt(req.params.locationId);
    const date = req.query.date as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Validate location ID
    if (isNaN(locationId) || locationId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid location ID',
      });
      return;
    }

    // Get today's tickets
    const result = await queueService.getTodayTickets(locationId, date, page, limit);

    res.json({
      ok: true,
      data: {
        tickets: result.rows,
        pagination: {
          total: result.count,
          page,
          limit,
          pages: Math.ceil(result.count / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get tickets',
    });
  }
};

/**
 * GET /api/queue/ticket/:queueNumber
 * Find ticket by queue number
 */
export const getTicketByQueueNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const queueNumber = req.params.queueNumber;

    if (!queueNumber) {
      res.status(400).json({
        ok: false,
        error: 'Queue number is required',
      });
      return;
    }

    // Find ticket
    const ticket = await queueService.findTicketByQueueNumber(queueNumber);

    if (!ticket) {
      res.status(404).json({
        ok: false,
        error: 'Ticket not found',
      });
      return;
    }

    res.json({
      ok: true,
      data: { ticket },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to find ticket',
    });
  }
};

/**
 * GET /api/queue/user/tickets
 * Get current user's tickets
 */
export const getUserTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    const date = req.query.date as string | undefined;

    // Get user's tickets
    const tickets = await queueService.getUserTickets(userId, date);

    res.json({
      ok: true,
      data: { tickets },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get user tickets',
    });
  }
};

/**
 * GET /api/queue/estimate/:ticketId
 * Get estimated wait time for a ticket
 */
export const getEstimatedWaitTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.ticketId);

    // Validate ticket ID
    if (isNaN(ticketId) || ticketId <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Invalid ticket ID',
      });
      return;
    }

    // Get estimated wait time
    const estimate = await queueService.getEstimatedWaitTime(ticketId);

    res.json({
      ok: true,
      data: { estimate },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to get estimated wait time',
    });
  }
};

/**
 * POST /api/queue/start-serving
 * Start serving a ticket (CALLING -> SERVING)
 */
export const startServing = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = (req as any).user?.userId;
    if (!actorId) {
      res.status(401).json({
        ok: false,
        error: 'Authentication required',
      });
      return;
    }

    const { ticketId } = req.body;

    if (!ticketId || isNaN(parseInt(ticketId))) {
      res.status(400).json({
        ok: false,
        error: 'Valid ticket ID is required',
      });
      return;
    }

    // Start serving ticket
    const ticket = await queueService.startServing(parseInt(ticketId), actorId);

    res.json({
      ok: true,
      data: { ticket },
    });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: error.message || 'Failed to start serving ticket',
    });
  }
};