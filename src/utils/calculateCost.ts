/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import type { Usage } from "@anthropic-ai/sdk/resources/index.js";

/**
 * Calculates the cost of a command run by a user, and sends to
 * our logging service.
 * @param usage -- The usage payload from Anthropic.
 * @returns A string containing the usage and cost information.
 */
export const calculateCost = (
  usage: Usage,
): string => {
  const inputCost = usage.input_tokens * ((usage.input_tokens > 200_000
    ? 6
    : 3) / 1_000_000);
  const outputCost = usage.output_tokens * ((usage.output_tokens > 200_000
    ? 22.5
    : 15) / 1_000_000);
  const totalCost = inputCost + outputCost;
  return `-# Accepted ${usage.input_tokens.toString()} and generated ${usage.output_tokens.toString()}.
    
    -# Total cost: ${totalCost.toLocaleString("en-GB", {
      currency: "USD",
      style:    "currency",
    })}`;
};
