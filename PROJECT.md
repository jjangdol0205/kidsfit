# Project: Taller Bio Labs 2-Phase Immersive Funnel & Master Briefing

## Architecture
Taller Bio Labs is structured as a 2-Phase clinical pediatric growth and development analytics platform:
1. **Phase 1: Input Funnel Only**:
   - Focused single-slide card viewport with step progress bar (`Step 1 ~ Step 6`).
   - Central card transition via smooth `translateX`.
   - Results dashboard (`#results-dashboard`) and capsule tabs (`#capsule-tabs`) are 100% hidden (`display: none` / `.hidden`) on initial page load.
   - Compact quick preset chip bar (`preset-card-1` ~ `preset-card-5`) for 1-second clinical simulation.
   - 2.5~3s scanning animation sequence (KDCA/CDC LMS check -> 800+ academic papers matching -> 90-day actionable roadmap generation).
2. **Phase 2: Master Briefing & Single Active Tab Results**:
   - Patient summary bar with `[🔄 정보 다시 입력하기]` button to return to Phase 1.
   - Master Briefing Card:
     1) Current clinical status diagnosis (KDCA 2017, CDC 2000, K-DST, KDRIs percentiles, Z-score, ±cm vs standard, growth velocity trajectory, growth plate golden time).
     2) Core causes & academic paper matching: Realtime filtering against `research-knowledge-base.json` (803 papers DB) showing actual paper title, authors, year, PMID/DOI link, and core statistical numbers for the user's inhibitors & age.
     3) Actionable Roadmap (Top 3 Priorities): #1 Sleep/Hormone guidance, #2 Clinical Nutrition guidance (exact mg/g targets), #3 Decompression Exercise & Age-appropriate Brain/Habruta guidance.
   - Single Active Tab View: Exactly 1 core tab rendered/visible at a time (other 4 tab panels `.hidden`).
     - Core 1: Growth Trajectory & Prediction.
     - Core 2: Hormones, Sleep & Clinical Nutrition.
     - Core 3: Spinal Decompression & Growth Plate Coaching (timers).
     - Core 4: Cognitive Development & Habruta Inquiry.
     - Core 5: 90-day Tracker & A4 Report.
   - Complete 2-page A4 print view (`@media print`) via `#clinic-print-report-container`.

