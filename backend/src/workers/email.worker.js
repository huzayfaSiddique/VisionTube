import { Worker } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { sendConfirmationEmail } from "../utils/sendEmail.js";

const QUEUE_NAME = "emailQueue";

export const initEmailWorker = () => {
  try {
    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        console.log(`⚙️ [Worker] Processing email job #${job.id} (${job.name}) for ${job.data.email}...`);

        if (job.name === "sendConfirmationEmail") {
          const { email, username, confirmationUrl } = job.data;
          const result = await sendConfirmationEmail({ email, username, confirmationUrl });
          return result;
        }
      },
      {
        connection: redisConfig,
        concurrency: 5, // Process up to 5 emails concurrently
      }
    );

    worker.on("completed", (job) => {
      console.log(`✅ [Worker] Email job #${job.id} sent successfully to ${job.data.email}`);
    });

    worker.on("failed", (job, err) => {
      console.error(`❌ [Worker] Email job #${job.id} failed for ${job?.data?.email}:`, err.message);
    });

    worker.on("error", (err) => {
      // Suppress spammy offline connection errors if Redis is not running locally
    });

    console.log("🚀 BullMQ Email Queue Worker initialized!");
    return worker;
  } catch (error) {
    console.warn("⚠️ Could not start BullMQ Email Worker:", error.message);
    return null;
  }
};
