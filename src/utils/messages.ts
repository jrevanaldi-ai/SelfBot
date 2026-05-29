import { isJidGroup } from '@itsliaaa/baileys';
import { getPreferredSenderJid } from './jids.js';
import type { BotMessage, MediaInfo } from '../types/command.js';

type MessageContent = Record<string, any>;

export function extractMessageText(message: BotMessage): string {
  const content = getMessageContent(message);
  if (!content) return '';

  const type = Object.keys(content)[0];
  const payload = content[type];

  switch (type) {
    case 'conversation':
      return payload || '';
    case 'extendedTextMessage':
      return payload?.text || '';
    case 'imageMessage':
    case 'videoMessage':
      return payload?.caption || '';
    case 'buttonsResponseMessage':
      return payload?.selectedButtonId || payload?.selectedDisplayText || '';
    case 'listResponseMessage':
      return payload?.singleSelectReply?.selectedRowId || payload?.title || '';
    case 'templateButtonReplyMessage':
      return payload?.selectedId || payload?.selectedDisplayText || '';
    case 'interactiveResponseMessage':
      return extractInteractiveResponseText(payload);
    default:
      return '';
  }
}

export function getMessageContent(message: BotMessage): MessageContent | null {
  return unwrapMessage(message.message);
}

export function getMessageType(message: BotMessage): string | undefined {
  const content = getMessageContent(message);
  return content ? Object.keys(content)[0] : undefined;
}

export function getMediaInfo(message: BotMessage): MediaInfo | null {
  const content = getMessageContent(message);
  const type = getMessageType(message);
  const payload = type ? content?.[type] : undefined;

  if (!type || !payload || !isMediaMessageType(type)) {
    return null;
  }

  return {
    type: type.replace(/Message$/, ''),
    bytes: normalizeFileLength(payload.fileLength),
  };
}

export function getSenderJid(message: BotMessage): string | undefined {
  return getPreferredSenderJid(message);
}

export function isGroupJid(jid?: string): boolean {
  return jid ? isJidGroup(jid) : false;
}

function unwrapMessage(content: MessageContent | undefined): MessageContent | null {
  let current = content;

  while (current) {
    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
      continue;
    }

    if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
      continue;
    }

    if (current.viewOnceMessageV2?.message) {
      current = current.viewOnceMessageV2.message;
      continue;
    }

    if (current.documentWithCaptionMessage?.message) {
      current = current.documentWithCaptionMessage.message;
      continue;
    }

    return current;
  }

  return null;
}

function extractInteractiveResponseText(payload: any): string {
  const nativeResponse = payload?.nativeFlowResponseMessage?.paramsJson;
  if (!nativeResponse) return '';

  try {
    const parsed = JSON.parse(nativeResponse);
    return parsed.id || parsed.name || '';
  } catch {
    return '';
  }
}

function isMediaMessageType(type: string): boolean {
  return [
    'audioMessage',
    'documentMessage',
    'imageMessage',
    'stickerMessage',
    'videoMessage',
  ].includes(type);
}

function normalizeFileLength(value: any): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  if (typeof value.toNumber === 'function') return value.toNumber();

  return null;
}
