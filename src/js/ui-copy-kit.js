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

    const wsMod = (typeof window !== 'undefined' && window.MoneyFitWebtoonStories) || null;
    if (wsMod && typeof wsMod.resolveDynamicReceiptValues === 'function') {
      const customStory = wsMod.resolveDynamicReceiptValues(preset, calcRes);
      const meta = {
        species: customStory.species,
        charName: customStory.charName,
        expertName: customStory.expertName,
        tag: customStory.badge,
        sfxShock: customStory.sfxShock,
        panel1Title: `1컷 · ${customStory.badge}`,
        panel1Bubble: `"${customStory.panel1Speech}"`,
        panel1Sub: customStory.panel1Sub,
        panel2Title: `2컷 · ${customStory.expertName}의 핵심 진단`,
        panel2Bubble: `"${customStory.panel2Speech}"`,
        panel2Sub: customStory.panel2Sub,
        badLabel: customStory.badLabel,
        badVal: customStory.badVal,
        goodLabel: customStory.goodLabel,
        goodVal: customStory.goodVal,
        diffVal: customStory.diffVal,
        hashtags: customStory.hashtags,
        shortCartoon: customStory.shortCartoon
      };

      const threadsMain = [
        `[${customStory.badge}] ${customStory.hookLine}`,
        ``,
        customStory.factLine,
        ``,
        `🧾 [${customStory.receiptTitle}]`,
        `• 비교 기준 (${meta.badLabel}): ${meta.badVal}`,
        `• 맞춤 설계 (${meta.goodLabel}): ${meta.goodVal}`,
        `• 핵심 차액 (${customStory.diffLabel}): ${meta.diffVal}`,
        ``,
        customStory.closingLine,
        `👇 무료 시뮬레이터 주소는 바로 아래 첫 번째 댓글에 남겨두었습니다.`
      ].join('\n');

      const threadsReply = [
        `🔗 「${preset.title}」 3초 무료 계산기 (회원가입·앱 설치 없음)`,
        `${presetUrl}`,
        ``,
        customStory.closingLine
      ].join('\n');

      const instaCaption = [
        `[${customStory.badge}] "${preset.title}" (${meta.charName} × ${meta.expertName} 4컷 정리)`,
        ``,
        customStory.hookLine,
        customStory.factLine,
        ``,
        `🧾 3번째 슬라이드 [${customStory.receiptTitle}] 핵심 요약`,
        `• ${meta.badLabel}: ${meta.badVal}`,
        `• ${meta.goodLabel}: ${meta.goodVal}`,
        `• ${customStory.diffLabel}: ${meta.diffVal}`,
        `• 핵심 판정: ${calcRes.headline}${m0 ? ` (${m0} / ${m1})` : ''}`,
        ``,
        customStory.closingLine,
        `📌 필요할 때 바로 꺼내 보시려면 [저장] 해두시고, 같은 고민 중인 지인에게 공유해 보세요!`,
        `👉 프로필 링크 또는 검색창에 [ truthofmarket ]을 검색하면 무료 시뮬레이터로 연결됩니다.`,
        ``,
        meta.hashtags
      ].join('\n');

      const fbPost = [
        `[${customStory.badge}] ${preset.title} — 실제 공식으로 비교해 본 손익 영수증`,
        ``,
        customStory.hookLine,
        customStory.factLine,
        ``,
        `📊 [${customStory.receiptTitle}]`,
        `• ${meta.badLabel}: ${meta.badVal}`,
        `• ${meta.goodLabel}: ${meta.goodVal}`,
        `• ${customStory.diffLabel}: ${meta.diffVal}`,
        `• 한줄 결론: ${calcRes.headline}${m2 ? ` (${m2})` : ''}`,
        ``,
        customStory.closingLine,
        `직접 내 숫자를 넣어 비교해 볼 수 있는 무료 계산기 주소는 첫 번째 댓글에 남겨두었습니다.`
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

    const weeks = calcRes.weeks || (preset.inputs && preset.inputs.weeks) || 4;
    const packs = calcRes.chickenPacks || 100;
    const bowls = calcRes.brownRiceBowls || 56;
    const dietBadCost = packs * 2900 + bowls * 2200;
    const dietGoodCost = packs * 1250 + bowls * 1050;

    const sceneByCalc = {
      electric: {
        species: 'quokka',
        charName: '자취생 쿼카찌',
        expertName: '안경 여우 에너지박사',
        tag: '전기요금 누진세 진단',
        sfxShock: '콰아앙⚡',
        panel1Title: '1컷 · 관리비 고지서 개봉 직후',
        panel1Bubble: `"${preset.title} 조건으로 틀었더니 이번 달 전기세가 왜 이래?!"`,
        panel1Sub: '한전 3단계 누진세 구간 진입 주의',
        panel2Title: '2컷 · 에너지박사의 핵심 진단',
        panel2Bubble: `"기본 전력량과 합산된 누진 구간을 확인하고 1등급 인버터 회수기간을 비교해야 합니다!"`,
        panel2Sub: '구형 가전 vs 1등급 인버터 본전 회수기간 계산',
        badLabel: '구형/기준 조건 월 지출',
        badVal: calcRes.afterBill ? `${calcRes.afterBill.toLocaleString()}원/월` : '88,420원/월',
        goodLabel: '1등급 인버터 절전 지출',
        goodVal:
          calcRes.afterBill && calcRes.monthlySaving
            ? `${Math.max(0, calcRes.afterBill - calcRes.monthlySaving).toLocaleString()}원/월`
            : '31,200원/월',
        diffVal: calcRes.monthlySaving ? `-${calcRes.monthlySaving.toLocaleString()}원/월 절약` : '-57,220원/월 절약',
        hashtags: '#전기요금계산기 #누진세계산 #인버터에어컨 #자취방관리비 #에너지효율1등급'
      },
      diet: {
        species: 'shiba',
        charName: '헬스 시바견 득근이',
        expertName: '안경 여우 영양박사',
        tag: '식단 TDEE & 장보기 진단',
        sfxShock: '두둥탁!!',
        panel1Title: '1컷 · 식단 장보기 고민',
        panel1Bubble: `"${preset.title}, 감으로 사 먹었더니 식비만 나가고 목표 달성이 안 돼!"`,
        panel1Sub: '기초대사량(BMR)과 활동대사량(TDEE) 정량 설계 필수',
        panel2Title: '2컷 · 영양박사의 핵심 진단',
        panel2Bubble: `"체중별 TDEE 탄·단·지(g) 정량에 맞춰 닭가슴살 ${packs}팩과 현미밥 ${bowls}개를 준비하세요!"`,
        panel2Sub: `${weeks}주 맞춤 장보기 수량 산출`,
        badLabel: `편의점·소매 ${weeks}주 지출`,
        badVal: `${dietBadCost.toLocaleString()}원/${weeks}주`,
        goodLabel: `TDEE 정량 묶음(${packs}팩)`,
        goodVal: `${dietGoodCost.toLocaleString()}원/${weeks}주`,
        diffVal: `-${Math.max(0, dietBadCost - dietGoodCost).toLocaleString()}원 절약`,
        hashtags: '#다이어트식단계산기 #TDEE계산기 #닭가슴살장보기 #탄단지비율 #헬스식단표'
      },
      pet: {
        species: 'cat',
        charName: '집사 치즈냥 박사',
        expertName: '안경 여우 수의영양사',
        tag: '수의영양학 사료량 진단',
        sfxShock: '헉..!!',
        panel1Title: '1컷 · 눈대중 사료 급여 고민',
        panel1Bubble: `"${preset.title}, 하루에 정확히 몇 g씩 줘야 건강하게 오래 살까?"`,
        panel1Sub: '개체별 대사체중(RER)과 활동 계수(DER) 반영 필수',
        panel2Title: '2컷 · 수의영양사의 핵심 진단',
        panel2Bubble: `"하루 권장량은 ${calcRes.dailyGrams || 85}g(1끼 ${calcRes.halfGrams || 42}g)이며 1포대는 ${calcRes.daysPerBag || 22}일 만에 소진됩니다!"`,
        panel2Sub: '사료 1포대 소진 일수 & 의료비 예비비 3초 진단',
        badLabel: '눈대중 과급여 + 무보험 위험',
        badVal: `일 ${Math.round((calcRes.dailyGrams || 85) * 1.35)}g 과급여`,
        goodLabel: 'DER 정량 배식',
        goodVal: `일 ${calcRes.dailyGrams || 85}g (${calcRes.daysPerBag || 22}일 소진)`,
        diffVal: `1끼 ${calcRes.halfGrams || 42}g 정량 · 병원비 방어`,
        hashtags: '#강아지사료급여량 #고양이사료량계산 #반려동물양육비 #슬개골예방 #펫보험비교'
      },
      room: {
        species: 'bear',
        charName: '독립 아기곰 포근이',
        expertName: '안경 여우 견적박사',
        tag: '자취·신혼 풀세팅 예산 배분',
        sfxShock: '두둥탁!!',
        panel1Title: '1컷 · 가전·가구 장바구니 고민',
        panel1Bubble: `"${preset.title}, 예산 초과 없이 필수 품목을 다 채울 수 있을까?"`,
        panel1Sub: '품목별 황금 배분 비율(BOM) 준수 필수',
        panel2Title: '2컷 · 견적박사의 핵심 진단',
        panel2Bubble: `"예산별 가전·가구 황금 배분표(BOM)대로 구성하면 단 1원도 넘기지 않고 세팅됩니다!"`,
        panel2Sub: '원룸 50만 원부터 신혼 1,000만 원까지 예산 초과 0원 공식',
        badLabel: '오프라인/무계획 단품 구매',
        badVal:
          calcRes.totalCost && calcRes.savingWon
            ? `${(calcRes.totalCost + calcRes.savingWon).toLocaleString()}원`
            : '2,840,000원',
        goodLabel: '황금비율 BOM 최적 세팅',
        goodVal: calcRes.totalCost ? `${calcRes.totalCost.toLocaleString()}원` : '1,480,000원',
        diffVal: calcRes.savingWon ? `-${calcRes.savingWon.toLocaleString()}원 절약` : '-1,360,000원 절약',
        hashtags: '#원룸가전견적 #자취방풀세팅 #신혼가전예산 #인테리어견적 #자취필수템'
      },
      auto: {
        species: 'fox',
        charName: '골든 리트리버 대리',
        expertName: '안경 여우 세무사',
        tag: '신차 할부 vs 렌트·리스 TCO',
        sfxShock: '콰아앙⚡',
        panel1Title: '1컷 · 월 납입금 착시 주의',
        panel1Bubble: `"${preset.title}, 월 납입금만 보지 말고 세금이랑 보험료까지 합치면 뭐가 유리해?"`,
        panel1Sub: '취등록세·보험료·자동차세·절세액을 합산한 총비용 비교',
        panel2Title: '2컷 · 여우 세무사의 핵심 진단',
        panel2Bubble: `"취등록세와 보험료, 사업자 절세 효과까지 합산한 총소유비용(TCO)으로 비교해야 정확합니다!"`,
        panel2Sub: '장기렌트 vs 리스 vs 할부 vs 현금 총비용 1:1 영수증',
        badLabel: '취등록세·보험 별도 신차 할부',
        badVal: calcRes.installmentTco ? `${calcRes.installmentTco.toLocaleString()}원` : '54,820,000원',
        goodLabel: '세율·보험 맞춤 최적 플랜',
        goodVal: calcRes.rentTco ? `${calcRes.rentTco.toLocaleString()}원` : '46,150,000원',
        diffVal: calcRes.diffMan ? `-${calcRes.diffMan.toLocaleString()}만 원 절약` : '-8,670,000원 절약',
        hashtags: '#신차장기렌트비교 #자동차할부계산기 #사업자차량절세 #취등록세계산 #자동차TCO'
      },
      telecom: {
        species: 'raccoon',
        charName: '알뜰 라쿤 대리',
        expertName: '안경 여우 통신박사',
        tag: '인터넷 약정 위약금 vs 사은품',
        sfxShock: '두둥탁!!',
        panel1Title: '1컷 · 통신 약정 유지 vs 이동 고민',
        panel1Bubble: `"${preset.title}, 위약금 내고 갈아타는 거랑 그냥 쓰는 것 중 뭐가 이득이지?"`,
        panel1Sub: '잔여 위약금 vs 당일 현금 지원금 및 요금 인하액 대조',
        panel2Title: '2컷 · 통신박사의 핵심 진단',
        panel2Bubble: `"현금 지원금에서 위약금을 차감하고도 당일 흑자 + 3년 요금 절감까지 합치면 갈아타기가 유리합니다!"`,
        panel2Sub: '내 잔여 위약금 vs 현금 사은품 순수익 3초 계산',
        badLabel: '기존 통신사 그대로 유지 시',
        badVal: '0원 (기존 요금 계속 납부)',
        goodLabel: '사은품 대납 + 신규 결합 환승',
        goodVal: calcRes.totalNetBenefit ? `+${calcRes.totalNetBenefit.toLocaleString()}원 순익` : '+518,000원 순익',
        diffVal: calcRes.immediateNetWon ? `당일 현금 +${calcRes.immediateNetWon.toLocaleString()}원` : '+448,000원 이득',
        hashtags: '#인터넷갈아타기 #통신사위약금계산 #인터넷사은품비교 #알뜰폰결합 #통신비절약'
      }
    };

    const meta = sceneByCalc[preset.calc] || sceneByCalc.electric;

    const threadsMain = [
      `🐾 [4컷 공감툰] ${meta.panel1Bubble}`,
      ``,
      `솔직히 다들 이렇게 생각하고 그냥 쓰지 않나요..? 😭`,
      `막상 내 조건 넣어서 계산해보면 생각보다 차이가 엄청 크더라고요!`,
      `• 그냥 모르고 쓸 때 (${meta.badLabel}): ${meta.badVal}`,
      `• 제대로 맞췄을 때 (${meta.goodLabel}): ${meta.goodVal}`,
      `• 아낄 수 있는 돈: ${meta.diffVal}`,
      ``,
      `👇 내 조건 넣으면 3초 만에 얼마 차이 나는지 알려주는 무료 계산기는 첫 번째 댓글 링크에 남겨둘게요!`
    ].join('\n');

    const threadsReply = [
      `🔗 「${preset.title}」 3초 무료 계산기 (회원가입·설치 없음)`,
      `${presetUrl}`,
      ``,
      `내 숫자만 넣으면 실시간으로 얼마 아낄 수 있는지 바로 나와요!`
    ].join('\n');

    const instaCaption = [
      `🐾 ${meta.panel1Bubble}`,
      `(${meta.charName} × ${meta.expertName}의 4컷 일상 공감툰 💬)`,
      ``,
      `솔직히 저만 이렇게 생각하고 있었던 거 아니죠..? 😭`,
      `여우 친구한테 팩폭 맞고 계산해봤더니 이만큼이나 차이 나네요!`,
      ``,
      `💡 [한눈에 보는 현실 비교]`,
      `• 모르고 그냥 쓸 때 (${meta.badLabel}): ${meta.badVal}`,
      `• 똑똑하게 바꿀 때 (${meta.goodLabel}): ${meta.goodVal}`,
      `• 아끼는 생돈: ${meta.diffVal}`,
      ``,
      `📌 까먹기 전에 [저장] 해두시고 주변 친구·가족한테도 슬쩍 공유해 주세요!`,
      `👉 우리 집 3초 무료 계산기는 @moneyfit2026 프로필 링크 또는 검색창에 「머니핏」 검색!`,
      ``,
      `#인스타툰 #생활비절약 #자취꿀팁 #머니핏`
    ].join('\n');

    const fbPost = [
      `🐾 [4컷 공감툰] ${meta.panel1Bubble}`,
      ``,
      `💡 핵심만 비교해보면 이만큼이나 차이 납니다:`,
      `• ${meta.badLabel}: ${meta.badVal}`,
      `• ${meta.goodLabel}: ${meta.goodVal}`,
      `• 차이: ${meta.diffVal}`,
      ``,
      `${calcRes.summary}`,
      ``,
      `내 조건 넣으면 3초 만에 계산해주는 무료 계산기 주소는 첫 번째 댓글에 남겨두었습니다!`
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
    const tailW = 22;
    const tailH = 16;
    const tx = Math.max(x + r + tailW, Math.min(x + w - r - tailW, tailX));

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

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

    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 4.8;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.restore();
  }

  function drawCutBadge(ctx, num, bx, by) {
    const labels = ['1컷 · 착각', '2컷 · 팩폭', '3컷 · 충격', '4컷 · 해결'];
    const colors = ['#f59e0b', '#ef4444', '#e11d48', '#10b981'];
    const label = labels[num - 1] || `${num}컷`;
    const bg = colors[num - 1] || '#0f172a';

    ctx.save();
    ctx.font = '900 16.5px "Pretendard", "Malgun Gothic", sans-serif';
    const tw = ctx.measureText(label).width;
    const pw = tw + 24;
    const ph = 28;
    const px = bx + 16;
    const py = by - 13;

    drawRoundedRect(ctx, px, py, pw, ph, 14);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px + pw / 2, py + ph / 2 + 1);
    ctx.restore();
  }

  // Inject Google Fonts / Local Webtoon Fonts for Browser Canvas Studio
  let fontsInjected = false;
  function ensureInstatoonFontsLoaded() {
    if (fontsInjected || typeof document === 'undefined') return;
    fontsInjected = true;
    try {
      const style = document.createElement('style');
      style.textContent = `
        @font-face { font-family: 'Gaegu'; font-style: normal; font-weight: 400; src: url('/src/assets/fonts/Gaegu-400.ttf') format('truetype'); }
        @font-face { font-family: 'Gaegu'; font-style: normal; font-weight: 700; src: url('/src/assets/fonts/Gaegu-700.ttf') format('truetype'); }
        @font-face { font-family: 'Jua'; font-style: normal; font-weight: 400; src: url('/src/assets/fonts/Jua-400.ttf') format('truetype'); }
        @font-face { font-family: 'Nanum Pen Script'; font-style: normal; font-weight: 400; src: url('/src/assets/fonts/NanumPenScript-400.ttf') format('truetype'); }
      `;
      document.head.appendChild(style);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          refreshActive();
        });
      }
    } catch (e) {}
  }

  function drawBlurredRoomBackground(ctx, x, y, w, h, cutNum, r) {
    ctx.save();
    drawRoundedRect(ctx, x, y, w, h, r);
    ctx.clip();

    const wallGrad = ctx.createLinearGradient(x, y, x, y + h);
    if (cutNum === 3) {
      wallGrad.addColorStop(0, '#9ca3af');
      wallGrad.addColorStop(0.55, '#cbd5e1');
      wallGrad.addColorStop(1, '#64748b');
    } else {
      wallGrad.addColorStop(0, '#a8a29e');
      wallGrad.addColorStop(0.5, '#d6d3d1');
      wallGrad.addColorStop(1, '#78716c');
    }
    ctx.fillStyle = wallGrad;
    ctx.fillRect(x, y, w, h);

    ctx.save();
    ctx.filter = 'blur(' + Math.max(12, Math.round(w * 0.035)) + 'px)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.fillRect(x + w * 0.04, y + h * 0.14, w * 0.28, h * 0.42);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.fillRect(x + w * 0.58, y + h * 0.08, w * 0.34, h * 0.36);

    ctx.fillStyle = 'rgba(254, 249, 195, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.12, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(30, 27, 24, 0.48)';
    ctx.fillRect(x - w * 0.02, y + h * 0.52, w * 0.32, h * 0.18);

    ctx.fillStyle = cutNum === 3 ? 'rgba(30, 64, 175, 0.38)' : 'rgba(54, 83, 20, 0.62)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.72, y + h * 0.62, w * 0.22, h * 0.09, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(245, 245, 244, 0.55)';
    ctx.fillRect(x + w * 0.56, y + h * 0.68, w * 0.38, h * 0.22);
    ctx.restore();

    const vig = ctx.createRadialGradient(x + w * 0.5, y + h * 0.55, w * 0.25, x + w * 0.5, y + h * 0.55, w * 0.75);
    vig.addColorStop(0, 'rgba(255,255,255,0.08)');
    vig.addColorStop(1, 'rgba(15,23,42,0.16)');
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function drawTopNarrationBox(ctx, text, x, y, w, s = 1) {
    const boxH = 44 * s;
    const boxY = y + 14 * s;
    ctx.save();

    let fontSize = 19.5 * s;
    ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    while (fontSize > 14 * s && ctx.measureText(text).width > w - 54 * s) {
      fontSize -= 0.5 * s;
      ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    }
    const textW = ctx.measureText(text).width;
    const boxW = Math.min(w - 24 * s, Math.max(w * 0.76, textW + 42 * s));
    const boxX = x + (w - boxW) / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = 7 * s;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3 * s;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.6 * s;
    ctx.strokeStyle = '#111111';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, boxX + boxW / 2, boxY + boxH / 2 + 1 * s);
    ctx.restore();
  }

  function drawOvalSpeechBubbleWithContrast(ctx, lines, cx, cy, rx, ry, s = 1, accentColor = '#111111', highlightColor = '#fef08a') {
    ctx.save();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur = 8 * s;
    ctx.shadowOffsetY = 3 * s;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5 * s;
    ctx.strokeStyle = '#111111';
    ctx.stroke();

    const maxAllowedW = rx * 1.74;
    let baseSize = (lines.length === 1 ? 42 : 33.5) * s;
    const emphRatio = 1.34;

    const measureRichLine = (rawLine, bSize) => {
      const segs = String(rawLine || '').split('**');
      let total = 0;
      segs.forEach((seg, idx) => {
        if (!seg) return;
        const isEmph = idx % 2 === 1;
        const sz = isEmph ? bSize * emphRatio : bSize;
        ctx.font = '700 ' + sz.toFixed(1) + 'px "Gaegu", "Jua", "Malgun Gothic", sans-serif';
        total += ctx.measureText(seg).width;
      });
      return total;
    };

    lines.forEach(rawLine => {
      while (baseSize > 22 * s && measureRichLine(rawLine, baseSize) > maxAllowedW) {
        baseSize -= 0.5 * s;
      }
    });

    const lineSpacing = baseSize * 1.25;
    const totalBlockH = (lines.length - 1) * lineSpacing;
    const firstLineY = cy - totalBlockH / 2 + baseSize * 0.34;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    lines.forEach((rawLine, lineIdx) => {
      const segs = String(rawLine || '').split('**');
      const lineW = measureRichLine(rawLine, baseSize);
      let curX = cx - lineW / 2;
      const baseY = firstLineY + lineIdx * lineSpacing;

      segs.forEach((seg, segIdx) => {
        if (!seg) return;
        const isEmph = segIdx % 2 === 1;
        const sz = isEmph ? baseSize * emphRatio : baseSize;
        ctx.font = '700 ' + sz.toFixed(1) + 'px "Gaegu", "Jua", "Malgun Gothic", sans-serif';
        const segW = ctx.measureText(seg).width;

        if (isEmph) {
          ctx.save();
          ctx.fillStyle = highlightColor;
          drawRoundedRect(ctx, curX - 3 * s, baseY - sz * 0.52, segW + 6 * s, sz * 0.58, 6 * s);
          ctx.fill();
          ctx.restore();

          const bounceY = baseY - 2 * s;
          ctx.lineWidth = 2.4 * s;
          ctx.strokeStyle = accentColor;
          ctx.lineJoin = 'round';
          ctx.strokeText(seg, curX, bounceY);
          ctx.fillStyle = accentColor;
          ctx.fillText(seg, curX, bounceY);
        } else {
          ctx.lineWidth = 1.0 * s;
          ctx.strokeStyle = '#111111';
          ctx.lineJoin = 'round';
          ctx.strokeText(seg, curX, baseY);
          ctx.fillStyle = '#111111';
          ctx.fillText(seg, curX, baseY);
        }

        curX += segW;
      });
    });

    ctx.restore();
  }

  function drawHandwrittenSideNotes(ctx, leftLines, rightLines, x, y, w, h, s = 1) {
    ctx.save();

    const drawHaloHandwriting = (linesArr, tx, ty, tiltRad, align = 'center') => {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(tiltRad);
      ctx.font = '400 ' + (29.5 * s).toFixed(1) + 'px "Nanum Pen Script", "Gaegu", cursive';
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      linesArr.forEach((ln, idx) => {
        const ly = idx * 25 * s;
        ctx.lineWidth = 6.5 * s;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(ln, 0, ly);
        ctx.fillStyle = '#111111';
        ctx.fillText(ln, 0, ly);
      });
      ctx.restore();
    };

    if (leftLines && leftLines.length) {
      drawHaloHandwriting(leftLines, x + 76 * s, y + 216 * s, -0.06, 'center');
      const lStartY = y + (216 + leftLines.length * 23 + 4) * s;
      ctx.save();
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 3.2 * s;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 62 * s, lStartY);
      ctx.quadraticCurveTo(x + 68 * s, y + 286 * s, x + 132 * s, y + 292 * s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 116 * s, y + 282 * s);
      ctx.lineTo(x + 134 * s, y + 292 * s);
      ctx.lineTo(x + 117 * s, y + 303 * s);
      ctx.stroke();
      ctx.restore();
    }

    if (rightLines && rightLines.length) {
      drawHaloHandwriting(rightLines, x + 422 * s, y + 212 * s, 0.05, 'center');
      const rStartY = y + (212 + rightLines.length * 23 + 4) * s;
      ctx.save();
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 3.2 * s;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 436 * s, rStartY);
      ctx.quadraticCurveTo(x + 432 * s, y + 288 * s, x + 372 * s, y + 294 * s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 388 * s, y + 283 * s);
      ctx.lineTo(x + 370 * s, y + 294 * s);
      ctx.lineTo(x + 387 * s, y + 305 * s);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function getCharacterConfigForPreset(slug, calcKey) {
    const s = String(slug || '').toLowerCase();
    const def = {
      hero: {
        hairStyle: 'bun',
        hairColor: '#f9a89a',
        headwear: 'none',
        headwearColor: '#fde047',
        outfit: 'home_tee',
        shirtColor: '#bae6fd',
        pose1: 'remote',
        gender: 'female'
      },
      mentor: {
        type: 'senior_pro',
        hairColor: '#a5b4fc',
        shirtColor: '#e0e7ff',
        glasses: true
      }
    };
  
    if (calcKey === 'auto') {
      if (s.includes('casper')) {
        return {
          hero: { hairStyle: 'twin_buns', hairColor: '#f9a89a', headwear: 'none', headwearColor: '#fde047', outfit: 'hoodie', shirtColor: '#fef08a', pose1: 'wheel', gender: 'female' },
          mentor: { type: 'tax_pro', hairColor: '#64748b', shirtColor: '#e2e8f0', glasses: true }
        };
      } else if (s.includes('tucson') || s.includes('ioniq')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'none', headwearColor: '#38bdf8', outfit: 'office_shirt', shirtColor: '#e2e8f0', pose1: 'wheel', gender: 'male' },
          mentor: { type: 'auto_master', hairColor: '#334155', shirtColor: '#0284c7', glasses: true }
        };
      } else if (s.includes('grandeur') || s.includes('genesis')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#0f172a', headwear: 'none', headwearColor: '#94a3b8', outfit: 'office_shirt', shirtColor: '#cbd5e1', pose1: 'car_key', gender: 'male' },
          mentor: { type: 'tax_pro', hairColor: '#1e293b', shirtColor: '#334155', glasses: true }
        };
      } else {
        // auto-avante-3000 (20대 사회초년생 첫차)
        return {
          hero: { hairStyle: 'short', hairColor: '#334155', headwear: 'cap', headwearColor: '#3b82f6', outfit: 'hoodie', shirtColor: '#93c5fd', pose1: 'car_key', gender: 'male' },
          mentor: { type: 'tax_pro', hairColor: '#1e3a8a', shirtColor: '#e0e7ff', glasses: true }
        };
      }
    }
  
    if (calcKey === 'diet') {
      if (s.includes('female') || s.includes('quick-3kg')) {
        return {
          hero: { hairStyle: s.includes('quick-3kg') ? 'twin_buns' : 'ponytail', hairColor: '#fb7185', headwear: 'sweatband', headwearColor: '#fda4af', outfit: 'gym_tank', shirtColor: '#fda4af', pose1: 'salad', gender: 'female' },
          mentor: { type: 'gym_coach', hairColor: '#1e293b', shirtColor: '#f43f5e', glasses: false }
        };
      } else if (s.includes('bulkup') || s.includes('student')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#475569', headwear: 'none', headwearColor: '#10b981', outfit: 'gym_tank', shirtColor: '#a7f3d0', pose1: 'chicken', gender: 'male' },
          mentor: { type: 'gym_coach', hairColor: '#1e293b', shirtColor: '#10b981', glasses: false }
        };
      } else if (s.includes('office')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'none', headwearColor: '#3b82f6', outfit: 'office_shirt', shirtColor: '#e0f2fe', pose1: 'salad', gender: 'male' },
          mentor: { type: 'senior_pro', hairColor: '#3b82f6', shirtColor: '#dbeafe', glasses: true }
        };
      } else {
        // diet-male-fatloss (80kg 헬린이 체지방 컷팅)
        return {
          hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'sweatband', headwearColor: '#ef4444', outfit: 'gym_tank', shirtColor: '#fef08a', pose1: 'dumbbell', gender: 'male' },
          mentor: { type: 'gym_coach', hairColor: '#0f172a', shirtColor: '#ef4444', glasses: false }
        };
      }
    }
  
    if (calcKey === 'pet') {
      if (s.includes('cat') || s.includes('shorthair')) {
        return {
          hero: { hairStyle: 'bob', hairColor: '#ea580c', headwear: 'cat_ears', headwearColor: '#fed7aa', outfit: 'home_tee', shirtColor: '#fed7aa', pose1: 'chicken', gender: 'female' },
          mentor: { type: 'vet_doc', hairColor: '#475569', shirtColor: '#ffffff', glasses: true }
        };
      } else if (s.includes('pomeranian')) {
        return {
          hero: { hairStyle: 'twin_buns', hairColor: '#f9a89a', headwear: 'ribbon', headwearColor: '#fb7185', outfit: 'home_tee', shirtColor: '#fbcfe8', pose1: 'cup', gender: 'female' },
          mentor: { type: 'vet_doc', hairColor: '#334155', shirtColor: '#ffffff', glasses: true }
        };
      } else if (s.includes('golden')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#b45309', headwear: 'cap', headwearColor: '#f59e0b', outfit: 'hoodie', shirtColor: '#fde047', pose1: 'cup', gender: 'male' },
          mentor: { type: 'senior_pro', hairColor: '#78350f', shirtColor: '#fef3c7', glasses: false }
        };
      } else {
        // pet-maltese-5kg
        return {
          hero: { hairStyle: 'bun', hairColor: '#fdba74', headwear: 'dog_ears', headwearColor: '#fed7aa', outfit: 'apron', shirtColor: '#fed7aa', pose1: 'cup', gender: 'female' },
          mentor: { type: 'vet_doc', hairColor: '#475569', shirtColor: '#ffffff', glasses: true }
        };
      }
    }
  
    if (calcKey === 'electric') {
      if (s.includes('winter') || s.includes('heater')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'beanie', headwearColor: '#ef4444', outfit: 'winter_coat', shirtColor: '#ef4444', pose1: 'remote', gender: 'male' },
          mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#fee2e2', glasses: true }
        };
      } else if (s.includes('dryer')) {
        return {
          hero: { hairStyle: 'twin_buns', hairColor: '#f472b6', headwear: 'ribbon', headwearColor: '#fbcfe8', outfit: 'apron', shirtColor: '#fce7f3', pose1: 'tape', gender: 'female' },
          mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#e0e7ff', glasses: true }
        };
      } else if (s.includes('dehumidifier')) {
        return {
          hero: { hairStyle: 'sprout', hairColor: '#0284c7', headwear: 'none', headwearColor: '#7dd3fc', outfit: 'home_tee', shirtColor: '#7dd3fc', pose1: 'remote', gender: 'female' },
          mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#e0e7fe', glasses: true }
        };
      } else {
        // electric-studio-ac / stand-ac / inverter-roi
        return {
          hero: { hairStyle: 'bun', hairColor: '#f9a89a', headwear: 'none', headwearColor: '#fde047', outfit: 'home_tee', shirtColor: '#bae6fd', pose1: 'remote', gender: 'female' },
          mentor: { type: 'senior_pro', hairColor: '#a5b4fc', shirtColor: '#e0e7ff', glasses: true }
        };
      }
    }
  
    if (calcKey === 'room') {
      if (s.includes('newlywed')) {
        return {
          hero: { hairStyle: 'twin_buns', hairColor: '#fda4af', headwear: 'ribbon', headwearColor: '#fb7185', outfit: 'home_tee', shirtColor: '#ffe4e6', pose1: 'tape', gender: 'female' },
          mentor: { type: 'interior_pro', hairColor: '#334155', shirtColor: '#fce7f3', glasses: true }
        };
      } else if (s.includes('minimalist')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#475569', headwear: 'none', headwearColor: '#64748b', outfit: 'home_tee', shirtColor: '#f1f5f9', pose1: 'tape', gender: 'male' },
          mentor: { type: 'senior_pro', hairColor: '#64748b', shirtColor: '#e2e8f0', glasses: true }
        };
      } else {
        // room-oneroom-100 / officetel-300 / 500
        return {
          hero: { hairStyle: 'short', hairColor: '#78350f', headwear: 'beret', headwearColor: '#d97706', outfit: 'apron', shirtColor: '#fde68a', pose1: 'tape', gender: 'unisex' },
          mentor: { type: 'interior_pro', hairColor: '#334155', shirtColor: '#e0e7ff', glasses: true }
        };
      }
    }
  
    if (calcKey === 'telecom') {
      if (s.includes('penalty')) {
        return {
          hero: { hairStyle: 'bob', hairColor: '#0d9488', headwear: 'none', headwearColor: '#14b8a6', outfit: 'home_tee', shirtColor: '#ccfbf1', pose1: 'remote', gender: 'female' },
          mentor: { type: 'telecom_pro', hairColor: '#1e293b', shirtColor: '#99f6e4', glasses: true }
        };
      } else if (s.includes('family')) {
        return {
          hero: { hairStyle: 'short', hairColor: '#1e293b', headwear: 'none', headwearColor: '#10b981', outfit: 'home_tee', shirtColor: '#ecfdf5', pose1: 'remote', gender: 'male' },
          mentor: { type: 'telecom_pro', hairColor: '#047857', shirtColor: '#a7f3d0', glasses: true }
        };
      } else {
        // telecom-mvno-switch / 3yr-expired / single-oneroom
        return {
          hero: { hairStyle: 'short', hairColor: '#0f766e', headwear: 'none', headwearColor: '#14b8a6', outfit: 'hoodie', shirtColor: '#99f6e4', pose1: 'remote', gender: 'unisex' },
          mentor: { type: 'telecom_pro', hairColor: '#1e293b', shirtColor: '#a7f3d0', glasses: true }
        };
      }
    }
  
    return def;
  }
  
  /**
   * Helper: Draw our signature consistent Mochi character (or Senior expert) at (cx, cy)
   * Keeps the lovable hand-drawn white mochi body 100%, while dynamically varying
   * hairstyles, headwear, outfits, accessories, and cut poses to fit the exact episode!
   */

  function drawMochiFigure(ctx, cx, cy, s, opts = {}) {
      const roundRect = (c, x, y, w, h, r) => drawRoundedRect(c, x, y, w, h, r);
    const {
      role = 'hero',
      calcKey = 'electric',
      slug = '',
      pose = 'normal',
      flipX = false
    } = opts;
  
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flipX ? -s : s, s);
  
    const ink = '#111111';
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  
    const isMentor = role === 'mentor' || role === 'senior';
    const charCfg = getCharacterConfigForPreset(slug, calcKey);
    const cfg = isMentor ? charCfg.mentor : charCfg.hero;
  
    const hairStyle = isMentor
      ? ((cfg.type === 'gym_coach' || cfg.type === 'auto_master') ? 'short' : 'bob')
      : (cfg.hairStyle || 'bun');
    const hairColor = cfg.hairColor || (isMentor ? '#a5b4fc' : '#f9a89a');
    const headwear = isMentor ? 'none' : (cfg.headwear || 'none');
    const headwearColor = cfg.headwearColor || '#fde047';
    const outfit = isMentor
      ? ((cfg.type === 'vet_doc') ? 'doctor_coat' : (cfg.type === 'gym_coach') ? 'gym_tank' : (cfg.type === 'tax_pro') ? 'office_shirt' : (cfg.type === 'interior_pro') ? 'apron' : 'office_shirt')
      : (cfg.outfit || 'home_tee');
    const shirtColor = cfg.shirtColor || (isMentor ? '#e0e7ff' : '#bae6fd');
    const gender = isMentor ? ((cfg.type === 'gym_coach') ? 'male' : 'unisex') : (cfg.gender || 'female');
  
    // Subtle floor shadow
    if (pose !== 'cry_desk') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 126, 36, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  
    // --- 1. Back Hair Bun / Style & Outer Hair Silhouette ---
    ctx.lineWidth = 3.2;
    ctx.fillStyle = hairColor;
  
    if (hairStyle === 'bun') {
      // Signature top-right round bun + hair tie
      ctx.beginPath();
      ctx.arc(36, -54, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  
      ctx.fillStyle = headwearColor;
      ctx.beginPath();
      ctx.ellipse(23, -42, 8, 4, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hairColor;
    } else if (hairStyle === 'twin_buns') {
      // Cute double buns (Left & Right)
      ctx.beginPath();
      ctx.arc(-35, -52, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(35, -52, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  
      ctx.fillStyle = headwearColor;
      ctx.beginPath();
      ctx.ellipse(-23, -40, 7, 4, 0.6, 0, Math.PI * 2);
      ctx.ellipse(23, -40, 7, 4, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hairColor;
    } else if (hairStyle === 'sprout') {
      // Cute top sprout / ponytail
      ctx.beginPath();
      ctx.arc(0, -56, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(8, -68, 6, 12, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hairColor;
    } else if (hairStyle === 'ponytail') {
      // High perky ponytail
      ctx.beginPath();
      ctx.ellipse(40, -48, 22, 15, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (hairStyle === 'bob') {
      // Cute rounded bob volume on sides
      ctx.beginPath();
      ctx.ellipse(-38, -6, 20, 32, 0.2, 0, Math.PI * 2);
      ctx.ellipse(38, -6, 20, 32, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (hairStyle === 'short') {
      // Neat boyish cropped hair silhouette on top
      ctx.beginPath();
      ctx.arc(-18, -54, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(6, -58, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(28, -52, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  
    // Smooth hair dome behind face & ear
    ctx.beginPath();
    ctx.ellipse(0, -10, 61, 51, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  
    // Headwear: Dog / Cat ears / Beanie / Beret / Cap behind face
    if (headwear === 'dog_ears') {
      ctx.fillStyle = headwearColor;
      ctx.beginPath();
      ctx.ellipse(-30, -54, 10, 22, -0.25, 0, Math.PI * 2);
      ctx.ellipse(30, -54, 10, 22, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (headwear === 'cat_ears') {
      ctx.fillStyle = headwearColor;
      ctx.beginPath();
      ctx.moveTo(-38, -32);
      ctx.lineTo(-30, -62);
      ctx.lineTo(-12, -42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(38, -32);
      ctx.lineTo(30, -62);
      ctx.lineTo(12, -42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Inner pink ears
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.moveTo(-33, -36);
      ctx.lineTo(-28, -55);
      ctx.lineTo(-17, -43);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(33, -36);
      ctx.lineTo(28, -55);
      ctx.lineTo(17, -43);
      ctx.closePath();
      ctx.fill();
    } else if (headwear === 'beanie') {
      roundRect(ctx, -42, -66, 84, 38, 14);
      ctx.fillStyle = headwearColor;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -74, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -44, -36, 88, 14, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    } else if (headwear === 'beret') {
      ctx.fillStyle = headwearColor;
      ctx.beginPath();
      ctx.ellipse(8, -48, 38, 18, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, -66);
      ctx.lineTo(12, -72);
      ctx.stroke();
    } else if (headwear === 'cap') {
      roundRect(ctx, -38, -56, 76, 32, 16);
      ctx.fillStyle = headwearColor;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, -26);
      ctx.quadraticCurveTo(46, -30, 56, -20);
      ctx.quadraticCurveTo(36, -18, 12, -22);
      ctx.fillStyle = headwearColor;
      ctx.fill();
      ctx.stroke();
    }
  
    // Left & Right Arms based on pose
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 3.2;
  
    if (pose === 'pointer') {
      // Left arm resting, right arm holding wooden pointer stick toward right board
      ctx.beginPath();
      ctx.moveTo(-22, 38);
      ctx.quadraticCurveTo(-34, 66, -30, 92);
      ctx.quadraticCurveTo(-36, 98, -22, 96);
      ctx.fill();
      ctx.stroke();
  
      ctx.beginPath();
      ctx.moveTo(20, 40);
      ctx.quadraticCurveTo(46, 34, 58, 18);
      ctx.quadraticCurveTo(65, 16, 62, 26);
      ctx.quadraticCurveTo(48, 46, 22, 56);
      ctx.fill();
      ctx.stroke();
  
      // Pointer stick
      ctx.save();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(58, 20);
      ctx.lineTo(106, -12);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(106, -12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pose === 'cheer_phone') {
      // Left arm holding glowing Smartphone high, right arm cheering up!
      ctx.beginPath();
      ctx.moveTo(-20, 42);
      ctx.quadraticCurveTo(-48, 22, -46, -2);
      ctx.quadraticCurveTo(-36, -8, -30, 8);
      ctx.quadraticCurveTo(-28, 26, -18, 46);
      ctx.fill();
      ctx.stroke();
  
      ctx.beginPath();
      ctx.moveTo(20, 42);
      ctx.quadraticCurveTo(46, 22, 44, -2);
      ctx.quadraticCurveTo(34, -8, 28, 8);
      ctx.quadraticCurveTo(26, 26, 18, 46);
      ctx.fill();
      ctx.stroke();
  
      // Hand-drawn Smartphone in left hand
      ctx.save();
      ctx.translate(-48, -16);
      ctx.rotate(-0.15);
      roundRect(ctx, -16, -24, 32, 48, 6);
      ctx.fillStyle = '#111111';
      ctx.fill();
      roundRect(ctx, -13, -19, 26, 38, 4);
      ctx.fillStyle = '#34d399';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px "Gaegu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3초계산', 0, -2);
      ctx.fillText('OK!', 0, 11);
      ctx.restore();
    } else if (pose === 'shock_side') {
      // Both hands raised in surprise
      ctx.beginPath();
      ctx.moveTo(-20, 40);
      ctx.quadraticCurveTo(-40, 26, -38, 10);
      ctx.quadraticCurveTo(-28, 8, -26, 24);
      ctx.fill();
      ctx.stroke();
  
      ctx.beginPath();
      ctx.moveTo(20, 40);
      ctx.quadraticCurveTo(40, 26, 38, 10);
      ctx.quadraticCurveTo(28, 8, 26, 24);
      ctx.fill();
      ctx.stroke();
    } else if (pose !== 'cry_desk') {
      // Cut 1 situation action arm: left arm down, right arm extended holding situation prop!
      ctx.beginPath();
      ctx.moveTo(-22, 38);
      ctx.quadraticCurveTo(-34, 64, -31, 88);
      ctx.quadraticCurveTo(-40, 94, -34, 101);
      ctx.quadraticCurveTo(-25, 104, -20, 92);
      ctx.fill();
      ctx.stroke();
  
      ctx.beginPath();
      ctx.moveTo(21, 38);
      ctx.quadraticCurveTo(45, 44, 56, 32);
      ctx.quadraticCurveTo(64, 30, 62, 41);
      ctx.quadraticCurveTo(48, 56, 22, 54);
      ctx.fill();
      ctx.stroke();
    }
  
    // Central Torso + Legs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-21, 34);
    ctx.quadraticCurveTo(-25, 74, -23, 112);
    ctx.lineTo(-18, 126);
    ctx.quadraticCurveTo(-14, 128, -11, 110);
    ctx.quadraticCurveTo(0, 108, 11, 110);
    ctx.quadraticCurveTo(14, 128, 18, 126);
    ctx.lineTo(23, 112);
    ctx.quadraticCurveTo(25, 74, 21, 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  
    // Situation Outfit Overlay on Upper Torso (y = 35..88)
    ctx.save();
    ctx.fillStyle = shirtColor;
  
    if (outfit === 'gym_tank') {
      // Sporty tank top with deep scoop neckline
      ctx.beginPath();
      ctx.moveTo(-21, 44);
      ctx.quadraticCurveTo(-24, 64, -23, 86);
      ctx.lineTo(23, 86);
      ctx.quadraticCurveTo(24, 64, 21, 44);
      ctx.quadraticCurveTo(0, 56, -21, 44);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
  
      // Whistle if gym coach
      if (cfg.type === 'gym_coach') {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-10, 42);
        ctx.quadraticCurveTo(0, 64, 0, 68);
        ctx.quadraticCurveTo(0, 64, 10, 42);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        roundRect(ctx, -5, 68, 10, 8, 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (outfit === 'doctor_coat') {
      // Doctor white coat with blue scrub
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-14, 36);
      ctx.lineTo(14, 36);
      ctx.lineTo(14, 86);
      ctx.lineTo(-14, 86);
      ctx.closePath();
      ctx.fill();
      // White coat flaps
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-21, 35);
      ctx.lineTo(-8, 35);
      ctx.lineTo(-12, 86);
      ctx.lineTo(-23, 86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(21, 35);
      ctx.lineTo(8, 35);
      ctx.lineTo(12, 86);
      ctx.lineTo(23, 86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Stethoscope
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-16, 38);
      ctx.quadraticCurveTo(-12, 68, 0, 72);
      ctx.quadraticCurveTo(12, 68, 16, 38);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 72, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (outfit === 'office_shirt') {
      // Collared office shirt with tie
      ctx.beginPath();
      ctx.moveTo(-21, 35);
      ctx.quadraticCurveTo(-24, 62, -23, 86);
      ctx.lineTo(23, 86);
      ctx.quadraticCurveTo(24, 62, 21, 35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Necktie
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(-4, 38);
      ctx.lineTo(4, 38);
      ctx.lineTo(6, 74);
      ctx.lineTo(0, 82);
      ctx.lineTo(-6, 74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (outfit === 'apron') {
      // Bib apron with pocket
      ctx.beginPath();
      ctx.moveTo(-16, 40);
      ctx.lineTo(16, 40);
      ctx.lineTo(20, 86);
      ctx.lineTo(-20, 86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -10, 62, 20, 16, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    } else if (outfit === 'winter_coat') {
      // Thick winter coat with scarf
      ctx.beginPath();
      ctx.moveTo(-21, 35);
      ctx.quadraticCurveTo(-24, 62, -23, 86);
      ctx.lineTo(23, 86);
      ctx.quadraticCurveTo(24, 62, 21, 35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Warm scarf
      roundRect(ctx, -22, 34, 44, 16, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    } else {
      // Default home_tee or hoodie
      ctx.beginPath();
      ctx.moveTo(-21, 35);
      ctx.quadraticCurveTo(-24, 62, -23, 86);
      ctx.lineTo(23, 86);
      ctx.quadraticCurveTo(24, 62, 21, 35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
  
      if (outfit === 'home_tee') {
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-21, 56);
        ctx.lineTo(21, 56);
        ctx.moveTo(-22, 70);
        ctx.lineTo(22, 70);
        ctx.stroke();
      }
    }
    ctx.restore();
  
    // Handheld small prop in Mochi's right hand (at x=58, y=32) for Cut 1
    if (pose === 'remote') {
      ctx.save();
      ctx.translate(60, 24);
      ctx.rotate(-0.25);
      roundRect(ctx, -9, -16, 18, 32, 4);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-5, -11, 10, 8);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pose === 'dumbbell') {
      ctx.save();
      ctx.translate(60, 28);
      ctx.rotate(-0.3);
      ctx.fillStyle = '#fb7185';
      roundRect(ctx, -16, -5, 32, 10, 3);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, -20, -12, 9, 24, 3);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, 11, -12, 9, 24, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (pose === 'chicken') {
      ctx.save();
      ctx.translate(62, 24);
      ctx.rotate(-0.2);
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(0, -6, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef3c7';
      roundRect(ctx, -3, 2, 6, 14, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (pose === 'cup') {
      // Paper cup pouring kibble pellets
      ctx.save();
      ctx.translate(62, 26);
      ctx.rotate(0.65);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(10, -12);
      ctx.lineTo(7, 12);
      ctx.lineTo(-7, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // Falling brown kibble dots
      ctx.fillStyle = '#92400e';
      [[74, 42], [78, 54], [72, 64]].forEach(([kx, ky]) => {
        ctx.beginPath();
        ctx.arc(kx, ky, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (pose === 'tape') {
      // Yellow tape measure
      ctx.save();
      ctx.translate(60, 28);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(8, -3, 18, 6);
      ctx.strokeRect(8, -3, 18, 6);
      ctx.restore();
    } else if (pose === 'wheel') {
      // Steering wheel
      ctx.save();
      ctx.translate(54, 34);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
    } else if (pose === 'salad') {
      // Fresh green salad bowl with fork
      ctx.save();
      ctx.translate(56, 30);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 4, 16, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-4, -2, 5, 0, Math.PI * 2);
      ctx.arc(4, -1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pose === 'car_key') {
      // Modern car smart key
      ctx.save();
      ctx.translate(60, 26);
      roundRect(ctx, -8, -14, 16, 28, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 16, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  
    // --- 3. Squishy White Mochi Face + Seamless Side Ear + Bangs ---
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-54, 8);
    ctx.bezierCurveTo(-56, 32, -28, 42, -2, 42);
    ctx.bezierCurveTo(24, 42, 46, 34, 48, 14);
    ctx.bezierCurveTo(64, 14, 64, -12, 46, -10);
    ctx.quadraticCurveTo(26, -16, 8, -32);
    ctx.quadraticCurveTo(8, -14, -6, -8);
    ctx.quadraticCurveTo(-16, -14, -16, -30);
    ctx.quadraticCurveTo(-36, -20, -54, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  
    // Hair part lines
    ctx.beginPath();
    ctx.moveTo(-16, -30);
    ctx.quadraticCurveTo(-15, -36, -12, -40);
    ctx.moveTo(8, -32);
    ctx.quadraticCurveTo(10, -37, 13, -40);
    ctx.moveTo(32, -16);
    ctx.quadraticCurveTo(36, -21, 39, -26);
    ctx.stroke();
  
    // Inner ear mark
    ctx.beginPath();
    ctx.moveTo(47, 2);
    ctx.lineTo(53, 3);
    ctx.stroke();
  
    // Dynamic Headband / Sweatband / Ribbon
    if (headwear === 'sweatband') {
      ctx.save();
      ctx.fillStyle = headwearColor;
      roundRect(ctx, -48, -22, 92, 10, 4);
      ctx.fill();
      ctx.lineWidth = 3.0;
      ctx.strokeStyle = ink;
      ctx.stroke();
      // Sporty white stripe
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-44, -17);
      ctx.lineTo(40, -17);
      ctx.stroke();
      ctx.restore();
    } else if (headwear === 'ribbon') {
      // Cute Ribbon Bow
      ctx.save();
      ctx.translate(28, -44);
      ctx.fillStyle = headwearColor;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-14, -10);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14, -10);
      ctx.lineTo(14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  
    // --- 4. Soft Pink Cheek Blushes ---
    ctx.fillStyle = '#f9a89a';
    ctx.beginPath();
    ctx.ellipse(-32, 14, 9.5, 4.6, 0, 0, Math.PI * 2);
    ctx.ellipse(18, 14, 9.5, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
  
    // --- 5. Facial Expression ---
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
  
    if (isMentor || pose === 'pointer') {
      if (cfg.glasses !== false) {
        // Intellectual Glasses Mentor (tax_pro, vet_doc, senior_pro, interior_pro, telecom_pro)
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(-36, -15);
        ctx.lineTo(-16, -11);
        ctx.moveTo(6, -11);
        ctx.lineTo(26, -15);
        ctx.stroke();
  
        ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(-24, 1, 12.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(15, 1, 12.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-11, 1);
        ctx.lineTo(2, 1);
        ctx.stroke();
  
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.ellipse(-24, 1, 2.8, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(15, 1, 2.8, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
  
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.ellipse(-4, 17, 6.5, 4.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Energetic Athletic Gym Coach without glasses
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(-36, -14);
        ctx.lineTo(-14, -8);
        ctx.moveTo(26, -14);
        ctx.lineTo(4, -8);
        ctx.stroke();
  
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(-23, 1, 4.5, 0, Math.PI * 2);
        ctx.arc(14, 1, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-24, -1, 1.6, 0, Math.PI * 2);
        ctx.arc(13, -1, 1.6, 0, Math.PI * 2);
        ctx.fill();
  
        // Confident wide coach grin
        ctx.fillStyle = '#ef4444';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(-12, 12);
        ctx.lineTo(6, 12);
        ctx.bezierCurveTo(7, 26, -13, 26, -12, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (pose === 'cry_desk' || pose === 'shock_side') {
      // Crying / Shocked Expression
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-36, -9);
      ctx.quadraticCurveTo(-26, -16, -16, -13);
      ctx.moveTo(6, -13);
      ctx.quadraticCurveTo(16, -16, 26, -9);
      ctx.stroke();
  
      if (pose === 'cry_desk') {
        ctx.fillStyle = '#38bdf8';
        roundRect(ctx, -30, 4, 9.5, 34, 4.5);
        ctx.fill();
        roundRect(ctx, 11, 4, 9.5, 34, 4.5);
        ctx.fill();
      }
  
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-32, -2);
      ctx.lineTo(-20, 3);
      ctx.lineTo(-32, 8);
      ctx.moveTo(22, -2);
      ctx.lineTo(10, 3);
      ctx.lineTo(22, 8);
      ctx.stroke();
  
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.ellipse(-4, 18, 8.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  
      if (pose === 'cry_desk') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-43, 26, 10.5, 14.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(35, 26, 10.5, 14.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (pose === 'cheer_phone') {
      // Happy '^ ^' eyes + wide smile
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(-25, 2, 8.5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(15, 2, 8.5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
  
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.moveTo(-11, 12);
      ctx.lineTo(5, 12);
      ctx.bezierCurveTo(6, 24, -12, 24, -11, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Signature Innocent Mochi Eyes (3 upper eyelashes + hollow oval pupil)
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-36, -12);
      ctx.quadraticCurveTo(-26, -16, -16, -12);
      ctx.moveTo(6, -12);
      ctx.quadraticCurveTo(16, -16, 26, -12);
      ctx.stroke();
  
      [-25, 15].forEach(ex => {
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(ex - 9, -2);
        ctx.quadraticCurveTo(ex, -6, ex + 9, -2);
        ctx.stroke();
  
        // Draw 3 cute flutter eyelashes only if female
        if (gender === 'female') {
          ctx.lineWidth = 2.4;
          [-5, 0, 5].forEach(dx => {
            ctx.beginPath();
            ctx.moveTo(ex + dx, -4);
            ctx.lineTo(ex + dx * 1.25, -8.5);
            ctx.stroke();
          });
        }
  
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.ellipse(ex, 3, 2.8, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
  
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-8, 12);
      ctx.lineTo(2, 12);
      ctx.bezierCurveTo(3, 21, -9, 21, -8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  
    ctx.restore();
  }
  
  /**
   * Helper: Draw Situation-Specific Props, Appliances, Pets, Cars, Whiteboards & Crisis/Resolution Scenes
   */

  function drawSituationObject(ctx, ox, oy, s, calcKey, slug, cutNum) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const slugStr = String(slug || '');

    if (cutNum === 1) {
      if (calcKey === 'electric') {
        if (slugStr.includes('dryer')) {
          drawRoundedRect(ctx, -50, -54, 100, 112, 10);
          ctx.fillStyle = '#f8fafc';
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 8, 28, 0, Math.PI * 2);
          ctx.fillStyle = '#bae6fd';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.arc(-6, 12, 12, 0, Math.PI);
          ctx.fill();
          ctx.fillStyle = '#111111';
          ctx.font = '700 18px "Gaegu", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('열풍 건조기', 0, -32);
        } else if (slugStr.includes('dehumidifier')) {
          drawRoundedRect(ctx, -44, -48, 88, 106, 12);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.stroke();
          drawRoundedRect(ctx, -30, 6, 60, 38, 6);
          ctx.fillStyle = '#7dd3fc';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#111111';
          ctx.font = '700 18px "Gaegu", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('24h 제습기💧', 0, -22);
        } else if (slugStr.includes('heater')) {
          drawRoundedRect(ctx, -48, -44, 96, 98, 12);
          ctx.fillStyle = '#fee2e2';
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4.5;
          [-12, 2, 16].forEach(ry => {
            ctx.beginPath();
            ctx.moveTo(-26, ry);
            ctx.lineTo(26, ry);
            ctx.stroke();
          });
          ctx.fillStyle = '#dc2626';
          ctx.font = '700 18px "Gaegu", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('전기온풍기🔥', 0, -26);
        } else {
          drawRoundedRect(ctx, -62, -68, 124, 46, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-50, -32);
          ctx.lineTo(50, -32);
          ctx.stroke();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3.2;
          [-28, 0, 28].forEach(wx => {
            ctx.beginPath();
            ctx.moveTo(wx, -14);
            ctx.quadraticCurveTo(wx - 10, 6, wx, 24);
            ctx.quadraticCurveTo(wx + 10, 42, wx - 4, 58);
            ctx.stroke();
          });
          ctx.fillStyle = '#111111';
          ctx.font = '700 19px "Gaegu", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('구형 에어컨❄️', 0, -44);
        }
      } else if (calcKey === 'diet') {
        if (slugStr.includes('bulkup')) {
          drawRoundedRect(ctx, -56, -12, 112, 68, 8);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#dc2626';
          ctx.font = '700 21px "Gaegu", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('야식 치킨🍗', 0, 26);
        } else {
          drawRoundedRect(ctx, -58, -46, 116, 104, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.stroke();
          drawRoundedRect(ctx, -48, -38, 96, 28, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 18px "Gaegu", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('편의점 단품', 0, -20);
          ctx.fillStyle = '#111111';
          ctx.font = '700 21px "Gaegu", sans-serif';
          ctx.fillText('1팩 2,900원', 0, 12);
          ctx.fillStyle = '#64748b';
          ctx.font = '700 17px "Gaegu", sans-serif';
          ctx.fillText('(식비 폭탄💦)', 0, 38);
        }
      } else if (calcKey === 'pet') {
        const isCat = slugStr.includes('cat') || slugStr.includes('shorthair');
        ctx.fillStyle = isCat ? '#fed7aa' : '#ffffff';
        ctx.beginPath();
        ctx.ellipse(10, -2, 30, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (isCat) {
          ctx.beginPath();
          ctx.moveTo(-14, -18);
          ctx.lineTo(-22, -40);
          ctx.lineTo(-2, -24);
          ctx.moveTo(34, -18);
          ctx.lineTo(42, -40);
          ctx.lineTo(22, -24);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.ellipse(-18, -2, 9, 18, 0.3, 0, Math.PI * 2);
          ctx.ellipse(38, -2, 9, 18, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(0, -4, 3.2, 0, Math.PI * 2);
        ctx.arc(20, -4, 3.2, 0, Math.PI * 2);
        ctx.arc(10, 4, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.arc(-22, 42, 22, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.moveTo(-46, 40);
        ctx.lineTo(2, 40);
        ctx.lineTo(-4, 58);
        ctx.lineTo(-40, 58);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (calcKey === 'room') {
        drawRoundedRect(ctx, -52, -2, 104, 62, 6);
        ctx.fillStyle = '#fcd34d';
        ctx.fill();
        ctx.stroke();
        drawRoundedRect(ctx, -42, -52, 84, 50, 6);
        ctx.fillStyle = '#fde68a';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('이사박스📦', 0, -22);
        ctx.fillText('가전·가구?', 0, 32);
      } else if (calcKey === 'auto') {
        drawRoundedRect(ctx, -44, -42, 88, 38, 12);
        ctx.fillStyle = '#e0f2fe';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('신차 할부🚗', 0, -19);

        drawRoundedRect(ctx, -58, -8, 116, 46, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-38, 15, 9, 0, Math.PI * 2);
        ctx.arc(38, 15, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawRoundedRect(ctx, -20, 8, 40, 16, 4);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.stroke();
      } else {
        drawRoundedRect(ctx, -54, -38, 108, 86, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        drawRoundedRect(ctx, -54, -38, 108, 26, 8);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('약정 달력📅', 0, -20);
        ctx.font = '700 20px "Gaegu", sans-serif';
        ctx.fillText('위약금 무서워', 0, 12);
        ctx.fillText('그냥 쓰자..', 0, 34);
      }
    } else if (cutNum === 2) {
      drawRoundedRect(ctx, -68, -56, 136, 114, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      drawRoundedRect(ctx, -60, -50, 120, 26, 6);
      ctx.fillStyle = '#fee2e2';
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.font = '700 18px "Gaegu", sans-serif';
      ctx.textAlign = 'center';

      if (calcKey === 'electric') {
        ctx.fillText('누진세 3단계📈', 0, -33);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(-42, 22, 22, 24);
        ctx.strokeRect(-42, 22, 22, 24);
        ctx.fillStyle = '#f87171';
        ctx.fillRect(-11, 2, 22, 44);
        ctx.strokeRect(-11, 2, 22, 44);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(20, -22, 22, 68);
        ctx.strokeRect(20, -22, 22, 68);
      } else if (calcKey === 'diet') {
        ctx.fillText('식비 단가 비교📊', 0, -33);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('❌ 낱개 2,900원', 0, 0);
        ctx.fillStyle = '#047857';
        ctx.fillText('⭕ 벌크 1,100원', 0, 28);
      } else if (calcKey === 'pet') {
        ctx.fillText('수의학 정량표⚖️', 0, -33);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('❌ 눈대중 과급여', 0, 0);
        ctx.fillStyle = '#047857';
        ctx.fillText('⭕ 1g 저울 급여', 0, 28);
      } else if (calcKey === 'room') {
        ctx.fillText('황금배분 공식📐', 0, -33);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('❌ 단품 초과구매', 0, 0);
        ctx.fillStyle = '#047857';
        ctx.fillText('⭕ 예산 맞춤배분', 0, 28);
      } else if (calcKey === 'auto') {
        ctx.fillText('4년 총비용 비교🚗', 0, -33);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('❌ 할부+세금폭탄', 0, 0);
        ctx.fillStyle = '#047857';
        ctx.fillText('⭕ 특판·절세완승', 0, 28);
      } else {
        ctx.fillText('환승 순익 공식💵', 0, -33);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('사은품 47만원', 0, 0);
        ctx.fillStyle = '#047857';
        ctx.fillText('위약금 빼도 이득!', 0, 28);
      }
    } else if (cutNum === 3) {
      if (calcKey === 'electric') {
        drawRoundedRect(ctx, -64, -44, 128, 88, 8);
        ctx.fillStyle = '#fff1f2';
        ctx.fill();
        ctx.stroke();
        drawRoundedRect(ctx, -56, -36, 112, 26, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 전기요금 고지서', 0, -18);
        ctx.fillStyle = '#be123c';
        ctx.font = '700 20px "Gaegu", sans-serif';
        ctx.fillText('누진 3단계 폭탄!', 0, 18);
      } else if (calcKey === 'diet') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-48, -56);
        ctx.lineTo(48, -56);
        ctx.lineTo(42, 48);
        ctx.lineTo(-42, 48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#be123c';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧾 편의점 영수증', 0, -28);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('낱개 구매 파산💸', 0, 2);
        ctx.fillText('텅장 주의보..', 0, 26);
      } else if (calcKey === 'pet') {
        drawRoundedRect(ctx, -62, -46, 124, 92, 10);
        ctx.fillStyle = '#fff1f2';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#be123c';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏥 동물병원 차트', 0, -18);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('과급여 비만·관절', 0, 8);
        ctx.fillText('수술비 주의보💦', 0, 30);
      } else if (calcKey === 'room') {
        drawRoundedRect(ctx, -60, -34, 120, 68, 8);
        ctx.fillStyle = '#fee2e2';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-32, 44, 9, 0, Math.PI * 2);
        ctx.arc(32, 44, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#be123c';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛒 장바구니 초과!', 0, -8);
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.fillText('단품 거품 폭탄🚨', 0, 18);
      } else if (calcKey === 'auto') {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 8, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(28, -32, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('세금+보험💣', 0, 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 17px "Gaegu", sans-serif';
        ctx.fillText('할부이자 폭탄!', 0, 26);
      } else {
        drawRoundedRect(ctx, -56, -24, 112, 56, 8);
        ctx.fillStyle = '#dcfce7';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-62, -16, 16, 9, -0.4, 0, Math.PI * 2);
        ctx.ellipse(62, -16, 16, 9, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#be123c';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💸 날아간 47만원', 0, 0);
        ctx.fillStyle = '#111111';
        ctx.font = '700 17px "Gaegu", sans-serif';
        ctx.fillText('가만히 있으면 0원', 0, 22);
      }
    } else if (cutNum === 4) {
      if (calcKey === 'electric') {
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.ellipse(0, 12, 58, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -24, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('전기세 세이브🐷', 0, 17);
      } else if (calcKey === 'diet') {
        drawRoundedRect(ctx, -58, 10, 116, 34, 8);
        ctx.fillStyle = '#bbf7d0';
        ctx.fill();
        ctx.stroke();
        drawRoundedRect(ctx, -52, -24, 104, 34, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('득근 밀프렙💪', 0, -2);
        ctx.fillText('식비 반값 성공!', 0, 31);
      } else if (calcKey === 'pet') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fb7185';
        ctx.font = '700 20px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐶❤️🐱', 0, 6);
        drawRoundedRect(ctx, -58, 28, 116, 28, 8);
        ctx.fillStyle = '#a7f3d0';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 17.5px "Gaegu", sans-serif';
        ctx.fillText('1g 정량배식 OK', 0, 46);
      } else if (calcKey === 'room') {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(-26, 6);
        ctx.lineTo(26, 6);
        ctx.lineTo(16, -32);
        ctx.lineTo(-16, -32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        drawRoundedRect(ctx, -56, 16, 112, 34, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('워너비 내방✨', 0, 38);
      } else if (calcKey === 'auto') {
        drawRoundedRect(ctx, -58, -10, 116, 48, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(-14, -16, 14, 8, -0.3, 0, Math.PI * 2);
        ctx.ellipse(14, -16, 14, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 18px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('최저가 출고🎀', 0, 19);
      } else {
        drawRoundedRect(ctx, -58, -18, 116, 64, 8);
        ctx.fillStyle = '#fde047';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = '700 19px "Gaegu", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('당일 현금입금💵', 0, 6);
        ctx.fillStyle = '#dc2626';
        ctx.fillText('+47만원 완료!', 0, 30);
      }
    }

    ctx.restore();
  }

  function drawHumanInstatoonCharacter(ctx, cx, cy, calcKey, cutNum, s = 1, slug = '') {
    const pS = s / 1.06;
    const px = cx - 251 * pS;
    const py = cy - 328 * pS;

    const charCfg = getCharacterConfigForPreset(slug, calcKey);

    if (cutNum === 1) {
      const poseByCat = {
        electric: 'remote',
        diet: 'dumbbell',
        pet: 'cup',
        room: 'tape',
        auto: 'car_key',
        telecom: 'remote'
      };
      drawMochiFigure(ctx, px + 184 * pS, py + 336 * pS, pS * 1.02, {
        role: 'hero',
        calcKey,
        slug,
        pose: (charCfg.hero && charCfg.hero.pose1) || poseByCat[calcKey] || 'remote'
      });
      drawSituationObject(ctx, px + 382 * pS, py + 372 * pS, pS * 0.96, calcKey, slug, 1);
    } else if (cutNum === 2) {
      drawMochiFigure(ctx, px + 90 * pS, py + 368 * pS, pS * 0.72, {
        role: 'hero',
        calcKey,
        slug,
        pose: 'shock_side'
      });
      drawMochiFigure(ctx, px + 228 * pS, py + 338 * pS, pS * 0.94, {
        role: 'mentor',
        calcKey,
        slug,
        pose: 'pointer'
      });
      drawSituationObject(ctx, px + 404 * pS, py + 366 * pS, pS * 0.92, calcKey, slug, 2);
    } else if (cutNum === 3) {
      ctx.save();
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.28)';
      ctx.lineWidth = 2.5 * pS;
      for (let gx = 24; gx < 480; gx += 18) {
        ctx.beginPath();
        ctx.moveTo(px + gx * pS, py + 200 * pS);
        ctx.lineTo(px + gx * pS, py + (235 + (gx % 3) * 12) * pS);
        ctx.stroke();
      }
      ctx.restore();

      drawMochiFigure(ctx, px + 188 * pS, py + 334 * pS, pS * 1.02, {
        role: 'hero',
        calcKey,
        slug,
        pose: 'cry_desk'
      });
      drawSituationObject(ctx, px + 378 * pS, py + 376 * pS, pS * 0.96, calcKey, slug, 3);
    } else {
      ctx.save();
      ctx.fillStyle = '#facc15';
      [[92, 275], [320, 272], [448, 295]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(px + sx * pS, py + sy * pS, 5.5 * pS, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      drawMochiFigure(ctx, px + 190 * pS, py + 336 * pS, pS * 1.02, {
        role: 'hero',
        calcKey,
        slug,
        pose: 'cheer_phone'
      });
      drawSituationObject(ctx, px + 382 * pS, py + 372 * pS, pS * 0.96, calcKey, slug, 4);
    }
  }

  const CATEGORY_ART_IMAGES = {};
  function getCategoryArtImage(calcKey, slug) {
    const key = slug || calcKey || 'electric';
    if (CATEGORY_ART_IMAGES[key]) return CATEGORY_ART_IMAGES[key];
    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        refreshActive();
      };
      img.onerror = () => {
        if (slug && img.src.includes('/episodes/')) {
          img.src = `/src/assets/webtoon/${calcKey || 'electric'}.jpg?v=20261018_ep36`;
        }
      };
      img.src = slug
        ? `/src/assets/webtoon/episodes/${slug}.jpg?v=20261018_ep36`
        : `/src/assets/webtoon/${calcKey || 'electric'}.jpg?v=20261018_ep36`;
      CATEGORY_ART_IMAGES[key] = img;
      return img;
    }
    return null;
  }

  function getQuadrantWallColor(calcKey, quadIdx) {
    if (quadIdx === 0) return '#fcf6e4';
    if (quadIdx === 1) return '#d5eaf8';
    if (quadIdx === 3) return '#fef1a8';
    const q2Colors = {
      electric: '#cfead9',
      diet: '#eadcf8',
      pet: '#fce8dc',
      room: '#f9ebe0',
      auto: '#f4f5ef',
      telecom: '#fcf9f2'
    };
    return q2Colors[calcKey] || '#fcf6e4';
  }

  function drawAnimalSceneQuadrant(ctx, img, calcKey, quadIdx, flipX, zoom, x, y, w, h, r, s = 1) {
    ctx.save();
    drawRoundedRect(ctx, x, y, w, h, r);
    ctx.clip();

    const wallColor = getQuadrantWallColor(calcKey, quadIdx);
    ctx.fillStyle = wallColor;
    ctx.fillRect(x, y, w, h);

    if (img && img.complete && img.naturalWidth > 0) {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const halfW = Math.floor(W / 2);
      const halfH = Math.floor(H / 2);
      const col = quadIdx % 2;
      const row = Math.floor(quadIdx / 2);

      const padOuter = Math.round(W * 0.012);
      const padInner = Math.round(W * 0.012);

      const baseSx = col === 0 ? padOuter : halfW + padInner;
      const baseSy = row === 0 ? padOuter : halfH + padInner;
      const baseSw = halfW - padOuter - padInner;
      const baseSh = halfH - padOuter - padInner;

      const z = Math.max(1.0, Math.min(1.12, Number(zoom) || 1.0));
      const sw = baseSw / z;
      const sh = baseSh / z;
      const sx = baseSx + (baseSw - sw) * 0.5;
      const sy = baseSy + (baseSh - sh) * 0.88;

      const topShift = Math.round(46 * s);
      const destY = y + topShift;
      const destH = h - topShift;

      ctx.save();
      if (flipX) {
        ctx.translate(x + w, destY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, destH);
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, x, destY, w, destH);
      }
      ctx.restore();

      const blendGrad = ctx.createLinearGradient(x, destY - 2 * s, x, destY + 34 * s);
      blendGrad.addColorStop(0, wallColor);
      blendGrad.addColorStop(0.35, wallColor);
      blendGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = blendGrad;
      ctx.fillRect(x, destY - 4 * s, w, 40 * s);
    }

    ctx.restore();
  }

  function drawAnimalTopNarration(ctx, cutNum, text, x, y, w, s = 1) {
    const boxH = 30 * s;
    const boxY = y + 6 * s;
    ctx.save();

    let fontSize = 17.0 * s;
    ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    while (fontSize > 13 * s && ctx.measureText(text).width > w - 82 * s) {
      fontSize -= 0.5 * s;
      ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    }
    const textW = ctx.measureText(text).width;
    const badgeW = 42 * s;
    const boxW = Math.min(w - 18 * s, Math.max(w * 0.82, textW + badgeW + 32 * s));
    const boxX = x + (w - boxW) / 2;

    ctx.shadowColor = 'rgba(41, 37, 36, 0.16)';
    ctx.shadowBlur = 5 * s;
    ctx.shadowOffsetY = 2 * s;

    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 9 * s);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.6 * s;
    ctx.strokeStyle = '#292524';
    ctx.stroke();

    const pillColors = ['#f59e0b', '#0284c7', '#e11d48', '#10b981'];
    drawRoundedRect(ctx, boxX + 4 * s, boxY + 4 * s, badgeW, boxH - 8 * s, 6 * s);
    ctx.fillStyle = pillColors[(cutNum - 1) % 4];
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 ' + (13.0 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cutNum + '컷', boxX + 4 * s + badgeW / 2, boxY + boxH / 2 + 0.5 * s);

    ctx.fillStyle = '#1c1917';
    ctx.font = '800 ' + fontSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textCenterX = boxX + badgeW + 6 * s + (boxW - badgeW - 10 * s) / 2;
    ctx.fillText(text, textCenterX, boxY + boxH / 2 + 0.5 * s);
    ctx.restore();
  }

  function drawMainSpeechBubbleWithTail(ctx, lines, x, y, w, s = 1, speakerSide = 'left', accentColor = '#dc2626', highlightColor = '#fef08a') {
    ctx.save();

    const bx = x + 16 * s;
    const by = y + 40 * s;
    const bw = w - 32 * s;
    const bh = 86 * s;
    const br = 24 * s;

    const tailX = speakerSide === 'right' ? x + w * 0.72 : x + w * 0.28;
    const tailDir = speakerSide === 'right' ? 1 : -1;
    const tailW = 16 * s;
    const tailH = 11 * s;

    ctx.shadowColor = 'rgba(41, 37, 36, 0.16)';
    ctx.shadowBlur = 7 * s;
    ctx.shadowOffsetY = 3 * s;

    ctx.beginPath();
    ctx.moveTo(bx + br, by);
    ctx.lineTo(bx + bw - br, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
    ctx.lineTo(bx + bw, by + bh - br);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
    ctx.lineTo(tailX + tailW * 0.55, by + bh);
    ctx.lineTo(tailX + tailDir * 5 * s, by + bh + tailH);
    ctx.lineTo(tailX - tailW * 0.55, by + bh);
    ctx.lineTo(bx + br, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
    ctx.lineTo(bx, by + br);
    ctx.quadraticCurveTo(bx, by, bx + br, by);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3.4 * s;
    ctx.strokeStyle = '#292524';
    ctx.stroke();

    const maxAllowedW = bw - 28 * s;
    let baseSize = (lines.length === 1 ? 38 : 31.5) * s;
    const emphRatio = 1.32;

    const measureRichLine = (rawLine, bSize) => {
      const segs = String(rawLine || '').split('**');
      let total = 0;
      segs.forEach((seg, idx) => {
        if (!seg) return;
        const isEmph = idx % 2 === 1;
        const sz = isEmph ? bSize * emphRatio : bSize;
        ctx.font = '700 ' + sz.toFixed(1) + 'px "Gaegu", "Jua", "Malgun Gothic", sans-serif';
        total += ctx.measureText(seg).width;
      });
      return total;
    };

    lines.forEach(rawLine => {
      while (baseSize > 21 * s && measureRichLine(rawLine, baseSize) > maxAllowedW) {
        baseSize -= 0.5 * s;
      }
    });

    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const lineSpacing = baseSize * 1.18;
    const totalBlockH = (lines.length - 1) * lineSpacing;
    const firstLineY = cy - totalBlockH / 2 + baseSize * 0.34;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    lines.forEach((rawLine, lineIdx) => {
      const segs = String(rawLine || '').split('**');
      const lineW = measureRichLine(rawLine, baseSize);
      let curX = cx - lineW / 2;
      const baseY = firstLineY + lineIdx * lineSpacing;

      segs.forEach((seg, segIdx) => {
        if (!seg) return;
        const isEmph = segIdx % 2 === 1;
        const sz = isEmph ? baseSize * emphRatio : baseSize;
        ctx.font = '700 ' + sz.toFixed(1) + 'px "Gaegu", "Jua", "Malgun Gothic", sans-serif';
        const segW = ctx.measureText(seg).width;

        if (isEmph) {
          ctx.save();
          ctx.fillStyle = highlightColor;
          drawRoundedRect(ctx, curX - 3 * s, baseY - sz * 0.54, segW + 6 * s, sz * 0.60, 6 * s);
          ctx.fill();
          ctx.restore();

          const bounceY = baseY - 1.5 * s;
          ctx.lineWidth = 2.2 * s;
          ctx.strokeStyle = accentColor;
          ctx.lineJoin = 'round';
          ctx.strokeText(seg, curX, bounceY);
          ctx.fillStyle = accentColor;
          ctx.fillText(seg, curX, bounceY);
        } else {
          ctx.lineWidth = 1.1 * s;
          ctx.strokeStyle = '#1c1917';
          ctx.lineJoin = 'round';
          ctx.strokeText(seg, curX, baseY);
          ctx.fillStyle = '#1c1917';
          ctx.fillText(seg, curX, baseY);
        }
        curX += segW;
      });
    });

    ctx.restore();
  }

  function drawReplySpeechBubble(ctx, replyText, x, y, w, s = 1, mainSpeakerSide = 'left', quadIdx = 0) {
    if (!replyText) return;
    ctx.save();

    let fontSize = 22.5 * s;
    ctx.font = '700 ' + fontSize.toFixed(1) + 'px "Gaegu", "Jua", sans-serif';
    while (fontSize > 16.5 * s && ctx.measureText(replyText).width > w - 68 * s) {
      fontSize -= 0.5 * s;
      ctx.font = '700 ' + fontSize.toFixed(1) + 'px "Gaegu", "Jua", sans-serif';
    }

    const textW = ctx.measureText(replyText).width;
    const bw = Math.min(w - 36 * s, Math.max(180 * s, textW + 30 * s));
    const bh = 32 * s;
    const by = y + 135 * s;
    const replySide = mainSpeakerSide === 'left' ? 'right' : 'left';
    const bx = replySide === 'right'
      ? Math.max(x + 18 * s, x + w - bw - 18 * s)
      : x + 18 * s;
    const br = 16 * s;

    const tailX = replySide === 'right' ? bx + bw * 0.68 : bx + bw * 0.32;
    const tailW = 11 * s;
    const tailH = 7 * s;

    const bgByQuad = ['#fffbeb', '#fef9c3', '#fff1f2', '#ecfdf5'];
    const fillCol = bgByQuad[quadIdx % 4] || '#fef9c3';

    ctx.shadowColor = 'rgba(41, 37, 36, 0.12)';
    ctx.shadowBlur = 4 * s;
    ctx.shadowOffsetY = 2 * s;

    ctx.beginPath();
    ctx.moveTo(bx + br, by);
    ctx.lineTo(bx + bw - br, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
    ctx.lineTo(bx + bw, by + bh - br);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
    ctx.lineTo(tailX + tailW * 0.5, by + bh);
    ctx.lineTo(tailX, by + bh + tailH);
    ctx.lineTo(tailX - tailW * 0.5, by + bh);
    ctx.lineTo(bx + br, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
    ctx.lineTo(bx, by + br);
    ctx.quadraticCurveTo(bx, by, bx + br, by);
    ctx.closePath();

    ctx.fillStyle = fillCol;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.6 * s;
    ctx.strokeStyle = '#292524';
    ctx.stroke();

    ctx.fillStyle = '#292524';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 0.7 * s;
    ctx.strokeText(replyText, bx + bw / 2, by + bh / 2 + 1 * s);
    ctx.fillText(replyText, bx + bw / 2, by + bh / 2 + 1 * s);

    ctx.restore();
  }

  const ORIG_BASE_SLUGS = [
    'electric-studio-ac',
    'diet-male-fatloss',
    'pet-maltese-5kg',
    'room-oneroom-100',
    'auto-avante-3000',
    'telecom-penalty-15'
  ];

  const TOP_STRIP_RECEIPT_SLUGS = [
    'pet-maltese-5kg',
    'pet-pomeranian-puppy',
    'electric-stand-ac',
    'electric-dryer',
    'room-minimalist-50',
    'room-appliances-only',
    'room-newlywed-1000',
    'telecom-family-4p'
  ];

  function drawCrisisReceiptMemo(ctx, calcKey, slug, metaObj, flipX, x, y, w, h, s = 1) {
    if (!metaObj) return;
    ctx.save();

    if (calcKey === 'pet' || TOP_STRIP_RECEIPT_SLUGS.includes(slug)) {
      const rx = x + 20 * s;
      const ry = y + 135 * s;
      const rw = w - 40 * s;
      const rh = 48 * s;

      ctx.shadowColor = 'rgba(41, 37, 36, 0.16)';
      ctx.shadowBlur = 5 * s;
      ctx.shadowOffsetY = 2 * s;

      drawRoundedRect(ctx, rx, ry, rw, rh, 11 * s);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2.8 * s;
      ctx.strokeStyle = '#be123c';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 ' + (15.0 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#be123c';
      ctx.fillText('❌ ' + metaObj.badVal + '   ➔   ✅ ' + metaObj.goodVal, rx + rw / 2, ry + 16 * s);

      ctx.font = '900 ' + (16.0 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText('💰 ' + metaObj.diffVal, rx + rw / 2, ry + 34 * s);
      ctx.restore();
      return;
    }

    const isOrigBase = ORIG_BASE_SLUGS.includes(slug);
    const placeOnRight = isOrigBase ? Boolean(flipX) : true;

    const cardW = 218 * s;
    const cardH = 152 * s;
    const cardX = placeOnRight ? x + w - cardW - 14 * s : x + 14 * s;
    const cardY = y + 214 * s;
    const tilt = placeOnRight ? 0.025 : -0.025;

    ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
    ctx.rotate(tilt);
    ctx.translate(-cardW / 2, -cardH / 2);

    ctx.shadowColor = 'rgba(41, 37, 36, 0.20)';
    ctx.shadowBlur = 8 * s;
    ctx.shadowOffsetY = 4 * s;

    drawRoundedRect(ctx, 0, 0, cardW, cardH, 10 * s);
    ctx.fillStyle = '#fffef9';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3.0 * s;
    ctx.strokeStyle = '#292524';
    ctx.stroke();

    drawRoundedRect(ctx, 6 * s, 6 * s, cardW - 12 * s, 28 * s, 6 * s);
    ctx.fillStyle = '#292524';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = '900 ' + (14.5 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧾 3초 비교 영수증', cardW / 2, 20 * s);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#dc2626';
    ctx.font = '800 ' + (14 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('❌ 그냥 쓸 때', 12 * s, 48 * s);
    ctx.font = '900 ' + (15.5 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText(String(metaObj.badVal || ''), 12 * s, 67 * s);

    ctx.fillStyle = '#047857';
    ctx.font = '800 ' + (14 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('✅ 바꿨을 때', 12 * s, 90 * s);
    ctx.font = '900 ' + (15.5 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText(String(metaObj.goodVal || ''), 12 * s, 109 * s);

    drawRoundedRect(ctx, 8 * s, 120 * s, cardW - 16 * s, 25 * s, 6 * s);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.lineWidth = 1.8 * s;
    ctx.strokeStyle = '#292524';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#be123c';
    ctx.font = '900 ' + (14 * s).toFixed(1) + 'px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('🔥 ' + String(metaObj.diffVal || ''), cardW / 2, 133 * s);

    ctx.restore();
  }

  function getConversationalScript(calcKey, meta) {
    const sc = (meta && meta.shortCartoon) || {
      epTitle: 'EP.01 원룸 에어컨 껐다 켰다의 참사 ⚡',
      patternIdx: 0,
      quadOrder: [0, 1, 2, 3],
      flipMask: [false, false, false, false],
      zoomMask: [1.0, 1.0, 1.0, 1.0],
      speakerSide: ['left', 'left', 'right', 'right'],
      narrations: [
        '자취 1년차 쿼카찌만의 눈물겨운 에어컨 절약법',
        '방에 놀러 온 민트후드 여우 선배가 리모컨을 뺏었다',
        '한 달 뒤 우편함에 꽂힌 원룸 전기요금 고지서',
        '내 방 에어컨이 정속형인지 인버터인지 헷갈릴 땐?'
      ],
      p1: ['에어컨 아낀다고', '**2시간마다 껐다 켰지~**'],
      p2: ['구형 정속형 껐다 켜면', '**기동전력 폭탄** 맞아!!'],
      p3: ['으앙 **월 8만8천원**?!', '인버터는 **3만원대**인데!'],
      p4: ['소비전력 W수 넣으니까', '**3초 만에 요금 비교** 끝!'],
      replies: [
        '시원해지면 끄고 더우면 다시 ON! 뿌듯✨',
        '에엥?! 아끼려고 끈 건데 더 나온다고요?! 😱',
        '아낀 줄 알았는데 매달 치킨 3마리 증발 😭',
        '프로필 링크에서 내 방 전기세 미리 찍어봐요 ⚡'
      ]
    };

    return {
      episodeTitle: sc.epTitle || '머니핏 동물툰',
      patternIdx: sc.patternIdx || 0,
      quadOrder: sc.quadOrder || [0, 1, 2, 3],
      flipMask: sc.flipMask || [false, false, false, false],
      zoomMask: sc.zoomMask || [1.0, 1.0, 1.0, 1.0],
      speakerSide: sc.speakerSide || ['left', 'left', 'right', 'right'],
      narrations: sc.narrations || [],
      p1Lines: sc.p1,
      p2Lines: sc.p2,
      p3Lines: sc.p3,
      p4Lines: sc.p4,
      replies: sc.replies || []
    };
  }

  /**
   * Draw a single @moneyfit2026 Animal Instatoon panel at (px, py, pw, ph)
   */
  function drawSinglePanel(ctx, panelIdx, px, py, pw, ph, preset, story, isFullSlide = false) {
    ensureInstatoonFontsLoaded();
    const { meta } = story;
    const scaleX = pw / 502;
    const scaleY = ph / 474;
    const conv = getConversationalScript(preset.calc, meta);
    const num = panelIdx + 1;
    const slug = preset.id || preset.slug || '';

    const quadIdx = (conv.quadOrder && conv.quadOrder[panelIdx] !== undefined) ? conv.quadOrder[panelIdx] : panelIdx;
    const isOrigBase = ORIG_BASE_SLUGS.includes(slug);
    const flipX = isOrigBase ? Boolean(conv.flipMask && conv.flipMask[panelIdx]) : false;
    const zoom = (conv.zoomMask && conv.zoomMask[panelIdx]) || 1.0;
    const speakerSide = (conv.speakerSide && conv.speakerSide[panelIdx]) || (flipX ? 'right' : 'left');
    const artImg = getCategoryArtImage(preset.calc, slug);

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scaleX, scaleY);

    const W = 502;
    const H = 474;
    const panelRadius = isFullSlide ? 0 : 12;

    drawAnimalSceneQuadrant(ctx, artImg, preset.calc, quadIdx, flipX, zoom, 0, 0, W, H, panelRadius, 1);

    const narrationText = (conv.narrations && conv.narrations[panelIdx]) || conv.episodeTitle;
    drawAnimalTopNarration(ctx, num, narrationText, 0, 0, W, 1);

    const linesByNum = [conv.p1Lines, conv.p2Lines, conv.p3Lines, conv.p4Lines][panelIdx] || conv.p1Lines;
    const accentByQuad = ['#1d4ed8', '#dc2626', '#be123c', '#047857'][quadIdx % 4];
    const hlByQuad = ['#fef08a', '#fecdd3', '#fde047', '#bbf7d0'][quadIdx % 4];
    drawMainSpeechBubbleWithTail(ctx, linesByNum, 0, 0, W, 1, speakerSide, accentByQuad, hlByQuad);

    const replyText = (conv.replies && conv.replies[panelIdx]) || '';
    const useTopStripReceipt = quadIdx === 2 && (preset.calc === 'pet' || TOP_STRIP_RECEIPT_SLUGS.includes(slug));
    if (useTopStripReceipt) {
      drawCrisisReceiptMemo(ctx, preset.calc, slug, meta, flipX, 0, 0, W, H, 1);
    } else {
      drawReplySpeechBubble(ctx, replyText, 0, 0, W, 1, speakerSide, quadIdx);
      if (quadIdx === 2) {
        drawCrisisReceiptMemo(ctx, preset.calc, slug, meta, flipX, 0, 0, W, H, 1);
      }
    }

    if (!isFullSlide) {
      drawRoundedRect(ctx, 0, 0, W, H, panelRadius);
      ctx.lineWidth = 4.2;
      ctx.strokeStyle = '#292524';
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Render full 1080x1080 2x2 4-Cut Webtoon Canvas
   */
  function renderWebtoonCanvas(preset, story) {
    ensureInstatoonFontsLoaded();
    const canvas = document.getElementById('webtoon-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const conv = getConversationalScript(preset.calc, story.meta);

    ctx.clearRect(0, 0, 1080, 1080);

    ctx.fillStyle = '#faf6f0';
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.save();
    drawRoundedRect(ctx, 28, 13, 150, 36, 18);
    ctx.fillStyle = '#292524';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = '800 16.5px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐾 머니핏 동물툰', 103, 31);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#1c1917';
    let titleFs = 27;
    ctx.font = '900 ' + titleFs + 'px "Pretendard", "Malgun Gothic", sans-serif';
    while (titleFs > 20 && ctx.measureText(conv.episodeTitle).width > 700) {
      titleFs -= 1;
      ctx.font = '900 ' + titleFs + 'px "Pretendard", "Malgun Gothic", sans-serif';
    }
    ctx.fillText(conv.episodeTitle, 190, 41, 700);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#57534e';
    ctx.font = '800 20px sans-serif';
    ctx.fillText('@moneyfit2026', 1052, 41);
    ctx.restore();

    const positions = [
      { x: 28, y: 60 },
      { x: 550, y: 60 },
      { x: 28, y: 550 },
      { x: 550, y: 550 }
    ];

    for (let i = 0; i < 4; i++) {
      drawSinglePanel(ctx, i, positions[i].x, positions[i].y, 502, 474, preset, story, false);
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#292524';
    ctx.font = '900 22px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText('🔎 프로필 링크 또는 검색창에 「머니핏」 검색 → 3초 무료 계산기!', 540, 1058);
    ctx.restore();
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
        drawSinglePanel(ctx, i, 0, 0, 1080, 1080, preset, story, true);
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

  function buildNaverRichHtmlPackage(customPlainText) {
    const presets = getPresets();
    const preset = presets[activePresetIndex] || presets[0];
    if (!preset) return null;

    const cfg = getConfig();
    const cleanSiteUrl = String(cfg.siteUrl || 'https://truthofmarket.com').replace(/\/+$/, '');
    const presetUrl = `${cleanSiteUrl}/preset/${preset.id}/`;
    const webtoonImgUrl = `${cleanSiteUrl}/sns/${preset.id}-grid.png`;
    const calcRes = evaluatePresetResult(preset);
    const story = buildWebtoonStoryAndCopy(preset, calcRes, cleanSiteUrl);
    const m = story.meta || {};
    const sc = m.shortCartoon || {};
    const epTitle = sc.epTitle || `🐾 ${preset.title} 4컷 팩트체크`;
    const receiptTitle = `${preset.title} 3초 비교 영수증`;

    const mm = window.MoneyFitMonetization;
    const actionItems = Array.isArray(calcRes.actionItems) ? calcRes.actionItems : [];
    const coupangHref = (mm && mm.buildCoupangUrl && actionItems[0])
      ? mm.buildCoupangUrl(actionItems[0].coupangKw, preset.calc)
      : presetUrl;

    const rawText = customPlainText || (document.getElementById('generated-blog-post')?.textContent || story.fbPost || '');
    const bodyParagraphsHtml = String(rawText)
      .split('\n')
      .map(line => line.trim())
      .map(line => line ? `<p style="margin:6px 0;font-size:15px;color:#334155;line-height:1.75;">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '<br/>')
      .join('');

    const htmlContent =
      `<div style="max-width:680px;margin:0 auto;font-family:'Malgun Gothic','Pretendard',sans-serif;color:#1e293b;line-height:1.75;">` +
        `<h2 style="font-size:21px;font-weight:800;color:#0f172a;margin-bottom:12px;">${epTitle} (${preset.title})</h2>` +
        `<div style="text-align:center;margin:16px 0;">` +
          `<a href="${presetUrl}" target="_blank" rel="noopener noreferrer">` +
            `<img src="${webtoonImgUrl}" alt="${epTitle} - ${preset.title} 4컷 웹툰 및 3컷 영수증" width="680" style="max-width:100%;height:auto;border-radius:16px;border:2px solid #0f172a;" />` +
          `</a>` +
        `</div>` +
        `<div style="background:#0f172a;color:#ffffff;padding:18px;border-radius:16px;margin:18px 0;">` +
          `<div style="font-size:15px;font-weight:800;color:#fde047;margin-bottom:10px;">🧾 [${receiptTitle}] 핵심 비교 요약</div>` +
          `<p style="margin:5px 0;font-size:14px;color:#fda4af;">❌ <b>${m.badLabel || '기존 방식'}:</b> ${m.badVal || ''}</p>` +
          `<p style="margin:5px 0;font-size:14px;color:#6ee7b7;">✅ <b>${m.goodLabel || '최적 설계'}:</b> ${m.goodVal || ''}</p>` +
          `<p style="margin:8px 0 0 0;font-size:15px;font-weight:800;color:#fde047;">🔥 핵심 절감 차액: ${m.diffVal || ''} (${calcRes.headline || ''})</p>` +
        `</div>` +
        `<div style="margin:16px 0;">${bodyParagraphsHtml}</div>` +
        `<div style="background:#f8fafc;border:2px solid #cbd5e1;padding:16px;border-radius:14px;margin:18px 0;">` +
          `<p style="margin:0 0 8px 0;font-size:15px;font-weight:800;color:#0f172a;">👉 내 조건 넣고 3초 만에 무료 계산하기:</p>` +
          `<p style="margin:0 0 10px 0;"><a href="${presetUrl}" target="_blank" rel="noopener noreferrer" style="font-size:15px;font-weight:800;color:#2563eb;text-decoration:underline;">${presetUrl}</a></p>` +
          `<p style="margin:0;font-size:14px;font-weight:700;"><a href="${coupangHref}" target="_blank" rel="noopener noreferrer sponsored" style="color:#e11d48;text-decoration:underline;">🛒 웹툰 3컷 영수증 맞춤 특가템 로켓배송 최저가 확인 ↗</a></p>` +
        `</div>` +
        `<p style="font-size:12px;color:#64748b;margin-top:12px;">${m.hashtags || ''}</p>` +
      `</div>`;

    const plainText =
      `${rawText}\n\n` +
      `🖼️ 4컷 웹툰 이미지: ${webtoonImgUrl}\n` +
      `🧾 [3컷 비교 영수증] ❌ ${m.badLabel}: ${m.badVal} vs ✅ ${m.goodLabel}: ${m.goodVal} (${m.diffVal})\n` +
      `👉 3초 무료 계산기 바로가기: ${presetUrl}`;

    return { htmlContent, plainText, presetUrl, webtoonImgUrl };
  }

  function copyNaverRichWebtoonHtml(btnElement) {
    const pkg = buildNaverRichHtmlPackage();
    if (!pkg) return;

    const originalHtml = btnElement ? btnElement.innerHTML : null;
    const originalClass = btnElement ? btnElement.className : null;

    function onDone() {
      if (btnElement) {
        btnElement.innerHTML = '✅ 네이버 웹툰+영수증 리치복사 완료!';
        setTimeout(() => {
          if (btnElement) {
            btnElement.innerHTML = originalHtml;
            btnElement.className = originalClass;
          }
        }, 2400);
      }
      showToast('🟢 네이버 스마트에디터용 [4컷 웹툰 이미지 + 3컷 영수증 + 본문 + 계산기 링크]가 리치 복사(HTML)되었습니다!');
    }

    if (navigator.clipboard && typeof window !== 'undefined' && window.ClipboardItem) {
      try {
        const item = new ClipboardItem({
          'text/html': new Blob([pkg.htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([pkg.plainText], { type: 'text/plain' })
        });
        navigator.clipboard.write([item]).then(onDone).catch(() => {
          fallbackCopyText(pkg.plainText, onDone);
        });
        return;
      } catch (e) {}
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pkg.plainText).then(onDone).catch(() => fallbackCopyText(pkg.plainText, onDone));
    } else {
      fallbackCopyText(pkg.plainText, onDone);
    }
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

    if (
      (elementId === 'generated-blog-post' || elementId === 'generated-cafe-comment-post') &&
      navigator.clipboard &&
      typeof window !== 'undefined' &&
      window.ClipboardItem
    ) {
      try {
        const richPkg = buildNaverRichHtmlPackage(text);
        if (richPkg) {
          const item = new ClipboardItem({
            'text/html': new Blob([richPkg.htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' })
          });
          navigator.clipboard.write([item]).then(applySuccessFeedback).catch(() => {
            navigator.clipboard.writeText(text).then(applySuccessFeedback).catch(() => fallbackCopyText(text, applySuccessFeedback));
          });
          return;
        }
      } catch (e) {}
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
    buildNaverRichHtmlPackage,
    copyNaverRichWebtoonHtml,
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
