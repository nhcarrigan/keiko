# Keiko — Moderation Bot Rewrite

## Overview

Complete rewrite of Keiko from an AI companion bot into a full-featured community moderation bot for Naomi's Discord server.

---

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Discord Library**: discord.js v14
- **Config**: `@nhcarrigan/typescript-config`
- **Linting**: `@nhcarrigan/eslint-config`
- **Logging**: `@nhcarrigan/logger`
- **Package Manager**: pnpm

---

## Planned Commands

All moderation commands respond **ephemerally** using **Discord Components v2**.

| Command | Description | Sanction Type |
|---------|-------------|---------------|
| `/warn <user> <reason>` | Issues a formal warning | `warning` |
| `/mute <user> <duration> <reason>` | Applies Discord native timeout | `mute` |
| `/unmute <user> <reason>` | Removes Discord native timeout | *(none)* |
| `/kick <user> <reason>` | Kicks user from server | `kick` |
| `/softban <user> <reason>` | Bans + immediately unbans (message purge) | `kick` |
| `/ban <user> <reason> [days]` | Permanently bans user | `ban` |
| `/prune <amount max:100>` | Deletes last N messages in current channel | *(none — logged to mod channel only)* |

---

## Logging Channels

Three configurable logging channels (set via environment/config):

| Channel | Events |
|---------|--------|
| **Welcome/Goodbye** | `guildMemberAdd`, `guildMemberRemove` |
| **Activity Log** | Message create/edit/delete, thread create/delete/update, voice channel join/leave/move |
| **Moderation Log** | All command-issued sanctions + parsed audit log actions (manual bans, kicks, timeouts) |

---

## Sanction API Integration

**Endpoint**: `POST https://hikari.spellware.dev/sanction`
**Auth**: `Authorization: {SANCTION_TOKEN}`

**Payload**:
```json
{
  "platform": "discord",
  "uuid": "<target user ID>",
  "username": "<target username>",
  "type": "warning | kick | mute | ban",
  "reason": "<reason>"
}
```

**Triggers** (sanction created for each):
- `/warn` → `warning`
- `/mute` → `mute`
- `/kick` → `kick`
- `/softban` → `kick`
- `/ban` → `ban`
- Audit log: manual ban detected → `ban`
- Audit log: manual kick detected → `kick`
- Audit log: manual timeout detected → `mute`

**No sanction**: `/unmute`, `/prune`

---

## Confirmed Decisions

| Question | Decision |
|----------|----------|
| Softban sanction type | Maps to `kick` |
| Mute mechanism | Discord native timeout |
| Prune scope | Last N messages (up to 100) in current channel; no sanction, log to mod channel |
| Channel config | Config object in `src/config/` (single-server) |
| Deployment scope | Single guild only |
| Repo strategy | Replace in-place on `feat/modbot` branch |

---

## Project Structure (Planned)

```
keiko/
├── src/
│   ├── commands/          # Slash command definitions
│   ├── events/            # Discord event handlers
│   ├── modules/           # Business logic (sanction sending, audit log parsing, etc.)
│   ├── utils/             # Shared utilities
│   └── index.ts           # Entry point
├── prod.env               # 1Password secret references (safe to commit)
├── package.json
├── tsconfig.json
├── eslint.config.js
└── vitest.config.ts
```

---

## Implementation Phases

- [x] **Phase 1 — Project scaffold** (package.json, tsconfig, eslint, entry point)
- [x] **Phase 2 — Commands** (all 7 slash commands with ephemeral Components v2 responses)
- [x] **Phase 3 — Sanction API integration** (send sanctions on command, handle errors)
- [x] **Phase 4 — Logging events** (welcome/goodbye, activity, moderation channel)
- [x] **Phase 5 — Audit log parsing** (detect manual moderation actions, send to sanction API)
- [ ] **Phase 6 — Deploy** (fill in channel IDs in `src/config/channels.ts`, fill in `clientId` in `src/config/guild.ts`, run `pnpm register` to register commands, then `pnpm start`)

## Next Steps Before Deploying

1. Fill in actual channel IDs in `src/config/channels.ts`
2. Fill in Keiko's bot client ID in `src/config/guild.ts`
3. Ensure `SANCTION_TOKEN` is in 1Password at the vault path in `prod.env`
4. Run `pnpm register` once to register slash commands with Discord
5. Enable **privileged intents** in Discord Developer Portal: `Server Members Intent` and `Message Content Intent`
6. Start the bot with `pnpm start`
