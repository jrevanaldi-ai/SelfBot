# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — tsx watch mode against `src/index.ts` (preferred during development; no build needed).
- `npm run start` — `tsc` build then run `dist/index.js`.
- `npm run check` — `tsc --noEmit` typecheck. There is no test runner and no linter; use this as the gate.
- `npm run format` — Prettier across the repo.

Runtime requires Node >= 20. Configure via `.env` (copied from `.env.example`); `BOT_PHONE_NUMBER` is mandatory and must include the country code with no `+`. On first run the pairing code is printed to the terminal.

## Architecture

Single-process WhatsApp **selfbot** built on `@itsliaaa/baileys` (v7 fork that restores interactive button rendering). Hardcoded selfbot: only messages with `key.fromMe === true` (i.e. sent from the linked phone of `BOT_PHONE_NUMBER`) reach the command pipeline; everyone else's messages are dropped silently. ESM with NodeNext resolution — **all relative imports must use the `.js` extension even though sources are `.ts`** (e.g. `import { config } from './config/env.js'`). Strict TypeScript.

### Bootstrap flow (`src/index.ts`)
1. `validateConfig()` (`src/config/env.ts`) — env-driven config; throws if `BOT_PHONE_NUMBER` is missing or starts with `0`.
2. `createSocket()` (`src/socket/createSocket.ts`) — opens a Baileys socket with `useMultiFileAuthState(config.sessionDir)` (defaults to `./session/`). Persists creds via `sock.ev.on('creds.update', saveCreds)`.
3. `bindConnectionEvents` — when `connection === 'connecting'` and creds aren't registered yet, calls `sock.requestPairingCode(config.phoneNumber)` and prints the code. On `'close'` it asks the top-level `scheduleReconnect()` to restart the bot after `config.reconnectDelayMs`, unless the disconnect reason is `loggedOut`.
4. `bindMessageEvents` — listens on `messages.upsert` (only `type === 'notify'`), filters out status broadcasts and (optionally) self-messages, parses the body, logs incoming, and dispatches.

### Pending-message gate (`src/utils/readyGate.ts`)
On first `connection === 'open'`, `markReady()` stamps `readyAt` (unix seconds). `isPendingMessage(message)` returns true while `readyAt` is null or when `message.messageTimestamp < readyAt`. The dispatcher drops such messages before logging or routing when `config.skipPendingOnBoot` is true (default). This means a stopped-then-restarted bot ignores the offline backlog and only acts on messages timestamped after it came online.

### Command pipeline (`src/events/messages.ts` + `src/commands/index.ts`)
- `extractMessageText` (`src/utils/messages.ts`) unwraps `ephemeralMessage` / `viewOnceMessage{,V2}` / `documentWithCaptionMessage`, then handles `conversation`, `extendedTextMessage`, image/video captions, button/list/interactive responses (including `nativeFlowResponseMessage.paramsJson`). New message types need handling added here.
- `parseCommand` (`src/utils/parseCommand.ts`) is **prefix-less** — the first whitespace-separated token of any message is treated as the command name candidate; the dispatcher silently ignores messages whose first token doesn't match a registered command. Exception: messages starting with `$` route directly to the `exec` command (`text` = remainder of the message). `exec` is therefore unreachable via the bare-name path — typing the literal word `exec` is blocked in the parser; only `$ <shell>` triggers it.
- `commands/index.ts` walks `src/commands/**` at startup (top-level `await`), `import()`s each `.ts`/`.js` file (skipping `index.*` and dotfiles), validates the default export, infers `category` from the parent folder if not set, and builds a `Map<name|alias, BotCommand>`. **Duplicate triggers throw at load time.** Both `commandList` and `findCommand` are module exports.
- The dispatcher builds a `CommandContext` (`src/types/command.ts`) and calls `command.execute(ctx)`. `ctx.reply(text, opts?)` is pre-bound to `sock.sendMessage(jid, { text, ...opts }, { quoted: message })`.

### Adding a command
Drop a file at `src/commands/<category>/<name>.ts` exporting a default `BotCommand` (`{ name, aliases?, category?, description?, hidden?, execute(ctx) }`). The category folder name is the default category. Use `satisfies BotCommand` for type-checked literals (see `src/commands/general/menu.ts`). The loader picks it up on next start — no registry edits needed.

### JID / LID handling
Baileys v7 surfaces both phone-number JIDs (`@s.whatsapp.net`) and LIDs (`@lid`) on `message.key` (`remoteJid`/`participant`) plus `*Alt` mirror fields. Always use the helpers in `src/utils/jids.ts`:
- `getMessageJids(message)` returns `{ chatJid, chatAltJid, senderJid, senderAltJid, senderPn, senderPnJid, senderLid }`, picking the PN/LID variants via `isPnUser` / `isLidUser`.
- `getPreferredSenderJid(message)` (re-exported as `getSenderJid` from `utils/messages.ts`) returns PN → LID → raw, in that order.
- `jidType(jid)` classifies any JID (`pn`/`lid`/`group`/`status`/`broadcast`/`newsletter`).

Never split JIDs on `@` by hand. If you need owner/identity gating, resolve through these helpers so both PN and LID forms match.

### Config knobs (`src/config/env.ts`)
`BOT_NAME`, `BOT_PHONE_NUMBER` (required), `SESSION_DIR`, `LOG_LEVEL`, `BAILEYS_LOG_LEVEL` (default `silent`), `RECONNECT_DELAY_MS` (min 1000), `SKIP_PENDING_ON_BOOT` (default true). `sessionDir` resolves relative to the project root.

## Conventions

- No comments in source files unless a non-obvious WHY needs preserving.
- User-facing strings inside command output / errors are in Bahasa Indonesia; keep that register.
- Don't add backwards-compat shims for code that doesn't ship yet.
