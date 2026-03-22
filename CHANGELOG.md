# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.4.0] — 2026-03-22

### Added

- **"Bake this again" button**: Session detail overlay has a new button that loads the saved recipe back into the calculator, pre-filling all inputs so you can repeat or tweak a previous bake
- **Standalone mixing method persistence**: Mixing method is saved independently in localStorage and automatically restored — remembers your last choice across sessions without being tied to recipe selection or bake restoration
- **Date picker on save-bake form**: New date field (defaults to today, max today) lets you register bakes from past days
- **Adjust recipe values before saving**: Expansion toggle reveals editable ingredient fields (flour, water, milk, salt, sugar, oil, yeast, starter) so you can record actual amounts used
- **Post-deploy smoke test**: `npm run deploy` now verifies the production API responds correctly after upload — checks `/auth/config` returns 200 and authenticated endpoints return 401 (not 500). Catches incomplete FTP uploads that leave PHP files broken.
- **Reusable `app-expansion` component**: Collapsible toggle panel with chevron indicator and `aria-expanded` — replaces duplicated show/hide patterns in calculator (advanced settings), baking-session (show recipe), and shared-bake (show recipe). Styled via CSS custom properties (`--expansion-bg`, `--expansion-padding`, etc.)
- **Reusable `app-select` component**: Encapsulates the select + chevron pattern used across calculator, flour blend, and compare views — configured via CSS custom properties (`--select-height`, `--select-font-size`, etc.)
- **Reusable `app-lightbox` component**: Encapsulates photo lightbox with keyboard navigation, swipe gestures, dots, and arrows — replaces duplicated lightbox code in baking-session and shared-bake views
- **Global UI classes**: Button variants (`.btn-primary`, `.btn-secondary`, `.btn-icon`, `.btn-copy`, `.btn-lang`), layout primitives (`.section-card`, `.section-header`, `.overlay`, `.overlay-card`), and form helpers (`.field-label`, `.field-hint`) defined once in `styles.scss`
- **Flour blend in bake view**: Saved bakes now store and display the flour blend breakdown (per-flour percentages and weights) in the recipe results — visible in session detail, shared bake, and compare views
- **Hydration adjustment notice**: When flour blend caused a hydration adjustment, an info box in the recipe results explains the change and advises recipients using different flours to start at base hydration
- **Flour blend in compare view**: Side-by-side flour blend comparison shown below the data table when either bake used a custom flour blend

### Changed

- **Removed `_mixins.scss`**: All SCSS mixins replaced with global CSS classes or inline styles — eliminates duplicated CSS output and simplifies component stylesheets
- **Removed `styles.css`**: Stale unused file (Angular only loads `styles.scss`)
- **Migrated all components**: Calculator, flour-blend, results, instructions, save-bake, baking-session, compare, confirm-dialog, splash, shared-bake, and app root — all now use global classes instead of mixin includes

### Fixed

- **Auth guard race condition**: Reloading `/#/sessions` while logged in no longer redirects to the start page — the guard now waits for the initial `/auth/me` check to complete before deciding

## [1.3.1] — 2026-03-21

### Added

- **Recipe toggle in bake view**: Expandable "Show recipe" / "Hide recipe" button in both session detail and shared bake pages — displays the full results snapshot (stats, ingredients) inline

## [1.3.0] — 2026-03-20

### Added

- **Baking session title**: Optional title field when saving or editing a bake — shown in the session grid, detail view, compare dropdown, and shared bake page for easier identification
- **Edit baking session**: Pencil button on session detail opens edit mode for rating and notes — save/cancel buttons prevent accidental changes
- **Shareable bake links**: Toggle sharing on a bake to generate a secret URL (`/#/bake/<hash>`). Uses a 64-char random hash and an `is_public` flag — both are required for access. Link can be copied to clipboard and sharing can be revoked
- **Lightbox navigation**: Prev/next arrow buttons, clickable dots, and auto-focus for keyboard navigation in the photo lightbox

### Changed

- **Topbar layout redesigned**: App name and baguette logo anchored to the left, language/theme toggles and profile moved to the right — matching a modern SaaS-style header. Baguette logo hidden on mobile (already in bottom nav)
- **Theme toggle 3-way cycle**: System → opposite of OS → same as OS → system. Icon adapts to OS preference so the first toggle always offers the opposite theme

## [1.2.0] — 2026-03-18

### Added

