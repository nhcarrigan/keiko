/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type AnyThreadChannel,
  type Message,
} from "discord.js";
import { makeAiRequest } from "../modules/makeAiRequest.js";
import { sendAiResponse } from "../modules/sendAiResponse.js";
import { calculateCost } from "../utils/calculateCost.js";
import { isNaomiMessage } from "../utils/isNaomi.js";
import { logger } from "../utils/logger.js";
import type { MessageParam } from "@anthropic-ai/sdk/resources/index.js";

/**
 * Handles a direct message from a user.
 * @param message - The message payload from Discord.
 */
export const handleThreadMessage
// eslint-disable-next-line max-lines-per-function, max-statements -- We're off by one bloody line.
= async(message: Message<true>): Promise<void> => {
  try {
    // @ts-expect-error -- This is a workaround to get the channel type.
    const channel: AnyThreadChannel = message.channel;
    if (message.author.bot) {
      return;
    }
    const owner = await channel.fetchOwner();
    if (owner?.id !== "1425897287065800785") {
      return;
    }
    const isNaomi = await isNaomiMessage(message);
    if (!isNaomi) {
      return;
    }
    await channel.sendTyping();
    const historyRequest = await message.channel.messages.fetch({ limit: 20 });
    const history = [ ...historyRequest.values() ];
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
    const { content, usage } = await makeAiRequest(
      context,
      message.author.displayName,
    );
    const cost = calculateCost(usage);

    await sendAiResponse(
      [ ...content, cost ],
      message.channel.send.bind(message.channel),
      message.channel.sendTyping.bind(message.channel),
    );
    await logger.metric("thread_message", 1, { cost });
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
