# KidsFit Growth Studio - Test Infrastructure Specification (TEST_INFRA.md)

## 1. Executive Summary & Zero-Dependency Testing Philosophy

**KidsFit Growth Studio (`truthofmarket.com`)** is an evidence-based pediatric growth and developmental diagnostic platform. Because the application handles critical child anthropometric data, Korea Disease Control and Prevention Agency (KDCA) pediatric growth standards, Ministry of Health and Welfare K-DST developmental rubrics, and high-conversion commercial affiliate pipelines, testing rigor must be absolute.

### Core Testing Principles
1. **Zero External Test Runner Dependencies**: All automated tests run natively on modern Node.js using built-in assertions (`assert`, `assert.strictEqual`, `assert.ok`) and standard library modules (`fs`, `path`, `child_process`). Tests require zero npm package downloads, guaranteeing 100% offline determinism and rapid execution (<100ms total).
2. **Authoritative Specification-Derived Oracles**: Every test assertion is derived from primary source standards:
   - **KDCA 2017 Pediatric Growth Charts (12~216 months)**: LMS parameter Box-Cox transformations and Abramowitz & Stegun error function approximations for cumulative normal distribution.
   - **Tanner Clinical Pediatrics**: Mid-Parental Height (MPH) genetic target formulas ($+13\text{cm}$ for boys, $-13\text{cm}$ for girls) and clinical puberty velocity windows.
   - **Ministry of Health and Welfare K-DST Guidelines**: 6-axis developmental domains, trigonometry-derived SVG polygon radar geometry ($300 \times 300$), and age-appropriate educational methodology decision matrices.
   - **40-Course Nationwide Weekend Curation Database**: Exhaustive $8\text{ regions} \times 5\text{ themes}$ permutation catalog.
   - **4-Tier Monetization & Commercial Regulation Engine**: Strict compliance with Ministry of Food and Drug Safety (MFDS) non-medical cosmetic coaching standards, Coupang Partners (`AF7865143`), LinkPrice (`A100708867`), and Tenping (`010-****-2370`) affiliate token persistence.
3. **Progressive Testability & Isolation**: Tests run in clean, self-contained sandboxes with complete independence from test execution order, environment state, and peer milestone completion status.
4. **Opaque-Box Verification**: The test suite evaluates external behavioral contracts, computational invariants, and UI state transitions without relying on brittle internal implementation quirks.

---

## 2. 4-Tier Test Architecture

The KidsFit Growth Studio test harness organizes automated quality verification into a 4-tier progressive hierarchy:

```
+-------------------------------------------------------------------------+
|                  Tier 4: Real-World Diagnostic Journeys                 |
|  Full parent persona E2E workflows (Working mom 3yo, Puberty 11yo dad)  |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
|                 Tier 3: Cross-Feature Pairwise Combinations             |
|   Presets × Habit Clusters × Regional Outings × Budget Receipt Invariants |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
|                 Tier 2: Boundary & Corner Cases Stress                  |
|  12mo/216mo limits, 50cm/210cm extremes, zero parent fallback, 4 clicks  |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
|                 Tier 1: Comprehensive Feature Coverage                  |
|   >=5 tests per feature across 12 functional domains (60+ unit tests)   |
+-------------------------------------------------------------------------+
```

### Tier Breakdown
- **Tier 1 (Feature Coverage, $\ge 5$ tests per feature domain)**: Validates standard happy paths, core algorithmic formulas, preset auto-fill state, radar chart geometry, 40-course outing curation, grocery receipt pricing, secret admin modal triggers, and OSMU 4-channel copy generation.
- **Tier 2 (Boundary & Corner Cases, $\ge 5$ tests per boundary category)**: Stresses data boundaries including extreme ages ($12\text{mo}$ and $216\text{mo}$), extreme heights ($50\text{cm}$ and $210\text{cm}$), missing parent heights (fallback to national population averages of $173.5\text{cm}$ and $161.0\text{cm}$), all-5 vs zero habit selections, stage-3 puberty urgency alarms, rapid footer click timeouts, and localStorage clearance fallbacks.
- **Tier 3 (Cross-Feature Pairwise Combinations)**: Asserts multi-dimensional interactions across presets, habit combinations, regional themes, and budget tiers, verifying that the 5-item grocery receipt dynamically recalculates items, 4-week totals, and daily amortized costs.
- **Tier 4 (Real-World Application Scenarios)**: Simulates 5 deep persona journeys representing authentic Korean 3040 parents (Working Mom with fine-motor toddler, Dad with puberty-sprint pre-teen, infant parent with milk intolerance, kindergarten parent with picky eating, and elementary student parent seeking history outings).

---

## 3. Feature Inventory & Coverage Mapping Matrix

