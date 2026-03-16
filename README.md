<div align="center">

# 🍞 Bread Dough Calculator

### _From flour to oven — calculated._

<br>

🥖 &nbsp; **Dough** &nbsp;&nbsp;→&nbsp;&nbsp; ⚙️ &nbsp; **Yeast** &nbsp;&nbsp;→&nbsp;&nbsp; 🔧 &nbsp; **Mix** &nbsp;&nbsp;→&nbsp;&nbsp; ⏳ &nbsp; **Proof** &nbsp;&nbsp;→&nbsp;&nbsp; 🔥 &nbsp; **Bake**

<br>

A mobile-first sourdough calculator that figures out flour, water, yeast, salt and timing — then walks you through every step with built-in timers.

**[🔗 Live demo → jonwallsten.com/bread-calc](https://jonwallsten.com/bread-calc/)**

Built with **Angular 21+** · Standalone components · Signals · PHP API · MySQL

</div>

---

## ✨ Features

|      | Feature                           | Details                                                                                                      |
| ---- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 🍩   | **Multi-bread scaling**           | Set the number of breads and target ball weight — everything scales automatically                            |
| ⚙️   | **Smart yeast estimation**        | Calculates fresh, active dry, or instant yeast from time, temperature, starter amount, and starter hydration |
| 🔧   | **Full baker's percentages**      | Adjustable hydration, salt, sugar, oil, and milk as % of water                                               |
| 🌱   | **Sourdough starter integration** | Accounts for the flour and water inside your starter at any hydration level                                  |
| 📋   | **Step-by-step instructions**     | 8 detailed steps from mixing to baking, with fold timings calculated automatically                           |
| ⏱️   | **Built-in timers**               | Start/pause/reset timer per step — alarm sound when done, auto-marks step complete                           |
| ✅   | **Step completion tracking**      | Check off steps manually or let the timer do it — visual progress through the bake                           |
| 🌡️   | **Water temperature guidance**    | Suggests water temp range based on room temperature                                                          |
| 🇸🇪🇬🇧 | **English & Swedish**             | Full i18n with auto-detection from browser language, toggle anytime                                          |
| 🎉   | **Welcome splash screen**         | First-visit feature overview with language selector                                                          |
| 💾   | **Persistent inputs**             | All settings saved to localStorage — pick up where you left off                                              |
| 📱   | **Mobile-first design**           | Clean, responsive UI built for phones, works everywhere                                                      |
| ℹ️   | **Info tooltips**                 | Hover or tap the ⓘ buttons for context on every section                                                      |
| 🔔   | **Alarm & notifications**         | Web Audio API beeps + browser notification on timer completion                                               |
| 🌾   | **Flour blend & presets**         | Build custom flour blends from 9 flour types, auto-adjust hydration, save/load personal presets              |
| 🔐   | **Google login & cloud sync**     | Sign in with Google to sync recipes and flour blends across devices — works fully offline without login      |
| ☁️   | **Upload prompt & cloud button**  | First login prompts to upload local recipes; per-recipe ☁ button for manual cloud upload                     |
| 📸   | **Baking sessions**               | Save bakes as snapshots with notes, 1–5 star rating, and up to 3 photos — trace back every bake              |
| 🔍   | **Recipe comparison**             | Side-by-side table of two recipes with all calculated differences highlighted                                |

---

## 🧮 How the calculations work

### Dough composition

All percentages follow **baker's math** — expressed as a percentage of total flour (including flour inside the starter):

$$\text{Total flour} = \text{flour to add} + \text{starter flour}$$

$$\text{Starter flour} = \frac{\text{starter weight}}{1 + \text{starter hydration}}$$

$$\text{Total water} = \text{total flour} \times \text{hydration\%}$$

The calculator solves for **flour to add** so the final dough weight hits your target:

$$\text{flour to add} = \frac{\text{target dough weight} - \text{starter impact}}{1 + \text{hydration} + \text{salt} + \text{sugar} + \text{oil} + \text{yeast\%}}$$

### Yeast estimation

Yeast percentage starts from a **time-based baseline** (fresh yeast % of total flour):

| Hours to oven | Baseline % |
| :-----------: | :--------: |
|      ≤ 3      |    2.80    |
|      ≤ 4      |    2.00    |
|      ≤ 5      |    1.50    |
|      ≤ 6      |    1.10    |
|      ≤ 7      |    0.85    |
|      ≤ 8      |    0.65    |
|      ≤ 9      |    0.50    |
|     ≤ 10      |    0.40    |
|     ≤ 12      |    0.30    |
|     > 12      |    0.20    |

Then adjusted for conditions:

$$\text{adjusted} = \text{baseline} \times 0.9^{(\text{room temp} - 22)}$$

$$\text{reduction} = \min\!\Big(0.48,\;\text{starter ratio} \times 1.15 \times \text{hydration factor}\Big)$$

$$\text{final fresh \%} = \text{adjusted} \times (1 - \text{reduction})$$

Conversion to other yeast types:

|       Type       | Conversion |
| :--------------: | :--------: |
|   Fresh yeast    |     1×     |
| Active dry yeast |   ÷ 2.5    |
|  Instant yeast   |   ÷ 3.0    |

### Time scheduling

Total time is split across 8 steps:

| Step                  | Duration                               |
| --------------------- | -------------------------------------- |
| 1. Mix                | 35 min (fixed)                         |
| 2. Bulk fermentation  | 42% of total time, clamped 2h 15m – 4h |
| 3. Divide & pre-shape | ~1.2 min per loaf, clamped 22–48 min   |
| 4. Bench rest         | 15 min (fixed)                         |
| 5. Final shape        | 10 min (fixed)                         |
| 6. Final proof        | Remaining time, min 50 min             |
| 7. Preheat oven       | 45 min (fixed)                         |
| 8. Bake               | 15 min (fixed)                         |

Fold timings during bulk fermentation are placed at **33%** and **66%** of bulk time.

All displayed durations are **rounded to the nearest 5 minutes** and shown in `Xh Ym` format when ≥ 60 minutes.

### Pre-fermented flour

$$\text{Pre-fermented flour \%} = \frac{\text{starter flour}}{\text{total flour}} \times 100$$

A key metric for sourdough bakers — typically 10–30%. Higher values mean more flavor development and faster fermentation.

### Water temperature

Suggested based on room temperature to target a final dough temperature around 24–26°C:

| Room temp | Water temp |
| :-------: | :--------: |
|  ≥ 27°C   |  12–14°C   |
|  ≥ 24°C   |  14–16°C   |
|  ≥ 21°C   |  16–18°C   |
|  ≥ 18°C   |  18–20°C   |
|  < 18°C   |  20–22°C   |

### Flour blend & hydration adjustment

The flour blend feature lets you define a custom mix of flour types. Each flour has a **hydration bias** — a percentage offset reflecting how much more (or less) water it absorbs compared to a neutral baseline:

| Flour               | Hydration bias |
| ------------------- | :------------: |
| Caputo Nuvola Super |     +2.5%      |
| Manitoba Cream      |     +1.5%      |
| Rustique            |     +2.0%      |
| Strong bread flour  |     +0.5%      |
| Tipo 00             |       0%       |
| Sifted spelt        |     −1.0%      |
| Whole spelt         |     +1.5%      |
| Sifted rye          |     +2.0%      |
| Rye flour           |     +3.0%      |

The flour blend adjustment is a **weighted sum**:

$$\text{flour adjustment} = \frac{\sum (\text{share\%} \times \text{hydration bias})}{100}$$

An optional **custom adjustment** lets you fine-tune on top:

$$\text{effective hydration} = \text{base hydration} + \text{flour adjustment} + \text{custom adjustment}$$

The effective hydration is used for all water/milk calculations. When the flour adjustment exceeds +1.5%, a note appears in the instructions warning that the dough may feel firm early and relax after resting.

Blends can be saved as **personal presets** (stored in localStorage) for quick reuse. Two built-in presets are included: _Fluffy rolls_ and _Rustic everyday_.

### Cloud sync strategy

Both recipes and flour blends use the same sync flow, triggered automatically when you log in or reload while authenticated:

1. **Replay pending deletes** — items deleted offline are sent to the server first
2. **Fetch cloud list** — GET all recipes / flour blends from the API
3. **Last-write-wins merge** — for items that exist both locally and on the server, the `updatedAt` timestamp decides which version wins. The loser is overwritten (local update or PUT to server)
4. **Cloud-only items** → added locally with a `cloud-{id}` ID
5. **Local-only items** → uploaded via POST (if the user approves), then converted to `cloud-{id}`
6. **Server-deleted items** → removed locally

On **first login with existing local recipes**, an upload prompt asks whether to push them to the cloud or keep them local-only. A per-recipe ☁ button also lets you manually upload individual recipes at any time.

On **logout**, all cloud-prefixed items are removed from localStorage, pending deletes are cleared, and only local recipes/presets remain.

Offline edits are fully supported — deletes queue in localStorage as `breadCalcPendingDeletes` and replay on next sync.

---

## 🛠️ Tech stack

|                 |                                                               |
| --------------- | ------------------------------------------------------------- |
| **Framework**   | Angular 21 (standalone components, signals, computed, effect) |
| **Styling**     | Plain CSS with custom properties, mobile-first                |
| **State**       | Angular signals — no RxJS, no NgRx                            |
| **Persistence** | localStorage (offline) + MySQL cloud sync (when logged in)    |
| **Backend**     | PHP 8.5, vanilla router, PDO + prepared statements            |
| **Auth**        | Google Identity Services (GSI) + JWT (HMAC-SHA256)            |
| **Audio**       | Web Audio API (square wave alarm, 880 Hz, 5 beeps)            |
| **i18n**        | Custom signal-based service, no `@angular/localize`           |
| **Build**       | Angular CLI, output ~53 kB gzipped                            |

---

## 🚀 Getting started

```bash
# Install dependencies
npm install

# Start Angular dev server (http://localhost:4200)
npm start

# Start PHP API dev server (http://localhost:8080, proxied via Angular)
npm run start:api

# Production build (outputs to dist/bread-calc/)
npm run build
```

Both servers are needed for the full stack locally. The Angular dev server proxies `/api/*` → `localhost:8080` via `proxy.conf.json`.

### Defaults

| Setting           | Default |
| ----------------- | ------- |
| Breads            | 6       |
| Ball weight       | 90 g    |
| Hydration         | 66%     |
| Salt              | 2.0%    |
| Sugar             | 2.0%    |
| Oil               | 2.0%    |
| Starter weight    | 380 g   |
| Starter hydration | 100%    |
| Time until oven   | 8 h     |
| Room temperature  | 22°C    |

---

## 🔧 Backend setup

### 1. Credential files

Three separate credential files keep secrets organised:

| File                     | Contents                                                          | Committed? | Deployed to server? |
| ------------------------ | ----------------------------------------------------------------- | :--------: | :-----------------: |
| `.credentials.env`       | DB host/name/user/pass, Google OAuth client ID/secret, JWT secret |     No     |         Yes         |
| `.credentials.local.env` | Local overrides (e.g. different DB host for dev)                  |     No     |         No          |
| `.ftp.env`               | FTP host/user/pass/path for Oderland deployment                   |     No     |         No          |

Copy the examples and fill in your values:

```bash
cp .credentials.env.example .credentials.env
cp .credentials.local.env.example .credentials.local.env  # optional local overrides
cp .ftp.env.example .ftp.env
```

Node.js scripts load `.credentials.env` then **overlay** `.credentials.local.env` on top if it exists. PHP `api/config.php` does the same.

### 2. Database migrations

```bash
# Apply all pending migrations to local DB (uses .credentials.local.env overlay)
npm run db:migrate

# Show applied / pending status
npm run db:status

# Apply against remote DB only (skips local overlay)
npm run db:migrate -- --remote
```

### 3. Google OAuth

1. Create a project at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add an OAuth 2.0 client ID (Web application)
3. Add **Authorized JavaScript origins**: `http://localhost:4200`, `https://yourdomain.com`
4. Copy the client ID and secret into `.credentials.env`

---

## 📦 Deployment

All deployment targets use [basic-ftp](https://www.npmjs.com/package/basic-ftp) over FTPS. Credentials are read from `.ftp.env`.

```bash
# Full deploy: build Angular + upload frontend + upload API
npm run deploy

# Frontend only (skips build of API files)
npm run deploy:frontend

# API only (no Angular build)
npm run deploy:api

# Upload .credentials.env to server (one-time or when secrets change)
npm run deploy:credentials
```

`deploy:credentials` is intentionally separate — it uploads the app secrets once, and the regular `deploy` never touches them on the server.

### Deploy flags

```bash
node scripts/deploy.mjs --dry-run        # list files without transferring
node scripts/deploy.mjs --api-only       # API files only
node scripts/deploy.mjs --frontend-only  # built frontend only
node scripts/deploy.mjs --credentials-only  # .credentials.env only
```

---

## 🧪 Testing

```bash
# Angular unit tests (Vitest via @angular/build)
npm test

# Node.js script unit tests (credential parsing, deploy flags, migration file discovery)
npm run test:scripts

# API integration tests (requires npm run start:api to be running)
npm run test:api

# Run against the live server instead of localhost
API_BASE_URL=https://yourdomain.com/bread-calc/api npm run test:api
```

The API tests create a temporary test user in the DB, exercise all CRUD endpoints, and clean up after themselves.

---

## 📄 License

MIT
