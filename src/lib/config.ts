export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

function deriveWsUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same hostname but with backend NodePort 30081
    return `${protocol}//${window.location.hostname}:30081/api/ws`;
  }

  return '/api/ws';
}

export const WS_BASE_URL = deriveWsUrl();
