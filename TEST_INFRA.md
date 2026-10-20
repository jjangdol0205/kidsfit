# Taller Bio Labs — Test Infrastructure Specification (TEST_INFRA.md)

## 1. Executive Summary & Zero-Dependency Testing Philosophy

**Taller Bio Labs (키즈핏 바이오 랩 — `truthofmarket.com`)** is a clinical-grade developmental biology, pediatric auxology, endocrinology, biomechanics, and cognitive analytics web platform.

Because the system computes critical pediatric biometric percentiles, hormonal suppression curves, epiphyseal growth trajectories, and clinical nutrition dosages, testing rigor must be absolute.

### Core Testing Principles
1. **Zero External Test Runner Dependencies**: All automated tests run natively on pure Node.js using built-in assertions (`assert`, `assert.strictEqual`, `assert.ok`) and standard library modules (`fs`, `path`, `child_process`). The test harness requires zero npm downloads, guaranteeing 100% offline determinism and sub-second execution (<150ms).
2. **Authoritative Specification-Derived Oracles**: Every test assertion is derived from primary source clinical standards:
   - **KDCA 2017 & US CDC 2000 Pediatric Growth Standards (12~240 months)**: Box-Cox power transformations and Abramowitz & Stegun error function approximations for normal cumulative distribution function (CDF).
   - **Tanner Clinical Auxology**: Mid-Parental Height (MPH) genetic target models ($(Father + Mother \pm 13)/2 \pm 8.5\text{cm}$) and clinical puberty velocity windows.
   - **Pediatric Endocrinology & Sleep Medicine**: Slow-Wave Sleep (SWS) pulsatile Growth Hormone (GH) secretion dynamics and postprandial insulin/somatostatin suppression curves (strictly capped at $-52\%$).
   - **Clinical Nutrition Bioavailability**: Calcium absorption kinetics (~45% MCHA / Calcium Citrate vs ~22% Calcium Carbonate), Vitamin D3/K2 osteocalcin carboxylation, and weight-proportional collagen matrix formulations.
   - **Wolff's Law & Spinal Biomechanics**: Diurnal intervertebral disc decompression ($+1.5 \sim +2.2\text{cm}$) and epiphyseal cyclic vertical loading protocols.
   - **Neuro-Cognitive Golden Windows**: 5-axis developmental radar geometry ($300 \times 300$) and 3-step Havruta inquiry models.
   - **Quiet Academic Reference Architecture**: Discrete 12px reference chips with zero commercial clutter and resilient affiliate routing (Coupang `AF7865143`, LinkPrice `A100708867`, iHerb `KIDSBIO`, Amazon `tallerbiolab-20`).
   - **Continuous Research Knowledge Base**: 748+ peer-reviewed scientific papers with live PMID/DOI citations and self-improvement clinical auditing.
3. **Dual Track Methodology**: Combines rigorous formal mathematical modeling (Category-Partition, Boundary Value Analysis, Pairwise Combinations) with end-to-end clinical workflow execution.
4. **Opaque-Box Verification**: Evaluates external behavioral contracts, computational invariants, and UI state transitions without relying on brittle internal implementation quirks.

---

## 2. Dual Track Testing Methodology

The testing framework employs a **Dual Track** strategy:

```
========================================================================================
                          DUAL TRACK TEST METHODOLOGY
========================================================================================

  [TRACK A: Mathematical Oracles & Domain Invariants]
  - Box-Cox LMS Transformation: Z = ((X/M)^L - 1) / (L * S)  [L != 0]
  - Normal CDF: Phi(Z) = 0.5 * (1 + erf(Z / sqrt(2)))
  - Tanner Mid-Parental Height: (Father + Mother +/- 13) / 2 +/- 8.5 cm
  - Annual Growth Velocity: gain_6m * 2  [Red Flag if < 4.0 cm/yr]
  - 3 Adult Height Trajectories: Baseline MPH, Unmanaged (max -5cm), Optimized (+5~9.2cm)
  - Hormone Suppression Model: Bedtime Delay + Pre-Bed Carb Spike (capped at -52%)
  - Weight-Proportional Bio-Nutrition: Calcium, D3+K2, Zn+Mg, Protein (1.3g/kg)
  - Bioavailability Ratio: Citrate/MCHA ~45% vs Carbonate ~22%
  - Biomechanics: Disc Decompression +1.5~2.2cm, 3 Countdown Timers (30s, 45s, 15m)
  - Neuro-Cognitive Radar: 5-Axis Polygon (0~100), Equilateral Baseline (70)
  - Quiet 12px Reference Chips: Zero Commercial Elements, Zero Dead Links (#)

                                      ||
                                      \/

  [TRACK B: Formal Test Design Techniques]
  1. Category-Partition Method:
     - Partitions input domains (Gender, Age, Height, Weight, Habits, Axes, Language, Units).
  2. Boundary Value Analysis (BVA):
     - Min/Max ages (12m, 240m), out-of-bounds clamping (<12m, >240m).
     - Box-Cox L = 0 logarithmic boundary.
     - Extreme Z-scores (+/-5.0 SD) clamped to [0.1%, 99.9%].
     - Extreme Bedtime (20:30, 01:00) and Meal times (17:00, 23:00).
     - Meal >= Bedtime edge case (0h gap -> max -52% suppression).
     - Extreme weights (3.0kg to 150.0kg) and heights (50.0cm to 220.0cm).
  3. Pairwise Combination Testing:
     - Combinations of Habits (Late Sleep + Night Carbs + Picky Eater + Posture + Sedentary).
     - Developmental Phase (Phase 1 Prepubertal vs Phase 2 Peak Spurt).
     - Dual Standards Parity (EN Imperial CDC 2000 vs KO Metric KDCA 2017).
  4. Clinical Workload Testing:
     - 5 Representative Clinical Personas executed through full diagnostic workflows.
========================================================================================
```

