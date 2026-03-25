/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export interface Command {
  readonly data:    Pick<SlashCommandBuilder, "name" | "toJSON">;
  readonly execute: (
    interaction: ChatInputCommandInteraction,
  )=> Promise<void>;
}
