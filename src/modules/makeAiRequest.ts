/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { personality } from "../config/personality.js";
import { ai } from "../utils/ai.js";
import type {
  MessageParam,
  Usage,
} from "@anthropic-ai/sdk/resources/messages.js";

/**
 * Makes an AI request to the Anthropic API.
 * @param context - The message context to send to the API.
 * @param username - The username of the user making the request.
 * @returns The content of the response and the usage.
 */
// eslint-disable-next-line max-lines-per-function -- The formatting ruins it.
export const makeAiRequest = async(
  context: Array<MessageParam>,
  username: string,
): Promise<{ content: Array<string>; usage: Usage }> => {
  const response = await ai.messages.create({
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Required key format for SDK.
    max_tokens:  3000,
    messages:    context,
    model:       "claude-sonnet-4-5-20250929",
    system:      `${personality} The user's name is ${username}`,
    temperature: 1,
    tools:       [ {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Required key format for SDK.
      max_uses: 5,
      name:     "web_search",
      type:     "web_search_20250305",
    } ],
  });
  const { usage } = response;
  const content = response.content.map((message) => {
    if (message.type === "text") {
      if (
        message.citations?.length !== undefined
        && message.citations.length > 0
      ) {
        return `**${message.text}**\n\n-# ${message.citations.
          filter((citation) => {
            return citation.type === "web_search_result_location";
          }).
          map((citation) => {
            return `${citation.title ?? "Unknown Title"}\n${citation.url}`;
          }).
          join(", ")}`;
      }
      return message.text;
    }
    if (message.type === "server_tool_use") {
      return `Searching for: ${JSON.stringify(message.input)}`;
    }
    if (message.type === "web_search_tool_result") {
      if (!Array.isArray(message.content)) {
        return `-# Found: ${JSON.stringify(message.content)}`;
      }
      return `-# Found: ${message.content.
        map((entry) => {
          return `[${entry.title}](<${entry.url}>)`;
        }).
        join(", ")}`;
    }
    if (message.type === "thinking") {
      return `-# Thinking: ${message.thinking}`;
    }
    if (message.type === "redacted_thinking") {
      return `-# Thinking: [Redacted]`;
    }
    return `-# Tool use: ${message.name}`;
  });
  return { content, usage };
};
