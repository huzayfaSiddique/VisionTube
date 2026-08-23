import { Queue } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { sendConfirmationEmail } from "../utils/sendEmail.js";

const QUEUE_NAME = "emailQueue";

let emailQueue = null;
let isRedisAvailable = true;

try {
  emailQueue = new Queue(QUEUE_NAME, {
    connection: redisConfig,
  });

  // Handle connection errors gracefully
  emailQueue.on("error", (err) => {
    if (isRedisAvailable) {
      console.warn("⚠️ Redis connection unavailable for BullMQ Queue. Using fallback email dispatch mode.", err.message);
      isRedisAvailable = false;
    }
  });
} catch (error) {
  console.warn("⚠️ Failed to initialize BullMQ email queue, falling back to direct background execution.", error.message);
  isRedisAvailable = false;
}

/**
 * Adds a confirmation email job to the BullMQ Queue with exponential retries.
 * Falls back to direct async execution if Redis is unavailable.
 */
export const addConfirmationEmailToQueue = async ({ email, username, confirmationUrl }) => {
  if (isRedisAvailable && emailQueue) {
    try {
      await emailQueue.add(
        "sendConfirmationEmail",
        { email, username, confirmationUrl },
        {
          attempts: 3, // Retry up to 3 times on failure
          backoff: {
            type: "exponential",
            delay: 5000, // Wait 5s, 10s, 20s between retries
          },
          removeOnComplete: true, // Clean up completed jobs
          removeOnFail: 100, // Keep last 100 failed jobs for debugging
        }
      );
      console.log(`📥 Enqueued confirmation email job for ${email} in BullMQ`);
      return;
    } catch (err) {
      console.warn("⚠️ Queue push failed, using fallback direct email execution:", err.message);
      isRedisAvailable = false;
    }
  }

  // Fallback: Direct background non-blocking execution
  setImmediate(() => {
    sendConfirmationEmail({ email, username, confirmationUrl }).catch((err) =>
      console.error("Background fallback email dispatch failed:", err)
    );
  });
};
