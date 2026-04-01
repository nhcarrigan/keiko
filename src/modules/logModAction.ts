/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable unicorn/prevent-abbreviations -- File name kept short for convention; logModAction is the established name */

import { ChannelType, type Client } from "discord.js";
import { channelConfig } from "../config/channels.js";
import { modLogMessage, type ColourKey } from "../utils/components.js";
import { logger } from "../utils/logger.js";

interface ModuleActionData {
  readonly action:         string;
  readonly colour:         ColourKey;
  readonly emoji:          string;
  readonly moderatorTag:   string;
  readonly reason:         string;
  readonly sanctionNumber: number | null;
  readonly source:         "Audit Log" | "Command";
  readonly targetId:       string;
  readonly targetTag:      string;
}

/**
 * Posts a moderation action entry to the configured mod log channel.
 * @param client - The Discord client instance.
 * @param data - The moderation action data to log.
 * @returns A promise that resolves when the log entry has been posted.
 */
const logModerationAction = async(
  client: Client,
  data: ModuleActionData,
): Promise<void> => {
  try {
    const rawChannel = client.channels.cache.get(channelConfig.modLog);

    if (rawChannel?.type !== ChannelType.GuildText) {
      await logger.error(
        "Mod log channel not found",
        new Error(`Channel ID: ${channelConfig.modLog}`),
      );
      return;
    }

    const sanctionLine
      = data.sanctionNumber === null
        ? ""
        : `\n**Case**: #${data.sanctionNumber.toString()}`;

    const fields = [
      `**Moderator**: ${data.moderatorTag}`,
      `**Target**: ${data.targetTag} (\`${data.targetId}\`)`,
      `**Reason**: ${data.reason}`,
      sanctionLine,
    ].
      filter(Boolean).
      join("\n");

    await rawChannel.send(
      modLogMessage(`${data.emoji} ${data.action}`, fields, data.source, data.colour),
    );
  } catch (error) {
    await logger.error(
      "Failed to log mod action",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};

export type { ModuleActionData };
export { logModerationAction };