## Code Layout
- `index.html`: Main HTML entry point, containing Phase 1 slide funnel and Phase 2 Master Briefing + 5 tab panes.
- `src/css/style.css`: Design system, slide funnel viewport/track styles, Master Briefing card styles, single active tab rules, and print rules.
- `src/js/app.js`: Main application controller, state management, tab switching, and rendering coordinator.
- `src/js/onboarding-wizard.js`: 6-step slide funnel controller, validation, `translateX` stepper navigation, preset loader, 2.5~3s scanning animation.
- `src/js/master-briefing.js` (or integrated into `growth-engine.js` / `app.js`): Dynamic academic paper matching against `window.KIDSFIT_RESEARCH_DATA` (803 papers) and 3-tier briefing generation.
- `src/js/growth-engine.js`: Core 1 clinical calculations (KDCA 2017, US CDC 2000 LMS Z-scores, percentiles, MPH, velocity, 3-tier prediction curves).
- `src/js/endocrinology-engine.js`: Core 2 circadian 24h GH simulation, SWS delta curve, insulin suppression.
- `src/js/nutrition-engine.js`: Core 2 weight-proportional nutrient targets and bioavailability gauges.
- `src/js/biomechanics-studio.js`: Core 3 decompression exercise timers.
- `src/js/neuro-cognitive-matrix.js`: Core 4 5-axis radar chart and Habruta questions.
- `src/js/growth-tracker.js`: Core 5 90-day tracking and 2-page A4 print generator.
- `src/data/research-knowledge-base.json`: 803 peer-reviewed academic papers.
- `scripts/build.js`: Asset copying and data inlining into `dist/`.
- `scripts/verify-acceptance.js`: Acceptance test verification script.
- `scripts/self-improve-engine.js`: 6-stage autonomous quality assurance and self-healing engine.
- `tests/`: Pure Node.js CommonJS unit, integration, and adversarial tests.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Initial Dashboard Hide | `#results-dashboard` & `#capsule-tabs` 100% hidden (`display: none` / `.hidden`) on initial page load | M1 | Survey R1 |
| 2 | 6-Slide Funnel Track | Central card viewport with smooth `translateX` sliding across Step 1 to 6 | M1 | Survey R1 |
| 3 | Step 1 Inputs | Subject (Child/Self), Gender (Boy/Girl), Age slider (1~20) & months | M1 | Survey R1 |
| 4 | Step 2 Inputs | Current Height, Weight, 6-month growth velocity (cm/yr) | M1 | Survey R1 |
| 5 | Step 3 Inputs | Father & Mother height + realtime MPH preview badge | M1 | Survey R1 |
| 6 | Step 4 Inputs | Tanner Phase 1~4 large touch cards | M1 | Survey R1 |
| 7 | Step 5 Inputs | 5 biological inhibitors multi-select touch cards | M1 | Survey R1 |
| 8 | Step 6 Inputs | 5-domain cognitive/inquiry axes + CTA button | M1 | Survey R1 |
| 9 | 1-Sec Quick Presets Bar | Compact preset chip row (`preset-card-1` ~ `preset-card-5`) for 1-sec simulation | M1 | Survey R1 |
| 10 | 2.5~3s Scan Animation | 3-stage scanning overlay (KDCA/CDC -> 800+ papers -> 90-day roadmap) | M1 | Survey R1 |
| 11 | Funnel Re-Entry Button | User summary bar with `[🔄 정보 다시 입력하기]` button restoring Phase 1 | M1 | Survey R1 |
| 12 | Master Briefing Card | Diagnostic overview card rendered at top of Phase 2 | M1 | Survey R2 |
| 13 | MB Section 1: Clinical Diagnosis | KDCA/CDC Z-scores, percentiles, ±cm vs standard, velocity, golden time | M1 | Survey R2 |
| 14 | MB Section 2: Realtime Papers Match | Realtime dynamic matching of 803 papers DB by user inhibitors & age with titles, authors, PMID/DOI links, statistics | M1 | Survey R2 |
| 15 | MB Section 3: Actionable Roadmap | Top 3 Priorities: #1 Sleep/Hormone, #2 Nutrition exact mg/g, #3 Decompression & Habruta | M1 | Survey R2 |
| 16 | Single Active Tab Navigation | Exactly 1 of the 5 Core tabs visible at a time (`.active`), other 4 hidden (`.hidden`) | M1 | Survey R3 |
| 17 | 2-Page A4 Print View | Complete 2-page A4 clinic report rendered via `#clinic-print-report-container` in `@media print` | M1 | Survey R3 |
| 18 | Feature & System Preservation | EN/KO, Dark/Light, reference chips, admin modal, 803 papers DB, 6-stage self-improve engine | M2 | Survey R4 |
| 19 | Test Suite Alignment & Extension | Update tests to remove legacy `step-content-6` blocker and add tests for Phase 1, Phase 2, Single Tab | M2 | Survey R4 |
| 20 | Build, Verify & Deploy | Pass `npm test`, `npm run verify`, `self-improve-engine.js`, commit and push to `origin/main` | M3 | Survey R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 2-Phase UX Transformation (Slide Funnel, Master Briefing, Single Tab) | Features 1-17: R1 (6-slide funnel, quick presets, scanning overlay, initial dashboard hide), R2 (Master Briefing card, 803 papers dynamic matching, Top 3 roadmap), R3 (Single active tab view, 2-page A4 print view) | none | DONE |
| M2 | Test Suite Alignment, Verification & Self-Improvement Loop | Features 18-19: R4 (Fix legacy step-content-6 blockers, write comprehensive phase 1-2 tests, verify 33/33 checks, run 6-stage self-improve engine) | M1 | IN_PROGRESS |
| M3 | Production Build, Verification & GitHub Deployment | Feature 20: R4 (Run npm run build, full test verification, git commit, push to origin/main, live verification) | M2 | PLANNED |

## Interface Contracts
### OnboardingWizard ↔ AppCoordinator (`src/js/onboarding-wizard.js` ↔ `src/js/app.js`)
- `OnboardingWizard.init(formSelector, onSubmitCallback)`: Initializes stepper, sets step=1, hides `#results-dashboard` and `#capsule-tabs`.
- `OnboardingWizard.goToStep(stepNumber)`: Clamps between 1 and 6, translates track by `-((step-1)*100)%`, updates progress bar text and width.
- `OnboardingWizard.getFormData()`: Returns `{ subject, gender, ageYears, ageMonths, height, weight, recentGrowth6m, fatherHeight, motherHeight, region, tannerPhase, habits: [], cognitiveAxes: [] }`.
- `OnboardingWizard.startScan(callback)`: Executes 2.5~3s animation with KDCA/CDC -> 800+ papers -> 90-day roadmap steps, then invokes callback.

### MasterBriefingEngine ↔ AppCoordinator (`src/js/master-briefing.js` ↔ `src/js/app.js`)
- `MasterBriefingEngine.matchPapers(habits, ageYears, tannerPhase, limit = 3)`: Returns array of `{ paper, matchedCause }` with valid PMID/DOI links.
- `MasterBriefingEngine.render(profile)`: Returns complete HTML string for `#master-briefing-card` containing Sections 1, 2, and 3.

### TabNavigation ↔ AppCoordinator (`src/js/app.js`)
- `switchTab(tabId)`: Sets active capsule tab button, activates corresponding `#tab-pane-*`, adds `.hidden` (`display: none`) to all other 4 tab panes.
- `retest()`: Triggered by `#btn-retest`, hides `#results-dashboard` and `#capsule-tabs`, shows `#quiz-section`, and calls `OnboardingWizard.goToStep(1)`.
