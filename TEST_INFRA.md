# KidsFit Parenting Ecosystem — E2E Test Infrastructure

## 1. Overview & Test Philosophy
The test suite `tests/test_parenting_ecosystem_e2e.py` provides an authoritative, opaque-box, requirements-driven End-to-End (E2E) testing framework for the **KidsFit Long-Horizon Research-Driven Parenting Content Ecosystem**.

The system tests are derived strictly from:
- `ORIGINAL_REQUEST.md` (Latest specification section `## 2026-10-24T10:56:40Z`)
- `PROJECT.md` (Architecture, Feature Inventory F01–F14, Interface Contracts, Code Layout)

### Core Testing Principles
1. **Opaque-Box Verification**: Tests evaluate system behavior, observable outputs, disk artifacts, API responses, schema contracts, and live browser sessions without coupling to private internal implementation details.
2. **Deterministic Independence**: Every test is isolated, managing its own inputs and assertions independently of execution order.
3. **Multi-Milestone Transparency**: The suite explicitly validates all 14 features across the 5 project milestones (M1 through M5). Unimplemented or incomplete features fail deterministically with actionable error messages highlighting the exact missing contract.

---

## 2. Test Architecture & 4-Tier Methodology

The suite organizes 88 test cases across four distinct tiers:

```
tests/test_parenting_ecosystem_e2e.py
├── Tier 1: Feature Coverage (F01–F14) [70 Tests]
│   ├── F01: Hourly Benchmark & Paper KB (5 tests)
│   ├── F02: Blog Specialist Generator (5 tests)
│   ├── F03: Blog Multi-Image Generator (5 tests)
│   ├── F04: Naver Blog Publisher (5 tests)
│   ├── F05: Cafe Specialist & Publisher (5 tests)
│   ├── F06: Instagram/Threads Branding Kit (5 tests)
│   ├── F07: 4-Cut Webtoon Generator (5 tests)
│   ├── F08: 6-Slide Card News Generator (5 tests)
│   ├── F09: Email Dispatch to beable9489@gmail.com (5 tests)
│   ├── F10: Stage 1 Pre-Publish QA Auditor (5 tests)
│   ├── F11: Stage 2 Post-Publish DOM QA & Auto-Fix (5 tests)
│   ├── F12: Telegram Alert Notifier (5 tests)
│   ├── F13: Unified Master Scheduler Daemon (5 tests)
│   └── F14: Immediate 1-Cycle Execution (5 tests)
├── Tier 2: Boundary & Corner Cases [8 Tests]
│   ├── Empty inputs, missing prompts, empty lists (ValueError)
│   ├── Corrupted JSON syntax resilience
│   ├── Missing/unreachable CDP port 9222 detection
│   ├── Missing .env configuration handling
│   ├── Non-promotional text adversarial token scanner
│   ├── Exact image dimension enforcement (1080x1080, 1080x1350)
│   ├── Zero raw markdown syntax (###, **) zero-tolerance check
│   └── Exact column length boundary (1,499 vs 1,500 chars)
├── Tier 3: Cross-Feature Interactions [5 Tests]
│   ├── KB synthesized rules -> Blog multi-image infographic prompts
│   ├── KB scientific claims -> Webtoon Cut 3 (Science Discovery)
│   ├── Blog/Cafe content -> Stage 1 QA -> Stage 2 DOM QA pipeline
│   ├── Email packager -> Naver Mail CDP attachment dispatch
│   └── Unified scheduler -> Telegram real-time alert notifications
└── Tier 4: Real-World Application Scenarios [5 Tests]
    ├── Live CDP port 9222 active Chrome session check
    ├── Email recipient beable9489@gmail.com & logs verification
    ├── Live target endpoints (expertise333, moneyfitlab clubid=31805224)
    ├── Live Telegram BOT_TOKEN format & CHAT_ID: 755033799 check
    └── Master orchestrator 1-cycle execution contract verification
```

---

## 3. Invocation Commands

### 3.1 Standard Suite Invocation
To run the full E2E test suite using the standard Python test runner:

```powershell
python -m unittest tests/test_parenting_ecosystem_e2e.py -v
```

Or run the script directly to trigger the custom summary matrix:

```powershell
python tests/test_parenting_ecosystem_e2e.py
```

### 3.2 Selective Execution by Tier or Feature
Run specific test classes or matching patterns:

```powershell
# Run only Tier 1 Feature F01 (Knowledge Base)
python -m unittest tests.test_parenting_ecosystem_e2e.TestF01HourlyBenchmarkPaperKB -v

# Run only Tier 1 Feature F06 (Branding Kit)
python -m unittest tests.test_parenting_ecosystem_e2e.TestF06InstagramThreadsBrandingKit -v

# Run all Tier 2 Boundary Tests
python -m unittest tests.test_parenting_ecosystem_e2e.TestTier2BoundaryAndCornerCases -v

# Run all Tier 3 Cross-Feature Interaction Tests
python -m unittest tests.test_parenting_ecosystem_e2e.TestTier3CrossFeatureInteractions -v

# Run all Tier 4 Real-World Scenario Tests
python -m unittest tests.test_parenting_ecosystem_e2e.TestTier4RealWorldScenarios -v

# Filter tests by pattern using -k
python -m unittest -k "telegram" tests/test_parenting_ecosystem_e2e.py
```

---

## 4. Pass/Fail Semantics & Milestone Readiness

### 4.1 Exit Codes
- **Exit Code `0`**: All executed tests passed completely. Every requirement and interface contract is satisfied.
- **Exit Code `1`**: One or more assertions failed or encountered an error.

### 4.2 Progressive Milestone Verification
During concurrent development, tests for uncompleted milestones will fail until the respective specialist worker implements the required script and contract:

| Milestone | Target Features | Primary Script / Output Path |
|---|---|---|
| **M1** | F01 | `scripts/hourly_benchmark_paper_learning.py` -> `docs/hourly_benchmark_paper_kb.json` |
| **M2** | F02, F03, F04, F05 | `scripts/publish_enhanced_naver_blog.py`, `scripts/publish_enhanced_naver_cafe.py` |
| **M3** | F06, F07, F08, F09 | `인스타_쓰레드_프로필_모음/highlight_icons/`, `scripts/send_branding_and_daily_assets_email.py` |
| **M4** | F10, F11, F12 | `scripts/qa_fact_check_agent.py`, `scripts/telegram-notify.js` |
| **M5** | F13, F14 | `scripts/unified_parenting_scheduler_daemon.py` |

---

## 5. Coverage Matrix & Thresholds

| Feature ID | Feature Name | Minimum Required Tests | Implemented Tests | Coverage Status |
|---|---|:---:|:---:|:---:|
| **F01** | Hourly Benchmark & Paper KB | 5 | 5 | 100% |
| **F02** | Blog Specialist Generator | 5 | 5 | 100% |
| **F03** | Blog Multi-Image Generator | 5 | 5 | 100% |
| **F04** | Naver Blog Publisher (2x/day) | 5 | 5 | 100% |
| **F05** | Cafe Specialist & Publisher (3x/day) | 5 | 5 | 100% |
| **F06** | Instagram/Threads Branding Kit | 5 | 5 | 100% |
| **F07** | 4-Cut Webtoon Generator | 5 | 5 | 100% |
| **F08** | 6-Slide Card News Generator | 5 | 5 | 100% |
| **F09** | Email Dispatch to `beable9489@gmail.com` | 5 | 5 | 100% |
| **F10** | Stage 1 Pre-Publish QA Auditor | 5 | 5 | 100% |
| **F11** | Stage 2 Post-Publish DOM QA & Auto-Fix | 5 | 5 | 100% |
| **F12** | Telegram Alert Notifier | 5 | 5 | 100% |
| **F13** | Unified Master Scheduler Daemon | 5 | 5 | 100% |
| **F14** | Immediate 1-Cycle Execution | 5 | 5 | 100% |
| **T2** | Boundary & Corner Cases | - | 8 | 100% |
| **T3** | Cross-Feature Interactions | - | 5 | 100% |
| **T4** | Real-World Application Scenarios | - | 5 | 100% |
| **Total** | **All 4 Tiers** | **>= 70** | **88** | **125.7%** |

---

## 6. Environment & Hardware Prerequisites
1. **Python**: Python 3.10+ (tested on Python 3.14.2 64-bit on Windows).
2. **PIL (Pillow)**: Version 10.0+ for high-resolution image dimension and format inspection.
3. **CDP Port 9222**: Google Chrome running on `WinSta0\Default` with `--remote-debugging-port=9222` and user data profile `d:\사업아이템\.naver-browser-profile`.
4. **Environment Variables (`.env`)**:
   - `TELEGRAM_BOT_TOKEN`: Valid Telegram bot token.
   - `TELEGRAM_CHAT_ID`: `755033799`.
