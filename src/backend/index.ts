/* FILE: src/server/index.ts */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDatabase } from './db';
import { JobScheduler } from './jobs/JobScheduler';
import { initializeQueueWorker, shutdownQueueWorker, getQueueStats } from './jobs/QueueWorker';
import { authRoutes } from './routes/auth.routes';
import { queueRoutes } from './routes/queue.routes';
import { adminRoutes } from './routes/admin.routes';
import { locationRoutes } from './routes/location.routes';
import { ownerRoutes } from './routes/owner.routes';
import { logRequests } from './utils/auth-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for LAN access

// Dynamic CORS for development (allows LAN access)
const corsOrigins = process.env.NODE_ENV === 'development'
  ? true // Allow any origin in development for LAN testing
  : (process.env.CLIENT_URL || 'http://localhost:3000');

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(logRequests);

app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/owner', ownerRoutes);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    message: 'Waitless API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/status', async (_req, res) => {
  try {
    const jobScheduler = JobScheduler.getInstance();
    const jobStatus = jobScheduler.getJobStatus();
    const lastDailySummaryRun = jobScheduler.getLastDailySummaryRun();
    const queueStats = getQueueStats();
    
    res.json({
      ok: true,
      data: {
        server: 'running',
        database: 'connected',
        jobs: jobStatus,
        lastDailySummaryRun,
        queueStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Failed to get server status',
      details: error,
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  if (!res.headersSent) {
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error.message, // Temporarily expose error for debugging
      stack: error.stack, // Temporarily expose stack for debugging
    });
  }
});

// Export bootstrap function for serverless/wrapper usage
export async function bootstrap(options: { enableJobs?: boolean } = {}) {
  try {
    // Ensure DB is connected (Sequelize handles connection pooling)
    await connectDatabase();
    console.log('✅ Database connected');

    if (options.enableJobs) {
      console.log('📅 Starting job scheduler...');
      const jobScheduler = JobScheduler.getInstance();
      jobScheduler.startAllJobs();
      console.log('✅ Job scheduler started');

      console.log('⚙️ Initializing job queue worker...');
      initializeQueueWorker();
      console.log('✅ Job queue worker started');
    }
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    throw error;
  }
}

export async function startServer(): Promise<void> {
  try {
    await bootstrap({ enableJobs: true });

    const server = app.listen(Number(PORT), HOST, () => {
      console.log(`🚀 Waitless API Server running on ${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Status endpoint: http://localhost:${PORT}/api/status`);
      
      // Show network URL for LAN access
      if (HOST === '0.0.0.0') {
        console.log(`🌐 Network: Access from other devices using your local IP (e.g., http://192.168.x.x:${PORT})`);
      }
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚡ Received ${signal}. Starting graceful shutdown...`);
      
      const jobScheduler = JobScheduler.getInstance();
      jobScheduler.stopAllJobs();
      await shutdownQueueWorker(5000);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Note: In local development with tsx or node, this file can be run directly.
// However, in Vercel/Nitro environment (ESM), require.main is not available.
// We rely on the exported 'app' being used by the Nitro wrapper.
// To run locally: use the scripts defined in package.json which use 'tsx' or 'node'.

// Manual check for direct execution if needed in future (using import.meta.url)
// but for now, we leave it to the wrapper.

// Check if running directly (dev) vs imported (prod/lambda)
// Safe check for CommonJS environment (local dev)
if (typeof require !== 'undefined' && require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { app };