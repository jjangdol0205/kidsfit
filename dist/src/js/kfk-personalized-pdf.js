/**
 * 키즈핏 코리아 (KidsFit Korea · 5사업부)
 * 1:1 아이 맞춤형 정밀 성장·뼈나이 진단 보고서 PDF 생성 엔진 (외부 의존성 0 · 한글 폰트 깨짐 0건)
 * 유료 패스(1등급 9,900원 / 2등급 19,900원) 열람 시 설문 입력값과 분석 결과를 바탕으로
 * 고해상도 A4 3페이지 맞춤형 PDF 파일을 브라우저에서 즉시 생성·다운로드합니다.
 */
(function (global) {
  'use strict';

  var PAGE_W = 1240;
  var PAGE_H = 1754;
  var SANS_FONT = '"Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  var SERIF_FONT = '"Noto Serif KR", "Batang", Georgia, serif';

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function formatTodayKst() {
    var d = new Date(Date.now() + 9 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  }

  function wrapKoreanText(ctx, text, maxWidth) {
    var raw = String(text || '').trim();
    if (!raw) return [];
    var paragraphs = raw.split(/\n+/);
    var lines = [];
    for (var pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      var words = paragraphs[pIdx].split(' ');
      var current = '';
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        var test = current ? (current + ' ' + w) : w;
        if (ctx.measureText(test).width <= maxWidth) {
          current = test;
        } else {
          if (current) lines.push(current);
          if (ctx.measureText(w).width <= maxWidth) {
            current = w;
          } else {
            var sub = '';
            for (var c = 0; c < w.length; c++) {
              var tc = sub + w.charAt(c);
              if (ctx.measureText(tc).width <= maxWidth) {
                sub = tc;
              } else {
                if (sub) lines.push(sub);
                sub = w.charAt(c);
              }
            }
            current = sub;
          }
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }

  function drawRoundedRect(ctx, x, y, w, h, r, fillStyle, strokeStyle, lineWidth) {
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
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth || 1.5;
      ctx.stroke();
    }
  }

  function createPageCanvas(pageNum, totalPages, childLabel) {
    var canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    var ctx = canvas.getContext('2d');

    // Warm boutique linen paper background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Subtle outer frame
    ctx.strokeStyle = '#E4DDD3';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, PAGE_W - 96, PAGE_H - 96);

    // Footer legal & page number
    ctx.fillStyle = '#857C73';
    ctx.font = '400 18px ' + SANS_FONT;
    ctx.fillText('키즈핏 소아성장 연구소 (kidsfit.co.kr) · 질병관리청 2017 소아청소년 성장도표 기반 가정용 맞춤 분석 자료 (전문의 진료 대체 아님)', 84, PAGE_H - 76);
    ctx.textAlign = 'right';
    ctx.fillText(childLabel + ' · ' + pageNum + ' / ' + totalPages, PAGE_W - 84, PAGE_H - 76);
    ctx.textAlign = 'left';

    return { canvas: canvas, ctx: ctx };
  }

  function getStandardAnnualVelocityCm(sex, ageYears) {
    var isGirl = sex === 'girl';
    if (ageYears < 5) return 7.0;
    if (ageYears < 8) return 5.8;
    if (isGirl) {
      if (ageYears <= 11) return 6.4;
      if (ageYears <= 13) return 4.8;
      return 2.0;
    } else {
      if (ageYears <= 11) return 5.4;
      if (ageYears <= 14) return 6.8;
      return 2.8;
    }
  }

  function renderPersonalizedPages(analysis, profile, paidPass) {
    var p = profile || analysis.profile || {};
    var isTier2 = paidPass && paidPass.tier === 'tier2';
    var nickname = String(p.nickname || '').trim();
    var childDisplay = nickname
      ? (nickname + ' (' + analysis.sexLabel + ' · 만 ' + analysis.ageYears + '세 ' + analysis.remMonths + '개월)')
      : ('만 ' + analysis.ageYears + '세 ' + analysis.remMonths + '개월 ' + analysis.sexLabel);
    var shortChildLabel = nickname || ('만 ' + analysis.ageYears + '세 ' + analysis.sexLabel);
    var dateStr = formatTodayKst();
    var tierName = isTier2 ? '2등급 · 6개월 성장속도 집중 관리 패스' : '1등급 · 단건 정밀 성장·뼈나이 리포트 패스';
    var buyerEmail = (paidPass && paidPass.email) ? paidPass.email : '확인된 결제 회원';

    // ==================== PAGE 1 ====================
    var p1 = createPageCanvas(1, 4, shortChildLabel);
    var c1 = p1.ctx;

    // Header Banner
    drawRoundedRect(c1, 84, 84, PAGE_W - 168, 178, 16, '#2F5241', null, 0);
    c1.fillStyle = '#DCE8E1';
    c1.font = '600 20px ' + SANS_FONT;
    c1.fillText('KIDSFIT PEDIATRIC GROWTH ATELIER · 1:1 PERSONALIZED DOSSIER', 120, 132);
    c1.fillStyle = '#FFFFFF';
    c1.font = '700 40px ' + SERIF_FONT;
    c1.fillText('우리 아이 1:1 맞춤형 정밀 성장 · 뼈나이 분석 보고서', 120, 190);
    c1.fillStyle = '#E6EFEA';
    c1.font = '400 21px ' + SANS_FONT;
    c1.fillText('발급일: ' + dateStr + '   |   열람 등급: ' + tierName + '   |   계정: ' + buyerEmail, 120, 234);

    // Child Profile Summary Card
    drawRoundedRect(c1, 84, 290, PAGE_W - 168, 220, 14, '#FFFFFF', '#DFD7CC', 2);
    c1.fillStyle = '#8C5E3C';
    c1.font = '700 21px ' + SANS_FONT;
    c1.fillText('기본 입력 프로필 요약', 118, 334);

    c1.fillStyle = '#231F1D';
    c1.font = '700 28px ' + SANS_FONT;
    c1.fillText('대상 아동: ' + childDisplay, 118, 380);

    c1.fillStyle = '#4A433E';
    c1.font = '400 22px ' + SANS_FONT;
    var dobText = (p.birthYear || 2016) + '년 ' + (p.birthMonth || 5) + '월 ' + (p.birthDay || 15) + '일생 (정밀 생후 ' + analysis.exactMonths.toFixed(1) + '개월)';
    c1.fillText('• 생년월일 및 정밀 월령: ' + dobText, 118, 426);
    c1.fillText(
      '• 현재 측정 신체 계측: 키 ' + analysis.heightCm.toFixed(1) + ' cm  /  체중 ' + analysis.weightKg.toFixed(1) +
      ' kg   |   부모님 신장: 부 ' + (Number(p.fatherCm) || 174).toFixed(1) + ' cm · 모 ' + (Number(p.motherCm) || 161).toFixed(1) + ' cm',
      118, 468
    );

    // Section 1: KDCA Percentile
    drawRoundedRect(c1, 84, 540, PAGE_W - 168, 490, 14, '#FFFFFF', '#DFD7CC', 2);
    c1.fillStyle = '#2F5241';
    c1.font = '700 22px ' + SANS_FONT;
    c1.fillText('제 1 장 · 질병관리청(KDCA 2017) 동월령 또래 키 백분위 정밀 판독', 118, 586);

    var tileW = 326;
    var tileY = 614;
    var diffSign = analysis.kdca.diffFromMedianCm >= 0 ? '+' : '';
    var tiles1 = [
      { label: '질병관리청 키 백분위', val: analysis.kdca.percentile.toFixed(1) + ' 백분위', sub: '작은 쪽 ' + analysis.rankFromSmall + '번째 (상위 ' + analysis.topPercent + '%)' },
      { label: '동월령 표준 중간 키와 차이', val: diffSign + analysis.kdca.diffFromMedianCm.toFixed(1) + ' cm', sub: '표준 중간 키 ' + analysis.kdca.medianCm.toFixed(1) + ' cm 기준' },
      { label: '부모님 키 유전 중심값', val: analysis.mphCm.toFixed(1) + ' cm', sub: '자연 기대 범위 ' + (analysis.mphCm - 8.5).toFixed(1) + '~' + (analysis.mphCm + 8.5).toFixed(1) + ' cm' }
    ];
    for (var tIdx = 0; tIdx < 3; tIdx++) {
      var tx = 118 + tIdx * (tileW + 13);
      drawRoundedRect(c1, tx, tileY, tileW, 142, 10, '#FAF7F2', '#E5DDD2', 1.5);
      c1.fillStyle = '#6E665E';
      c1.font = '600 19px ' + SANS_FONT;
      c1.fillText(tiles1[tIdx].label, tx + 20, tileY + 38);
      c1.fillStyle = tIdx === 0 ? '#2F5241' : '#231F1D';
      c1.font = '700 32px ' + SANS_FONT;
      c1.fillText(tiles1[tIdx].val, tx + 20, tileY + 86);
      c1.fillStyle = '#7A7168';
      c1.font = '400 18px ' + SANS_FONT;
      c1.fillText(tiles1[tIdx].sub, tx + 20, tileY + 120);
    }

    // Visual Percentile Gauge Bar
    var barX = 118;
    var barY = 808;
    var barW = PAGE_W - 236;
    c1.fillStyle = '#6E665E';
    c1.font = '500 18px ' + SANS_FONT;
    c1.fillText('3백분위', barX, barY - 14);
    c1.fillText('25백분위', barX + barW * 0.25 - 30, barY - 14);
    c1.fillText('50백분위 (중간)', barX + barW * 0.5 - 58, barY - 14);
    c1.fillText('75백분위', barX + barW * 0.75 - 30, barY - 14);
    c1.textAlign = 'right';
    c1.fillText('97백분위', barX + barW, barY - 14);
    c1.textAlign = 'left';

    drawRoundedRect(c1, barX, barY, barW, 24, 12, '#EAE3D9', null, 0);
    var pinPct = clamp(analysis.kdca.percentile, 3, 97) / 100;
    drawRoundedRect(c1, barX, barY, Math.max(28, barW * pinPct), 24, 12, '#2F5241', null, 0);
    c1.beginPath();
    c1.arc(barX + barW * pinPct, barY + 12, 16, 0, Math.PI * 2);
    c1.fillStyle = '#8C5E3C';
    c1.fill();
    c1.lineWidth = 4;
    c1.strokeStyle = '#FFFFFF';
    c1.stroke();

    c1.fillStyle = '#3A3430';
    c1.font = '400 22px ' + SANS_FONT;
    var obsLines = wrapKoreanText(c1, analysis.freePositionNote, barW);
    for (var o = 0; o < obsLines.length; o++) {
      c1.fillText(obsLines[o], barX, 882 + o * 34);
    }

    // Section 2: Bone-Age Time-Lag Calibration & Open Growth Window
    drawRoundedRect(c1, 84, 1060, PAGE_W - 168, 550, 14, '#FFFFFF', '#DFD7CC', 2);
    c1.fillStyle = '#2F5241';
    c1.font = '700 22px ' + SANS_FONT;
    c1.fillText('제 2 장 · 골연령 시차(Δt) 자동 보정 및 성장판 잔여 여력 판독', 118, 1108);

    var baHeadline = '';
    var baBody = '';
    if (analysis.hasBoneAge && analysis.boneAgeCalibration) {
      var bac = analysis.boneAgeCalibration;
      baHeadline = '오늘 기준 보정 골연령: 약 ' + bac.baProjectedYears + '세 ' + bac.baProjectedMonths + '개월 (검사일 이후 +' + bac.deltaMonths + '개월 경과 반영)';
      baBody = bac.summaryText + (bac.advisoryText ? (' ' + bac.advisoryText) : '');
    } else {
      baHeadline = '미검사 기준 정밀 월령 성숙도 모델 적용 (생후 ' + analysis.exactMonths.toFixed(1) + '개월 표준 궤적)';
      baBody = '병원 손목 엑스레이 미측정 상태이므로, 태어난 일수 기준 정밀 월령과 질병관리청 성장 곡선, 부모님 물려주신 신장 중심값을 결합하여 현재 골성숙 진행률을 추정했습니다.';
    }

    drawRoundedRect(c1, 118, 1134, PAGE_W - 236, 178, 12, '#F4EFE7', '#DFD5C7', 1.5);
    c1.fillStyle = '#231F1D';
    c1.font = '700 25px ' + SANS_FONT;
    c1.fillText(baHeadline, 146, 1182);
    c1.fillStyle = '#4A433E';
    c1.font = '400 21px ' + SANS_FONT;
    var baLines = wrapKoreanText(c1, baBody, PAGE_W - 292);
    for (var bIdx = 0; bIdx < Math.min(3, baLines.length); bIdx++) {
      c1.fillText(baLines[bIdx], 146, 1224 + bIdx * 32);
    }

    // Maturity Progress & Remaining Potential Boxes
    drawRoundedRect(c1, 118, 1344, 486, 224, 12, '#FAF7F2', '#E5DDD2', 1.5);
    c1.fillStyle = '#6E665E';
    c1.font = '600 20px ' + SANS_FONT;
    c1.fillText('성인 신장 대비 현재 성장 진행률', 148, 1390);
    c1.fillStyle = '#231F1D';
    c1.font = '700 44px ' + SANS_FONT;
    c1.fillText(analysis.maturePct.toFixed(1) + ' % 진행', 148, 1456);
    c1.fillStyle = '#6E665E';
    c1.font = '400 20px ' + SANS_FONT;
    c1.fillText('남은 성장판 시간 비중: 약 ' + Math.max(0.5, 100 - analysis.maturePct).toFixed(1) + '% 열림', 148, 1510);

    drawRoundedRect(c1, 636, 1344, 486, 224, 12, '#EEF3F0', '#2F5241', 2);
    c1.fillStyle = '#2F5241';
    c1.font = '700 20px ' + SANS_FONT;
    c1.fillText('현재 키로부터 남은 기대 성장폭 (관리 시)', 666, 1390);
    c1.font = '700 44px ' + SANS_FONT;
    c1.fillText('+' + analysis.remainingPotentialCm.toFixed(1) + ' cm 여력', 666, 1456);
    c1.fillStyle = '#355846';
    c1.font = '500 20px ' + SANS_FONT;
    c1.fillText('현재 ' + analysis.heightCm.toFixed(1) + ' cm → 목표 ' + analysis.optimizedAdultCm.toFixed(1) + ' cm', 666, 1510);

    // ==================== PAGE 2 ====================
    var p2 = createPageCanvas(2, 4, shortChildLabel);
    var c2 = p2.ctx;

    // Page 2 Top Strip
    drawRoundedRect(c2, 84, 84, PAGE_W - 168, 96, 12, '#2F5241', null, 0);
    c2.fillStyle = '#FFFFFF';
    c2.font = '700 28px ' + SERIF_FONT;
    c2.fillText('성인 예상 키 3대 경로 비교 & 우리 아이 맞춤 90일 가정 처방전', 118, 143);

    // Section 3: 3-Path Adult Height Chart
    drawRoundedRect(c2, 84, 206, PAGE_W - 168, 430, 14, '#FFFFFF', '#DFD7CC', 2);
    c2.fillStyle = '#2F5241';
    c2.font = '700 22px ' + SANS_FONT;
    c2.fillText('제 3 장 · 최종 성인 예상 키 세 가지 경로 시뮬레이션 비교', 118, 252);

    var paths = [
      { title: '① 부모님 키 유전 중심값 (선천 기준)', cm: analysis.geneticMphCm, note: '부모님 신장으로부터 물려받은 기준 중심치', color: '#8A8076', bg: '#FAF7F2' },
      { title: '② 현재 수면·식탁·자세 그대로 유지 시', cm: analysis.currentTrendAdultCm, note: '설문에서 확인된 현재 방해 요인이 지속될 경우', color: '#8C5E3C', bg: '#FAF7F2' },
      { title: '③ 저녁 방해 습관 정돈 시 목표 성인 키', cm: analysis.optimizedAdultCm, note: '밤잠·식탁·척추 정렬 교정 시 (+' + analysis.ModifiableGapCm.toFixed(1) + ' cm 회복 구간)', color: '#2F5241', bg: '#EEF3F0' }
    ];
    var minScale = Math.min(analysis.geneticMphCm, analysis.currentTrendAdultCm) - 8;
    var maxScale = Math.max(analysis.geneticMphCm, analysis.optimizedAdultCm) + 4;
    for (var k = 0; k < 3; k++) {
      var ry = 282 + k * 106;
      drawRoundedRect(c2, 118, ry, PAGE_W - 236, 90, 10, paths[k].bg, k === 2 ? '#2F5241' : '#E5DDD2', k === 2 ? 2 : 1.5);
      c2.fillStyle = '#231F1D';
      c2.font = '700 21px ' + SANS_FONT;
      c2.fillText(paths[k].title, 142, ry + 34);
      c2.fillStyle = '#6E665E';
      c2.font = '400 18px ' + SANS_FONT;
      c2.fillText(paths[k].note, 142, ry + 68);

      // Bar visual
      var bx = 620;
      var bw = 320;
      drawRoundedRect(c2, bx, ry + 32, bw, 22, 11, '#E6DFD5', null, 0);
      var ratio = clamp((paths[k].cm - minScale) / Math.max(1, maxScale - minScale), 0.18, 0.96);
      drawRoundedRect(c2, bx, ry + 32, bw * ratio, 22, 11, paths[k].color, null, 0);

      c2.textAlign = 'right';
      c2.fillStyle = paths[k].color;
      c2.font = '700 32px ' + SANS_FONT;
      c2.fillText(paths[k].cm.toFixed(1) + ' cm', PAGE_W - 142, ry + 56);
      c2.textAlign = 'left';
    }

    // Section 4: Weight-Calibrated Daily Nutrition Targets
    var proteinG = Math.round(analysis.weightKg * 1.35);
    var calciumMg = clamp(Math.round(analysis.weightKg * 27), 700, 1200);
    var vitDIu = analysis.ageYears >= 9 ? 2000 : 1200;

    drawRoundedRect(c2, 84, 662, PAGE_W - 168, 226, 14, '#FFFFFF', '#DFD7CC', 2);
    c2.fillStyle = '#2F5241';
    c2.font = '700 22px ' + SANS_FONT;
    c2.fillText('제 4 장 · 우리 아이 현재 체중(' + analysis.weightKg.toFixed(1) + ' kg) 맞춤 일일 성장 영양 권장량', 118, 708);

    var nutBoxes = [
      { label: '하루 권장 순수 단백질', val: '약 ' + proteinG + ' g / 일', sub: '살코기·생선·두부·달걀을 아침·저녁 분배' },
      { label: '하루 권장 칼슘 섭취량', val: '약 ' + calciumMg + ' mg / 일', sub: '성장판 골무기질 침착 필수 기준' },
      { label: '하루 권장 비타민 D3', val: vitDIu + ' IU / 일', sub: '칼슘 장내 흡수율 및 골밀도 유지 보조' }
    ];
    for (var nIdx = 0; nIdx < 3; nIdx++) {
      var nx = 118 + nIdx * (tileW + 13);
      drawRoundedRect(c2, nx, 732, tileW, 130, 10, '#FAF7F2', '#E5DDD2', 1.5);
      c2.fillStyle = '#6E665E';
      c2.font = '600 18px ' + SANS_FONT;
      c2.fillText(nutBoxes[nIdx].label, nx + 18, 766);
      c2.fillStyle = '#2F5241';
      c2.font = '700 30px ' + SANS_FONT;
      c2.fillText(nutBoxes[nIdx].val, nx + 18, 810);
      c2.fillStyle = '#6E665E';
      c2.font = '400 17px ' + SANS_FONT;
      c2.fillText(nutBoxes[nIdx].sub, nx + 18, 842);
    }

    // Section 5: Personalized 90-Day Bottleneck Prescriptions
    drawRoundedRect(c2, 84, 914, PAGE_W - 168, 700, 14, '#FFFFFF', '#DFD7CC', 2);
    c2.fillStyle = '#2F5241';
    c2.font = '700 22px ' + SANS_FONT;
    c2.fillText('제 5 장 · 설문 응답 기반 우리 아이 1:1 맞춤 90일 저녁 처방전', 118, 960);

    var rxs = (analysis.bottlenecks || []).slice(0, 3);
    var curY = 988;
    for (var rIdx = 0; rIdx < rxs.length; rIdx++) {
      var item = rxs[rIdx];
      var descLines = wrapKoreanText(c2, item.detail, PAGE_W - 292).slice(0, 3);
      var boxH = 88 + descLines.length * 30;
      drawRoundedRect(c2, 118, curY, PAGE_W - 236, boxH, 10, '#FAF7F2', '#E5DDD2', 1.5);
      c2.fillStyle = '#8C5E3C';
      c2.font = '700 22px ' + SANS_FONT;
      c2.fillText('처방 0' + (rIdx + 1) + ' · [' + item.domain + '] ' + item.title, 144, curY + 40);
      c2.fillStyle = '#3A3430';
      c2.font = '400 20px ' + SANS_FONT;
      for (var dl = 0; dl < descLines.length; dl++) {
        c2.fillText(descLines[dl], 144, curY + 78 + dl * 30);
      }
      curY += boxH + 18;
    }

    // ==================== PAGE 3 ====================
    var p3 = createPageCanvas(3, 4, shortChildLabel);
    var c3 = p3.ctx;

    drawRoundedRect(c3, 84, 84, PAGE_W - 168, 96, 12, '#2F5241', null, 0);
    c3.fillStyle = '#FFFFFF';
    c3.font = '700 28px ' + SERIF_FONT;
    c3.fillText(
      isTier2
        ? '우리 아이 향후 6개월 기대 신장(cm) 로드맵 & 30일 실천 기록표'
        : '우리 아이 맞춤 30일 저녁 골든타임 가정 실천 체크표',
      118, 143
    );

    var gridStartY = 210;

    if (isTier2) {
      // Tier 2 Exclusive: Personalized 6-Month Expected Height Table starting from THIS child's exact height!
      drawRoundedRect(c3, 84, 206, PAGE_W - 168, 560, 14, '#FFFFFF', '#DFD7CC', 2);
      c3.fillStyle = '#2F5241';
      c3.font = '700 22px ' + SANS_FONT;
      var annVel = getStandardAnnualVelocityCm(analysis.sex, analysis.ageYears);
      var monthlyGain = annVel / 12;
      c3.fillText(
        '제 6 장 · [2등급 전용] 현재 키(' + analysis.heightCm.toFixed(1) + ' cm) 출발 향후 6개월 목표 성장 궤적표 (표준 +' + annVel.toFixed(1) + ' cm/년)',
        118, 252
      );

      // Table Header
      var thY = 278;
      drawRoundedRect(c3, 118, thY, PAGE_W - 236, 54, 8, '#EEF3F0', null, 0);
      c3.fillStyle = '#2F5241';
      c3.font = '700 19px ' + SANS_FONT;
      c3.fillText('점검 회차 (30일 주기)', 142, thY + 34);
      c3.fillText('순항 기대 키 (목표)', 400, thY + 34);
      c3.fillText('실제 아침 측정 키', 640, thY + 34);
      c3.fillText('30일 변화 (Δcm)', 850, thY + 34);
      c3.fillText('습관 점검', 1020, thY + 34);

      for (var m = 1; m <= 6; m++) {
        var rowY = thY + 58 + (m - 1) * 68;
        drawRoundedRect(c3, 118, rowY, PAGE_W - 236, 58, 6, m % 2 === 1 ? '#FAF7F2' : '#FFFFFF', '#E5DDD2', 1);
        var expH = (analysis.heightCm + monthlyGain * m).toFixed(1);
        c3.fillStyle = '#231F1D';
        c3.font = '600 20px ' + SANS_FONT;
        c3.fillText('제 ' + m + '차 점검 (+' + (m * 30) + '일)', 142, rowY + 36);
        c3.fillStyle = '#2F5241';
        c3.font = '700 22px ' + SANS_FONT;
        c3.fillText('약 ' + expH + ' cm', 400, rowY + 36);
        c3.fillStyle = '#9E9489';
        c3.font = '400 19px ' + SANS_FONT;
        c3.fillText('_______ . ___ cm', 640, rowY + 36);
        c3.fillText('+ _____ cm', 850, rowY + 36);
        c3.fillText('□ 양호', 1024, rowY + 36);
      }
      gridStartY = 794;
    }

    // 30-Day Evening Habit Fridge Checklist (tailored height for Tier 1 vs Tier 2)
    var cardH = PAGE_H - gridStartY - 120;
    drawRoundedRect(c3, 84, gridStartY, PAGE_W - 168, cardH, 14, '#FFFFFF', '#DFD7CC', 2);
    c3.fillStyle = '#2F5241';
    c3.font = '700 22px ' + SANS_FONT;
    var priorityTitle = (analysis.bottlenecks && analysis.bottlenecks[0]) ? analysis.bottlenecks[0].domain : '밤 10시 전 소등 및 저녁 식탁';
    c3.fillText('가정용 30일 저녁 실천 체크표 · 최우선 집중 항목: [' + priorityTitle + ']', 118, gridStartY + 46);
    c3.fillStyle = '#6E665E';
    c3.font = '400 19px ' + SANS_FONT;
    c3.fillText('① 밤 10시 전 거실 조도 낮추고 잠들기   ② 잠들기 2시간 전 무야식 & 단백질·칼슘 식사   ③ 책상 바른자세 & 1분 스트레칭', 118, gridStartY + 84);

    var cols = 5;
    var rows = 6;
    var cellGap = 14;
    var gridW = PAGE_W - 236;
    var cellW = Math.floor((gridW - cellGap * (cols - 1)) / cols);
    var availGridH = cardH - 128;
    var cellH = Math.floor((availGridH - cellGap * (rows - 1)) / rows);

    for (var day = 1; day <= 30; day++) {
      var r = Math.floor((day - 1) / cols);
      var col = (day - 1) % cols;
      var cx = 118 + col * (cellW + cellGap);
      var cy = gridStartY + 106 + r * (cellH + cellGap);
      drawRoundedRect(c3, cx, cy, cellW, cellH, 8, '#FAF7F2', '#DFD7CC', 1.5);
      c3.fillStyle = '#8C5E3C';
      c3.font = '700 19px ' + SANS_FONT;
      c3.fillText('DAY ' + (day < 10 ? '0' + day : day), cx + 16, cy + 32);
      c3.fillStyle = '#5C544D';
      c3.font = '400 17px ' + SANS_FONT;
      c3.fillText('□ 밤잠   □ 식탁   □ 자세', cx + 16, cy + Math.min(cellH - 14, 68));
    }

    // ==================== PAGE 4 (소아과·성장클리닉 진료실 지참용 1장 요약 & 30일 스티커 달력) ====================
    var p4 = createPageCanvas(4, 4, shortChildLabel);
    var c4 = p4.ctx;

    drawRoundedRect(c4, 84, 84, PAGE_W - 168, 96, 12, '#2F5241', null, 0);
    c4.fillStyle = '#FFFFFF';
    c4.font = '700 27px ' + SERIF_FONT;
    c4.fillText('소아과·성장클리닉 진료실 지참용 1장 요약 & 아이와 함께 붙이는 30일 키성장 달력', 118, 143);

    drawRoundedRect(c4, 84, 204, PAGE_W - 168, 636, 14, '#FFFFFF', '#DFD7CC', 2);
    c4.fillStyle = '#2F5241';
    c4.font = '700 21px ' + SANS_FONT;
    c4.fillText('제 7 장 · 소아청소년과·성장클리닉 진료실 지참용 1장 요약 & 의사 선생님 필수 질문 3가지', 118, 248);

    drawRoundedRect(c4, 118, 270, PAGE_W - 236, 118, 10, '#FAF7F2', '#E5DDD2', 1.5);
    c4.fillStyle = '#231F1D';
    c4.font = '700 20px ' + SANS_FONT;
    c4.fillText('진료실 제시용 핵심 계측 요약 (' + dateStr + ') · 대상: ' + childDisplay, 142, 308);
    c4.fillStyle = '#4A433E';
    c4.font = '400 19px ' + SANS_FONT;
    c4.fillText('현재 키: ' + analysis.heightCm.toFixed(1) + ' cm / 체중: ' + analysis.weightKg.toFixed(1) + ' kg  |  질병관리청 백분위: ' + analysis.kdca.percentile.toFixed(1) + '백분위  |  유전 중심값: ' + analysis.mphCm.toFixed(1) + ' cm', 142, 344);
    c4.fillText('골연령 참고: ' + (analysis.hasBoneAge && analysis.boneAgeCalibration ? ('과거 검사일 이후 +' + analysis.boneAgeCalibration.deltaMonths + '개월 시차 반영 완료') : '손목 골연령 미검사 · 정밀 생후 월령 모델 기준'), 142, 374);

    var docQs = [
      {
        q: '필수 질문 1 · 연간 성장속도(cm/yr) 궤도 점검',
        body: '"현재 아이의 질병관리청 백분위와 부모 신장 중심값을 고려할 때, 최근 6~12개월 연간 성장속도(cm/yr)가 안정적인 자기 성장 곡선을 따라가고 있나요?"'
      },
      {
        q: '필수 질문 2 · 사춘기 성숙 속도 및 손목 골연령 확인 시점',
        body: '"현재 신체 성숙 진행 속도가 실제 만 나이와 조화로운 편인지, 향후 6~12개월 내 손목 골연령(X-ray) 촬영으로 성장판 잔여 여력을 확인해 두는 것이 좋을까요?"'
      },
      {
        q: '필수 질문 3 · 골무기질 영양 및 수면 컨디션 기초 혈액 지표',
        body: '"체중 대비 신장 균형과 평소 밤잠·식사 리듬을 볼 때, 혈중 비타민D(25-OH-D), 저장철(페리틴), 아연 수치를 함께 점검해 두는 것이 도움이 될까요?"'
      }
    ];
    var qY = 408;
    for (var qi = 0; qi < docQs.length; qi++) {
      drawRoundedRect(c4, 118, qY, PAGE_W - 236, 126, 10, qi === 0 ? '#EEF3F0' : '#FAF7F2', '#DFD7CC', 1.5);
      c4.fillStyle = '#2F5241';
      c4.font = '700 20px ' + SANS_FONT;
      c4.fillText(docQs[qi].q, 142, qY + 34);
      c4.fillStyle = '#3A3430';
      c4.font = '400 18.5px ' + SANS_FONT;
      var qlines = wrapKoreanText(c4, docQs[qi].body, PAGE_W - 284).slice(0, 3);
      for (var ql = 0; ql < qlines.length; ql++) {
        c4.fillText(qlines[ql], 142, qY + 66 + ql * 26);
      }
      qY += 138;
    }

    // Bottom half of Page 4: 냉장고 부착용 아이와 함께 스티커 붙이는 30일 키성장 달력
    var calY = 864;
    var calH = PAGE_H - calY - 116;
    drawRoundedRect(c4, 84, calY, PAGE_W - 168, calH, 14, '#FFFFFF', '#2F5241', 2);
    c4.fillStyle = '#2F5241';
    c4.font = '700 21px ' + SANS_FONT;
    c4.fillText('냉장고 부착용 · 아이와 함께 칭찬 스티커 붙이는 30일 키성장 달력', 118, calY + 42);
    c4.fillStyle = '#6E665E';
    c4.font = '400 18px ' + SANS_FONT;
    c4.fillText('매일 밤 [밤 10시 전 불 끄기 + 단백질·칼슘 저녁 + 15분 줄넘기/스트레칭] 실천 후 동그라미에 스티커를 붙여 주세요!', 118, calY + 74);

    var sCols = 6;
    var sRows = 5;
    var sGap = 12;
    var sGridW = PAGE_W - 236;
    var sCellW = Math.floor((sGridW - sGap * (sCols - 1)) / sCols);
    var sCellH = Math.floor((calH - 116 - sGap * (sRows - 1)) / sRows);
    for (var sDay = 1; sDay <= 30; sDay++) {
      var sr = Math.floor((sDay - 1) / sCols);
      var sc = (sDay - 1) % sCols;
      var sx = 118 + sc * (sCellW + sGap);
      var sy = calY + 94 + sr * (sCellH + sGap);
      drawRoundedRect(c4, sx, sy, sCellW, sCellH, 10, '#FAF7F2', '#D8CFC2', 1.5);
      c4.fillStyle = '#8C5E3C';
      c4.font = '700 16px ' + SANS_FONT;
      c4.fillText('DAY ' + (sDay < 10 ? '0' + sDay : sDay), sx + 14, sy + 26);
      c4.beginPath();
      c4.arc(sx + sCellW / 2, sy + sCellH / 2 + 12, Math.min(26, Math.floor(sCellH * 0.27)), 0, Math.PI * 2);
      c4.strokeStyle = '#2F5241';
      c4.setLineDash([4, 4]);
      c4.lineWidth = 2;
      c4.stroke();
      c4.setLineDash([]);
      c4.fillStyle = '#7A7168';
      c4.font = '600 14px ' + SANS_FONT;
      c4.textAlign = 'center';
      c4.fillText('스티커', sx + sCellW / 2, sy + sCellH / 2 + 17);
      c4.textAlign = 'left';
    }

    return [p1.canvas, p2.canvas, p3.canvas, p4.canvas];
  }

  function downloadGraduationAlbumPdf(childName, startCm, latestCm, historyLogs) {
    if (typeof document === 'undefined') return false;
    var label = String(childName || '우리아이').trim();
    var sCm = Number(startCm) || 135.0;
    var eCm = Number(latestCm) || (sCm + 3.2);
    var gainCm = Math.max(0, eCm - sCm);
    var pg = createPageCanvas(1, 1, label + ' · 6개월 성장 졸업장 앨범');
    var ctx = pg.ctx;

    drawRoundedRect(ctx, 84, 84, PAGE_W - 168, 220, 18, '#2F5241', null, 0);
    ctx.fillStyle = '#DCE8E1';
    ctx.font = '700 20px ' + SANS_FONT;
    ctx.fillText('KIDSFIT PEDIATRIC GROWTH ATELIER · DAY 165 GRADUATION ALBUM', 124, 140);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 42px ' + SERIF_FONT;
    ctx.fillText('6개월 성장 마라톤 완주 졸업장 & 기록 앨범', 124, 204);
    ctx.fillStyle = '#E6EFEA';
    ctx.font = '400 21px ' + SANS_FONT;
    ctx.fillText('수여 대상: ' + label + ' 어린이 & 가족   |   발급일: ' + formatTodayKst(), 124, 258);

    drawRoundedRect(ctx, 84, 340, PAGE_W - 168, 420, 16, '#FFFFFF', '#2F5241', 2.5);
    ctx.fillStyle = '#8C5E3C';
    ctx.font = '700 22px ' + SANS_FONT;
    ctx.fillText('지난 6개월 누적 신장 성장 성취 요약', 124, 396);
    ctx.fillStyle = '#231F1D';
    ctx.font = '700 50px ' + SANS_FONT;
    ctx.fillText('총 +' + gainCm.toFixed(2) + ' cm 성장 달성!', 124, 476);
    ctx.fillStyle = '#4A433E';
    ctx.font = '500 24px ' + SANS_FONT;
    ctx.fillText('출발 신장: ' + sCm.toFixed(1) + ' cm   →   현재 측정 신장: ' + eCm.toFixed(1) + ' cm', 124, 542);
    ctx.font = '400 21px ' + SANS_FONT;
    ctx.fillText('6개월 연간 환산 성장속도: 약 ' + (gainCm * 2).toFixed(1) + ' cm/yr (꾸준한 밤 10시 수면·식탁·자세 실천 결실)', 124, 596);
    ctx.fillStyle = '#2F5241';
    ctx.font = '600 21px ' + SANS_FONT;
    ctx.fillText('완주 칭찬 배지: 첫 90분 깊은 밤잠  ·  단백질·칼슘 저녁 식탁  ·  매일 바른자세 스트레칭', 124, 670);

    drawRoundedRect(ctx, 84, 800, PAGE_W - 168, 760, 16, '#FFFFFF', '#DFD7CC', 2);
    ctx.fillStyle = '#2F5241';
    ctx.font = '700 22px ' + SANS_FONT;
    ctx.fillText('30일 주기 월간 성장 체크인 발자취', 124, 854);
    var rows = Array.isArray(historyLogs) && historyLogs.length ? historyLogs.slice(0, 6) : [
      { date: 'Day 30 (1회차)', curH: sCm + gainCm * 0.17 },
      { date: 'Day 60 (2회차)', curH: sCm + gainCm * 0.34 },
      { date: 'Day 90 (3회차)', curH: sCm + gainCm * 0.50 },
      { date: 'Day 120 (4회차)', curH: sCm + gainCm * 0.67 },
      { date: 'Day 150 (5회차)', curH: sCm + gainCm * 0.84 },
      { date: 'Day 180 (6회차 완주)', curH: eCm }
    ];
    for (var idx = 0; idx < rows.length; idx++) {
      var ry = 890 + idx * 96;
      drawRoundedRect(ctx, 124, ry, PAGE_W - 248, 78, 10, idx === rows.length - 1 ? '#EEF3F0' : '#FAF7F2', '#DFD7CC', 1.5);
      ctx.fillStyle = '#231F1D';
      ctx.font = '700 21px ' + SANS_FONT;
      ctx.fillText('제 ' + (idx + 1) + '회차 기록 (' + String(rows[idx].date || '') + ')', 152, ry + 48);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#2F5241';
      ctx.fillText(Number(rows[idx].curH || rows[idx].height_cm || eCm).toFixed(1) + ' cm', PAGE_W - 152, ry + 48);
      ctx.textAlign = 'left';
    }

    var bytes = buildPdfFromCanvases([pg.canvas]);
    var blob = new Blob([bytes], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = label + '_키즈핏_6개월_성장졸업장_앨범_' + formatTodayKst().replace(/-/g, '') + '.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(url); }, 3500);
    return { ok: true };
  }

  function dataUrlToBytes(dataUrl) {
    var base64 = dataUrl.split(',')[1] || '';
    var bin = global.atob(base64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i) & 0xff;
    }
    return bytes;
  }

  function asciiBytes(str) {
    var arr = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i) & 0x7f;
    }
    return arr;
  }

  /**
   * Packs an array of A4 canvases into a genuine ISO %PDF-1.4 binary file (DCTDecode JPEG streams).
   */
  function buildPdfFromCanvases(canvases) {
    var chunks = [];
    var totalLen = 0;
    function pushBytes(u8) {
      chunks.push(u8);
      totalLen += u8.length;
    }
    function pushStr(s) {
      pushBytes(asciiBytes(s));
    }

    // Object ID layout:
    // 1: Catalog, 2: Pages
    // For page i (0..N-1): pageObj = 3 + i*3, imgObj = 4 + i*3, contentObj = 5 + i*3
    var n = canvases.length;
    var totalObjs = 2 + n * 3;
    var offsets = new Array(totalObjs + 1);

    pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

    offsets[1] = totalLen;
    pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    var kidsRefs = [];
    for (var i = 0; i < n; i++) {
      kidsRefs.push((3 + i * 3) + ' 0 R');
    }
    offsets[2] = totalLen;
    pushStr('2 0 obj\n<< /Type /Pages /Kids [ ' + kidsRefs.join(' ') + ' ] /Count ' + n + ' >>\nendobj\n');

    for (var p = 0; p < n; p++) {
      var pageObjId = 3 + p * 3;
      var imgObjId = 4 + p * 3;
      var cntObjId = 5 + p * 3;
      var c = canvases[p];
      var jpgBytes = dataUrlToBytes(c.toDataURL('image/jpeg', 0.91));

      offsets[pageObjId] = totalLen;
      pushStr(
        pageObjId + ' 0 obj\n' +
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] ' +
        '/Resources << /XObject << /Im' + p + ' ' + imgObjId + ' 0 R >> >> ' +
        '/Contents ' + cntObjId + ' 0 R >>\nendobj\n'
      );

      offsets[imgObjId] = totalLen;
      pushStr(
        imgObjId + ' 0 obj\n' +
        '<< /Type /XObject /Subtype /Image /Width ' + c.width + ' /Height ' + c.height +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpgBytes.length + ' >>\nstream\n'
      );
      pushBytes(jpgBytes);
      pushStr('\nendstream\nendobj\n');

      var streamCmd = 'q 595.28 0 0 841.89 0 0 cm /Im' + p + ' Do Q\n';
      offsets[cntObjId] = totalLen;
      pushStr(cntObjId + ' 0 obj\n<< /Length ' + streamCmd.length + ' >>\nstream\n' + streamCmd + 'endstream\nendobj\n');
    }

    var xrefPos = totalLen;
    pushStr('xref\n0 ' + (totalObjs + 1) + '\n0000000000 65535 f \n');
    for (var objIdx = 1; objIdx <= totalObjs; objIdx++) {
      var offStr = String(offsets[objIdx]);
      while (offStr.length < 10) offStr = '0' + offStr;
      pushStr(offStr + ' 00000 n \n');
    }
    pushStr('trailer\n<< /Size ' + (totalObjs + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n');

    var out = new Uint8Array(totalLen);
    var pos = 0;
    for (var k = 0; k < chunks.length; k++) {
      out.set(chunks[k], pos);
      pos += chunks[k].length;
    }
    return out;
  }

  function downloadPersonalizedChildPdf(analysis, profile, paidPass) {
    if (typeof document === 'undefined' || !analysis) return false;
    var canvases = renderPersonalizedPages(analysis, profile, paidPass);
    var pdfBytes = buildPdfFromCanvases(canvases);
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    var rawName = String((profile && profile.nickname) || '').replace(/[^\w\uAC00-\uD7A3_-]/g, '').trim();
    var fileName = (rawName ? rawName + '_' : '우리아이_') + '키즈핏_맞춤형_성장진단보고서_' + formatTodayKst().replace(/-/g, '') + '.pdf';

    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    var isInAppWebView = /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\//i.test(ua);

    var url = URL.createObjectURL(blob);
    if (!isInAppWebView) {
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 4000);
    } else {
      global.open(url, '_blank');
    }
    return { ok: true, fileName: fileName, byteLength: pdfBytes.length };
  }

  global.KfkPersonalizedPdf = {
    renderPersonalizedPages: renderPersonalizedPages,
    buildPdfFromCanvases: buildPdfFromCanvases,
    downloadPersonalizedChildPdf: downloadPersonalizedChildPdf,
    downloadGraduationAlbumPdf: downloadGraduationAlbumPdf
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.KfkPersonalizedPdf;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
