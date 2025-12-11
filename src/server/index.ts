/* FILE: src/server/index.ts */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDatabase } from './db';
import { JobScheduler } from './jobs/JobScheduler';
import { authRoutes } from './routes/auth.routes';
import { queueRoutes } from './routes/queue.routes';
import { adminRoutes } from './routes/admin.routes';
import { locationRoutes } from './routes/location.routes';
import { logRequests } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
    
    res.json({
      ok: true,
      data: {
        server: 'running',
        database: 'connected',
        jobs: jobStatus,
        lastDailySummaryRun,
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
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
});

async function startServer(): Promise<void> {
  try {
    console.log('🔗 Connecting to database...');
    await connectDatabase();
    console.log('✅ Database connected successfully');

    console.log('📅 Starting job scheduler...');
    const jobScheduler = JobScheduler.getInstance();
    jobScheduler.startAllJobs();
    console.log('✅ Job scheduler started');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Waitless API Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Status endpoint: http://localhost:${PORT}/api/status`);
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚡ Received ${signal}. Starting graceful shutdown...`);
      
      jobScheduler.stopAllJobs();
      
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

if (require.main === module) {
  startServer();
}

export { app };