- **Angular Router with lazy loading**: Two-page navigation using `withHashLocation()` — `/#/` for calculator, `/#/sessions` for baking sessions. Routes are lazy-loaded for smaller initial bundle
- **Bottom tab bar (mobile)**: Fixed bottom navigation with Calculator and Sessions tabs, visible below 600px
- **Topbar tabs (desktop)**: Inline navigation tabs in the topbar header, visible at 600px and above
- **EditorConfig**: Consistent editor settings — 4 spaces, LF line endings, UTF-8, trim trailing whitespace
- **Prettier**: Code formatter with single quotes, 4-space indent, 100-char print width, Angular HTML parser
- **ESLint**: Flat config with `typescript-eslint` strict + stylistic rules and `angular-eslint` recommended + accessibility rules
- **SaveBakeComponent**: Dedicated save-bake form (notes, rating, photos) shown in the calculator after results — with "View sessions →" link after saving
- **Auth guard**: Functional `canActivate` guard on the sessions route — redirects to calculator when not logged in
- **Starter-aware instructions**: When starter weight > 0, both manual and machine instructions now explicitly tell the user to disperse/dissolve the starter into the liquid, with yeast-type-specific handling (fresh yeast dissolves with starter; active dry is hydrated separately; instant and Swedish dry are mixed into flour)
- **Dark mode**: Automatic dark theme via `prefers-color-scheme: dark`, with manual override via `data-theme` attribute. All hardcoded colors replaced with semantic CSS custom properties (`--error-bg`, `--info-bg`, `--success-bg`, `--warning-bg`, etc.)
- **Auto-hide topbar**: Header hides after scrolling 100px down, reappears after scrolling 100px up — smooth CSS transition
- **Brand title in topbar**: App title always visible in the header — centered on mobile, left-anchored on desktop
- **Compare empty state**: Shows a friendlier message when only 1 bake exists ("Save at least two bakes to compare them." / "Spara minst två bakningar för att kunna jämföra.") instead of the generic "no bakes yet"

### Changed

- **Calculator extracted to own component**: All calculator logic, template, and styles moved from the root `AppComponent` into a dedicated `CalculatorComponent` at `src/app/calculator/`
- **Sessions extracted to own component**: Baking sessions and recipe comparison moved into a dedicated `SessionsComponent` at `src/app/sessions/`
- **BakingSessionComponent split**: Save form extracted to `SaveBakeComponent` (used on calculator page); `BakingSessionComponent` is now a session browser only (grid, detail, lightbox) used on the sessions page
- **App shell refactored**: Root component is now a lean navigation shell with `<router-outlet>`, topbar, bottom nav, auth, and scroll-to-top — no calculator logic
- **Last-write-wins sync**: Recipes and flour blends now compare `updatedAt` timestamps during sync — the newest version wins, whether it's local or on the server
- **Offline delete queue**: Deleting a cloud recipe or flour blend while offline queues a `PendingDelete` in localStorage, replayed automatically on next sync
- **Sync-on-login effect**: Sync triggers automatically via `effect()` when `isLoggedIn()` becomes true (login or page reload with valid JWT)
- **Upload prompt dialog**: First login with existing local recipes shows a confirm dialog asking whether to upload them to the cloud or keep them local-only
- **Per-recipe cloud upload button**: ☁ button next to each local recipe lets you manually push it to the server
- **Flour blend CRUD parity**: `saveAsNewPreset` calls POST, `updatePreset` calls PUT, `deletePreset` calls DELETE when logged in — full API parity with recipes
- **ConfirmDialogComponent**: Reusable confirm dialog with title, message, confirm/cancel buttons, and backdrop-click-to-dismiss
- **Sync re-entry guard**: Prevents concurrent sync calls from causing duplicate uploads or race conditions
- **Clean logout**: Removes all `cloud-*` recipes and presets, clears pending deletes, resets to local-only state
- `skipUpload` flag on `Recipe` to let users decline uploading specific local recipes
- `selectedPresetId` persisted to `breadCalcSelectedPreset` localStorage key
- `uploadToCloud`, `uploadLocalRecipesTitle`, `uploadLocalRecipesBody`, `uploadButton`, `keepLocalButton` i18n keys (EN + SV)
- 43 new tests: comprehensive recipe sync, flour blend CRUD/sync, confirm dialog component (250 total)

### Changed

