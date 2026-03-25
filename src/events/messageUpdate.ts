/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable unicorn/no-keyword-prefix -- old/new prefixes are the established Discord.js event parameter names */
/* eslint-disable complexity -- Event handler checks multiple conditions to avoid logging irrelevant updates */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { Message, PartialMessage } from "discord.js";

/**
 * Logs message edit events to the activity log channel.
 * Only fires when the content actually changes, ignoring embed-only updates.
 * @param oldMessage - The message before the edit.
 * @param newMessage - The message after the edit.
 * @returns A promise that resolves when the event has been logged.
 */
export const onMessageUpdate = async(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage,
): Promise<void> => {
  if (newMessage.author?.bot === true) {
    return;
  }

  if (newMessage.guild === null) {
    return;
  }

  if (oldMessage.content === newMessage.content) {
    return;
  }

  try {
    const before = oldMessage.content ?? "*Not cached*";
    const after = newMessage.content ?? "*Not cached*";

    const truncated = (text: string): string => {
      return text.length > 1024
        ? `${text.slice(0, 1021)}...`
        : text;
    };

    const fields = [
      `**Channel**: <#${newMessage.channelId}>`,
      `**Message ID**: \`${newMessage.id}\``,
      `**Author**: ${newMessage.author?.username ?? "Unknown"} (\`${newMessage.author?.id ?? "Unknown"}\`)`,
      `**Before**: ${truncated(before)}`,
      `**After**: ${truncated(after)}`,
    ].join("\n");

    await logActivity({
      client: newMessage.client,
      emoji:  "✏️",
      fields: fields,
      title:  "Message Edited",
    });
  } catch (error) {
    await logger.error(
      "Failed to log message update",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
