# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
