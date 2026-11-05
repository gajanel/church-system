import { useEffect } from "react";
import {
  clearSessionData,
  isSessionIdle,
  markSessionActivity,
  SESSION_ACTIVITY_KEY,
} from "../api/session";

const CHECK_INTERVAL_MS = 15_000;
const ACTIVITY_WRITE_INTERVAL_MS = 30_000;

export default function SessionGuard() {
  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;
    if (!localStorage.getItem(SESSION_ACTIVITY_KEY)) markSessionActivity();

    let lastWrite = Number(localStorage.getItem(SESSION_ACTIVITY_KEY)) || Date.now();

    const expireIfIdle = () => {
      if (!localStorage.getItem("token")) return;
      if (isSessionIdle(localStorage.getItem(SESSION_ACTIVITY_KEY))) {
        clearSessionData();
        if (window.location.pathname !== "/login") window.location.assign("/login?expired=1");
      }
    };

    const registerActivity = () => {
      const now = Date.now();
      if (now - lastWrite >= ACTIVITY_WRITE_INTERVAL_MS) {
        lastWrite = now;
        markSessionActivity(now);
      }
    };

    const onStorage = event => {
      if (event.key === SESSION_ACTIVITY_KEY || event.key === "token") expireIfIdle();
    };

    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    events.forEach(event => window.addEventListener(event, registerActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    const timer = window.setInterval(expireIfIdle, CHECK_INTERVAL_MS);
    expireIfIdle();

    return () => {
      events.forEach(event => window.removeEventListener(event, registerActivity));
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
