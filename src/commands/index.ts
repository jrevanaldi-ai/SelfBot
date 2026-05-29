import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { BotCommand } from '../types/command.js';

interface CommandModule {
  default: unknown;
}

const commandsDir = path.dirname(fileURLToPath(import.meta.url));

export const commandList = await loadCommands();
const commandMap = buildCommandMap(commandList);

export function findCommand(name: string): BotCommand | undefined {
  return commandMap.get(name.toLowerCase());
}

async function loadCommands(): Promise<BotCommand[]> {
  const files = await findCommandFiles(commandsDir);
  const commands: BotCommand[] = [];

  for (const file of files) {
    const module = (await import(pathToFileURL(file).href)) as CommandModule;
    const command = module.default;
    const commandPath = normalizePath(path.relative(commandsDir, file));

    validateCommand(command, commandPath);

    commands.push({
      ...command,
      category: command.category || inferCategory(commandPath),
      path: commandPath,
    });
  }

  return commands.sort((a, b) => {
    const byCategory = (a.category || '').localeCompare(b.category || '');
    return byCategory || a.name.localeCompare(b.name);
  });
}

async function findCommandFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findCommandFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && isCommandFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function buildCommandMap(commands: BotCommand[]): Map<string, BotCommand> {
  const map = new Map<string, BotCommand>();

  for (const command of commands) {
    for (const trigger of [command.name, ...(command.aliases || [])]) {
      const key = trigger.toLowerCase();

      if (map.has(key)) {
        throw new Error(`Duplicate command trigger: ${key}`);
      }

      map.set(key, command);
    }
  }

  return map;
}

function validateCommand(command: unknown, commandPath: string): asserts command is BotCommand {
  if (!command || typeof command !== 'object') {
    throw new Error(`Command ${commandPath} harus export default object.`);
  }

  const candidate = command as Partial<BotCommand>;

  if (!candidate.name || typeof candidate.name !== 'string') {
    throw new Error(`Command ${commandPath} harus punya metadata name.`);
  }

  if (candidate.aliases && !Array.isArray(candidate.aliases)) {
    throw new Error(`Command ${commandPath} aliases harus array.`);
  }

  if (typeof candidate.execute !== 'function') {
    throw new Error(`Command ${commandPath} harus punya function execute.`);
  }
}

function inferCategory(commandPath: string): string {
  const [category] = commandPath.split('/');
  return category || 'uncategorized';
}

function isCommandFile(fileName: string): boolean {
  if (fileName === 'index.js' || fileName === 'index.ts') return false;
  return fileName.endsWith('.js') || fileName.endsWith('.ts');
}

function normalizePath(value: string): string {
  return value.split(path.sep).join('/');
}
