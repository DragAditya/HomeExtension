# Aurora Glass — Lumen New Tab Rebuild

- **Date:** 2026-10-23
- **Status:** Proposed — awaiting approval
- **Decision owner:** user
- **Builder:** agent

## 1. Intent

Rebuild the Lumen new-tab extension from the ground up: a genuinely premium
"Aurora Glass" interface, a curated set of useful daily features, and a settings
system that is coherent, complete, and trustworthy.

The current extension looks good but is a compiled black box. Its settings are a
flat pile of magic numbers with duplicated controls, no validation, no feedback,
no reset, and at least a few controls that do nothing. The user experiences this
as "inconsistent" and "fucked up." The rebuild treats settings as a first-class
product surface, not an afterthought.

Success means the user opens a new tab and wants to stay there: it is calm,
fast, beautiful, and everything visible is configurable from one coherent
control center — with no dead controls.

## 2. Current State

- `HomieExtension/` contains only a built Vite output: `manifest.json`,
  `index.html`, a 478 KB minified JS bundle, 26 KB CSS, and a favicon.
- `C:\Users\ADMIN\Downloads\GodHomepage.zip` is the same build (identical JS
  SHA-256) plus Firefox conversion shims. It contains no source.
- Feature baseline found in the bundle: clock, greeting, date, web search with
  suggestions, shortcut tiles, Spotify OAuth + transport controls, wallpaper
  options, and a settings drawer with Appearance / Search / Shortcuts / Spotify
  tabs.
- Settings live in `localStorage` as one unversioned object plus a separate
  shortcuts array. There are three separate blur values, three opacity values,
  three radius values, three border values, and three glow values, with no
  documented relationship between them.

## 3. Goals

1. A distinctive, cohesive Aurora Glass visual system — not a template.
2. A settings control center where every setting is wired, previewable,
   resettable, searchable, and understandable.
3. A small, high-value feature set that earns its place on the page.
4. Instant, offline-safe new-tab load with no flash of unstyled content.
5. Real source code: typed, modular, testable, and rebuildable.
6. Keyboard and screen-reader accessible; motion-safe.
7. Clean migration from the old extension's settings and shortcuts.

## 4. Non-Goals

- No backend, accounts, cloud sync, or telemetry.
- No AI features, chat, or generated content in v1.
- No Firefox port in v1 (the design should not preclude one).
- No bookmark/tab/history scraping. No permission we cannot justify.
- No dense dashboard of a dozen widgets. Restraint is part of the design.
- No custom user CSS or plugin system.

## 5. Anti-Goals

A build fails if it:

- ships a control that does not visibly change something;
- ships two controls that adjust the same visual property in different ways;
- loses a user's settings or shortcuts on update;
- requires a network request to render the first screen;
- uses remote code or loosens the extension CSP;
- looks like generic glassmorphism with a gradient slapped on.

## 6. Constraints

- Chrome Manifest V3, new-tab override.
- Vite + React + TypeScript source; build output loaded as an unpacked
  extension. The old compiled files stay in place until the new build is
  verified, then move to `legacy/`.
- CSP: scripts only from the extension package; no remote code, no eval.
- All data local. `chrome.storage.local` for settings; IndexedDB for uploaded
  wallpapers (blobs exceed storage quotas comfortably).
- Fonts self-hosted (OFL-licensed) because remote font loading is fragile and
  would flash.
- Runs on Chromium 120+. Spotify requires the user's own developer client ID.
- Performance budget: < 200 KB gzipped JS (excluding fonts), interactive under
  300 ms on a warm cache, no layout shift after first paint.

## 7. Approaches Considered

### Product approach

- **A. Rebuild from source (chosen).** Recreate the extension with a clean
  architecture, keeping the old build as a behavioral reference. Gives full
  control over UI, settings, migration, and performance.
- **B. Patch the minified bundle. Rejected.** Every visual change fights
  478 KB of generated code; settings cannot be made coherent without rewriting
  the state model; unmaintainable.
- **C. Decompile the bundle into source. Rejected.** Produces ugly,
  untrustworthy code and still inherits the broken settings model.

### Technical stack

- **A. Vite + React 19 + TypeScript + hand-written CSS + Zustand (chosen).**
  React suits the interactive surfaces (palette, drawer, widgets); CSS custom
  properties give precise control over the glass system; Zustand is a small,
  predictable store with a custom persistence adapter.