- **Navigation hidden when logged out**: Bottom tab bar and desktop sessions tab are only shown when logged in — minimalistic single-page experience for non-authenticated users
- **Terminology: sessions → bakes/bakningar**: All user-facing UI text replaced — "Sessions" → "Bakes"/"Bakningar", "Baking sessions" → "My bakes"/"Mina bakningar", "Delete session" → "Delete bake"/"Ta bort bakning", etc. Internal identifiers kept for stability
- **Session browser redesign**: Replaced flat session list with a 2-column photo grid (3-col on desktop) for scalable browsing
- **Bottom sheet detail**: Session detail now slides up from the bottom on mobile (centered overlay on desktop) with photo gallery, full notes, and actions
- **Photo lightbox**: Tap any photo in a session to open a full-screen lightbox with swipe navigation and dot indicators
- **Photo upload during creation**: Add up to 3 photos while saving a new baking session via a 📷 button with live previews
- **Baking sessions always visible**: Session list now shows as soon as you're logged in, not only after calculating results
- **Delete from session list via confirm dialog**: Replaced `window.confirm` with ConfirmDialogComponent everywhere
- **Photo upload/delete in detail overlay**: Upload button now shows 📷 icon; photo delete no longer requires confirmation prompt
- `addPhotos`, `pendingPhotos` i18n keys (EN + SV)
- 6 new baking-session component tests (256 total)

## [1.1.0] — 2026-03-16

### Changed

- **Time allocation fix**: Final proof no longer absorbs all remaining time for long schedules. Bulk and final proof are now split proportionally (65/35) with bulk capped at 6h and final proof capped at 3h, preventing absurd values like 17h 50m final proof for 24h doughs
- **Consistent weight formatting**: All ingredients use whole grams; yeast under 10 g gets 1 decimal. Shared `formatWeight()` helper used everywhere (summary, ingredients, instructions, copy text)
- **Conditional ingredient rendering**: Zero-value ingredients (starter, milk, sugar, oil) are hidden from the ingredients list, instruction body text, and copied output instead of showing "0 g"
- **Prefermented flour stat**: Hidden when starter weight is 0 instead of showing "0%"
- **Starter support text**: Hidden when starter is 0
- **Autolyse → Rest**: Step renamed from "Autolyse" to "Rest" / "Vila" since yeast is always added before the rest step
- **Instruction body templates**: Refactored from positional parameters to pre-built ingredient list strings, enabling conditional ingredient inclusion
- **Swedish improvements**: More natural phrasing in manual instructions — "arbeta degen med sträck-och-vik" instead of "använd sträck-och-vik", shorter rest step text
- **Machine step 1 restructure**: Initial mix now separates liquids from flour ("Add liquids to bowl. Add flour and mix on…") instead of a flat ingredient list
- **Machine speed phrases**: All machine steps show the generic speed label with the user's mixer value in parentheses, e.g. "low speed (your mixer: 1)" / "låg hastighet (din maskin: 1)", fixing label-value mismatches
- **Machine development cues**: Describes machine-specific indicators ("pulling away from the bowl sides") instead of reusing hand-kneading phrases
- **Swedish mixer speed fix**: "Låg-medelhastighet" → "Låg till medelhastighet" for more natural phrasing
- **Swedish bake step**: Clearer phrasing — "Börja på hög temperatur och sänk vid behov" instead of "Starta varmt, sänk sedan om det behövs"
- **Swedish divide step**: Shorter — "Dela i X bitar om ca Y g" instead of "Faktisk degvikt per bit är ca Y g"
- **Swedish develop machine**: "i ungefär X min" instead of "i ca X min" for consistent tone
- **English text polish**: "becoming smooth" instead of "looking smooth", added article "The dough should feel", shorter divide ("X pieces, about Y g each"), "Start at high heat" instead of "Start hot", "Bake for about X" for natural rhythm
- **English manual polish**: "evenly dispersed" instead of "dissolved" for yeast, "develop on its own" instead of "form on its own" for gluten, "stretch-and-folds" (plural) for natural English

### Added

- **Ball weight guide**: Hint below dough weight input with recommended weights — Rolls 80–100 g, Baguette 350–400 g, Sandwich loaf 500–900 g, Sourdough boule 700–1000 g, Pizza 200–280 g
- **Starter hints**: "Typical: 50–200 g (10–30% of flour)" below starter weight, "Typical: 80–125%" below starter hydration
- `formatWeight(value, isYeast)` helper on `CalcService`
- `water` and `flour` i18n keys for instruction body text building
- `BULK_RATIO`, `FINAL_PROOF_MAX` constants in config
- `yourMixer` i18n key ("your mixer" / "din maskin") for speed phrase construction
- 7 new tests (formatWeight, 24h proof cap) — 204 total

## [1.0.0] — 2026-03-16

