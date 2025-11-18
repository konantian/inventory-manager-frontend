export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

function deriveWsUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  if (API_BASE_URL.startsWith('https')) {
    return `${API_BASE_URL.replace('https', 'wss')}/api/ws`;
  }

  return `${API_BASE_URL.replace('http', 'ws')}/api/ws`;
}

export const WS_BASE_URL = deriveWsUrl();