---

## 3. 4-Tier Test Architecture

The automated test harness organizes verification into 4 progressive tiers:

```
+---------------------------------------------------------------------------------------+
|                       Tier 4: Real-World Clinical Scenarios                           |
|  5 Complete Clinical Patient Journeys (3yo, 7yo, 10yo, 13yo, 16yo)                    |
+---------------------------------------------------------------------------------------+
                                           ^
+---------------------------------------------------------------------------------------+
|                      Tier 3: Cross-Feature Combinations                               |
|  Multi-variate Interactions: Habits × Developmental Stages × Dual Standards Parity    |
+---------------------------------------------------------------------------------------+
                                           ^
+---------------------------------------------------------------------------------------+
|                    Tier 2: Boundary & Corner Cases Stress                             |
|  12m/240m limits, Box-Cox L=0, extreme Z-scores, BMI extremes, compound unit conversions|
+---------------------------------------------------------------------------------------+
                                           ^
+---------------------------------------------------------------------------------------+
|                    Tier 1: Comprehensive Feature Coverage                             |
|  >=5 Assertions per feature across all 30 features in PROJECT.md (>=150 unit tests)   |
+---------------------------------------------------------------------------------------+
```

### Tier Breakdown
- **Tier 1 (Feature Coverage, $\ge 5$ assertions per feature across all 30 features)**:
  Exhaustively verifies all 30 platform features defined in `PROJECT.md`, including commercial elimination, themes, bilingual switcher, metadata, onboarding wizard, presets, LMS auxology, velocity, Tanner MPH, 3 trajectories, 3-curve SVG chart, 24-hr hormone slider, SWS GH peak curve, nutrient calculator, bioavailability gauges, disc decompression, countdown timers, biomechanics routines, 5-axis radar chart, cortical rewiring, Havruta questions, 90-day tracker, hospital A4 PDF, quiet 12px reference chips, affiliate routing, secret admin studio, continuous research knowledge base, and self-improvement quality engine.
- **Tier 2 (Boundary & Corner Cases, $\ge 5$ assertions per boundary dimension)**:
  Stresses domain limits: age boundaries (12m and 240m), out-of-range clamping (<12m and >240m), Box-Cox $L = 0$ singularity, extreme Z-scores ($Z = \pm 5.0$ SD) clamped to [0.1%, 99.9%], parental height omissions (fallback to national medians 173.5cm and 161.0cm), all 5 habit penalties simultaneous activation (sum 6.2cm capped at $-5.0\text{cm}$), bedtime slider extremes (20:30 and 01:00), meal slider extremes (17:00 and 23:00), meal after bedtime edge case ($\text{gap} \le 0 \implies -52\%$), compound imperial conversions (e.g. 4 ft 3.5 in, 55.5 lbs), and zero cognitive selection fallback (equilateral 70 score).
- **Tier 3 (Cross-Feature Combinations)**:
  Asserts multi-dimensional feature interactions:
  1. Late sleep (23:30) + late carbs (22:00) + low calcium in pubertal peak spurt.
  2. Prepubertal Phase 1 vs Peak Velocity Phase 2 growth velocity and golden boost calibration.
  3. Sedentary lifestyle + postural imbalance + biomechanics spinal traction recovery.
  4. Dual standards parity: EN Imperial (CDC 2000) vs KO Metric (KDCA 2017) parallel percentile consistency.
  5. Multi-factor extreme: All 5 habits + all 5 cognitive axes + 90-day streak tracker + reference chips.
