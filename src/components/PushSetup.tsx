import { useEffect } from "react";
import { enablePush } from "../lib/push";

export default function PushSetup() {
  useEffect(() => {
    let disposed = false;
    const run = async () => {
      if (disposed) return;
      try {
        await enablePush();
      } catch {
        /* ignore */
      }
    };
    run();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("pushsubscriptionchange", run);
    }
    return () => {
      disposed = true;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("pushsubscriptionchange", run);
      }
    };
  }, []);

  return null;
}
