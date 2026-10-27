# Mobile UX Implementation Plan

Goal: make every page of the site comfortable to use on a phone (320–430px wide), especially **reading a chapter** and **drilling flashcards / the interview bank**. Desktop (≥1280px) must look and behave exactly as it does now.

This plan comes from an audit of the production build on an iPhone 13 viewport (390×664), plus 320px checks, run with Playwright. Each finding below was measured or seen in a screenshot.

Rules for the implementer:
- Do **not** edit `content/notes/*.md` (see `CLAUDE.md`).
- Follow existing idioms: Tailwind v4 utility classes, shadcn components in `components/ui/`, `CustomEvent` pattern from `lib/search-events.ts`, `"use client"` only where needed.
- Tailwind is **4.3.3**, so the `pointer-coarse:` / `pointer-fine:` variants are available. Use them for touch-specific changes instead of JS user-agent sniffing.
- Work phase by phase. Run `npm run typecheck && npm run lint` after each phase, and `npm run build` at the end.

---

## Audit findings (what's broken today)

| # | Severity | Where | Problem (measured) |
|---|---|---|---|
| F1 | **P0** | `/` | Page scrolls sideways: `scrollWidth` 751px on a 390px screen (also at 320px). Cause: `ModuleCard`s sit in a single-column CSS grid with no `grid-cols-1`. The implicit `auto` column grows to the `truncate`d (nowrap) chapter titles' max-content width (735px). |
| F2 | **P0** | `/revise` (and any chapter whose content has long inline code) | `scrollWidth` 413px. A long inline `<code>` (`?page=2&limit=20&sort=createdAt&order=desc…`) can't wrap. |
| F3 | **P0** | Chapter pages | Mermaid diagrams shrink to fit (`max-width:100%`). Effective font size on `/notes/what-is-backend` is **3.4px, 4.5px, 4.1px, 13.5px, 8px**, so most diagrams can't be read. Wide sequence diagrams are the worst. |
| F4 | **P0** | Chapter pages | The "Expand diagram" and "Copy code" buttons are `opacity-0 group-hover:opacity-100`. Touch screens have no hover, so they never appear. |
| F5 | **P0** | Diagram fullscreen | Zoom/pan only handles `wheel` and `mouse*` events, and the hint says "Scroll to zoom · drag to pan". There's no pinch zoom and no one-finger pan. The overlay is a hand-made `div` (no scroll lock, so the page behind keeps scrolling; no focus trap) with a 95% transparent background that lets the page show through. |
| F6 | **P0** | `/interview` mock round | After "Reveal answer", content is 675px tall in a 607px area with `overflow: visible` inside a `fixed inset-0` overlay. The answer and grade buttons are **cut off and can't be scrolled to**. |
| F7 | **P0** | Search (`CommandDialog`) | The input is `text-sm` (14px). iOS Safari zooms the whole page on focus when an input is under 16px. |
| F8 | P1 | Chapter pages | Navigation is weak: the "On this page" dropdown sits under the video and is gone once you scroll. Prev/Next and "Mark chapter complete" exist only at the very bottom of 17,000px pages. The "All chapters" button gets its own 49px bar at the top. |
| F9 | P1 | Chapter pages | Heading anchor links (`#`) are invisible 15×32px targets inside every heading. They're easy to hit by accident and do nothing visible. |
| F10 | P1 | Everywhere | Small tap targets: header icons 32×32, tab triggers 29px high, sm buttons 32px, "mark as known" circle about 26px, glossary letters 28px, module-card chapter rows about 32px. The recommended minimum is 44×44 (Apple HIG / WCAG 2.5.5). |
| F11 | P1 | `/flashcards`, `/interview`, `/notes` | Filter chips wrap into walls. On `/flashcards` the 12 chips fill the **whole first screen**; the card starts below the fold, and the grade buttons are two screens down. On `/interview`, 3 rows of controls plus 9 module chips come before the first question. |
| F12 | P1 | `/flashcards` | The card says "space to flip" on phones. There's no keyboard, so it should say "tap to flip". Grade buttons are small and not anchored. |
| F13 | P1 | Mobile nav sheet | It opens from the **left** but the trigger is top-**right**. The close (X) button overlaps the title "Backend from First Principles", and the X is a small target. |
| F14 | P1 | Chapters sheet | Titles are truncated to about 25 chars ("Roadmap for Backend from First…"), so similar chapters (Object Storage Part 1/2, Scaling Part 1/2) can't be told apart. The active chapter isn't scrolled into view. It uses `100vh` (wrong on iOS with the URL bar). |
| F15 | P1 | `/roadmap` | The 31-node flowchart is shrunk to the screen width. Labels are unreadable and nodes are too small to tap. |
| F16 | P2 | `/glossary` | 808 terms on one 110,000px page. The A–Z bar scrolls away, so you have to scroll back to the top to jump. **Duplicate IDs**: every entry starting with "A" gets `id="glossary-A"` (invalid HTML). |
| F17 | P2 | `/` | The "High-yield" section is a wall of 22 long pill links. The hero CTAs wrap unevenly. The `HomeProgress` divider (`h-10 w-px`) ends up as a stray line when items wrap. |
| F18 | P2 | Chapter breadcrumb | The 3rd crumb is a truncated copy of the title shown right below it. That wastes a line on mobile. |
| F19 | P2 | Global | No `viewport` export: no `viewport-fit=cover` (so `env(safe-area-inset-*)` is 0 on notched iPhones) and no `theme-color`. |

