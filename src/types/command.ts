export type BotSocket = any;
export type BotMessage = any;

export interface ParsedCommand {
  prefix: string;
  name: string;
  args: string[];
  text: string;
}

export interface MessageJids {
  chatJid?: string;
  chatAltJid?: string;
  senderJid?: string;
  senderAltJid?: string;
  senderPn?: string;
  senderPnJid?: string;
  senderLid?: string;
}

export interface MediaInfo {
  type: string;
  bytes: number | null;
}

export interface UserIdLookup {
  phoneNumber?: string;
  lid?: string;
}

export interface CommandContext {
  sock: BotSocket;
  message: BotMessage;
  jid: string;
  sender?: string;
  isGroup: boolean;
  body: string;
  command: string;
  args: string[];
  text: string;
  commands: BotCommand[];
  reply: (text: string, options?: Record<string, unknown>) => Promise<unknown>;
}

export interface BotCommand {
  name: string;
  aliases?: string[];
  category?: string;
  description?: string;
  hidden?: boolean;
  path?: string;
  execute: (context: CommandContext) => Promise<void> | void;
}