- **Tier 4 (Real-World Clinical Scenarios)**:
  Simulates 5 authentic clinical cases:
  1. **Case 1: 3-Year-Old Early Developmental Toddler** (36mo boy, height 96.5cm, weight 14.7kg, milk trouble, sensory_arts axis).
  2. **Case 2: 7-Year-Old Prepubertal Velocity Check** (84mo girl, height 118.0cm, weight 22.0kg, recent gain 1.8cm $\implies 3.6\text{ cm/yr}$, red-flag alert).
  3. **Case 3: 10-Year-Old Early Puberty Hormone Optimization** (120mo boy, height 137.0cm, weight 35.5kg, bedtime 23:30, dinner 21:00, SWS GH suppression -44%).
  4. **Case 4: 13-Year-Old Peak Velocity Spurt** (156mo boy, height 155.6cm, weight 51.0kg, recent gain 4.5cm $\implies 9.0\text{ cm/yr}$, Wolff's law plyometrics).
  5. **Case 5: 16-Year-Old Late Adolescent Epiphyseal Closure** (192mo girl, height 160.0cm, weight 54.1kg, Phase 4 maturation, $+1.5\sim2.2\text{cm}$ spinal disc decompression).

---

## 4. 30-Feature Traceability Matrix

| Feature ID | Feature Domain | Specification Reference | Tier 1 Tests | Tier 2 Tests | Tier 3/4 Scenarios | Status |
|:---|:---|:---|:---:|:---:|:---:|:---:|
| **F01** | Commercial Elimination | `PROJECT.md` F1, `ORIGINAL_REQUEST.md` R1 | 5 | 2 | 5 | **Covered** |
| **F02** | Dark Glassmorphism UI | `PROJECT.md` F2, Spec §2.1 | 5 | 2 | 2 | **Covered** |
| **F03** | Light Clinic Theme | `PROJECT.md` F3, Spec §2.1 | 5 | 2 | 2 | **Covered** |
| **F04** | Dual Unit & Standard Switcher | `PROJECT.md` F4, Spec §2.2 | 5 | 8 | 5 | **Covered** |
| **F05** | Clean Metadata & Favicon | `PROJECT.md` F5, Spec §2.3 | 5 | 2 | 2 | **Covered** |
| **F06** | 5-Stage Bio Onboarding Wizard | `PROJECT.md` F6, Spec §3.2 | 5 | 4 | 5 | **Covered** |
| **F07** | 5 Age Clinical Presets | `PROJECT.md` F7, Spec §3.1 | 5 | 4 | 5 | **Covered** |
| **F08** | CDC & KDCA LMS Datasets | `PROJECT.md` F8, Spec §4.1 | 5 | 6 | 5 | **Covered** |
| **F09** | Box-Cox Z-Score & Percentile | `PROJECT.md` F9, Spec §4.2 | 5 | 8 | 5 | **Covered** |
| **F10** | Growth Velocity Engine | `PROJECT.md` F10, Spec §4.2 | 5 | 4 | 5 | **Covered** |
| **F11** | Tanner Mid-Parental Height | `PROJECT.md` F11, Spec §4.2 | 5 | 6 | 5 | **Covered** |
| **F12** | 3 Trajectory Predictions | `PROJECT.md` F12, Spec §4.2 | 5 | 6 | 5 | **Covered** |
| **F13** | Interactive 3-Curve SVG Chart | `PROJECT.md` F13, Spec §4.3 | 5 | 4 | 5 | **Covered** |
| **F14** | 24-Hr Hormone Timeline Slider | `PROJECT.md` F14, Spec §5.1 | 5 | 6 | 5 | **Covered** |
| **F15** | SWS GH Peak & Suppression Curve | `PROJECT.md` F15, Spec §5.1 | 5 | 6 | 5 | **Covered** |
| **F16** | Weight-Proportional Nutrient Calc | `PROJECT.md` F16, Spec §5.2 | 5 | 4 | 5 | **Covered** |
| **F17** | Bioavailability Comparison Gauges | `PROJECT.md` F17, Spec §5.2 | 5 | 2 | 5 | **Covered** |
| **F18** | Disc Decompression & Wolff's Law | `PROJECT.md` F18, Spec §6.1 | 5 | 4 | 5 | **Covered** |
| **F19** | Interactive Countdown Timers | `PROJECT.md` F19, Spec §6.2 | 5 | 4 | 3 | **Covered** |
| **F20** | 3 Biomechanics Exercise Routines | `PROJECT.md` F20, Spec §6.2 | 5 | 4 | 5 | **Covered** |
| **F21** | 5-Axis Neuro-Cognitive Radar Chart | `PROJECT.md` F21, Spec §7.1 | 5 | 6 | 5 | **Covered** |
| **F22** | Age Golden Times & Cortical Rewiring | `PROJECT.md` F22, Spec §7.2 | 5 | 2 | 5 | **Covered** |
| **F23** | Havruta 3-Question Inquiry System | `PROJECT.md` F23, Spec §7.3 | 5 | 2 | 5 | **Covered** |
| **F24** | 90-Day Routine & Growth Tracker | `PROJECT.md` F24, Spec §8.1 | 5 | 4 | 3 | **Covered** |
| **F25** | 2-Page Hospital Clinic A4 PDF | `PROJECT.md` F25, Spec §8.2 | 5 | 2 | 2 | **Covered** |
| **F26** | Quiet 12px Academic Reference Chips | `PROJECT.md` F26, Spec §9.1 | 5 | 2 | 5 | **Covered** |
| **F27** | Resilient Affiliate Routing & Proxy | `PROJECT.md` F27, Spec §9.1 | 5 | 2 | 5 | **Covered** |
| **F28** | Secret Admin Studio & Master Toggle | `PROJECT.md` F28, Spec §9.2 | 5 | 4 | 3 | **Covered** |
| **F29** | Continuous Research Knowledge Wiring| `PROJECT.md` F29, Spec §10.1| 5 | 2 | 5 | **Covered** |
| **F30** | Self-Improvement Quality Loop | `PROJECT.md` F30, Spec §10.2| 5 | 4 | 2 | **Covered** |

---

## 5. Mathematical Formulations & Exact Oracles

### 5.1 Box-Cox LMS Standard Formulation
Given observation $X$ at age in months $m$ with normative parameters $L(m), M(m), S(m)$:
$$Z = \begin{cases} \frac{(X / M)^L - 1}{L \cdot S} & (|L| > 0.0001) \\ \frac{\ln(X / M)}{S} & (|L| \le 0.0001) \end{cases}$$

### 5.2 Abramowitz & Stegun Error Function Approximation
$$\text{erf}(x) \approx 1 - (a_1 t + a_2 t^2 + a_3 t^3 + a_4 t^4 + a_5 t^5) e^{-x^2}, \quad t = \frac{1}{1 + p x}$$
$$\Phi(Z) = \frac{1}{2}\left[1 + \text{erf}\left(\frac{Z}{\sqrt{2}}\right)\right]$$
$$\text{Percentile} = \text{clamp}(0.1, 99.9, \Phi(Z) \times 100)$$

### 5.3 Tanner Mid-Parental Height (MPH)
$$\text{MPH}_{\text{Boy}} = \frac{H_{\text{Father}} + H_{\text{Mother}} + 13.0}{2} \pm 8.5\text{ cm}$$
$$\text{MPH}_{\text{Girl}} = \frac{H_{\text{Father}} + H_{\text{Mother}} - 13.0}{2} \pm 8.5\text{ cm}$$
National default fallbacks: $H_{\text{Father}} = 173.5\text{ cm}$, $H_{\text{Mother}} = 161.0\text{ cm}$.

### 5.4 Annual Growth Velocity & Red-Flag Rule
$$\text{Growth Velocity (cm/yr)} = \text{Recent 6-Month Gain (cm)} \times 2$$
$$\text{Red Flag Alert} = \text{True} \iff (\text{Age} \in [4, 9] \land \text{Velocity} < 4.0\text{ cm/yr})$$

### 5.5 Hormone Suppression Model & Cap
$$\Delta t_{\text{gap}} = t_{\text{bedtime}} - t_{\text{last\_meal}}$$
$$\text{DelayPenalty} = \max\left(0, \frac{t_{\text{bedtime\_min}} - 1320}{30}\right) \times 8\% \quad (t_{\text{bedtime\_min}} > 1320 \iff 22:00)$$
$$\text{CarbPenalty} = \begin{cases} 40\% & (\Delta t_{\text{gap}} < 1.0\text{ hr}) \\ 28\% & (1.0 \le \Delta t_{\text{gap}} < 2.0\text{ hr}) \\ 14\% & (2.0 \le \Delta t_{\text{gap}} < 3.0\text{ hr}) \\ 0\% & (\Delta t_{\text{gap}} \ge 3.0\text{ hr}) \end{cases}$$
$$\text{Total GH Suppression} = \min\left(52\%, \text{DelayPenalty} + \text{CarbPenalty}\right)$$

### 5.6 Bioavailability Absorption Ratios
$$\text{Bioavailability}_{\text{Calcium Citrate / MCHA}} \approx 45\% \quad \text{vs} \quad \text{Bioavailability}_{\text{Calcium Carbonate}} \approx 22\%$$
$$\text{Ratio} = \frac{45}{22} \approx 2.05\times \text{ higher absorption efficiency}$$

---

## 6. Test Runner & CI/CD Commands

To execute the test suite:

```bash
# 1. Run the comprehensive 4-tier Taller Bio Labs E2E test suite:
node tests/e2e-taller-bio.test.js

# 2. Run all repository test suites via the master runner:
node tests/run-all.js

# 3. Standard npm test command:
npm test
```
