import type { ParsedCommand } from '../types/command.js';

const EXEC_PREFIX = '$';
const EXEC_COMMAND = 'exec';

export function parseCommand(body: string): ParsedCommand | null {
  const text = body.trim();
  if (!text) return null;

  if (text.startsWith(EXEC_PREFIX)) {
    const rest = text.slice(EXEC_PREFIX.length).trim();
    return {
      prefix: EXEC_PREFIX,
      name: EXEC_COMMAND,
      args: rest ? rest.split(/\s+/) : [],
      text: rest,
    };
  }

  const [name = '', ...args] = text.split(/\s+/);
  const lowered = name.toLowerCase();

  if (!lowered) return null;
  if (lowered === EXEC_COMMAND) return null;

  return {
    prefix: '',
    name: lowered,
    args,
    text: args.join(' '),
  };
}
