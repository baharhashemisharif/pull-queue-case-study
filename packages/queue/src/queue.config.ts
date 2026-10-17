import { type JobsOptions, Queue } from "bullmq";
import type { QueueConfig, TaskData } from "./queue.types.js";
import { toSeconds } from "./utils.js";

export const QUEUE_NAME = "connector-tasks";

export const defaultTaskOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: {
    age: toSeconds({ amount: 3, format: "months" }),
    count: 10000,
  },
  removeOnFail: {
    age: toSeconds({ amount: 3, format: "months" }),
    count: 10000,
  },
};

export function createQueue(config: QueueConfig): Queue<TaskData> {
  return new Queue<TaskData>(config.queueName, {
    connection: { url: config.redisUrl },
    defaultJobOptions: config.defaultTaskOptions,
  });
}
