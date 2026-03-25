/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { Message, PartialMessage } from "discord.js";

/**
 * Resolves the displayable content for a deleted message.
 * @param rawContent - The raw message content, which may be null if uncached.
 * @returns A displayable string representation of the content.
 */
const resolveContent = (rawContent: string | null): string => {
  if (rawContent === null || rawContent === "") {
    return "*Not cached*";
  }

  if (rawContent.length > 1024) {
    return `${rawContent.slice(0, 1021)}...`;
  }

  return rawContent;
};

/**
 * Logs message deletion events to the activity log channel.
 * Content is only available if the message was cached prior to deletion.
 * @param message - The deleted message (may be partial if uncached).
 * @returns A promise that resolves when the event has been logged.
 */
export const onMessageDelete = async(
  message: Message | PartialMessage,
): Promise<void> => {
  if (message.author?.bot === true) {
    return;
  }

  if (!message.guild) {
    return;
  }

  try {
    const content = resolveContent(message.content);

    const fields = [
      `**Channel**: <#${message.channelId}>`,
      `**Message ID**: \`${message.id}\``,
      `**Author**: ${message.author?.username ?? "Unknown"} (\`${message.author?.id ?? "Unknown"}\`)`,
      `**Content**: ${content}`,
    ].join("\n");

    await logActivity({
      client: message.client,
      emoji:  "🗑️",
      fields: fields,
      title:  "Message Deleted",
    });
  } catch (error) {
    await logger.error(
      "Failed to log message delete",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
