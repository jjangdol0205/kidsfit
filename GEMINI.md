# GEMINI.md — 5사업부 KidsFit Korea (`kidsfit.co.kr`) 절대 규칙 (Ground Rules)

이 문서는 `D:\드림컴퍼니\5사업부` 작업 시 루트 `D:\드림컴퍼니\GEMINI.md`와 100% 일관되게 적용되는 하위 규칙입니다. 모든 대화방(`텔레그램`, `hq_main`, `sns_video`, `seo_monetize`, `payment_pg`)은 반드시 루트 `D:\드림컴퍼니\GEMINI.md` 및 `D:\드림컴퍼니\data\hq_ssot_state.json`과 동일한 기준만 답변·수행합니다.

---

## 1. 법인 정체성 · 전담 CEO 봇 · 호스팅 (SSOT)
- **법인명 / 도메인**: 5사업부 (`KFK` 법인, 패시브 자동화) — **`https://kidsfit.co.kr`** (**GitHub Pages**, `jjangdol0205/kidsfit-kr.git` `main` 브랜치)
- **전담 CEO 봇**: **`@Moneyfiityyy_bot`** (`5사업부/.env`의 `TELEGRAM_BOT_TOKEN`) / 그룹 비서실장·감사관: **`@Allcompany1_bot`**
- **핵심 경영 방향 ("또래보다 더 잘 크는 아이" 세련된 단계별 성장 환경 큐레이션 · 무인 패시브)**:
  1. **무료 성장 루틴 허브**: 6단계 성장 문진 + 『키즈핏 부모 성장 응원 수첩』 (`#kfk-parent-habit-notebook`: 수면·단백질·스트레칭 3대 습관 스탬프) + 『또래보다 한 뼘 더 자라는 3대 성장 환경 가이드』 (`#kfk-peer-growth-editorial`) + 진단 결과 큐레이션 브릿지 (`#kfk-result-curation-bridge`)
  2. **국내 제휴 수익 파이프라인**: 쿠팡 파트너스(`AF7865143`) + 링크프라이스(`A100708867`) + 공정위(FTC) 경제적 이해관계 고지 문구 필수 유지 (`lemonsqueezy.com` 혼입 `0건`)
  3. **네이버 클립 영구 무인 자동화**: `@truthofmarket` 채널 `naver_clip_auto_uploader.py` (`.naver-clip-profile`, 사용자 화면 팝업 없이 새벽 백그라운드 일 2편 = 주 14편 자동 발행, `쇼핑 > 상품리뷰` + `쇼핑커넥트` 태그 + `AI 활용` ON + `광고・협찬` ON)

---

## 2. 토큰 폭탄 방지 · 금지 홍보 문구 · 잠근 DOM 보호
- **토큰 폭탄 방지**: `src/data/data-bundle.js` (18만 줄), `src/data/research-knowledge-base.json`, `dist/`, `dist-global/` 내부 파일을 직접 전체 열람하거나 수동 편집하지 마십시오 (`index.html`, `style.css`, `master-briefing.js`, `pinpoint-curator.js`, `curation-catalog.json` 등 대용량 파일은 반드시 `StartLine`~`EndLine` 부분 열람).
- **금지 홍보 문구 (Zero-Tolerance)**: 코드베이스 전체에서 다음 단어를 절대 사용하지 마십시오 (회귀 테스트 즉시 실패):
  - ❌ 금지어: `최저가`, `할인율`, `특가`, `폭탄세일`
  - ✅ 대체 표준어: `혜택가 확인`, `에디터 큐레이션`, `공식 판매처 보러가기`
- **잠근 DOM 보존**: `#step-1`~`#step-6`, `#child-height`, `#child-weight`, `.kf-card-thumb-wrap`, `.kf-spec-chip`, `.kf-milestone-badge`, 모바일 2열 그리드, `#curation-modal`, `#kfk-bone-age-interpreter`, `#kfk-parent-habit-notebook`, `#kfk-peer-growth-editorial`, `#kfk-result-curation-bridge` 보존.

---

## 3. 실서버 빌드 및 `/live-audit` 출구 잠금
- 웹 수정 시 로컬 수정만으로 완료 선언 금지 (`user_global` Rule 1.1 준수): `npm run build` (`dist/` 갱신, 파괴적 `git reset --hard` 금지) ➜ `git commit & push` (`jjangdol0205/kidsfit-kr.git` `main`) ➜ CDN 전파 대기 후 `python "C:\Users\jjang\.gemini\config\skills\live-audit\run_live_audit.py" kidsfit.co.kr` `ALL PASS` 확인 후 보고합니다.
