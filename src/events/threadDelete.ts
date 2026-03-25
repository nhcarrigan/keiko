/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { AnyThreadChannel } from "discord.js";

/**
 * Logs thread deletion events to the activity log channel.
 * @param thread - The deleted thread channel.
 * @returns A promise that resolves when the event has been logged.
 */
export const onThreadDelete = async(
  thread: AnyThreadChannel,
): Promise<void> => {
  try {
    const fields = [
      `**Thread**: ${thread.name} (\`${thread.id}\`)`,
      `**Parent**: <#${thread.parentId ?? "Unknown"}>`,
    ].join("\n");

    await logActivity({
      client: thread.client,
      emoji:  "🗑️",
      fields: fields,
      title:  "Thread Deleted",
    });
  } catch (error) {
    await logger.error(
      "Failed to log thread delete",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
