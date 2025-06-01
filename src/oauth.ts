import { OAuthCredentials } from './types';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export async function setupOAuthCredentials(credentials: OAuthCredentials) {
  const credentialsPath = join(homedir(), '.claude', '.credentials.json');
  
  await mkdir(join(homedir(), '.claude'), { recursive: true });
  
  await writeFile(credentialsPath, JSON.stringify({
    claudeAiOauth: {
      ...credentials,
      expiresAt: credentials.expiresAt,
      scopes: ['user:inference', 'user:profile'],
    },
  }, null, 2));

  console.log(`OAuth credentials written to ${credentialsPath}`);
}
