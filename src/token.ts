import { isMac } from './utils';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { refreshToken, setupOAuthCredentials } from './oauth';
import { constants } from 'fs';

export async function attemptRefreshToken(): Promise<boolean> {
  if(isMac()) {
    console.log('Mac detected, skipping refresh token');
    return false;
  }

  const credentialsPath = join(homedir(), '.claude', '.credentials.json');
  
  try {
    await access(credentialsPath, constants.F_OK);
  } catch {
    console.log('Credentials file does not exist');
    return false;
  }

  try {
    const credentialsContent = await readFile(credentialsPath, 'utf-8');
    const credentials = JSON.parse(credentialsContent);
    
    if (!credentials.claudeAiOauth || !credentials.claudeAiOauth.refreshToken) {
      console.log('No refresh token found in credentials');
      return false;
    }
    
    const oldRefreshToken = credentials.claudeAiOauth.refreshToken;
    
    const newCredentials = await refreshToken(oldRefreshToken);
    
    await setupOAuthCredentials({
      accessToken: newCredentials.accessToken,
      refreshToken: newCredentials.refreshToken,
      expiresAt: Date.now() + (newCredentials.expiresAt * 1000)
    });
    
    console.log('Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
}