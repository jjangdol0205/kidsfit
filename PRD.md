# PRD.md — 키즈핏(KidsFit) 앱 설계도 및 명세서

이 문서는 AI가 전체 코드베이스를 매번 뒤지지 않고도 **화면 흐름, 데이터 구조(Schema), 가드레일, 파일별 담당 역할**을 즉시 파악하도록 돕는 기준 설계도입니다.

---

## 1. 핵심 기능 및 화면 흐름 (User Flow)

사용자가 홈페이지(`kidsfit.co.kr`)에 접속하여 진단받고 제휴 스토어로 이동하기까지의 전체 흐름은 아래 5단계로 작동합니다.

1. **[화면 1] 상단 헤더 & 히어로 진입 (`Header & Hero`)**
   - 다크/라이트 테마 전환(`src/js/theme-switcher.js`), 한/영 및 단위(cm·kg ↔ ft/in·lbs) 전환(`src/js/i18n.js`).
   - 방문자 신뢰 배지 및 메인 진단 시작 버튼 배치.
2. **[화면 2] 6단계 소아 성장·발달 맞춤 문진 (`Onboarding Wizard`)**
   - 담당 파일: `src/js/onboarding-wizard.js`
   - **Step 1**: 생년월일(DOB) 및 성별 입력 → 월령/발달 단계 자동 계산 (`syncDobAndAutoStage`)
   - **Step 2**: 아이 현재 키·몸무게 입력 (단위 변환 연동)
   - **Step 3**: 부모 키 입력 → 유전적 예상 키(MPH) 실시간 프리뷰 배지 표시
   - **Step 4 ~ 6**: 수면·식습관·두뇌/소근육 발달 체크리스트 입력 (`syncAgeAppropriateQuizOptions`)
3. **[화면 3] 4대 영역 정밀 처방 브리핑 (`Master Briefing & Engines`)**
   - 담당 파일: `src/js/master-briefing.js`, `src/js/growth-engine.js`, `src/js/endocrinology-engine.js`, `src/js/neuro-cognitive-matrix.js`, `src/js/biomechanics-studio.js`
   - 질병관리청(KDCA) 성장도표 및 K-DST 발달 지표 기반 백분위·예상 성장 곡선·맞춤 솔루션 도출.
4. **[화면 4] 24종 에디터 큐레이션 그리드 & 상세 비교 모달 (`Curation & Modal`)**
   - 담당 파일: `index.html`, `src/js/app.js`, `src/js/pinpoint-curator.js`, `src/data/curation-catalog.json`
   - **모바일 2열 상품 카드**: 썸네일(`.kf-card-thumb-wrap`), 노써치식 핵심 스펙 칩 3종(`.kf-spec-chip`), 베이비빌리식 월령 마일스톤 배지(`.kf-milestone-badge`), `에디터 큐레이션 & 혜택가 확인 (진단 무료) →` CTA.
   - **상세 모달(`#curation-modal`)**: 모바일 바텀 드로어 핸들(`.kf-drawer-handle`), 노써치식 4대 축 스코어카드(성분 안전성·흡수율·편의성·가성비), 29CM식 에디터 한줄평(`.kf-curator-quote`), 오늘의집식 선배맘 실구매 인증 리뷰.
5. **[화면 5] 공식 판매처 이동(Outbound Referral) & 복귀 브릿지 (`Footer & Outbound`)**
   - 담당 파일: `src/js/app.js`, `src/js/monetization.js`
   - 플랫폼별 맞춤 스티키 CTA(`🚀 쿠팡 로켓 공식 판매처 보러가기`, `🌿 iHerb 안심 직구처 보러가기`, `📚 예스24 공식 서점 보러가기`) 클릭 시 연결 중 상태 표시(`⏳ 공식 판매처 연결 중...`) → 새 탭 스토어 이동 → 복귀 시 진단 라운지 안내 토스트 배너 표시.

---

## 2. 데이터 스키마 (Data Schema — 저장소별 항목 정의)

데이터가 어디에 어떤 열(필드) 이름으로 저장되는지 구분합니다.

### A. 브라우저 임시저장소 (`localStorage` — 클라이언트 상태)
| Key 이름 | 저장되는 정보 (엑셀 열 구조) | 담당 파일 |
| :--- | :--- | :--- |
| `taller_unit` | `'metric'` (cm/kg) 또는 `'imperial'` (ft·in/lbs) | `src/js/i18n.js` |
| `taller_theme` | `'dark'` 또는 `'light'` 테마 상태 | `src/js/theme-switcher.js` |
| `kidsfit_growth_logs` | 날짜별 아이 키(`heightCm`), 몸무게(`weightKg`), 백분위 기록 배열 | `src/js/growth-tracker.js` |
| `kidsfit_unlocked` | 제휴 스토어 방문/진단 잠금 해제 상태 플래그 | `src/js/app.js` |

