'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SERVERS, type ServerOption } from '@/lib/config';

// Re-export for convenience
export type { ServerOption } from '@/lib/config';

interface ServerContextValue {
  selectedServer: ServerOption;
  setSelectedServer: (server: ServerOption) => void;
  servers: ServerOption[];
}

const STORAGE_KEY = 'inventory-manager-server';

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [selectedServer, setSelectedServerState] = useState<ServerOption>(DEFAULT_SERVERS[0]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ServerOption;
        // Validate that the stored server exists in our list
        const found = DEFAULT_SERVERS.find((s) => s.id === parsed.id);
        if (found) {
          setSelectedServerState(found);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setInitialized(true);
  }, []);

  const setSelectedServer = (server: ServerOption) => {
    setSelectedServerState(server);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(server));
    }
  };

  if (!initialized) {
    return null;
  }

  const value: ServerContextValue = {
    selectedServer,
    setSelectedServer,
    servers: DEFAULT_SERVERS,
  };

  return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
}

export function useServer() {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within ServerProvider');
  }
  return context;
}