- **B. Vite + vanilla TypeScript. Rejected.** Smaller runtime, but the settings
  UI, command palette, and widget state would become hand-rolled DOM code.
- **C. React + Tailwind. Rejected.** Faster to write generic UI, slower to
  perfect a bespoke glass language, and adds class noise to a small codebase.

### Persistence

- **A. Versioned schema in `chrome.storage.local` + custom migration (chosen).**
  Async, extension-native, supports the storage quota and migration.
- **B. Keep `localStorage`. Rejected.** Synchronous, stringly-typed, invisible
  to extension storage tools, and the source of the current mess.
- **C. `chrome.storage.sync`. Rejected for v1.** Small quota, sync conflicts,
  would leak personal shortcuts to the browser account without being asked.

## 8. Design Direction — Aurora Glass

### 8.1 Feeling

The first second should feel like stepping onto a quiet observation deck before
dawn: deep atmosphere, one soft light source, crisp typography, and nothing
competing for attention. Premium, cinematic, restrained.

### 8.2 Palette

Dark is the canonical theme; light is a warm porcelain interpretation, not an
inversion.

| Token | Dark | Light |
| --- | --- | --- |
| Canvas base | `#03060f` | `#f4f1ea` |
| Canvas deep | `#070c1a` | `#e9e4da` |
| Text primary | `#f5f8ff` | `#131722` |
| Text secondary | `rgba(235,242,255,.64)` | `rgba(19,23,34,.62)` |
| Accent default | `#7c9bff` | `#4f6fe8` |
| Aurora teal | `#5fe3d3` | `#0f9e91` |
| Warm highlight | `#ffc49a` | `#c26b2e` |
| Glass fill | `rgba(13,19,34,.42)` | `rgba(255,255,255,.46)` |
| Glass border | `rgba(255,255,255,.13)` | `rgba(19,23,34,.12)` |

Accent choices are curated swatches plus a custom color input. Status colors are
reserved for weather and focus states, never used decoratively.

### 8.3 Typography

- **Manrope Variable** — UI, search, labels, clock numerals. Weights 200–700.
- **Instrument Serif Italic** — one accent word in the greeting and Vibe
  names. Used sparingly; never for controls.
- Tabular numerals for the clock, timer, and weather. `font-feature-settings:
  "tnum" 1, "ss01" 1`.
- Type scale: display clock `clamp(4.5rem, 11vw, 9.5rem)` at weight 200 with
  `-0.045em` tracking; greeting 1.05–1.35rem; search input 1.05rem; labels
  0.72rem uppercase with 0.14em tracking; body 0.875rem.
- Both font families are bundled with their OFL license files.

### 8.4 Layout

A 12-column stage, `max-width: 1180px`, generous vertical rhythm:

1. **Top rail** — small Lumen monogram, current weather chip (if enabled), focus
   chip, Spotify chip, settings button. Low contrast; recedes until hovered.
2. **Center stage** — greeting, clock, date, search bar, shortcut row. Vertically
   centered with an optical offset; never mathematically dead-center.
3. **Bottom dock** — glass shelf holding the Spotify player, focus timer and
   quick-note button when those widgets are enabled. Collapses when empty.

Responsive: below 900 px the dock stacks and the shortcut grid becomes 4 columns;
below 640 px the clock scales down, the top rail condenses to icons, and search
fills the available width.

### 8.5 Glass Recipe

One recipe, one set of derived tokens:

```
fill     = mix(surface, transparent, 1 - glassOpacity)
blur     = glassBlur * intensity
border   = 1px solid rgba(255,255,255, glassBorder)
highlight = inset 0 1px 0 rgba(255,255,255, .18)
shadow   = 0 24px 80px -24px rgba(0,0,0,.65)
saturate = 1 + glassSaturation
```

The user controls **Glass intensity** (0–100). It scales blur, fill opacity,
border strength, and shadow together so surfaces always feel like one material.
Search, shortcuts, dock, and settings inherit the same tokens. Per-surface
overrides exist only under **Advanced → Customize surfaces**, and each override
is a *single* intensity value (or "inherit") — never separate blur, opacity,
border, and radius knobs. This replaces the old nine-variable soup with one
concept and a narrow escape hatch.

### 8.6 Motion

- Choreography: 180–420 ms, `cubic-bezier(.2,.8,.2,1)` for entrances,
  `cubic-bezier(.4,0,.2,1)` for exits.
- Aurora background drifts on a 40–60 s loop at very low contrast; grain is
  static SVG noise.
