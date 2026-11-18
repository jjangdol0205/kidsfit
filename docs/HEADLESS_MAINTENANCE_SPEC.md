# KidsFit.co.kr (5사업부) 부티크 소아성장 아틀리에 & 무인 자동 운용 규격서 (Headless Maintenance Spec)

- **문서 번호**: DC-DIV5-HEADLESS-SPEC-2026-v2.0 (2026-11-18 총 회장님 최종 헌장 반영)
- **관리 주체**: Dream Company 본사 시스템 총괄 / 5사업부(`KFK`) 자동화 엔진
- **적용 대상**: `kidsfit.co.kr` (`D:\드림컴퍼니\5사업부`) 웹사이트, 빌드 파이프라인 및 순수 유료 2등급(`Latpeed`) 디지털 패스 엔진
- **운용 철학**: **100% 무인화(Zero-Labor Headless Auto-Pilot) + 제휴 쇼핑 전면 철거(`0건`) + 순수 유료 2등급 아틀리에 운영**

---

## 1. 핵심 운용 원칙 (Core Principles)

1. **제휴 상품 100% 철거 (`0건` 엄수)**:
   - 쇼핑몰 인상을 주는 쿠팡 파트너스, 네이버 브랜드커넥트(`Npay`), 링크프라이스, 아이허브 제휴 링크 및 공정위 제휴 수수료 배너를 `kidsfit.co.kr` 메인 및 `/qna/*.html` 전 페이지에서 100% 배제합니다 (실물 맞춤 제휴는 전사에서 오직 `4사업부`만 전담).
2. **단일 호흡 4단계(Screen 0 → Screen 3) 스텝업 아틀리에**:
   - 따뜻한 크림·린넨(`#FAF7F2`) 톤과 세리프 타이포그래피 기반(이모지 `0건`, 하단 잡다한 정보 `0건`, 최소 법적 약관 푸터 1줄 유지).
   - 설립 취지 편지(`Screen 0`) ➜ 5단계 스텝업 설문 및 병원 뼈나이 경과 시차(`Δt`) 보정(`Screen 1`) ➜ 무비밀번호 이메일 등록(`Screen 2`) ➜ 기본 백분위 무료 일부 오픈 & 래피드(`Latpeed`) 유료 2등급 차등 개방(`Screen 3`).
3. **래피드(`Latpeed`) 순수 유료 2등급 결제 무결성 (`window.KFK_EBOOK_CONFIG`)**:
   - `STORE_LIVE_READY: true`
   - **Tier 1 (`9,900원` 단건 정밀 리포트 패스)**: `https://www.latpeed.com/products/daMaP` (`Δt` 보정 성인 예측 키 + 병목 정밀 리포트 + 17p 마스터북 PDF & 30일 체크표)
   - **Tier 2 (`19,900원` 6개월 성장속도 트래커 패스 · `KFK_Paid_VIP`)**: `https://www.latpeed.com/stores/7Frck` (`latpeed_kfk_live.json`에 `tier2_19900_url` 등록 시 빌드 타임 자동 주입)
4. **금지어 제로 톨러런스 (Zero-Tolerance Guardrail)**:
   - 절대 금지어: `최저가`, `할인율`, `특가`, `폭탄세일`, `lemonsqueezy` (`0건` 엄수).
5. **독립 텔레그램 봇 격리**:
   - 5사업부 전용 알림은 `@Moneyfiityyy_bot`으로만 격리 라우팅합니다.
