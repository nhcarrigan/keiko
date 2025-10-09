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
  type OmitPartialGroupDMChannel,
} from "discord.js";
import { personality } from "../config/personality.js";
import { ai } from "../utils/ai.js";
import { calculateCost } from "../utils/calculateCost.js";
import { isNaomiMessage } from "../utils/isNaomi.js";
import { logger } from "../utils/logger.js";
import type { MessageParam } from "@anthropic-ai/sdk/resources/index.js";

/**
 * Handles a direct message from a user.
 * @param message - The message payload from Discord.
 */
export const handleDmMessage
// eslint-disable-next-line max-lines-per-function -- We're off by one bloody line.
  = async(message: OmitPartialGroupDMChannel<Message>): Promise<void> => {
    try {
      if (message.author.bot) {
        return;
      }
      const isNaomi = await isNaomiMessage(message);
      if (!isNaomi) {
        return;
      }
      const historyRequest
      = await message.channel.messages.fetch({ limit: 20 });
      const history = [ ...historyRequest.values() ];
      const clearMessageIndex = history.findIndex((messageInner) => {
        return (
          messageInner.content === "<Clear History>"
        && messageInner.author.id === message.client.user.id
        );
      });
      if (clearMessageIndex !== -1) {
      // Remove the clear message and everything sent before it, which means everything after in the array because the array is backwards
        history.splice(clearMessageIndex, history.length - clearMessageIndex);
      }
      const context: Array<MessageParam> = history.
        reverse().
        map((messageInner) => {
          return {
            content: messageInner.content,
            role:
            messageInner.author.id === message.client.user.id
              ? "assistant"
              : "user",
          };
        });
      const messages = await ai.messages.create({
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Required key format for SDK.
        max_tokens:  3000,
        messages:    context,
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
