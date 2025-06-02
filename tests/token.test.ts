import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attemptRefreshToken } from '../src/token';
import { isMac } from '../src/utils';
import { refreshToken, setupOAuthCredentials } from '../src/oauth';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

vi.mock('../src/utils');
vi.mock('../src/oauth');
vi.mock('fs/promises');

describe('attemptRefreshToken', () => {
  const mockIsMac = vi.mocked(isMac);
  const mockRefreshToken = vi.mocked(refreshToken);
  const mockSetupOAuthCredentials = vi.mocked(setupOAuthCredentials);
  const mockReadFile = vi.mocked(readFile);
  const mockAccess = vi.mocked(access);

  const credentialsPath = join(homedir(), '.claude', '.credentials.json');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mac detection', () => {
    it('should return false and skip refresh on Mac', async () => {
      mockIsMac.mockReturnValue(true);

      const result = await attemptRefreshToken(undefined);

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Mac detected, skipping refresh token');
      expect(mockAccess).not.toHaveBeenCalled();
      expect(mockRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Non-Mac systems', () => {
    beforeEach(() => {
      mockIsMac.mockReturnValue(false);
    });

    describe('Credentials file handling', () => {
      it('should return false when credentials file does not exist and no oauth options', async () => {
        mockAccess.mockRejectedValueOnce(new Error('File not found'));

        const result = await attemptRefreshToken(undefined);

        expect(result).toBe(false);
        expect(console.log).toHaveBeenCalledWith('Credentials file does not exist');
        expect(mockSetupOAuthCredentials).not.toHaveBeenCalled();
      });

      it('should setup credentials when file does not exist but oauth options provided', async () => {
        mockAccess.mockRejectedValueOnce(new Error('File not found'));
        const oauthOptions = {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          expiresAt: Date.now() + 3600000
        };

        mockReadFile.mockResolvedValueOnce(JSON.stringify({
          claudeAiOauth: {
            refreshToken: 'test-refresh-token'
          }
        }));
        mockRefreshToken.mockResolvedValueOnce({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: 3600
        });

        await attemptRefreshToken(oauthOptions);

        expect(console.log).toHaveBeenCalledWith('Attempting to setup credentials from oauth options');
        expect(mockSetupOAuthCredentials).toHaveBeenCalledWith(oauthOptions);
        expect(mockAccess).toHaveBeenCalledWith(credentialsPath, constants.F_OK);
      });
    });

    describe('Token refresh', () => {
      it('should successfully refresh token when credentials exist', async () => {
        mockAccess.mockResolvedValueOnce(undefined);
        mockReadFile.mockResolvedValueOnce(JSON.stringify({
          claudeAiOauth: {
            refreshToken: 'old-refresh-token'
          }
        }));
        mockRefreshToken.mockResolvedValueOnce({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: 3600
        });

        const result = await attemptRefreshToken(undefined);

        expect(result).toBe(true);
        expect(mockRefreshToken).toHaveBeenCalledWith('old-refresh-token');
        expect(mockSetupOAuthCredentials).toHaveBeenCalledWith({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: expect.any(Number)
        });
        expect(console.log).toHaveBeenCalledWith('Token refreshed successfully');
      });

      it('should return false when no refresh token found in credentials', async () => {
        mockAccess.mockResolvedValueOnce(undefined);
        mockReadFile.mockResolvedValueOnce(JSON.stringify({
          claudeAiOauth: {}
        }));

        const result = await attemptRefreshToken(undefined);

        expect(result).toBe(false);
        expect(console.log).toHaveBeenCalledWith('No refresh token found in credentials');
        expect(mockRefreshToken).not.toHaveBeenCalled();
      });

      it('should return false when credentials are missing claudeAiOauth', async () => {
        mockAccess.mockResolvedValueOnce(undefined);
        mockReadFile.mockResolvedValueOnce(JSON.stringify({}));

        const result = await attemptRefreshToken(undefined);

        expect(result).toBe(false);
        expect(console.log).toHaveBeenCalledWith('No refresh token found in credentials');
        expect(mockRefreshToken).not.toHaveBeenCalled();
      });

      it('should handle refresh token errors', async () => {
        mockAccess.mockResolvedValueOnce(undefined);
        mockReadFile.mockResolvedValueOnce(JSON.stringify({
          claudeAiOauth: {
            refreshToken: 'old-refresh-token'
          }
        }));
        mockRefreshToken.mockRejectedValueOnce(new Error('Network error'));

        const result = await attemptRefreshToken(undefined);

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Failed to refresh token:', expect.any(Error));
      });

      it('should handle JSON parse errors', async () => {
        mockAccess.mockResolvedValueOnce(undefined);
        mockReadFile.mockResolvedValueOnce('invalid json');

        const result = await attemptRefreshToken(undefined);

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Failed to refresh token:', expect.any(Error));
      });
    });
  });
});