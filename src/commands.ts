import { execa, type ResultPromise } from 'execa';
import { CommandOptions } from './types';

export async function executeCommand(
  command: string[],
  options: CommandOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const [cmd, ...args] = command;

  const result = await execa(cmd, args, {
    cwd: options.cwd,
    env: options.env,
    timeout: options.timeout,
    shell: options.shell,
    stdin: 'ignore',
    stdout: 'pipe',
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode ?? 0,
  };
}

export function streamCommand(command: string[], options: CommandOptions = {}): ResultPromise {
  const [cmd, ...args] = command;

  return execa(cmd, args, {
    cwd: options.cwd,
    env: options.env,
    timeout: options.timeout,
    shell: options.shell,
    stdio: 'inherit',
  });
}