- Search expands from 620 px to 680 px on focus with a 1.5% scale, not a bounce.
- Surfaces enter with opacity + 8 px translate; no spinning or sliding trophies.
- Command palette and settings drawer use a shared veil + panel transition.
- `prefers-reduced-motion` and the Motion setting remove background drift,
  parallax, and entrances, leaving only opacity changes.

### 8.7 Wallpaper Engine

- Six curated **wallpaper scenes**: **Aurora Veil**, **Glacial Dusk**,
  **Ember Horizon**, **Midnight Bloom**, **Paper Daylight**, **Deep Field**.
  Each is a layered CSS gradient scene with optional slow drift, not a flat
  linear gradient.
- Optional **time-of-day shift** warms/cools the scene through dawn, day, dusk,
  and night.
- Custom image: URL or local upload (IndexedDB). Custom video: URL or local
  upload, muted/loop/autoplay, with an automatic pause when the tab is hidden.
- Controls: dim, blur, saturation, grain, vignette, drift, parallax. Every one
  has a visible effect and a reset.
- A custom wallpaper that fails to load falls back to the selected wallpaper
  scene and surfaces a non-blocking toast.

### 8.8 Light Theme

Warm paper (`#f4f1ea`), ink text, slightly stronger borders, reduced blur, and
wallpaper scenes remapped rather than inverted. Glass becomes frosted porcelain. The
accent darkens for contrast. No pure white surfaces.

## 9. Feature Specification

### 9.1 Greeting, Clock, Date

- Greeting by local time: "Good morning", "Good afternoon", "Good evening",
  "Good night". Optional name: "Good evening, Alex."
- The greeting's last word may render in Instrument Serif italic (design
  accent), configured by the theme, not a user setting.
- Clock: 12/24 hour, optional seconds, optional blinking colon, tabular
  numerals, localized.
- Date: weekday + month + day by default; options for short, long, or hidden.
- All three individually toggleable.

### 9.2 Search

- Engines: Google, Bing, DuckDuckGo, YouTube, plus one custom engine
  (name + URL template with `%s`).
- Typeahead suggestions (debounced 170 ms, cancellable). Suggestions can be
  disabled; failures fail silently.
- Recent searches (local, optional, max 8) shown on empty focus; clearable.
- Submit behavior: same tab or new tab, configurable.
- Keyboard: `/` focuses search from anywhere; `Esc` clears/blurs; arrow keys
  navigate suggestions; `Enter` opens.
- Search is the visual anchor: 680 px glass capsule, icon left, engine badge
  right, subtle focus glow tied to the accent.

### 9.3 Shortcuts

- 4×2 grid by default, configurable 4×2 / 6×2 / 8×2.
- Each tile: favicon with graceful fallbacks (Google S2 → DuckDuckGo → letter
  monogram), name, hover lift, `Enter` opens, `Shift+Enter` opens in new tab.
- Add/edit/delete via a small glass dialog: name, URL (auto-prefix `https://`),
  optional icon URL.
- Drag to reorder with pointer and keyboard; order persists.
- Empty state invites adding the first shortcut; the "+" tile is always last.
- Defaults on first install: Gmail, YouTube, GitHub, Notion, ChatGPT, X.

### 9.4 Weather

- Provider: Open-Meteo (no API key), city search only. No `geolocation`
  permission: the install-time warning is not worth it for a new-tab weather
  chip, and city search covers the need.
- Current condition, temperature, feels-like, high/low, and a compact 12-hour
  strip. All five-day forecast available in a popover.
- Units: auto / °C / °F.
- Cached for 15 minutes; last successful data renders offline with a subtle
  stale indicator. No error dialog.
- Toggleable from Layout; location and units live in Widgets settings.

### 9.5 Spotify

- OAuth 2.0 PKCE via `chrome.identity.launchWebAuthFlow`; the user supplies a
  client ID in Integrations. Redirect URI is shown and copyable.
- Stores access token, refresh token, and expiry in `chrome.storage.local`;
  refreshes silently. Disconnect clears them.
- Dock player: album art, title, artist, progress, play/pause, previous/next.
  Optional volume slider.
- Polls every 5 s only while the tab is visible and connected; pauses when
  hidden. Handles no-active-device and premium-only errors with plain-language
  messages.
- Old tokens are not migrated (redirect URI changes); the user reconnects once.
  The old client ID is migrated.

