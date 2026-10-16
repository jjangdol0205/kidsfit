/**
 * MoneyFit Web UI - [🎨 인스타 · 페북 · 쓰레드 4컷 웹툰 × 충격 영수증 스튜디오] Engine
 *
 * Features:
 * 1. High-Resolution HTML5 Canvas 4-Cut Korean Webtoon + Real Receipt Hybrid Renderer (1080x1080)
 * 2. 1-Click PNG Download:
 *    - 2x2 Single-Page 4-Cut Webtoon PNG (for Threads, Facebook, Instagram Cover)
 *    - 4-Slide Individual 1080x1080 Carousel PNGs (for Instagram & Facebook Multi-Slide)
 * 3. Meta 3-Platform Algorithm-Optimized Copy Engine:
 *    - Threads 2-Step Split (Link-free Main Post for 100% Reach + 1st Self-Reply Comment with Link)
 *    - Instagram Caption (Bookmark Save 📌 & Friend DM Share ✈️ Triggers + 15 Hashtags)
 *    - Facebook Storytelling Post (3040 Relatable Story + Friend Tagging Trigger)
 */

(function () {
  'use strict';

  let currentCategory = 'all';
  let activePresetIndex = 0;

  const HIGH_INTENT_SLUGS = [
    'electric-studio-ac',
    'diet-male-fatloss',
    'pet-maltese-5kg',
    'room-oneroom-100',
    'auto-avante-3000',
    'telecom-penalty-15'
  ];

  function getViralData() {
    return (window.MoneyFitViralContent && window.MoneyFitViralContent.VIRAL_POSTS) || {};
  }

  function getPresets() {
    return (window.MoneyFitPresets && window.MoneyFitPresets.PRESETS) || window.PRESETS || [];
  }

  function getConfig() {
    const mm = window.MoneyFitMonetization;
    if (mm && mm.getConfig) return mm.getConfig();
    return { siteUrl: 'https://truthofmarket.com' };
  }

  function evaluatePresetResult(preset) {
    const calcMod = window.MoneyFitCalculators;
    if (calcMod && calcMod.CALCULATORS && calcMod.CALCULATORS[preset.calc]) {
      try {
        return calcMod.CALCULATORS[preset.calc].calculate(preset.inputs);
      } catch (e) {
        // fallback below
      }
    }
    return {
      headline: preset.title,
      badge: preset.category,
      summary: preset.metaDescription || '',
      metrics: [
        { label: '핵심 진단', val: '3초 무료 계산' },
        { label: '비교 항목', val: '실시간 영수증' },
        { label: '추천 액션', val: '손익분기점 확인' }
      ]
    };
  }

  /**
   * Build 4-Cut Webtoon Storyboard Scripts & Meta 3-Channel Copy for any Preset
   */
  function buildWebtoonStoryAndCopy(preset, calcRes, siteUrl) {
    const presetUrl = `${siteUrl}/preset/${preset.id}/`;
    const m = calcRes.metrics || [];
    const m0 = m[0] ? `${m[0].label}: ${m[0].val}` : '';
    const m1 = m[1] ? `${m[1].label}: ${m[1].val}` : '';
    const m2 = m[2] ? `${m[2].label}: ${m[2].val}` : '';

    const sceneByCalc = {
      electric: {
        tag: '전기세 폭탄 실화 웹툰',
        panel1Title: '1컷 · 관리비 고지서 개봉 직후',
        panel1Bubble: `"잠깐만... 하루에 몇 시간 틀었다고 이번 달 전기세가 왜 이래?!"`,
        panel1Sub: '여름·겨울마다 반복되는 누진세 폭탄의 공포',
        panel2Title: '2컷 · 팩트폭행 전문가 등장',
        panel2Bubble: `"한전 누진세 구간 넘기는 순간 요금이 최대 3배로 뜁니다!"`,
        panel2Sub: '구형 가전 vs 1등급 인버터 본전 회수기간 계산 필수',
        hashtags: '#전기세폭탄 #자취방전기세 #에어컨전기세 #누진세계산기 #자취생꿀팁 #원룸자취 #생활비절약 #에너지1등급 #관리비절약 #머니핏'
      },
      diet: {
        tag: '다이어트 식단 팩트 웹툰',
        panel1Title: '1컷 · 무작정 굶는 다이어터',
        panel1Bubble: `"닭가슴살 대충 사고 굶었는데 왜 살은 안 빠지고 요요만 오지?!"`,
        panel1Sub: '내 기초대사량(BMR)도 모르고 식단 짜면 100% 실패',
        panel2Title: '2컷 · 트레이너의 팩트폭행',
        panel2Bubble: `"체중별 TDEE 탄·단·지(g)부터 맞춰야 근손실 없이 빠집니다!"`,
        panel2Sub: '닭가슴살 팩 수·현미밥 개수까지 정확히 계산해야 돈 안 버림',
        hashtags: '#다이어트식단 #닭가슴살식단 #TDEE계산기 #탄단지비율 #바디프로필 #직장인다이어트 #벌크업식단 #식단장보기 #헬린이 #머니핏'
      },
      pet: {
        tag: '멍냥이 집사 필수 웹툰',
        panel1Title: '1컷 · 눈대중 사료 급여의 최후',
        panel1Bubble: `"사료 봉지 뒤에 적힌 대로 줬는데 우리 강아지·고양이 왜 살찌지?!"`,
        panel1Sub: '종이컵 눈대중 급여가 소형견·고양이 비만 원인 1위',
        panel2Title: '2컷 · 수의영양학 팩트체크',
        panel2Bubble: `"중성화 여부·활동량(DER)에 따라 하루 급여량(g)이 완전히 달라요!"`,
        panel2Sub: '사료 1포대 소진 일수 & 병원비 예비비까지 3초 진단',
        hashtags: '#강아지사료량 #고양이사료량 #말티즈그램 #포메라니안 #코숏 #반려견건강 # 강아지비만 #펫보험비교 #초보집사 #머니핏'
      },
      room: {
        tag: '자취·신혼 풀세팅 웹툰',
        panel1Title: '1컷 · 이사 가전·가구 장바구니 멘붕',
        panel1Bubble: `"예산은 딱 정해져 있는데 침대·냉장고·세탁기 담다 보니 예산 2배 초과?!"`,
        panel1Sub: '계획 없이 예쁜 것부터 사면 필수 가전 못 사는 참사 발생',
        panel2Title: '2컷 · 인테리어 고수의 황금비율',
        panel2Bubble: `"예산별 가전:가구 황금 배분표(BOM)대로 사야 단 1원도 안 넘깁니다!"`,
        panel2Sub: '원룸 50만 원부터 신혼 1,000만 원까지 예산 초과 0원 공식',
        hashtags: '#원룸인테리어 #자취방꾸미기 #첫자취 #신혼가전견적 #오피스텔인테리어 #가전가구풀세팅 #자취필수템 #이사준비 #오늘의집 #머니핏'
      },
      auto: {
        tag: '신차 구매 호구 탈출 웹툰',
        panel1Title: '1컷 · 카마스터 견적서의 함정',
        panel1Bubble: `"할부 이자만 보고 계약했는데... 취등록세·보험료·세금 폭탄이 왜 또 나와?!"`,
        panel1Sub: '차량가만 보고 사면 5년 유지비에서 수백만 원 손해',
        panel2Title: '2컷 · 금융 전문가의 총비용(TCO) 비교',
        panel2Bubble: `"취등록세 7% + 보험료 + 사업자 절세까지 합친 '진짜 총지출'을 봐야죠!"`,
        panel2Sub: '장기렌트 vs 리스 vs 할부 vs 현금 5년 총비용 1:1 영수증',
        hashtags: '#장기렌트비교 #신차할부 #자동차리스 #첫차추천 #사회초년생차 #사업자절세 #아반떼장기렌트 #그랜저하이브리드 #신차견적 #머니핏'
      },
      telecom: {
        tag: '인터넷 약정 호구 탈출 웹툰',
        panel1Title: '1컷 · 3년 약정 끝나고 그냥 쓰는 중',
        panel1Bubble: `"귀찮아서 기존 인터넷 그냥 썼는데... 나만 현금 47만 원 못 받았다고?!"`,
        panel1Sub: '약정 만기 후 방치하거나 위약금 무서워 참으면 매달 손해',
        panel2Title: '2컷 · 통신 성지 고수의 팩트폭행',
        panel2Bubble: `"위약금 물어주고 갈아타도 당일 현금 사은품 + 요금할인이 훨씬 이득입니다!"`,
        panel2Sub: '내 잔여 위약금 vs 현금 사은품 47만 원 순수익 3초 계산',
        hashtags: '#인터넷가입사은품 #인터넷교체 #인터넷위약금 #현금사은품 #자취방인터넷 #알뜰폰요금제 #통신비절약 #인터넷성지 #생활꿀팁 #머니핏'
      }
    };

    const meta = sceneByCalc[preset.calc] || sceneByCalc.electric;

    // 1. Threads Main Post (NO LINK -> 100% Reach on Threads algorithm)
    const threadsMain = [
      `🚨 [4컷 웹툰] ${preset.title}, 아직도 감으로 계산하고 돈 날리시나요?`,
      ``,
      `솔직히 이거 모르고 그냥 쓰다가 호구 잡히는 분들 진짜 많습니다 😭`,
      `방금 2026년 최신 요율로 직접 시뮬레이션 돌려본 실제 영수증 결과:`,
      `• ${calcRes.headline}`,
      `• ${m0} / ${m1}`,
      ``,
      `📌 3번째 컷 [실제 비교 영수증]은 나중에 호구 안 잡히게 꼭 저장해두세요!`,
      `👇 내 조건 넣어서 3초 만에 계산하는 무료 링크는 바로 아래 [첫 번째 댓글]에 달아뒀습니다!`
    ].join('\n');

    // 2. Threads & Facebook 1st Self-Reply Comment (Contains the Direct Link)
    const threadsReply = [
      `🔗 [로그인/설치 없음] 3초 만에 내 조건 넣고 손익분기점 영수증 뽑아보기 👇`,
      `${presetUrl}`,
      ``,
      `(숫자만 바꾸면 실시간으로 내 영수증이 바로 계산됩니다!)`
    ].join('\n');

    // 3. Instagram Feed / Carousel Caption
    const instaCaption = [
      `📌 [나중에 돈 아끼려면 먼저 '저장'부터 해두세요!]`,
      `"${preset.title}" — 만화로 보는 3초 팩트체크 💥`,
      ``,
      `솔직히 귀찮아서 대충 넘겼다가 매달 생돈 날리는 분들 너무 많아서 4컷 웹툰+영수증으로 정리했습니다.`,
      ``,
      `📊 [3번째 슬라이드 실제 영수증 요약]`,
      `✅ 핵심 결론: ${calcRes.headline}`,
      `✅ ${m0}`,
      `✅ ${m1}`,
      `✅ ${m2}`,
      ``,
      `✈️ 주변에 이거 몰라서 돈 날리고 있는 자취생·직장인 친구에게 지금 바로 [DM 공유] 해주세요!`,
      ``,
      `🔍 내 조건(평수·요금·예산) 넣어서 3초 만에 계산해보고 싶다면?`,
      `👉 프로필 하단 링크(${siteUrl.replace('https://', '')}) 클릭 또는 댓글에 [계산기]라고 남겨주시면 링크 보내드려요!`,
      ``,
      meta.hashtags
    ].join('\n');

    // 4. Facebook Storytelling Post
    const fbPost = [
      `[공감 4컷] "${preset.title}" 모르면 나만 손해 보는 이유.jpg`,
      ``,
      `처음엔 설마 이 정도 차이 나겠어? 하고 직접 계산기 돌려봤다가 영수증 보고 소름 돋았습니다...`,
      ``,
      `🔥 [실제 계산된 손익분기점 영수증]`,
      `• ${calcRes.headline}`,
      `• ${m0}`,
      `• ${m1}`,
      `• ${m2}`,
      ``,
      `${calcRes.summary}`,
      ``,
      `주변에 지금 이거 고민 중인 친구 @태그 해주시거나 저장해두시고, 내 조건은 아래 첫 번째 댓글(또는 아래 주소)에서 3초 만에 무료로 계산해보세요!`,
      `👉 무료 시뮬레이터: ${presetUrl}`
    ].join('\n');

    return {
      meta,
      calcRes,
      presetUrl,
      threadsMain,
      threadsReply,
      instaCaption,
      fbPost
    };
  }

  /**
   * Helper: Wrap Korean text onto Canvas lines
   */
  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
    const words = String(text || '').split('');
    let line = '';
    let lineCount = 0;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = words[i];
        lineCount++;
        if (lineCount >= maxLines - 1) {
          // last line
        }
      } else {
        line = testLine;
      }
    }
    if (line && lineCount < maxLines) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      lineCount++;
    }
    return y + lineCount * lineHeight;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Draw Expressive Webtoon Character Illustration inside a panel
   */
  function drawWebtoonCharacter(ctx, cx, cy, mood, accentColor) {
    ctx.save();

    // Soft character halo
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.fill();

    // Shoulders / Torso
    ctx.fillStyle = mood === 'shock' ? '#ef4444' : mood === 'smart' ? '#1e40af' : '#059669';
    drawRoundedRect(ctx, cx - 48, cy + 28, 96, 46, 22);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair (Korean webtoon bang style)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 43, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();

    if (mood === 'shock') {
      // Shocked wide eyes + sweat drop + screaming mouth
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 15, cy - 10, 9, 0, Math.PI * 2);
      ctx.arc(cx + 15, cy - 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 15, cy - 10, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + 15, cy - 10, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Screaming O mouth
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Blue sweat drop
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx + 34, cy - 22, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (mood === 'smart') {
      // Smart glasses + confident smile
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.fillStyle = '#e0f2fe';
      drawRoundedRect(ctx, cx - 30, cy - 19, 24, 16, 4);
      ctx.fill();
      ctx.stroke();
      drawRoundedRect(ctx, cx + 6, cy - 19, 24, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 11);
      ctx.lineTo(cx + 6, cy - 11);
      ctx.stroke();

      // Confident smile
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 12, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      // Happy cheering eyes (^ ^) + big smile
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx - 15, cy - 8, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 15, cy - 8, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Big happy mouth
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 14, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw a single panel at (px, py, pw, ph)
   */
  function drawSinglePanel(ctx, panelIdx, px, py, pw, ph, preset, story) {
    const { meta, calcRes } = story;
    const m = calcRes.metrics || [];
    const scale = pw / 500;

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);

    // Panel background
    const bgColors = ['#fff1f2', '#eff6ff', '#0f172a', '#ecfdf5'];
    const borderColors = ['#f43f5e', '#3b82f6', '#f59e0b', '#10b981'];
    drawRoundedRect(ctx, 0, 0, 500, 500, 24);
    ctx.fillStyle = bgColors[panelIdx];
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = borderColors[panelIdx];
    ctx.stroke();

    // Top Panel Header Pill
    const headers = [
      meta.panel1Title,
      meta.panel2Title,
      '3컷 · 실제 충격 영수증 비교 (📌저장필수)',
      '4컷 · 3초 무료 자가진단 처방전'
    ];
    drawRoundedRect(ctx, 20, 18, 460, 42, 12);
    ctx.fillStyle = borderColors[panelIdx];
    ctx.fill();
    ctx.fillStyle = panelIdx === 2 ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 20px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillText(headers[panelIdx], 36, 46);

    if (panelIdx === 0) {
      // Panel 1: Shock Webtoon Scene
      drawWebtoonCharacter(ctx, 110, 165, 'shock', '#fecdd3');

      // Speech Bubble
      drawRoundedRect(ctx, 195, 82, 282, 155, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 21px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, meta.panel1Bubble, 215, 118, 244, 30, 4);

      // Episode Title Box at Bottom
      drawRoundedRect(ctx, 22, 265, 456, 210, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
      ctx.fillText(`🔥 오늘의 팩트폭행 주제 (${preset.category})`, 42, 300);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, preset.title, 42, 340, 416, 36, 2);

      ctx.fillStyle = '#fda4af';
      ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, `⚠️ ${meta.panel1Sub}`, 42, 435, 416, 24, 2);
    } else if (panelIdx === 1) {
      // Panel 2: Smart Analyst Fact-Check
      drawWebtoonCharacter(ctx, 110, 165, 'smart', '#bfdbfe');

      drawRoundedRect(ctx, 195, 82, 282, 155, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 21px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, meta.panel2Bubble, 215, 118, 244, 30, 4);

      // Fact Point Box
      drawRoundedRect(ctx, 22, 265, 456, 210, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#93c5fd';
      ctx.stroke();

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 20px "Malgun Gothic", sans-serif';
      ctx.fillText('💡 왜 대충 계산하면 무조건 손해일까?', 42, 305);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 19px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, calcRes.summary || meta.panel2Sub, 42, 345, 416, 29, 4);
    } else if (panelIdx === 2) {
      // Panel 3: Dark Mode Real Receipt Card (Save & Share Driver!)
      drawRoundedRect(ctx, 24, 78, 452, 398, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px "Malgun Gothic", sans-serif';
      ctx.fillText('🧾 [머니핏 2026 표준 수식 시뮬레이션 영수증]', 44, 114);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, calcRes.headline, 44, 152, 412, 32, 2);

      // 3 Metric Rows
      for (let i = 0; i < 3; i++) {
        const item = m[i] || { label: `핵심 지표 ${i + 1}`, val: '-' };
        const ry = 225 + i * 68;
        drawRoundedRect(ctx, 42, ry, 416, 54, 10);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
        ctx.fillText(item.label, 60, ry + 34);

        ctx.fillStyle = i === 0 ? '#f87171' : i === 1 ? '#38bdf8' : '#34d399';
        ctx.font = 'bold 20px "Malgun Gothic", sans-serif';
        const valWidth = ctx.measureText(item.val).width;
        ctx.fillText(item.val, 440 - valWidth, ry + 34);
      }

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
      ctx.fillText('📌 나중에 호구 안 잡히게 이 영수증을 [저장] 해두세요!', 48, 456);
    } else if (panelIdx === 3) {
      // Panel 4: 3-Second Solution CTA
      drawWebtoonCharacter(ctx, 110, 165, 'happy', '#a7f3d0');

      drawRoundedRect(ctx, 195, 82, 282, 155, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 21px "Malgun Gothic", sans-serif';
      drawWrappedText(
        ctx,
        '"내 조건 넣으면 3초 만에 손익분기점 영수증이 무료로 출력됩니다!"',
        215,
        118,
        244,
        30,
        4
      );

      // Big CTA Card
      drawRoundedRect(ctx, 22, 265, 456, 210, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px "Malgun Gothic", sans-serif';
      ctx.fillText('✅ 회원가입 0초 · 앱 설치 0개 · 100% 무료', 44, 305);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 23px "Malgun Gothic", sans-serif';
      ctx.fillText('지금 바로 내 진짜 손익분기점 확인하기 👇', 44, 348);

      drawRoundedRect(ctx, 40, 375, 420, 74, 14);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px "Malgun Gothic", sans-serif';
      ctx.fillText('🔎 프로필 링크 / 첫 댓글 클릭!', 92, 412);
      ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
      ctx.fillText('공식 포털: truthofmarket.com', 125, 438);
    }

    ctx.restore();
  }

  /**
   * Render full 1080x1080 2x2 4-Cut Webtoon Canvas
   */
  function renderWebtoonCanvas(preset, story) {
    const canvas = document.getElementById('webtoon-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1080, 1080);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1080, 1080);

    // Top Title Banner (0..76)
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px "Malgun Gothic", sans-serif';
    ctx.fillText(`🎨 [머니핏 4컷 팩트툰] ${preset.title.slice(0, 28)}`, 32, 50);

    // 4 Panels in 2x2 Grid (each 496x480)
    const positions = [
      { x: 28, y: 72 },
      { x: 556, y: 72 },
      { x: 28, y: 568 },
      { x: 556, y: 568 }
    ];

    for (let i = 0; i < 4; i++) {
      drawSinglePanel(ctx, i, positions[i].x, positions[i].y, 496, 480, preset, story);
    }
  }

  /**
   * Download 1080x1080 2x2 Grid PNG (For Threads / Facebook / Instagram Cover)
   */
  function downloadWebtoonGridPng() {
    const presets = getPresets();
    const preset = presets[activePresetIndex] || presets[0];
    const canvas = document.getElementById('webtoon-canvas');
    if (!canvas || !preset) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `moneyfit-webtoon-${preset.id}-4cut.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('📥 4컷 한판 웹툰 이미지(1080×1080 PNG)가 다운로드되었습니다!');
  }

  /**
   * Download 4 Individual 1080x1080 Slide PNGs (For Instagram & Facebook Carousel)
   */
  function downloadWebtoonSlidesPng() {
    const presets = getPresets();
    const preset = presets[activePresetIndex] || presets[0];
    if (!preset) return;

    const cfg = getConfig();
    const calcRes = evaluatePresetResult(preset);
    const story = buildWebtoonStoryAndCopy(preset, calcRes, cfg.siteUrl || 'https://truthofmarket.com');

    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1080;
    offCanvas.height = 1080;
    const ctx = offCanvas.getContext('2d');

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1080, 1080);
        drawSinglePanel(ctx, i, 40, 40, 1000, 1000, preset, story);
        const a = document.createElement('a');
        a.href = offCanvas.toDataURL('image/png');
        a.download = `moneyfit-insta-${preset.id}-slide${i + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 250);
    }
    showToast('📸 인스타그램용 4장 개별 카드뉴스(PNG×4) 연속 다운로드를 시작합니다!');
  }

  function filterCategory(cat) {
    currentCategory = cat;
    renderPresetNav();
  }

  function renderPresetNav() {
    const listEl = document.getElementById('seo-preset-list');
    if (!listEl) return;

    const presets = getPresets();
    const filtered = presets
      .map((p, originalIdx) => ({ p, originalIdx }))
      .filter(item => {
        if (currentCategory === 'all') return true;
        if (currentCategory === 'pinpoint') return HIGH_INTENT_SLUGS.includes(item.p.id);
        return item.p.calc === currentCategory || item.p.category.includes(currentCategory);
      });

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">해당 카테고리의 주제가 없습니다.</div>';
      return;
    }

    listEl.innerHTML = filtered
      .map(({ p, originalIdx }) => {
        const isSelected = originalIdx === activePresetIndex;
        const isPinpoint = HIGH_INTENT_SLUGS.includes(p.id);
        const badgeColor =
          {
            electric: 'bg-amber-100 text-amber-800 border-amber-300',
            diet: 'bg-rose-100 text-rose-800 border-rose-300',
            pet: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            room: 'bg-purple-100 text-purple-800 border-purple-300',
            auto: 'bg-blue-100 text-blue-800 border-blue-300',
            telecom: 'bg-cyan-100 text-cyan-800 border-cyan-300'
          }[p.calc] || 'bg-slate-100 text-slate-800 border-slate-300';

        const activeClass = isSelected
          ? 'border-pink-600 bg-pink-50/80 shadow-sm ring-1 ring-pink-500'
          : 'border-slate-200 bg-white hover:border-pink-400 hover:bg-slate-50';

        return `
        <button onclick="MoneyFitCopyKit.selectPreset(${originalIdx})"
                id="preset-nav-btn-${originalIdx}"
                class="w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 ${activeClass}">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1 flex-wrap">
              <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${badgeColor}">#${originalIdx + 1} ${p.category}</span>
              ${isPinpoint ? '<span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white">🔥 떡상TOP</span>' : ''}
            </div>
            <div class="text-xs font-bold text-slate-800 leading-snug line-clamp-2">${p.title}</div>
          </div>
          <span class="text-xs font-bold ${isSelected ? 'text-pink-600' : 'text-slate-400'} pt-0.5 shrink-0">웹툰생성 →</span>
        </button>
      `;
      })
      .join('');
  }

  function selectPreset(index) {
    const presets = getPresets();
    const preset = presets[index];
    if (!preset) return;

    activePresetIndex = index;

    document.querySelectorAll('[id^="preset-nav-btn-"]').forEach(btn => {
      btn.className =
        'w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 border-slate-200 bg-white hover:border-pink-400 hover:bg-slate-50';
    });
    const selectedBtn = document.getElementById(`preset-nav-btn-${index}`);
    if (selectedBtn) {
      selectedBtn.className =
        'w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 border-pink-600 bg-pink-50/80 shadow-sm ring-1 ring-pink-500';
    }

    const cfg = getConfig();
    const currentSiteUrl = cfg.siteUrl || 'https://truthofmarket.com';
    const calcRes = evaluatePresetResult(preset);
    const story = buildWebtoonStoryAndCopy(preset, calcRes, currentSiteUrl);

    const epTitleEl = document.getElementById('webtoon-episode-title');
    if (epTitleEl) epTitleEl.textContent = `🎨 [제${index + 1}화] ${preset.title}`;

    const previewLinkEl = document.getElementById('sniper-preset-preview-link');
    if (previewLinkEl) previewLinkEl.href = `/preset/${preset.id}/`;

    // Render 4-Cut Webtoon Canvas
    renderWebtoonCanvas(preset, story);

    // Populate Meta 3-Channel Copy Elements
    const threadsEl = document.getElementById('generated-threads-post');
    const threadsReplyEl = document.getElementById('generated-threads-reply');
    const instaEl = document.getElementById('generated-insta-post');
    const fbEl = document.getElementById('generated-fb-post');

    if (threadsEl) threadsEl.textContent = story.threadsMain;
    if (threadsReplyEl) threadsReplyEl.textContent = story.threadsReply;
    if (instaEl) instaEl.textContent = story.instaCaption;
    if (fbEl) fbEl.textContent = story.fbPost;

    // Populate legacy hidden elements if present
    const viralData = getViralData();
    const bundle = viralData[preset.id] || {};
    const blogEl = document.getElementById('generated-blog-post');
    const jisikinEl = document.getElementById('generated-jisikin-post');
    const cafeEl = document.getElementById('generated-cafe-comment-post');
    if (blogEl) blogEl.textContent = bundle.blogPost || story.fbPost;
    if (jisikinEl) jisikinEl.textContent = bundle.jisikinPost || story.threadsMain;
    if (cafeEl) cafeEl.textContent = bundle.cafeCommentPost || story.instaCaption;
  }

  function refreshActive() {
    selectPreset(activePresetIndex || 0);
  }

  function copyWithFeedback(elementId, btnElement, copyLabel = '원고') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent || '';

    const originalHtml = btnElement ? btnElement.innerHTML : null;
    const originalClass = btnElement ? btnElement.className : null;

    function applySuccessFeedback() {
      if (btnElement) {
        btnElement.innerHTML = '✓ 복사 완료!';
        btnElement.classList.add('bg-emerald-700', 'text-white');
        setTimeout(() => {
          if (btnElement) {
            btnElement.innerHTML = originalHtml;
            btnElement.className = originalClass;
          }
        }, 2000);
      }
      showToast(`[${copyLabel}] 복사 완료! 바로 붙여넣으세요.`);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(applySuccessFeedback)
        .catch(() => fallbackCopyText(text, applySuccessFeedback));
    } else {
      fallbackCopyText(text, applySuccessFeedback);
    }
  }

  function copyDirectUrl(urlText, btnElement, copyLabel = '링크') {
    if (!urlText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlText).then(() => showToast(`[${copyLabel}] 복사 완료!`));
    }
  }

  function fallbackCopyText(text, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (onSuccess) onSuccess();
    } catch (e) {
      showToast('복사에 실패했습니다.');
    }
    document.body.removeChild(ta);
  }

  function showToast(message) {
    let toast = document.getElementById('copy-toast');
    let toastMsg = document.getElementById('copy-toast-msg');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'copy-toast';
      toast.className =
        'fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-sm font-bold';
      toast.innerHTML = `<span class="text-emerald-400">✓</span><span id="copy-toast-msg">${message}</span>`;
      document.body.appendChild(toast);
      toastMsg = document.getElementById('copy-toast-msg');
    }

    if (toastMsg) toastMsg.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
  }

  function init() {
    renderPresetNav();
    selectPreset(0);
  }

  const MoneyFitCopyKit = {
    init,
    renderPresetNav,
    selectPreset,
    refreshActive,
    filterCategory,
    buildWebtoonStoryAndCopy,
    downloadWebtoonGridPng,
    downloadWebtoonSlidesPng,
    copyWithFeedback,
    copyDirectUrl,
    showToast
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoneyFitCopyKit;
  }

  if (typeof window !== 'undefined') {
    window.MoneyFitCopyKit = MoneyFitCopyKit;
    window.addEventListener('DOMContentLoaded', () => {
      init();
    });
  }
})();
