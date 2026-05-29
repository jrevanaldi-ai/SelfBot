import {
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  isLidUser,
  isPnUser,
  jidDecode,
  jidNormalizedUser,
} from '@itsliaaa/baileys';
import type { BotMessage, MessageJids } from '../types/command.js';

type JidPredicate = (jid?: string) => boolean;

export function getMessageJids(message: BotMessage): MessageJids {
  const key = message.key || {};
  const chatJid = normalizeJid(key.remoteJid);
  const chatAltJid = normalizeJid(key.remoteJidAlt);
  const senderJid = normalizeJid(key.participant || key.remoteJid);
  const senderAltJid = normalizeJid(key.participantAlt);
  const senderPnJid = pickJidByType([senderAltJid, senderJid, chatAltJid, chatJid], isPnUser);
  const senderLid = pickJidByType([senderAltJid, senderJid, chatAltJid, chatJid], isLidUser);

  return {
    chatJid,
    chatAltJid,
    senderJid,
    senderAltJid,
    senderPn: getPhoneNumberFromJid(senderPnJid),
    senderPnJid,
    senderLid,
  };
}

export function getPreferredSenderJid(message: BotMessage): string | undefined {
  const ids = getMessageJids(message);
  return ids.senderLid || ids.senderPnJid || ids.senderJid || ids.chatJid;
}

export function getDisplaySenderJid(message: BotMessage): string | undefined {
  const ids = getMessageJids(message);
  return ids.senderPnJid || ids.senderLid || ids.senderJid || ids.chatJid;
}

export function getResolvableUserJid(ids: MessageJids): string | null {
  return ids.senderPnJid || ids.senderLid || null;
}

export function getPhoneNumberFromJid(jid?: string): string | undefined {
  return isPnUser(jid) ? jidDecode(jid)?.user : undefined;
}

export function jidType(jid?: string): string {
  if (!jid) return 'empty';
  if (isPnUser(jid)) return 'pn';
  if (isLidUser(jid)) return 'lid';
  if (isJidGroup(jid)) return 'group';
  if (isJidStatusBroadcast(jid)) return 'status';
  if (isJidBroadcast(jid)) return 'broadcast';
  if (isJidNewsletter(jid)) return 'newsletter';
  return 'unknown';
}

function normalizeJid(jid?: string): string | undefined {
  return jid ? jidNormalizedUser(jid) : undefined;
}

function pickJidByType(
  jids: Array<string | undefined>,
  predicate: JidPredicate,
): string | undefined {
  return jids.find((jid) => jid && predicate(jid));
}
