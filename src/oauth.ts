import { OAuthCredentials } from './types';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export async function setupOAuthCredentials(credentials: OAuthCredentials) {
  const credentialsPath = join(homedir(), '.claude', '.credentials.json');

  await mkdir(join(homedir(), '.claude'), { recursive: true });

  await writeFile(
    credentialsPath,
    JSON.stringify(
      {
        claudeAiOauth: {
          ...credentials,
          expiresAt: credentials.expiresAt,
          scopes: ['user:inference', 'user:profile'],
        },
      },
      null,
      2
    )
  );

  console.log(`OAuth credentials written to ${credentialsPath}`);
}

export async function refreshToken(refreshToken: string): Promise<OAuthCredentials> {
  const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';
  const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
  const response = await fetch(TOKEN_URL, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (response.ok) {
    const payload = await response.json() as any;
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: payload.expires_in,
    }
  }
  console.error(response.statusText);
  throw new Error('Failed to refresh token');
}