### 9.6 Focus Timer

- Default 25/5 Pomodoro; custom work/break lengths 5–90 min.
- Ring progress with remaining time in the dock; start, pause, reset, skip.
- Optional auto-cycle and a soft two-tone chime generated with Web Audio
  (no asset, no network).
- Deadline-based persistence survives reloads and sleep.
- Session count for the day, reset at local midnight.
- Disabled state hides the widget entirely; no zombie interval.

### 9.7 Quick Notes

- Slide-over glass panel from the dock; plain text, autosaved after 300 ms.
- Character count, copy, download as `.txt`, clear with confirmation.
- Stored locally; included in export/import.
- `Alt+N` opens it.

### 9.8 Command Palette

- `Cmd/Ctrl+K` opens a centered palette over a veil.
- Sources: web search, shortcuts, commands (open settings section, toggle theme,
  start focus, open notes, change Vibe or wallpaper, add shortcut), and recent
  actions.
- Fuzzy filtering, grouped results, arrow-key navigation, `Enter` to run,
  `Esc` to close, focus trapped and restored.
- This is the power-user layer; the page remains usable without it.

### 9.9 Settings Control Center

A right-side glass drawer, 440 px, with a searchable section list and a
scrollable panel. Sections:

1. **Appearance** — theme, accent, Vibe, wallpaper, effects, glass intensity,
   radius, density, motion, readability boost.
2. **Layout** — alignment, widget visibility (greeting, clock, date, search,
   shortcuts, weather, Spotify, focus, notes), shortcut grid size. The dock has
   no separate visibility toggle; it appears exactly when Spotify, focus, or
   notes is enabled.
3. **Search** — engine, custom engine, suggestions, recent searches, open in new
   tab, autofocus.
4. **Shortcuts** — full manager with reorder, edit, delete, restore defaults.
5. **Widgets** — weather location/units/forecast, focus durations/auto-cycle/
   chime, notes behavior.
6. **Integrations** — Spotify client ID, connect/disconnect, status, redirect
   URI, test connection.
7. **Data & Privacy** — export, import (validated), reset section, reset all,
   clear notes/history, storage usage, plain-language privacy statement.
8. **About** — version, keyboard shortcut reference, font licenses, build info.

Behavioral rules:

- **Live preview.** Every change applies immediately; no Save button.
- **Debounced persistence.** Writes happen 150 ms after the last change; the
  drawer shows a quiet "Saved" pulse.
- **One concept, one control.** No duplicate knobs. Global material controls
  own blur/opacity/border; advanced per-surface overrides are opt-in and inherit.
- **Every row has reset.** A hover/focus reset icon restores that setting's
  default; each section has "Reset section"; Data has "Reset everything."
- **Search within settings.** Filters rows by label, section, and keywords.
- **Advanced mode.** Hides per-surface overrides, custom CSS-free knobs, and
  storage details unless enabled.
- **Validation.** URL fields, color values, numeric ranges, and imported JSON
  are normalized; invalid input keeps the last good value and explains why.
- **No dead keys.** A settings registry maps every schema key to a control and a
  consumer. A unit test fails if a key is missing from either side.
- **Keyboard.** Drawer opens with `Alt+,`; `Esc` closes; tab order follows
  visual order; focus is trapped while open and restored on close.
- **Mobile/small windows.** Drawer becomes full-width below 520 px.

### 9.10 Onboarding

First run only, three compact steps over the live new-tab stage:

1. **Hello** — name for the greeting (optional).
2. **Vibe** — pick one of five Vibes with live background previews.
3. **Essentials** — search engine, city for weather (optional), Spotify later.

Skip is always available. Onboarding never blocks the page; it can be reopened
from About. Completing it writes `onboarded: true`.

### 9.11 Vibes and Wallpapers

There is **one macro system**, called a **Vibe**, and a separate wallpaper
library. A Vibe sets theme, accent, wallpaper scene, and effect levels; the
wallpaper library changes only the background.

| Vibe | Theme | Accent | Wallpaper scene |
| --- | --- | --- | --- |
| **Aurora** | dark | periwinkle | Aurora Veil |
| **Frost** | dark | teal | Glacial Dusk |
| **Ember** | dark | amber | Ember Horizon |
| **Noir** | dark | monochrome | Midnight Bloom |
| **Daylight** | light | terracotta | Paper Daylight |

`Deep Field` is an extra wallpaper scene, not a Vibe.

