# GEMINI.md — 5사업부 KidsFit Korea (`kidsfit.co.kr`) 절대 규칙 (Ground Rules)

이 문서는 `D:\드림컴퍼니\5사업부` 작업 시 루트 `D:\드림컴퍼니\GEMINI.md`와 100% 일관되게 적용되는 하위 규칙입니다. 모든 대화방(`텔레그램`, `hq_main`, `sns_video`, `seo_monetize`, `payment_pg`)은 반드시 루트 `D:\드림컴퍼니\GEMINI.md` 및 `D:\드림컴퍼니\data\hq_ssot_state.json`과 동일한 기준만 답변·수행합니다.

---

## 1. 법인 정체성 · 전담 CEO 봇 · 호스팅 (SSOT)
- **법인명 / 도메인**: 5사업부 (`KFK` 법인) — **`https://kidsfit.co.kr`** (**GitHub Pages**, `jjangdol0205/kidsfit.git` `main` 브랜치)
- **전담 CEO 봇**: **`@Moneyfiityyy_bot`** (`5사업부/.env`의 `TELEGRAM_BOT_TOKEN`) / 그룹 비서실장·감사관: **`@Allcompany1_bot`**
- **키 성장 100% 단일 포커스 & '선 진단 ➔ 후 맞춤 처방' 퍼널 원칙**:
  1. **비성장 학습·문해력·지식 UI 제거**: 메인 화면·설문·추천 카드·공개 칼럼에서 국어 독해력/학습/지식 관련 UI를 제거하고 **100% 질병관리청 성장도표·병원 뼈나이·숨은 키 성장 솔루션(수면·영양·바른자세·점프)**에만 집중합니다 (지식 관련 데이터는 리포트 내부 코멘트용으로만 활용).
  2. **홈 순서 정상화**: 최상단 히어로 직후 **`[Step 1: 60초 키 백분위 & 병원 뼈나이 판독기] ➔ [Step 2: 내 아이 병목 맞춤 TOP 3 처방 큐레이션] ➔ [Step 3: 부모 성장 응원 수첩(#kfk-parent-habit-notebook, 스탬프 404 0건) & 3초 무료 정회원]`** 순으로 배치하며, 24종 쇼츠 전체 셀렉트샵은 하단 아코디언/서브탭으로 깔끔히 접습니다.
  3. **Npay 상품 불일치 `0건` & 2단 수익화**: 카드 제목과 실제 이동하는 Npay 상품이 다른 오연결을 절대 금지하며(100% 동일 품목만 Npay 노출, 외에는 일치하는 쿠팡 `AF7865143` / 링크프라이스 `A100708867` 공식 링크 노출), 국내 **래피드(`Latpeed`) 9,900원 유료 PDF 마스터북 실결제 슬롯(`#kfk-latpeed-ebook-slot`, `window.KFK_EBOOK_CONFIG`, `STORE_LIVE_READY: true`, `https://www.latpeed.com/products/daMaP`, 스토어 `https://www.latpeed.com/stores/7Frck`)** 및 공정위 고지문을 유지합니다 (`lemonsqueezy.com` 혼입 `0건`).

---

## 2. 토큰 폭탄 방지 · 금지 홍보 문구 · 잠근 DOM 보호
- **토큰 폭탄 방지**: `src/data/data-bundle.js` (18만 줄), `src/data/research-knowledge-base.json`, `dist/`, `dist-global/` 내부 파일을 직접 전체 열람하거나 수동 편집하지 마십시오 (`1,000줄` 이상 파일은 반드시 `StartLine`~`EndLine` 부분 열람).
- **금지 홍보 문구 (Zero-Tolerance)**:
  - ❌ 금지어: `최저가`, `할인율`, `특가`, `폭탄세일`
  - ✅ 대체 표준어: `혜택가 확인`, `에디터 큐레이션`, `공식 판매처 보러가기`
- **잠근 DOM 보존**: `#step-1`~`#step-6`, `#child-height`, `#child-weight`, `#kfk-bone-age-interpreter`, `#kfk-latpeed-ebook-slot`, `#kfk-parent-habit-notebook`, `#kfk-passwordless-club-box`, `#kfk-peer-growth-editorial`, `#kfk-result-curation-bridge` 보존.

---

## 3. 실서버 빌드 및 `/live-audit` 출구 잠금
- 웹 수정 시 로컬 수정만으로 완료 선언 금지 (`user_global` Rule 1.1 준수): `npm run build` (`dist/` 갱신, 파괴적 `git reset --hard` 금지) ➜ `git commit & push` (`jjangdol0205/kidsfit.git` `main`) ➜ CDN 전파 대기 후 `python "C:\Users\jjang\.gemini\config\skills\live-audit\run_live_audit.py" kidsfit.co.kr` `ALL PASS` 확인 후 보고합니다.
