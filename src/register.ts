/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable no-console -- Standalone registration script; no logger available */

import { REST, Routes } from "discord.js";
import { banCommand } from "./commands/ban.js";
import { kickCommand } from "./commands/kick.js";
import { muteCommand } from "./commands/mute.js";
import { pruneCommand } from "./commands/prune.js";
import { softbanCommand } from "./commands/softban.js";
import { unbanCommand } from "./commands/unban.js";
import { unmuteCommand } from "./commands/unmute.js";
import { warnCommand } from "./commands/warn.js";
import { guildConfig } from "./config/guild.js";

const commandData = [
  banCommand.data.toJSON(),
  unbanCommand.data.toJSON(),
  kickCommand.data.toJSON(),
  muteCommand.data.toJSON(),
  pruneCommand.data.toJSON(),
  softbanCommand.data.toJSON(),
  unmuteCommand.data.toJSON(),
  warnCommand.data.toJSON(),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? "");

/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- REST returns unknown; shape is documented by Discord API */
const me = await rest.get(Routes.user()) as { id: string; username: string };
console.log(`Authenticated as: ${me.username} (${me.id})`);

try {
  console.log(
    `Registering ${commandData.length.toString()} commands for guild ${guildConfig.guildId}...`,
  );

  await rest.put(
    Routes.applicationGuildCommands(
      guildConfig.clientId,
      guildConfig.guildId,
    ),
    { body: commandData },
  );

  console.log("Commands registered successfully.");
} catch (error) {
  console.error(
    "Failed to register commands:",
    error instanceof Error
      ? error.message
      : String(error),
  );
}
