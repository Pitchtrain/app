import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const SERVICE_WORKER_URL = `${import.meta.env.BASE_URL}sw.js`;
const SERVICE_WORKER_SCOPE = import.meta.env.BASE_URL;
const UPDATE_TOAST_ID = "sw-update-ready";

export function useServiceWorkerRegistration(): void {
  const { t } = useTranslation();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return;

    let registration: ServiceWorkerRegistration | undefined;
    let disposed = false;
    let reloading = false;
    // A controllerchange from the very first install (clients.claim) must
    // not trigger a reload — only updates that replace an existing controller.
    let hadController = Boolean(navigator.serviceWorker.controller);

    function notifyUpdateReady(waiting: ServiceWorker) {
      toast(t("app.updateReady"), {
        id: UPDATE_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: t("app.updateReload"),
          onClick: () => waiting.postMessage({ type: "SKIP_WAITING" }),
        },
      });
    }

    function trackUpdates(activeRegistration: ServiceWorkerRegistration) {
      if (activeRegistration.waiting && navigator.serviceWorker.controller) {
        notifyUpdateReady(activeRegistration.waiting);
      }
      activeRegistration.addEventListener("updatefound", () => {
        const installing = activeRegistration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (disposed) return;
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            notifyUpdateReady(installing);
          }
        });
      });
    }

    async function updateRegistration() {
      if (document.visibilityState !== "visible") return;

      try {
        const activeRegistration =
          registration ?? (await navigator.serviceWorker.ready);
        if (disposed) return;
        await activeRegistration.update();
      } catch {
        // Update checks should never block app startup or offline use.
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void updateRegistration();
        return;
      }
      // Apply a pending update while the app is backgrounded so the user
      // returns to the new version. The worker only proceeds if every
      // window of this app is hidden.
      registration?.waiting?.postMessage({ type: "SKIP_WAITING_WHEN_HIDDEN" });
    }

    function onOnline() {
      void updateRegistration();
    }

    function onControllerChange() {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (reloading) return;
      reloading = true;
      toast.dismiss(UPDATE_TOAST_ID);
      window.location.reload();
    }

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    function registerServiceWorker() {
      navigator.serviceWorker
        .register(SERVICE_WORKER_URL, {
          scope: SERVICE_WORKER_SCOPE,
          updateViaCache: "none",
        })
        .then((nextRegistration) => {
          if (disposed) return;
          registration = nextRegistration;
          trackUpdates(nextRegistration);
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
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      window.removeEventListener("load", registerServiceWorker);
    };
  }, [t]);
}
