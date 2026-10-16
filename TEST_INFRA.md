# MoneyFit Portal - Test Infrastructure Specification (TEST_INFRA.md)

> **Document Version**: v1.0.0  
> **Target System**: MoneyFit (머니핏) 손익계산 & 맞춤 견적 포털  
> **Author**: `test_writer_e2e_1` (E2E Test Suite & Acceptance Verifier Specialist)  
> **Standard**: Zero External Dependencies, Pure Node.js Built-ins (`node:assert`, `node:fs`, `node:path`)

---

## 1. Test Philosophy & Principles

### 1.1 Zero-Dependency Native Execution
- The entire test infrastructure relies exclusively on native Node.js core modules (`assert`, `fs`, `path`, `url`, `process`).
- Eliminates brittle external test runner dependencies (e.g. Jest, Mocha, Vitest) so tests run deterministically in any standard Node.js environment (v18+) with 0ms installation overhead.

### 1.2 Mathematical & Contractual Authoritativeness
Every test assertion is derived from authoritative domain specifications:
1. **KEPCO (한전) 주택용(저압) 누진 요금제**:
   - 3-tier progressive electricity rates (1단계 120.0원, 2단계 214.6원, 3단계 307.3원).
   - Seasonal summer relaxation (7~8월: 1단계 300kWh 이하, 2단계 301~450kWh, 3단계 >450kWh).
   - Regulatory Climate Environment Charge (9.0원/kWh), Fuel Cost Adjustment (5.0원/kWh), VAT (10%), and Electric Power Industry Basis Fund (3.7%).
2. **Mifflin-St Jeor Basal Metabolic Rate (BMR) & TDEE**:
   - Men: $10 \times W + 6.25 \times H - 5 \times A + 5$
   - Women: $10 \times W + 6.25 \times H - 5 \times A - 161$
   - Minimum nutritional survival threshold: 1,200 kcal floor.
   - Protein allocation: 2.0g per kg of body weight; chicken breast (23g protein/pack, 65% contribution), brown rice bowls (2 bowls/day), WPI protein powder (30g scoop/day, 900g tub).
3. **Veterinary Clinical Nutrition (WSAVA / NRC)**:
   - Rest Energy Requirement: $\text{RER} = 70 \times (\text{weight})^{0.75}$
   - Daily Energy Requirement: $\text{DER} = \text{round}(\text{RER} \times \text{factor})$
   - Daily feed portion: $\text{round}((\text{DER} / \text{kcalPerKg}) \times 1000)$ g.
4. **Strict Budget Allocation Invariant (BOM Budget Invariant)**:
   - For all budgets $B \in [50\text{만원}, 2000\text{만원}]$, the calculated Bill of Materials (BOM) total satisfies:
     $$\sum_{i} \text{itemPrice}_i \le B$$
     Budget overrun is strictly impossible ($\Delta \le 0$).
5. **Vehicle Total Cost of Ownership (TCO)**:
   - Passenger car acquisition tax (7%), annual automobile tax & personal insurance ($1,450,000 \times M / 12$), installment interest (80% principal, 5.5% annual rate).
   - Business depreciation / lease rental tax deduction: $\min(15,000,000, \text{price} \times 0.3) \times (\text{taxRate} / 100) \times (M / 12)$.
6. **Telecommunications Carrier Switching Economics**:
   - Immediate net cash: $\text{cashGift} - \text{penalty}$.
   - 36-month monthly fee difference: $(F_{\text{old}} - F_{\text{new}}) \times 36$.
   - Total net benefit: $(\text{cashGift} - \text{penalty}) + (F_{\text{old}} - F_{\text{new}}) \times 36$.
7. **Monetization Gateway Synthesis**:
   - Coupang Partners: `subid=mf_{calcId}_{afId}`
   - LinkPrice Deep Link: `https://click.linkprice.com/click.php?m={merchantId}&a={lpId}&l=9999&u={encodedTargetUrl}`

### 1.3 Controlled Operations (`--dry-run` vs `--live`)
- Tests and verification scripts operate offline-first.
- IndexNow submission, external crawler pings, and affiliate redirects must default to `--dry-run` mode with 0 network egress, ensuring instant deterministic CI execution.

