import { useEffect } from "react";

const SERVICE_WORKER_URL = `${import.meta.env.BASE_URL}sw.js`;
const SERVICE_WORKER_SCOPE = import.meta.env.BASE_URL;

export function useServiceWorkerRegistration(): void {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return;

    let registration: ServiceWorkerRegistration | undefined;
    let disposed = false;

    async function updateRegistration() {
      if (document.visibilityState !== "visible") return;

      try {
        const activeRegistration =
          registration ?? (await navigator.serviceWorker.ready);
        await activeRegistration.update();
      } catch {
        // Update checks should never block app startup or offline use.
      }
    }

    function onVisibilityChange() {
      void updateRegistration();
    }

    function onOnline() {
      void updateRegistration();
    }

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    function registerServiceWorker() {
      navigator.serviceWorker
        .register(SERVICE_WORKER_URL, { scope: SERVICE_WORKER_SCOPE })
        .then((nextRegistration) => {
          if (disposed) return;
          registration = nextRegistration;
          void updateRegistration();
        })
        .catch(() => {});
    }

    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);
}
