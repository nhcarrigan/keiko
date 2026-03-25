/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable unicorn/no-keyword-prefix -- old/new prefixes are the established Discord.js event parameter names */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { AnyThreadChannel } from "discord.js";

/**
 * Logs thread update events to the activity log channel.
 * Only logs when the thread name changes to avoid noise from archive state changes.
 * @param oldThread - The thread state before the update.
 * @param newThread - The thread state after the update.
 * @returns A promise that resolves when the event has been logged.
 */
export const onThreadUpdate = async(
  oldThread: AnyThreadChannel,
  newThread: AnyThreadChannel,
): Promise<void> => {
  if (
    oldThread.name === newThread.name
    && oldThread.archived === newThread.archived
  ) {
    return;
  }

  try {
    const changes: Array<string> = [];

    if (oldThread.name !== newThread.name) {
      changes.push(`**Name**: \`${oldThread.name}\` → \`${newThread.name}\``);
    }

    if (oldThread.archived !== newThread.archived) {
      const wasArchived = oldThread.archived === true
        ? "Yes"
        : "No";
      const isArchived = newThread.archived === true
        ? "Yes"
        : "No";
      changes.push(`**Archived**: ${wasArchived} → ${isArchived}`);
    }

    const fields = [
      `**Thread**: ${newThread.name} (\`${newThread.id}\`)`,
      `**Parent**: <#${newThread.parentId ?? "Unknown"}>`,
      ...changes,
    ].join("\n");

    await logActivity({
      client: newThread.client,
      emoji:  "🔄",
      fields: fields,
      title:  "Thread Updated",
    });
  } catch (error) {
    await logger.error(
      "Failed to log thread update",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
