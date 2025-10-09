/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  ChannelType,
  type Message,
  type OmitPartialGroupDMChannel,
} from "discord.js";
import { handleDmMessage } from "./handleDmMessage.js";
import { handleGuildMessage } from "./handleGuildMessage.js";
import { handleThreadMessage } from "./handleThreadMessage.js";

/**
 * Handles the message event from Discord.
 * @param message -- The message payload from Discord.
 */
export const onMessage = async(
  message: OmitPartialGroupDMChannel<Message>,
): Promise<void> => {
  if (message.channel.type === ChannelType.DM) {
    await handleDmMessage(message);
    return;
  }
  // This should not be true at this point, but we need to narrow this.
  if (!message.inGuild()) {
    return;
  }
  if (
    message.channel.type === ChannelType.PublicThread
    || message.channel.type === ChannelType.PrivateThread
  ) {
    await handleThreadMessage(message);
    return;
  }
  await handleGuildMessage(message);
};
