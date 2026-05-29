import { getMessageJids, getPhoneNumberFromJid } from './jids.js';
import { getMediaInfo, isGroupJid } from './messages.js';
import type { BotMessage, BotSocket, MediaInfo, MessageJids } from '../types/command.js';

interface MessageLogContext {
  body: string;
  feature: string;
}

const groupNameCache = new Map<string, string>();

export async function logIncomingMessage(
  sock: BotSocket,
  message: BotMessage,
  { body, feature }: MessageLogContext,
): Promise<void> {
  const ids = getMessageJids(message);
  const number = await resolvePhoneNumber(sock, ids);
  const group = await resolveGroupName(sock, ids.chatJid);
  const media = getMediaInfo(message);

  console.log('');
  console.log('[Pesan Masuk]');
  console.log(`Name   : ${message.pushName || '-'}`);
  console.log(`Number : ${number || '-'}`);
  console.log(`Group  : ${group}`);
  console.log(`Fitur  : ${feature || '-'}`);
  console.log(`Size   : ${formatSize(body, media)}`);
  console.log('');
}

async function resolvePhoneNumber(sock: BotSocket, ids: MessageJids): Promise<string | null> {
  if (ids.senderPn) return ids.senderPn;

  const lookupJid = ids.senderPnJid || ids.senderLid;
  if (!lookupJid) return null;

  try {
    const result = await sock.findUserId(lookupJid);
    return getPhoneNumberFromJid(result?.phoneNumber) || null;
  } catch {
    return null;
  }
}

async function resolveGroupName(sock: BotSocket, chatJid?: string): Promise<string> {
  if (!chatJid || !isGroupJid(chatJid)) return 'Private';
  if (groupNameCache.has(chatJid)) return groupNameCache.get(chatJid) || chatJid;

  try {
    const metadata = await sock.groupMetadata(chatJid);
    const name = String(metadata.subject || chatJid);
    groupNameCache.set(chatJid, name);
    return name;
  } catch {
    return chatJid;
  }
}

function formatSize(body: string, media: MediaInfo | null): string {
  const textSize = `${Buffer.byteLength(body || '', 'utf8')} B text`;
  const mediaSize = media ? `${media.type} ${formatBytes(media.bytes)}` : '- media';

  return `${textSize} | ${mediaSize}`;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return 'unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${formatNumber(value)} ${units[unitIndex] || 'B'}`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
