# Aurora Glass Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Lumen new-tab Chrome extension as a typed Vite + React app with the Aurora Glass interface, a fully wired settings control center, and the daily-use features defined in the spec.

**Architecture:** A single new-tab React app. A typed, versioned settings schema is the source of truth; Zustand holds settings and transient UI state; a registry drives labels, controls, validation, reset, and export. Feature modules (search, weather, Spotify, focus) are plain TypeScript so they can be unit-tested. Styling is hand-written CSS driven by design tokens and CSS custom properties. The final build is deployed to the extension root so the path-derived extension ID — and therefore legacy `localStorage` — is preserved.

**Tech Stack:** Vite, React 19, TypeScript, Zustand, lucide-react, Vitest, hand-written CSS, @fontsource variable fonts, sharp for icon rasterization.

**Spec:** `docs/superpowers/specs/2026-10-23-aurora-glass-rebuild-design.md`

## Global Constraints

- Chrome Manifest V3, new-tab override; Chromium 120+.
- Permissions: `storage`, `identity` only. No `geolocation`, no `<all_urls>`.
- Host permissions: Spotify API/accounts, Open-Meteo forecast + geocoding, Google suggest, Bing suggest, DuckDuckGo suggest, favicon hosts only if fetched (images do not need host permission).
- CSP: `script-src 'self'`; no remote code, no eval. Inline styles allowed for CSS variables.
- All data local. Settings in `chrome.storage.local`; uploaded wallpapers in IndexedDB.
- Fonts self-hosted via bundled @fontsource packages.
- Design tokens only: components must not hard-code colors, blur, radius, or shadows.
- One concept, one control. Per-surface glass overrides are one intensity each, "inherit" by default.
- No dead settings: every control path exists in defaults and registry; the registry test enforces this.
- Every row has reset; every section has reset.
- Keyboard: `/` search, `Cmd/Ctrl+K` and `Cmd/Ctrl+Shift+P` palette, `Alt+,` settings, `Alt+N` notes, `Esc` close, `?` help. Never bind browser-reserved chords.
- `prefers-reduced-motion` and the Motion setting both suppress non-essential animation.
- Build output must pass `npm run typecheck`, `npm run test`, and `npm run build`.

## Review Focus

These are the failure modes most likely to hurt a real user, and each gets a test or a QA step in the owning task:

1. **Cold first paint** with empty storage and no network — the stage, wallpaper, and type must render without a flash of white or an error screen.
2. **Legacy migration** — partial, corrupt, or absent `lumen-settings`/`lumen-shortcuts` must never lose the current profile; migration runs once at the same path-derived origin.
3. **Settings truthfulness** — every visible control changes something immediately, persists across reload, resets cleanly; no control is disconnected from the UI.
4. **Spotify auth lifecycle** — missing client ID, denied consent, expired token, no active device, and 429/5xx must produce a readable state, not an infinite spinner or a token loop.
5. **Custom wallpaper failure** — a broken URL, unsupported video, or storage-quota error must fall back to the selected scene with a toast and leave the app usable.

---

### Task 1: Scaffold, Manifest, Fonts, Icons, Build

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `.gitignore`, `index.html`
- Create: `public/manifest.json`, `public/icons/*.png`, `public/favicon.svg`
- Create: `scripts/make-icons.mjs`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/styles/tokens.css`, `src/styles/base.css`
- Create: `THIRD_PARTY_NOTICES.md`, `README.md`
- Keep: legacy root `index.html`, `manifest.json`, `assets/` (unchanged; archived by deploy later)

**Interfaces:**
- Produces: `npm run dev|build|typecheck|test|lint|deploy`; `dist/` loads unpacked; `#root` mount; tokens `--bg`, `--text`, `--accent`, `--glass-*`, `--radius*`, `--font-ui`, `--font-accent`.

