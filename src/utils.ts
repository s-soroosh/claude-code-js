import * as os from 'os';

export function isMac(): boolean {
  return os.platform() === 'darwin';
}