import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { act } from 'react';

// Create mock functions
const mockGetProfile = vi.fn();
const mockListUsers = vi.fn();

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  loginRequest: vi.fn(),
  createApiClient: vi.fn(() => ({
    getProfile: mockGetProfile,
    listUsers: mockListUsers,
    changePassword: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    listStores: vi.fn(),
    createStore: vi.fn(),
    deleteStore: vi.fn(),
    listStoreStaff: vi.fn(),
    addStaffToStore: vi.fn(),
    deleteStaffFromStore: vi.fn(),
    listSkus: vi.fn(),
    listSkuCategories: vi.fn(),
    getSku: vi.fn(),
    createSku: vi.fn(),
    updateSku: vi.fn(),
    deleteSku: vi.fn(),
    listInventory: vi.fn(),
    getInventoryById: vi.fn(),
    createInventory: vi.fn(),
    updateInventory: vi.fn(),
    deleteInventory: vi.fn(),
    adjustInventory: vi.fn(),
  })),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGetProfile.mockResolvedValue({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'staff',
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should provide auth context values', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.token).toBe(null);
    expect(result.current.user).toBe(null);
    expect(result.current.api).toBe(null);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.refreshProfile).toBe('function');
  });

  it('should throw error when useAuth is called outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');

    console.error = originalError;
  });

  it('should restore token and user from localStorage on mount', async () => {
    const mockAuth = {
      token: 'stored-token',
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'staff' },
      persist: 'local',
    };

    localStorage.setItem('inventory-manager-auth', JSON.stringify(mockAuth));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Initially the token should be restored
    expect(result.current.token).toBe('stored-token');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should restore token and user from sessionStorage on mount', async () => {
    const mockAuth = {
      token: 'session-token',
      user: { id: '2', username: 'sessionuser', email: 'session@example.com', role: 'manager' },
      persist: 'session',
    };

    sessionStorage.setItem('inventory-manager-auth', JSON.stringify(mockAuth));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBe('session-token');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should clear storage on logout', async () => {
    const mockAuth = {
      token: 'test-token',
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'staff' },
      persist: 'local',
    };

    localStorage.setItem('inventory-manager-auth', JSON.stringify(mockAuth));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBe(null);
    expect(result.current.user).toBe(null);
    expect(localStorage.getItem('inventory-manager-auth')).toBe(null);
    expect(sessionStorage.getItem('inventory-manager-auth')).toBe(null);
  });

  it('should prefer localStorage over sessionStorage', () => {
    const localAuth = {
      token: 'local-token',
      user: { id: '1', username: 'localuser', email: 'local@example.com', role: 'staff' },
      persist: 'local',
    };

    const sessionAuth = {
      token: 'session-token',
      user: { id: '2', username: 'sessionuser', email: 'session@example.com', role: 'manager' },
      persist: 'session',
    };

    localStorage.setItem('inventory-manager-auth', JSON.stringify(localAuth));
    sessionStorage.setItem('inventory-manager-auth', JSON.stringify(sessionAuth));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.token).toBe('local-token');
  });
});
