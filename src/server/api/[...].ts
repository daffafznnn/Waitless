import { fromNodeMiddleware, eventHandler } from 'h3';
import { app, bootstrap } from '../../backend/index';

/**
 * Standard Nuxt Server Route for API
 * Wraps the existing Express app (now in src/backend)
 * Handles all requests to /api/**
 */
export default eventHandler(async (event) => {
  try {
    // Ensure DB is connected (lazy init for serverless)
    await bootstrap({ enableJobs: false });

    // Forward request to Express app
    return fromNodeMiddleware(app)(event);
  } catch (error: any) {
    console.error('SERVER BOOTSTRAP ERROR:', error);
    
    // Return detailed error for debugging (forcing usage of setResponseStatus for Nitro)
    event.node.res.statusCode = 500;
    return {
      ok: false,
      error: 'Server Bootstrap Failed',
      message: error.message || String(error),
      debug_stack: error.stack,
      hint: 'Check Vercel Console Logs for more details'
    };
  }
});
