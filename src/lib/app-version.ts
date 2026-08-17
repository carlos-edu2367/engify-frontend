export const APP_VERSION = __APP_VERSION__;

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

type VersionListener = () => void;

let cachedRemoteVersion: string | null = null;
let listeners: VersionListener[] = [];
let started = false;

async function fetchRemoteVersion(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

async function checkOnce() {
  const remote = await fetchRemoteVersion();
  if (!remote) {
    return;
  }
  cachedRemoteVersion = remote;
  if (remote !== APP_VERSION) {
    listeners.forEach((listener) => listener());
  }
}

export function isNewVersionAvailable() {
  return cachedRemoteVersion !== null && cachedRemoteVersion !== APP_VERSION;
}

export function onNewVersionAvailable(listener: VersionListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

/**
 * PWAs instalados ficam abertos por dias sem nunca rebuscar o index.html.
 * Esse poll periodico + o check ao voltar para a aba sao o unico jeito de o
 * app perceber, sozinho, que existe uma versao mais nova publicada.
 */
export function startVersionWatcher() {
  if (typeof window === "undefined" || started) {
    return;
  }
  started = true;

  void checkOnce();
  window.setInterval(() => void checkOnce(), CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkOnce();
    }
  });
}