---

## 2. Feature Inventory & Test Mapping

| Component | Target File | Test Suite File | Test Tiers |
|-----------|-------------|-----------------|------------|
| Calc 1: 전기요금·누진세 & 1등급 교체 | `src/data/calculators.js` | `tests/tier1-features.test.js`, `tests/tier2-boundaries.test.js` | T1, T2, T4 |
| Calc 2: 다이어트 TDEE & 장보기 환산 | `src/data/calculators.js` | `tests/tier1-features.test.js`, `tests/tier2-boundaries.test.js` | T1, T2, T4 |
| Calc 3: 반려동물 칼로리 & 사료 급여량 | `src/data/calculators.js` | `tests/tier1-features.test.js`, `tests/tier2-boundaries.test.js` | T1, T2, T4 |
| Calc 4: 자취/신혼 예산별 풀세팅 BOM | `src/data/calculators.js` | `tests/tier1-features.test.js`, `tests/tier2-boundaries.test.js`, `tests/tier3-interactions.test.js` | T1, T2, T3, T4 |
| Calc 5: 자동차 구매방식(TCO) 손익 | `src/data/calculators.js` | `tests/tier1-features.test.js`, `tests/tier2-boundaries.test.js` | T1, T2, T4 |
| Calc 6: 통신 위약금 vs 현금 사은품 | `src/data/calculators.js` | `tests/tier1-features.test.js`, `tests/tier2-boundaries.test.js` | T1, T2, T4 |
| 5대 수익화 파이프라인 | `src/data/monetization.js` | `tests/tier3-interactions.test.js` | T3 |
| 36대 프로그래매틱 SEO 정적 HTML | `dist/preset/*/index.html` | `scripts/verify-acceptance.js` | AC 2 |
| 사이트맵, robots, IndexNow | `dist/sitemap.xml`, `robots.txt` | `scripts/verify-acceptance.js` | AC 2 |
| 36세트 바이럴 홍보 원고 & 스나이퍼 | `viral_posts/*.md`, 스나이퍼 키트 | `scripts/verify-acceptance.js` | AC 3 |
| 야간 증식 & LAUNCH_GUIDE | `scripts/night-growth.js`, `LAUNCH_GUIDE.md` | `scripts/verify-acceptance.js` | AC 4 |

---

## 3. Test Architecture: 4-Tier Test Suite

The test suite is structured into 4 distinct verification tiers executing via `node tests/run-all.js`:

```
tests/
├── run-all.js                 # Master micro-test runner (Tier 1 ~ 4)
├── test-helper.js             # Universal module loader and assert utilities
├── tier1-features.test.js     # Tier 1: Feature Coverage (>=30 tests, >=5 per calc)
├── tier2-boundaries.test.js   # Tier 2: Boundary & Corner Cases (>=30 tests, >=5 per calc)
├── tier3-interactions.test.js # Tier 3: Cross-Feature Interactions & Invariants (>=12 tests)
└── tier4-workloads.test.js    # Tier 4: Real-World Workload Scenarios (>=6 tests)
```

### Tier 1: Feature Coverage (30+ tests, $\ge 5$ per calculator)
- Tests nominal calculation accuracy against canonical scenarios.
- Validates field presence, types, and formula precision for each calculator.

### Tier 2: Boundary & Corner Cases (30+ tests, $\ge 5$ per calculator)
- Extreme wattages (50W ~ 5000W), 24h continuous operation, edge of tier transitions (exactly 200kWh, 300kWh, 400kWh, 450kWh).
- Minimum body weight (35kg), massive caloric deficits (-1000kcal) enforcing 1200kcal floor, 1-week minimal schedule rounding.
- Ultra-small animals (0.5kg), giant breeds (60kg), life cycle factors from 0.8 to 3.5.
- Lowest budget (50만원), highest budget (2,000만원), single item exclusions.
- Zero tax rate (salaried worker), high tax bracket (45%), vehicle price boundaries (1,500만원 ~ 15,000만원).
- Penalty exceeding cash gift ($Pen > Gift$), zero penalty, identical monthly fees.

