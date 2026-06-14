export type Platform =
  | "ios-safari"
  | "ios-chrome"
  | "ios-firefox"
  | "ios-other"
  | "android-chrome"
  | "android-firefox"
  | "android-samsung"
  | "android-other"
  | "desktop-chrome"
  | "desktop-edge"
  | "desktop-safari"
  | "desktop-firefox"
  | "desktop-other"
  | "unknown";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    if (/CriOS/i.test(ua)) return "ios-chrome";
    if (/FxiOS/i.test(ua)) return "ios-firefox";
    if (/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua))
      return "ios-safari";
    return "ios-other";
  }

  if (isAndroid) {
    if (/SamsungBrowser/i.test(ua)) return "android-samsung";
    if (/Firefox/i.test(ua)) return "android-firefox";
    if (/Chrome/i.test(ua)) return "android-chrome";
    return "android-other";
  }

  if (/Edg\//.test(ua)) return "desktop-edge";
  if (/Firefox\//.test(ua)) return "desktop-firefox";
  if (/Chrome\//.test(ua)) return "desktop-chrome";
  if (/Safari\//.test(ua)) return "desktop-safari";
  return "desktop-other";
}

export function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}
