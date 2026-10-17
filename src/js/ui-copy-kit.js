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

  function getConversationalScript(calcKey, meta) {
    const sc = (meta && meta.shortCartoon) || null;
    if (sc) {
      return {
        episodeTitle: sc.epTitle || '공감 4컷툰',
        p1Lines: sc.p1,
        p2Lines: sc.p2,
        p3Lines: sc.p3,
        p4Lines: sc.p4
      };
    }
    return {
      episodeTitle: '원룸 에어컨 껐다 켰다의 참사 ⚡',
      p1Lines: ['에어컨 아낀다고', '**2시간마다 껐다 켰지~**'],
      p2Lines: ['구형은 껐다 켜면', '**누진세 폭탄** 맞아!!'],
      p3Lines: ['으앙 **월 8만8천원**?!', '인버터는 **3만원대**인데!'],
      p4Lines: ['내 방 에어컨 전기세', '**머니핏 3초 계산** 끝!']
    };
  }

  function drawCenteredBubbleText(
    ctx,
    lines,
    cx,
    startY,
    lineHeight,
    fontSize,
    color = '#0f172a',
    maxWidth = 0,
    accentColor = '#dc2626',
    highlightBg = '#fde047'
  ) {
    ctx.save();
    ctx.textAlign = 'left';

    let fSize = fontSize;
    ctx.font = '900 ' + fSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    if (maxWidth > 0) {
      lines.forEach(rawLine => {
        const plainLine = String(rawLine || '').split('**').join('');
        while (fSize > 26 && ctx.measureText(plainLine).width > maxWidth) {
          fSize -= 0.5;
          ctx.font = '900 ' + fSize.toFixed(1) + 'px "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
        }
      });
    }

    lines.forEach((rawLine, idx) => {
      const segments = String(rawLine || '').split('**');
      const plainLine = segments.join('');
      const totalW = ctx.measureText(plainLine).width;
      let curX = cx - totalW / 2;
      const baseY = startY + idx * lineHeight;

      segments.forEach((text, segIdx) => {
        if (!text) return;
        const isHighlight = segIdx % 2 === 1;
        const segW = ctx.measureText(text).width;
        if (isHighlight && highlightBg) {
          ctx.save();
          ctx.fillStyle = highlightBg;
          drawRoundedRect(ctx, curX - 5, baseY - fSize * 0.84, segW + 10, fSize * 1.02, 8);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = isHighlight ? accentColor : color;
        ctx.fillText(text, curX, baseY);
        curX += segW;
      });
    });
    ctx.restore();
  }

  /**
   * Draw a single authentic Giant-Typography Instatoon panel at (px, py, pw, ph)
   */
  function drawSinglePanel(ctx, panelIdx, px, py, pw, ph, preset, story) {
    const { meta } = story;
    const scaleX = pw / 502;
    const scaleY = ph / 474;
    const artImg = getCategoryInstatoonImage(preset.calc);
    const conv = getConversationalScript(preset.calc, meta);

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scaleX, scaleY);

    const W = 502;
    const H = 474;
    const panelRadius = 14;
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
        drawComicFocusLines(ctx, W * 0.5, H * 0.68, W, H, 'rgba(244, 63, 94, 0.12)');
      }
      drawAnimalCharacter(ctx, W * 0.5, H * 0.68, sp, mood, '#fecdd3', 1.18);
    }

    // 2. SINGLE Giant-Typography Speech Bubble (38px in grid / 76px in slide)
    const num = panelIdx + 1;
    const bx = 12;
    const by = 18;
    const bw = W - 24;
    const bh = 124;
    const tailRatio = num === 1 ? 0.42 : num === 2 ? 0.34 : num === 3 ? 0.64 : 0.38;
    const tailDir = num === 3 ? 1 : -1;

    drawSpeechBubble(ctx, bx, by, bw, bh, 32, W * tailRatio, tailDir);
    drawCutBadge(ctx, num, bx, by);

    const linesByNum = [conv.p1Lines, conv.p2Lines, conv.p3Lines, conv.p4Lines][panelIdx] || conv.p1Lines;
    const accentByNum = ['#b45309', '#dc2626', '#be123c', '#047857'][panelIdx];
    const bgByNum = ['#fde047', '#fecdd3', '#ffe4e6', '#bbf7d0'][panelIdx];

    drawCenteredBubbleText(ctx, linesByNum, bx + bw / 2, by + 56, 46, 38, '#0f172a', bw - 26, accentByNum, bgByNum);

    // 3. Crisp Authentic Comic Panel Outline (#0f172a, 5px)
    drawRoundedRect(ctx, 0, 0, W, H, panelRadius);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0f172a';
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
    const conv = getConversationalScript(preset.calc, story.meta);

    ctx.clearRect(0, 0, 1080, 1080);

    // Warm Cream Ivory Manuscript Paper Background
    ctx.fillStyle = '#faf7f2';
    ctx.fillRect(0, 0, 1080, 1080);

    // Top Pill Badge + Giant 31px Title
    ctx.save();
    drawRoundedRect(ctx, 28, 13, 128, 36, 18);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = '900 18px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('공감 4컷툰', 92, 32);
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 31px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.fillText(conv.episodeTitle, 168, 42);

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '900 20px sans-serif';
    ctx.fillText('@moneyfit2026', 1052, 41);
    ctx.restore();

    // 4 Panels in 2x2 Grid (each 502x474)
    const positions = [
      { x: 28, y: 60 },
      { x: 550, y: 60 },
      { x: 28, y: 550 },
      { x: 550, y: 550 }
    ];

    for (let i = 0; i < 4; i++) {
      drawSinglePanel(ctx, i, positions[i].x, positions[i].y, 502, 474, preset, story);
    }

    // Bold bottom callout bar
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
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
        ctx.fillStyle = '#faf7f2';
        ctx.fillRect(0, 0, 1080, 1080);
        drawSinglePanel(ctx, i, 36, 28, 1008, 992, preset, story);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText('🎨 머니핏 공감툰  ·  무료 계산기는 프로필 링크 또는 검색창에 「머니핏」 검색!', 540, 1056);
        ctx.restore();
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
