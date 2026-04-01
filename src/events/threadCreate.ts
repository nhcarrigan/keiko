/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { AnyThreadChannel } from "discord.js";

/**
 * Logs thread creation events to the activity log channel.
 * @param thread - The newly created thread channel.
 * @returns A promise that resolves when the event has been logged.
 */
export const onThreadCreate = async(
  thread: AnyThreadChannel,
): Promise<void> => {
  try {
    const createdBy = `<@${thread.ownerId}>`;

    const fields = [
      `**Thread**: ${thread.name} (\`${thread.id}\`)`,
      `**Parent**: <#${thread.parentId ?? "Unknown"}>`,
      `**Created By**: ${createdBy}`,
    ].join("\n");

    await logActivity({
      client: thread.client,
      colour: "threadCreated",
      emoji:  "🧵",
      fields: fields,
      title:  "Thread Created",
    });
  } catch (error) {
    await logger.error(
      "Failed to log thread create",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
