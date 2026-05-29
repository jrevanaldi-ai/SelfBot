import { findCommand, commandList } from '../commands/index.js';
import { config } from '../config/env.js';
import { extractMessageText, getSenderJid, isGroupJid } from '../utils/messages.js';
import { parseCommand } from '../utils/parseCommand.js';
import { logger } from '../utils/logger.js';
import { logIncomingMessage } from '../utils/messageLog.js';
import { isPendingMessage } from '../utils/readyGate.js';
import type { BotMessage, BotSocket, CommandContext } from '../types/command.js';

interface MessagesUpsertEvent {
  messages: BotMessage[];
  type: string;
}

export function bindMessageEvents(sock: BotSocket): void {
  sock.ev.on('messages.upsert', async ({ messages, type }: MessagesUpsertEvent) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      await handleMessage(sock, message);
    }
  });
}

async function handleMessage(sock: BotSocket, message: BotMessage): Promise<void> {
  if (!message.message) return;
  if (message.key.remoteJid === 'status@broadcast') return;
  if (config.skipPendingOnBoot && isPendingMessage(message)) return;

  if (!message.key.fromMe) return;

  const body = extractMessageText(message);
  const parsed = parseCommand(body);

  if (!parsed) return;

  const command = findCommand(parsed.name);
  if (!command) return;

  await logIncomingMessage(sock, message, {
    body,
    feature: command.name,
  });

  const jid = message.key.remoteJid as string;
  const context: CommandContext = {
    sock,
    message,
    jid,
    sender: getSenderJid(message),
    isGroup: isGroupJid(jid),
    body,
    command: parsed.name,
    args: parsed.args,
    text: parsed.text,
    commands: commandList,
    reply: (text, options = {}) => sock.sendMessage(jid, { text, ...options }, { quoted: message }),
  };

  try {
    await command.execute(context);
  } catch (error) {
    logger.error({ err: error, command: parsed.name }, 'Command failed');
    await context.reply('Command error.');
  }
}
