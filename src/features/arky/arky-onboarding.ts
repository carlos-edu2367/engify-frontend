const ARKY_ONBOARDING_VERSION = "v1";
const ARKY_ONBOARDING_SEEN_VALUE = "seen";

export function getArkyOnboardingStorageKey(userId?: string | null) {
  const normalizedUserId = userId?.trim();

  if (normalizedUserId) {
    return `engify:arky-onboarding:${ARKY_ONBOARDING_VERSION}:user:${encodeURIComponent(
      normalizedUserId
    )}`;
  }

  return `engify:arky-onboarding:${ARKY_ONBOARDING_VERSION}:browser`;
}

export function hasSeenArkyOnboarding(storage: Storage, userId?: string | null) {
  try {
    return (
      storage.getItem(getArkyOnboardingStorageKey(userId)) === ARKY_ONBOARDING_SEEN_VALUE
    );
  } catch {
    return true;
  }
}

export function markArkyOnboardingSeen(storage: Storage, userId?: string | null) {
  try {
    storage.setItem(getArkyOnboardingStorageKey(userId), ARKY_ONBOARDING_SEEN_VALUE);
  } catch {
    // Ignore storage failures so the widget remains usable.
  }
}
