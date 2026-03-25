/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

// eslint-disable-next-line stylistic/max-len -- Merged type imports from discord.js cannot be shortened without splitting the import
import { AuditLogEvent, type Client, type Guild, type GuildAuditLogsEntry } from "discord.js";
import { logModerationAction } from "../modules/logModAction.js";
import { sendSanction } from "../modules/sendSanction.js";
import { logger } from "../utils/logger.js";

/**
 * Determines if an audit log entry was created by the bot itself,
 * in which case the command handler has already processed it.
 * @param entry - The audit log entry to check.
 * @param client - The Discord client instance.
 * @returns True if the entry was created by the bot itself.
 */
const isOwnAction = (entry: GuildAuditLogsEntry, client: Client): boolean => {
  return entry.executor?.id === client.user?.id;
};

/**
 * Resolves a potentially null string to a defined string fallback.
 * @param value - The potentially null or undefined string value.
 * @param fallback - The fallback string to use if value is nullish.
 * @returns The resolved string.
 */
const resolveString = (
  value: string | null | undefined,
  fallback: string,
): string => {
  return value ?? fallback;
};

/**
 * Handles manual unban events detected from the audit log.
 * @param entry - The audit log entry for the unban event.
 * @param client - The Discord client instance.
 * @returns A promise that resolves when the unban has been logged.
 */
const handleManualUnban = async(
  entry: GuildAuditLogsEntry<AuditLogEvent.MemberBanRemove>,
  client: Client,
): Promise<void> => {
  const { target, executor, reason } = entry;

  if (!target) {
    return;
  }

  const targetId = resolveString(target.id, "Unknown");
  const targetUsername = resolveString(target.username, "Unknown");
  const moderatorTag = resolveString(executor?.username, "Unknown");
  const resolvedReason = reason ?? "No reason provided";

  await logModerationAction(client, {
    action:         "Member Unbanned",
    emoji:          "🔓",
    moderatorTag:   moderatorTag,
    reason:         resolvedReason,
    sanctionNumber: null,
    source:         "Audit Log",
    targetId:       targetId,
    targetTag:      targetUsername,
  });
};

/**
 * Handles manual ban events detected from the audit log.
 * @param entry - The audit log entry for the ban event.
 * @param client - The Discord client instance.
 * @returns A promise that resolves when the ban has been logged.
 */
const handleManualBan = async(
  entry: GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd>,
  client: Client,
): Promise<void> => {
  const { target, executor, reason } = entry;

  if (!target) {
    return;
  }

  const targetId = resolveString(target.id, "Unknown");
  const targetUsername = resolveString(target.username, "Unknown");
  const targetTag = resolveString(target.username, targetUsername);
  const moderatorTag = resolveString(executor?.username, "Unknown");
  const resolvedReason = reason ?? "No reason provided";

  const sanctionNumber = await sendSanction({
    reason:   resolvedReason,
    type:     "ban",
    username: targetUsername,
    uuid:     targetId,
  });

  await logModerationAction(client, {
    action:         "Member Banned",
    emoji:          "🔨",
    moderatorTag:   moderatorTag,
    reason:         resolvedReason,
    sanctionNumber: sanctionNumber,
    source:         "Audit Log",
    targetId:       targetId,
    targetTag:      targetTag,
  });
};

/**
 * Handles manual kick events detected from the audit log.
 * @param entry - The audit log entry for the kick event.
 * @param client - The Discord client instance.
 * @returns A promise that resolves when the kick has been logged.
 */
const handleManualKick = async(
  entry: GuildAuditLogsEntry<AuditLogEvent.MemberKick>,
  client: Client,
): Promise<void> => {
  const { target, executor, reason } = entry;

  if (!target) {
    return;
  }

  const targetId = resolveString(target.id, "Unknown");
  const targetUsername = resolveString(target.username, "Unknown");
  const targetTag = resolveString(target.username, targetUsername);
  const moderatorTag = resolveString(executor?.username, "Unknown");
  const resolvedReason = reason ?? "No reason provided";

  const sanctionNumber = await sendSanction({
    reason:   resolvedReason,
    type:     "kick",
    username: targetUsername,
    uuid:     targetId,
  });

  await logModerationAction(client, {
    action:         "Member Kicked",
    emoji:          "👢",
    moderatorTag:   moderatorTag,
    reason:         resolvedReason,
    sanctionNumber: sanctionNumber,
    source:         "Audit Log",
    targetId:       targetId,
    targetTag:      targetTag,
  });
};

/**
 * Handles manual timeout events detected from the audit log.
 * Checks member update changes for `communication_disabled_until` being set.
 * @param entry - The audit log entry for the member update event.
 * @param client - The Discord client instance.
 * @returns A promise that resolves when the timeout has been logged.
 */
const handleManualTimeout = async(
  entry: GuildAuditLogsEntry<AuditLogEvent.MemberUpdate>,
  client: Client,
): Promise<void> => {
  const timeoutChange = entry.changes.find(
    (change) => {
      return change.key === "communication_disabled_until";
    },
  );

  if (typeof timeoutChange?.new !== "string") {
    return;
  }

  const { target, executor, reason } = entry;

  if (!target) {
    return;
  }

  const targetId = resolveString(target.id, "Unknown");
  const targetUsername = resolveString(target.username, "Unknown");
  const targetTag = resolveString(target.username, targetUsername);
  const moderatorTag = resolveString(executor?.username, "Unknown");
  const resolvedReason = reason ?? "No reason provided";

  const sanctionNumber = await sendSanction({
    reason:   resolvedReason,
    type:     "mute",
    username: targetUsername,
    uuid:     targetId,
  });

  await logModerationAction(client, {
    action:         "Member Muted",
    emoji:          "🔇",
    moderatorTag:   moderatorTag,
    reason:         resolvedReason,
    sanctionNumber: sanctionNumber,
    source:         "Audit Log",
    targetId:       targetId,
    targetTag:      targetTag,
  });
};

/**
 * Processes new audit log entries to detect and record manual moderation actions.
 * @param entry - The new audit log entry.
 * @param _guild - The guild the entry belongs to (unused).
 * @param client - The Discord client instance.
 * @returns A promise that resolves when the entry has been processed.
 */
export const onGuildAuditLogEntryCreate = async(
  entry: GuildAuditLogsEntry,
  _guild: Guild,
  client: Client,
): Promise<void> => {
  if (isOwnAction(entry, client)) {
    return;
  }

  try {
    if (entry.action === AuditLogEvent.MemberBanRemove) {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions, stylistic/max-len -- Narrowed by action equality check; type name is verbose */
      const unbanEntry = entry as GuildAuditLogsEntry<AuditLogEvent.MemberBanRemove>;
      await handleManualUnban(unbanEntry, client);
      return;
    }

    if (entry.action === AuditLogEvent.MemberBanAdd) {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Narrowed by action equality check */
      const banEntry = entry as GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd>;
      await handleManualBan(banEntry, client);
      return;
    }

    if (entry.action === AuditLogEvent.MemberKick) {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Narrowed by action equality check */
      const kickEntry = entry as GuildAuditLogsEntry<AuditLogEvent.MemberKick>;
      await handleManualKick(kickEntry, client);
      return;
    }

    if (entry.action === AuditLogEvent.MemberUpdate) {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions, stylistic/max-len -- Narrowed by action equality check; type name is verbose */
      const updateEntry = entry as GuildAuditLogsEntry<AuditLogEvent.MemberUpdate>;
      await handleManualTimeout(updateEntry, client);
    }
  } catch (error) {
    await logger.error(
      "Failed to process audit log entry",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
