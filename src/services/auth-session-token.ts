const SESSION_ACCESS_TOKEN_KEY = "engify-auth:access-token";

function browserSessionStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpiredJwt(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") {
    return false;
  }

  return exp <= Math.floor(Date.now() / 1000);
}

export function saveSessionAccessToken(token: string, storage: Storage | null = browserSessionStorage()) {
  try {
    storage?.setItem(SESSION_ACCESS_TOKEN_KEY, token);
  } catch {
    // Session restore is best-effort; auth still relies on backend validation.
  }
}

export function clearSessionAccessToken(storage: Storage | null = browserSessionStorage()) {
  try {
    storage?.removeItem(SESSION_ACCESS_TOKEN_KEY);
  } catch {
    // Ignore storage failures so logout/clearAuth can continue.
  }
}

export function loadSessionAccessToken(storage: Storage | null = browserSessionStorage()) {
  let token: string | null = null;
  try {
    token = storage?.getItem(SESSION_ACCESS_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }

  if (!token) {
    return null;
  }

  if (isExpiredJwt(token)) {
    clearSessionAccessToken(storage);
    return null;
  }

  return token;
}
