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
import { personality } from "../config/personality.js";
import { ai } from "../utils/ai.js";
import { calculateCost } from "../utils/calculateCost.js";
import { isNaomiMessage } from "../utils/isNaomi.js";
import { logger } from "../utils/logger.js";

/**
 * Handles a direct message from a user.
 * @param message - The message payload from Discord.
 */
export const handleThreadMessage

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
      const messages = await ai.messages.create({
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Required key format for SDK.
        max_tokens:  3000,
        messages:    [ { content: message.content, role: "user" } ],
        model:       "claude-sonnet-4-5-20250929",
        system:      `${personality} The user's name is ${message.author.displayName}`,
        temperature: 1,
      });

      const response = messages.content.find((messageInner) => {
        return messageInner.type === "text";
      });

      const cost = calculateCost(messages.usage);

      await message.channel.send(
        `${response?.text ?? "There was an error. Please try again later."}\n\n${cost}`,
      );
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
