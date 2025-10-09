/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import { DiscordAnalytics } from "@nhcarrigan/discord-analytics";
import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { onMessage } from "./events/onMessage.js";
import { clear } from "./modules/clear.js";
import { dm } from "./modules/dm.js";
import { instantiateServer } from "./server/serve.js";
import { logger } from "./utils/logger.js";

process.on("unhandledRejection", (error) => {
  if (error instanceof Error) {
    void logger.error("Unhandled Rejection", error);
    return;
  }
  void logger.error("unhandled rejection", new Error(String(error)));
});

process.on("uncaughtException", (error) => {
  if (error instanceof Error) {
    void logger.error("Uncaught Exception", error);
    return;
  }
  void logger.error("uncaught exception", new Error(String(error)));
});

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [ Partials.Channel ],
});

const analytics = new DiscordAnalytics(client, logger);

client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) {
    switch (interaction.commandName) {
      case "dm":
        void dm(interaction);
        break;
      case "clear":
        void clear(interaction);
        break;
      default:
        void interaction.reply({
          content:   `I'm sorry, I don't know the ${interaction.commandName} command.`,
          ephemeral: true,
        });
        break;
    }
  }
});

client.on(Events.MessageCreate, (message) => {
  void onMessage(message);
});

client.on(Events.EntitlementCreate, (entitlement) => {
  void logger.log("info", `User ${entitlement.userId} has subscribed!`);
});

client.on(Events.EntitlementDelete, (entitlement) => {
  void logger.log("info", `User ${entitlement.userId} has unsubscribed... :c`);
});

client.on(Events.ClientReady, () => {
  void logger.log("debug", "Bot is ready.");
  analytics.startCron();
});

instantiateServer();
await client.login(process.env.DISCORD_TOKEN);
