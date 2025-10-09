/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

// eslint-disable-next-line @typescript-eslint/naming-convention -- Importing a class.
import Anthropic from "@anthropic-ai/sdk";

/**
 * The Anthropic AI instance.
 */
export const ai = new Anthropic({
  apiKey: process.env.AI_TOKEN,
});
