# 전사 3개 사업부 종합 컨설팅 피드백 마스터 요약 보고서 (Master Synthesis)

**발행 일자**: 2026년 11월 7일  
**대상 사업부**:
- **1사업부 (Division 1)**: **RightSideAlpha × SemiFearGreed** (`https://truthofmarket.com` / `D:\드림컴퍼니\1사업부`)
- **2사업부 (Division 2)**: **KISFIT Global Studio (키즈핏 영문)** (`https://kisfitglobal.com` / `D:\드림컴퍼니\2사업부`)
- **3사업부 (Division 3 / Industry)**: **KidsFit Korea (키즈핏 코리아)** (`https://kidsfit.co.kr` / `D:\드림컴퍼니\3사업부`)

---

## 0. 원본 컨설팅 보고서 6종 파일 인덱스

| 사업부 | 보고서 구분 | 원본 파일 경로 | 분량 | 핵심 초점 |
| :--- | :--- | :--- | :---: | :--- |
| **1사업부**<br>(RightSideAlpha) | **Report 1A** (풀스택·퀀트·CRO 감사) | [consulting_report_rightsidealpha.md](file:///D:/드림컴퍼니/1사업부/consulting_report_rightsidealpha.md) | 664줄 | 아키텍처·퀀트엔진·CRO·코드 레벨 버그 핀포인트(`Modals.js`, `main.js`, `merge_10_promo_shorts.py`) |
| **1사업부**<br>(RightSideAlpha) | **Report 1B** (웹 UX·SNS 마케팅 전략) | [CONSULTING_REPORT_RIGHTSIDEALPHA.md](file:///D:/드림컴퍼니/1사업부/CONSULTING_REPORT_RIGHTSIDEALPHA.md) | 678줄 | 월스트리트 핀테크(Koyfin/Seeking Alpha) 벤치마크, 5대 SNS 바이럴 훅, 숏폼 4대 대본 |
| **2사업부**<br>(KISFIT Global) | **Report 2A** (글로벌 임상·결제·유입 감사) | [consulting_report_kisfit_global.md](file:///D:/드림컴퍼니/2사업부/consulting_report_kisfit_global.md) | 952줄 | 686회 결제 클릭 → 6회 전환(0.87% CVR) 병목 해부, Lemon.js 인앱 오버레이, 크로스 워크스페이스 경로 결합 해체 |
| **2사업부**<br>(KISFIT Global) | **Report 2B** (코드·콩글리시·클린 비디오) | [KIDSFIT_GLOBAL_STRATEGIC_CONSULTING_REPORT.md](file:///D:/드림컴퍼니/2사업부/KIDSFIT_GLOBAL_STRATEGIC_CONSULTING_REPORT.md) | 997줄 | `global-paywall-edition.js:67` 버그, `i18n.js` Top 10 콩글리시 교정, 17개 JS 한글 폴백 제거, 클린 비디오 규격 |
| **3사업부**<br>(KidsFit Korea) | **Report 3A** (글로벌 D2 대비 격차·PG·클라우드) | [CONSULTING_REPORT_KIDSFIT_KOREA.md](file:///D:/드림컴퍼니/3사업부/CONSULTING_REPORT_KIDSFIT_KOREA.md) | 592줄 | D2 대비 4대 기능 격차(소아과 PDF, 다자녀, 14일 루틴, 샘플 모달), Khamis-Roche 이식, 국내 PG(네이버·카카오·토스페이) 및 `cloud-sync.js` |
| **3사업부**<br>(KidsFit Korea) | **Report 3B** (UX/CRO·0원 CPA·클린 쇼츠) | [KIDSFIT_KOREA_STRATEGIC_CONSULTING_REPORT.md](file:///D:/드림컴퍼니/3사업부/KIDSFIT_KOREA_STRATEGIC_CONSULTING_REPORT.md) | 567줄 | '뒷방 진단 라운지' 상단 전면 배치, 테스트 스위트 위생(`index.html:5378`), 0원 무료체험 CPA(EV 64배 증폭), 한국형 숏폼 4대 대본 |

---

## 1. 3개 사업부 한눈에 보는 종합 성적표 & 핵심 병목 비교

| 비교 항목 | 1사업부: RightSideAlpha (`truthofmarket.com`) | 2사업부: KISFIT Global (`kisfitglobal.com`) | 3사업부: KidsFit Korea (`kidsfit.co.kr`) |
| :--- | :--- | :--- | :--- |
| **종합 평가 점수** | **Report 1A**: **94.0 / 100 (S등급)**<br>**Report 1B**: 엔진 **9.6/10**, CRO **6.2/10**, SNS **5.0/10** | **Report 2A**: **96.0 / 100 (A+등급)**<br>**Report 2B**: **72.8 / 100 (B-등급)** (임상 98점 vs UX/CRO 72점) | **Report 3A**: **52.8 / 100** (D2 93.5점 대비 -40.7점)<br>**Report 3B**: **61.9 / 100** (P0·P1 반영 시 92점 도약) |
| **최대 강점 (Core Asset)** | • **\$0/월 정적 서버리스** (`render.yaml` `/api/*` JSON 리라이트, FCP < 300ms)<br>• **듀얼 퀀트 엔진**: 72종목 PW-RSI + \$SMH/\$XLV 26.8년 **24.48% CAGR (349.3배)**<br>• **226/226 Pytest 100% 통과**, 76개 종목 프로그래매틱 SEO + `llms.txt` + Telegra.ph DA 88 백링크 + 58편 쇼츠 마스터링 | • **소아내분비학 최고 수준 수리 엔진** (`growth-engine.js`: US CDC 2000 LMS Box-Cox Z-score + **Khamis-Roche 28행 회귀 매트릭스** $\pm 5.34\text{cm}$)<br>• **89개 임상 Q&A SEO 페이지** + `llms-full.txt`<br>• 유튜브 쇼츠 **Ep.3 구강호흡 1,543회 조회** (일평균 605회) + 26화(78개 MP4) 파이프라인 | • **제로 디펜던시 순수 바닐라 JS SPA** + Pretendard 라이트 클리닉 디자인<br>• **24종 에디토리얼 육아 셀렉트샵** + 10편 숏폼 방영관(`#kf-shorts-showcase-hub`)<br>• 유튜브 `@kidsfit01` **Ep.1 신생아 통잠 1,300회 조회**, **Ep.3 칼슘 비교 450회 조회**<br>• 한국판 20편 클린 쇼츠 파이프라인 |
| **가장 치명적인 1순위 병목** | **무료 7일 Pro 체험 리드 캡처가 코드에서 강제 비활성화됨**<br>• `Modals.js:43` (`display:none !important;`) & `main.js:593` (`if (false && ...)` 하드코딩)<br>• 결제 후 이메일에서 16자리 라이선스 키를 수동 복붙해야 하는 마찰 | **686회 결제 클릭 중 6회만 결제 완료 (0.87% CVR / 99.1% 이탈)**<br>• 2단계 중간 모달 + 외부 탭 리다이렉트(`truthofmarket.lemonsqueezy.com` 브랜드 불일치)<br>• `global-paywall-edition.js:67`의 `false &&` 버그로 샘플 리포트 및 소아과 PDF 프리뷰 비활성화 | **'뒷방 진단 라운지' 배치 & 강제 외부 쇼핑몰 이탈 게이트**<br>• 핵심 AI 진단이 24개 상품 카드 아래(`index.html:1455`)에 숨겨짐<br>• 리포트 열람을 위해 쿠팡 외부 앱 이동을 강제해 **75% 트래픽 증발** (클릭당 기대수익 **18.75원**에 불과) |
| **즉시 수정 시 기대 효과** | • 7일 무료 체험 부활 시 **이메일 리드 전환율 0% → 15%**, 유료 구독 **+500% 상승**<br>• `?payment=success&license_key=` 자동 언락 시 결제 후 이탈 0% | • `Lemon.js` 인앱 오버레이 직결 + 무료 2p 소아과 PDF 리드 마그넷 도입 시 **결제 전환율 0.87% → 3.5~4.5% (4~5배 점프)** | • 0원 무료체험 CPA(3.5만~6.5만원) + 9,900원 네이버/카카오페이 VIP 패스 도입 시 **방문자당 기대가치(EV) 18.75원 → 250~1,200원 (13~64배 상승)** |

---

## 2. [1사업부] RightSideAlpha × SemiFearGreed (`truthofmarket.com`) 상세 피드백 정리

### 2.1 아키텍처 & 퀀트 엔진 진단 (강점)
1. **초경량 정적 서버리스 인프라 (\$0/월)**:
   - Vite 6 번들러 기반 서브-300ms 로딩(`main.js` 75KB, `style.css` 30KB), `render.yaml`에서 `/api/market-pulse` 등 5개 엔드포인트를 정적 JSON으로 리라이트하여 서버 유지비 \$0 및 다운타임 0% 달성.
   - `tests/` 내 **226개 테스트(백엔드 102개 + E2E 124개) 100% 통과**.
2. **이중 퀀트 알파 엔진**:
   - **Track A (RightSideAlpha)**: 72개 미국 대형주 대상 거래량 가중치 `PW-RSI (14D)` + `BBW %` 변동성 압축 스퀴즈 + `OBV/MFI` 기관 매집 추적 (현재 \$CELH 무료 샘플 1종 공개 + VIP 5종 블러 락).
   - **Track B (SemiFearGreed)**: 7-팩터 기술적/매크로 공포·탐욕 모델 기반 **\$SMH(반도체) / \$XLV(헬스케어) 26.8년 바벨 스위칭** — 누적 **+34,830% (349.3배, 연복리 24.48% CAGR)** 달성.
3. **자율 SEO/GEO 및 숏폼 엔진**:
   - 76개 종목별 정적 HTML(`stocks/nvda.html` 등) + 매시간 갱신되는 `llms.txt` + Telegra.ph(DA 88) 백링크 + IndexNow/WebSub 즉시 색인 + 58개 마스터링 완료 숏폼 MP4 보유.

### 2.2 핀포인트 코드 결함 및 UX/CRO 병목 (개선 필수)
1. **[최우선 P0] 7일 무료 Pro 체험 리드 캡처 강제 비활성화 해제**:
   - **위치**: [Modals.js](file:///D:/드림컴퍼니/1사업부/src/components/Modals.js#L43) 및 [main.js](file:///D:/드림컴퍼니/1사업부/src/main.js#L593)
   - **현상**: `#instantVipBridgeBox`에 `style="display:none !important;"`가 걸려 있고, `main.js:593`에서 `if (false && !isProUnlocked() && !localStorage.getItem('rsa_trial_claimed'))`로 단락(short-circuit)되어 있어, \$14.89 결제를 망설이는 방문자의 이메일 리드 수집이 100% 차단됨.
   - **해결**: `false &&` 제거 및 `#instantVipBridgeBox` 표시 복원 → **즉시 이메일 리드 15% 확보 및 7일 시퀀스를 통한 유료 전환 +500% 기대**.
2. **[최우선 P0] 결제 완료 후 16자리 라이선스 키 수동 입력 마찰 제거**:
   - **위치**: [Modals.js](file:///D:/드림컴퍼니/1사업부/src/components/Modals.js#L60) 및 [main.js](file:///D:/드림컴퍼니/1사업부/src/main.js)
   - **현상**: Lemon Squeezy / PayPal 결제 완료 후 구매자가 이메일함을 열어 `XXXX-XXXX-XXXX-XXXX` 키를 복사해 `#licenseInput`에 수동으로 붙여넣어야 함.
   - **해결**: 결제 성공 리다이렉트 URL(`?payment=success&license_key=XXXX`)을 `main.js` 초기화 시 자동 감지하여 1초 만에 `localStorage`(`rsa_pro_unlocked`) 자동 언락 처리.
3. **[P0] 숏폼 프로모션 스크립트 내 구 도메인(`getbreakai.com`) 잔재 수정**:
   - **위치**: [merge_10_promo_shorts.py](file:///D:/드림컴퍼니/1사업부/scripts/merge_10_promo_shorts.py#L87) (87, 131, 153, 197, 219행)
   - **현상**: 내레이션 및 자막 일부가 구 도메인 `getbreakai.com`을 호출하여 브랜드 혼선 및 트래픽 누수 유발.
   - **해결**: 전 구간 `truthofmarket.com`으로 일괄 치환 및 재렌더링.
4. **[P1] 첫 방문자 3초 온보딩 배너 및 \$CELH 무료 샘플 배지 명시**:
   - 처음 접속한 일반 투자자가 퀀트 용어(`PW-RSI`, `BBW %`, `Regime Hysteresis`)에 압도되지 않도록 상단에 **15초 인터랙티브 온보딩 배너(Step 1 → 2 → 3)** 추가.
   - 무료 공개 종목인 **\$CELH** 카드 상단에 `[FREE SAMPLE CANDIDATE — 1 OF 6 ACTIVE IGNITIONS]` 배지를 명시하여 "왜 이 1종목만 보이고 나머지 5개는 잠겨 있는지" 직관적으로 납득시킴.
5. **[P1] SNS 배포 및 ManyChat 자동 DM 퍼널 가동**:
   - 인스타그램(`@rightsidealpha`) 릴스 댓글에 `ALPHA` 또는 `SMH` 입력 시 ManyChat이 실시간 7-Factor 공포·탐욕 스코어카드와 `truthofmarket.com` 딥링크를 자동 DM 발송하도록 연결.

---

## 3. [2사업부] KISFIT Global (`kisfitglobal.com` / 키즈핏 영문) 상세 피드백 정리

### 3.1 임상 성장학 엔진 & 글로벌 SEO 진단 (강점)
1. **소아내분비학 최고 권위 수리 엔진 (`growth-engine.js`, 98/100점)**:
   - US CDC 2000 LMS Box-Cox 비선형 정규화($Z = \frac{(X/M)^L - 1}{L \cdot S}$) 완벽 구현.
   - 골연령 X-ray 없이도 성인키를 90% 신뢰구간($\pm 5.34\text{cm}$)으로 예측하는 **Khamis-Roche 28행 회귀 계수 매트릭스**(4.0~17.5세 반년 단위) + 5축 두뇌 인지 밸런스(Brain LQ) 탑재.
2. **89개 임상 Q&A 프로그래매틱 SEO & 유튜브 숏폼 바이럴 검증**:
   - `qna/` 내 89개 정적 임상 Q&A 페이지 + `llms.txt` / `llms-full.txt` 구축.
   - 공식 유튜브(`@kisfitglobal`) 26화 편성 완료 — 특히 **Ep.3 구강호흡(`Sx22K09QvAk`)이 1,543회 조회(일평균 605.42회, 245배 바이럴 멀티플)**를 기록하며 미국/글로벌 학부모 타깃 후킹 입증.

### 3.2 핀포인트 코드 결함, 콩글리시 교정 및 결제 퍼널 병목 (개선 필수)
1. **[최우선 P0] `global-paywall-edition.js:67` 단 1줄 버그 수정 (샘플 리포트 & 소아과 PDF 복원)**:
   - **위치**: [global-paywall-edition.js](file:///D:/드림컴퍼니/2사업부/src/js/global-paywall-edition.js#L67)
   - **현상**: `if (false && (document.getElementById('kfg-sample-report-modal') || ...))`로 인해 만 9세 Liam 샘플 리포트 미리보기 모달과 소아과 제출용 2페이지 EHR PDF 컨테이너 주입이 비활성화되어 있으며, 로컬 테스트 스위트(`verify-phase2-features.js`) 실패의 직접 원인임.
   - **해결**: `false &&` 즉시 제거 → **27/27 테스트 스위트 100% 통과 복원 및 결제 전 샘플 미리보기 활성화**.
2. **[최우선 P0] 99.1% 결제 이탈(686회 클릭 → 6회 결제, 0.87% CVR) 해결 — `Lemon.js` 인앱 오버레이 직결**:
   - **위치**: [global-paywall-edition.js](file:///D:/드림컴퍼니/2사업부/src/js/global-paywall-edition.js#L2528) (`openGlobalCheckoutModal`)
   - **현상**: 사용자가 `Unlock Full Report ($8.99)` 클릭 시 (1) 자체 중간 모달(`#kidsfit-global-checkout-modal`)이 뜨고, (2) 다시 클릭하면 외부 브라우저 탭(`truthofmarket.lemonsqueezy.com`)으로 리다이렉트됨. 육아 서비스 결제창에 주식 터미널 도메인(`truthofmarket`)이 노출되어 미국 부모가 피싱/오류로 오인하고 이탈.
   - **해결**: 중간 모달을 거치지 않고 **1클릭 시 `window.LemonSqueezy.Url.Open(checkoutUrl)` 인앱 오버레이 모달**을 즉시 호출하며, 스토어 표기명을 `KISFIT Global Pediatric Lab`으로 통일. 또한 하드 페이월 직전에 **"Free 2-Page Pediatrician Consultation Summary PDF"** 이메일 리드 마그넷을 추가해 미결제 이탈자의 18~25%를 이메일로 회수.
3. **[P0] 상단 의료 신뢰 배지(CDC/WHO/AAP) 복원 및 3초 진단 진입 카드 배치**:
   - **위치**: [index.html](file:///D:/드림컴퍼니/2사업부/index.html#L188) (`style="display: none;"` 제거)
   - **현상**: 헤더의 CDC/WHO/AAP 신뢰 배지와 히어로 진단 CTA가 `display: none`으로 숨겨져 있고, 최상단에 유튜브 쇼츠 토픽 바(`#kfg-shorts-instant-topic-bar`)가 먼저 노출되어 일반 검색 유입자의 신뢰를 떨어뜨림.
   - **해결**: 신뢰 배지 상시 노출, 쇼츠 토픽 바는 히어로 하단으로 이동, 모바일 첫 화면(550px 이내)에 3항목(이름·성별·생년월일) 즉시 시작 카드 배치.
4. **[P1] 설문 이탈 방지 (Step 2 최근 6개월 키 성장치 폴백 버튼 & Step 4 압축)**:
   - **위치**: [onboarding-wizard.js](file:///D:/드림컴퍼니/2사업부/src/js/onboarding-wizard.js#L168)
   - **현상**: 최근 6개월간 정확한 성장치(인치/cm)를 모르는 부모가 Step 2에서 이탈하며, Step 4에 16개 체크박스가 한꺼번에 나열됨.
   - **해결**: Step 2에 1탭 `[Not sure — Use CDC Age Average (1.2 in)]` 폴백 버튼 추가, Step 4를 4개 핵심 카테고리 아코디언으로 압축.
5. **[P1] 미국 학부모 신뢰를 깨뜨리는 Top 10 콩글리시·문화적 표현 교정 (`src/js/i18n.js`)**:
   - `i18n.js:486`: 내부 개발자 용어 유출(`"1:1 Live Antigravity AI Synthesis"`) → `"Clinical Notes & Concerns (1:1 Pediatric AI Synthesis)"`로 즉시 교체.
   - `i18n.js:431, 432`: 군대식 24시간제 표기(`21:30`, `22:30`) → 미국 표준 12시간제(`9:30 PM`, `10:30 PM`)로 교체.
   - `i18n.js:446`: 한국식 식문화(`"over rice"`) → `"over balanced protein and vegetables"`로 교체.
   - `i18n.js:458`: 한국식 태권도 편향(`"Taekwondo"`) → `"youth sports (soccer, gymnastics, martial arts)"`로 교체.
   - `i18n.js:475`: 한국식 사교육 표현(`"tutoring content"`) → `"classroom lessons and independent homework"`로 교체.
   - `i18n.js:324, 333, 418`: `"K-GROWTH AI™"` → `"KISFIT Clinical Auxology Engine™"`로 교체.
   - 추가로 17개 헬퍼 JS 파일에 남아 있는 한글 폴백 문자열(3,196줄)을 영문 기본값으로 정리.
6. **[P1] 숏폼 비디오 파이프라인 독립화 및 용량 최적화**:
   - [send_daily_6am_shorts_reels.js](file:///D:/드림컴퍼니/2사업부/scripts/send_daily_6am_shorts_reels.js#L997)이 1사업부 폴더(`D:\드림컴퍼니\1사업부\...\render_dual_yt_ig_cta.py`)를 하드코딩 참조하는 결합을 끊고 `D:\드림컴퍼니\2사업부\scripts\` 내부로 로컬 내재화.
   - 텔레그램 봇 50MB 제한에 근접한 4개 에피소드(Ep.6 44.1MB, Ep.10 46.2MB, Ep.15 47.9MB, Ep.19 44.6MB)를 FFmpeg `CRF-23`으로 재인코딩(25MB 이하).
   - 상하 검은 여백(Letterbox)과 흰색 자막 박스를 쓰던 구형 스크립트(`generate_global_tiktok_insta_videos.py`)를 영구 퇴역시키고, `flow_shorts_merger.py`에 2.5초 클린 엔딩 컷 카드(`kisfitglobal.com` 알약 배지)를 표준 적용.

---

## 4. [3사업부] KidsFit Korea (`kidsfit.co.kr` / `D:\드림컴퍼니\3사업부`) 상세 피드백 정리

### 4.1 아키텍처 & 콘텐츠 자산 진단 (강점)
1. **제로 디펜던시 SPA & 감성 에디토리얼 셀렉트샵**:
   - 외부 런타임 의존성 없이 순수 Vanilla JS + Pretendard 가변 웹폰트 + 라이트 클리닉 테마로 구현.
   - 29CM·오늘의집 감성의 24종 맞춤 육아템 셀렉트샵과 10편의 숏폼 방영관(`#kf-shorts-showcase-hub`)이 결합되어 높은 시각적 완성도 보유.
2. **한국 학부모 타깃 유튜브 쇼츠(`@kidsfit01`) 초기 후킹 검증**:
   - 총 6편 업로드만으로 누적 2,250회 조회 달성 — **Ep.1 신생아 통잠(`0thQOn3ZhsY`) 1,300회 조회**, **Ep.3 아기 칼슘 비교(`Yee_Xrh-CeM`) 450회 조회**로 맘카페·학부모 관심사 타깃팅 적중 증명.

### 4.2 테스트 위생, 알고리즘 격차, UX/CRO 및 수익화 병목 (개선 필수)
1. **[최우선 P0] 테스트 스위트 100% 통과를 막는 단 2건의 위생 결함 수정**:
   - **[결함 A]** [index.html](file:///D:/드림컴퍼니/3사업부/index.html#L5378) 5,378행의 쿠팡 안내 툴팁 문구에 프로젝트 금지어(`최*가`)가 남아 있어 [tests/e2e-taller-bio.test.js](file:///D:/드림컴퍼니/3사업부/tests/e2e-taller-bio.test.js)가 239/240에서 단 1건 실패함 → 대체 표준어(`혜택가 확인`)로 치환 시 **즉시 240/240 (100%) ALL PASS**.
   - **[결함 B]** [tests/domain-monetization.test.js](file:///D:/드림컴퍼니/3사업부/tests/domain-monetization.test.js#L370) 370행이 한국 도메인(`kidsfit.co.kr`) 대신 영문 도메인(`kisfitglobal.com`)을 단언하여 실패 → `kidsfit.co.kr`로 교정 및 [tests/run-all.js](file:///D:/드림컴퍼니/3사업부/tests/run-all.js)에서 2사업부 영문 전용 테스트 8종 격리.
2. **[최우선 P0] '뒷방 진단 라운지' 함정 탈출 & 상단 신뢰 배지(KDCA) 복원**:
   - **위치**: [index.html](file:///D:/드림컴퍼니/3사업부/index.html#L184) (신뢰 바 `display: none`) 및 [index.html](file:///D:/드림컴퍼니/3사업부/index.html#L1455) (`#kf-backroom-diagnosis-lounge`)
   - **현상**: 방문자가 사이트에 들어왔을 때 핵심 무기인 '1분 소아 성장 AI 진단'이 24개 쇼핑몰 상품 카드 맨 아래(1,455행)에 숨겨져 있어 일반 쇼핑몰로 오인하고 3초 만에 이탈함.
   - **해결**: 상단 질병관리청(KDCA) 2017 성장도표·보건복지부 K-DST 기준 배지의 `display: none`을 해제하고, 1분 무료 진단 진입 라운지를 히어로 영역 최상단(Above-the-fold)으로 전면 배치.
3. **[최우선 P0] 유튜브 쇼츠(`@kidsfit01`) 고정 댓글 UTM 링크 전면 부착**:
   - 1,300회 조회된 신생아 통잠 영상 등 기존 숏폼에 클릭 가능한 고정 댓글(Pinned Comment) UTM 링크(`https://kidsfit.co.kr/?utm_source=youtube_shorts&utm_medium=pinned_comment`)를 즉시 등록하여 유입 단절 해소.
4. **[핵심 P1] 수익화 패러다임 전환 — 강제 외부 이탈 게이트 철폐 + 0원 무료체험 CPA + 국내 간편결제(PG)**:
   - **현상**: 리포트 2~7장을 보려면 쿠팡 파트너스 링크를 강제로 클릭하게 만들어(`index.html:5004-5114`), 사용자의 **75% 이상이 쿠팡 앱으로 넘어간 뒤 복귀하지 않고 증발**함. 게다가 제휴 클릭 1회당 기대수익(EV)은 **약 18.75원**에 불과함.
   - **해결 1 (인라인 고맥락 큐레이션)**: 강제 외부 이탈 락을 해제하여 진단서 완독률을 100%로 높이고, 각 진단 챕터 하단에 결핍 증상(수면 부족 → 마그네슘/트램폴린, 편식 → 구연산 칼슘/멀티구미)과 직결된 맞춤 상품 2~3종을 인라인 배치해 자발적 구매 전환율(3.8%+)을 유도.
   - **해결 2 (0원 무료체험 CPA 리드 폼 탑재 — EV 64배 증폭)**: 한국 학부모가 거부감 없이 신청하는 **100% 0원 무료체험 CPA 4대장**(0~2세 웅진북클럽/핀덴베베, 3~6세 밀크T아이/윙크, 7~12세 아이스크림홈런/엘리하이, 성장클리닉 무료 상담 — 건당 정산단가 **35,000~65,000원**) 리드 수집 폼을 리포트 내에 탑재하여 방문자당 기대가치(EV)를 **18.75원 → 1,200원(64배)**으로 증폭.
   - **해결 3 (국내 간편결제 PG 9,900원 VIP 패스)**: 토스페이먼츠/포트원을 통해 **네이버페이·카카오페이·토스페이 1초 결제(9,900원)**를 연동하여 소아과 제출용 요약 PDF + 다자녀 무제한 관리 + 14일 루틴 영구 저장을 제공(제휴 클릭 무료 열람과 이원화).
5. **[핵심 P1] 글로벌 벤치마크(2사업부)의 5대 엘리트 기능 국내 역이식(Back-Porting)**:
   - ① **Khamis-Roche 28행 회귀 매트릭스 이식** ([src/js/growth-engine.js](file:///D:/드림컴퍼니/3사업부/src/js/growth-engine.js)): 현재 단순 Tanner 부모 평균키($\pm 8.5\text{cm}$) 및 $L=1.0$ 선형 근사에 머물러 있는 엔진에 D2의 Khamis-Roche 알고리즘($\pm 5.34\text{cm}$)과 정밀 KDCA Box-Cox LMS($L \neq 1$) 테이블을 이식.
   - ② **소아청소년과 진료 제출용 1장 요약 진단서 PDF (Doctor Consultation Sheet)**: 병원 방문 시 의사에게 바로 제시할 수 있는 A4 1장 임상 요약 인쇄 뷰 이식.
   - ③ **다자녀 프로필 스위처 (`kidsfit_child_profiles_v1`)**: 첫째·둘째·셋째 자녀 데이터를 탭 하나로 전환 비교.
   - ④ **14일 인터랙티브 실천 루틴 체크리스트 (`kidsfit_routine_14d_v1`)**: 밤 10시 취침·무소음 트램폴린 등 14일 체크리스트 위젯 이식.
   - ⑤ **만 9세 민우(Liam) 인터랙티브 샘플 리포트 10초 미리보기 모달**: 설문 시작 전 결과물 수준을 미리 확인시켜 설문 완주율 +35% 견인.
6. **[P1] 모바일 설문 UX 디테일 & 클라우드 영속성(`cloud-sync.js`) 구축**:
   - 키/체중 입력란에 `inputmode="decimal"` 추가(모바일 숫자 키패드 자동 호출) 및 Step 2 최근 6개월 성장치에 `[잘 모름 — 월령 평균 자동 적용]` 폴백 버튼 추가.
   - D2의 `cloud-sync.js`(Supabase 연동)를 D3에 이식하여 카카오톡 인앱 브라우저 종료 시에도 진단 결과와 다자녀 프로필이 증발하지 않도록 보호 + 카카오 알림톡 기반 **30일 성장 속도(Velocity) 재측정 리인게이지먼트** 구축.

---

## 5. 전사 통합 우선순위 액션 체크리스트 (Master Action Checklist)

### 🚨 Phase 0: 24시간 이내 즉각 실행 가능한 Quick Wins (코드 몇 줄로 성과 급증)
- [ ] **[1사업부]** `Modals.js:43` (`display:none`) 및 `main.js:593` (`false &&`) 제거 → **7일 무료 Pro 이메일 리드 캡처 즉시 복원**
- [ ] **[1사업부]** `main.js`에 `?payment=success&license_key=` URL 파라미터 자동 감지 언락 추가 → **수동 라이선스 키 복붙 마찰 제거**
- [ ] **[1사업부]** `scripts/merge_10_promo_shorts.py` 내 구 도메인(`getbreakai.com`) 5곳을 `truthofmarket.com`으로 일괄 수정
- [ ] **[2사업부]** `src/js/global-paywall-edition.js:67`의 `false &&` 제거 → **샘플 리포트 미리보기 & 소아과 PDF 컨테이너 복원 (27/27 테스트 통과)**
- [ ] **[2사업부]** `index.html:188`의 CDC/WHO/AAP 메디컬 신뢰 배지 `display: none` 해제 및 `src/js/i18n.js` Top 10 콩글리시(`Antigravity AI`, `21:30`, `over rice`, `Taekwondo`) 즉시 교정
- [ ] **[3사업부]** `index.html:5378` 금지어를 대체 표준어(`혜택가 확인`)로 수정 및 `tests/domain-monetization.test.js:370` 도메인 단언 수정 → **E2E 테스트 100% 그린 빌드 달성**
- [ ] **[3사업부]** `index.html:184` 질병관리청(KDCA) 신뢰 배지 `display: none` 해제 및 유튜브 `@kidsfit01` 숏폼 고정 댓글에 UTM 진단 링크 부착

### ⚡ Phase 1: 1~2주 차 핵심 전환율(CRO) & 알고리즘 업그레이드
- [ ] **[1사업부]** 첫 방문자용 15초 인터랙티브 온보딩 배너 + `$CELH` 무료 샘플 명시 배지 추가 + 인스타 ManyChat(`ALPHA`/`SMH`) 자동 DM 연동
- [ ] **[2사업부]** 2단계 중간 결제 모달을 제거하고 **1클릭 `Lemon.js` 인앱 오버레이 결제창** 직결 + 미결제 이탈자용 **무료 2p 소아과 요약 PDF 이메일 리드 마그넷** 도입
- [ ] **[2사업부]** `send_daily_6am_shorts_reels.js:997`의 1사업부 경로 의존성 분리 및 4개 대용량 쇼츠(Ep 6, 10, 15, 19) FFmpeg `CRF-23` 압축
- [ ] **[3사업부]** `#kf-backroom-diagnosis-lounge`(AI 진단 라운지)를 히어로 영역 최상단으로 전면 배치 + 모바일 `inputmode="decimal"` 및 Step 2 `[월령 평균 자동 적용]` 버튼 탑재
- [ ] **[3사업부]** 2사업부의 **Khamis-Roche 28행 회귀 매트릭스($\pm 5.34\text{cm}$)**, **만 9세 샘플 리포트 모달**, **소아과 제출용 1장 요약 PDF**, **다자녀 스위처**, **14일 루틴 체크리스트**를 3사업부(`D:\드림컴퍼니\3사업부`)로 역이식

### 🚀 Phase 2: 3~4주 차 수익 다각화 & 장기 리텐션 생태계 구축
- [ ] **[3사업부]** **0원 무료체험 CPA 리드 수집 폼**(웅진북클럽·핀덴베베·밀크T·홈런·성장클리닉) 탑재 + **토스페이먼츠/포트원(네이버·카카오·토스페이 9,900원 VIP 패스)** 이원화 도입
- [ ] **[3사업부]** `cloud-sync.js`(Supabase 이중 저장소) 이식 + **카카오 알림톡 30일 성장 속도(Velocity) 정기 재진단 퍼널** 구축
- [ ] **[전 사업부 공통]** 클린 비디오 마스터링 규격(본문 상하단 배너 0%, 무배경 외곽선 중앙 자막, 마지막 2.5초 슬레이트 엔딩 컷 도메인 알약 배지) 기반 일일 숏폼 자동 발행 지속 가동
