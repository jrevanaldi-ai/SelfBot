import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePhoneNumber } from '../utils/phone.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

interface BotConfig {
  botName: string;
  phoneNumber: string;
  sessionDir: string;
  logLevel: string;
  baileysLogLevel: string;
  reconnectDelayMs: number;
  skipPendingOnBoot: boolean;
}

export const config: BotConfig = {
  botName: process.env.BOT_NAME?.trim() || 'Baileys Bot',
  phoneNumber: normalizePhoneNumber(process.env.BOT_PHONE_NUMBER),
  sessionDir: resolveFromRoot(process.env.SESSION_DIR || 'session'),
  logLevel: process.env.LOG_LEVEL?.trim() || 'info',
  baileysLogLevel: process.env.BAILEYS_LOG_LEVEL?.trim() || 'silent',
  reconnectDelayMs: Number(process.env.RECONNECT_DELAY_MS || 5000),
  skipPendingOnBoot: parseBoolean(process.env.SKIP_PENDING_ON_BOOT, true),
};

export function validateConfig(): void {
  if (!config.phoneNumber) {
    throw new Error('BOT_PHONE_NUMBER belum diisi. Salin .env.example ke .env lalu isi nomor bot.');
  }

  if (config.phoneNumber.startsWith('0')) {
    throw new Error('BOT_PHONE_NUMBER harus pakai kode negara. Contoh: 6281234567890.');
  }

  if (!Number.isFinite(config.reconnectDelayMs) || config.reconnectDelayMs < 1000) {
    throw new Error('RECONNECT_DELAY_MS minimal 1000 ms.');
  }
}

function resolveFromRoot(value: string): string {
  return path.isAbsolute(value) ? value : path.join(rootDir, value);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
