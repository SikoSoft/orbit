self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

function reportSwError(error) {
  const payload = {
    type: 'unhandledrejection',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: self.location.href,
    userAgent: (self.navigator && self.navigator.userAgent) || '',
    timestamp: Date.now(),
  };
  self.clients
    .matchAll({ includeUncontrolled: true, type: 'window' })
    .then(clientList => {
      if (clientList.length) {
        clientList[0].postMessage({ type: 'sw-error', payload });
      }
    });
}

self.addEventListener('unhandledrejection', event => {
  reportSwError(event.reason);
});

self.addEventListener('push', event => {
  let data;
  try {
    data = event.data.json();
  } catch {
    console.error('[sw] push event received non-JSON payload:', event.data.text());
    return;
  }
  const actions = Array.isArray(data.actions)
    ? data.actions.filter(a => a && a.title)
    : [];
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      actions,
      data: data.data,
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const actionUrls = event.notification.data?.actionUrls ?? {};

  if (event.action === 'add') {
    const url = actionUrls[event.action];
    if (url) {
      event.waitUntil(fetch(url));
    }
    return;
  }

  const url = event.action ? actionUrls[event.action] : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
