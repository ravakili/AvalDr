/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  type?: string;
}

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data ? (JSON.parse(event.data.text()) as PushPayload) : {};
  } catch {
    /* ignore malformed payload */
  }
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/";
  const title = payload.title || "اول دکتر";
  const options: NotificationOptions = {
    body: payload.body || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.type || "notification",
    data: { url },
    dir: "rtl",
    lang: "fa",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data && (event.notification.data as { url?: string }).url;
  const url = new URL(typeof raw === "string" ? raw : "/", self.registration.scope);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        await client.focus();
        client.navigate(url.toString());
        return;
      }
      await self.clients.openWindow(url.toString());
    })(),
  );
});