- Onboarding and the Appearance section both offer the five Vibes with live
  previews.
- Choosing a Vibe applies its values; it is a one-shot macro, not a persistent
  mode. The row then shows "Custom" if any of those values are later changed.
- Choosing a wallpaper replaces only the background; it does not change the
  theme or accent. Choosing a Vibe replaces a custom wallpaper with the Vibe's
  scene (the previous custom image stays saved for reselection).
- The palette offers "Change Vibe" and "Change wallpaper" as separate commands.

### 9.12 Keyboard

| Shortcut | Action |
| --- | --- |
| `/` | Focus search |
| `Cmd/Ctrl+K` | Command palette (also `Cmd/Ctrl+Shift+P`) |
| `Alt+,` | Settings |
| `Alt+N` | Quick notes |
| `Esc` | Close top layer / clear search |
| `?` | Shortcut cheat sheet |

`Cmd/Ctrl+Shift+N`, `Cmd/Ctrl+,` (macOS), and other browser-reserved chords are
deliberately avoided and will not be intercepted. All active shortcuts are
discoverable in About and the palette.

### 9.13 Accessibility

- Semantic landmarks and headings; the clock is `<time>`.
- Visible focus rings using the accent at 2 px with offset.
- Contrast targets: WCAG AA for text on glass in both themes, guaranteed over
  the six built-in scenes via conservative token floors. Custom wallpapers get
  a **Readability boost** (on by default) that raises fill opacity, adds dim,
  and strengthens text shadows; we do not sample arbitrary video frames at
  runtime, so AA is not claimed for every custom image.
- Icons have accessible names; decorative art is hidden.
- Focus trap and return for drawer, palette, dialogs, notes.
- Reduced motion honored from both OS and settings.
- No color-only status; focus and weather include text.
- Screen-reader announcements for save, timer completion, and import results.

## 10. Settings Architecture

### 10.1 Shape

```ts
type Settings = {
  schemaVersion: 2;
  appearance: { ... };
  layout: { ... };
  search: { ... };
  widgets: { ... };
  integrations: { ... };
  advanced: { ... };
  data: { ... };
};
```

Defaults live in `src/lib/settings/defaults.ts`. A `SETTINGS_REGISTRY` describes
every leaf: key path, label, section, control type, min/max, default, help text,
and whether it is advanced. UI, validation, export, and reset all derive from
the registry — the single source of truth.

### 10.2 Persistence

- Key: `lumen.settings.v2`.
- Read once at startup; if absent, look for legacy keys and migrate.
- Writes are debounced and serialized; errors surface as a toast but never
  block the UI.
- Corrupt JSON: fall back to defaults for affected sections, preserve the raw
  value under `lumen.settings.recovery` for inspection.
- Uploaded wallpapers are blobs in IndexedDB (`lumen.wallpapers`), referenced by
  id; export includes them as data URLs only if under 12 MB total, otherwise it
  notes that wallpapers are excluded.

### 10.3 Migration from Lumen 0.1

On first run, read `lumen-settings`, `lumen-shortcuts`, `lumen-spotify-client-id`
from `localStorage` if present:

| Legacy | New |
| --- | --- |
| `theme`, `accent` | `appearance.theme`, `appearance.accent` |
| `blur` | `appearance.glassBlur` (normalized 0–100) |
| `glow` | `appearance.effects.glow` |
| `showClock`, `showGreeting`, `showDate` | `layout.widgets.*` |
| `background.type/fit/dim/autoplay/loop/muted` | `appearance.wallpaper.*` |
| `engine`, `suggestions`, `newTab` | `search.*` |
| `spotifyClientId` | `integrations.spotifyClientId` |
| `searchBlur/Opacity/Border/Glow/Tint` | Collapsed into one `advanced.overrides.search` intensity (weighted average, clamped; dropped if close to the global value) |
| `searchRadius` | `appearance.radius` (first valid legacy radius wins) |
| `shortcutOpacity/Blur/Border/Glow` | Collapsed into one `advanced.overrides.shortcuts` intensity |
| `shortcutRadius/Gap/Scale` | Dropped; the new radius and grid-size controls are authoritative |
| `lumen-shortcuts` | `shortcuts` |

Legacy keys are never deleted automatically; a migration notice in Data offers
to clear them after a successful import. Tokens are not migrated. The toast
reads: "Your Lumen settings were imported. Reconnect Spotify once."

## 11. Architecture