What already works and should stay as is: the header collapses correctly, the search dialog layout, the notes index cards, the prev/next stack, the video embed's aspect ratio, tables in `TableScroll` (they scroll horizontally), and code blocks (they scroll horizontally).

---

## Phase 0 — Global foundations

### 0.1 Viewport and safe areas (F19)
`app/layout.tsx`: add
```ts
import type { Viewport } from "next";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },   // match --background dark
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};
```
Do **not** set `maximumScale`/`userScalable`. Users must still be able to pinch-zoom the page.

### 0.2 Overflow safety and prose wrapping (F2)
`app/globals.css`:
- Inside the existing `.note-prose :where(code):not(:where(pre code))…` rule, add `overflow-wrap: anywhere;`.
- Add `.note-prose :where(a) { overflow-wrap: anywhere; }` (long URLs).
- In `@layer base`, add `body { overflow-x: clip; }` as a safety net. Use `clip`, **not** `hidden`, so `position: sticky` keeps working. Fix F1/F2 at the source first. The verification script runs with this line temporarily removed to prove there's no real overflow left.

### 0.3 Touch-friendly hit areas (F10)
- `components/ui/button.tsx`: don't change the default sizes, because desktop must stay the same. Add touch bumps to the size variants:
  - `sm`: append `pointer-coarse:h-10`
  - `default`: append `pointer-coarse:h-11`
  - `icon`, `icon-sm`: append `pointer-coarse:size-11`
- `components/ui/tabs.tsx` `TabsTrigger`: add `pointer-coarse:min-h-10`.
- Header (`components/layout/header.tsx`): the three mobile icon buttons use `className="size-8 …"`, which overrides the variant. Change them to `size-10`, and reduce the gap to `gap-1`. Check `ThemeToggle` (`components/layout/theme-toggle.tsx`) gets the same `size-10` on mobile.
- Add one shared utility to `globals.css` for icon-only targets that must look small but tap large:
  ```css
  @utility hit-area { position: relative; }
  .hit-area::after { content: ""; position: absolute; inset: -10px; }   /* expands tap area to ≥44px */
  ```
  Use it on the "mark as known" toggle (`question-card.tsx`) and the copy/expand buttons.

### 0.4 iOS input zoom (F7)
`components/ui/command.tsx` line ~76 (`CommandPrimitive.Input`): `text-sm` → `text-base sm:text-sm`. Grep for any other `<input`/`Input` with `text-sm` or `text-xs` and apply the same rule (`components/ui/input.tsx` is already correct: `text-base md:text-sm`).

### 0.5 Hover-only controls (F4, F9)
- `components/notes/code-block.tsx` copy button: add `pointer-coarse:opacity-100` and `hit-area`.
- `components/notes/mermaid.tsx` expand button: add `pointer-coarse:opacity-100` and `hit-area`.
- `app/globals.css` `.anchor-heading .heading-anchor`: add `pointer-coarse:hidden` (via `@apply`). Headings stay linkable through the TOC.

---

## Phase 1 — Fix the P0 layout bugs

