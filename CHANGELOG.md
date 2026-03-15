# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Split credentials into three files: `.credentials.env` (app), `.credentials.local.env` (local overrides), `.ftp.env` (FTP only)
- Local credential overlay: `.credentials.local.env` values override `.credentials.env` for local dev (both Node.js scripts and PHP)
- `--remote` flag on `db-migrate` to skip local overlay and use production credentials
- `loadAppCredentials()` and `loadFtpCredentials()` helpers in credential parser
- Field hints below each advanced percentage stepper (hydration, salt, sugar, oil, milk) showing typical baker's ranges, in both EN and SV\n- Colour-coded field validation: amber for outside recommended range, red for extreme values\n- `FIELD_RANGES` config in `config.ts` with recommended, warn, and error thresholds for all percentage fields
- Recipe system: save, load, update, and delete custom recipes via localStorage
- Two built-in recipe presets: Neapolitan Pizza (270 g, 65% hydration, 24 h proof, no sugar/oil) and Everyday Bread (90 g, 66% hydration, sugar & oil)
- Recipe selector dropdown in UI with save dialog, update, and delete buttons for user recipes
- PHP 8.5 + MySQL backend under `/bread-calc/api/` with vanilla router, PDO, and prepared statements
- Google OAuth login via Google Identity Services (GSI) — exchange ID token for JWT (HMAC-SHA256, 30-day expiry)
- Cloud sync for recipes and flour blend presets when logged in (local-first: app works fully without login)
- Baking session history: save current recipe + calculated results as a snapshot, with notes, 1–5 star rating, and up to 3 photos per session
- Client-side photo compression (Canvas API resize + WebP conversion, max 2 MB)
- Recipe comparison: side-by-side table of two recipes with calculated differences highlighted in green/red
- `AuthService` (signal-based JWT + user state), `ApiService` (fetch wrapper with auth headers), `BakingSessionService`
- Login UI in topbar: Google Sign-In button when logged out, avatar + profile menu when logged in
- FTP deployment script (`scripts/deploy.mjs`) using `basic-ftp` with `--dry-run`, `--api-only`, `--frontend-only` flags
- SQL migration system: 5 migration files + `scripts/db-migrate.mjs` with `_migrations` tracking table using `mysql2`
- Shared credential loader (`scripts/lib/credentials.mjs`) for parsing `.credentials.env` files
- npm scripts: `deploy`, `deploy:frontend`, `deploy:api`, `db:migrate`, `db:status`, `test:scripts`
- i18n keys for auth, baking sessions, and compare features in both EN and SV
- Tests for all new Angular services (AuthService, ApiService, BakingSessionService, RecipeService, FlourBlendService)
- Tests for BakingSessionComponent and CompareComponent
- Tests for Node.js deploy/migrate scripts (credential parsing, flag parsing, migration file discovery)

## [0.11.0] — 2026-03-15

### Added

- Flour blend feature: build a custom blend from 9 flour types, each with a hydration bias
- Flour blend hydration adjustment: effective hydration = base + flour adjustment + custom adjustment
- Two built-in presets: _Fluffy rolls_ and _Rustic everyday_
- User preset CRUD: save, update, delete, and reload personal flour blends from `localStorage`
- Per-flour breakdown in the ingredients table when a blend is active (e.g. ↳ Caputo Nuvola Super 680 g)
- Absorption note in step-by-step instructions when flour blend adjustment exceeds +1.5%
- Reset to defaults button next to the Calculate button

### Fixed

- Yeast type label (Fresh yeast / Active dry yeast / Instant yeast) now translates to Swedish
- Flour dropdown in blend rows now selects the correct flour type after a page reload

## [0.10.0] — 2026-03-01

### Added

- Welcome splash screen with feature highlights, language selector, and first-visit detection via `localStorage`
- Bread emoji SVG favicon (inline data URI)
- Auto-detect browser language on first visit (`navigator.language`)
- Full English / Swedish i18n with flag toggle button in top bar and splash screen
- Document title translation via `I18nService`

### Changed

- Label "Starter flour share" renamed to "Pre-fermented flour" / "Förjäst mjöl"

## [0.9.0] — 2026-02-15

### Added

- Info tooltips on every section: hover or tap ⓘ for context (sticky-click on mobile)
- Advanced settings panel (collapsible) with adjustable hydration, salt, sugar, oil, milk
- `config.ts` extracted: `DEFAULT_INPUTS`, `YEAST_LABELS`, `TIMER_CONSTANTS`, `BULK_CLAMP`, `SHAPE_CLAMP`
- Direct text input in stepper controls (tap to type)

### Fixed

- Swedish translations audited: `milkPart`, `yeastPart`, `oilPart`, and all aria-labels now translated

## [0.8.0] — 2026-02-01

### Added

- Step completion checkboxes — check off steps manually or via timer auto-complete
- Timer alarm sound: 5 beeps at 880 Hz (Web Audio API square wave)
- Browser notification on timer completion (`Notification` API)
- Duration format `Xh Ym` for times ≥ 60 min, rounded to nearest 5 minutes

### Fixed

- Fresh yeast quantity now shows one decimal place (was `Math.round`)

## [0.7.0] — 2026-01-15

### Added

- LiteSpeed `.htaccess` caching headers for immutable JS/CSS assets
- `--base-href /bread-calc/` in production build script; `<base href="/">` kept for local dev

## [0.6.0] — 2026-01-01

### Added

- Multi-bread scaling — set bread count and target ball weight
- Sourdough starter integration — flour and water inside starter accounted for at any hydration
- Smart yeast estimation — time + temperature + starter amount and hydration
- Water temperature guidance based on room temperature
- Step-by-step baking instructions with fold timings
- Built-in timers per step with pause/resume/reset
