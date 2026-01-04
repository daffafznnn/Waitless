/* FILE: src/server/jobs/JobQueue.ts */
/**
 * In-Memory Job Queue for Waitless Backend
 * 
 * Simple but effective job queue for processing async operations:
 * - Ticket issuance
 * - Event logging
 * - Notifications (future)
 * 
 * For production with high load, consider using Redis-based queue like BullMQ.
 */

import { v4 as uuidv4 } from 'uuid';
import { JobPayload, JobPriority, QueueJob, JobResult } from '../types';

// Priority weights (higher = processed first)
const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export type JobHandler = (payload: JobPayload) => Promise<JobResult>;

interface JobHandlerRegistration {
  handler: JobHandler;
  maxRetries: number;
}

export class JobQueue {
  private static instance: JobQueue;
  
  // Queue storage
  private queue: QueueJob[] = [];
  private completedJobs: Map<string, QueueJob> = new Map();
  
  // Handler registry
  private handlers: Map<string, JobHandlerRegistration> = new Map();
  
  // Processing state
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private concurrency: number = 3;
  private activeJobs: number = 0;
  
  // Stats
  private stats = {
    totalEnqueued: 0,
    totalProcessed: 0,
    totalFailed: 0,
    totalRetries: 0,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  /**
   * Register a job handler for a specific job type
   */
  registerHandler(
    jobType: string, 
    handler: JobHandler, 
    options?: { maxRetries?: number }
  ): void {
    this.handlers.set(jobType, {
      handler,
      maxRetries: options?.maxRetries ?? 3,
    });
    console.log(`[JobQueue] Registered handler for job type: ${jobType}`);
  }

  /**
   * Add a job to the queue
   */
  async enqueue(
    type: string,
    payload: JobPayload,
    priority: JobPriority = 'normal'
  ): Promise<string> {
    const job: QueueJob = {
      id: uuidv4(),
      type,
      payload,
      priority,
      status: 'pending',
      createdAt: new Date(),
      retries: 0,
      maxRetries: this.handlers.get(type)?.maxRetries ?? 3,
    };

    // Insert by priority (higher priority first)
    const insertIndex = this.queue.findIndex(
      j => PRIORITY_WEIGHTS[j.priority] < PRIORITY_WEIGHTS[priority]
    );
    
    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    this.stats.totalEnqueued++;
    
    // Trigger processing if not already running
    if (!this.isProcessing) {
      this.processNext();
    }

    return job.id;
  }

  /**
   * Enqueue a job with high priority
   */
  async enqueueHighPriority(type: string, payload: JobPayload): Promise<string> {
    return this.enqueue(type, payload, 'high');
  }

  /**
   * Enqueue a critical job (processed first)
   */
  async enqueueCritical(type: string, payload: JobPayload): Promise<string> {
    return this.enqueue(type, payload, 'critical');
  }

  /**
   * Start continuous processing
   */
  startProcessing(intervalMs: number = 100): void {
    if (this.processingInterval) {
      return; // Already running
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processNext();
    }, intervalMs);

    console.log('[JobQueue] Started continuous processing');
  }

  /**
   * Stop continuous processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('[JobQueue] Stopped processing');
  }

  /**
   * Process next available job(s)
   */
  private async processNext(): Promise<void> {
    // Check concurrency limit
    while (this.activeJobs < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      // Don't await - process in parallel up to concurrency limit
      this.processJob(job).catch(err => {
        console.error(`[JobQueue] Error processing job ${job.id}:`, err);
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: QueueJob): Promise<void> {
    this.activeJobs++;
    job.status = 'processing';
    job.startedAt = new Date();

    const registration = this.handlers.get(job.type);
    
    if (!registration) {
      console.error(`[JobQueue] No handler registered for job type: ${job.type}`);
      job.status = 'failed';
      job.error = `No handler for job type: ${job.type}`;
      this.completedJobs.set(job.id, job);
      this.stats.totalFailed++;
      this.activeJobs--;
      return;
    }

    try {
      const result = await registration.handler(job.payload);
      
      if (result.success) {
        job.status = 'completed';
        job.completedAt = new Date();
        this.stats.totalProcessed++;
      } else {
        throw new Error(result.error || 'Job failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Retry if allowed
      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = 'pending';
        job.error = errorMessage;
        this.stats.totalRetries++;
        
        // Add back to queue with delay
        setTimeout(() => {
          this.queue.unshift(job); // Add to front for retry
        }, Math.min(1000 * Math.pow(2, job.retries), 30000)); // Exponential backoff, max 30s
        
      } else {
        job.status = 'failed';
        job.error = errorMessage;
        job.completedAt = new Date();
        this.stats.totalFailed++;
      }
    } finally {
      this.activeJobs--;
      
      // Store completed/failed jobs for status lookup
      if (job.status === 'completed' || job.status === 'failed') {
        this.completedJobs.set(job.id, job);
        
        // Cleanup old completed jobs (keep last 1000)
        if (this.completedJobs.size > 1000) {
          const oldestKey = this.completedJobs.keys().next().value;
          if (oldestKey) this.completedJobs.delete(oldestKey);
        }
      }
    }
  }

  /**
   * Get job status by ID
   */
  getJobStatus(jobId: string): QueueJob | null {
    // Check queue
    const queuedJob = this.queue.find(j => j.id === jobId);
    if (queuedJob) return queuedJob;

    // Check completed
    return this.completedJobs.get(jobId) || null;
  }

  /**
   * Cancel a pending job
   */
  cancelJob(jobId: string): boolean {
    const index = this.queue.findIndex(j => j.id === jobId && j.status === 'pending');
    if (index !== -1) {
      const job = this.queue.splice(index, 1)[0];
      job.status = 'cancelled';
      job.completedAt = new Date();
      this.completedJobs.set(job.id, job);
      return true;
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      isProcessing: this.isProcessing,
      registeredHandlers: Array.from(this.handlers.keys()),
    };
  }

  /**
   * Get pending jobs count by type
   */
  getPendingCountByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const job of this.queue) {
      counts[job.type] = (counts[job.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Clear all pending jobs
   */
  clearQueue(): number {
    const count = this.queue.length;
    this.queue = [];
    console.log(`[JobQueue] Cleared ${count} pending jobs`);
    return count;
  }

  /**
   * Wait for queue to be empty
   */
  async drain(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (this.queue.length > 0 || this.activeJobs > 0) {
      if (Date.now() - startTime > timeoutMs) {
        console.warn('[JobQueue] Drain timeout reached');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return true;
  }

  /**
   * Set concurrency limit
   */
  setConcurrency(limit: number): void {
    this.concurrency = Math.max(1, Math.min(limit, 10));
    console.log(`[JobQueue] Concurrency set to ${this.concurrency}`);
  }
}

// Export singleton instance
export const jobQueue = JobQueue.getInstance();
