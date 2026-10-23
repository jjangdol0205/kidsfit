const fs = require('fs');
const path = require('path');
const { getTelegramConfig, telegramApiRequest } = require('./telegram-notify');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendText(cfg, text) {
  return telegramApiRequest(cfg.botToken, 'sendMessage', {
    chat_id: cfg.chatId,
    text,
    disable_web_page_preview: true,
  });
}

async function main() {
  const cfg = getTelegramConfig();
  if (!cfg.isConfigured || !cfg.chatId) {
    throw new Error('Telegram config missing');
  }

  // 1) 종합 완료 보고 & 수정 가이드
  const msg1 =
    `🎉 [보고] 공식 도메인(https://kidsfit.co.kr) 연결 · 첫화면 정리 · 블로그/카페 직접 수정 완료!\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `1️⃣ 홈페이지(https://kidsfit.co.kr) 첫 화면 정리 & 보고서 하단 이동 완료\n` +
    `• 가비아 도메인 + 렌더(Render) SSL 연결 정상 작동 확인 완료!\n` +
    `• 첫 화면(Hero)에 있던 논문 편수·자가학습 배지를 모두 지워서 첫 화면을 아주 깔끔하게 정리했습니다.\n` +
    `• 논문 자가학습 현황 및 학술 출처(PubMed/DOI) 목록은 진단 완료 후 나오는 [결과 보고서 맨 끝 하단]에 깔끔하게 배치했습니다.\n\n` +
    `2️⃣ 네이버 카페 & 네이버 블로그 직접 접속 수정 완료\n` +
    `• ☕ 공식 카페 (https://cafe.naver.com/moneyfitlab):\n` +
    `  - 카페 대문(Front Gate) 바로가기 버튼 ➔ https://kidsfit.co.kr 변경 완료\n` +
    `  - 카페 전체 환영 공지글(#24) · 무료 워크지 3종 나눔글(#25) · 매월 1일 리포트 인증글(#26) 본문 링크 ➔ https://kidsfit.co.kr 교체 완료\n` +
    `• 📝 공식 블로그 (https://blog.naver.com/expertise333):\n` +
    `  - 블로그 프로필 소개글 & PC 타이틀 스킨 ➔ https://kidsfit.co.kr 변경 완료\n` +
    `  - 1일차 칼럼 게시글(#224450570229, 3,236자) 본문 내 모든 링크 ➔ https://kidsfit.co.kr 직접 수정·저장 완료\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 3️⃣ 대표님이 직접 수정하실 3곳 (인스타 · 쓰레드 · 클립)\n` +
    `바로 아래에 [문구만 들어있는 단독 말풍선 5개]를 이어서 보내드립니다. 꾹 눌러서 복사해 붙여넣으시면 1분 만에 끝납니다!\n\n` +
    `① 인스타그램 (@kids_fit1)\n` +
    `• [프로필 편집] ➔ [링크] 클릭 ➔ 아래 [1번 말풍선] 복사해서 넣기\n` +
    `• [프로필 편집] ➔ [소개(Bio)] 클릭 ➔ 아래 [2번 말풍선] 복사해서 넣기\n\n` +
    `② 쓰레드 (@kids_fit1)\n` +
    `• [프로필 편집] ➔ [링크] 클릭 ➔ 아래 [1번 말풍선] 복사해서 넣기\n` +
    `• [프로필 편집] ➔ [소개(Bio)] 클릭 ➔ 아래 [2번 말풍선] 복사해서 넣기\n` +
    `• 이미 올리신 1화 게시글의 [2번째 이어쓰기 댓글(링크 댓글)] ➔ 기존 댓글 삭제 후 아래 [3번 말풍선] 복사해서 달기\n` +
    `  (※ 내일 아침 6시부터 텔레그램으로 자동 발송되는 2~5화 웹툰도 모두 kidsfit.co.kr로 자동 변경 완료되었습니다!)\n\n` +
    `③ 네이버 클립 (Naver Clip)\n` +
    `• 영상 업로드 시 우측/하단 [+ 정보 스티커(링크)] 클릭 ➔ 아래 [1번 말풍선] 입력 후 화면 하단 배치\n` +
    `• 클립 설명란 & 고정댓글 ➔ 아래 [4번, 5번 말풍선] 복사해서 붙여넣기`;

  await sendText(cfg, msg1);
  await sleep(600);

  // [1번 말풍선] 인스타그램 · 쓰레드 프로필 웹사이트 링크 & 클립 스티커 주소
  await sendText(cfg, `https://kidsfit.co.kr`);
  await sleep(500);

  // [2번 말풍선] 인스타그램 & 쓰레드 프로필 소개글 (Bio)
  const bioText =
    `🌱 키즈핏 그로스 스튜디오 | 우리 아이 성장·두뇌 연구소\n` +
    `📏 질병관리청 성장도표 기준 예상키 & 숨은 키 +7cm 루틴\n` +
    `🧠 보건복지부 K-DST & 뇌과학 기반 연령별 학습법·교구 처방\n` +
    `👇 우리 아이 숨은 키·두뇌 잠재력 1분 무료 진단 (kidsfit.co.kr)`;
  await sendText(cfg, bioText);
  await sleep(500);

  // [3번 말풍선] 쓰레드(Threads) 1화 게시글의 '2번째 이어쓰기 댓글(링크 댓글)'
  const threadsComment2 =
    `📊 내 아이 개월 수에 딱 맞는 '0원 거실 소근육 놀이 처방전'과\n` +
    `'6각 두뇌 발달 밸런스 & 부모 유전 예상키(MPH) 리포트'는\n` +
    `아래 키즈핏 공식 무료 진단기에서 회원가입 없이 1분 만에 확인하실 수 있어요 👇\n\n` +
    `👉 https://kidsfit.co.kr\n\n` +
    `(진단 후 '만 3~6세 소근육 선긋기·가위질 워크지 PDF'도 무료로 받아가세요 🎁)`;
  await sendText(cfg, threadsComment2);
  await sleep(500);

  // [4번 말풍선] 네이버 클립(Clip) 설명란 캡션 + 해시태그
  const clipCaption =
    `퇴근 후 매일 미안한 워킹맘, 만 3세 아이 고집이 사실은 '손끝 소근육 민감기' 신호였다고? 🥺💛\n` +
    `우리 아이 키 백분위 & 월령별 6각 두뇌 발달 1분 무료 진단 👉 https://kidsfit.co.kr\n\n` +
    `#육아툰 #인스타툰 #워킹맘육아 #만3세발달 #소근육발달 #몬테소리 #영유아건강검진 #아이키성장 #키즈핏 #육아공감`;
  await sendText(cfg, clipCaption);
  await sleep(500);

  // [5번 말풍선] 네이버 클립(Clip) 고정댓글
  const clipPinnedComment =
    `📌 [무료 진단] 영상 속 '우리 아이 월령별 소근육·두뇌 발달 밸런스 & 숨은 키 +7cm 무료 진단 리포트'는 여기서 1분 만에 확인하실 수 있어요! 👉 https://kidsfit.co.kr`;
  await sendText(cfg, clipPinnedComment);

  console.log('✅ 텔레그램 완료 보고 및 SNS 수정용 단독 말풍선 5개 전송 완료!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