### B. 정적 큐레이션 상품 DB (`src/data/curation-catalog.json`)
총 24개 큐레이션 상품이 아래 필드로 구성됩니다:
- `id`: 상품 고유 식별자 (예: `"item-01"`)
- `category`: 카테고리 (`"nutrition"`, `"play"`, `"book"`, `"sleep"` 등)
- `title` / `subtitle`: 상품명 및 한 줄 요약 (**주의: `최저가`, `할인율` 단어 절대 포함 금지**)
- `specChips`: 노써치 스타일 핵심 스펙 요약 배열 (3개)
- `milestoneBadges`: 베이비빌리 스타일 권장 월령·발달 단계 배지 배열 (2개)
- `scorecard`: 4대 축 정량 평가 점수 객체 (`safety`, `absorption`, `convenience`, `value`)
- `curatorQuote`: 29CM 스타일 에디터 선정 이유 코멘트
- `verifiedReview`: 오늘의집 스타일 실구매 부모 리뷰 및 자녀 월령 태그
- `affiliateUrl` / `platform`: 제휴 이동 URL 및 플랫폼 구분 (`coupang`, `iherb`, `yes24`)

### C. 외부 클라우드 / 서버 API (`server.js` & `functions/`)
- **텔레그램 실시간 알림 브릿지**: 방문자 진단 완료, 제휴 버튼 클릭, 문의 접수 시 `@kidsfittbot`으로 텔레메트리 이벤트 전송 (`scripts/telegram-notify.js`).
- **코호트 통계/DB 대시보드**: `src/js/user-cohort-db.js` 및 `src/js/admin-db-dashboard.js`를 통해 익명화된 성장 통계 조회.

---

## 3. 가드레일 (Guardrails — 절대 깨뜨리면 안 되는 약속)
1. **제휴 태그 고정**: 쿠팡(`AF7865143`), 링크프라이스(`A100708867`) 코드 변경 금지.
2. **금지어 0건 유지**: `최저가`, `할인율` 단어 사용 즉시 테스트(`tests/e2e-taller-bio.test.js`) 실패함. 반드시 `혜택가 확인` 사용.
3. **모바일 2열 그리드 유지**: 768px 이하 모바일 화면에서 상품 카드 2열(`repeat(2, 1fr)`) 레이아웃 유지.
4. **원본/빌드 분리**: 항상 `index.html` 및 `src/` 아래 원본을 수정한 뒤 `npm run build`를 실행해 `dist/`에 반영할 것.

---

## 4. 모듈 및 파일별 역할 지도 (어디를 고쳐야 하는가?)

AI에게 작업을 지시할 때 아래 표에서 **해당하는 파일 딱 1~2개만 `@파일명`으로 지정**하세요.

| 수정하고 싶은 화면 / 기능 | 지정할 파일 (`@파일명`) | 비고 (주의사항) |
| :--- | :--- | :--- |
| **상단 메뉴바(Header) / 메인 레이아웃 / 푸터(Footer)** | `@index.html`, `@src/css/style.css` | `index.html`이 크므로 해당 섹션만 부분 검색 후 수정 |
| **6단계 문진 입력창 / 유효성 검사 / 프리셋** | `@src/js/onboarding-wizard.js` | Step 1~6 ID(`#step-1`~`#step-6`) 유지 필수 |
| **큐레이션 카드 클릭 / 상세 모달 / 제휴 이동 버튼** | `@src/js/app.js`, `@index.html` | `#curation-modal` 및 제휴 CTA 문구 규칙 준수 |
| **24종 추천 상품 문구 / 스펙 칩 / 스코어카드 데이터** | `@src/data/curation-catalog.json` | 수정 후 `index.html` 정적 카드와 동기화 확인 |
| **아이 성장 백분위 계산 / 내분비·두뇌 처방 로직** | `@src/js/growth-engine.js`, `@src/js/master-briefing.js` | 계산 수식(LMS/MPH) 임의 변경 금지 |
| **모바일 화면 글자 크기 / 카드 여백 / 모달 디자인** | `@src/css/style.css` | `@media (max-width: 768px)` 모바일 규칙 확인 |
| **블로그·지식iN Q&A 랜딩 페이지** | `@qna/` 폴더 내 개별 HTML | 빌드 시 `dist/qna/`로 자동 복사됨 |
