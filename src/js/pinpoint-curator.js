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
    const birthDateEn = `Born ${y}-${mmStr}-${ddStr}`;

    return {
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      birthDateStr,
      birthDateKo,
      birthDateEn,
      totalDays,
      ageMonths: clampedMonths,
      exactMonths,
      remainderDays: Math.max(0, remainderDays),
      ageYears,
      subMonths,
      displayBadgeKo: `생후 ${clampedMonths}개월 ${Math.max(0, remainderDays)}일 (정밀 ${exactMonths}개월 · 만 ${ageYears}세 ${subMonths}개월)`,
      displayBadgeEn: `${clampedMonths} mos ${Math.max(0, remainderDays)} days (${exactMonths} mos · Age ${ageYears}y ${subMonths}m)`
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
    let boneAgeNoteEn = 'Epiphyseal cartilage reserve is at its peak; focus on baseline bone mineral density, fine motor skills, and prefrontal neural pathways.';
    let expectedVelStr = m < 48 ? '연 7.0~9.5cm' : '연 5.5~6.5cm';
    let expectedVelStrEn = m < 48 ? '7.0–9.5 cm/yr' : '5.5–6.5 cm/yr';

    if (m >= phase4Start) {
      tannerPhase = 'phase_4';
      stageNameKo = 'Phase 4 · 후기 체형·척추 디스크 완성기 (숨은 키 1.5~2.5cm 복원)';
      stageNameEn = 'Phase 4 · Late Skeletal Consolidation & Spinal Decompression';
      boneAgeNoteKo = '장관골 골단 유합 후반부로 척추 추체 성장과 거북목·추간판 감압을 통한 실측 숨은 키 복원이 핵심인 구간입니다.';
      boneAgeNoteEn = 'Late epiphyseal consolidation phase; focus on vertebral alignment and cervical/spinal disc decompression to recover 1.5–2.5 cm of hidden height.';
      expectedVelStr = '연 1.0~2.5cm (+숨은 키 2cm)';
      expectedVelStrEn = '1.0–2.5 cm/yr (+2 cm posture)';
    } else if (m >= phase3Start) {
      tannerPhase = 'phase_3';
      stageNameKo = 'Phase 3 · 사춘기 후기 감속·성숙 방어기 (잔여 잠재력 4~7cm 집중)';
      stageNameEn = 'Phase 3 · Post-PHV Deceleration & Epiphyseal Defense';
      boneAgeNoteKo = '급성장 정점 이후 성장판이 서서히 닫히기 전 마지막 4~7cm를 사수해야 하는 초긴급 방어 골든타임입니다.';
      boneAgeNoteEn = 'Post-peak growth window; urgent golden time to defend the remaining 4–7 cm of height potential before growth plate closure.';
      expectedVelStr = '연 4.0~6.0cm';
      expectedVelStrEn = '4.0–6.0 cm/yr';
    } else if (m >= phase2Start || (m >= 96 && velocityYr >= 7.2)) {
      tannerPhase = 'phase_2';
      stageNameKo = 'Phase 2 · 사춘기 진입 & 제2급성장 피크기 (PHV 골든타임)';
      stageNameEn = 'Phase 2 · Pubertal Onset & Peak Height Velocity (PHV)';
      boneAgeNoteKo = '성장호르몬(GH)과 IGF-1 분비가 폭발하며 일생 중 키가 가장 많이 자라는 급성장 골든타임(연 7~10cm)입니다.';
      boneAgeNoteEn = 'Peak Height Velocity (PHV) golden window with surging GH & IGF-1 secretion (7.0–10.0 cm/yr).';
      expectedVelStr = '연 7.0~10.0cm';
      expectedVelStrEn = '7.0–10.0 cm/yr';
    }

    return {
      tannerPhase,
      stageNameKo,
      stageNameEn,
      boneAgeNoteKo,
      boneAgeNoteEn,
      expectedVelStr,
      expectedVelStrEn
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
    const naverUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(coupangQuery)}`;

    return {
      coupangUrl: cpUrl,
      iherbUrl: ihUrl,
      yes24Url: lpUrl,
      naverUrl,
      coupangQuery,
      iherbQuery
    };
  }

  /**
   * Curated Specific Flagship Products DB (엄선 세부 상품 TOP 2 per Item ID)
   * Ensures clicking any link lands directly on a strictly vetted specific brand & model product.
   */
  const CURATED_SPECIFIC_PRODUCTS_DB = {
    liquid_calcium_toddler: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '차일드라이프(ChildLife) 액상 칼슘 위드 마그네슘 오렌지맛 474ml',
        titleEn: 'ChildLife Essentials Liquid Calcium with Magnesium Orange (474ml)',
        specKo: '구연산칼슘 252mg + 마그네슘 115mg + 비타민D3 100IU + 아연 2mg 액상 시럽',
        specEn: 'Calcium Citrate 252mg + Magnesium 115mg + Vit D3 + Zinc Liquid',
        cpQuery: '차일드라이프 액상 칼슘 마그네슘 오렌지맛 474ml',
        ihQuery: 'ChildLife Essentials Liquid Calcium with Magnesium Natural Orange 16 fl oz',
        yesQuery: '유아 영양식단 백과'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '트루엔 키즈 칼슘 마그네슘 비타민D 아연 액상 스틱 (어골·해조칼슘)',
        titleEn: 'Truen Kids Liquid Calcium Magnesium Vitamin D Zinc Stick Pouch',
        specKo: '개별 스틱포 포장 · 무첨가 어린이 고흡수 칼슘·마그네슘·비타민D3',
        specEn: 'Single-serve liquid sticks · High-absorption Calcium + Mg + D3',
        cpQuery: '트루엔 키즈 칼슘 마그네슘 비타민D 액상 스틱',
        ihQuery: 'Nature\'s Way Alive Kids Calcium + Vitamin D3 Gummies',
        yesQuery: '아이 성장 영양학'
      }
    ],
    ht042_growth: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '종근당건강 아이커 (식약처 인정 HT042 황기추출물 등 복합물 정품 · 30포)',
        titleEn: 'Chong Kun Dang Health I-KER (MFDS Approved HT042 Astragalus Complex · 30 Packets)',
        specKo: '식약처 어린이 키성장 기능성 원료 HT042 정량 + 칼슘·비타민D·아연 배합',
        specEn: 'Official HT042 clinical dosage + Calcium, Vitamin D, and Zinc',
        cpQuery: '종근당건강 아이커 HT042 황기추출물 키성장 30포',
        ihQuery: 'Nature\'s Answer Astragalus Root Fluid Extract Alcohol Free',
        yesQuery: '어린이 키성장 영양 가이드'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '보타니스타 키클래오042 / 퍼니트 키즈텐042 (HT042 황기추출물 젤리·액상형)',
        titleEn: 'Botanista KiCleo 042 (HT042 Astragalus + Red Ginseng Jelly Stick)',
        specKo: '우유에 타 먹기 싫어하는 아이용 포도·사과맛 HT042 스틱 젤리 제형',
        specEn: 'Easy-to-eat grape/apple jelly stick with full HT042 complex + 6-yr red ginseng',
        cpQuery: '보타니스타 키클래오042 황기추출물 HT042 어린이 키성장',
        ihQuery: 'Planetary Herbals Astragalus Extract Full Spectrum',
        yesQuery: '우리 아이 숨은 키 7cm'
      }
    ],
    zinc_colostrum: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '일동후디스 하이키즈 초유 플러스 아연·칼슘 / 차일드라이프 초유 파우더',
        titleEn: 'ChildLife Probiotics with Colostrum Powder / Hoodis Hi-Kids Colostrum Zinc',
        specKo: '뉴질랜드 초유단백(IgG) + 글루콘산·산화아연 + 성장기 필수 아미노산',
        specEn: 'Bovine Colostrum IgG + Bioavailable Zinc + Growth Amino Acids',
        cpQuery: '일동후디스 초유 플러스 어린이 아연 아르기닌 영양제',
        ihQuery: 'ChildLife Probiotics with Colostrum Powder Natural Orange Pineapple',
        yesQuery: '편식 아이 식습관 교정'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '세노비스 키즈 멀티비타민 미네랄 / 네이처스웨이 키즈 삼부카스 아연 구미',
        titleEn: 'Nature\'s Way Sambucus Kids Immune Gummy with Zinc & Vitamin C',
        specKo: '입 짧은 편식 아동의 미각 세포 활성화 및 정상 면역·성장 세포분열 지원',
        specEn: 'Supports taste-bud cell turnover, appetite & IGF-1 synthesis in picky eaters',
        cpQuery: '세노비스 키즈 멀티비타민 미네랄 어린이 아연 츄어블',
        ihQuery: 'Nature\'s Way Sambucus Kids Gummies Standardized Elderberry Zinc',
        yesQuery: '편식 없는 아이 식단'
      }
    ],
    sleep_magnesium_tartcherry: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '노르딕 내추럴스(Nordic Naturals) 마그네슘 젤리 구미 / 솔가 킬레이트 마그네슘',
        titleEn: 'Nordic Naturals Zero Sugar Magnesium Gummies / Solgar Chelated Magnesium',
        specKo: '구연산·글리시네이트 마그네슘 킬레이트 제형 · 저녁 성장통 완화 및 서파수면 유도',
        specEn: 'Highly bioavailable chelated magnesium for nocturnal muscle relaxation & SWS sleep',
        cpQuery: '노르딕내추럴스 마그네슘 구미 어린이 칼슘 마그네슘 비타민D',
        ihQuery: 'Nordic Naturals Zero Sugar Magnesium Gummies Tangerine',
        yesQuery: '수면과 성장호르몬 과학'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '프롬바이오 키즈 어골칼슘 마그네슘 비타민D & 몽모랑시 타트체리 스틱',
        titleEn: 'FromBIO Kids Fish-Bone Calcium Magnesium D3 & Montmorency Tart Cherry',
        specKo: '비소성 어골칼슘 + 마그네슘 + 식물성 멜라토닌 함유 타트체리 농축액',
        specEn: 'Non-calcined fish bone calcium + magnesium + natural tart cherry phytomelatonin',
        cpQuery: '키즈 어골칼슘 마그네슘 비타민D 타트체리 어린이 영양제',
        ihQuery: 'Dynamic Health Certified Organic Tart Cherry Juice Concentrate',
        yesQuery: '아이 수면 교육 가이드'
      }
    ],
    cartilage_calcium: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '종근당건강 아이커 칼슘 / PH365 어린이 비소성 어골·연골칼슘 폴리감마글루탐산',
        titleEn: 'Premium Kids Non-Calcined Fish-Bone & Cartilage Calcium + PGA + Vit D3/K2',
        specKo: '인체 뼈 구성비(Ca:P=2:1) 어골·연골칼슘 + 칼슘 흡수 촉진 폴리감마글루탐산(PGA)',
        specEn: '2:1 Ca:P ratio fish-bone/cartilage calcium + Poly-gamma-glutamic acid (PGA) + D3/K2',
        cpQuery: '어린이 어골칼슘 연골칼슘 폴리감마글루탐산 비타민D3 K2',
        ihQuery: ' Carlson Labs Kid\'s Chewable Calcium Vanilla + Vitamin D3',
        yesQuery: '소아 뼈성장과 칼슘'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '네이처스플러스 애니멀 퍼레이드 키즈 칼슘 마그네슘 츄어블 (바닐라맛 90정)',
        titleEn: 'NaturesPlus Animal Parade Calcium Children\'s Chewable Natural Vanilla (90 Tabs)',
        specKo: '아미노산 킬레이트 칼슘·마그네슘 · 우유 배앓이 없는 무유당 동물 모양 츄어블',
        specEn: 'Aminoate chelated calcium & magnesium · Lactose-free vanilla chewables',
        cpQuery: '네이처스플러스 애니멀퍼레이드 키즈 칼슘 어린이 츄어블',
        ihQuery: 'NaturesPlus Animal Parade Calcium Children\'s Chewable Supplement Vanilla',
        yesQuery: '어린이 영양제 선택법'
      }
    ],
    montessori_pincer_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '러닝리소스(Learning Resources) 정밀 악어핀셋 & 폼폼이 색깔 분류 소근육 키트',
        titleEn: 'Learning Resources Helping Hands Fine Motor Tool Set & Sorting Kit',
        specKo: '미국 작업치료사 추천 1위 · 엄지·검지·중지 삼지집기(Tripod Grasp) 근육 집중 발달',
        specEn: '#1 Occupational therapist pick for tripod grasp & hand-eye coordination',
        cpQuery: '러닝리소스 소근육 교구 핀셋 집게 색깔 분류 세트',
        ihQuery: 'Learning Resources Fine Motor Tool Set Toddler',
        yesQuery: '몬테소리 소근육 놀이'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '멜리사앤더그(Melissa & Doug) 원목 대형 구슬꿰기(Lacing Beads) 정품 세트',
        titleEn: 'Melissa & Doug Primary Lacing Beads Educational Wooden Toy (30 Beads)',
        specKo: '무독성 천연 원목 30피스 · 양손 협응력 및 초기 수세기·패턴 인식 훈련',
        specEn: '30 solid wood beads + 2 laces for bilateral hand coordination & patterning',
        cpQuery: '멜리사앤더그 원목 구슬꿰기 유아 소근육 교구',
        ihQuery: 'Melissa Doug Primary Lacing Beads Wooden Toy',
        yesQuery: '멜리사앤더그 소근육'
      }
    ],
    balance_trampoline_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 유아·어린이 안전 손잡이형 무소음 밴드 실내 점핑 트램폴린',
        titleEn: 'Melkin Kids Silent Elastic-Band Indoor Trampoline with Safety Handlebar',
        specKo: '고탄성 무소음 워빙밴드(층간소음 차단) + 높이조절 안전 핸들바 장착',
        specEn: 'Silent elastic webbing band + adjustable padded safety handlebar',
        cpQuery: '멜킨스포츠 어린이 안전 손잡이 무소음 실내 트램폴린',
        ihQuery: 'Little Tikes Easy Store 3ft Trampoline with Handlebar',
        yesQuery: '유아 신체발달 놀이'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '원더볼즈 / 위플레이 유아 논슬립 하천 돌다리 밸런스 징검다리 6p~11p 세트',
        titleEn: 'Weplay Non-Slip River Stones Tactile Balance Stepping Stones Set',
        specKo: '소뇌 전정기관(균형감각) 및 발바닥 고유수용성감각 자극 실내 징검다리',
        specEn: 'Develops cerebellar vestibular balance and plantar proprioception',
        cpQuery: '유아 밸런스 징검다리 논슬립 실내 균형감각 놀이 세트',
        ihQuery: 'GonGe River Stones Balance Stepping Stones Kids',
        yesQuery: '유아 감각통합 놀이'
      }
    ],
    froebel_gabe_4_5: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '매그나타일즈(Magna-Tiles) / 맥포머스 3D 입체 투명 자석블록 100피스 세트',
        titleEn: 'Magna-Tiles Clear Colors 100-Piece 3D Magnetic Building Set',
        specKo: '만 4~5세 두정엽 3차원 공간지각(Mental Rotation) 및 기하학 도형 감각 완성',
        specEn: 'Develops 3D spatial rotation, geometric symmetry & STEM engineering',
        cpQuery: '맥포머스 매그나타일즈 투명 자석블록 100피스 입체도형 교구',
        ihQuery: 'Magna-Tiles Clear Colors 100 Piece Magnetic Construction Set',
        yesQuery: '가베와 자석블록 활용백과'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '오르다 / 몬테소리 정통 비치우드 원목 가베(은물) 1~10가베 워크북 풀세트',
        titleEn: 'Authentic Beechwood Froebel Gifts (1–10 Gabe) Complete Set with Workbooks',
        specKo: '점·선·면·입체 수리 개념을 손으로 깨우치는 유아 수학교육의 정석',
        specEn: 'Complete point-line-plane-solid mathematical manipulative curriculum',
        cpQuery: '원목 가베 풀세트 1가베 10가베 은물 워크북 세트',
        ihQuery: 'Froebel Gifts Wooden Block Set Educational Math',
        yesQuery: '엄마표 가베 놀이 가이드북'
      }
    ],
    indoor_trampoline_4_5: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 대형 육각 무소음 어린이 실내 점핑 트램폴린 (손잡이형)',
        titleEn: 'Melkin Hexagonal Silent Rebounder Trampoline for Kids Growth Plate',
        specKo: '볼프의 법칙(Wolff\'s Law) 기반 하루 15분 하지 성장판 압전 미세자극',
        specEn: 'Delivers 1.8x bodyweight cyclic micro-loading to femur/tibia growth plates',
        cpQuery: '멜킨스포츠 어린이 무소음 실내 트램폴린 점핑매트 손잡이형',
        ihQuery: 'BCAN 38 Inch Kids Mini Trampoline with Handle',
        yesQuery: '키 크는 점프 운동법'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '스마트게임즈(SmartGames) 캐슬 로지크 / 원목 칠교놀이·소마큐브 도형 퍼즐',
        titleEn: 'SmartGames Castle Logix 3D Wooden Spatial Puzzle & Tangram Set',
        specKo: '단계별 미션 카드를 보고 3D 원목 블록을 조립하는 전두엽·두정엽 사고력 교구',
        specEn: '48 step-by-step 3D spatial logic challenges for ages 4–7',
        cpQuery: '스마트게임즈 캐슬로지크 원목 칠교놀이 소마큐브 퍼즐',
        ihQuery: 'SmartGames Castle Logix Wooden 3D Logic Puzzle',
        yesQuery: '칠교놀이 소마큐브 워크북'
      }
    ],
    gravitrax_stem_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '라벤스부르거 코리아 그래비트랙스(GraviTrax) 코어 스타터 세트 정품',
        titleEn: 'Ravensburger GraviTrax Core Starter Set STEM Marble Run (122 Pieces)',
        specKo: '중력·자석·운동에너지 법칙을 스스로 설계·실험하는 유럽 1위 STEM 과학 교구',
        specEn: '122-piece interactive track system teaching gravity, magnetism & kinetics',
        cpQuery: '라벤스부르거 그래비트랙스 코어 스타터 세트 정품',
        ihQuery: 'Ravensburger GraviTrax Starter Set Marble Run STEM',
        yesQuery: '그래비트랙스 트랙 가이드북'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '스마트게임즈(SmartGames) 아이큐 퍼즐 프로 (IQ Puzzler Pro · 120단계 두뇌퍼즐)',
        titleEn: 'SmartGames IQ Puzzler Pro (120 2D & 3D Spatial Brain Challenges)',
        specKo: '평면 2D부터 입체 3D 피라미드까지 120단계로 집중 지속시간을 늘려주는 휴대용 교구',
        specEn: '120 2D-to-3D pyramid challenges building sustained executive attention',
        cpQuery: '스마트게임즈 아이큐 퍼즐 프로 IQ Puzzler Pro 보드게임',
        ihQuery: 'SmartGames IQ Puzzler Pro 120 Challenges',
        yesQuery: '초등 창의사고력 퍼즐'
      }
    ],
    posture_stand_jumprope_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '위즈독서대 / 독서대통령 높이·각도조절 원목 2단 독서대 (거북목·숨은키 방어)',
        titleEn: 'Wiz ergonomic 2-Tier Height & Angle Adjustable Wooden Book Stand',
        specKo: '눈높이 독서·필기로 경추 디스크 압박(15kg 하중)을 차단해 숨은 키 1.8cm 사수',
        specEn: 'Maintains cervical C-curve and prevents 1.8cm slouching height loss',
        cpQuery: '위즈독서대 높이조절 원목 2단 독서대 거북목 교정',
        ihQuery: 'Wishacc Adjustable Bamboo Book Stand Ergonomic',
        yesQuery: '초등 바른 자세 공부법'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '김수열줄넘기 디지털 카운터 어린이 줄넘기 / 실내 무소음 줄없는 줄넘기',
        titleEn: 'Kim Soo-Yeol Digital Counter Kids Jump Rope (Corded & Cordless)',
        specKo: '실내(무소음 에어볼)·야외 겸용 디지털 횟수 카운터로 매일 500회 점프 습관화',
        specEn: 'Dual corded/cordless ropeless balls with digital counter for daily 500 jumps',
        cpQuery: '김수열줄넘기 디지털 카운터 어린이 줄넘기 실내 줄없는줄넘기',
        ihQuery: 'Digital Counting Jump Rope Cordless Indoor Kids',
        yesQuery: '어린이 음악줄넘기 교본'
      }
    ],
    microscope_timer_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '타임타이머(Time Timer) MOD 무소음 시각 타이머 정품 / 드레텍 스터디 타이머',
        titleEn: 'Time Timer MOD Visual Countdown Timer (Silent Prefrontal Focus Tool)',
        specKo: '남은 시간을 빨간 원판으로 시각화해 전두엽 작업기억과 몰입(Deep Work)을 극대화',
        specEn: 'Visualizes remaining time silently to train prefrontal self-regulation',
        cpQuery: '타임타이머 MOD 무소음 시각 타이머 드레텍 스터디 타이머',
        ihQuery: 'Time Timer MOD Home Edition Visual Countdown Timer',
        yesQuery: '초등 자기주도 시간관리'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '내셔널지오그래픽 / 엠스콥(AmScope) 초등·청소년 고배율 광학 현미경 실험키트',
        titleEn: 'AmScope 120X–1200X Kids Beginner Microscope STEM Science Kit (52-Pc)',
        specKo: '세포·식물 프레파라트 관찰을 통해 과학적 가설-검증 사고력을 키우는 실험 도구',
        specEn: '120X–1200X magnification with prepared slides for hypothesis-driven inquiry',
        cpQuery: '내셔널지오그래픽 어린이 광학 현미경 프레파라트 과학실험 세트',
        ihQuery: 'AmScope 120X-1200X 52-pcs Kids Beginner Microscope STEM Kit',
        yesQuery: '초등 현미경 관찰 도감'
      }
    ],
    deadhang_foamroller_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '코멧 스포츠 / 반석스포츠 무타공 수평계 안전잠금 실내 문틀 철봉 (데드행 바)',
        titleEn: 'Comet Sports No-Screw Safety-Lock Doorway Pull-Up & Dead Hang Bar',
        specKo: '취침 전 30초×3세트 매달리기로 낮 동안 눌린 척추 추간판 디스크 +1.8cm 감압 복원',
        specEn: '30s x 3 passive dead hangs before bed restore +1.8cm of compressed disc height',
        cpQuery: '코멧 스포츠 무타공 안전잠금 문틀 철봉 실내 턱걸이봉',
        ihQuery: 'Ally Peaks Pull Up Bar Doorway No Screw Safety Lock',
        yesQuery: '척추 교정 스트레칭 가이드'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '멜킨스포츠 척추 신전 고밀도 EPP 폼롤러 (90cm 원형 · 거북목/굽은등 교정)',
        titleEn: 'Melkin High-Density EPP Foam Roller (90cm Full Spine Thoracic Extension)',
        specKo: '굽은 흉추를 펴고 성장판 주변 근막 긴장을 이완시키는 90cm 전신 폼롤러',
        specEn: '90cm high-density EPP roller for thoracic extension & myofascial release',
        cpQuery: '멜킨스포츠 고밀도 EPP 폼롤러 90cm 체형교정 스트레칭',
        ihQuery: 'TriggerPoint GRID Foam Roller Thoracic Spine Mobility',
        yesQuery: '폼롤러 스트레칭 백과'
      }
    ],
    workbook_scissors_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '기탄교육 기탄 가위오리기·종이접기 1~4집 세트 + 유아 안전가위 패키지',
        titleEn: 'Gitan Step-by-Step Scissor Cutting & Origami Workbooks Set (Ages 2–4)',
        specKo: '직선→곡선→도형 오리기 단계별 구성으로 손끝 소근육과 눈-손 협응 완성',
        specEn: 'Progressive straight-to-curve cutting exercises for intrinsic hand muscles',
        cpQuery: '기탄 가위오리기 종이접기 세트 유아 안전가위 소근육 워크북',
        ihQuery: 'Kumon First Steps Workbooks Let\'s Cut Paper Sticker',
        yesQuery: '기탄 가위오리기 종이접기'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '어스본(Usborne) 코리아 처음 시작하는 스티커북 & 선긋기 두뇌 워크북',
        titleEn: 'Usborne First Sticker Book & Wipe-Clean Pen Control Activity Book',
        specKo: '10분 미만 단기 집중 유아도 스스로 몰입하는 색감·주제별 스티커 & 운필력 훈련',
        specEn: 'High-engagement sticker & pen-control pages for toddler attention span',
        cpQuery: '어스본 코리아 처음 시작하는 스티커북 유아 선긋기 워크북',
        ihQuery: 'Usborne First Sticker Book Wipe Clean Pen Control',
        yesQuery: '어스본 처음 시작하는 스티커북'
      }
    ],
    tactile_flap_book_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '어스본(Usborne) 코리아 요리조리 열어보는 플랩북 & 간질간질 촉감책 시리즈',
        titleEn: 'Usborne Look Inside Lift-the-Flap & That\'s Not My... Touchy-Feely Board Books',
        specKo: '손끝으로 플랩을 열고 다양한 재질을 만지며 브로카 언어 영역과 호기심 자극',
        specEn: 'Tactile textures and interactive flaps stimulate Broca\'s language center',
        cpQuery: '어스본 코리아 요리조리 열어보는 플랩북 촉감책 보드북',
        ihQuery: 'Usborne Look Inside Board Book Lift the Flap',
        yesQuery: '어스본 요리조리 열어보는 플랩북'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '시공주니어 네버랜드 세계걸작 잘 자요 달님 (Goodnight Moon) 수면 의식 그림책',
        titleEn: 'Goodnight Moon (Margaret Wise Brown) Bedtime Sleep Ritual Picture Book',
        specKo: '전 세계 소아과 권장 1위 수면 그림책 · 밤 9시 30분 규칙적인 입면 루틴 형성',
        specEn: 'Clinically proven bedtime ritual story for calm 9:30 PM slow-wave sleep onset',
        cpQuery: '시공주니어 잘 자요 달님 유아 수면 동화 그림책',
        ihQuery: 'Goodnight Moon Margaret Wise Brown Board Book',
        yesQuery: '잘 자요 달님 시공주니어'
      }
    ],
    spatial_pattern_book_4_5: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '길벗스쿨 기적의 유아 수학 / 소마셈 K단계 도형·공간지각 창의사고력 워크북',
        titleEn: 'Gilbut Miracle Preschool Math & Spatial Geometry Logic Workbook',
        specKo: '만 4~5세 두정엽 공간 회전·대칭·패턴 추론을 체계적으로 다지는 베스트셀러',
        specEn: 'Structured spatial rotation, symmetry, and number sense curriculum',
        cpQuery: '길벗스쿨 기적의 유아 수학 도형 공간지각 창의사고력 워크북',
        ihQuery: 'Singapore Math Kindergarten Spatial Reasoning Workbook',
        yesQuery: '길벗스쿨 기적의 유아 수학'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '매쓰타임(MathTime) 원목 칠교놀이·펜토미노 자석북 & 창의도형 워크북 세트',
        titleEn: 'MathTime Magnetic Tangram & Pentomino Spatial Puzzle Book Set',
        specKo: '워크북 위에 자석 도형을 직접 맞히며 15~20분 깊게 몰입하는 교구형 도서',
        specEn: 'Hands-on magnetic tangram workbook for sustained 20-minute spatial focus',
        cpQuery: '매쓰타임 자석 칠교놀이 펜토미노 도형 워크북 세트',
        ihQuery: 'Magnetic Tangram Travel Puzzle Book Kids Geometry',
        yesQuery: '칠교놀이 창의도형 워크북'
      }
    ],
    body_growth_popup_4_5: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '어스본(Usborne) 코리아 요리조리 열어보는 우리 몸 (인체·뼈·성장 과학 플랩북)',
        titleEn: 'Usborne Look Inside Your Body (Interactive Bones, Growth & Nutrition Flap Book)',
        specKo: '아이 스스로 왜 골고루 먹고 일찍 자야 뼈가 자라는지 눈으로 깨닫는 플랩북 1위',
        specEn: 'Over 100 flaps showing how bones grow, why sleep matters, and how digestion works',
        cpQuery: '어스본 코리아 요리조리 열어보는 우리 몸 플랩북',
        ihQuery: 'Usborne Look Inside Your Body Lift the Flap Book',
        yesQuery: '어스본 요리조리 열어보는 우리 몸'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '비룡소 신기한 스쿨버스 우리 몸 탐험 / 바른 식습관·수면 과학 그림책 세트',
        titleEn: 'The Magic School Bus Inside the Human Body (Scholastic Science Picture Book)',
        specKo: '스토리텔링으로 소화·흡수·뼈 성장을 재미있게 이해시키는 필독 과학 그림책',
        specEn: 'Engaging scientific storytelling on bone matrix, blood, and nutrient absorption',
        cpQuery: '비룡소 신기한 스쿨버스 우리 몸 과학 그림책',
        ihQuery: 'The Magic School Bus Inside the Human Body Book',
        yesQuery: '신기한 스쿨버스 우리 몸'
      }
    ],
    havruta_workbook_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '길벗스쿨 기적의 독서 논술 / 초등 하브루타 질문독서 생각열기 워크북',
        titleEn: 'Gilbut Miracle Reading Comprehension & Havruta Inquiry Workbook (Grades 1–3)',
        specKo: '관찰→가설→적용 3단계 질문으로 초등 전두엽 인과추론과 어휘력을 키우는 교재',
        specEn: '3-step Havruta inquiry prompts building prefrontal reasoning & vocabulary',
        cpQuery: '길벗스쿨 기적의 독서 논술 초등 하브루타 질문독서 워크북',
        ihQuery: 'Evan-Moor Daily Higher-Order Thinking Workbook Grade 2',
        yesQuery: '기적의 독서 논술 길벗스쿨'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '천재교육 하루 한장 독해 / 초등 비주얼 씽킹 문해력·어휘력 마인드맵 워크북',
        titleEn: 'Chunjae 1-Page-a-Day Reading Comprehension & Visual Thinking Mindmap Book',
        specKo: '하루 15분 한 장씩 읽고 핵심 내용을 구조화하여 집중 지속시간을 늘리는 베스트셀러',
        specEn: '15-minute daily structured reading habit builder with visual mindmaps',
        cpQuery: '천재교육 하루 한장 독해 초등 어휘력 문해력 워크북',
        ihQuery: 'Scholastic Success With Reading Comprehension Grade 2',
        yesQuery: '천재교육 하루 한장 독해'
      }
    ],
    museum_science_history_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '주니어김영사 박물관이 살아있다 / 국립중앙박물관 어린이 역사·유물 탐구 도감',
        titleEn: 'Junior Gimmyoung National Museum Korean History & Artifact Encyclopedia',
        specKo: '주말 박물관·궁궐 나들이 전후에 읽으면 현장 관람 학습 효과가 3배 높아지는 필독서',
        specEn: 'Pre/post museum visit companion guide tripling long-term historical memory',
        cpQuery: '주니어김영사 박물관 어린이 역사 유물 도감 한국사 그림책',
        ihQuery: 'DK Smithsonian Children\'s Encyclopedia History Science',
        yesQuery: '어린이 박물관 역사 도감'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '사파리 출판사 내 손안의 박물관 / 어스본 초등 과학관 원리 탐구 대백과',
        titleEn: 'Usborne Science Encyclopedia & Safari Museum in My Hand Visual Guide',
        specKo: '과학관 전시물(힘·운동·우주·인체)의 핵심 원리를 한눈에 보여주는 시각 대백과',
        specEn: 'Richly illustrated visual science encyclopedia aligned with museum exhibits',
        cpQuery: '어스본 초등 과학 대백과 내 손안의 박물관 도감',
        ihQuery: 'Usborne Science Encyclopedia QR Links Illustrated',
        yesQuery: '어스본 초등 과학 대백과'
      }
    ],
    metacognition_workbook_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '디딤돌 초등 고학년 비문학 독해력 & 코넬식 메타인지 백지복습 노트 세트',
        titleEn: 'Didimdol Non-Fiction Reading Comprehension & Cornell Metacognition Recall Note',
        specKo: '배외측 전전두엽(DLPFC) 피크기인 만 9세+ 아동의 메타인지(인출 훈련) 완성 교재',
        specEn: 'Trains active recall and non-fiction structural analysis for ages 9–15',
        cpQuery: '디딤돌 초등 독해력 고학년 비문학 코넬식 백지복습 노트',
        ihQuery: 'Critical Thinking Company Reading Detective Nonfiction',
        yesQuery: '디딤돌 초등 독해력 비문학'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: ' EBS 0.1%의 비밀 메타인지 공부법 & 초등·중등 자기주도 학습 플래너',
        titleEn: 'EBS Top 0.1% Secret Metacognition Study Method & Self-Directed Planner',
        specKo: '내가 아는 것과 모르는 것을 스스로 점검하는 상위 0.1% 메타인지 학습 전략서',
        specEn: 'Evidence-based guide to self-testing, spaced repetition, and study planning',
        cpQuery: '메타인지 공부법 자기주도학습 플래너 초등 중등 필독서',
        ihQuery: 'Make It Stick The Science of Successful Learning Book',
        yesQuery: '메타인지 공부법 자기주도학습'
      }
    ],
    brain_growth_science_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '십대를 위한 뇌과학 공부법 / 뇌를 깨우는 아침운동·수면 호르몬의 비밀',
        titleEn: 'Neuroscience Study Guide for Teens: Sleep, Dopamine & Prefrontal Focus',
        specKo: '왜 스마트폰을 줄이고 밤 10시 30분 전에 자야 키와 성적이 함께 오르는지 과학적 설득',
        specEn: 'Explains SWS growth hormone, dopamine detox, and myelination to teens',
        cpQuery: '십대를 위한 뇌과학 공부법 청소년 자기주도학습 교양서',
        ihQuery: 'The Teenage Brain A Neuroscientist\'s Survival Guide',
        yesQuery: '십대를 위한 뇌과학 공부법'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '정주영의 키 크는 스트레칭 & 어린이·청소년 바른 체형·성장판 과학 가이드북',
        titleEn: 'Pediatric Height Growth & Spinal Alignment Science Guidebook for Youth',
        specKo: '아이 스스로 따라 할 수 있는 저녁 10분 척추 감압 스트레칭과 성장판 영양 가이드',
        specEn: 'Illustrated 10-minute nightly spinal decompression and growth plate guide',
        cpQuery: '어린이 청소년 키크는 스트레칭 바른 자세 성장 가이드북',
        ihQuery: 'Stretching Anatomy Posture Correction Guide Book',
        yesQuery: '키 크는 스트레칭 성장판'
      }
    ]
  };

  function getCuratedSubProducts(itemId, affConfig = {}) {
    const rawList = CURATED_SPECIFIC_PRODUCTS_DB[itemId] || CURATED_SPECIFIC_PRODUCTS_DB.ht042_growth;
    return rawList.map((sub) => {
      const urls = buildPinpointUrls(sub.cpQuery, sub.ihQuery, sub.yesQuery, affConfig);
      return Object.assign({}, sub, urls);
    });
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

    const traitSleepList = Array.isArray(profile.traitSleepList) ? profile.traitSleepList : [profile.traitSleep || 'late_bedtime'];
    const traitDietList = Array.isArray(profile.traitDietList) ? profile.traitDietList : [profile.traitDiet || 'small_appetite'];
    const traitPostureList = Array.isArray(profile.traitPostureList) ? profile.traitPostureList : [profile.traitPosture || 'turtle_slouch'];

    // Determine if height is below median or velocity needs catch-up
    const isPicky = habits.includes('picky_eater') || traitDietList.includes('meat_veggie_picky') || traitDietList.includes('small_appetite') || traitDietList.includes('slow_hold_mouth');
    const isLateSleep = habits.includes('late_sleep') || habits.includes('night_carbs') || traitSleepList.includes('late_bedtime') || traitSleepList.includes('toss_mouth') || traitSleepList.includes('wake_middle');
    const isPoorPosture = habits.includes('poor_posture') || traitPostureList.includes('turtle_slouch') || traitPostureList.includes('leg_cross_pelvis');
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

    const attachCurated = (arr) => arr.map((item) => {
      const subProducts = getCuratedSubProducts(item.id, affConfig);
      const topPick = subProducts[0] || item;
      return Object.assign({}, item, {
        coupangUrl: topPick.coupangUrl || item.coupangUrl,
        iherbUrl: topPick.iherbUrl || item.iherbUrl,
        yes24Url: topPick.yes24Url || item.yes24Url,
        naverUrl: topPick.naverUrl || item.naverUrl,
        curatedProducts: subProducts
      });
    });

    return {
      supplements: attachCurated(supplements),
      toys: attachCurated(toys),
      books: attachCurated(books),
      lifecycleRoadmap: getSequentialLifecycleRoadmap(ageYears),
      autoStage: autoDetectGrowthStage(ageMonths, profile.gender, recent6m)
    };
  }

  /**
   * Helper to summarize child-specific trait reasons concisely
   */
  function getTraitSpecificNote(profile = {}, category = 'supplement', isEn = false) {
    const dietList = Array.isArray(profile.traitDietList) && profile.traitDietList.length ? profile.traitDietList : [profile.traitDiet || 'small_appetite'];
    const sleepList = Array.isArray(profile.traitSleepList) && profile.traitSleepList.length ? profile.traitSleepList : [profile.traitSleep || 'late_bedtime'];
    const postureList = Array.isArray(profile.traitPostureList) && profile.traitPostureList.length ? profile.traitPostureList : [profile.traitPosture || 'turtle_slouch'];
    const tempList = Array.isArray(profile.traitTemperamentList) && profile.traitTemperamentList.length ? profile.traitTemperamentList : [profile.traitTemperament || 'explorer'];
    const focus = profile.traitFocusSpan || '15_20m';

    if (category === 'supplement') {
      if (dietList.includes('dairy_sensitive') || dietList.includes('weak_stomach')) {
        return isEn
          ? 'Tailored for dairy-sensitive digestion: non-lactose calcium citrate & cartilage matrix.'
          : '[우유·유제품 배앓이·장 민감 맞춤] 유당 부담 없이 흡수되는 구연산·연골칼슘 및 장 면역 배합이 필요합니다.';
      }
      if (dietList.includes('meat_veggie_picky') || dietList.includes('fast_carb_sweet')) {
        return isEn
          ? 'Tailored for meat/veggie picky eaters: zinc, colostrum protein & amino acid support.'
          : '[고기·채소 편식·단맛 선호 맞춤] 부족한 단백질 기질과 미각 세포를 깨우는 아연·초유·아르기닌 보충이 핵심입니다.';
      }
      if (sleepList.includes('toss_mouth') || sleepList.includes('late_bedtime') || sleepList.includes('wake_middle') || postureList.includes('growing_pains')) {
        return isEn
          ? 'Tailored for late/restless sleep & growing pains: chelated magnesium & cartilage calcium.'
          : '[얕은 수면·늦은 취침·성장통 맞춤] 밤 10시 깊은 서파수면 유도 및 저녁 다리 피로 완화를 돕는 배합입니다.';
      }
      return isEn
        ? 'Tailored for small appetite: high-density HT042 & bioavailable calcium.'
        : '[입 짧은 소식형 체질 맞춤] 적은 양으로도 성장판 연골 증식(IGF-1)을 돕는 고밀도 원료가 필요합니다.';
    }

    if (category === 'toy') {
      if (tempList.includes('builder')) {
        return isEn
          ? 'Matched to Focused Builder temperament: 3D spatial block construction & posture tools.'
          : '[손끝 조립 몰입형 기질 맞춤] 아이가 좋아하는 입체 조립 교구와 앉은 자세 교정 도구를 결합했습니다.';
      }
      if (tempList.includes('questioner') || tempList.includes('competitive_game')) {
        return isEn
          ? 'Matched to Verbal Questioner temperament: cause-and-effect science kits & spinal decompression.'
          : '[질문·언어 사고·퀴즈형 기질 맞춤] 원리를 실험하며 대화할 수 있는 과학 탐구 교구와 척추 감압 기구입니다.';
      }
      if (tempList.includes('cautious') || tempList.includes('art_story')) {
        return isEn
          ? 'Matched to Careful Observer temperament: step-by-step precision puzzles & safe indoor exercise.'
          : '[섬세·감성 관찰형 맞춤] 실패 부담 없이 단계별로 완성하는 정밀 교구와 안전한 실내 점핑 기구입니다.';
      }
      return isEn
        ? 'Matched to Active Explorer temperament: hands-on physical play & epiphyseal loading.'
        : '[활동·탐구형 기질 맞춤] 몸으로 직접 조작하고 뛰면서 성장판과 전두엽을 동시에 자극하는 도구입니다.';
    }

    // book
    if (focus === 'under_10m') {
      return isEn
        ? 'Matched to <10m focus span: short-breath interactive pop-up/activity books for instant engagement.'
        : '[10분 미만 단기 집중 특성 맞춤] 긴 글 대신 손으로 조작하고 짧게 성취감을 느끼는 워크북·팝업북입니다.';
    }
    if (focus === '30m_plus') {
      return isEn
        ? 'Matched to 30m+ deep focus: advanced metacognition & scientific inquiry reading.'
        : '[30분+ 심화 몰입 특성 맞춤] 깊이 있는 원리 탐구와 백지복습·하브루타 확장이 가능한 심화 도서입니다.';
    }
    return isEn
      ? 'Matched to 15–20m focus span: structured 1-chapter-per-day inquiry workbooks.'
      : '[15~20분 집중 특성 맞춤] 하루 한 챕터씩 질문하고 해결하며 집중 시간을 30분으로 늘려주는 도서입니다.';
  }

  /**
   * 5. Renders the Clean, Aligned Lifecycle Roadmap + Neutral "Need & Where to Find" Tool Guide
   */
  function renderPinpointAndLifecycleSection(profile = {}, affConfig = {}) {
    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const data = curatePinpointItems(profile, affConfig);
    const ageMonths = Number(profile.ageMonths) || 120;
    const exactMonths = Number(profile.exactMonths || ageMonths).toFixed(1);
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const genderKo = profile.gender === 'girl' ? '여아' : '남아';

    const suppTraitNote = getTraitSpecificNote(profile, 'supplement', isEn);
    const toyTraitNote = getTraitSpecificNote(profile, 'toy', isEn);
    const bookTraitNote = getTraitSpecificNote(profile, 'book', isEn);

    return `
      <!-- AGE LIFECYCLE TIMELINE (Compact 4-Column Grid) -->
      <div id="child-lifecycle-roadmap-section" style="margin-top: 1.35rem; padding-top: 1.25rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          <h3 style="font-size: 1.05rem; font-weight: 900; color: #FFFFFF; margin: 0;">
            🗓️ ${isEn
              ? `Year-by-Year Focus (Age ${ageYears} → Age ${ageYears + 3})`
              : `앞으로 4년간 나이별 핵심 집중 포인트 (만 ${ageYears}세 → 만 ${ageYears + 3}세)`}
          </h3>
          <span style="background: rgba(59, 130, 246, 0.14); color: #60A5FA; font-size: 0.74rem; font-weight: 800; padding: 0.24rem 0.65rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.3);">
            ${isEn ? data.autoStage.stageNameEn : data.autoStage.stageNameKo}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; align-items: stretch;">
          ${data.lifecycleRoadmap.map((step, idx) => `
            <div class="lifecycle-age-card" data-age="${step.age}" style="background: ${step.isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)'}; border: ${step.isCurrent ? '1.5px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)'}; border-radius: 14px; padding: 0.9rem; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <span style="font-size: 0.74rem; font-weight: 900; color: ${step.isCurrent ? '#60A5FA' : '#94A3B8'};">
                    ${isEn ? (idx === 0 ? `Now · Age ${step.age}` : `+${idx} Yr · Age ${step.age}`) : (idx === 0 ? `현재 · 만 ${step.age}세` : `+${idx}년 뒤 · 만 ${step.age}세`)}
                  </span>
                  <span style="font-size: 0.72rem; font-weight: 800; color: #34D399;">${step.expectedVelocity}</span>
                </div>
                <div style="font-size: 0.78rem; color: #E2E8F0; line-height: 1.45; margin-bottom: 0.35rem;">
                  <strong style="color: #60A5FA;">📏 ${isEn ? 'Body:' : '신체:'}</strong> ${step.physicalFocus.split('·')[0].trim()}
                </div>
                <div style="font-size: 0.78rem; color: #E2E8F0; line-height: 1.45; margin-bottom: 0.35rem;">
                  <strong style="color: #C4B5FD;">🧠 ${isEn ? 'Study:' : '학습:'}</strong> ${step.brainFocus.split('·')[0].trim()}
                </div>
              </div>
              <div style="font-size: 0.73rem; color: #6EE7B7; font-weight: 700; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 0.38rem;">
                🎁 ${step.mustHaveSummary}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- STEP 04: What You Need to Sustain the Routine (Neutral Guidance: Buy Anywhere or Use Reference Links) -->
      <div id="pinpoint-custom-prescription-section" style="margin-top: 1.4rem; padding-top: 1.3rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 0.95rem 1.1rem; margin-bottom: 1rem; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.3rem;">
            <span style="font-size: 0.75rem; font-weight: 900; color: #34D399; letter-spacing: 0.04em;">
              STEP 04 · ${isEn ? 'WHAT YOU NEED FOR CONSISTENT PRACTICE' : '꾸준히 실천하기 위해 필요한 맞춤 도구'}
            </span>
            <span style="font-size: 0.73rem; color: #94A3B8; font-weight: 700;">
              ${isEn ? 'Self-Search Keyword or Direct Reference' : '직접 찾아서 구매하셔도 되고, 아래 링크를 참고하셔도 됩니다'}
            </span>
          </div>
          <h3 style="font-size: 1.08rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.3rem 0;">
            ${isEn
              ? 'To Practice Consistently, Prepare These 3 Trait-Matched Essentials'
              : `앞선 루틴을 꾸준히 실천하려면 아래 3가지 맞춤 도구가 필요합니다`}
          </h3>
          <p style="font-size: 0.8rem; color: #CBD5E1; margin: 0; line-height: 1.5;">
            ${isEn
              ? 'If you already have similar items at home, use them as is. You can search the recommended keywords yourself on any store, or click the reference links below for convenience.'
              : '집에 비슷한 제품이 있다면 그대로 활용하세요. <strong>제시된 핵심 키워드로 직접 검색해서 구매하셔도 되고, 일일이 찾기 번거로우시다면 아래 바로가기를 통해 구입하셔도 됩니다.</strong>'}
          </p>
        </div>

        <div class="pinpoint-3col-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.95rem; align-items: stretch;">
          
          <!-- Column 1: Required Supplements -->
          <div class="pinpoint-category-box" id="pinpoint-supplements-box" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
            <div>
              <h4 style="font-size: 1rem; font-weight: 900; color: #60A5FA; margin: 0 0 0.35rem 0;">
                💊 ${isEn ? '1. Curated Nutritional Supplements' : '1. 맞춤 영양제 (엄선 세부 상품)'}
              </h4>
              <p style="font-size: 0.82rem; color: #93C5FD; margin: 0 0 0.75rem 0; line-height: 1.48;">
                ${suppTraitNote}
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${data.supplements.map((item) => `
                  <div class="pinpoint-item-card" data-item-id="${item.id}" style="background: rgba(15, 23, 42, 0.82); border: 1px solid rgba(255, 255, 255, 0.11); border-radius: 14px; padding: 0.95rem;">
                    <div style="font-size: 0.92rem; font-weight: 900; color: #FFFFFF; line-height: 1.4; margin-bottom: 0.25rem;">
                      ${item.name}
                    </div>
                    <div style="font-size: 0.78rem; color: #34D399; font-weight: 700; margin-bottom: 0.4rem; line-height: 1.4;">
                      ✓ ${isEn ? 'Key Spec:' : '성분 기준:'} ${item.activeSpec}
                    </div>
                    <div style="font-size: 0.76rem; color: #CBD5E1; background: rgba(255,255,255,0.05); padding: 0.38rem 0.6rem; border-radius: 8px; margin-bottom: 0.65rem;">
                      🔎 ${isEn ? 'Search Keyword:' : '직접 검색어:'} <strong style="color:#FFFFFF;">${item.coupangQuery}</strong>
                    </div>

                    <!-- Curated Specific Sub-Products (엄선 세부 상품 TOP 2 — Mobile Thumb-Friendly Buttons) -->
                    <div class="curated-subproducts-list" style="display: flex; flex-direction: column; gap: 0.6rem; border-top: 1px dashed rgba(255,255,255,0.14); padding-top: 0.65rem;">
                      <div style="font-size: 0.76rem; font-weight: 900; color: #60A5FA;">
                        ✨ ${isEn ? 'Tap a Curated Product to View Directly:' : '엄선 세부 상품 터치 시 바로 이동:'}
                      </div>
                      ${(item.curatedProducts || []).map((sub) => `
                        <div class="curated-subproduct-row" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(59,130,246,0.28); border-radius: 12px; padding: 0.7rem;">
                          <div style="font-size: 0.84rem; font-weight: 800; color: #FFFFFF; line-height: 1.42; margin-bottom: 0.2rem;">
                            <span style="color: #FBBF24; margin-right: 0.3rem;">${isEn ? sub.rankEn : sub.rankKo}</span>${isEn ? sub.titleEn : sub.titleKo}
                          </div>
                          <div style="font-size: 0.75rem; color: #CBD5E1; line-height: 1.4; margin-bottom: 0.55rem;">
                            • ${isEn ? sub.specEn : sub.specKo}
                          </div>
                          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                            <a href="${sub.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn" data-merchant="coupang" style="display: flex; width: 100%; box-sizing: border-box; min-height: 44px; align-items: center; justify-content: center; background: #FFFFFF; color: #0F172A; font-size: 0.84rem; font-weight: 900; padding: 0.55rem 0.75rem; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                              📦 ${isEn ? 'View Exact Item on Coupang ↗' : '쿠팡에서 이 상품 바로 보기 ↗'}
                            </a>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                              <a href="${sub.iherbUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn-sub" data-merchant="iherb" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.45); color: #34D399; font-size: 0.78rem; font-weight: 800; padding: 0.45rem 0.5rem; border-radius: 9px; text-decoration: none;">
                                🌿 ${isEn ? 'iHerb Direct ↗' : 'iHerb 직구 보기 ↗'}
                              </a>
                              <a href="${sub.naverUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn-sub" data-merchant="naver" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.18); border: 1px solid rgba(59, 130, 246, 0.45); color: #93C5FD; font-size: 0.78rem; font-weight: 800; padding: 0.45rem 0.5rem; border-radius: 9px; text-decoration: none;">
                                🛍️ ${isEn ? 'Naver Store ↗' : '네이버 브랜드관 ↗'}
                              </a>
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Column 2: Required Play & Posture Tools -->
          <div class="pinpoint-category-box" id="pinpoint-toys-box" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
            <div>
              <h4 style="font-size: 1rem; font-weight: 900; color: #34D399; margin: 0 0 0.35rem 0;">
                🧩 ${isEn ? '2. Curated Posture & Cognitive Tools' : '2. 맞춤 교구 & 운동기구 (엄선 세부 상품)'}
              </h4>
              <p style="font-size: 0.82rem; color: #6EE7B7; margin: 0 0 0.75rem 0; line-height: 1.48;">
                ${toyTraitNote}
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${data.toys.map((item) => `
                  <div class="pinpoint-item-card" data-item-id="${item.id}" style="background: rgba(15, 23, 42, 0.82); border: 1px solid rgba(255, 255, 255, 0.11); border-radius: 14px; padding: 0.95rem;">
                    <div style="font-size: 0.92rem; font-weight: 900; color: #FFFFFF; line-height: 1.4; margin-bottom: 0.25rem;">
                      ${item.name}
                    </div>
                    <div style="font-size: 0.78rem; color: #60A5FA; font-weight: 700; margin-bottom: 0.4rem; line-height: 1.4;">
                      ✓ ${isEn ? 'Purpose:' : '활용 목적:'} ${item.activeSpec}
                    </div>
                    <div style="font-size: 0.76rem; color: #CBD5E1; background: rgba(255,255,255,0.05); padding: 0.38rem 0.6rem; border-radius: 8px; margin-bottom: 0.65rem;">
                      🔎 ${isEn ? 'Search Keyword:' : '직접 검색어:'} <strong style="color:#FFFFFF;">${item.coupangQuery}</strong>
                    </div>

                    <!-- Curated Specific Sub-Products (엄선 세부 상품 TOP 2 — Mobile Thumb-Friendly Buttons) -->
                    <div class="curated-subproducts-list" style="display: flex; flex-direction: column; gap: 0.6rem; border-top: 1px dashed rgba(255,255,255,0.14); padding-top: 0.65rem;">
                      <div style="font-size: 0.76rem; font-weight: 900; color: #34D399;">
                        ✨ ${isEn ? 'Tap a Curated Product to View Directly:' : '엄선 세부 상품 터치 시 바로 이동:'}
                      </div>
                      ${(item.curatedProducts || []).map((sub) => `
                        <div class="curated-subproduct-row" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(16,185,129,0.28); border-radius: 12px; padding: 0.7rem;">
                          <div style="font-size: 0.84rem; font-weight: 800; color: #FFFFFF; line-height: 1.42; margin-bottom: 0.2rem;">
                            <span style="color: #FBBF24; margin-right: 0.3rem;">${isEn ? sub.rankEn : sub.rankKo}</span>${isEn ? sub.titleEn : sub.titleKo}
                          </div>
                          <div style="font-size: 0.75rem; color: #CBD5E1; line-height: 1.4; margin-bottom: 0.55rem;">
                            • ${isEn ? sub.specEn : sub.specKo}
                          </div>
                          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                            <a href="${sub.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn" data-merchant="coupang" style="display: flex; width: 100%; box-sizing: border-box; min-height: 44px; align-items: center; justify-content: center; background: #FFFFFF; color: #0F172A; font-size: 0.84rem; font-weight: 900; padding: 0.55rem 0.75rem; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                              📦 ${isEn ? 'View Exact Item on Coupang ↗' : '쿠팡에서 이 상품 바로 보기 ↗'}
                            </a>
                            <a href="${sub.naverUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn-sub" data-merchant="naver" style="display: flex; width: 100%; box-sizing: border-box; min-height: 40px; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.45); color: #34D399; font-size: 0.78rem; font-weight: 800; padding: 0.45rem 0.5rem; border-radius: 9px; text-decoration: none;">
                              🛍️ ${isEn ? 'View on Naver Brand Store ↗' : '네이버 브랜드/공식몰에서 보기 ↗'}
                            </a>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Column 3: Required Books & Workbooks -->
          <div class="pinpoint-category-box" id="pinpoint-books-box" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
            <div>
              <h4 style="font-size: 1rem; font-weight: 900; color: #C4B5FD; margin: 0 0 0.35rem 0;">
                📚 ${isEn ? '3. Curated Books & Workbooks' : '3. 맞춤 필독 도서 (엄선 세부 도서)'}
              </h4>
              <p style="font-size: 0.82rem; color: #DDD6FE; margin: 0 0 0.75rem 0; line-height: 1.48;">
                ${bookTraitNote}
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${data.books.map((item) => `
                  <div class="pinpoint-item-card" data-item-id="${item.id}" style="background: rgba(15, 23, 42, 0.82); border: 1px solid rgba(255, 255, 255, 0.11); border-radius: 14px; padding: 0.95rem;">
                    <div style="font-size: 0.92rem; font-weight: 900; color: #FFFFFF; line-height: 1.4; margin-bottom: 0.25rem;">
                      ${item.name}
                    </div>
                    <div style="font-size: 0.78rem; color: #C4B5FD; font-weight: 700; margin-bottom: 0.4rem; line-height: 1.4;">
                      ✓ ${isEn ? 'Focus:' : '핵심 훈련:'} ${item.activeSpec}
                    </div>
                    <div style="font-size: 0.76rem; color: #CBD5E1; background: rgba(255,255,255,0.05); padding: 0.38rem 0.6rem; border-radius: 8px; margin-bottom: 0.65rem;">
                      🔎 ${isEn ? 'Search Keyword:' : '직접 검색어:'} <strong style="color:#FFFFFF;">${item.coupangQuery}</strong>
                    </div>

                    <!-- Curated Specific Sub-Products (엄선 세부 도서 TOP 2 — Mobile Thumb-Friendly Buttons) -->
                    <div class="curated-subproducts-list" style="display: flex; flex-direction: column; gap: 0.6rem; border-top: 1px dashed rgba(255,255,255,0.14); padding-top: 0.65rem;">
                      <div style="font-size: 0.76rem; font-weight: 900; color: #C4B5FD;">
                        ✨ ${isEn ? 'Tap a Curated Book to View Directly:' : '엄선 세부 도서 터치 시 바로 이동:'}
                      </div>
                      ${(item.curatedProducts || []).map((sub) => `
                        <div class="curated-subproduct-row" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(139,92,246,0.28); border-radius: 12px; padding: 0.7rem;">
                          <div style="font-size: 0.84rem; font-weight: 800; color: #FFFFFF; line-height: 1.42; margin-bottom: 0.2rem;">
                            <span style="color: #FBBF24; margin-right: 0.3rem;">${isEn ? sub.rankEn : sub.rankKo}</span>${isEn ? sub.titleEn : sub.titleKo}
                          </div>
                          <div style="font-size: 0.75rem; color: #CBD5E1; line-height: 1.4; margin-bottom: 0.55rem;">
                            • ${isEn ? sub.specEn : sub.specKo}
                          </div>
                          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                            <a href="${sub.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn" data-merchant="coupang" style="display: flex; width: 100%; box-sizing: border-box; min-height: 44px; align-items: center; justify-content: center; background: #FFFFFF; color: #0F172A; font-size: 0.84rem; font-weight: 900; padding: 0.55rem 0.75rem; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                              📦 ${isEn ? 'View Exact Book on Coupang ↗' : '쿠팡 로켓배송으로 이 책 보기 ↗'}
                            </a>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                              <a href="${sub.yes24Url}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn-sub" data-merchant="linkprice" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.45); color: #DDD6FE; font-size: 0.78rem; font-weight: 800; padding: 0.45rem 0.5rem; border-radius: 9px; text-decoration: none;">
                                📚 ${isEn ? 'YES24 Book ↗' : '예스24 도서 보기 ↗'}
                              </a>
                              <a href="${sub.naverUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn-sub" data-merchant="naver" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.18); border: 1px solid rgba(59, 130, 246, 0.45); color: #93C5FD; font-size: 0.78rem; font-weight: 800; padding: 0.45rem 0.5rem; border-radius: 9px; text-decoration: none;">
                                🛍️ ${isEn ? 'Naver Book ↗' : '네이버 도서 보기 ↗'}
                              </a>
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
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
