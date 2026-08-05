import { api, getApiTokens } from "./api";

const VAPID_PUBLIC: string = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || "";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64url);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function bufToB64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function registerSubscription(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    } catch {
      return;
    }
  }
  if (!subscription) return;
  await api.post("/notifications/subscriptions/", {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: bufToB64(subscription.getKey("p256dh")),
      auth: bufToB64(subscription.getKey("auth")),
    },
  });
}

export async function enablePush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !VAPID_PUBLIC || !getApiTokens()) return;
  try {
    await registerSubscription();
  } catch {
    /* auth refresh handled by apiRequest; retry on next trigger */
  }
}
