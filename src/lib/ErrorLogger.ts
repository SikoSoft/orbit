import { config } from '@/models/Config';

export interface ErrorLogPayload {
  type: 'error' | 'unhandledrejection';
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  url: string;
  userAgent: string;
  timestamp: number;
}

function getLogUrl(): string {
  if (!config.apiUrl) {
    return '';
  }
  return new URL('log', config.apiUrl).href;
}

function send(payload: ErrorLogPayload): void {
  const logUrl = getLogUrl();
  if (!logUrl) {
    console.warn('[ErrorLogger] no log URL configured, dropping error:', payload);
    return;
  }
  console.log('[ErrorLogger] sending:', logUrl, payload);
  fetch(logUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'omit',
  }).catch(() => undefined);
}

const handleError = (e: ErrorEvent): void => {
  send({
    type: 'error',
    message: e.message || String(e.error),
    stack: e.error instanceof Error ? e.error.stack : undefined,
    source: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    url: location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  });
};

const handleUnhandledRejection = (e: PromiseRejectionEvent): void => {
  const error = e.reason;
  send({
    type: 'unhandledrejection',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  });
};

const handleSwMessage = (e: MessageEvent): void => {
  if (e.data?.type === 'sw-error' && e.data.payload) {
    send(e.data.payload as ErrorLogPayload);
  }
};

export function initErrorLogger(): void {
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
  }
}

export function teardownErrorLogger(): void {
  window.removeEventListener('error', handleError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }
}
