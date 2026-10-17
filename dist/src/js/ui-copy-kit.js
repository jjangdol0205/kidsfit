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
   * Build 4-Cut Animal Instatoon Storyboard Scripts & Meta Anti-Spam High-CTR Copy for any Preset
   */
  function buildWebtoonStoryAndCopy(preset, calcRes, siteUrl) {
    const cleanSiteUrl = String(siteUrl || 'https://truthofmarket.com').replace(/\/+$/, '');
    const presetUrl = `${cleanSiteUrl}/preset/${preset.id}/`;
    const m = calcRes.metrics || [];
    const m0 = m[0] ? `${m[0].label}: ${m[0].val}` : '';
    const m1 = m[1] ? `${m[1].label}: ${m[1].val}` : '';
    const m2 = m[2] ? `${m[2].label}: ${m[2].val}` : '';

    const sceneByCalc = {
      electric: {
        species: 'quokka',
        charName: '자취생 쿼카찌',
        expertName: '안경 여우 세무사',
        tag: '전기세 폭탄 실화 인스타툰',
        sfxShock: '콰아앙⚡',
        panel1Title: '1컷 · 관리비 고지서 개봉 직후',
        panel1Bubble: `"잠깐만... 에어컨 아낀다고 껐다 켰는데 이번 달 전기세가 왜 이래?!"`,
        panel1Sub: '여름·겨울마다 반복되는 누진세 폭탄의 공포 (쿼카찌 오열😭)',
        panel2Title: '2컷 · 안경 여우의 팩트폭격',
        panel2Bubble: `"삐빅! 정속형을 껐다 켜면 실외기 기동전력 폭발로 누진 3단계(3배) 밟습니다!"`,
        panel2Sub: '구형 가전 vs 1등급 인버터 본전 회수기간 계산 필수',
        badLabel: '호구 평균 지출 (정속형 무방비)',
        badVal: calcRes.afterBill ? `${calcRes.afterBill.toLocaleString()}원/월` : '88,420원/월',
        goodLabel: '상위 1% 절약 지출 (인버터 정속)',
        goodVal:
          calcRes.afterBill && calcRes.monthlySaving
            ? `${Math.max(0, calcRes.afterBill - calcRes.monthlySaving).toLocaleString()}원/월`
            : '31,200원/월',
        diffVal: calcRes.monthlySaving ? `-${calcRes.monthlySaving.toLocaleString()}원/월 절약` : '-57,220원/월 절약',
        hashtags: '#인스타툰 #자취꿀팁 #생활비절약 #머니핏'
      },
      diet: {
        species: 'shiba',
        charName: '헬스 시바견 득근이',
        expertName: '안경 여우 영양박사',
        tag: '다이어트 식단 팩트 인스타툰',
        sfxShock: '두둥탁!!',
        panel1Title: '1컷 · 무작정 대량결제한 다이어터',
        panel1Bubble: `"닭가슴살 100팩 사고 굶었는데 왜 살은 안 빠지고 식비만 터지지?!"`,
        panel1Sub: '내 기초대사량(BMR)도 모르고 식단 짜면 100% 요요 참사',
        panel2Title: '2컷 · 안경 여우의 팩트폭격',
        panel2Bubble: `"삐빅! 체중별 TDEE 탄·단·지(g) 정량부터 맞춰야 돈도 아끼고 살도 빠집니다!"`,
        panel2Sub: '닭가슴살 팩 수·현미밥 개수까지 정확히 계산해야 돈 안 버림',
        badLabel: '호구 평균 지출 (충동 대량구매+치팅)',
        badVal: '348,000원/4주',
        goodLabel: '상위 1% 절약 지출 (TDEE 정량 장보기)',
        goodVal: '142,000원/4주',
        diffVal: '-206,000원 절약',
        hashtags: '#인스타툰 #자취꿀팁 #생활비절약 #머니핏'
      },
      pet: {
        species: 'cat',
        charName: '집사 치즈냥 박사',
        expertName: '안경 여우 수의영양사',
        tag: '멍냥이 집사 필수 인스타툰',
        sfxShock: '콰아앙⚡',
        panel1Title: '1컷 · 종이컵 눈대중 급여의 최후',
        panel1Bubble: `"사료 봉투 뒤에 적힌 대로 줬는데 우리 댕냥이 왜 비만에 병원비 폭탄이지?!"`,
        panel1Sub: '종이컵 눈대중 급여가 소형견·고양이 비만·관절 병원비 원인 1위',
        panel2Title: '2컷 · 안경 여우의 팩트폭격',
        panel2Bubble: `"삐빅! 중성화 여부·활동량 계수(DER)에 따라 하루 급여량(g)이 완전히 달라요!"`,
        panel2Sub: '사료 1포대 소진 일수 & 병원비 예비비까지 3초 진단',
        badLabel: '호구 평균 지출 (과급여 비만+무보험)',
        badVal: '385,000원/월',
        goodLabel: '상위 1% 절약 지출 (DER 정량+특약)',
        goodVal: '129,000원/월',
        diffVal: '-256,000원/월 방어',
        hashtags: '#인스타툰 #자취꿀팁 #생활비절약 #머니핏'
      },
      room: {
        species: 'bear',
        charName: '독립 아기곰 포근이',
        expertName: '안경 여우 견적박사',
        tag: '자취·신혼 풀세팅 인스타툰',
        sfxShock: '두둥탁!!',
        panel1Title: '1컷 · 이사 가전·가구 장바구니 멘붕',
        panel1Bubble: `"인스타 감성 침대·냉장고·세탁기 담다 보니 벌써 예산 2배 초과라고?!"`,
        panel1Sub: '계획 없이 예쁜 것부터 사면 필수 가전 못 사는 참사 발생',
        panel2Title: '2컷 · 안경 여우의 팩트폭격',
        panel2Bubble: `"삐빅! 예산별 가전:가구 황금 배분표(BOM)대로 사야 단 1원도 안 넘깁니다!"`,
        panel2Sub: '원룸 50만 원부터 신혼 1,000만 원까지 예산 초과 0원 공식',
        badLabel: '호구 평균 지출 (감성 단품 충동결제)',
        badVal:
          calcRes.totalCost && calcRes.savingWon
            ? `${(calcRes.totalCost + calcRes.savingWon).toLocaleString()}원`
            : '2,840,000원',
        goodLabel: '상위 1% 절약 지출 (황금비율 BOM)',
        goodVal: calcRes.totalCost ? `${calcRes.totalCost.toLocaleString()}원` : '1,480,000원',
        diffVal: calcRes.savingWon ? `-${calcRes.savingWon.toLocaleString()}원 절약` : '-1,360,000원 절약',
        hashtags: '#인스타툰 #자취꿀팁 #생활비절약 #머니핏'
      },
      auto: {
        species: 'fox',
        charName: '안경 여우 세무사',
        expertName: '안경 여우 세무사',
        tag: '신차 구매 호구 탈출 인스타툰',
        sfxShock: '콰아앙⚡',
        panel1Title: '1컷 · 카마스터 월 납입금의 함정',
        panel1Bubble: `"월 납입금만 보고 계약했는데... 취등록세 7%·보험료·세금 폭탄이 왜 또 나와?!"`,
        panel1Sub: '차량가만 보고 사면 5년 유지비에서 수백만 원 손해',
        panel2Title: '2컷 · 안경 여우의 팩트폭격',
        panel2Bubble: `"삐빅! 취등록세 7% + 보험료 + 사업자 절세까지 합친 5년 총비용(TCO)을 봐야죠!"`,
        panel2Sub: '장기렌트 vs 리스 vs 할부 vs 현금 5년 총비용 1:1 영수증',
        badLabel: '호구 평균 지출 (취등록세 간과 할부)',
        badVal: calcRes.installmentTco ? `${calcRes.installmentTco.toLocaleString()}원` : '54,820,000원',
        goodLabel: '상위 1% 절약 지출 (세율 맞춤 최적안)',
        goodVal: calcRes.rentTco ? `${calcRes.rentTco.toLocaleString()}원` : '46,150,000원',
        diffVal: calcRes.diffMan ? `-${calcRes.diffMan.toLocaleString()}만 원 절약` : '-8,670,000원 절약',
        hashtags: '#인스타툰 #자취꿀팁 #생활비절약 #머니핏'
      },
      telecom: {
        species: 'raccoon',
        charName: '호구탈출 라쿤대리',
        expertName: '안경 여우 통신박사',
        tag: '인터넷 약정 호구 탈출 인스타툰',
        sfxShock: '두둥탁!!',
        panel1Title: '1컷 · 3년 약정 끝나고 그냥 쓰는 중',
        panel1Bubble: `"귀찮아서 기존 인터넷 그냥 썼는데... 나만 현금 47만 원 못 받았다고?!"`,
        panel1Sub: '약정 만기 후 방치하거나 위약금 무서워 참으면 매달 손해',
        panel2Title: '2컷 · 안경 여우의 팩트폭격',
        panel2Bubble: `"삐빅! 위약금 물어주고 갈아타도 당일 현금 사은품 47만 + 요금할인이 훨씬 이득!"`,
        panel2Sub: '내 잔여 위약금 vs 현금 사은품 47만 원 순수익 3초 계산',
        badLabel: '호구 평균 지출 (기존 약정 방치)',
        badVal: '+70,000원 혜택',
        goodLabel: '상위 1% 절약 지출 (47만 사은품 환승)',
        goodVal: calcRes.totalNetBenefit ? `+${calcRes.totalNetBenefit.toLocaleString()}원 순익` : '+518,000원 순익',
        diffVal: calcRes.immediateNetWon ? `당일 현금 +${calcRes.immediateNetWon.toLocaleString()}원` : '+448,000원 이득',
        hashtags: '#인스타툰 #자취꿀팁 #생활비절약 #머니핏'
      }
    };

    const meta = sceneByCalc[preset.calc] || sceneByCalc.electric;

    // 1. Threads Main Post (100% Free of raw https:// URLs -> 0 Spam Penalty + Curiosity Gap Hook)
    const threadsMain = [
      `🚨 [4컷 동물 인스타툰] "${preset.title}" 모르면 나만 상위 1% 호구 잡힙니다 😭`,
      ``,
      `솔직히 귀찮아서 감으로 넘겼다가 매달 생돈 날리는 분들 진짜 많습니다.`,
      `방금 2026년 표준 수식으로 뽑아본 충격 실물 영수증 비교 결과:`,
      `• ❌ ${meta.badLabel}: ${meta.badVal}`,
      `• ✅ ${meta.goodLabel}: ${meta.goodVal}`,
      `• 🔥 모르면 날리는 생돈: ${meta.diffVal}`,
      ``,
      `❓ 내 조건 넣으면 상위 몇 % 호구일까?`,
      `📌 3번째 컷 [절취선 실물 영수증] 먼저 저장해두시고,`,
      `👇 3초 만에 내 영수증 뽑아보는 무료 시뮬레이터는 바로 아래 [첫 번째 대댓글] 또는 검색창에 [ truthofmarket ]을 검색해보세요!`
    ].join('\n');

    // 2. Threads & Facebook 1st Self-Reply Comment (Contains the Direct Link)
    const threadsReply = [
      `🔗 [회원가입/설치 0개] 3초 만에 내 숫자 넣고 실물 손익 영수증 뽑아보기 👇`,
      `${presetUrl}`,
      ``,
      `(숫자만 바꾸면 실시간으로 내가 아낄 수 있는 금액이 1원 단위로 출력됩니다!)`
    ].join('\n');

    // 3. Instagram Feed / Carousel Caption (100% Free of raw https:// URLs + Exactly 4 Ultra-Targeted Hashtags)
    const instaCaption = [
      `❓ 내 조건 넣으면 상위 몇 % 호구일까? [나중에 돈 아끼려면 먼저 '저장📌'부터!]`,
      `"${preset.title}" — ${meta.charName} × ${meta.expertName} 4컷 팩트체크 💥`,
      ``,
      `솔직히 귀찮아서 대충 넘겼다가 매달 생돈 날리는 분들이 너무 많아서 4컷 동물 인스타툰 + 절취선 실물 영수증으로 정리했습니다.`,
      ``,
      `🧾 [3번째 슬라이드 절취선 영수증 요약]`,
      `• ❌ ${meta.badLabel}: ${meta.badVal}`,
      `• ✅ ${meta.goodLabel}: ${meta.goodVal}`,
      `• 🔥 모르면 날리는 생돈: ${meta.diffVal}`,
      `• 💡 핵심 요약: ${calcRes.headline}${m0 ? ` (${m0} / ${m1})` : ''}`,
      ``,
      `✈️ 지금 이거 몰라서 생돈 날리고 있는 자취생·직장인 친구에게 바로 [DM 공유] 해주세요!`,
      ``,
      `⚡ 내 숫자 넣고 3초 만에 무료 영수증 뽑아보고 싶다면?`,
      `👉 프로필 하단 링크 클릭 또는 네이버·구글에 [ truthofmarket ] 검색!`,
      ``,
      meta.hashtags
    ].join('\n');

    // 4. Facebook Storytelling Post (100% Free of raw https:// URLs in main body)
    const fbPost = [
      `[공감 4컷 인스타툰] "${preset.title}" 모르면 나만 생돈 날리는 이유.jpg`,
      ``,
      `처음엔 설마 이 정도 차이 나겠어? 하고 직접 시뮬레이터 돌려봤다가 3번째 컷 실물 영수증 보고 소름 돋았습니다...`,
      ``,
      `🧾 [실제 계산된 절취선 손익 영수증]`,
      `• ❌ ${meta.badLabel}: ${meta.badVal}`,
      `• ✅ ${meta.goodLabel}: ${meta.goodVal}`,
      `• 🔥 모르면 날리는 생돈: ${meta.diffVal}`,
      `• 📌 한줄 결론: ${calcRes.headline}${m2 ? ` (${m2})` : ''}`,
      ``,
      `${calcRes.summary}`,
      ``,
      `❓ 내 조건 넣으면 상위 몇 % 호구일까?`,
      `주변에 지금 이거 고민 중인 친구 @태그 해주시거나 저장해두시고, 무료 3초 계산기는 바로 아래 [첫 번째 댓글] 또는 검색창에 [ truthofmarket ]을 검색해보세요! 👇`
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
   * Draw subtle manga focus lines (집중선) in panel background for dramatic shock scenes
   */
  function drawComicFocusLines(ctx, cx, cy, panelW, panelH, color = 'rgba(244, 63, 94, 0.13)') {
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, 4, 64, panelW - 8, panelH - 68, 20);
    ctx.clip();
    ctx.strokeStyle = color;
    const rays = 28;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      ctx.lineWidth = i % 2 === 0 ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 62, cy + Math.sin(angle) * 62);
      ctx.lineTo(cx + Math.cos(angle) * 420, cy + Math.sin(angle) * 420);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draw a 4-point sparkle star at (sx, sy)
   */
  function drawSparkleStar(ctx, sx, sy, size, fill = '#fde047') {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.18, -size * 0.18, size, 0);
    ctx.quadraticCurveTo(size * 0.18, size * 0.18, 0, size);
    ctx.quadraticCurveTo(-size * 0.18, size * 0.18, -size, 0);
    ctx.quadraticCurveTo(-size * 0.18, -size * 0.18, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw Ultra-High-Quality Korean Anthropomorphized Animal Instatoon Character
   * Species:
   * - 'quokka'  (자취생 쿼카찌)
   * - 'shiba'   (헬스 시바견 득근이)
   * - 'cat'     (집사 치즈냥 박사)
   * - 'bear'    (독립 아기곰 포근이)
   * - 'fox'     (안경 여우 세무사)
   * - 'raccoon' (호구탈출 라쿤대리)
   */
  function drawAnimalCharacter(ctx, cx, cy, species = 'quokka', mood = 'shock', accentColor = '#fecdd3', scale = 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const outline = '#1e293b';

    // Soft pastel aura behind character
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(0, -2, 64, 0, Math.PI * 2);
    ctx.fill();

    // Palette per species
    const palettes = {
      quokka: { fur: '#d97706', subFur: '#fbbf24', innerEar: '#fda4af', muzzle: '#fffbeb', nose: '#1e293b', prop: '⚡26°C' },
      shiba: { fur: '#f59e0b', subFur: '#fef3c7', innerEar: '#fef3c7', muzzle: '#ffffff', nose: '#1e293b', prop: '💪득근' },
      cat: { fur: '#fb923c', subFur: '#ffedd5', innerEar: '#fda4af', muzzle: '#fff7ed', nose: '#fb7185', prop: '🐾사료g' },
      bear: { fur: '#fde68a', subFur: '#fef3c7', innerEar: '#d97706', muzzle: '#ffffff', nose: '#451a03', prop: '🏠BOM' },
      fox: { fur: '#ea580c', subFur: '#ffffff', innerEar: '#fed7aa', muzzle: '#ffffff', nose: '#1e293b', prop: '📊팩트' },
      raccoon: { fur: '#94a3b8', subFur: '#e2e8f0', innerEar: '#cbd5e1', muzzle: '#f8fafc', nose: '#0f172a', prop: '✉️+47만' }
    };
    const pal = palettes[species] || palettes.quokka;

    // 1. Outfit / Hoodie Torso
    const shirtColor = mood === 'shock' ? '#f43f5e' : mood === 'smart' ? '#2563eb' : '#10b981';
    ctx.fillStyle = shirtColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, -46, 26, 92, 48, 22);
    ctx.fill();
    ctx.stroke();

    // Cute white collar / hoodie strings
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 29, 14, 0, Math.PI);
    ctx.fill();
    ctx.stroke();

    // 2. Ears (Species-specific)
    ctx.lineWidth = 4;
    ctx.strokeStyle = outline;
    if (species === 'shiba' || species === 'cat' || species === 'fox') {
      const earH = species === 'fox' ? -62 : -55;
      const earW = species === 'fox' ? 44 : 38;
      // Left pointed ear
      ctx.fillStyle = pal.fur;
      ctx.beginPath();
      ctx.moveTo(-earW, -16);
      ctx.lineTo(-earW + 6, earH);
      ctx.lineTo(-10, -36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right pointed ear
      ctx.beginPath();
      ctx.moveTo(earW, -16);
      ctx.lineTo(earW - 6, earH);
      ctx.lineTo(10, -36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner ear triangles
      ctx.fillStyle = pal.innerEar;
      ctx.beginPath();
      ctx.moveTo(-earW + 6, -20);
      ctx.lineTo(-earW + 8, earH + 11);
      ctx.lineTo(-16, -33);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(earW - 6, -20);
      ctx.lineTo(earW - 8, earH + 11);
      ctx.lineTo(16, -33);
      ctx.closePath();
      ctx.fill();

      // Fox dark ear tips
      if (species === 'fox') {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-39, -46);
        ctx.lineTo(-38, -62);
        ctx.lineTo(-26, -49);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(39, -46);
        ctx.lineTo(38, -62);
        ctx.lineTo(26, -49);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Round fluffy ears for Quokka, Bear, Raccoon
      const earPositions = [
        { x: -34, y: -34 },
        { x: 34, y: -34 }
      ];
      earPositions.forEach(ep => {
        ctx.fillStyle = pal.fur;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.innerEar;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, 8.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. Head Base (Chubby Korean Instatoon proportions)
    ctx.fillStyle = pal.fur;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (species === 'quokka') {
      // Extra chubby lower cheeks for Quokka
      ctx.ellipse(0, -4, 48, 41, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(0, -6, 45, 40, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // 4. Species-specific Facial Markings
    if (species === 'quokka') {
      // Warm golden lower cheek puffs
      ctx.fillStyle = pal.subFur;
      ctx.beginPath();
      ctx.arc(-25, 6, 16, 0, Math.PI * 2);
      ctx.arc(25, 6, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (species === 'shiba') {
      // Cream white lower face + Shiba cream eyebrow beans + Red sweatband
      ctx.fillStyle = pal.subFur;
      ctx.beginPath();
      ctx.ellipse(0, 10, 36, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cream eyebrow spots
      ctx.beginPath();
      ctx.ellipse(-15, -23, 5.5, 3.5, -0.2, 0, Math.PI * 2);
      ctx.ellipse(15, -23, 5.5, 3.5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Red athletic headband
      ctx.fillStyle = '#ef4444';
      drawRoundedRect(ctx, -41, -36, 82, 11, 5);
      ctx.fill();
      ctx.stroke();
    } else if (species === 'cat') {
      // 3 Cute forehead tabby stripes + cheek whiskers
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 3.5;
      [-9, 0, 9].forEach(sx => {
        ctx.beginPath();
        ctx.moveTo(sx, -42);
        ctx.lineTo(sx, -30);
        ctx.stroke();
      });
      // Whiskers
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.5;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(dir * 30, 2);
        ctx.lineTo(dir * 52, -2);
        ctx.moveTo(dir * 30, 9);
        ctx.lineTo(dir * 52, 11);
        ctx.stroke();
      });
    } else if (species === 'fox') {
      // White desert fox cheek tufts
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-22, 11, 19, 15, 0.2, 0, Math.PI * 2);
      ctx.ellipse(22, 11, 19, 15, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (species === 'raccoon') {
      // Dark charcoal raccoon eye-mask patches
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(-17, -9, 14, 11, -0.2, 0, Math.PI * 2);
      ctx.ellipse(17, -9, 14, 11, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Rosy Pastel Cheeks (#fda4af)
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.ellipse(-28, 8, 8.5, 5.5, 0, 0, Math.PI * 2);
    ctx.ellipse(28, 8, 8.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Cute Snout / Muzzle & Button Nose
    ctx.fillStyle = pal.muzzle;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 8, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = pal.nose;
    ctx.beginPath();
    ctx.ellipse(0, 2, 5.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 7. Dramatic Instatoon Mood Expressions (Eyes, Tears, Glasses, Mouth, Paws)
    if (mood === 'shock') {
      // Sky-blue Waterfall Tears (폭포 눈물) streaming down from both eyes
      ctx.fillStyle = '#38bdf8';
      drawRoundedRect(ctx, -23, -6, 11, 42, 5);
      ctx.fill();
      drawRoundedRect(ctx, 12, -6, 11, 42, 5);
      ctx.fill();

      // Big trembling eyes with tiny pupils
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(-17, -10, 9.5, 0, Math.PI * 2);
      ctx.arc(17, -10, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.arc(-17, -10, 3.2, 0, Math.PI * 2);
      ctx.arc(17, -10, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Screaming open mouth
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 14, 9.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Paws on cheeks in panic
      ctx.fillStyle = pal.fur;
      ctx.beginPath();
      ctx.arc(-36, 20, 10, 0, Math.PI * 2);
      ctx.arc(36, 20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (mood === 'smart') {
      // Confident eyes + Shiny Smart Glasses (안경 번쩍✨)
      ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.8;
      drawRoundedRect(ctx, -33, -21, 27, 19, 5);
      ctx.fill();
      ctx.stroke();
      drawRoundedRect(ctx, 6, -21, 27, 19, 5);
      ctx.fill();
      ctx.stroke();

      // Glasses bridge & shine diagonal lines
      ctx.beginPath();
      ctx.moveTo(-6, -12);
      ctx.lineTo(6, -12);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-28, -6);
      ctx.lineTo(-18, -18);
      ctx.moveTo(11, -6);
      ctx.lineTo(21, -18);
      ctx.stroke();

      // Smirk / cat-mouth (ㅅ)
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-8, 12);
      ctx.quadraticCurveTo(-4, 16, 0, 10);
      ctx.quadraticCurveTo(4, 16, 8, 12);
      ctx.stroke();

      // Star gleam on glasses frame (안경 번쩍✨)
      drawSparkleStar(ctx, 34, -22, 10, '#fde047');

      // Right paw holding red fact-check pointer stick
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(32, 34);
      ctx.lineTo(58, -4);
      ctx.stroke();
      ctx.fillStyle = pal.fur;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(34, 34, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Happy curved eyes (^ ^) + cheering paws + floating coins/sparkles
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(-17, -10, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(17, -10, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Cute cat/animal smile (ㅅ + happy pink tongue)
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(0, 10, 9, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      // Both paws raised up cheering
      ctx.fillStyle = pal.fur;
      ctx.beginPath();
      ctx.arc(-44, 12, 10, 0, Math.PI * 2);
      ctx.arc(44, 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sparkles & Gold Coins around happy character
      drawSparkleStar(ctx, -50, -28, 9, '#fde047');
      drawSparkleStar(ctx, 50, -24, 10, '#fde047');
    }

    // 8. Category Mini Prop Badge at bottom of character
    drawRoundedRect(ctx, -38, 52, 76, 24, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = outline;
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
    const propW = ctx.measureText(pal.prop).width;
    ctx.fillText(pal.prop, -propW / 2, 69);

    ctx.restore();
  }

  /**
   * Backwards-compatible wrapper
   */
  function drawWebtoonCharacter(ctx, cx, cy, mood, accentColor) {
    drawAnimalCharacter(ctx, cx, cy, mood === 'smart' ? 'fox' : 'quokka', mood, accentColor, 1);
  }

  /**
   * Draw Speech Bubble with Triangle Tail pointing down toward the character
   */
  function drawSpeechBubble(ctx, x, y, w, h, r, tailX, tailDir = 1) {
    const tailW = 20;
    const tailH = 15;
    const tx = Math.max(x + r + tailW, Math.min(x + w - r - tailW, tailX));

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(tx + tailW * 0.55, y + h);
    ctx.lineTo(tx + tailDir * 4, y + h + tailH);
    ctx.lineTo(tx - tailW * 0.55, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw Compact Perforated Thermal Receipt Speech Memo inside Panel 3 Top Empty Space
   */
  function drawPerforatedReceiptCard(ctx, x, y, w, h, tailX = x + w * 0.62) {
    const zigCount = 20;
    const zigW = w / zigCount;
    const zigH = 6;
    const tailW = 18;
    const tailH = 14;
    const tx = Math.max(x + 40, Math.min(x + w - 40, tailX));

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(x, y + zigH);
    for (let i = 0; i < zigCount; i++) {
      ctx.lineTo(x + (i + 0.5) * zigW, y);
      ctx.lineTo(x + (i + 1) * zigW, y + zigH);
    }
    ctx.lineTo(x + w, y + h - zigH);
    ctx.lineTo(tx + tailW * 0.5, y + h - zigH);
    ctx.lineTo(tx + 4, y + h + tailH);
    ctx.lineTo(tx - tailW * 0.5, y + h - zigH);
    ctx.lineTo(x, y + h - zigH);
    ctx.closePath();

    ctx.fillStyle = '#fffef7';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();
    ctx.restore();
  }

  // Cache for preloaded AI Animal Instatoon 2x2 sheets (/src/assets/webtoon/{calc}.jpg)
  const categoryImageCache = {};

  function getCategoryInstatoonImage(calcKey) {
    if (typeof Image === 'undefined') return null;
    const key = calcKey || 'electric';
    if (categoryImageCache[key]) {
      return categoryImageCache[key].loaded ? categoryImageCache[key].img : null;
    }
    const img = new Image();
    const entry = { img, loaded: false };
    categoryImageCache[key] = entry;
    img.onload = function () {
      entry.loaded = true;
      refreshActive();
    };
    img.src = `/src/assets/webtoon/${key}.jpg`;
    return null;
  }

  /**
   * Helper: Draw 100% uncropped quadrant (panelIdx 0..3) of the 2x2 AI Animal Instatoon sheet
   */
  function drawInstatoonQuadrant(ctx, img, panelIdx, dx, dy, dw, dh, radius = 10) {
    const halfW = img.naturalWidth / 2;
    const halfH = img.naturalHeight / 2;
    const col = panelIdx % 2;
    const row = Math.floor(panelIdx / 2);
    const outerPad = Math.round(halfW * 0.038);
    const innerPad = Math.round(halfW * 0.028);
    const sx = col === 0 ? outerPad : halfW + innerPad;
    const sy = row === 0 ? outerPad : halfH + innerPad;
    const sw = halfW - outerPad - innerPad;
    const sh = halfH - outerPad - innerPad;

    ctx.save();
    drawRoundedRect(ctx, dx, dy, dw, dh, radius);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  }

  /**
   * Draw a single authentic Instatoon panel at (px, py, pw, ph)
   * - ZERO mechanical '1컷 · ...' header pills or bottom dark caption bars
   * - Speech bubbles & compact receipt memo sit strictly in the top 34%~37% empty wall space
   */
  function drawSinglePanel(ctx, panelIdx, px, py, pw, ph, preset, story) {
    const { meta } = story;
    const scaleX = pw / 502;
    const scaleY = ph / 472;
    const artImg = getCategoryInstatoonImage(preset.calc);
    const cleanSpeech1 = String(meta.panel1Bubble || '').replace(/^"+|"+$/g, '');
    const cleanSpeech2 = String(meta.panel2Bubble || '').replace(/^"+|"+$/g, '');

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scaleX, scaleY);

    const W = 502;
    const H = 472;
    const panelRadius = 10;
    const bgColors = ['#fef9ee', '#e0f2fe', '#dcfce7', '#fef08a'];

    // 1. Panel Base Background + Full Uncropped Animal Illustration
    drawRoundedRect(ctx, 0, 0, W, H, panelRadius);
    ctx.fillStyle = bgColors[panelIdx] || '#faf7f2';
    ctx.fill();

    if (artImg) {
      drawInstatoonQuadrant(ctx, artImg, panelIdx, 0, 0, W, H, panelRadius);
    } else {
      const mood = panelIdx === 1 ? 'smart' : panelIdx === 3 ? 'happy' : 'shock';
      const sp = panelIdx === 1 ? 'fox' : meta.species || 'quokka';
      if (panelIdx === 0) {
        drawComicFocusLines(ctx, W * 0.5, H * 0.66, W, H, 'rgba(244, 63, 94, 0.12)');
      }
      drawAnimalCharacter(ctx, W * 0.5, H * 0.66, sp, mood, '#fecdd3', 1.15);
    }

    // 2. Top Speech Bubble / Compact Receipt (Strictly in top empty wall space — ZERO character overlap!)
    if (panelIdx === 0) {
      const bx = 16;
      const by = 14;
      const bw = W - 32;
      const bh = 104;
      drawSpeechBubble(ctx, bx, by, bw, bh, 18, W * 0.42, -1);

      // Cute speaker chip
      drawRoundedRect(ctx, bx + 14, by + 10, 165, 24, 12);
      ctx.fillStyle = '#ffe4e6';
      ctx.fill();
      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
      ctx.fillText(`① 🐾 ${meta.charName}`, bx + 24, by + 27);

      // Tilted Comic SFX sticker on top-right of bubble
      ctx.save();
      ctx.translate(bx + bw - 54, by + 22);
      ctx.rotate(0.05);
      drawRoundedRect(ctx, -42, -12, 84, 24, 8);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12.5px "Malgun Gothic", sans-serif';
      ctx.fillText(meta.sfxShock || '콰아앙⚡', -32, 4);
      ctx.restore();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, `"${cleanSpeech1}"`, bx + 16, by + 56, bw - 32, 23, 2);
    } else if (panelIdx === 1) {
      const bx = 16;
      const by = 14;
      const bw = W - 32;
      const bh = 104;
      drawSpeechBubble(ctx, bx, by, bw, bh, 18, W * 0.30, -1);

      // Speaker chip
      drawRoundedRect(ctx, bx + 14, by + 10, 185, 24, 12);
      ctx.fillStyle = '#dbeafe';
      ctx.fill();
      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
      ctx.fillText(`② 🦊 ${meta.expertName}`, bx + 24, by + 27);

      // Fact-check badge
      drawRoundedRect(ctx, bx + bw - 116, by + 10, 102, 24, 12);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
      ctx.fillText('🚨 팩트폭격✨', bx + bw - 104, by + 26);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15.5px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, `"${cleanSpeech2}"`, bx + 16, by + 56, bw - 32, 23, 2);
    } else if (panelIdx === 2) {
      const rx = 14;
      const ry = 12;
      const rw = W - 28;
      const rh = 164;
      drawPerforatedReceiptCard(ctx, rx, ry, rw, rh, W * 0.62);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
      ctx.fillText('③ 🧾 머니핏 3초 실물 비교 영수증', rx + 16, ry + 26);

      // Red Diagonal Stamp (🚨 호구주의보)
      ctx.save();
      ctx.translate(rx + rw - 64, ry + 21);
      ctx.rotate(-0.06);
      drawRoundedRect(ctx, -48, -11, 96, 22, 6);
      ctx.fillStyle = '#fee2e2';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 11.5px "Malgun Gothic", sans-serif';
      ctx.fillText('🚨 호구주의보', -39, 4);
      ctx.restore();

      // Row 1: ❌ 호구 평균 지출 (Left label, Right value)
      const r1Y = ry + 36;
      const rowH = 35;
      drawRoundedRect(ctx, rx + 14, r1Y, rw - 28, rowH, 8);
      ctx.fillStyle = '#ffe4e6';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fda4af';
      ctx.stroke();

      ctx.fillStyle = '#9f1239';
      ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
      ctx.fillText(`❌ ${meta.badLabel || '호구 평균 지출'}`, rx + 24, r1Y + 23);
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 15.5px "Malgun Gothic", sans-serif';
      ctx.fillText(meta.badVal, rx + rw - 24, r1Y + 23);
      ctx.restore();

      // Row 2: ✅ 상위 1% 절약 지출 (Left label, Right value)
      const r2Y = r1Y + rowH + 5;
      drawRoundedRect(ctx, rx + 14, r2Y, rw - 28, rowH, 8);
      ctx.fillStyle = '#d1fae5';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#6ee7b7';
      ctx.stroke();

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
      ctx.fillText(`✅ ${meta.goodLabel || '상위 1% 절약 지출'}`, rx + 24, r2Y + 23);
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 15.5px "Malgun Gothic", sans-serif';
      ctx.fillText(meta.goodVal, rx + rw - 24, r2Y + 23);
      ctx.restore();

      // Row 3: 😭 모르면 날리는 생돈 (Dark highlight bar)
      const r3Y = r2Y + rowH + 5;
      drawRoundedRect(ctx, rx + 14, r3Y, rw - 28, rowH + 2, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
      ctx.fillText('😭 모르면 날리는 생돈', rx + 24, r3Y + 24);
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16.5px "Malgun Gothic", sans-serif';
      ctx.fillText(meta.diffVal, rx + rw - 24, r3Y + 24);
      ctx.restore();
    } else if (panelIdx === 3) {
      const bx = 16;
      const by = 14;
      const bw = W - 32;
      const bh = 104;
      drawSpeechBubble(ctx, bx, by, bw, bh, 18, W * 0.50, 1);

      drawRoundedRect(ctx, bx + 14, by + 10, bw - 28, 26, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#eab308';
      ctx.stroke();
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 13.5px "Malgun Gothic", sans-serif';
      ctx.fillText('④ ❓ 내 조건 넣으면 상위 몇 % 호구일까?', bx + 24, by + 28);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15.5px "Malgun Gothic", sans-serif';
      drawWrappedText(ctx, '"내 숫자 넣고 3초 만에 무료 영수증 뽑기 완료!"', bx + 16, by + 60, bw - 32, 22, 1);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 14.5px "Malgun Gothic", sans-serif';
      ctx.fillText('✨ 검색창에 [ truthofmarket ] 검색하면 3초 무료 계산!', bx + 16, by + 86);
    }

    // 3. Crisp Authentic Comic Panel Outline (#1e293b, 4.5px)
    drawRoundedRect(ctx, 0, 0, W, H, panelRadius);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

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

    // Warm Cream Ivory Manuscript Paper Background
    ctx.fillStyle = '#faf7f2';
    ctx.fillRect(0, 0, 1080, 1080);

    // Clean Webtoon Episode Header (No dark dashboard box)
    drawRoundedRect(ctx, 28, 16, 178, 36, 18);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
    ctx.fillText('🐾 머니핏 인스타툰', 44, 40);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 26px "Malgun Gothic", sans-serif';
    drawWrappedText(ctx, `${preset.keyword || preset.title} 편`, 220, 43, 830, 32, 1);

    // 4 Panels in 2x2 Grid (each 502x472)
    const positions = [
      { x: 28, y: 66 },
      { x: 550, y: 66 },
      { x: 28, y: 554 },
      { x: 550, y: 554 }
    ];

    for (let i = 0; i < 4; i++) {
      drawSinglePanel(ctx, i, positions[i].x, positions[i].y, 502, 472, preset, story);
    }

    // Manuscript Bottom Footer Pill
    drawRoundedRect(ctx, 28, 1036, 1024, 34, 17);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 16.5px "Malgun Gothic", sans-serif';
    ctx.fillText('📌 저장해두고 비교해보세요!   |   🔎 무료 3초 계산기는 프로필 링크 또는 검색창에 [ truthofmarket ] 검색!', 64, 1059);
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
        ctx.fillStyle = '#faf7f2';
        ctx.fillRect(0, 0, 1080, 1080);
        drawSinglePanel(ctx, i, 36, 28, 1008, 992, preset, story);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px "Malgun Gothic", sans-serif';
        ctx.fillText('📌 저장해두고 비교해보세요!  |  🔎 프로필 링크 또는 검색창에 [ truthofmarket ] 검색!', 72, 1056);
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

    const searchQuery = encodeURIComponent(preset.keyword || preset.title || '원룸 에어컨 전기세');
    const jisikinLinkEl = document.getElementById('sniper-jisikin-link');
    if (jisikinLinkEl) {
      jisikinLinkEl.href = `https://kin.naver.com/search/list.naver?sort=date&query=${searchQuery}`;
    }
    const cafeLinkEl = document.getElementById('sniper-cafe-link');
    if (cafeLinkEl) {
      cafeLinkEl.href = `https://search.naver.com/search.naver?where=article&query=${searchQuery}`;
    }

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

    // Populate Naver Blog / Jisik-iN / Cafe elements
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
    drawAnimalCharacter,
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