```
HomieExtension/
  package.json
  vite.config.ts
  tsconfig.json
  docs/superpowers/specs/...
  public/
    manifest.json
    icons/ (16, 32, 48, 128)
    fonts/ (Manrope, Instrument Serif + OFL)
  src/
    main.tsx
    app/App.tsx
    app/providers.tsx
    styles/tokens.css
    styles/base.css
    styles/glass.css
    components/ (IconButton, Slider, Toggle, Select, ColorField, Segmented,
                 Dialog, Toast, Tooltip)
    features/
      clock/  greeting/  search/  shortcuts/  weather/  spotify/
      focus/  notes/  palette/  settings/  wallpaper/  onboarding/
    lib/
      storage.ts  idb.ts  settings/{defaults,registry,migrate,validate}.ts
      spotify.ts  weather.ts  favicon.ts  audio.ts  time.ts  cn.ts
    store/
      useSettings.ts
      useUi.ts
  tests/
    settings.test.ts  migrate.test.ts  time.test.ts  focus.test.ts
    spotify.test.ts  weather.test.ts  registry.test.ts
```

- **Settings store** — Zustand store created from defaults + hydrated storage;
  selectors keep re-renders scoped. A persistence subscriber writes debounced.
- **UI store** — transient state only: open drawer, palette, notes, toasts,
  dialogs, focus session runtime.
- **Tokens** — `applyTheme(settings)` writes CSS custom properties to
  `document.documentElement`; components never hard-code colors or blur.
- **Search / weather / Spotify** — isolated modules with typed results and no
  React dependencies, unit-testable.
- **Build** — `npm run build` emits `dist/` with copied `manifest.json`, icons,
  fonts, and `index.html`.
- **Install topology and migration.** Chrome derives an unpacked extension's ID
  from its folder path, so a build loaded from `dist/` is a *different* origin
  and cannot read the old extension's `localStorage`/IndexedDB. QA therefore
  treats `dist/` as a fresh install, and the final install must occupy the same
  root path the old extension used:
  1. QA the new build from `dist/` as a clean install.
  2. `npm run deploy` archives the old root files to
     `../HomieExtension-legacy-0.1.0/` (outside the extension root), then
     copies `dist/*` into the repo root.
  3. Reload the extension from the root path. It keeps the path-derived ID, so
     the first run can read and migrate the legacy keys.
  4. Rollback = copy the archived files back into the root and reload.
  No manifest `key` is invented: the old ID is path-derived and cannot be
  reproduced from a new key without changing the old install first.
- **Manifest** — permissions: `storage`, `identity` only. No `geolocation`
  (weather is city-search based). Host: Spotify API/accounts, Open-Meteo,
  Google suggest, favicon services. No `<all_urls>`; images/videos load under
  `img-src`/`media-src` from https without host permission. If a remote video
  URL needs fetch/cors, the user gets a clear error and can upload locally
  instead.

## 12. Security and Privacy

- No analytics, no third-party scripts, no remote code, no eval.
- Tokens remain local; disconnect wipes them.
- Weather city coordinates are sent only to Open-Meteo, only when the widget
  is on. No device location is read.
- Search suggestions go to the selected engine's suggest endpoint; the feature
  can be turned off.
- Import validates shape, types, ranges, and rejects prototype-polluting keys.
- External links open with `noopener,noreferrer`.

## 13. Performance

- Critical path: HTML → CSS → fonts (preload, `font-display: swap`) → React.
- Backgrounds are CSS gradients; custom images are lazy-decoded and sized to
  the viewport.
- No runtime animation loop except the optional aurora drift (CSS, GPU-friendly)
  and the focus timer (1 s interval only while running).
- Weather cached 15 min; Spotify poll 5 s only when visible; suggestions
  debounced and aborted.
- Settings drawer and palette are code-split if the initial bundle exceeds
  budget.
- Bundle budget enforced manually via `npm run build` output; target < 200 KB
  gzip JS.

## 14. Testing and QA

Automated:

- Unit tests for defaults, registry completeness, migration, time formatting,
  focus math, search URL building, weather mapping, Spotify token expiry.
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- A registry test that fails when a schema key has no control or no consumer.

Manual Chrome checklist:

- Load `dist/` unpacked; new tab shows the stage; no console errors or CSP
  violations.
- Every section of the control center: change, reload, confirm persistence;
  reset a row, a section, and everything.
