<div align="center">

# 🍞 Bread Dough Calculator

### _From flour to oven — calculated._

<br>

🥖 &nbsp; **Dough** &nbsp;&nbsp;→&nbsp;&nbsp; ⚙️ &nbsp; **Yeast** &nbsp;&nbsp;→&nbsp;&nbsp; 🔧 &nbsp; **Mix** &nbsp;&nbsp;→&nbsp;&nbsp; ⏳ &nbsp; **Proof** &nbsp;&nbsp;→&nbsp;&nbsp; 🔥 &nbsp; **Bake**

<br>

A mobile-first sourdough calculator that figures out flour, water, yeast, salt and timing — then walks you through every step with built-in timers.

**[🔗 Live demo → jonwallsten.com/bread-calc](https://jonwallsten.com/bread-calc/)**

Built with **Angular 19+** · Standalone components · Signals · Zero backend

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

---

## 🛠️ Tech stack

|                 |                                                               |
| --------------- | ------------------------------------------------------------- |
| **Framework**   | Angular 21 (standalone components, signals, computed, effect) |
| **Styling**     | Plain CSS with custom properties, mobile-first                |
| **State**       | Angular signals — no RxJS, no NgRx                            |
| **Persistence** | localStorage for inputs and language preference               |
| **Audio**       | Web Audio API (square wave alarm, 880 Hz, 5 beeps)            |
| **i18n**        | Custom signal-based service, no `@angular/localize`           |
| **Build**       | Angular CLI, output ~53 kB gzipped                            |

---

## 🚀 Getting started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Production build (outputs to dist/bread-calc/)
npm run build
```

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

## 📄 License

MIT
