"use client";

import { useEffect } from "react";

/** Registers public/sw.js in production so the site is installable as an app. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // registration failure just means no install/offline support — the site still works
    });
  }, []);
  return null;
}
