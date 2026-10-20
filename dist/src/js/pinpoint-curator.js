/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Pinpoint Child-Specific Supplement, Toy & Book Curator + Age-by-Age Lifecycle Roadmap Engine
 * (src/js/pinpoint-curator.js)
 *
 * Implements:
 * 1. Exact Date-of-Birth (DOB) Chronological Age Calculator (Months, Days, Decimal Months)
 * 2. Automatic Skeletal Maturation & Growth Stage Detector (Auto-sets Phase 1~4 from DOB & Gender)
 * 3. Age-by-Age Sequential Lifecycle Roadmap (만 N세 -> 만 N+1세 -> 만 N+2세 -> 만 N+3세)
 * 4. Child-Specific Pinpoint Product Curator (HT042 황기추출물, 연골·어골칼슘, 아연·초유, 타트체리·마그네슘,
 *    연령별 소근육·공간·과학 놀이 장난감, 연령별 필독 도서·워크북) with exact single-target search URLs.
 */

(function (global) {
  'use strict';

  const DEFAULT_AFF = {
    coupang: 'AF7865143',
    linkprice: 'A100708867',
    iherb: 'KIDSBIO',
    amazon: 'tallerbiolab-20'
  };

  /**
   * 1. Exact Chronological Age Calculator from Date of Birth (YYYY, MM, DD)
   */
  function calculateExactAgeFromDob(birthYear, birthMonth, birthDay, refDateObj = null) {
    const now = refDateObj instanceof Date ? refDateObj : new Date();
    const y = parseInt(birthYear, 10) || (now.getFullYear() - 10);
    const m = Math.max(1, Math.min(12, parseInt(birthMonth, 10) || 5));
    const maxDayInMonth = new Date(y, m, 0).getDate();
    const d = Math.max(1, Math.min(maxDayInMonth, parseInt(birthDay, 10) || 15));

    const dob = new Date(y, m - 1, d);
    const diffMs = Math.max(0, now.getTime() - dob.getTime());
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Calculate calendar months + remaining days
    let months = (now.getFullYear() - y) * 12 + (now.getMonth() - (m - 1));
    let remainderDays = now.getDate() - d;
    if (remainderDays < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      remainderDays += prevMonthLastDay;
    }

    const clampedMonths = Math.max(12, Math.min(240, months));
    const exactMonths = Math.round(Math.max(12, Math.min(240, months + (remainderDays / 30.4375))) * 10) / 10;
    const ageYears = Math.max(1, Math.min(20, Math.floor(clampedMonths / 12)));
    const subMonths = clampedMonths % 12;

    const mmStr = String(m).padStart(2, '0');
    const ddStr = String(d).padStart(2, '0');
    const birthDateStr = `${y}-${mmStr}-${ddStr}`;
    const birthDateKo = `${y}년 ${mmStr}월 ${ddStr}일생`;

    return {
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      birthDateStr,
      birthDateKo,
      totalDays,
      ageMonths: clampedMonths,
      exactMonths,
      remainderDays: Math.max(0, remainderDays),
      ageYears,
      subMonths,
      displayBadgeKo: `생후 ${clampedMonths}개월 ${Math.max(0, remainderDays)}일 (정밀 ${exactMonths}개월 · 만 ${ageYears}세 ${subMonths}개월)`,
      displayBadgeEn: `${clampedMonths} mos ${Math.max(0, remainderDays)} days (${exactMonths} mos · Age ${ageYears})`
    };
  }

  /**
   * Converts an ageMonths value into a default DOB (Year, Month, Day) relative to today
   */
  function getDobFromAgeMonths(ageMonths = 120, refDateObj = null) {
    const now = refDateObj instanceof Date ? refDateObj : new Date();
    const mTotal = Math.max(12, Math.min(240, Math.round(Number(ageMonths) || 120)));
    const targetDate = new Date(now.getFullYear(), now.getMonth() - mTotal, Math.min(15, now.getDate()));
    return calculateExactAgeFromDob(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      targetDate.getDate(),
      now
    );
  }

  /**
   * 2. Automatic Growth Stage & Bone Age Progression Detector from DOB & Gender
   * Removes the burden of parents manually guessing Tanner stage / bone age!
   */
  function autoDetectGrowthStage(ageMonths = 120, gender = 'boy', recentGrowth6m = 3.0) {
    const m = Number(ageMonths) || 120;
    const isGirl = gender === 'girl';
    const velocityYr = (Number(recentGrowth6m) || 3.0) * 2;

    // Boy thresholds vs Girl thresholds (girls enter pubertal PHV ~12-18 months earlier)
    const phase2Start = isGirl ? 102 : 114; // Girl 8.5y, Boy 9.5y
    const phase3Start = isGirl ? 144 : 162; // Girl 12.0y, Boy 13.5y
    const phase4Start = isGirl ? 174 : 186; // Girl 14.5y, Boy 15.5y

    let tannerPhase = 'phase_1';
    let stageNameKo = 'Phase 1 · 유아·아동 기초 성장기 (성장판 개방률 90%+)';
    let stageNameEn = 'Phase 1 · Foundation Linear Growth Stage (Open Plate 90%+)';
    let boneAgeNoteKo = '골단연골 증식 예비력이 가장 풍부한 시기로, 기초 골밀도와 소근육·전두엽 신경망을 동시에 다지는 구간입니다.';
    let expectedVelStr = m < 48 ? '연 7.0~9.5cm' : '연 5.5~6.5cm';

    if (m >= phase4Start) {
      tannerPhase = 'phase_4';
      stageNameKo = 'Phase 4 · 후기 체형·척추 디스크 완성기 (숨은 키 1.5~2.5cm 복원)';
      stageNameEn = 'Phase 4 · Late Skeletal Consolidation & Spinal Decompression';
      boneAgeNoteKo = '장관골 골단 유합 후반부로 척추 추체 성장과 거북목·추간판 감압을 통한 실측 숨은 키 복원이 핵심인 구간입니다.';
      expectedVelStr = '연 1.0~2.5cm (+숨은 키 2cm)';
    } else if (m >= phase3Start) {
      tannerPhase = 'phase_3';
      stageNameKo = 'Phase 3 · 사춘기 후기 감속·성숙 방어기 (잔여 잠재력 4~7cm 집중)';
      stageNameEn = 'Phase 3 · Post-PHV Deceleration & Epiphyseal Defense';
      boneAgeNoteKo = '급성장 정점 이후 성장판이 서서히 닫히기 전 마지막 4~7cm를 사수해야 하는 초긴급 방어 골든타임입니다.';
      expectedVelStr = '연 4.0~6.0cm';
    } else if (m >= phase2Start || (m >= 96 && velocityYr >= 7.2)) {
      tannerPhase = 'phase_2';
      stageNameKo = 'Phase 2 · 사춘기 진입 & 제2급성장 피크기 (PHV 골든타임)';
      stageNameEn = 'Phase 2 · Pubertal Onset & Peak Height Velocity (PHV)';
      boneAgeNoteKo = '성장호르몬(GH)과 IGF-1 분비가 폭발하며 일생 중 키가 가장 많이 자라는 급성장 골든타임(연 7~10cm)입니다.';
      expectedVelStr = '연 7.0~10.0cm';
    }

    return {
      tannerPhase,
      stageNameKo,
      stageNameEn,
      boneAgeNoteKo,
      expectedVelStr
    };
  }

  /**
   * 3. Complete Age-by-Age Sequential Lifecycle Database (만 1세 ~ 만 19세)
   */
  const AGE_LIFECYCLE_DB = {
    1: {
      age: 1,
      bandLabel: '만 1세 (12~23개월 · 영아 제1급성장기)',
      expectedVelocity: '연 10.0~12.0cm',
      physicalFocus: '제1급성장기 후반 골기질 축적 & 밤 9시 수면 성장호르몬 리듬 정착 (액상 칼슘·비타민D3 1000IU 필수)',
      brainFocus: '초당 100만 개 시냅스 형성기 · 엄지-검지 집기(Pincer Grasp) 및 오감 촉각·양손 협응 폭발기',
      parentWarning: '이 시기 우유에만 의존하면 철분·아연이 부족해지기 쉬우며, 스마트폰 노출 대신 손끝 촉각 자극이 필수입니다.',
      mustHaveSummary: '영유아 액상 칼슘·D3 드롭 + 원목 동전넣기·구슬꿰기 교구 + 오감 촉감 플랩북'
    },
    2: {
      age: 2,
      bandLabel: '만 2세 (24~35개월 · 자율성 & 손끝 민감기 진입)',
      expectedVelocity: '연 8.0~9.5cm',
      physicalFocus: '유아기 성장 전환 & 고형식 단백질·연골칼슘·아연 흡수를 통한 기초 장관골 성장',
      brainFocus: '대뇌 운동피질 30%가 집중된 손끝 소근육(숟가락질·원목 집게·구슬꿰기) 및 브로카 어휘 폭발기',
      parentWarning: '"내가 할 거야!" 고집은 반항이 아니라 전두엽 자율성과 손끝 소근육을 키우려는 결정적 발달 신호입니다.',
      mustHaveSummary: '액상/츄어블 구연산·연골칼슘 + 몬테소리 원목 집게·구슬꿰기 + 첫 스티커·선긋기 워크북'
    },
    3: {
      age: 3,
      bandLabel: '만 3세 (36~47개월 · 소근육 완성 & 유아 정속 성장기)',
      expectedVelocity: '연 7.0~8.0cm',
      physicalFocus: '유아기 정속 성장 궤도 진입 · 편식/입짧음 초기 교정(아연·초유) 및 밤 9시 30분 서파수면 고정',
      brainFocus: '세 손가락 협응(안전가위 오리기·연필쥐기 준비) & 초기 전두엽 충동억제·상징놀이 민감기',
      parentWarning: '만 3세의 손끝 정교성은 초등 입학 후 수학·독해 성적을 예측하는 1위 지표(Grissmer et al., 2010)입니다.',
      mustHaveSummary: '황기추출물(HT042)/아연·초유 영양제 + 유아 안전가위·집게 교구 + 첫 가위질·오리기 워크북'
    },
    4: {
      age: 4,
      bandLabel: '만 4세 (48~59개월 · 3D 공간지각 & 성장판 증식기)',
      expectedVelocity: '연 6.5~7.5cm',
      physicalFocus: '하지(대퇴골·경골) 성장판 연골세포 증식 가속 · 따라잡기 성장을 위한 황기추출물(HT042)·연골칼슘 보충',
      brainFocus: '평면에서 입체로 뇌가 확장되는 【두정엽 3D 공간지각·심상회전 민감기】 (원목 가베·은물·자석블록 적기)',
      parentWarning: '만 3세까지의 단순 감각 장난감만 계속 주면 두뇌 자극이 정체됩니다. 입체 도형 조형 교구로 전환할 시기입니다.',
      mustHaveSummary: '식약처 인정 황기추출물(HT042) + 원목 은물·가베 & 자석 입체블록 + 공간지각 도형 워크북'
    },
    5: {
      age: 5,
      bandLabel: '만 5세 (60~71개월 · 전두엽 실행기능 & 점핑 자극기)',
      expectedVelocity: '연 6.0~7.0cm',
      physicalFocus: '골단판 기계적 미세하중(Wolff\'s Law) 자극 개시 · 하루 15분 실내 트램폴린/줄넘기 점핑으로 성장판 자극',
      brainFocus: '전전두엽 실행기능(작업기억·자기조절) 도약기 & 음운인식·수감각(칠교놀이·패턴블록) 구조화',
      parentWarning: '취학 전 골밀도와 바른 식습관·수면 리듬을 완성해야 초등 입학 후 환경 변화에도 성장이 흔들리지 않습니다.',
      mustHaveSummary: '어린이 연골·어골칼슘 800mg + 실내 무소음 점핑 트램폴린 + 칠교놀이·인체 과학 팝업북'
    },
    6: {
      age: 6,
      bandLabel: '만 6세 (72~83개월 · 취학 준비 골연령 점검 & 인과추론기)',
      expectedVelocity: '연 5.5~6.5cm',
      physicalFocus: '학령기 전환 첫 골연령(Bone Age) 기준점 확립 · 키 백분위 50% 미만 시 HT042·연골칼슘 집중 보강 골든타임',
      brainFocus: '전두엽-두정엽 네트워크 통합 · 그래비트랙스 등 물리적 인과관계 추론 및 30분 바른 착석 습관 형성',
      parentWarning: '한글·수학 학습 시작과 함께 고개를 숙이는 거북목 자세가 시작됩니다. 높이조절 독서대로 숨은 키 손실을 막으세요.',
      mustHaveSummary: '황기추출물(HT042) 키성장 영양제 + 그래비트랙스 코딩 트랙 + 거북목 예방 원목 2단 독서대'
    },
    7: {
      age: 7,
      bandLabel: '만 7세 (84~95개월 · 초등 입학 척추 정렬 & 하브루타 입문기)',
      expectedVelocity: '연 5.5~6.0cm',
      physicalFocus: '초등 입학 후 착석 시간 급증에 따른 척추 디스크 압박 방어 & 야외 줄넘기·비타민D3·K2 골기질 강화',
      brainFocus: '구체적 조작기 진입 · 부모와 질문을 주고받는 【3단계 하브루타 질문독서】 및 논리적 문제해결력 확립',
      parentWarning: '초등 1학년 시기에 늦은 취침(밤 10시 이후) 습관이 굳어지면 사춘기 전 기초 신장을 매년 1~1.5cm씩 잃게 됩니다.',
      mustHaveSummary: '어골·연골칼슘 + 비타민D3·K2 + 초등 하브루타 질문독서 워크북 + 카운터 줄넘기'
    },
    8: {
      age: 8,
      bandLabel: '만 8세 (96~107개월 · 사춘기 전 기초신장 확보 & 과학탐구기)',
      expectedVelocity: '연 5.0~6.0cm',
      physicalFocus: '사춘기 진입 전 기초 신장 비축 핵심기 · 특히 여아는 과체중·성조숙 신호 모니터링 및 정속 성장 사수',
      brainFocus: '분류·서열화·비례 추론 심화 & 광학 현미경 실험·박물관 현장 탐구를 통한 과학적 가설-검증 회로 발달',
      parentWarning: '사춘기 급성장기(PHV)에 들어서기 전에 기초 키를 최대한 높여두어야 최종 성인 키가 커집니다.',
      mustHaveSummary: '식약처 인정 황기추출물(HT042) + 어린이 광학 현미경 과학키트 + 초등 과학·역사 탐구 도서'
    },
    9: {
      age: 9,
      bandLabel: '만 9세 (108~119개월 · 전두엽 피질 두께 피크 & 골연령 제어기)',
      expectedVelocity: '연 5.0~6.5cm',
      physicalFocus: '여아 사춘기 초기 개시 관찰기 / 남아 사춘기 전 비축기 · 골연령(BA)이 역연령보다 앞서지 않도록 야식·당류 차단',
      brainFocus: '일생 중 【배외측 전전두엽(DLPFC) 피질 두께가 정점】에 달하는 메타인지 폭발 골든타임 (백지복습·비문학 독해)',
      parentWarning: '만 9~10세에 형성된 메타인지(내가 아는 것과 모르는 것을 구분하는 힘)가 중고등 최상위권 성적을 결정합니다.',
      mustHaveSummary: '연골·어골칼슘 & 폴리감마글루탐산 + 초등 메타인지 백지복습 독해 워크북 + 무소음 시각 타이머'
    },
    10: {
      age: 10,
      bandLabel: '만 10세 (120~131개월 · 사춘기 초기 호르몬 & 급성장 진입기)',
      expectedVelocity: '연 5.5~7.5cm',
      physicalFocus: '여아 제2급성장기(PHV) 본격화 / 남아 사춘기 진입기 · 칼슘 요구량 1000~1100mg 급증 및 밤 10시 수면 사수',
      brainFocus: '추상적 개념 연결 · 역사/과학 인과관계 구조화 및 자기주도 장기 프로젝트 계획 능력 완성',
      parentWarning: '급성장기에는 뼈가 자라는 속도를 칼슘·단백질 공급이 따라가지 못하면 성장통과 골밀도 저하가 발생합니다.',
      mustHaveSummary: '황기추출물(HT042) + 고함량 어골·연골칼슘 1100mg + 실내 문틀 철봉 데드행 바'
    },
    11: {
      age: 11,
      bandLabel: '만 11세 (132~143개월 · 급성장 피크 PHV & 비판적 사고기)',
      expectedVelocity: '연 6.0~8.5cm',
      physicalFocus: '여아 PHV 정점 골든타임 / 남아 급성장 가속 개시기 · 연골칼슘·아르기닌·초유 단백질 최대 요구 구간',
      brainFocus: '형식적 조작기 진입 · 가설-연역적 추론 및 비판적 텍스트 독해·논술 구조화',
      parentWarning: '학원 스케줄로 밤 11시 이후 취침 시 서파수면 성장호르몬이 -38% 이상 손실됩니다. 수면의 질(마그네슘·타트체리)을 챙기세요.',
      mustHaveSummary: '타트체리·글리시네이트 마그네슘 수면케어 + 어골·연골칼슘 + 초등 고학년 비문학·과학 교양서'
    },
    12: {
      age: 12,
      bandLabel: '만 12세 (144~155개월 · 남아 PHV 폭발 & 시냅스 수초화기)',
      expectedVelocity: '연 6.5~9.5cm',
      physicalFocus: '남아 제2급성장기(PHV 연 8~10cm) 폭발 구간 / 여아 초경 후 잔여 성장(5~7cm) 집중 방어기 · 저녁 철봉 데드행 필수',
      brainFocus: '청소년기 2차 시냅스 가지치기(Pruning) & 자주 쓰는 전두엽 학습 회로의 수초화(Myelination · 전달속도 100배 가속)',
      parentWarning: '이 시기 1년은 유아기 3년 맞먹는 키 성장이 일어납니다. 칼슘·단백질 결핍과 거북목 디스크 압박을 동시에 막아야 합니다.',
      mustHaveSummary: '황기추출물(HT042)·아르기닌 초유단백 + 문틀 안전 철봉 데드행 + 청소년 뇌과학 자기주도 공부법 도서'
    },
    13: {
      age: 13,
      bandLabel: '만 13세 (156~167개월 · PHV 정점 통과 & 학업 코르티솔 방어기)',
      expectedVelocity: '연 5.0~8.5cm',
      physicalFocus: '남아 PHV 정점 유지 / 여아 골단 마감 방어기 · 심야 학습 스트레스(코르티솔)와 야간 혈당에 의한 GH 억제 차단',
      brainFocus: '전전두엽-변연계 리모델링 · 감정 조절 및 딥워크(Deep Work) 무방해 몰입 학습 습관 완성',
      parentWarning: '성장판이 닫히기 시작하는 감속기로 넘어가기 직전, 밤 10시 30분 입면과 취침 3시간 전 공복 원칙이 마지막 5cm를 결정합니다.',
      mustHaveSummary: '타트체리·글리시네이트 마그네슘 + 고함량 연골·어골칼슘 + 거북목 교정 2단 독서대'
    },
    14: {
      age: 14,
      bandLabel: '만 14세 (168~179개월 · 후기 성장판 & 척추 체간 성장 집중기)',
      expectedVelocity: '연 3.5~6.5cm',
      physicalFocus: '하지 장관골에서 【척추 추체 골단 성장】으로 중심 이동 · 철봉 매달리기(데드행)와 흉추 신전 스트레칭 필수',
      brainFocus: '고차원 메타인지 전략 수립 & 시험 불안 제어·장기 기억 공고화',
      parentWarning: '무릎 성장판이 닫혀가더라도 척추 성장판은 만 16~18세까지 열려 있습니다. 척추 감압 루틴으로 3~5cm를 더 확보하세요.',
      mustHaveSummary: '어골·연골칼슘 & 비타민D3·K2 + 척추 정렬 EPP 폼롤러 & 철봉 + 청소년 메타인지 독서'
    }
  };

  function getAgeLifecycleItem(ageYears) {
    const clamped = Math.max(1, Math.min(18, Math.round(Number(ageYears) || 10)));
    if (AGE_LIFECYCLE_DB[clamped]) return AGE_LIFECYCLE_DB[clamped];
    return {
      age: clamped,
      bandLabel: `만 ${clamped}세 (${clamped * 12}개월 · 후기 성장판 마감 방어 & 숨은 키 복원기)`,
      expectedVelocity: clamped <= 16 ? '연 1.5~3.5cm (+숨은 키 2cm)' : '숨은 키 1.8~2.5cm 복원',
      physicalFocus: '척추 추체 골단 잔여 성장 극대화 & 추간판 디스크 감압·거북목 교정으로 실측 신장 +2cm 복원, 성인 최대 골밀도(Peak Bone Mass) 완성',
      brainFocus: '전두엽 백질 수초화 완성 · 고강도 학업 몰입 후 서파수면(SWS) 뇌 피로 회복 및 자기주도 시간관리',
      parentWarning: '장시간 책상 착석으로 눌린 척추 디스크와 거북목만 교정해도 즉시 1.5~2.2cm의 숨은 키가 복원됩니다.',
      mustHaveSummary: '고함량 칼슘·마그네슘·테아닌 슬립케어 + 문틀 철봉·EPP 폼롤러 + 무소음 시각 타이머'
    };
  }

  /**
   * Returns a 4-stage sequential lifecycle roadmap starting from the child's current age:
   * [Current Age N, Next Year Age N+1, +2 Years Age N+2, +3 Years Age N+3]
   */
  function getSequentialLifecycleRoadmap(ageYears = 3) {
    const startAge = Math.max(1, Math.min(16, Math.floor(Number(ageYears) || 3)));
    return [
      Object.assign({ stageBadge: `📍 현재 (만 ${startAge}세 · 지금 당장 집중!)`, accent: '#38BDF8', isCurrent: true }, getAgeLifecycleItem(startAge)),
      Object.assign({ stageBadge: `⏭️ +1년 뒤 (만 ${startAge + 1}세 때 신경써야 할 핵심)`, accent: '#10B981', isCurrent: false }, getAgeLifecycleItem(startAge + 1)),
      Object.assign({ stageBadge: `🔭 +2년 뒤 (만 ${startAge + 2}세 때 신경써야 할 핵심)`, accent: '#F59E0B', isCurrent: false }, getAgeLifecycleItem(startAge + 2)),
      Object.assign({ stageBadge: `🏆 +3년 뒤 (만 ${startAge + 3}세 중장기 준비 포인트)`, accent: '#A78BFA', isCurrent: false }, getAgeLifecycleItem(startAge + 3))
    ];
  }

  /**
   * Helper to build direct merchant search URLs for an exact product query
   */
  function buildPinpointUrls(coupangQuery, iherbQuery, yes24Query, affConfig = {}) {
    const cfg = Object.assign({}, DEFAULT_AFF, affConfig || {});
    const cpTag = encodeURIComponent(cfg.coupang || DEFAULT_AFF.coupang);
    const ihCode = encodeURIComponent(cfg.iherb || DEFAULT_AFF.iherb);
    const lpId = encodeURIComponent(cfg.linkprice || DEFAULT_AFF.linkprice);

    const cpUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(coupangQuery)}&channel=user&lptag=${cpTag}`;
    const ihUrl = `https://kr.iherb.com/search?kw=${encodeURIComponent(iherbQuery)}&rcode=${ihCode}`;
    const yesTarget = `https://www.yes24.com/Product/Search?domain=ALL&query=${encodeURIComponent(yes24Query || coupangQuery)}`;
    const lpUrl = `https://click.linkprice.com/click.php?m=yes24&a=${lpId}&l=9999&l_cd1=3&l_cd2=0&tu=${encodeURIComponent(yesTarget)}`;

    return {
      coupangUrl: cpUrl,
      iherbUrl: ihUrl,
      yes24Url: lpUrl,
      coupangQuery,
      iherbQuery
    };
  }

  /**
   * 4. Child-Specific Pinpoint Product Curator
   * Selects exact Supplements (2), Toys/Play Tools (2), and Books/Workbooks (2)
   * dynamically tailored to the child's exact profile so every child gets a customized prescription!
   */
  function curatePinpointItems(profile = {}, affConfig = {}) {
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const genderKo = profile.gender === 'girl' ? '여아' : '남아';
    const height = Number(profile.currentHeight) || 137.0;
    const weight = Number(profile.currentWeight) || 35.5;
    const recent6m = Number(profile.recentGrowth6m) || 3.2;
    const habits = Array.isArray(profile.habits) ? profile.habits : ['late_sleep'];
    const cogAxes = Array.isArray(profile.cognitiveAxes) ? profile.cognitiveAxes : ['science_nature'];

    // Determine if height is below median or velocity needs catch-up
    const isPicky = habits.includes('picky_eater');
    const isLateSleep = habits.includes('late_sleep') || habits.includes('night_carbs');
    const isPoorPosture = habits.includes('poor_posture');
    const isSedentary = habits.includes('sedentary');

    // =========================================================================
    // A. PINPOINT SUPPLEMENTS (2 Exact Target Products per Child)
    // =========================================================================
    const supplements = [];

    if (ageYears <= 3) {
      // Toddler 1-3 yrs: Liquid Citrate/Cartilage Calcium + D3
      supplements.push(Object.assign({
        id: 'liquid_calcium_toddler',
        categoryBadge: '🍼 영유아 골기질 1순위 맞춤 영양제',
        name: '영유아 액상 구연산·연골 칼슘 마그네슘 & 비타민D3 1000IU 드롭',
        activeSpec: '액상 구연산칼슘(흡수율 45%) + 연골추출물 + 마그네슘 + 콜레칼시페롤(D3)',
        whyNeeded: `생후 ${ageMonths}개월 ${genderKo}는 제1급성장기 골격이 형성되는 시기로, 정제 알약 대신 위산 분비와 무관하게 흡수되는 액상 구연산·연골칼슘(일일 650mg 기준)과 비타민D3 보충이 필수입니다 (PMID:31964028).`,
        buttonLabelCoupang: `쿠팡에서 '유아 액상 구연산 연골칼슘 비타민D' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 'ChildLife 액상 칼슘 마그네슘' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 액상 칼슘 마그네슘 비타민D 어린이 구연산칼슘',
        'ChildLife Liquid Calcium with Magnesium Orange',
        '유아 영양식단 칼슘 육아',
        affConfig
      )));
    } else {
      // Age 4+: HT042 Astragalus Complex (Primary Growth Promoter)
      supplements.push(Object.assign({
        id: 'ht042_growth',
        categoryBadge: '🧬 식약처 인정 키성장 기능성 원료 1순위',
        name: '식약처 인정 황기추출물 등 복합물(HT042) 어린이 키성장 영양제',
        activeSpec: '황기추출물 등 복합물(HT042 · 가시오갈피·한속단 배합) 개별인정형 원료',
        whyNeeded: `만 ${ageYears}세(${ageMonths}개월, 현재 ${height}cm) 시기에 간에서 성장호르몬 하위 인자(IGF-1 및 IGFBP-3) 생성을 촉진하여 성장판 연골세포 증식 속도를 높여주는 식약처 인정 핵심 원료입니다 (경희대 임상 PMID:25374566).`,
        buttonLabelCoupang: `쿠팡에서 '어린이 황기추출물 HT042 키성장 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '황기추출물(Astragalus) 성장 면역 스펙' 바로 보기 ↗`
      }, buildPinpointUrls(
        '식약처 인정 키성장 황기추출물 HT042 어린이 영양제',
        'Astragalus root extract kids growth immune',
        '어린이 키성장 영양가이드',
        affConfig
      )));
    }

    // Supplement #2: Dynamically chosen based on child's specific habit bottleneck or bone mineralization need
    if (isPicky) {
      supplements.push(Object.assign({
        id: 'zinc_colostrum',
        categoryBadge: '🥦 편식·입짧음 & IGF-1 활성화 맞춤 처방',
        name: '어린이 글루콘산·피콜린산 아연 + 초유 단백질(IgG) + L-아르기닌 영양제',
        activeSpec: '글루콘산/피콜린산 아연(8~12mg) + 뉴질랜드 초유단백 + L-아르기닌',
        whyNeeded: `선택하신 [단백질·채소 편식] 요인은 성장호르몬 수용체(GHR) 인산화와 미각 세포 재생을 늦춥니다. 체중(${weight}kg) 비례 단백질 기질과 아연·초유 성장인자를 동시에 보충해야 합니다 (PMID:12036814).`,
        buttonLabelCoupang: `쿠팡에서 '어린이 글루콘산 아연 초유 아르기닌 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '어린이 피콜린산 아연 초유(Colostrum)' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 글루콘산 아연 초유 아르기닌 영양제',
        'Kids Zinc Picolinate Colostrum Chewable',
        '편식 아이 영양사전',
        affConfig
      )));
    } else if (isLateSleep && ageYears >= 7) {
      supplements.push(Object.assign({
        id: 'sleep_magnesium_tartcherry',
        categoryBadge: '🌙 밤 10시 서파수면(SWS) & 성장통 완화 맞춤 처방',
        name: '어린이 연골칼슘·글리시네이트 마그네슘 & 몽모랑시 타트체리 슬립케어',
        activeSpec: '연골·어골칼슘 + 킬레이트 글리시네이트 마그네슘(${Math.round(weight * 4.5)}mg) + 타트체리·L-테아닌',
        whyNeeded: `선택하신 [늦은 취침 / 야간 혈당] 요인으로 억제된 밤 10시~2시 서파수면 성장호르몬 피크(일일 분비량의 65%)를 복원하고 야간 성장통·신경 흥분을 안정시키는 맞춤 배합입니다 (PMID:4300547).`,
        buttonLabelCoupang: `쿠팡에서 '어린이 연골칼슘 마그네슘 타트체리 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '어린이 글리시네이트 마그네슘 타트체리' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 연골칼슘 어골칼슘 마그네슘 타트체리 비타민D',
        'Kids Magnesium Glycinate Calcium D3 Chewable',
        '수면 호르몬과 아이 키성장',
        affConfig
      )));
    } else {
      // Default #2: Cartilage Calcium (연골칼슘) & Fish Bone Calcium (어골칼슘 MCHA) + PGA + Vit D3/K2
      const targetCa = ageYears <= 3 ? 650 : ageYears <= 8 ? 800 : 1100;
      supplements.push(Object.assign({
        id: 'cartilage_calcium',
        categoryBadge: '🦴 성장판 연골 → 뼈 기질 골화 필수 처방',
        name: '어린이 연골칼슘·비소성 어골칼슘(MCHA) & 폴리감마글루탐산·비타민D3·K2',
        activeSpec: `연골칼슘·어골칼슘(일일 목표 ${targetCa}mg, 흡수율 45%) + 폴리감마글루탐산(PGA) + D3·K2(MK-7)`,
        whyNeeded: `만 ${ageYears}세 성장판의 연골세포가 단단한 뼈 기질로 전환될 때, 일반 탄산칼슘(흡수율 22%)보다 생체흡수율이 2배 이상 높고 인체 뼈 구성비(Ca:P=2:1)와 동일한 연골·어골칼슘과 비타민D3·K2가 필수입니다.`,
        buttonLabelCoupang: `쿠팡에서 '어린이 연골칼슘 어골칼슘 폴리감마글루탐산 비타민D' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '어린이 구연산·킬레이트 칼슘 마그네슘 D3·K2' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 연골칼슘 어골칼슘 폴리감마글루탐산 비타민D3 츄어블',
        'Kids Calcium Citrate Magnesium Vitamin D3 K2 Chewable',
        '소아 골밀도와 칼슘 영양학',
        affConfig
      )));
    }

    // =========================================================================
    // B. PINPOINT PLAY & DEVELOPMENTAL TOYS (2 Exact Target Products per Child)
    // =========================================================================
    const toys = [];

    if (ageYears <= 3) {
      toys.push(Object.assign({
        id: 'montessori_pincer_1_3',
        categoryBadge: '🖐️ 만 1~3세 대뇌 운동피질 30% 손끝 소근육 1순위 교구',
        name: '몬테소리 원목 악어집게 폼폼이 분류 & 구슬꿰기·안전가위 소근육 세트',
        activeSpec: '엄지·검지·중지 삼지집기(Tripod Grasp) & 양손 눈-손 협응 정밀 훈련',
        whyNeeded: `생후 ${ageMonths}개월은 손끝 신경이 전두엽과 가장 활발히 연결되는 '소근육 민감기'입니다. 원목 집게로 폼폼이를 옮기고 구슬을 꿰는 놀이가 소근육 악력과 집중력을 동시에 폭발시킵니다 (PMID:20822219).`,
        buttonLabelCoupang: `쿠팡에서 '몬테소리 원목 집게 구슬꿰기 유아 안전가위 소근육 교구' 바로 보기 ↗`
      }, buildPinpointUrls(
        '몬테소리 소근육 교구 원목 집게 구슬꿰기 유아 안전가위 세트',
        'Montessori Wooden Pincer Grasp Fine Motor Beads Toy',
        '몬테소리 소근육 놀이 교구',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'balance_trampoline_1_3',
        categoryBadge: '🏃 영유아 전정감각 & 초기 성장판 미세자극 놀이기구',
        name: '유아 실내 밸런스 징검다리 & 손잡이형 무소음 점핑 트램폴린',
        activeSpec: '소뇌 평형감각(전정기관) 발달 + 하지 성장판 수직 압전 자극',
        whyNeeded: `실내에서도 매일 15분씩 안전하게 뛰고 균형을 잡으며 대근육 협응력과 밤 9시 꿀잠(서파수면)을 유도하는 영유아 필수 신체 놀잇감입니다.`,
        buttonLabelCoupang: `쿠팡에서 '유아 밸런스 징검다리 손잡이 실내 트램폴린' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 밸런스 징검다리 어린이 손잡이 실내 트램폴린',
        'Toddler Balance Stepping Stones Indoor Trampoline',
        '영유아 대근육 신체놀이',
        affConfig
      )));
    } else if (ageYears <= 5) {
      toys.push(Object.assign({
        id: 'froebel_gabe_4_5',
        categoryBadge: '🧩 만 4~5세 두정엽 3D 공간지각·수리 민감기 1순위 교구',
        name: '프뢰벨식 원목 은물·가베 풀세트 & 3D 입체 자석블록(마그넷 타일) 교구',
        activeSpec: '점·선·면 입체 기하학 구성 + 멘탈 로테이션(심상 회전) 두뇌 자극',
        whyNeeded: `만 ${ageYears}세(${ageMonths}개월)는 평면 시각에서 3차원 입체 공간 추론으로 두뇌 회로가 도약하는 시기입니다. 원목 가베와 자석블록 조형 놀이가 초등 기하학·수학적 사고력의 뿌리가 됩니다 (Verdine et al., 2014).`,
        buttonLabelCoupang: `쿠팡에서 '유아 원목 가베 은물 세트 자석블록 입체도형 교구' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 원목 가베 세트 자석블록 입체도형 공간지각 교구',
        'Wooden Froebel Gifts Magnetic Tiles 3D Building Blocks',
        '프뢰벨 가베 은물 활용 가이드북',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'indoor_trampoline_4_5',
        categoryBadge: '⚡ 성장판 볼프의 법칙(Wolff\'s Law) 점핑 운동 기구',
        name: '층간소음 방어 어린이 무소음 실내 트램폴린 점핑매트 & 원목 칠교놀이',
        activeSpec: '체중 1.8배 수직 미세하중 성장판 자극 + 도형 분할 수리 퍼즐',
        whyNeeded: `하루 15분 규칙적인 수직 점핑은 대퇴골·경골 성장판 연골세포에 압전 신호를 전달해 골 성장 속도를 약 +1.5cm/yr 가속합니다 (PMID:19734332).`,
        buttonLabelCoupang: `쿠팡에서 '어린이 무소음 실내 트램폴린 점핑매트 칠교놀이' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 무소음 실내 트램폴린 점핑매트 손잡이형',
        'Kids Indoor Fitness Rebounder Trampoline Tangram',
        '아이 키 크는 점프 스트레칭',
        affConfig
      )));
    } else if (ageYears <= 8) {
      toys.push(Object.assign({
        id: 'gravitrax_stem_6_8',
        categoryBadge: '🔬 만 6~8세 전두엽 인과추론 & 소근육 정밀조립 교구',
        name: '그래비트랙스(GraviTrax) 중력 코딩 마블런 스타터 세트 & 원목 칠교 소마큐브',
        activeSpec: '중력·위치에너지 가설 실험 + 3차원 트랙 설계 전두엽 계획 회로 강화',
        whyNeeded: `초등 입학 전후 만 ${ageYears}세 아이가 스마트폰 대신 손끝으로 트랙 높이와 각도를 조절하며 물리적 인과관계와 공간 논리를 스스로 깨우치는 최고급 STEM 탐구 교구입니다.`,
        buttonLabelCoupang: `쿠팡에서 '그래비트랙스 코어 스타터 세트 소마큐브 칠교놀이' 바로 보기 ↗`
      }, buildPinpointUrls(
        '그래비트랙스 코어 스타터 세트 소마큐브 칠교놀이',
        'Ravensburger GraviTrax Marble Run STEM Toy',
        '초등 과학 탐구 도형 퍼즐',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'posture_stand_jumprope_6_8',
        categoryBadge: '📏 숨은 키 1.8cm 거북목 방어 & 성장판 점프 기구',
        name: '초등 거북목 예방 원목 높이·각도조절 2단 독서대 & 디지털 카운터 줄넘기',
        activeSpec: '경추 C자 커브 유지(추간판 압박 차단) + 주 5회 수직 점프 카운팅',
        whyNeeded: `초등 시기 책상 앞에서 고개를 숙이면 경추 하중이 15kg 이상 증가해 숨은 키 1.8cm가 손실됩니다. 눈높이 2단 독서대와 하루 500회 카운터 줄넘기가 필수입니다.`,
        buttonLabelCoupang: `쿠팡에서 '어린이 높이조절 원목 2단 독서대 카운터 줄넘기' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 높이조절 원목 2단 독서대 거북목 교정',
        'Ergonomic Adjustable Wooden Book Stand Posture Kids',
        '바른 자세 독서법',
        affConfig
      )));
    } else {
      // Age 9+ (Pre-puberty to Adolescence)
      toys.push(Object.assign({
        id: 'microscope_timer_9_plus',
        categoryBadge: '🧠 만 9세+ 배외측 전전두엽(DLPFC) 과학 탐구 & 딥워크 도구',
        name: ageYears <= 12
          ? '초등 고배율 광학 현미경 프레파라트 과학실험 세트 & 무소음 시각 타이머'
          : '청소년 자기주도 딥워크 무소음 시각 타이머 & 높이조절 2단 원목 독서대',
        activeSpec: '가설-검증 과학 실험 / 전두엽 작업기억 45분 몰입 시간관리 표준 도구',
        whyNeeded: `만 ${ageYears}세는 전두엽 피질 재조직화와 수초화가 일어나는 시기입니다. 스스로 시간을 시각화하여 통제하는 무소음 타이머와 능동적 과학 실험/독서 환경이 자기주도 학습력을 완성합니다.`,
        buttonLabelCoupang: ageYears <= 12
          ? `쿠팡에서 '초등 학생용 광학 현미경 과학실험 세트 시각타이머' 바로 보기 ↗`
          : `쿠팡에서 '무소음 시각 타이머 높이조절 원목 2단 독서대' 바로 보기 ↗`
      }, buildPinpointUrls(
        ageYears <= 12 ? '초등 학생용 광학 현미경 프레파라트 과학실험 세트' : '무소음 시각 타이머 공부 시계 원목 2단 독서대',
        'AmScope Kids Microscope Visual Countdown Timer',
        '자기주도학습 시간관리',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'deadhang_foamroller_9_plus',
        categoryBadge: '🦴 척추 추간판 감압(+1.8cm 복원) & 성장판 스트레칭 기구',
        name: '무타공 안전 잠금 실내 문틀 철봉(데드행 바) & 척추 신전 EPP 폼롤러 세트',
        activeSpec: '저녁 30초×3세트 패시브 데드행 척추 견인 + 흉추 가동성 복원',
        whyNeeded: `만 ${ageYears}세(${height}cm) 아동·청소년이 하루 종일 앉아 있으면서 눌린 척추 디스크 수분을 저녁 취침 전 90초 매달리기(Dead Hang)와 폼롤러 신전으로 즉각 복원해 숨은 키 1.5~2.2cm를 되찾아줍니다 (PMID:30897641).`,
        buttonLabelCoupang: `쿠팡에서 '무타공 안전 잠금 문틀 철봉 실내 턱걸이봉 폼롤러' 바로 보기 ↗`
      }, buildPinpointUrls(
        '무타공 안전 잠금 문틀 철봉 실내 데드행 턱걸이봉',
        'Doorway Pull Up Bar No Screw Foam Roller Spine',
        '척추 교정 스트레칭 가이드',
        affConfig
      )));
    }

    // =========================================================================
    // C. PINPOINT BOOKS & WORKBOOKS (2 Exact Target Products per Child)
    // =========================================================================
    const books = [];

    if (ageYears <= 3) {
      books.push(Object.assign({
        id: 'workbook_scissors_1_3',
        categoryBadge: '✂️ 만 1~3세 손끝 소근육·운필력 1순위 워크북',
        name: '유아 첫 가위질·오리기·스티커·선긋기 단계별 소근육 두뇌 워크북 세트',
        activeSpec: '손가락 내재근 분리 운동 + 눈-손 협응 단계별 성취 프로그램',
        whyNeeded: `하루 15분 엄마·아빠와 종이를 오리고 선에 맞춰 스티커를 붙이는 활동만으로도 유아의 대뇌 전두엽-소뇌 신경망이 강력하게 활성화됩니다.`,
        buttonLabelCoupang: `쿠팡에서 '유아 첫 가위질 오리기 스티커북 소근육 워크북 세트' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '유아 가위질 스티커 소근육 워크북' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 첫 가위질 오리기 스티커북 선긋기 소근육 워크북 세트',
        'Kumon Let us Cut Paper First Steps Workbook',
        '유아 가위질 오리기 소근육 워크북',
        affConfig
      )));

      books.push(Object.assign({
        id: 'tactile_flap_book_1_3',
        categoryBadge: '📚 영유아 어휘 폭발 & 수면 습관 형성 그림책',
        name: '영유아 오감 자극 들춰보기(Flap) 촉감 그림책 & 밤 9시 꿀잠 수면 동화 세트',
        activeSpec: '손끝으로 열어보는 입체 플랩 조작 + 수면 의식(Sleep Ritual) 형성',
        whyNeeded: `아이 손으로 직접 플랩을 들춰보며 "까꿍, 왜 그럴까?" 대화 턴을 주고받을 때 브로카 언어 영역이 가장 빠르게 자라며, 취침 전 수면 동화는 밤 9시 30분 입면을 돕습니다.`,
        buttonLabelCoupang: `쿠팡에서 '아기 오감 촉감책 들춰보기 플랩북 수면 동화' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '유아 들춰보기 플랩북 수면 그림책' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 들춰보기 플랩북 오감 촉감 그림책 수면 동화',
        'Toddler Lift the Flap Interactive Board Book',
        '유아 들춰보기 플랩북 그림책',
        affConfig
      )));
    } else if (ageYears <= 5) {
      books.push(Object.assign({
        id: 'spatial_pattern_book_4_5',
        categoryBadge: '📐 만 4~5세 공간지각·창의수리 두뇌 워크북',
        name: '유아 공간지각 도형 회전·패턴블록·규칙 찾기 창의사고력 수학 워크북',
        activeSpec: '두정엽 시공간 작업기억 + 도형 대칭·규칙 추론 훈련',
        whyNeeded: `만 ${ageYears}세에 가베·블록 놀이와 함께 도형 회전·규칙 찾기 워크북을 병행하면 초등 입학 후 도형·문장제 수학에 대한 자신감이 비약적으로 높아집니다.`,
        buttonLabelCoupang: `쿠팡에서 '유아 공간지각 도형 퍼즐 창의사고력 수학 워크북' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '유아 공간지각 도형 창의수학 워크북' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 공간지각 도형 퍼즐 창의사고력 수학 워크북',
        'Preschool Spatial Reasoning Math Logic Workbook',
        '유아 공간지각 창의사고력 수학 워크북',
        affConfig
      )));

      books.push(Object.assign({
        id: 'body_growth_popup_4_5',
        categoryBadge: '🦴 스스로 골고루 먹고 일찍 자게 만드는 과학 그림책',
        name: '호기심 자연관찰 & "우리 몸과 뼈는 어떻게 자랄까?" 인체 입체 팝업 그림책',
        activeSpec: '성장판·수면·영양의 원리를 눈으로 보는 입체 팝업 북큐레이션',
        whyNeeded: `백 번 잔소리하는 것보다 "밤에 일찍 자고 고기·채소를 먹으면 뼈 속 성장판 요정이 어떻게 키를 키워주는지" 입체 팝업 그림책으로 보여주면 아이 스스로 식습관과 수면 습관을 바꿉니다!`,
        buttonLabelCoupang: `쿠팡에서 '어린이 우리몸 인체 입체 팝업북 과학 그림책' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '어린이 인체 팝업북 과학 그림책' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 우리몸 인체 입체 팝업북 자연관찰 과학 그림책',
        'Human Body Pop Up Book for Kids Science',
        '어린이 우리몸 인체 팝업북',
        affConfig
      )));
    } else if (ageYears <= 8) {
      books.push(Object.assign({
        id: 'havruta_workbook_6_8',
        categoryBadge: '💬 만 6~8세 전두엽 인과추론 & 문해력 1순위 도서',
        name: '초등 저학년 하브루타 질문독서 생각열기 워크북 & 비주얼 씽킹 어휘력 세트',
        activeSpec: '관찰-가설-적용 3단계 하브루타 질문법 + 초등 교과 핵심 어휘 구조화',
        whyNeeded: `만 ${ageYears}세 아동은 정답만 맞히는 문제집보다 "왜 그럴까? 만약 반대로 바뀌면 어떨까?" 질문하며 자기 생각을 말하고 쓰는 하브루타 워크북을 할 때 전두엽 사고력이 폭발합니다.`,
        buttonLabelCoupang: `쿠팡에서 '초등 하브루타 질문 독서 생각열기 어휘력 워크북' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '초등 하브루타 질문 독서 어휘력 워크북' 바로 보기 ↗`
      }, buildPinpointUrls(
        '초등 하브루타 질문 독서 수업 생각열기 어휘력 워크북',
        'Critical Thinking Reading Comprehension Workbook Grade 1 2',
        '초등 하브루타 질문 독서 워크북',
        affConfig
      )));

      books.push(Object.assign({
        id: 'museum_science_history_6_8',
        categoryBadge: '🏛️ 주말 박물관·과학관 나들이 효과 200% 연계 도서',
        name: '초등 교과 연계 과학관·박물관 체험 탐구 도감 & 스토리텔링 수학·역사 동화',
        activeSpec: '주말 현장 체험 사전·사후 배경지식 확장 도감',
        whyNeeded: `주말 과학관·박물관에 가기 전후에 관련 유물과 과학 원리를 그림 도감으로 먼저 읽고 가면 현장 관람 몰입도와 장기 기억 보존율이 3배 이상 높아집니다 (Haden et al., 2014).`,
        buttonLabelCoupang: `쿠팡에서 '초등 과학관 박물관 체험 도감 스토리텔링 과학동화' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '초등 박물관 과학관 탐구 도감' 바로 보기 ↗`
      }, buildPinpointUrls(
        '초등 과학관 박물관 체험 탐구 도감 어린이 과학동화',
        'Smithsonian Science History Encyclopedia for Kids',
        '초등 박물관 과학관 도감',
        affConfig
      )));
    } else {
      books.push(Object.assign({
        id: 'metacognition_workbook_9_plus',
        categoryBadge: '🎯 만 9세+ 배외측 전전두엽(DLPFC) 메타인지 필독 워크북',
        name: '초등 고학년·청소년 메타인지 백지복습 노트 & 비문학 문해력 구조화 워크북',
        activeSpec: '아는 것과 모르는 것 구분(메타인지) + 비문학 핵심 문장 요약 훈련',
        whyNeeded: `만 ${ageYears}세는 배외측 전전두엽이 성숙하며 메타인지가 완성되는 결정적 시기입니다. 읽은 내용을 백지에 구조화해 인출하는 훈련이 자기주도 학습의 핵심입니다.`,
        buttonLabelCoupang: `쿠팡에서 '초등 청소년 메타인지 백지복습 비문학 문해력 워크북' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '메타인지 공부법 비문학 독해 워크북' 바로 보기 ↗`
      }, buildPinpointUrls(
        '초등 고학년 메타인지 백지복습 비문학 독해력 워크북',
        'Metacognition Study Skills Reading Comprehension Workbook',
        '초등 고학년 비문학 독해 메타인지 워크북',
        affConfig
      )));

      books.push(Object.assign({
        id: 'brain_growth_science_9_plus',
        categoryBadge: '📘 스스로 수면·자세·집중력을 관리하는 뇌과학 교양서',
        name: '어린이·청소년을 위한 뇌과학 자기주도 공부법 & 인체·호르몬 과학 필독서',
        activeSpec: '수면(서파수면)·도파민 조절·몰입(Deep Work)의 뇌과학적 원리 체득',
        whyNeeded: `아이 스스로 "왜 스마트폰을 줄이고 밤 10시 30분 전에 자야 내 키와 전두엽이 자라는지" 과학적 팩트로 납득하게 만들어주는 최고의 동기부여 필독서입니다.`,
        buttonLabelCoupang: `쿠팡에서 '청소년 뇌과학 자기주도 공부법 인체 과학 교양서' 바로 보기 ↗`,
        buttonLabelYes24: `예스24에서 '청소년 뇌과학 공부법 과학 교양서' 바로 보기 ↗`
      }, buildPinpointUrls(
        '청소년 뇌과학 공부법 자기주도학습 과학 교양서',
        'Teen Brain Neuroscience Study Guide Book',
        '청소년 뇌과학 공부법',
        affConfig
      )));
    }

    return {
      supplements,
      toys,
      books,
      lifecycleRoadmap: getSequentialLifecycleRoadmap(ageYears),
      autoStage: autoDetectGrowthStage(ageMonths, profile.gender, recent6m)
    };
  }

  /**
   * 5. Renders the Pinpoint Supplement / Toy / Book Recommendation Section + Age N -> N+1 -> N+2 Roadmap HTML
   */
  function renderPinpointAndLifecycleSection(profile = {}, affConfig = {}) {
    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const data = curatePinpointItems(profile, affConfig);
    const ageMonths = Number(profile.ageMonths) || 120;
    const exactMonths = Number(profile.exactMonths || ageMonths).toFixed(1);
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const genderKo = profile.gender === 'girl' ? '여아' : '남아';
    const dobText = profile.birthDateKo || `${new Date().getFullYear() - ageYears}년생`;

    return `
      <!-- SECTION A: Age-by-Age Sequential Lifecycle Roadmap (만 N세 -> 만 N+1세 -> 만 N+2세 -> 만 N+3세) -->
      <div id="child-lifecycle-roadmap-section" style="margin-top: 1.5rem; padding-top: 1.35rem; border-top: 1px solid var(--theme-border-subtle, rgba(255,255,255,0.08));">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 1rem;">
          <div>
            <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10B981; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 9999px; margin-bottom: 0.3rem;">
              🌱 AGE-BY-AGE LIFECYCLE MILESTONE ROADMAP
            </span>
            <h3 style="font-size: 1.15rem; font-weight: 900; color: var(--text-primary, #FFFFFF); margin: 0;">
              ${isEn
                ? `Year-by-Year Growth & Brain Focus: Age ${ageYears} → Age ${ageYears + 1} → Age ${ageYears + 2} → Age ${ageYears + 3}`
                : `우리 아이 성장주기별 핵심 케어 타임라인 (만 ${ageYears}세 → 만 ${ageYears + 1}세 → 만 ${ageYears + 2}세 → 만 ${ageYears + 3}세)`}
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary, #94A3B8); margin: 0.25rem 0 0 0;">
              ${dobText} (생후 ${exactMonths}개월 ${genderKo}) 아이가 자라면서 올해·내년·내후년에 부모님이 무엇을 가장 중요하게 신경써야 하는지 학술 DB 기반으로 정리했습니다.
            </p>
          </div>
          <span style="background: rgba(56, 189, 248, 0.14); color: #38BDF8; font-size: 0.76rem; font-weight: 800; padding: 0.3rem 0.7rem; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);">
            🤖 자동 판정 단계: ${data.autoStage.stageNameKo}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.85rem;">
          ${data.lifecycleRoadmap.map((step) => `
            <div class="lifecycle-age-card" data-age="${step.age}" style="background: ${step.isCurrent ? 'rgba(56, 189, 248, 0.09)' : 'rgba(15, 23, 42, 0.65)'}; border: ${step.isCurrent ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)'}; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 0.45rem;">
                  <span style="background: rgba(255,255,255,0.08); color: ${step.accent}; font-size: 0.73rem; font-weight: 800; padding: 0.18rem 0.55rem; border-radius: 6px;">
                    ${step.stageBadge}
                  </span>
                  <span style="font-size: 0.72rem; font-weight: 800; color: #10B981;">목표: ${step.expectedVelocity}</span>
                </div>
                <h4 style="font-size: 0.94rem; font-weight: 800; color: #FFFFFF; margin: 0 0 0.5rem 0;">
                  ${step.bandLabel}
                </h4>
                <div style="font-size: 0.79rem; color: #E2E8F0; line-height: 1.48; margin-bottom: 0.45rem;">
                  <strong style="color: #38BDF8;">📏 신체·골격 핵심:</strong> ${step.physicalFocus}
                </div>
                <div style="font-size: 0.79rem; color: #E2E8F0; line-height: 1.48; margin-bottom: 0.45rem;">
                  <strong style="color: #A78BFA;">🧠 두뇌·발달 핵심:</strong> ${step.brainFocus}
                </div>
                <div style="font-size: 0.75rem; color: #FDE68A; line-height: 1.42; background: rgba(245, 158, 11, 0.08); padding: 0.4rem 0.55rem; border-radius: 6px; margin-bottom: 0.5rem;">
                  <strong>⚠️ 학부모 주의점:</strong> ${step.parentWarning}
                </div>
              </div>
              <div style="font-size: 0.74rem; color: #A7F3D0; font-weight: 700; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 0.45rem;">
                🎁 <strong>이 시기 필수 준비물:</strong> ${step.mustHaveSummary}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- SECTION B: Pinpoint Custom Prescriptions (Supplements, Play Toys, Books) -->
      <div id="pinpoint-custom-prescription-section" style="margin-top: 1.5rem; padding-top: 1.35rem; border-top: 1px solid var(--theme-border-subtle, rgba(255,255,255,0.08));">
        <div style="margin-bottom: 1rem;">
          <span style="display: inline-block; background: rgba(245, 158, 11, 0.16); color: #F59E0B; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 9999px; margin-bottom: 0.3rem;">
            🎯 1:1 PINPOINT PRESCRIPTION (영양제 · 놀이 장난감 · 필독 도서)
          </span>
          <h3 style="font-size: 1.15rem; font-weight: 900; color: var(--text-primary, #FFFFFF); margin: 0;">
            ${isEn
              ? `Child-Specific Pinpoint Supplement, Manipulative Toy & Book Prescriptions`
              : `우리 아이(생후 ${exactMonths}개월 ${genderKo}) 맞춤 【영양제 · 놀이 장난감 · 필독 도서】 핀셋 처방`}
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary, #94A3B8); margin: 0.25rem 0 0 0;">
            막연한 전체 목록이 아니라, 현재 월령·신장·선택 습관에 꼭 필요한 <strong>구체적 성분과 교구·도서</strong>만 엄선했습니다. 버튼을 누르면 해당 상품이 바로 표시됩니다.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
          
          <!-- Column 1: Pinpoint Supplements -->
          <div class="pinpoint-category-box" id="pinpoint-supplements-box" style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.28); border-radius: 16px; padding: 1.1rem;">
            <h4 style="font-size: 0.98rem; font-weight: 900; color: #38BDF8; margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.4rem;">
              💊 1. 우리 아이 맞춤 핵심 영양제 처방
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
              ${data.supplements.map((item) => `
                <div class="pinpoint-item-card" data-item-id="${item.id}" style="background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.85rem;">
                  <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #38BDF8; background: rgba(56,189,248,0.14); padding: 0.14rem 0.5rem; border-radius: 4px; margin-bottom: 0.35rem;">
                    ${item.categoryBadge}
                  </span>
                  <div style="font-size: 0.9rem; font-weight: 800; color: #FFFFFF; line-height: 1.38; margin-bottom: 0.3rem;">
                    ${item.name}
                  </div>
                  <div style="font-size: 0.74rem; color: #A7F3D0; font-weight: 700; margin-bottom: 0.35rem;">
                    🧪 핵심 규격: ${item.activeSpec}
                  </div>
                  <p style="font-size: 0.77rem; color: #CBD5E1; line-height: 1.48; margin: 0 0 0.65rem 0;">
                    ${item.whyNeeded}
                  </p>
                  <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                    <a href="${item.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="coupang" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(56, 189, 248, 0.18); border: 1px solid rgba(56, 189, 248, 0.45); color: #38BDF8; font-size: 0.78rem; font-weight: 800; padding: 0.5rem 0.75rem; border-radius: 8px; text-decoration: none;">
                      📦 ${item.buttonLabelCoupang}
                    </a>
                    <a href="${item.iherbUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="iherb" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(16, 185, 129, 0.14); border: 1px solid rgba(16, 185, 129, 0.4); color: #10B981; font-size: 0.76rem; font-weight: 800; padding: 0.42rem 0.75rem; border-radius: 8px; text-decoration: none;">
                      🌿 ${item.buttonLabelIherb}
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Column 2: Pinpoint Developmental Play & Toys -->
          <div class="pinpoint-category-box" id="pinpoint-toys-box" style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 16px; padding: 1.1rem;">
            <h4 style="font-size: 0.98rem; font-weight: 900; color: #10B981; margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.4rem;">
              🧩 2. 소근육·두뇌·성장판 맞춤 놀이 장난감 &amp; 교구
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
              ${data.toys.map((item) => `
                <div class="pinpoint-item-card" data-item-id="${item.id}" style="background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.85rem;">
                  <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #10B981; background: rgba(16,185,129,0.14); padding: 0.14rem 0.5rem; border-radius: 4px; margin-bottom: 0.35rem;">
                    ${item.categoryBadge}
                  </span>
                  <div style="font-size: 0.9rem; font-weight: 800; color: #FFFFFF; line-height: 1.38; margin-bottom: 0.3rem;">
                    ${item.name}
                  </div>
                  <div style="font-size: 0.74rem; color: #A7F3D0; font-weight: 700; margin-bottom: 0.35rem;">
                    🎯 발달 타겟: ${item.activeSpec}
                  </div>
                  <p style="font-size: 0.77rem; color: #CBD5E1; line-height: 1.48; margin: 0 0 0.65rem 0;">
                    ${item.whyNeeded}
                  </p>
                  <a href="${item.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="coupang" style="display: inline-flex; width: 100%; box-sizing: border-box; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.45); color: #10B981; font-size: 0.78rem; font-weight: 800; padding: 0.52rem 0.75rem; border-radius: 8px; text-decoration: none;">
                    📦 ${item.buttonLabelCoupang}
                  </a>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Column 3: Pinpoint Books & Workbooks -->
          <div class="pinpoint-category-box" id="pinpoint-books-box" style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(167, 139, 250, 0.28); border-radius: 16px; padding: 1.1rem;">
            <h4 style="font-size: 0.98rem; font-weight: 900; color: #A78BFA; margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.4rem;">
              📚 3. 월령·인지축 맞춤 필독 도서 &amp; 워크북
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
              ${data.books.map((item) => `
                <div class="pinpoint-item-card" data-item-id="${item.id}" style="background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.85rem;">
                  <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #A78BFA; background: rgba(167,139,250,0.14); padding: 0.14rem 0.5rem; border-radius: 4px; margin-bottom: 0.35rem;">
                    ${item.categoryBadge}
                  </span>
                  <div style="font-size: 0.9rem; font-weight: 800; color: #FFFFFF; line-height: 1.38; margin-bottom: 0.3rem;">
                    ${item.name}
                  </div>
                  <div style="font-size: 0.74rem; color: #DDD6FE; font-weight: 700; margin-bottom: 0.35rem;">
                    📖 두뇌 자극: ${item.activeSpec}
                  </div>
                  <p style="font-size: 0.77rem; color: #CBD5E1; line-height: 1.48; margin: 0 0 0.65rem 0;">
                    ${item.whyNeeded}
                  </p>
                  <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                    <a href="${item.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="coupang" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(167, 139, 250, 0.18); border: 1px solid rgba(167, 139, 250, 0.45); color: #C4B5FD; font-size: 0.78rem; font-weight: 800; padding: 0.5rem 0.75rem; border-radius: 8px; text-decoration: none;">
                      📦 ${item.buttonLabelCoupang}
                    </a>
                    <a href="${item.yes24Url}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="linkprice" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); color: #38BDF8; font-size: 0.75rem; font-weight: 800; padding: 0.4rem 0.75rem; border-radius: 8px; text-decoration: none;">
                      📚 ${item.buttonLabelYes24}
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  const TallerPinpointCurator = {
    AGE_LIFECYCLE_DB,
    calculateExactAgeFromDob,
    getDobFromAgeMonths,
    autoDetectGrowthStage,
    getAgeLifecycleItem,
    getSequentialLifecycleRoadmap,
    buildPinpointUrls,
    curatePinpointItems,
    renderPinpointAndLifecycleSection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TallerPinpointCurator;
  }
  global.TallerPinpointCurator = TallerPinpointCurator;
  global.KidsFitPinpointCurator = TallerPinpointCurator;

})(typeof window !== 'undefined' ? window : global);
