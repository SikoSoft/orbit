import { api } from '@/lib/Api';

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js');
  return navigator.serviceWorker.ready;
}

export async function subscribe(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('[orbit] push notification permission denied');
    return;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.APP_VAPID_PUBLIC_KEY,
    ),
  });

  await api.post('pushSubscription', subscription.toJSON());
}

export async function unsubscribe(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return;
  }

  await api.delete('pushSubscription', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}

export async function getSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  return registration.pushManager.getSubscription();
}
