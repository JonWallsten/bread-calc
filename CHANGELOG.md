# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

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
