# E2E Test Infra: Taller Bio Labs

## Test Philosophy
- Opaque-box, requirement-driven.
- Zero external npm dependencies (native Node.js CommonJS test runner using built-in `assert`, `vm`, `http`).
- 4-Tier test methodology: Category-Partition, Boundary Value Analysis, Cross-Feature Combinations, Real-World Application Workloads.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Initial Results Dashboard 100% Hidden | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 2 | 6-Slide Card Viewport & Stepper | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 3 | Realtime MPH Preview Badge | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 4 | Quick Presets Bar (1-sec simulation) | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 5 | 2.5~3s 3-Stage Scanning Sequence | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 6 | Funnel Re-Entry Button (`[🔄 정보 다시 입력하기]`) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 7 | Master Briefing Card Section 1 (KDCA/CDC Diagnosis) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 8 | Master Briefing Card Section 2 (803 Papers Matching) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 9 | Master Briefing Card Section 3 (Top 3 Roadmap) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 10 | Single Active Tab View (1 active, 4 hidden) | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 11 | Complete 2-Page A4 Clinic Print View | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 12 | System Preservation (i18n, Theme, Chips, Admin, Self-Improve) | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: `node tests/run-all.js` (executes all `tests/*.test.js`)
- Acceptance Verifier: `node scripts/verify-acceptance.js`
- Self-Improvement Engine: `node scripts/self-improve-engine.js` (6 stages: Papers, Math, i18n, SVG, Links, Report)
- Dedicated 2-Phase & Single-Tab Suite: `tests/phase1-2-funnel-briefing.test.js`

## Coverage Thresholds
- Tier 1: >= 5 test cases per core feature
- Tier 2: Boundary value checks (min/max age, height, empty habits, extreme velocity)
- Tier 3: Cross-feature combinations (preset selection -> scan -> briefing generation -> tab switching -> retest)
- Tier 4: Real-world pediatric personas (Toddler 3y, Child 7y, Pre-pubertal 10y, PHV 13y, Late teen 16y)
