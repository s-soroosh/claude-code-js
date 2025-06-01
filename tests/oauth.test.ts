import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupOAuthCredentials } from '../src/oauth';
import { mkdir, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

vi.mock('fs/promises');
vi.mock('os');

describe('setupOAuthCredentials', () => {
  const mockHomedir = '/home/user';
  const mockCredentials = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: 1234567890,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(homedir).mockReturnValue(mockHomedir);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create .claude directory with recursive flag', async () => {
    await setupOAuthCredentials(mockCredentials);

    expect(mkdir).toHaveBeenCalledWith(join(mockHomedir, '.claude'), { recursive: true });
  });

  it('should write credentials to the correct file path', async () => {
    await setupOAuthCredentials(mockCredentials);

    expect(writeFile).toHaveBeenCalledWith(
      join(mockHomedir, '.claude', '.credentials.json'),
      expect.any(String)
    );
  });

  it('should format credentials correctly', async () => {
    await setupOAuthCredentials(mockCredentials);

    const expectedData = {
      claudeAiOauth: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: 1234567890,
        scopes: ['user:inference', 'user:profile'],
      },
    };

    expect(writeFile).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(expectedData, null, 2)
    );
  });

  it('should log success message with correct path', async () => {
    await setupOAuthCredentials(mockCredentials);

    expect(console.log).toHaveBeenCalledWith(
      `OAuth credentials written to ${join(mockHomedir, '.claude', '.credentials.json')}`
    );
  });

  it('should handle numeric expiresAt values', async () => {
    const credentialsWithNumericExpiry = {
      ...mockCredentials,
      expiresAt: 1234567890 as any, // Testing numeric input
    };

    await setupOAuthCredentials(credentialsWithNumericExpiry);

    const writtenData = JSON.parse((writeFile as any).mock.calls[0][1]);

    expect(writtenData.claudeAiOauth.expiresAt).toBe(1234567890);
  });

  it('should propagate errors from mkdir', async () => {
    const mockError = new Error('Permission denied');
    vi.mocked(mkdir).mockRejectedValue(mockError);

    await expect(setupOAuthCredentials(mockCredentials)).rejects.toThrow('Permission denied');
  });

  it('should propagate errors from writeFile', async () => {
    const mockError = new Error('Disk full');
    vi.mocked(writeFile).mockRejectedValue(mockError);

    await expect(setupOAuthCredentials(mockCredentials)).rejects.toThrow('Disk full');
  });
});
