const reloadMarker = "engify:chunk-reload-attempted";

export function isDynamicImportFetchError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk \d+ failed|ChunkLoadError/i.test(message);
}

export function reloadOnceForUpdatedChunks() {
  if (typeof window === "undefined") {
    return false;
  }

  const alreadyReloaded = window.sessionStorage.getItem(reloadMarker) === "true";
  if (alreadyReloaded) {
    return false;
  }

  window.sessionStorage.setItem(reloadMarker, "true");
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("v", String(Date.now()));
  window.location.replace(nextUrl.toString());
  return true;
}

export function clearChunkReloadMarker() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(reloadMarker);
  }
}
