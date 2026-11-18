# GEMINI.md — 5사업부 키즈핏 소아성장 아틀리에 (`kidsfit.co.kr`) 절대 규칙 (Ground Rules)

이 문서는 `D:\드림컴퍼니\5사업부` 작업 시 루트 `D:\드림컴퍼니\GEMINI.md`와 100% 일관되게 적용되는 하위 규칙입니다. 모든 대화방(`텔레그램`, `hq_main`, `sns_video`, `seo_monetize`, `payment_pg`)은 반드시 루트 `D:\드림컴퍼니\GEMINI.md` 및 `D:\드림컴퍼니\data\hq_ssot_state.json`과 동일한 기준만 답변·수행합니다.

---

## 1. 법인 정체성 · 전담 CEO 봇 · 호스팅 (SSOT)
- **법인명 / 도메인**: 5사업부 (`KFK` 법인) — **`https://kidsfit.co.kr`** (**GitHub Pages**, `jjangdol0205/kidsfit.git` `main` 브랜치)
- **전담 CEO 봇**: **`@Moneyfiityyy_bot`** (`5사업부/.env`의 `TELEGRAM_BOT_TOKEN`) / 그룹 비서실장·감사관: **`@Allcompany1_bot`**
- **단일 호흡 부티크 소아성장 아틀리에 & 래피드(`Latpeed`) 순수 유료 2등급 헌장**:
  1. **제휴 상품 전면 철거 (`0건` 엄수)**: 쿠팡 파트너스(`coupang.com`, `AF7865143`), 네이버 브랜드커넥트(`brandconnect.naver.com`, `Npay`), 링크프라이스(`linkprice.com`, `A100708867`), 아이허브(`iherb.com`, `IPZ1547`), 쇼핑 카드 그리드, 공정위 제휴 수수료 고지문을 `index.html`, 활성 스크립트 및 `qna/*.html`에서 100% 배제합니다 (맞춤 실물 제휴는 전사에서 오직 `4사업부`만 전담).
  2. **감성 부티크 아틀리에 미학 (AI 티 `0%` · 이모지 `0건`)**: 따뜻한 크림·오트밀 린넨(`#FAF7F2`), 미색 종이 카드(`#FFFFFF`), 명조/세리프 헤드라인과 정갈한 본문(`18px`, `line-height: 1.82`), 포레스트 세이지(`#2F5241`) 포인트를 유지하며 가시 화면 내 이모지와 하단 잡다한 정보 섹션을 일절 노출하지 않습니다.
  3. **4단계(Screen 0 → Screen 3) 단일 호흡 구조**:
     - **Screen 0 (`#kfk-peer-growth-editorial`)**: 진심 어린 설립 편지 + 서비스 본질 안내 + 단일 시작 버튼
     - **Screen 1 (`#quiz-section`)**: 한 번에 한 단계씩 집중하는 5단계 스텝업 설문(`Step 1/5` → `Step 5/5`), 병원 뼈나이 유무 분기 및 촬영 경과 시차(`Δt`) 자동 보정(`#kfk-bone-age-interpreter`) 포함
     - **Screen 2 (`#kfk-parent-habit-notebook` / `#kfk-passwordless-club-box`)**: 무비밀번호 이메일 등록(`DreamCompanyCRM.registerMember`) 후 질병관리청(KDCA 2017) 또래 키 백분위 기본 요약 무료 일부 오픈
     - **Screen 3 (`#kfk-latpeed-ebook-slot` · `#kfk-vip-monthly-checkin` · `window.KFK_EBOOK_CONFIG`)**:
       - **Tier 1 (`9,900원` 단건 정밀 리포트 패스 — `https://www.latpeed.com/products/daMaP`)**: `Δt` 시차 보정 최종 성인 예측 키 + 성장 병목 정밀 리포트 + 17p 실전 마스터북 PDF & 30일 체크표 완전 개방
       - **Tier 2 (`19,900원` 6개월 성장속도 트래커 패스 — `https://www.latpeed.com/stores/7Frck`)**: Tier 1 전체 + 향후 6개월간 매월(30일 주기) 연간 성장속도(`cm/yr`) 자동 판독 리포트(`KFK_Paid_VIP`) 완전 개방

---

## 2. 토큰 폭탄 방지 · 금지 홍보 문구 · 잠근 DOM 보호
- **토큰 폭탄 방지**: `src/data/data-bundle.js`, `src/data/research-knowledge-base.json`, `dist/`, `dist-global/` 내부 파일을 직접 전체 열람하거나 수동 편집하지 마십시오.
- **절대 금지 문구 (`0건`)**: `최저가`, `할인율`, `특가`, `폭탄세일`, `lemonsqueezy`.
- **잠근 DOM 보존**: `#kfk-peer-growth-editorial`, `#quiz-section`, `#step-content-1`~`#step-content-5`, `#child-height`, `#child-weight`, `#kfk-bone-age-interpreter`, `#kfk-parent-habit-notebook`, `#kfk-passwordless-club-box`, `#kfk-latpeed-ebook-slot`, `#kfk-vip-monthly-checkin`.

---

## 3. 실서버 빌드 및 `/live-audit` 출구 잠금
- 웹 수정 시 로컬 수정만으로 완료 선언 금지: `node scripts/build.js` (`dist/` 갱신) ➜ `node tests/test_prohibited_words.js` & `node tests/test_compliance.js` `100% PASS` ➜ `git commit & push` (`jjangdol0205/kidsfit.git` `main`) ➜ CDN 전파 대기 후 `python "C:\Users\jjang\.gemini\config\skills\live-audit\run_live_audit.py" kidsfit.co.kr` `ALL PASS` 확인 후 보고합니다.
