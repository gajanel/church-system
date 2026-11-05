const configuredMinutes = Number(import.meta.env?.VITE_SESSION_IDLE_MINUTES || 60);
export const SESSION_IDLE_MINUTES = Number.isFinite(configuredMinutes) && configuredMinutes > 0
  ? configuredMinutes
  : 60;
export const SESSION_ACTIVITY_KEY = "session_last_activity";

export function isSessionIdle(lastActivity, now = Date.now(), idleMinutes = SESSION_IDLE_MINUTES) {
  const timestamp = Number(lastActivity);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return false;
  return now - timestamp >= idleMinutes * 60 * 1000;
}

export function markSessionActivity(now = Date.now()) {
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
}

export function clearSessionData() {
  ["token", "refresh_token", "user", SESSION_ACTIVITY_KEY].forEach(key => localStorage.removeItem(key));
}

export function saveSession({ accessToken, refreshToken, user }) {
  localStorage.setItem("token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  markSessionActivity();
}
