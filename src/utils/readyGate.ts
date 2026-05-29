import type { BotMessage } from '../types/command.js';

let readyAt: number | null = null;

export function markReady(): void {
  if (readyAt !== null) return;
  readyAt = Math.floor(Date.now() / 1000);
}

export function getReadyAt(): number | null {
  return readyAt;
}

export function isPendingMessage(message: BotMessage): boolean {
  if (readyAt === null) return true;
  const ts = getMessageTimestamp(message);
  if (ts === null) return false;
  return ts < readyAt;
}

function getMessageTimestamp(message: BotMessage): number | null {
  const raw = message?.messageTimestamp;
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'bigint') return Number(raw);
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof raw.toNumber === 'function') return raw.toNumber();
  return null;
}
