import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { BotCommand, CommandContext } from '../../types/command.js';

const execAsync = promisify(exec);
const MAX_OUTPUT_CHARS = 3500;
const TIMEOUT_MS = 60_000;
const MAX_BUFFER = 10 * 1024 * 1024;

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  took: number;
  signal?: string;
}

export default {
  name: 'exec',
  category: 'general',
  description: 'Eksekusi shell command',
  hidden: true,
  async execute({ text, reply }: CommandContext) {
    const cmd = text.trim();
    if (!cmd) {
      await reply('Pakai: $ <shell command>');
      return;
    }

    const started = Date.now();
    let result: ExecResult;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
        shell: '/bin/bash',
      });
      result = {
        stdout: String(stdout || ''),
        stderr: String(stderr || ''),
        exitCode: 0,
        took: Date.now() - started,
      };
    } catch (error: any) {
      result = {
        stdout: String(error?.stdout || ''),
        stderr: String(error?.stderr || error?.message || ''),
        exitCode: typeof error?.code === 'number' ? error.code : 1,
        took: Date.now() - started,
        signal: error?.signal,
      };
    }

    await reply(formatOutput(result));
  },
} satisfies BotCommand;

function formatOutput({ stdout, stderr, exitCode, took, signal }: ExecResult): string {
  const meta = [`exit ${exitCode}`];
  if (signal) meta.push(`signal ${signal}`);
  meta.push(`${took}ms`);

  const parts: string[] = [`*exec* ${meta.join(' • ')}`];

  const out = stdout.trimEnd();
  const err = stderr.trimEnd();

  if (out) parts.push('', wrapMono(truncate(out, MAX_OUTPUT_CHARS)));
  if (err) parts.push('', '_stderr_', wrapMono(truncate(err, MAX_OUTPUT_CHARS)));
  if (!out && !err) parts.push('', '_no output_');

  return parts.join('\n');
}

function wrapMono(value: string): string {
  return '```\n' + value + '\n```';
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const dropped = value.length - limit;
  return value.slice(0, limit) + `\n... (${dropped} chars terpotong)`;
}