### Added

- Multi-bread scaling — set bread count and target ball weight
- Sourdough starter integration — flour and water inside starter accounted for at any hydration
- Smart yeast estimation — time + temperature + starter amount and hydration
- Water temperature guidance based on room temperature
- Step-by-step baking instructions with fold timings
- Built-in timers per step with pause/resume/reset
- Step completion checkboxes — check off steps manually or via timer auto-complete
- Timer alarm sound: 5 beeps at 880 Hz (Web Audio API square wave)
- Browser notification on timer completion (`Notification` API)
- Duration format `Xh Ym` for times ≥ 60 min, rounded to nearest 5 minutes
- LiteSpeed `.htaccess` caching headers for immutable JS/CSS assets
- `--base-href /bread-calc/` in production build script
- Info tooltips on every section: hover or tap ⓘ for context (sticky-click on mobile)
- Advanced settings panel (collapsible) with adjustable hydration, salt, sugar, oil, milk
- `config.ts` extracted: `DEFAULT_INPUTS`, `YEAST_LABELS`, `TIMER_CONSTANTS`, `BULK_CLAMP`, `SHAPE_CLAMP`
- Direct text input in stepper controls (tap to type)
- Welcome splash screen with feature highlights, language selector, and first-visit detection via `localStorage`
- Bread emoji SVG favicon (inline data URI)
- Auto-detect browser language on first visit (`navigator.language`)
- Full English / Swedish i18n with flag toggle button in top bar and splash screen
- Document title translation via `I18nService`
- Flour blend feature: build a custom blend from 9 flour types, each with a hydration bias
- Flour blend hydration adjustment: effective hydration = base + flour adjustment + custom adjustment
- Two built-in flour blend presets: _Fluffy rolls_ and _Rustic everyday_
- User preset CRUD: save, update, delete, and reload personal flour blends from `localStorage`
- Per-flour breakdown in the ingredients table when a blend is active
- Absorption note in step-by-step instructions when flour blend adjustment exceeds +1.5%
- Reset to defaults button next to the Calculate button
- Field hints below each advanced percentage stepper showing typical baker's ranges, in both EN and SV
- Colour-coded field validation: amber for outside recommended range, red for extreme values
- `FIELD_RANGES` config in `config.ts` with recommended, warn, and error thresholds for all percentage fields
- Recipe system: save, load, update, and delete custom recipes via localStorage
- Two built-in recipe presets: Neapolitan Pizza and Everyday Bread
- Recipe selector dropdown in UI with save dialog, update, and delete buttons for user recipes
- PHP 8.5 + MySQL backend under `/bread-calc/api/` with vanilla router, PDO, and prepared statements
- Google OAuth login via Google Identity Services (GSI) — exchange ID token for JWT (HMAC-SHA256, 30-day expiry)
- Cloud sync for recipes and flour blend presets when logged in (local-first: app works fully without login)
- Baking session history: save current recipe + calculated results as a snapshot, with notes, 1–5 star rating, and up to 3 photos per session
- Client-side photo compression (Canvas API resize + WebP conversion, max 2 MB)
- Session-based comparison: side-by-side table of two baking sessions with calculated differences highlighted in green/red
- Comparison includes hydration, salt, sugar, oil, yeast, milk amounts and more
- `AuthService` (signal-based JWT + user state), `ApiService` (fetch wrapper with auth headers), `BakingSessionService`
- Login UI in topbar: Google Sign-In button when logged out, avatar + profile menu when logged in
- Dual mixing method: choose between "By hand" (manual) and "Stand mixer" (machine) modes
- Manual mode: 5 granular mixing steps (mix liquids, add flour, autolyse, add salt & extras, develop by hand)
- Machine mode: 4 granular mixing steps (initial mix on low, autolyse, incorporate salt on low, develop on medium)
- Configurable mixer speed labels (low, low-medium, medium) for stand mixer mode
- FTP deployment script (`scripts/deploy.mjs`) using `basic-ftp` with `--dry-run`, `--api-only`, `--frontend-only` flags
- SQL migration system: 5 migration files + `scripts/db-migrate.mjs` with `_migrations` tracking table
- Split credentials into `.credentials.env`, `.credentials.local.env`, and `.ftp.env`
- npm scripts: `deploy`, `deploy:frontend`, `deploy:api`, `db:migrate`, `db:status`, `test:scripts`
- Vitest test suite: 194 tests covering CalcService, AuthService, ApiService, BakingSessionService, RecipeService, FlourBlendService, and components
