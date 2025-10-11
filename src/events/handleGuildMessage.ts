/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Message,
} from "discord.js";
import { makeAiRequest } from "../modules/makeAiRequest.js";
import { sendAiResponse } from "../modules/sendAiResponse.js";
import { calculateCost } from "../utils/calculateCost.js";
import { isNaomiMessage } from "../utils/isNaomi.js";
import { logger } from "../utils/logger.js";

/**
 * Handles a direct message from a user.
 * @param message - The message payload from Discord.
 */
export const handleGuildMessage

  = async(message: Message<true>): Promise<void> => {
    try {
      if (message.author.bot) {
        return;
      }
      const mentionsKeiko = message.mentions.has("1425897287065800785", {
        ignoreDirect:      false,
        ignoreEveryone:    true,
        ignoreRepliedUser: true,
        ignoreRoles:       true,
      });
      if (!mentionsKeiko) {
        return;
      }
      const isNaomi = await isNaomiMessage(message);
      if (!isNaomi) {
        return;
      }
      const thread = await message.startThread({
        name: `${message.author.displayName}'s Thread`,
      });
      await thread.sendTyping();

      const { content, usage } = await makeAiRequest(
        [ { content: message.content, role: "user" } ],
        message.author.displayName,
      );
      const cost = calculateCost(usage);

      await sendAiResponse(
        [ ...content, cost ],
        thread.send.bind(thread),
        thread.sendTyping.bind(thread),
      );
      await logger.metric("guild_message", 1, { cost });
    } catch (error) {
      await logger.error("message event", error instanceof Error
        ? error
        : new Error(String(error)));
      const button = new ButtonBuilder().
        setLabel("Need help?").
        setStyle(ButtonStyle.Link).
        setURL("https://chat.nhcarrigan.com");
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
      await message.reply({
        components: [ row ],
        content:    error instanceof Error
          ? error.message
          : "Something went wrong.",
      });
    }
  };
