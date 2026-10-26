"use client";

import { useCallback, useEffect, useState } from "react";

const KEYS = {
  completed: "bfp:completed-chapters", // string[] of slugs
  known: "bfp:known-questions", // string[] of question ids
  lastVisited: "bfp:last-visited", // { slug, title, scrollPct, ts }
  leitner: "bfp:leitner-boxes", // Record<cardId, { box: number, due: number }>
  visited: "bfp:visited-chapters", // string[] of slugs, ever opened
};

const LOCAL_EVENT = "bfp:store-changed";

function readRaw<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeRaw<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: { key } }));
  } catch {
    // storage full or disabled — fail silently, app still works without persistence
  }
}

/** Hydration-safe hook for a JSON value stored at `key`, synced across components/tabs. */
export function useStoredValue<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    setValue(readRaw(key, fallback));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key: string } | undefined;
      if (!detail || detail.key === key) setValue(readRaw(key, fallback));
    };
    window.addEventListener(LOCAL_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(LOCAL_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(readRaw(key, fallback)) : next;
      writeRaw(key, resolved);
      setValue(resolved);
    },
    [key, fallback]
  );

  return [value, update];
}

export function useCompletedChapters() {
  const [completed, setCompleted] = useStoredValue<string[]>(KEYS.completed, []);
  const isComplete = useCallback((slug: string) => completed.includes(slug), [completed]);
  const toggle = useCallback(
    (slug: string) => {
      setCompleted((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    },
    [setCompleted]
  );
  return { completed, isComplete, toggle };
}

export function useKnownQuestions() {
  const [known, setKnown] = useStoredValue<string[]>(KEYS.known, []);
  const isKnown = useCallback((id: string) => known.includes(id), [known]);
  const toggle = useCallback(
    (id: string) => {
      setKnown((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]));
    },
    [setKnown]
  );
  return { known, isKnown, toggle };
}

export interface LastVisited {
  slug: string;
  title: string;
  scrollPct: number;
  ts: number;
}

export function useLastVisited() {
  return useStoredValue<LastVisited | null>(KEYS.lastVisited, null);
}

export function recordLastVisited(entry: LastVisited) {
  writeRaw(KEYS.lastVisited, entry);
  const visited = readRaw<string[]>(KEYS.visited, []);
  if (!visited.includes(entry.slug)) {
    writeRaw(KEYS.visited, [...visited, entry.slug]);
  }
}

export function useVisitedChapters() {
  const [visited] = useStoredValue<string[]>(KEYS.visited, []);
  return visited;
}

// --- Leitner flashcard boxes -------------------------------------------------

export interface LeitnerCard {
  box: number; // 1..5
  due: number; // epoch ms
}

const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 14];
const DAY_MS = 24 * 60 * 60 * 1000;

export function useLeitnerBoxes() {
  const [boxes, setBoxes] = useStoredValue<Record<string, LeitnerCard>>(KEYS.leitner, {});

  const grade = useCallback(
    (cardId: string, result: "again" | "good" | "easy") => {
      setBoxes((prev) => {
        const current = prev[cardId] ?? { box: 1, due: Date.now() };
        let box = current.box;
        if (result === "again") box = 1;
        else if (result === "good") box = Math.min(5, box + 1);
        else box = Math.min(5, box + 2);
        const days = BOX_INTERVALS_DAYS[box - 1] ?? 0;
        return { ...prev, [cardId]: { box, due: Date.now() + days * DAY_MS } };
      });
    },
    [setBoxes]
  );

  const dueCount = useCallback(
    (cardIds: string[]) => {
      const now = Date.now();
      return cardIds.filter((id) => {
        const c = boxes[id];
        return !c || c.due <= now;
      }).length;
    },
    [boxes]
  );

  const isDue = useCallback(
    (cardId: string) => {
      const c = boxes[cardId];
      return !c || c.due <= Date.now();
    },
    [boxes]
  );

  return { boxes, grade, dueCount, isDue };
}
