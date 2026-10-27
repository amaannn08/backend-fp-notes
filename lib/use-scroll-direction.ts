"use client";

import { useEffect, useState } from "react";

/**
 * Tracks scroll direction for auto-hiding fixed toolbars.
 * Returns "up" (show) near the top, near the bottom, or while scrolling up;
 * returns "down" (hide) while scrolling down past `threshold` px, away from either edge.
 */
export function useScrollDirection(threshold = 10, edgeMargin = 300) {
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const nearTop = y < edgeMargin;
      const nearBottom = maxScroll - y < edgeMargin;

      if (nearTop || nearBottom) {
        setDirection("up");
      } else if (y - lastY > threshold) {
        setDirection("down");
      } else if (lastY - y > threshold) {
        setDirection("up");
      }
      lastY = y;
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, edgeMargin]);

  return direction;
}