### 1.1 Home overflow (F1)
- `app/page.tsx` course map grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` → `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`.
- `components/study/module-card.tsx` root div: add `min-w-0`.
- Apply the same `grid-cols-1` fix to every grid in the repo that has no base column count. Grep for `"grid gap-` and `grid gap-3 sm:` (e.g. `components/notes/notes-filter-list.tsx:744`, `components/notes/prev-next.tsx:498`, the `HomeProgress` section in `app/page.tsx:840`).

### 1.2 Mock round scroll (F6) — `components/study/mock-round.tsx`
- Make the body area scrollable: change the content wrapper to `flex-1 overflow-y-auto overscroll-contain`, and put the centred column *inside* it (`mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-8`). Long answers then start at the top and scroll, and short ones stay centred.
- Move the Reveal button and the Again/Good/Easy buttons into a **footer bar** that never scrolls away: `border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]`, with buttons in `grid grid-cols-3 gap-2` and `h-12`.
- When the question changes, scroll the body back to the top (keep a ref on the scroll container and set `scrollTop = 0` in the `next()` handler).
- Lock page scroll while the overlay is open. The simplest way is to render it inside the shadcn `Dialog` (`components/ui/dialog.tsx`) with a full-screen `DialogContent` className override. Otherwise, set `document.body.style.overflow = "hidden"` in an effect and restore it on cleanup. Use `Dialog`: it also gives you Escape-to-close and focus trap.
- Use `h-dvh` instead of `inset-0` height assumptions so the iOS URL bar doesn't cover the footer.

### 1.3 Readable diagrams inline (F3) — `components/notes/mermaid.tsx`
Problem: SVGs get scaled down to the container width without limit.
Fix: keep a **minimum readable scale**, and let wide diagrams scroll horizontally.
- After `setSvg`, in a `useLayoutEffect` keyed on `svg`, read the rendered `<svg>`'s `viewBox.baseVal.width` (`vbW`) and the container's `clientWidth` (`cw`).
- Mermaid renders text at `fontSize: 15px` in viewBox units. Pick `MIN_SCALE = 0.75` (≈11px text). If `cw / vbW < MIN_SCALE`, set `svg.style.maxWidth = "none"` and `svg.style.width = \`${Math.round(vbW * MIN_SCALE)}px\``. Otherwise leave the current behaviour.
- When the diagram overflows, show a small hint under it on coarse pointers: `← swipe to see the full diagram · tap ⤢ to zoom →` (`text-xs text-muted-foreground`). Add a right-edge fade mask on the scroll container (`[mask-image:linear-gradient(to_right,black_85%,transparent)]`) that's removed once the user has scrolled to the end (track with an `onScroll` handler).
- The container already has `overflow-x-auto`. Add `overscroll-x-contain` so horizontal swipes don't trigger browser back-navigation.
- Do the same in `MermaidEager` **only when not printing**. Simpler: leave `MermaidEager` alone, because it's used by `/print` and `/roadmap`, and `/roadmap` is handled in 3.4.

