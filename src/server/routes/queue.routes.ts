/* FILE: src/server/routes/queue.routes.ts */
import { Router } from 'express';
import { asyncHandler } from '../utils/response';
import { requireAuth, optionalAuth } from '../middleware/auth';
import * as queueController from '../controllers/queue.controller';

const router = Router();

router.post('/issue', optionalAuth, asyncHandler(queueController.issueTicket));

router.post('/call-next', requireAuth, asyncHandler(queueController.callNext));
router.post('/start-serving', requireAuth, asyncHandler(queueController.startServing));

router.post('/hold', requireAuth, asyncHandler(queueController.holdTicket));
router.post('/resume', requireAuth, asyncHandler(queueController.resumeTicket));
router.post('/done', requireAuth, asyncHandler(queueController.markDone));
router.post('/cancel', optionalAuth, asyncHandler(queueController.cancelTicket));

router.get('/status/:counterId', asyncHandler(queueController.getQueueStatus));
router.get('/today/:locationId', asyncHandler(queueController.getTodayTickets));
router.get('/ticket/:queueNumber', asyncHandler(queueController.getTicketByQueueNumber));
router.get('/estimate/:ticketId', asyncHandler(queueController.getEstimatedWaitTime));

router.get('/user/tickets', requireAuth, asyncHandler(queueController.getUserTickets));

export { router as queueRoutes };