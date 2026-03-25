/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable unicorn/no-keyword-prefix -- old/new prefixes are the established Discord.js event parameter names */

import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { banCommand } from "./commands/ban.js";
import { kickCommand } from "./commands/kick.js";
import { muteCommand } from "./commands/mute.js";
import { pruneCommand } from "./commands/prune.js";
import { softbanCommand } from "./commands/softban.js";
import { unbanCommand } from "./commands/unban.js";
import { unmuteCommand } from "./commands/unmute.js";
import { warnCommand } from "./commands/warn.js";
import { guildConfig } from "./config/guild.js";
// eslint-disable-next-line stylistic/max-len -- Import path cannot be shortened
import { onGuildAuditLogEntryCreate } from "./events/guildAuditLogEntryCreate.js";
import { onGuildMemberAdd } from "./events/guildMemberAdd.js";
import { onGuildMemberRemove } from "./events/guildMemberRemove.js";
import { onGuildMemberUpdate } from "./events/guildMemberUpdate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onMessageDelete } from "./events/messageDelete.js";
import { onMessageUpdate } from "./events/messageUpdate.js";
import { onThreadCreate } from "./events/threadCreate.js";
import { onThreadDelete } from "./events/threadDelete.js";
import { onThreadUpdate } from "./events/threadUpdate.js";
import { onUserUpdate } from "./events/userUpdate.js";
import { onVoiceStateUpdate } from "./events/voiceStateUpdate.js";
import { logger } from "./utils/logger.js";
import type { Command } from "./interfaces/command.js";

process.on("unhandledRejection", (error) => {
  if (error instanceof Error) {
    void logger.error("Unhandled Rejection", error);
    return;
  }
  void logger.error("Unhandled Rejection", new Error(String(error)));
});

process.on("uncaughtException", (error) => {
  if (error instanceof Error) {
    void logger.error("Uncaught Exception", error);
    return;
  }
  void logger.error("Uncaught Exception", new Error(String(error)));
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [ Partials.Message, Partials.Channel ],
});

const commands = new Collection<string, Command>();

for (const command of [
  banCommand,
  unbanCommand,
  kickCommand,
  muteCommand,
  pruneCommand,
  softbanCommand,
  unmuteCommand,
  warnCommand,
]) {
  commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, (interaction) => {
  void onInteractionCreate(interaction, commands);
});

client.on(Events.GuildMemberAdd, (member) => {
  void onGuildMemberAdd(member);
});

client.on(Events.GuildMemberRemove, (member) => {
  void onGuildMemberRemove(member);
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  void onGuildMemberUpdate(oldMember, newMember);
});

client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
  void onMessageUpdate(oldMessage, newMessage);
});

client.on(Events.MessageDelete, (message) => {
  void onMessageDelete(message);
});

client.on(Events.ThreadCreate, (thread) => {
  void onThreadCreate(thread);
});

client.on(Events.ThreadDelete, (thread) => {
  void onThreadDelete(thread);
});

client.on(Events.ThreadUpdate, (oldThread, newThread) => {
  void onThreadUpdate(oldThread, newThread);
});

client.on(Events.UserUpdate, (oldUser, newUser) => {
  void onUserUpdate(oldUser, newUser);
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  void onVoiceStateUpdate(oldState, newState);
});

client.on(Events.GuildAuditLogEntryCreate, (entry, guild) => {
  void onGuildAuditLogEntryCreate(entry, guild, client);
});

client.on(Events.ClientReady, (readyClient) => {
  void (async(): Promise<void> => {
    const guild = readyClient.guilds.cache.get(guildConfig.guildId);
    if (guild) {
      await guild.members.fetch();
    }
    await logger.log(
      "debug",
      `Keiko is online as ${readyClient.user.username}.`,
    );
  })();
});

await client.login(process.env.DISCORD_TOKEN);
