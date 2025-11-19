import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiQuery } from '@/hooks/useApiQuery';

describe('useApiQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test Item' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiQuery(fetcher));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should handle errors', async () => {
    const errorMessage = 'Failed to fetch data';
    const fetcher = vi.fn().mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useApiQuery(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(errorMessage);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should not fetch when enabled is false', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useApiQuery(fetcher, { enabled: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should skip initial fetch when skipInitial is true', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useApiQuery(fetcher, { skipInitial: true }));

    expect(result.current.loading).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should reload data when reload is called', async () => {
    const mockData1 = { id: 1, name: 'First' };
    const mockData2 = { id: 2, name: 'Second' };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useApiQuery(fetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData1);

    // Reload
    result.current.reload();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('should handle null fetcher', async () => {
    const { result } = renderHook(() => useApiQuery(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });
});