### Tier 3: Cross-Feature Interactions & Invariants (12+ tests)
- **BOM Budget Invariant**: Exhaustive verification across multiple budget bands ensuring $\sum \text{items} \le \text{budget}$.
- **Monetization Link Generation**: Verification of Coupang SubIDs, LinkPrice URL encoding, CPA parameters dynamically bound to calculator outputs.
- **Revenue Simulator**: Math integrity across varying visitor traffic (100 ~ 5,000) and CPA payouts.
- **Preset Data Binding**: Consistency between `presets.js` inputs and calculator execution.

### Tier 4: Real-World Workload Scenarios (6+ tests)
End-to-end user journey simulation:
1. **One-room Studio Summer Move-in**: 6-평 원룸 벽걸이 에어컨 누진세 진단 + 100만 원 자취 가전/가구 풀세팅 견적.
2. **Summer Heatwave Bill Surge**: 30평대 2in1 에어컨 12시간 가동에 따른 누진 3단계 폭탄 경보 + 1등급 인버터 교체 회수 분석.
3. **Office Worker Body Recomposition**: 좌식 근무 30대 남성 80kg 체지방 감량 식단 + 4주 닭가슴살 팩수 및 현미밥 환산.
4. **Freelancer / Business Vehicle Acquisition**: 5,000만 원 그랜저 하이브리드 종합소득세율 24% 사업자 절세 반영 장기렌트 TCO 승리 분석.
5. **Puppy Adoption Budget**: 생후 4개월 1.5kg 포메라니안 퍼피 고단백 사료 급여량 산출 및 슬개골 탈구 병원비 리스크 진단.
6. **Telecom Contract Expiration & Carrier Switch**: 잔여 위약금 15만 원 vs 현금 사은품 47만 원 즉시 흑자 전환 및 3년 통신비 절감 분석.

---

## 4. Master Acceptance Verification (`scripts/verify-acceptance.js`)

In addition to the unit test runner, `scripts/verify-acceptance.js` provides programmatic end-to-end verification of all 4 Acceptance Criteria:
- **AC 1 (Calculator Math & BOM Invariant)**: At least 3 scenarios per calculator + strict BOM $\le$ budget check.
- **AC 2 (36 SSG Pages & SEO)**:
  * 36 files exist in `dist/preset/{slug}/index.html`.
  * Unique `<title>` and `<meta name="description">` across all 36 pages.
  * Every page has at least one comparative `<table>`.
  * Every page has valid `application/ld+json` Schema (`WebApplication` + `FAQPage` with $\ge 2$ Q&As).
  * Korean character count (`/[가-힣]/g`) $\ge 1,500$ characters without HTML tags.
  * `sitemap.xml` has $\ge 37$ URLs, valid XML format.
  * `robots.txt` exists and references sitemap.
  * `indexnow-submit.js` passes `--dry-run`.
- **AC 3 (Monetization & Marketing Bundles)**:
  * `monetization.config.json` valid and containing all required keys.
  * 36 viral post bundles in `viral_posts/{slug}.md` containing blog, Jisik-iN, and Threads copies.
  * Sniper kit `오늘의_실전마케팅_스나이퍼_키트.md` generated without errors.
- **AC 4 (Night Growth Routine & Launch Readiness)**:
  * `scripts/night-growth.js` runs in dry-run mode and outputs `일일_야간작업_리포트.md`.
  * `LAUNCH_GUIDE.md` exists with clear instructions.

---

## 5. Execution Commands & Quality Gates

```bash
# 1. Run all 4 test tiers (78+ test cases)
node tests/run-all.js

# 2. Run master acceptance verifier (AC 1-4)
node scripts/verify-acceptance.js

# 3. Run individual test tiers
node tests/tier1-features.test.js
node tests/tier2-boundaries.test.js
node tests/tier3-interactions.test.js
node tests/tier4-workloads.test.js
```

### Quality Gate Pass Criteria
- All tests in `tests/run-all.js` exit with code `0` and 0 failures.
- `scripts/verify-acceptance.js` reports `ALL 4 ACCEPTANCE CRITERIA PASSED` and exits with code `0`.