| Feature ID | Feature Domain | Specification Reference | Tier 1 Tests | Tier 2 Tests | Tier 3/4 Scenarios | Status |
|:---|:---|:---|:---:|:---:|:---:|:---:|
| **F01** | 6 Quick Presets Auto-fill | `PROJECT.md` F06, `ORIGINAL_REQUEST.md` R4 | 6 | 2 | 5 | **Covered** |
| **F02** | 6-Step Deep Diagnosis Form | `PROJECT.md` F07, `ORIGINAL_REQUEST.md` R4 | 6 | 5 | 5 | **Covered** |
| **F03** | Mid-Parental Height (MPH) Formula | `PROJECT.md` F10, `ORIGINAL_REQUEST.md` R5 | 6 | 5 | 5 | **Covered** |
| **F04** | KDCA LMS Percentile & Median Delta | `PROJECT.md` F09, KDCA 2017 Standards | 6 | 5 | 5 | **Covered** |
| **F05** | 3-Tier Predicted Height Bar Chart | `PROJECT.md` F10, `ORIGINAL_REQUEST.md` R5 | 6 | 5 | 5 | **Covered** |
| **F06** | K-DST 6-Axis Radar & SVG Polygon | `PROJECT.md` F12, K-DST Guidelines | 6 | 3 | 5 | **Covered** |
| **F07** | Pedagogical Judgement Matrix | `PROJECT.md` F13, `ORIGINAL_REQUEST.md` R5 | 6 | 3 | 5 | **Covered** |
| **F08** | TOP 4 Toys & Development Rationale | `PROJECT.md` F14, `ORIGINAL_REQUEST.md` R5 | 6 | 2 | 5 | **Covered** |
| **F09** | 8 Regions × 5 Themes Weekend Courses | `PROJECT.md` F15, 40-Course Database | 40 | 3 | 5 | **Covered** |
| **F10** | 4-Tier Monetization & Receipt Math | `PROJECT.md` F17~F20, R6 | 6 | 3 | 8 | **Covered** |
| **F11** | Secret Admin Trigger & Storage Sync | `PROJECT.md` F21~F22, R3 | 6 | 5 | 2 | **Covered** |
| **F12** | OSMU 4-Channel Marketing Generator | `PROJECT.md` F23, `ORIGINAL_REQUEST.md` R6 | 6 | 2 | 3 | **Covered** |

---

## 4. Authoritative Domain Mathematics & Verification Formulations

### 4.1 KDCA Percentile Calculation (LMS Box-Cox Formulation)
Given child height $X$ at age in months $m$ with gender-specific LMS parameters $L(m), M(m), S(m)$:
$$Z = \begin{cases} \frac{(X / M)^L - 1}{L \cdot S} & (L \neq 0) \\ \frac{\ln(X / M)}{S} & (L = 0) \end{cases}$$
$$\text{Percentile}(P) = \frac{1}{2}\left[1 + \text{erf}\left(\frac{Z}{\sqrt{2}}\right)\right] \times 100\%$$
$$\text{TopRanking} = 100 - P, \quad \Delta \text{Median} = X - M(m)$$

### 4.2 Mid-Parental Target Height (MPH)
$$\text{MPH}_{\text{Boy}} = \frac{H_{\text{Father}} + H_{\text{Mother}} + 13}{2}, \quad \text{MPH}_{\text{Girl}} = \frac{H_{\text{Father}} + H_{\text{Mother}} - 13}{2}$$
If parental heights are zero or omitted, the model defaults to standard South Korean adult medians:
$$H_{\text{Father, default}} = 173.5\text{cm}, \quad H_{\text{Mother, default}} = 161.0\text{cm}$$

### 4.3 Inhibiting Habit Penalties and Potential Height
Individual habit penalties:
- Late sleep ($>10:30\text{ PM}$): $-1.5\text{cm}$
- Screen time / Forward head posture: $-1.2\text{cm}$
- Picky eating / Poor appetite: $-1.3\text{cm}$
- Milk intolerance: $-0.8\text{cm}$
- Childhood obesity / Excessive adipose: $-1.7\text{cm}$
$$\text{HabitLoss} = \min\left(5.0, \sum_{h \in \text{Habits}} \text{loss}(h)\right)$$
$$\text{Height}_{\text{Unmanaged}} = \text{MPH} - \text{HabitLoss}$$
$$\text{Height}_{\text{MaxPotential}} = \text{MPH} + \text{GoldenBoost} + (\text{HabitLoss} \times 0.5)$$
where $\text{GoldenBoost} \in \{+6.0\text{cm} \text{ (Pre-pubertal)}, +5.0\text{cm} \text{ (Spurt)}, +3.0\text{cm} \text{ (Urgent)}\}$.

### 4.4 K-DST 6-Axis Trigonometric SVG Geometry
For SVG coordinate space $300 \times 300$, center $(cx, cy) = (150, 150)$, radius $R = 100$:
$$\theta_i = -\frac{\pi}{2} + i \cdot \frac{2\pi}{6} \quad (i = 0, \dots, 5)$$
$$x_i = 150 + 100 \cdot \left(\frac{\text{score}_i}{100}\right) \cdot \cos(\theta_i), \quad y_i = 150 + 100 \cdot \left(\frac{\text{score}_i}{100}\right) \cdot \sin(\theta_i)$$

---

## 5. Test Suite Invocation & Commands

To execute the test suite across environments:

```bash
# 1. Primary Test Command (runs all suites via test runner)
npm test

# 2. Direct Node Execution
node tests/e2e-kidsfit.test.js

# 3. Master Acceptance Verification
npm run verify
```

### Exit Codes & Invariants
- Exit Code `0`: 100% of test assertions passed, zero unhandled errors.
- Exit Code `1`: Any assertion mismatch, uncaught exception, or timeout.
- Standard Output: Human-readable execution breakdown by Tier, test counts, execution time, and status banner.

---

## 6. Maintenance & Progressive Extension Guide

When adding new clinical growth features or regional museum destinations:
1. Extend the corresponding test dataset in `tests/e2e-kidsfit.test.js`.
2. Follow the 4-tier naming convention (`[Tier 1: ...]`, `[Tier 2: ...]`, etc.).
3. Maintain zero external npm package dependencies.
4. Verify execution timing remains $<200\text{ms}$.
