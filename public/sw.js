self.addEventListener('push', event => {
  let data;
  try {
    data = event.data.json();
  } catch {
    console.error('[sw] push event received non-JSON payload:', event.data.text());
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      actions: data.actions,
      data: data.data,
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const actionUrls = event.notification.data?.actionUrls ?? {};
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
