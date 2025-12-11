/* FILE: src/server/routes/admin.routes.ts */
import { Router } from 'express';
import { asyncHandler } from '../utils/response';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.post('/counters', asyncHandler(adminController.createCounter));
router.put('/counters/:counterId', asyncHandler(adminController.updateCounter));
router.delete('/counters/:counterId', asyncHandler(adminController.deleteCounter));

router.get('/locations/:locationId/counters', asyncHandler(adminController.getLocationCounters));
router.get('/locations/:locationId/counters/status', asyncHandler(adminController.getCountersWithStatus));

router.get('/counters/:counterId/queue', asyncHandler(adminController.getQueueStatus));

router.get('/locations/:locationId/activity', asyncHandler(adminController.getLocationActivity));
router.get('/counters/:counterId/activity', asyncHandler(adminController.getCounterActivity));

router.get('/locations/:locationId/summary', asyncHandler(adminController.getDailySummary));
router.get('/locations/:locationId/dashboard', asyncHandler(adminController.getDashboardStats));

export { router as adminRoutes };