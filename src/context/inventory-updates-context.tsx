'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { InventoryUpdateEvent } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { WS_BASE_URL } from '@/lib/config';

interface InventoryUpdatesContextValue {
  connected: boolean;
  lastEvent: InventoryUpdateEvent | null;
  clearLastEvent: () => void;
}

const InventoryUpdatesContext = createContext<InventoryUpdatesContextValue | undefined>(undefined);

export function InventoryUpdatesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<InventoryUpdateEvent | null>(null);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      setLastEvent(null);
      return;
    }

    let wsUrl: URL;
    try {
      // WS_BASE_URL is already a full URL or path. If path, we need to construct full URL.
      // But lib/config.ts deriveWsUrl returns full URL if window is defined, or path if not.
      // Since this is client-side, window should be defined or we handle it.
      // Actually, if WS_BASE_URL is relative path (e.g. /api/ws), new URL(WS_BASE_URL) will fail.
      // We should handle relative paths.

      const baseUrl = WS_BASE_URL.startsWith('/')
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${WS_BASE_URL}`
        : WS_BASE_URL;

      wsUrl = new URL(baseUrl);
    } catch (error) {
      console.error('Invalid WS URL', error);
      return;
    }
    wsUrl.searchParams.set('token', token);

    const socket = new WebSocket(wsUrl.toString());

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as InventoryUpdateEvent;
        setLastEvent(payload);
      } catch (error) {
        console.error('Failed to parse inventory update', error);
      }
    };

    return () => {
      socket.close();
    };
  }, [token]);

  const clearLastEvent = () => setLastEvent(null);

  return (
    <InventoryUpdatesContext.Provider value={{ connected, lastEvent, clearLastEvent }}>
      {children}
    </InventoryUpdatesContext.Provider>
  );
}

export function useInventoryUpdates() {
  const context = useContext(InventoryUpdatesContext);
  if (!context) {
    throw new Error('useInventoryUpdates must be used within InventoryUpdatesProvider');
  }
  return context;
}
