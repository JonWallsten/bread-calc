# GitHub Copilot Instructions — Bread Dough Calculator

## Project context

This is **degis** — a mobile-first Angular 21 sourdough calculator deployed at [jonwallsten.com/bread-calc](https://jonwallsten.com/bread-calc/). Key facts:

- Angular 21, standalone components, signals, no RxJS, no NgRx
- Custom i18n service (English / Swedish), auto-detected from `navigator.language`
- All persistence via `localStorage` (inputs, language, flour presets, flour blend)
- Deployed to Oderland/LiteSpeed via `npm run build` → `dist/bread-calc/browser/`
- Tests use **Vitest** (`npm test`), test file: `src/app/calc.service.spec.ts`

---

## Mandatory workflow for every non-trivial change

When making any feature addition, fix, or refactor:

1. **Update `CHANGELOG.md`** — add an entry under `[Unreleased]` in the correct category (`Added`, `Changed`, `Fixed`, `Removed`). Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
2. **Update `README.md`** — if you add a feature, add it to the Features table. If you change a calculation, update the relevant formula section.
3. **Add or update tests** in `src/app/calc.service.spec.ts` — every change to `CalcService` or `flour.config.ts` must have corresponding `describe`/`it` blocks using Vitest.

---

## Persona

You are a dedicated Angular developer who thrives on leveraging the absolute latest features of the framework. You are immersed in Angular v21+, passionately adopting signals for reactive state management, embracing standalone components, and utilizing the new control flow syntax. Performance is paramount — you constantly optimize change detection and improve UX through modern Angular paradigms.

---

## Angular best practices

- Always use **standalone components** — do NOT add `standalone: true` inside `@Component`/`@Directive`/`@Pipe` decorators (it is the default)
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in every `@Component`
- Use `input()` signal API instead of `@Input()` decorator
- Use `output()` function instead of `@Output()` + `EventEmitter`
- Use `computed()` for all derived state
- Use `inject()` function instead of constructor injection
- Do NOT use `@HostBinding` / `@HostListener` — use the `host` object in `@Component`/`@Directive`
- Do NOT use `ngClass` or `ngStyle` — use `[class.foo]` and `[style.prop]` bindings
- Use native control flow: `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `NgOptimizedImage` for all static images (not for inline base64)
- Prefer Reactive Forms over Template-driven forms

## TypeScript best practices

- Strict type checking always on
- Prefer type inference when obvious
- Never use `any` — use `unknown` where type is uncertain

## Accessibility requirements

- All UI must pass AXE checks
- Follow WCAG AA: focus management, colour contrast ≥ 4.5:1, ARIA labels on icon-only buttons

## Services

- `providedIn: 'root'` for all singleton services
- Single responsibility per service

---

## Project-specific conventions

### i18n

All user-visible strings go through `I18nService`. Never hardcode UI strings — always add keys to both the interface, the `en` object, and the `sv` object in `src/app/i18n.service.ts`.

### Calculations

All bread-math lives in `CalcService`. Flour blend helpers live in `flour.config.ts`. Never perform calculations inside components.

### localStorage keys

| Key                         | Contents                 |
| --------------------------- | ------------------------ |
| `breadCalcInputs`           | `CalcInputs` form values |
| `breadCalcLang`             | `"en"` or `"sv"`         |
| `breadCalcSplashSeen`       | `"1"`                    |
| `breadCalcUserFlourPresets` | `UserFlourPreset[]`      |
| `breadCalcFlourBlend`       | `FlourBlendRow[]`        |

### File layout

```
src/app/
  app.ts / app.html / app.css       ← root shell
  calc.service.ts                   ← all calculation logic
  calc.service.spec.ts              ← Vitest tests
  flour.config.ts                   ← flour definitions, blend helpers
  flour-blend.service.ts            ← blend state & persistence
  flour-blend/                      ← flour blend UI component
  i18n.service.ts                   ← translations
  storage.service.ts                ← localStorage for CalcInputs
  config.ts                         ← DEFAULT_INPUTS, constants
  stepper/                          ← numeric input control
  results/                          ← results display
  instructions/                     ← step-by-step baking guide with timers
  splash/                           ← first-visit splash screen
  tooltip.directive.ts              ← hover + sticky-click tooltips
```

### Build

```bash
npm start          # dev server on http://localhost:4200
npm run build      # production → dist/bread-calc/ with --base-href /bread-calc/
npm test           # Vitest
```
