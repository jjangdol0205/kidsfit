# Project: KidsFit English Global Upgrade (`kisfitglobal.com`)

## Architecture
- **Client Frontend**: Single-page application (`index.html`) with modular vanilla JS engines (`src/js/`), dark/light theme switcher, multi-step onboarding wizard (`onboarding-wizard.js`), auxology calculation engine (`growth-engine.js`), neuro-cognitive matrix (`neuro-cognitive-matrix.js`), and paywall gate (`global-paywall-edition.js`).
- **Unit System & Internationalization**: `src/js/i18n.js` providing `TallerI18n` with unit system (`imperial` vs `metric`) and language (`en`). Live bidirectional synchronization between imperial inputs (`ft/in`, `lbs`) and metric primary inputs (`cm`, `kg`).
- **Clinical Report & Paywall**: `buildNativeEnglishClinicalReportHTML` rendering 7-chapter pediatric growth report. Hard-paywall gate wired to Lemon Squeezy Store #296100 ($8.99 single pass / $19.99 6-month tracker pass).
- **Global Knowledge & SEO**: 28 peer-reviewed English Q&A articles in `qna/` and `dist/qna/`, AI-crawler manifests (`llms.txt`, `llms-full.txt`), JSON Feed (`feed.json`), RSS feed (`rss.xml`), and XML sitemap (`sitemap.xml`) targeting `https://kisfitglobal.com`.
- **Marketing & Content**: Global GTM masterplan (`docs/global_marketing/`) and ready-to-publish content packs (`global_marketing_packs/`) with 6-slide 1080x1350 card-news visuals.
- **Bridge & Verification**: Telegram bridge `@kidsfittbot` (`scripts/telegram-notify.js`, `scripts/telegram-antigravity-bridge.js`), automated test suites (`tests/run-all.js`), acceptance verifier (`scripts/verify-acceptance.js`), and build pipeline (`scripts/build.js`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Step 1 Validation Fix | Decouple Step 1 validation so `validateStep(1)` tests only DOB and Gender, removing false biometric alerts | M1 | Survey 1 & 2 |
| 2 | Step 2 & 3 Validation & Normalization | `validateStep(2)` tests child height/weight with unit-aware ranges; `validateStep(3)` tests parents | M1 | Survey 1 & 2 |
| 3 | Unit-Aware LMS & Presets | `syncDobAndAutoStage()` and `applyPreset()` update input values unit-aware without resetting imperial inputs to raw cm | M1 | Survey 1 & 2 |
| 4 | 100% English HTML & Zero Hangul | Convert `index.html` static markup completely to native English; zero Hangul (`/[가-힣]/` = 0) | M1 | Survey 1 |
| 5 | Dynamic Age-Appropriate English Options | Update `syncAgeAppropriateQuizOptions()` with English options for Toddler, Kindergarten, School-age | M1 | Survey 1 |
| 6 | Global DOB & Region Pickers | Month/Day/Year picker order and 5 global regions (US, CA, UK/EU, AU/NZ, Global) | M1 | Survey 1 |
| 7 | Suppress Domestic Korean Feeds | `master-briefing.js` omits Coupang, KakaoTalk, and Naver links in English mode | M1 | Survey 1 |
| 8 | Header Interactive Unit Selector | Top navbar unit selector (`🇺🇸 Imperial: ft/in · lbs` ↔ `🌐 Metric: cm · kg`) syncing across application | M2 | Survey 2 |
| 9 | Form Embedded Unit Selectors | Interactive unit selector switches in Step 2 (Child) and Step 3 (Parents) | M2 | Survey 2 |
| 10 | Live Bidirectional Height & Weight Sync | Live binding between `ft + in` inputs and primary `cm` inputs, and `lbs` and `kg` | M2 | Survey 2 |
| 11 | Live Imperial MPH Preview Badge | Step 3 live Mid-Parental Height badge formats in `ft/in` (Imperial) or `cm` (Metric) | M2 | Survey 2 |
| 12 | Unit-Prioritized Clinical Report | Clinical report cards, tables, and SVG trajectory prioritize Imperial or Metric according to active mode | M2 | Survey 2 |
| 13 | Global Marketing Masterplan | Strategy documents for Reddit, Instagram/Threads, TikTok/Shorts, Quora/X, and SEO/GEO in `docs/global_marketing/` | M3 | Survey 3 |
| 14 | Ready-to-Publish Content Packs | Copy-paste English marketing copy across 4 channels in `global_marketing_packs/` | M3 | Survey 3 |
| 15 | 6-Slide English Card-News PNGs | Render 1080x1350 editorial card-news slides using Python Pillow 12.2.0 | M3 | Survey 3 |
| 16 | 28 English Q&A Pages | Full clinical Q&A pages `topic-01.html` through `topic-25.html`, `post-seq-001.html` through `003.html`, and `index.html` in `qna/` with 0 Hangul | M3 | Survey 3 |
| 17 | Global Feeds & AI-Search Manifests | `llms.txt`, `llms-full.txt`, `feed.json`, `rss.xml`, `sitemap.xml` converted to English and `kisfitglobal.com` | M3 | Survey 3 |
| 18 | Acceptance Verifier English Adaptation | Update `scripts/verify-acceptance.js` to assert English workspace deliverables with 0 errors | M4 | Survey 3 |
| 19 | Build Pipeline Execution | `npm run build` succeeds cleanly and outputs `dist/index.html` and `dist/qna/` with 0 Hangul | M4 | Survey 3 |
| 20 | Test Suite Pass (18/18 Suites) | `npm test` runs 18 test suites with 0 failures | M4 | Survey 3 |
| 21 | Lemon Squeezy Paywall & Telegram Verification | Verify Store #296100 paywall and send completion notification via `@kidsfittbot` | M4 | Survey 3 |
| 22 | Git Safety Rule | Strictly no `git push` | M4 | Dispatch |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Survey Flow & 100% English UI | Fix Step 1-6 navigation, `validateStep`, `syncDobAndAutoStage`, `syncAgeAppropriateQuizOptions`, 100% English `index.html`, global DOB/region | none | DONE |
| M2 | Interactive Dual-Unit Selector | Header & Form unit switches, live `ft/in` ↔ `cm` and `lbs` ↔ `kg` bidirectional sync, live MPH badge, unit-prioritized report | M1 | DONE |
| M3 | Global Marketing, Packs & 28 Q&A Pages | Masterplan (`docs/global_marketing/`), content packs (`global_marketing_packs/`), 6 card-news PNGs, 28 Q&A pages, feeds (`llms.txt`, `feed.json`, `rss.xml`, `sitemap.xml`) | none (parallel) | DONE |
| M4 | Integration Build, Tests & Telegram Verification | Update `scripts/verify-acceptance.js`, `npm run build`, `npm test`, `npm run verify`, `@kidsfittbot` notification | M1, M2, M3 | DONE |

## Interface Contracts
### `TallerI18n` ↔ `OnboardingWizard`
- `TallerI18n.getUnitSystem()`: returns `'imperial'` | `'metric'`.
- `TallerI18n.setUnitSystem(unit)`: updates localStorage `taller_unit`, dispatches `'taller:unit-changed'` CustomEvent with `{ unitSystem }`.
- `TallerI18n.applyTranslations()`: applies translations to all `data-i18n` elements.

### Unit Converter ↔ Form Inputs
- Imperial to Metric:
  - Height: `cm = (feet * 12 + inches) * 2.54`
  - Weight: `kg = lbs / 2.20462`
  - Velocity: `cm = inches * 2.54`
- Metric to Imperial:
  - Total inches: `totalIn = cm / 2.54` -> `feet = Math.floor(totalIn / 12)`, `inches = Math.round((totalIn % 12) * 10) / 10`
  - Weight: `lbs = Math.round(kg * 2.20462 * 10) / 10`
  - Velocity: `inches = Math.round((cm / 2.54) * 10) / 10`
- Event Handlers:
  - Typing in `#child-height-ft` or `#child-height-in` updates `#child-height` (in inches in imperial mode, or cm in metric mode) and triggers `input` event.
  - Typing in `#child-weight-lbs` updates `#child-weight` (in lbs in imperial mode, or kg in metric mode) and triggers `input` event.

### Build Pipeline ↔ Distribution
- `scripts/build.js` copies `qna/` to `dist/qna/` recursively.
- `scripts/build.js` copies `CNAME` (`kisfitglobal.com`) to `dist/CNAME`.
- `scripts/build.js` copies and transforms `index.html` to `dist/index.html`.

## Code Layout
- Exclusive Write Ownership:
  - **Milestone 1 Worker**: `index.html`, `src/js/onboarding-wizard.js`, `src/js/i18n.js`, `src/js/app.js`, `src/js/master-briefing.js`, `tests/ui-onboarding.test.js`
  - **Milestone 2 Worker**: `index.html` (unit selector controls & inputs), `src/js/onboarding-wizard.js` (unit sync & live MPH preview), `src/js/global-paywall-edition.js` (report unit formatting), `src/css/style.css` (unit selector styling)
  - **Milestone 3 Worker**: `docs/global_marketing/*`, `global_marketing_packs/*`, `qna/*`, `llms.txt`, `llms-full.txt`, `feed.json`, `rss.xml`, `sitemap.xml`
  - **Milestone 4 Worker**: `scripts/verify-acceptance.js`, `scripts/telegram-notify.js`
