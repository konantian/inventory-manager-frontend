import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClient, loginRequest } from '@/lib/api-client';

describe('loginRequest', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should make a POST request to /api/auth/login', async () => {
    const mockResponse = {
      token: 'test-token',
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const credentials = { username: 'testuser', password: 'password123' };
    const result = await loginRequest(credentials);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error when response is not ok', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    await expect(
      loginRequest({ username: 'wrong', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });
});

describe('createApiClient', () => {
  const mockToken = 'test-token-123';
  let api: ReturnType<typeof createApiClient>;

  beforeEach(() => {
    global.fetch = vi.fn();
    api = createApiClient(mockToken);
  });

  it('should include Authorization header in requests', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', role: 'staff' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });

    await api.getProfile();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/profile',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
  });

  it('should throw error when token is null', async () => {
    const apiWithoutToken = createApiClient(null);

    await expect(apiWithoutToken.getProfile()).rejects.toThrow(
      'You must be authenticated to call this endpoint.'
    );
  });

  it('should build query parameters correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ users: [], total: 0, page: 1, limit: 10 }),
    });

    await api.listUsers({ page: 2, limit: 20 });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/manager/users?page=2&limit=20',
      expect.any(Object)
    );
  });

  it('should handle 204 No Content responses', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await api.deleteUser('user-123');

    expect(result).toBeNull();
  });
});