- [ ] **Step 1:** Create the Vite React-TS project files and install react, react-dom, zustand, lucide-react, @fontsource-variable/manrope, @fontsource/instrument-serif, vitest, @types/chrome, @types/react, @types/react-dom, sharp.
- [ ] **Step 2:** Write `public/manifest.json` with the exact permissions, CSP, new-tab override, icons, and `minimum_chrome_version`.
- [ ] **Step 3:** Write the icon SVG and `scripts/make-icons.mjs`; generate 16/32/48/128 PNGs.
- [ ] **Step 4:** Write `index.html` with dark background and font preload; mount React in `src/main.tsx`; render a temporary stage in `App.tsx`.
- [ ] **Step 5:** Run `npm run build`; verify `dist/manifest.json`, `dist/index.html`, and icons exist; load `dist/` unpacked and confirm the new tab renders.
- [ ] **Step 6:** Commit.

### Task 2: Settings Schema, Registry, Store, Storage, Migration

**Files:**
- Create: `src/lib/settings/types.ts`, `defaults.ts`, `registry.ts`, `paths.ts`, `normalize.ts`, `migrate.ts`
- Create: `src/lib/storage.ts`, `src/store/settings.ts`
- Test: `tests/settings.test.ts`, `tests/migrate.test.ts`, `tests/registry.test.ts`

**Interfaces:**
- Produces:
  - `Settings` with `schemaVersion`, `onboarded`, `profile`, `appearance`, `layout`, `search`, `shortcuts`, `widgets`, `integrations`, `advanced`.
  - `DEFAULT_SETTINGS: Settings`, `DEFAULT_SHORTCUTS: Shortcut[]`.
  - `SETTINGS_REGISTRY: SettingMeta[]`; `SECTION_META`; `getSettingMeta(path: string): SettingMeta | undefined`.
  - `loadSettings(): Promise<{ settings: Settings; migrated: boolean }>`; `saveSettings(settings: Settings): Promise<void>`; `flushSettings(): Promise<void>`.
  - `migrateLegacy(legacySettings: unknown, legacyShortcuts: unknown): Settings | null`.
  - `useSettings` with `settings`, `set(path, value)`, `setMany(partial)`, `reset(path)`, `resetSection(section)`, `resetAll()`, `replace(settings)`, `hydrated`.
  - `getValue(obj, path)`, `setValue(obj, path, value)`, `cloneDefaults()`.
- Storage keys: `lumen.settings.v2`, `lumen.settings.recovery`, `lumen.recentSearches`, `lumen.spotify.tokens`, `lumen.focus`, `lumen.wallpapers`.
- Legacy keys: `lumen-settings`, `lumen-shortcuts`, `lumen-spotify-client-id`.

- [ ] **Step 1:** Write failing tests for defaults/registry coverage, path get/set immutability, normalization clamps, and legacy migration (full, partial, corrupt).
- [ ] **Step 2:** Implement types, defaults, path utilities, normalize, migrate, registry. Run tests.
- [ ] **Step 3:** Implement storage adapter (chrome.storage.local with localStorage fallback for dev), debounced save, flush on pagehide.
- [ ] **Step 4:** Implement the Zustand store and hydration bootstrap; test that clear/reset produces defaults and preserve-on-error works.
- [ ] **Step 5:** Run `npm run test` and `npm run typecheck`; commit.

