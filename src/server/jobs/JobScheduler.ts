/* FILE: src/server/jobs/JobScheduler.ts */
import { DailySummaryJob } from './DailySummaryJob';

export class JobScheduler {
  private static instance: JobScheduler;
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private lastDailySummaryRun: Date | null = null;

  private constructor() {}

  static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  startAllJobs(): void {
    this.scheduleDailySummaryJob();
    this.scheduleCleanupJob();
    console.log('All scheduled jobs started');
  }

  private scheduleDailySummaryJob(): void {
    const checkInterval = setInterval(async () => {
      const now = new Date();
      const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7 for Jakarta
      const hour = jakartaTime.getHours();
      const minute = jakartaTime.getMinutes();

      // Run at 1:00 AM Jakarta time
      if (hour === 1 && minute === 0) {
        const today = jakartaTime.toISOString().split('T')[0];
        const lastRunDate = this.lastDailySummaryRun?.toISOString().split('T')[0];

        if (lastRunDate !== today) {
          console.log('Running daily summary job...');
          try {
            await DailySummaryJob.runDailyJob();
            this.lastDailySummaryRun = new Date();
            console.log('Daily summary job completed successfully');
          } catch (error) {
            console.error('Daily summary job failed:', error);
          }
        }
      }
    }, 60000); // Check every minute

    this.jobs.set('dailySummary', checkInterval);
    console.log('Daily summary job scheduled to check every minute for 1:00 AM Jakarta time');
  }

  private scheduleCleanupJob(): void {
    const checkInterval = setInterval(async () => {
      const now = new Date();
      const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const hour = jakartaTime.getHours();
      const minute = jakartaTime.getMinutes();
      const dayOfWeek = jakartaTime.getDay(); // 0 = Sunday

      // Run at 2:00 AM every Sunday
      if (dayOfWeek === 0 && hour === 2 && minute === 0) {
        console.log('Running weekly cleanup job...');
        try {
          const job = new DailySummaryJob();
          await job.cleanupOldSummaries(90);
          console.log('Weekly cleanup job completed successfully');
        } catch (error) {
          console.error('Weekly cleanup job failed:', error);
        }
      }
    }, 60000); // Check every minute

    this.jobs.set('weeklyCleanup', checkInterval);
    console.log('Weekly cleanup job scheduled to check every minute for 2:00 AM Sunday Jakarta time');
  }

  stopAllJobs(): void {
    this.jobs.forEach((timer, name) => {
      clearInterval(timer);
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
    console.log('All scheduled jobs stopped');
  }

  stopJob(jobName: string): boolean {
    const timer = this.jobs.get(jobName);
    if (timer) {
      clearInterval(timer);
      this.jobs.delete(jobName);
      console.log(`Stopped job: ${jobName}`);
      return true;
    }
    return false;
  }

  getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((timer, name) => {
      status[name] = timer !== undefined;
    });
    return status;
  }

  async runJobNow(jobName: string): Promise<void> {
    switch (jobName) {
      case 'dailySummary':
        console.log('Running daily summary job manually...');
        await DailySummaryJob.runDailyJob();
        this.lastDailySummaryRun = new Date();
        break;
      case 'cleanup':
        console.log('Running cleanup job manually...');
        const job = new DailySummaryJob();
        await job.cleanupOldSummaries(90);
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  getLastDailySummaryRun(): Date | null {
    return this.lastDailySummaryRun;
  }
}