### 1.4 Touch zoom/pan fullscreen viewer (F5)
Replace the hand-rolled `DiagramSurface zoomable` with **`react-zoom-pan-pinch`** (v4.2.0, peerDeps `react: *`, works with React 19). It handles pinch, one-finger pan, double-tap zoom, wheel and mouse drag, so desktop behaviour stays the same.
- `npm i react-zoom-pan-pinch`
- New component `components/notes/diagram-viewer.tsx`:
  - Use the shadcn `Dialog` with `DialogContent` overridden to full screen: `fixed inset-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 bg-background` (fully opaque). Add a visually hidden `DialogTitle`.
  - Top bar: title text `Pinch or scroll to zoom · drag to pan` (use `pointer-coarse:` / `pointer-fine:` to show `Pinch to zoom` on touch and `Scroll to zoom` on desktop), then `−`, `+`, `Fit` buttons (call `zoomOut`/`zoomIn`/`resetTransform` from the render-prop API), then a Close button (`size-11` on touch).
  - Body: `<TransformWrapper minScale={0.5} maxScale={6} initialScale={1} centerOnInit limitToBounds={false} doubleClick={{ mode: "toggle", step: 1.5 }}>` wrapping `<TransformComponent wrapperClass="!w-full !h-full" contentClass="…">`, with the SVG html inside. Make the SVG fill the viewport width at start (`svg { width: 100%; max-width: none; height: auto }`) so "Fit" means fit-to-width.
  - Set `touch-action: none` on the wrapper (the library does this, but double-check that iOS doesn't page-zoom).
- `mermaid.tsx`: delete the zoomable branch, the wheel/mouse handlers and the hand-made overlay. Render `<DiagramViewer open={open} onOpenChange={setOpen} svg={svg} label={firstLine} />`.
- Also make the **whole inline diagram tappable on touch**: wrap `DiagramSurface` so a tap (not a horizontal swipe) opens the viewer. One option: put the open handler on the card with `onClick`, and ignore it when the scroll container's `scrollLeft` changed between pointerdown and click. Keep the explicit ⤢ button too.

---

## Phase 2 — Chapter reading experience (the core of the app)

### 2.1 Bottom reader bar (F8) — new `components/notes/reader-bar.tsx`
A fixed bottom toolbar shown only below `xl` (`xl:hidden`), where the desktop TOC sidebar is hidden.

Layout (height 56px + safe area): `fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]`, inner `mx-auto flex h-14 max-w-screen-md items-center gap-1 px-2`:

| Slot | Control | Behaviour |
|---|---|---|
| 1 | `‹` icon button (`size-11`) | Link to prev chapter (disabled if none), `aria-label="Previous chapter"` |
| 2 | **Contents** button, flex-1 | Shows a `List` icon and the **current section name** (truncate), e.g. "Hop 3 — Reverse proxy". Opens the TOC sheet (2.2). |
| 3 | Chapters icon button (`PanelLeft`) | Opens the chapters sheet (dispatch `CHAPTERS_OPEN_EVENT`, see 2.3) |
| 4 | Complete toggle (`Check` icon, filled/green when complete) | Uses `useCompletedChapters().toggle(slug)`, `aria-pressed` |
| 5 | `›` icon button | Link to next chapter |

Auto-hide: new hook `lib/use-scroll-direction.ts`. It returns `"up" | "down"`, uses a 10px threshold and a passive scroll listener with `requestAnimationFrame`. The bar slides off (`translate-y-full`, `transition-transform duration-200`) when scrolling down, and comes back on scroll up, near the top (<200px), and near the bottom (within 400px of the end). Respect `prefers-reduced-motion` (the global CSS already shortens transitions).

Render it in `app/notes/[slug]/page.tsx` with `slug`, `prev`, `next`, `headings`. Put `data-reader-bar` on its root, and add to `globals.css`:
```css
@media (max-width: 1279px) {
  body:has([data-reader-bar]) footer { padding-bottom: calc(5rem + env(safe-area-inset-bottom)); }
}
```
so the footer and the bottom Prev/Next cards aren't hidden behind the bar.

### 2.2 TOC bottom sheet with active-section tracking
- Pull the `IntersectionObserver` logic out of `components/notes/toc.tsx` into a hook `lib/use-active-heading.ts` (`useActiveHeading(headings): string`). `Toc` uses the hook (same behaviour), and the reader bar uses it to show the current section name.
- Sheet: `components/ui/sheet.tsx` `side="bottom"`, `className="max-h-[75dvh] rounded-t-2xl"`. Add a drag-handle bar (`mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted`), title "On this page", and a scrollable list. Each item is `min-h-11 flex items-center`, the active one gets `bg-secondary font-medium` with a left primary border, h3 items are indented. **Wrap titles to 2 lines** (`line-clamp-2`), don't truncate. When the sheet opens, scroll the active item into view (`block: "center"`).
- Tapping an item closes the sheet and scrolls to the heading. The heading's `scroll-mt-24` already clears the sticky header.
- **Delete** `components/notes/toc-mobile.tsx` and remove its usage from `page.tsx`. The reader bar replaces it.

### 2.3 Chapters sheet improvements (F14) — `components/layout/notes-shell.tsx`
- Remove the separate `lg:hidden` "All chapters" bar (it wastes 49px and is redundant on `/notes`). On chapter pages, the reader bar's chapters button opens the sheet instead.
  - Add `export const CHAPTERS_OPEN_EVENT = "bfp:open-chapters";` to `lib/search-events.ts`. `NotesShell` listens for it and calls `setOpen(true)` (same pattern as `CommandMenu` with `SEARCH_OPEN_EVENT`).
  - On tablet (`md`–`lg`), the reader bar is also visible, so access is the same everywhere below `lg`.
- Sheet height: `ScrollArea className="h-[calc(100dvh-5rem)]"` (dvh, not vh). Width: `w-[85vw] max-w-sm`.
- `components/layout/chapter-nav-list.tsx`: on coarse pointers let titles wrap, `truncate` → `pointer-coarse:whitespace-normal pointer-coarse:line-clamp-2`; row padding `pointer-coarse:py-2.5`. Desktop sidebar stays single-line.
- When the sheet opens, scroll the active link into view: `ref` on the active `<Link>` + `scrollIntoView({ block: "center" })` in an effect when `open` becomes true. A `data-active` attribute + `querySelector` works too.

### 2.4 Chapter header cleanup (F18) — `app/notes/[slug]/page.tsx`
- Breadcrumb: hide the last crumb (title) and its chevron below `sm`: `hidden sm:inline` / `hidden sm:block`. Make "Chapters" a ≥44px target on touch (`py-2 -my-2`).
- `ChapterTabs` (`components/notes/chapter-tabs.tsx`): `TabsList className="w-full sm:w-auto"` with triggers `flex-1 sm:flex-none`, so the three tabs fill the width on mobile.

### 2.5 Mobile nav sheet (F13) — `components/layout/mobile-nav.tsx`, `components/ui/sheet.tsx`
- `side="left"` → `side="right"` (it then opens from the same side as the trigger).
- `components/ui/sheet.tsx` close button: make it `size-11 flex items-center justify-center rounded-md top-2 right-2` (still `absolute`). Give `SheetHeader` `pr-14` wherever there's a long title (the mobile nav and chapters sheets) so the title never runs under the X.
- Make nav rows `min-h-12`.

---

## Phase 3 — Study tools

### 3.1 Scrollable filter chip rows (F11)
New small component `components/ui/chip-row.tsx`:
```tsx
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "scrollbar-hide -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
      "[&>*]:shrink-0 [&>*]:snap-start", className)}>
      {children}
    </div>
  );
}
```
(`scrollbar-hide` already exists in `globals.css`.) On mobile it's one swipeable line; on `sm+` it wraps like today. Use it for:
- `components/notes/notes-filter-list.tsx`: both chip rows. Move the "N chapters" count onto its own line (`ml-auto` doesn't work in a scroll row).
- `components/study/interview-bank.tsx`: module chips.
- `components/study/flashcard-deck.tsx`: deck chips.
- `app/revise/page.tsx`: module jump chips, if they wrap to more than 3 lines (check).
- When a chip is selected, call `scrollIntoView({ inline: "nearest", block: "nearest" })` on it so it stays visible.

### 3.2 Interview bank controls (F11) — `components/study/interview-bank.tsx`
Reorder for mobile:
1. Search input, full width (`w-full`; drop `min-w-[200px]` / `flex-1` on mobile).
2. Row: `grid grid-cols-2 gap-2 sm:flex`, with [Hide known] [Random/By chapter].
3. Chapter `Select`: `w-full sm:w-[180px]`.
4. Module `ChipRow`.
5. **Mock round** as a primary full-width button on mobile (`w-full sm:w-auto`), placed right after the search so it's visible without scrolling.

### 3.3 Question cards (F10) — `components/notes/question-card.tsx`
- Summary row: `py-3.5`, gap stays. The "mark as known" button becomes `p-2 -m-1 hit-area` (≥44px effective).
- Long answers are fine. Make sure code/tables inside answers can scroll horizontally: add `min-w-0 [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto` on the answer div.

### 3.4 Flashcards (F11, F12) — `components/study/flashcard-deck.tsx`, `components/study/flashcard.tsx`
- Deck chips go into `ChipRow` (3.1).
- When a deck starts (`startDeck`), scroll the card area into view (`ref.scrollIntoView({ block: "start", behavior: "smooth" })`, with a top offset for the sticky header via `scroll-mt-20` on the target).
- Flip hint: `<span className="pointer-coarse:hidden">space to flip</span><span className="hidden pointer-coarse:inline">tap to flip</span>`.
- Card: `min-h-72` → `min-h-[min(60dvh,26rem)]`, and `p-8` → `p-5 sm:p-8`. The back side's `max-h-64` becomes `max-h-[50dvh]` with `overscroll-contain`.
- Grade buttons: `grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto`, each `h-12 sm:h-9`. On mobile, make the grade row **sticky at the bottom** while a deck is active: `sticky bottom-0 -mx-4 border-t bg-background/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0`.
- Optional, nice to have: horizontal swipe on the card (left = Again, right = Good) with pointer events and a 80px threshold. **Skip it** if it complicates the flip `onClick`. The buttons are enough.

### 3.5 Glossary (F16) — `components/study/glossary-browser.tsx`
- Wrap the search input and the A–Z bar in a sticky container: `sticky top-14 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0`.
- On mobile the A–Z bar becomes one horizontal `ChipRow`-style line (`flex-nowrap overflow-x-auto`) with `size-9 pointer-coarse:size-10` letter buttons. On `sm+` it wraps as today.
- **Fix duplicate IDs**: put `id={\`glossary-${letter}\`}` only on the **first** entry of each letter (track `prevLetter` while mapping). Increase `scroll-mt-20` to `scroll-mt-36` so the sticky search+letters bar doesn't cover the target.
- Performance (110k px page): add `[content-visibility:auto] [contain-intrinsic-size:auto_7rem]` to each entry `div`.
- Chapter chips under each term: `py-1 pointer-coarse:py-1.5`.

### 3.6 Roadmap (F15) — `components/study/roadmap-diagram.tsx`, `app/roadmap/page.tsx`
- Below `md`, render the roadmap SVG inside the same `TransformWrapper` used in 1.4: a container `h-[70dvh] rounded-xl border`, `initialScale` set so the diagram fits the **width** at about 1.5× (so labels are readable on first view), `limitToBounds`, plus a `+ / − / Fit` control cluster in the corner. Node clicks (mermaid `bindFunctions`) must still work. `react-zoom-pan-pinch` only treats a pointer movement past a few px as a pan, so taps still go through. Verify a tap on a node navigates.
- Above `md`, keep the current behaviour.
- Below the diagram, on mobile only, add a link: "Prefer a list? See the course map →" pointing to `/#course-map` (add `id="course-map"` to that section in `app/page.tsx`).

---

## Phase 4 — Home page polish (F17) — `app/page.tsx`, `components/study/*`

- Hero CTA group: `grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto`. "Start chapter 1" spans both columns (`col-span-2`), and Interview bank + Revise sit side by side below it.
- `HomeProgress`: `grid grid-cols-2 gap-4 sm:flex` and hide the vertical divider below `sm` (`hidden sm:block`).
- `ContinueCard`: progress bar `w-48` → `w-full max-w-48`. Because of the `sm:grid-cols-[auto_1fr]` parent, the continue card shows **above** progress on mobile. Reorder with `order-first sm:order-none` so "Continue where you left off" is the first thing a returning user sees.
- High-yield section: below `sm`, show a vertical list instead of the pill wall. Use `flex flex-col divide-y rounded-xl border` with each row `flex min-h-12 items-center gap-3 px-4` (book icon, title with `line-clamp-2`, chevron). Keep the pills on `sm+` (`sm:flex sm:flex-row sm:flex-wrap sm:divide-y-0 sm:border-0`). Put the "Open the full bank →" link below the heading on mobile (`flex-col items-start gap-1 sm:flex-row sm:items-center`).
- `ModuleCard` chapter rows: `py-1.5` → `py-1.5 pointer-coarse:py-2.5`, and `truncate` → `truncate pointer-coarse:whitespace-normal pointer-coarse:line-clamp-2`.

---

## Phase 5 — Verification (must pass before calling it done)

### 5.1 Automated mobile audit
Playwright isn't a project dependency; don't add it. Run it from a throwaway dir:
```bash
npm run build && npx next start -p 3123 &
mkdir -p /tmp/mobile-audit && cd /tmp/mobile-audit && npm init -y >/dev/null && npm i playwright@1.64.1
# If browsers aren't installed: npx playwright install chromium
# (an existing one lives at ~/.cache/ms-playwright/chromium_headless_shell-1243/…; pass it as executablePath)
```
Script `/tmp/mobile-audit/audit.js`. For each viewport in `[320×640, 375×667, 390×844, 768×1024]` (`isMobile: true, hasTouch: true`) and each route in `/`, `/notes`, `/notes/what-is-backend`, `/notes/caching`, `/notes/object-storage-part-2`, `/interview`, `/flashcards`, `/glossary`, `/revise`, `/roadmap`, `/about`, it should:
1. **Temporarily disable** the `body { overflow-x: clip }` safety net (`page.addStyleTag({ content: "body{overflow-x:visible!important}" })`) and assert `document.documentElement.scrollWidth <= innerWidth`. On failure, print the offending elements (any element whose `getBoundingClientRect().right > innerWidth + 1` that isn't inside an `overflow-x:auto` ancestor).
2. Scroll through the page in 600px steps (to trigger lazy Mermaid), then for each `.mermaid-container svg` compute `renderedWidth / viewBox.width * 15` and assert **≥ 10.5px**.
3. Assert every visible `button` / `[role=button]` / `[role=tab]` / nav `a` (excluding inline links inside `.note-prose` paragraphs) has a bounding box ≥ 40×40, **or** has the `hit-area` class.
4. Save a screenshot per route/viewport to `/tmp/mobile-audit/shots/`.

Interaction checks (at 390px):
- Chapter page: scroll down 2000px → the reader bar is hidden; scroll up 100px → it's visible. Tap Contents → the bottom sheet opens and the active item is highlighted; tap an item → the sheet closes and the heading is below the header (its `getBoundingClientRect().top` is between 56 and 120).
- Tap ⤢ on a diagram → the dialog opens with an opaque background; page `scrollY` doesn't change while you swipe inside it; Escape/X closes it.
- `/interview` → Mock round → Reveal → the grade buttons are fully in the viewport (`bottom <= innerHeight`), and the answer area scrolls (`scrollHeight > clientHeight` for long answers works).
- `/flashcards` → tap a deck → the card's top is in the viewport, the grade buttons are visible without scrolling, and the hint reads "tap to flip".
- Search: open it and check the input's computed `font-size` is ≥ 16px.
- Mobile nav: opens from the right; the X button is ≥ 44px and doesn't overlap the title text (bounding boxes don't intersect).

### 5.2 Manual and desktop regression
- Compare screenshots at **1440×900** before and after for `/`, `/notes/what-is-backend`, `/interview`, `/flashcards`. Take the "before" set first on `master`. The only allowed visible differences: diagram fullscreen viewer chrome, and glossary sticky bar. Desktop must not show the reader bar (`xl:hidden`).
- Check both **dark and light** themes on a phone viewport.
- Check `/print` still renders all diagrams and prints (headless `page.pdf()` should give more than 1 page and no unrendered spinners).
- `npm run typecheck && npm run lint && npm run build`: all clean.
- If you can, test on a real phone with `next dev -H 0.0.0.0` over LAN: iOS Safari (safe-area, input zoom, URL-bar `dvh`) and Android Chrome.

---

## Suggested commit breakdown
1. `Mobile: viewport, overflow fixes, touch targets, hover-only controls` (Phase 0 + 1.1, 1.2)
2. `Mobile: readable inline diagrams and pinch-zoom diagram viewer` (1.3, 1.4)
3. `Mobile: chapter reader bar, TOC sheet, chapters sheet` (Phase 2)
4. `Mobile: scrollable filters, flashcards, interview, glossary, roadmap` (Phase 3)
5. `Mobile: home page polish` (Phase 4)

## Files touched (checklist)
- `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/notes/[slug]/page.tsx`, `app/roadmap/page.tsx`, `app/revise/page.tsx` (chips only, if needed)
- `components/ui/button.tsx`, `components/ui/tabs.tsx`, `components/ui/sheet.tsx`, `components/ui/command.tsx`, **new** `components/ui/chip-row.tsx`
- `components/layout/header.tsx`, `components/layout/mobile-nav.tsx`, `components/layout/notes-shell.tsx`, `components/layout/chapter-nav-list.tsx`, `components/layout/theme-toggle.tsx`
- `components/notes/mermaid.tsx`, **new** `components/notes/diagram-viewer.tsx`, `components/notes/code-block.tsx`, `components/notes/toc.tsx`, **delete** `components/notes/toc-mobile.tsx`, **new** `components/notes/reader-bar.tsx`, `components/notes/chapter-tabs.tsx`, `components/notes/question-card.tsx`, `components/notes/notes-filter-list.tsx`
- `components/study/module-card.tsx`, `home-progress.tsx`, `continue-card.tsx`, `flashcard.tsx`, `flashcard-deck.tsx`, `interview-bank.tsx`, `mock-round.tsx`, `glossary-browser.tsx`, `roadmap-diagram.tsx`
- **new** `lib/use-scroll-direction.ts`, `lib/use-active-heading.ts`; `lib/search-events.ts` (add `CHAPTERS_OPEN_EVENT`)
- `package.json` (+ `react-zoom-pan-pinch`)
