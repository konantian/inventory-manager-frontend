'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { InventoryUpdateEvent } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useServer } from '@/context/server-context';

interface InventoryUpdatesContextValue {
  connected: boolean;
  lastEvent: InventoryUpdateEvent | null;
  clearLastEvent: () => void;
}

const InventoryUpdatesContext = createContext<InventoryUpdatesContextValue | undefined>(undefined);

export function InventoryUpdatesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { selectedServer } = useServer();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<InventoryUpdateEvent | null>(null);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      setLastEvent(null);
      return;
    }

    // Derive WebSocket URL from selected server
    const wsBaseUrl = selectedServer.url.startsWith('https')
      ? `${selectedServer.url.replace('https', 'wss')}/api/ws`
      : `${selectedServer.url.replace('http', 'ws')}/api/ws`;

    let wsUrl: URL;
    try {
      wsUrl = new URL(wsBaseUrl);
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
  }, [token, selectedServer.url]);

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

