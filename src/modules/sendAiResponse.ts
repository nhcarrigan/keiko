/* eslint-disable no-await-in-loop -- This is necessary so we can send the responses sequentially.*/
/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { sleep } from "../utils/sleep.js";
import type { DMChannel, GuildTextBasedChannel, Message } from "discord.js";

/**
 * Sends an AI response to a channel.
 * @param content - The content to send.
 * @param send - The send or reply function to use.
 * @param type - The sendTyping function to use.
 */
export const sendAiResponse = async(
  content: Array<string>,
  send: GuildTextBasedChannel["send"] | DMChannel["send"] | Message["reply"],
  type: GuildTextBasedChannel["sendTyping"],
): Promise<void> => {
  const joined = content.join("\n\n");
  if (joined.length < 2000) {
    await send(joined);
    return;
  }
  const chunks = joined.match(/[\S\s]{1,2000}/g);
  if (chunks) {
    for (const chunk of chunks) {
      await send(chunk);
      await type();
      await sleep(2500);
    }
  }
};