- Import/export round trip; corrupt import rejected with a readable message.
- Legacy migration from a profile seeded with old keys.
- Spotify connect, refresh, play/pause/skip, disconnect, reconnect.
- Weather city search, invalid city, offline cache.
- Shortcut add/edit/delete/reorder, favicon fallbacks.
- Focus timer across reload/sleep; chime; auto-cycle off.
- Notes autosave and download.
- Keyboard-only pass for every overlay; focus return.
- Visual QA at 1024×700, 1280×800, 1440×900, 1920×1080, 2560×1440.
- Light theme contrast spot check; reduced motion; 200% zoom.

## 15. Acceptance Criteria

1. The extension builds from source and loads unpacked in Chrome.
2. The Aurora Glass stage renders with the chosen Vibe, clock, greeting,
   search, and shortcuts without network access.
3. Every control in Settings changes the UI immediately, persists across
   reloads, and has a working reset.
4. There are no duplicate or dead settings; the registry test proves coverage.
5. Legacy settings and shortcuts migrate on first run; a notice explains the
   Spotify reconnect.
6. Search, shortcuts, weather, Spotify, focus, notes, palette, and onboarding
   work as specified, including their error states.
7. Keyboard-only operation and reduced-motion mode are complete.
8. No remote code, no analytics, no `<all_urls>`, no console errors.
9. Typecheck, lint, unit tests, and production build pass.
10. Visual QA passes at the listed viewport sizes in both themes.

## 16. Milestones

1. **Foundation** — scaffold, tokens, fonts, icons, manifest, wallpaper engine,
   clock/greeting/date, stage layout.
2. **Settings core** — schema, registry, storage, migration, control center
   shell, appearance and layout sections.
3. **Daily use** — search, suggestions, recent searches, shortcuts manager,
   command palette, keyboard map.
4. **Widgets** — weather, focus timer, notes, Spotify integration and dock.
5. **Polish** — onboarding, Vibes, data tooling, accessibility, responsive
   QA, performance pass, final build and same-path deploy.

## 17. Decisions Left to the Builder

- Exact font pair licensing and subsetting.
- Icon artwork for the monogram (simple, geometric, works at 16 px).
- Weather code → icon/label mapping and the exact forecast layout.
- Whether the dock auto-hides when idle.
- Microcopy throughout.
- Test runner configuration and lint rules.
- IndexedDB wrapper details and storage-quota messaging.

## 18. Risks

- **Backdrop-filter cost** on weak GPUs → glass intensity and "reduced effects"
  lower blur; test on integrated graphics.
- **Spotify developer setup** is a hurdle → onboarding explains it and the app
  works fully without Spotify.
- **Custom video wallpapers** can be heavy → size warning and local upload
  preferred; pause when hidden.
- **Remote images** may fail CORS/CSP → clear fallback and upload path.
- **Font bundle size** → subset to Latin, preload only the regular and medium
  weights initially.
- **Scope** — the feature set is ambitious; milestones keep each layer shippable.

## 19. Resolved Builder-Check Decisions

These were open in the first draft and are now settled as follows:

1. **Install and migration** — dev QA from `dist/` (clean origin); final install
   replaces the root path via `npm run deploy`, preserving the path-derived
   extension ID so legacy `localStorage` migration works. Old files archived
   outside the extension root for rollback.
2. **Vibes vs. wallpapers** — one Vibe macro per theme, plus an independent
   six-scene wallpaper library. No second preset system.
3. **Keyboard** — reserved Chrome chords are avoided. Settings is `Alt+,`,
   notes is `Alt+N`; palette supports `Cmd/Ctrl+K` and `Cmd/Ctrl+Shift+P`.
4. **Quotes** — dropped. The quote toggle and all references are removed to
   avoid a dead control.
5. **Glass overrides** — one intensity value per surface ("inherit" by default),
   not six properties. Legacy values are collapsed into one.
6. **Widget placement** — the top rail holds compact status chips for weather,
   focus, and Spotify; the dock holds the expanded Spotify player, focus timer,
   and notes button. Notes is a Layout toggle; the dock appears when any of its
   three widgets is enabled. Chips are alternate presentations, not separate
   widgets.
7. **Location** — no geolocation permission; city search only.
8. **Contrast** — AA guaranteed over built-in scenes; custom wallpapers get the
   on-by-default Readability boost, with no runtime frame sampling.
9. **Onboarding** — the unused "what you use this page for" question is removed.
   Onboarding collects name, Vibe, and essentials only.
