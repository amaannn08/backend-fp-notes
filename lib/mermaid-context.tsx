"use client";

import { createContext } from "react";

/** When true, <Mermaid> renders immediately instead of waiting for intersection — used on /print. */
export const MermaidEagerContext = createContext(false);

/** Optional progress reporter; <Mermaid> calls it once per diagram after render settles (success or error). */
export const MermaidProgressContext = createContext<(() => void) | null>(null);
