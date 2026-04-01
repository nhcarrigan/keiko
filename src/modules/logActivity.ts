/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { ChannelType, type Client } from "discord.js";
import { channelConfig } from "../config/channels.js";
import { activityMessage, type ColourKey } from "../utils/components.js";
import { logger } from "../utils/logger.js";

interface ActivityData {
  readonly client: Client;
  readonly colour: ColourKey;
  readonly emoji:  string;
  readonly fields: string;
  readonly title:  string;
}

/**
 * Posts an activity entry to the configured activity log channel.
 * @param data - The activity data to log.
 * @returns A promise that resolves when the log entry has been posted.
 */
const logActivity = async(data: ActivityData): Promise<void> => {
  try {
    const rawChannel = data.client.channels.cache.get(
      channelConfig.activityLog,
    );

    if (rawChannel?.type !== ChannelType.GuildText) {
      await logger.error(
        "Activity log channel not found",
        new Error(`Channel ID: ${channelConfig.activityLog}`),
      );
      return;
    }

    await rawChannel.send(
      activityMessage(data.emoji, data.title, data.fields, data.colour),
    );
  } catch (error) {
    await logger.error(
      "Failed to log activity",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};

export { logActivity };