### Task 3: Design Tokens, Theme Engine, UI Primitives

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/color.ts`
- Create: `src/styles/theme.css`, `src/styles/glass.css`, `src/styles/controls.css`, `src/styles/motion.css`
- Create: `src/components/ui/{IconButton,Toggle,Slider,Segmented,SelectField,ColorField,TextField,SettingRow,Dialog,Toast,ConfirmButton}.tsx`
- Create: `src/store/ui.ts`
- Test: `tests/theme.test.ts`, `tests/color.test.ts`

**Interfaces:**
- Produces:
  - `applyTheme(settings): void` sets `data-theme`, `data-motion`, `data-density`, `data-readability`, `data-scene`, `data-daypart`, and all surface CSS variables.
  - `resolveTheme(mode): 'dark'|'light'`, `hexToRgb(hex)`, `contrastText(hex)`.
  - `<IconButton label icon />`, `<Toggle checked onChange label />`, `<Slider value onChange min max step unit />`, `<Segmented options value onChange />`, `<SelectField options value onChange />`, `<ColorField value onChange presets />`, `<TextField value onChange validate />`.
  - `<SettingRow path label? help?>{control}</SettingRow>` reads registry meta, renders reset, hides when filtered.
  - `<Dialog open onClose title size>` native `<dialog>` wrapper with focus return.
  - `useUI` with `toast(message, tone?)`, `toasts`, `settingsOpen`, `paletteOpen`, `notesOpen`, `helpOpen`, `confirm`, `closeAll`.
- CSS variables: `--glass-blur`, `--glass-fill`, `--glass-border`, `--glass-shadow`, `--glass-sat`, `--search-*`, `--shortcuts-*`, `--dock-*`, `--accent`, `--accent-rgb`, `--accent-contrast`, `--radius`, `--radius-sm`, `--space-*`, `--text`, `--text-dim`, `--line`, `--panel`.

- [ ] **Step 1:** Write tests for theme resolution, intensity token mapping, hex parsing, and contrast text.
- [ ] **Step 2:** Implement color/theme helpers and applyTheme; set global and per-surface variables.
- [ ] **Step 3:** Write tokens/theme/glass/control/motion CSS, including dark/light and six scenes.
- [ ] **Step 4:** Implement UI primitives and toast store/dialog behavior.
- [ ] **Step 5:** Verify with `npm run typecheck` and a temporary demo page; commit.

### Task 4: Stage, Clock/Greeting/Date, Top Rail, Dock Shell, Wallpaper Layer

**Files:**
- Create: `src/features/wallpaper/WallpaperLayer.tsx`, `src/features/clock/{Clock,Greeting,DateLine}.tsx`
- Create: `src/features/shell/{TopRail,Dock,Monogram}.tsx`
- Create: `src/lib/time.ts`, `src/lib/wallpaper.ts`
- Modify: `src/app/App.tsx`
- Test: `tests/time.test.ts`

**Interfaces:**
- Produces:
  - `formatClock(date, { hour12, seconds }): string`, `formatDate(date, style): string`, `getGreeting(date): string`, `getDaypart(date): 'dawn'|'day'|'dusk'|'night'`.
  - `<WallpaperLayer />` reads wallpaper source, resolves IndexedDB blob URLs, applies scene, dim/blur/saturation, grain, vignette, drift, parallax.
  - `<TopRail />` renders monogram, weather/focus/Spotify chips (slots), settings button.
  - `<Dock />` renders Spotify player, focus timer, notes button slots.
  - `resolveWallpaperUrl(source): Promise<string | null>`.
- Behavior: clock updates every second only when seconds shown, otherwise every 20 s; date style short/long; greeting uses profile name and italic accent.

- [ ] **Step 1:** Write time formatting/greeting tests.
- [ ] **Step 2:** Implement time helpers and clock components.
- [ ] **Step 3:** Implement wallpaper layer with scene classes, CSS effects, and IndexedDB resolution.
- [ ] **Step 4:** Assemble App with top rail, center stage, dock slots; verify responsive layout and no white flash.
- [ ] **Step 5:** Commit.

### Task 5: Search

**Files:**
- Create: `src/features/search/{SearchBar,EngineMenu,Suggestions}.tsx`, `src/features/search/index.ts`
- Create: `src/lib/search.ts`, `src/lib/searchHistory.ts`
- Test: `tests/search.test.ts`

**Interfaces:**
- Produces:
  - `SEARCH_ENGINES: Record<SearchEngineId, { id; label; url; suggest?; icon }>`.
  - `buildSearchUrl(engine, query, custom): string`, `validateCustomEngine(template): boolean`.
  - `fetchSuggestions(engine, query, signal): Promise<string[]>`; engine-specific endpoints; failures return [].
  - `loadRecentSearches(): Promise<string[]>`, `addRecentSearch(q)`, `clearRecentSearches()`.
  - `<SearchBar onOpenShortcut? />` with combobox ARIA, debounced suggestions, arrow navigation, `/` focus, engine menu, recent searches, submit behavior.
- Behavior: autofocus from setting; Enter opens; Esc clears then blurs; custom engine URL must contain `%s`; suggestions disabled gracefully for unknown engines.

- [ ] **Step 1:** Write tests for URL building, custom template validation, suggestion parsing, and recent-search dedupe/cap.
- [ ] **Step 2:** Implement search lib and history; run tests.
- [ ] **Step 3:** Build SearchBar with suggestions, engine menu, recent list, keyboard and ARIA.
- [ ] **Step 4:** Wire into stage; verify all four engines, custom engine, and no-network failure.
- [ ] **Step 5:** Commit.

### Task 6: Shortcuts

**Files:**
- Create: `src/features/shortcuts/{ShortcutGrid,ShortcutTile,ShortcutDialog}.tsx`
- Create: `src/lib/favicon.ts`
- Test: `tests/favicon.test.ts`

**Interfaces:**
- Produces:
  - `faviconCandidates(url, customIcon?): string[]`, `monogram(name): string`.
  - `<ShortcutGrid />` with grid columns from settings, add tile, drag reorder (pointer) and `Alt+Arrow` reorder, add/edit/delete dialog, open on click/Enter, Shift+Enter new tab.
  - `validateShortcut(input): { ok: true; value: Shortcut } | { ok: false; error: string }`.
- Behavior: name required ≤ 40 chars; URL auto-prefixed with https; duplicate URLs allowed; max 16; restore defaults from settings manager; favicon fallback chain.

- [ ] **Step 1:** Write tests for URL normalization, validation errors, monogram, favicon fallback order.
- [ ] **Step 2:** Implement lib and tests; run.
- [ ] **Step 3:** Implement tile grid, drag reorder, dialog.
- [ ] **Step 4:** Wire into stage; verify keyboard reorder, add/edit/delete, fallback icons.
- [ ] **Step 5:** Commit.

### Task 7: Settings Control Center

**Files:**
- Create: `src/features/settings/SettingsDrawer.tsx`, `SettingsNav.tsx`, `SettingsSearch.tsx`, `SettingsSection.tsx`
- Create: `src/features/settings/sections/{Appearance,Layout,SearchSection,ShortcutsSection,Widgets,Integrations,Data,About}.tsx`
- Create: `src/features/settings/controls/{VibePicker,WallpaperPicker,AccentPicker,OverrideSlider,CityPicker}.tsx`
- Create: `src/styles/settings.css`
- Test: `tests/settingsSections.test.ts` (registry coverage + reset)

**Interfaces:**
- Consumes: registry, store, UI primitives, theme, wallpaper, weather city search, Spotify connect.
- Produces: `<SettingsDrawer />` opened by `settingsOpen`; section navigation; cross-section search; per-row/section/all reset; Advanced toggle; import/export; storage usage; Spotify integration card; About shortcuts/licenses.
- Behavior: live preview, `Saved` pulse, `Alt+,`, Esc closes, focus trap, mobile full-width, invalid fields keep last good value with inline error.

- [ ] **Step 1:** Write registry coverage/reset tests for every control path.
- [ ] **Step 2:** Build the drawer shell, nav, search, section frame, reset controls.
- [ ] **Step 3:** Implement Appearance (Vibe, wallpaper, accent, effects, glass, radius, density, readability, motion).
- [ ] **Step 4:** Implement Layout, Search, Shortcuts, Widgets, Integrations, Data, About.
- [ ] **Step 5:** Verify every row changes UI and persists; test reset paths; commit.

### Task 8: Weather

**Files:**
- Create: `src/lib/weather.ts`, `src/features/weather/{WeatherChip,WeatherPopover}.tsx`
- Create: `src/features/weather/icons.tsx`
- Test: `tests/weather.test.ts`

**Interfaces:**
- Produces:
  - `searchCity(query, signal): Promise<CityResult[]>`, `fetchWeather(coords, units, signal): Promise<WeatherData>`, `weatherLabel(code)`, `weatherIcon(code)`.
  - `WeatherData` with `current`, `hourly[12]`, `daily[5]`, `fetchedAt`, `stale`.
  - `<WeatherChip />` in top rail; `<WeatherPopover />` with details; city search in settings.
- Behavior: 15-minute cache; stale data on failure; no location permission; units auto = °F for US locale, °C otherwise; forecast toggle hides 5-day; no city shows "Set city".

- [ ] **Step 1:** Write tests for WMO mapping, unit normalization, cache TTL, and forecast mapping from fixture JSON.
- [ ] **Step 2:** Implement weather lib + tests.
- [ ] **Step 3:** Implement chip and popover with loading, error, stale, no-city states.
- [ ] **Step 4:** Implement CityPicker in settings; verify city search and persistence; commit.

### Task 9: Focus Timer and Quick Notes

**Files:**
- Create: `src/lib/focus.ts`, `src/store/focus.ts`, `src/features/focus/{FocusChip,FocusTimer}.tsx`
- Create: `src/features/notes/NotesPanel.tsx`, `src/lib/audio.ts`
- Test: `tests/focus.test.ts`, `tests/notes.test.ts`

**Interfaces:**
- Produces:
  - `nextPhase(mode)`, `clampDurations`, `remaining(deadline, now)`, `formatDuration(ms)`.
  - `useFocus` store: `mode`, `status`, `remainingMs`, `sessionsToday`, `start`, `pause`, `reset`, `skip`, `hydrate`.
  - `<FocusChip />` and `<FocusTimer />`; deadline persistence in `lumen.focus`; reset sessions at local midnight.
  - `playChime(): void` (Web Audio, graceful failure).
  - `<NotesPanel />` with 300 ms autosave, char count, copy, download, two-step clear; `Alt+N`.
- Behavior: timer survives reload/sleep; auto-cycle; no interval when idle/hidden; session completion announces via toast; notes limit 50k.

- [ ] **Step 1:** Write tests for phase math, duration formatting, deadline/remaining, midnight reset, notes normalization.
- [ ] **Step 2:** Implement lib/store/audio and tests.
- [ ] **Step 3:** Build focus chip/timer and notes panel.
- [ ] **Step 4:** Wire dock + shortcuts; verify reload/sleep and chime.
- [ ] **Step 5:** Commit.

### Task 10: Spotify

**Files:**
- Create: `src/lib/spotify.ts`, `src/features/spotify/{SpotifyChip,SpotifyPlayer,SpotifyCard}.tsx`, `src/store/spotify.ts`
- Test: `tests/spotify.test.ts`

**Interfaces:**
- Produces:
  - `buildAuthUrl(clientId, redirectUri, challenge, state)`, `generatePkce(): Promise<{ verifier; challenge }>`, `parseAuthCode(redirect)`, `isTokenFresh(tokens, now)`, `loadTokens/saveTokens/clearTokens`.
  - `connectSpotify(clientId): Promise<void>`, `disconnectSpotify()`, `getPlayer(signal): Promise<PlayerState | null>`, `control(action, value?): Promise<void>`, `refreshAccessToken()`.
  - `<SpotifyChip />`, `<SpotifyPlayer />`, `<SpotifyCard />` (settings connect UI).
- Behavior: `chrome.identity.launchWebAuthFlow`; PKCE S256; scopes `user-read-playback-state user-modify-playback-state user-read-currently-playing`; refresh 60 s before expiry; retry once on 401; poll 5 s only visible; 204 = no active device; disconnect clears tokens; dev-server state explains extension required.

- [ ] **Step 1:** Write tests for PKCE shape, auth URL, code parsing, token freshness, 204/401 state mapping (mock fetch).
- [ ] **Step 2:** Implement auth/token/player lib + tests.
- [ ] **Step 3:** Implement connect card, chip, dock player with polling and controls.
- [ ] **Step 4:** Verify missing ID, denied auth, no device, expired token, disconnect; commit.

### Task 11: Command Palette, Keyboard Map, Help

**Files:**
- Create: `src/features/palette/{CommandPalette,commands.ts}`, `src/features/help/ShortcutHelp.tsx`
- Create: `src/lib/fuzzy.ts`, `src/lib/keyboard.ts`
- Modify: `src/app/App.tsx`
- Test: `tests/fuzzy.test.ts`, `tests/keyboard.test.ts`

**Interfaces:**
- Produces:
  - `fuzzyScore(query, text): number`, `rankCommands(query, commands)`.
  - `Command { id; title; group; keywords?; run(): void | Promise<void> }`.
  - Global key handler: `/`, `Cmd/Ctrl+K`, `Cmd/Ctrl+Shift+P`, `Alt+,`, `Alt+N`, `Esc`, `?`; ignores typing contexts except palette chords.
  - `<CommandPalette />` with grouped results, arrow/Enter/Esc, focus trap/restore; `<ShortcutHelp />`.
- Behavior: commands include search, shortcuts, every settings section, Vibe changes, wallpaper changes, focus start/pause, notes, theme toggle, export, import, replay onboarding.

- [ ] **Step 1:** Write fuzzy ranking and key-matching tests (reserved chords ignored).
- [ ] **Step 2:** Implement fuzzy/keyboard libs + tests.
- [ ] **Step 3:** Implement command registry and palette UI.
- [ ] **Step 4:** Implement help dialog and wire global shortcuts; verify keyboard-only pass; commit.

### Task 12: Onboarding, Import/Export, QA, Production Build, Deploy Script

**Files:**
- Create: `src/features/onboarding/Onboarding.tsx`, `src/lib/backup.ts`, `src/lib/idb.ts`
- Create: `scripts/deploy.mjs`
- Modify: `src/app/App.tsx`, `README.md`
- Test: `tests/backup.test.ts`

**Interfaces:**
- Produces:
  - `<Onboarding />` three steps (name, Vibe, essentials) with skip; sets `onboarded`.
  - `exportSettings(settings, shortcuts, notes): Promise<Blob>`, `importSettings(file): Promise<Settings>`, `validateImport(unknown): Result`.
  - IndexedDB `putWallpaper(id, blob)`, `getWallpaper(id)`, `deleteWallpaper(id)`.
  - `npm run deploy` archives root legacy files to `../HomieExtension-legacy-0.1.0` then copies `dist/*` to root.
- Behavior: import validates and previews before overwrite; export excludes tokens; migration notice offers legacy cleanup; reset all reloads; onboarding replay from About.

- [ ] **Step 1:** Write import/export validation tests (valid, wrong version, out-of-range, prototype keys, missing sections).
- [ ] **Step 2:** Implement backup + IndexedDB helpers + tests.
- [ ] **Step 3:** Implement onboarding with live Vibe preview and skip; wire first-run.
- [ ] **Step 4:** Implement deploy script and archive behavior; verify same-path migration with a seeded legacy profile.
- [ ] **Step 5:** Full QA: typecheck, tests, build, load `dist/`, screenshot dark/light/settings/palette at 1440×900 and 1024×700, reduced motion, keyboard pass.
- [ ] **Step 6:** Commit and summarize.

## Self-Review Notes

- Spec coverage: visual system (Task 3), wallpaper (4), search (5), shortcuts (6), settings center + all sections (7), weather (8), focus/notes (9), Spotify (10), palette/keyboard (11), onboarding/backup/migration/deploy (12), QA/acceptance (12).
- Deliberately excluded from v1: quote widget, geolocation, Firefox port, cloud sync, runtime contrast sampling.
- Type names in later tasks match Task 2 (`Settings`, `Shortcut`, paths) and Task 3 (`useUI`, `applyTheme`).
- Review-focus tests live in Tasks 2 (migration/persistence), 3 (first paint tokens), 7 (truthfulness), 10 (Spotify), 12 (wallpaper/backup + QA).
