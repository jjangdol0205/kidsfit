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
    iherb: 'IPZ1547',
    amazon: 'kidfit-20',
    tenping: '010-****-2370',
    tenpingUrl: 'https://iryan.kr/t8g8qxgcc2',
    adpickAffId: '4d31d3',
    adpickApiUrl: 'https://adpick.co.kr/apis/offers.php?affid=4d31d3&os=&adtype=&category=notgame&order=rand',
    naverBrandConnectHealth: 'https://naver.me/5Jq9LnLT',
    naverBrandConnectTour: 'https://naver.me/xJcOADhA',
    myrealtripKey: 'mAGXbDg5IJOskYOJT37C9R0K9X4JLQ2Cqc6I1GbQSTQBxylFekE4FwWXQeXRtvo0',
    myrealtripMylinkId: '6226316',
    klookAid: '140161',
    klookAdId: '1514603'
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
    const amzTag = encodeURIComponent(cfg.amazon || DEFAULT_AFF.amazon);
    const lpId = encodeURIComponent(cfg.linkprice || DEFAULT_AFF.linkprice);

    const cpUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(coupangQuery)}&channel=user&lptag=${cpTag}`;
    const ihUrl = `https://kr.iherb.com/search?kw=${encodeURIComponent(iherbQuery)}&rcode=${ihCode}`;
    const amzUrl = `https://www.amazon.com/s?k=${encodeURIComponent(iherbQuery)}&tag=${amzTag}`;
    const yesTarget = `https://www.yes24.com/Product/Search?domain=ALL&query=${encodeURIComponent(yes24Query || coupangQuery)}`;
    const lpUrl = `https://click.linkprice.com/click.php?m=yes24&a=${lpId}&l=9999&l_cd1=3&l_cd2=0&tu=${encodeURIComponent(yesTarget)}`;
    const naverUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(coupangQuery)}`;
    const adpickAff = encodeURIComponent(cfg.adpickAffId || DEFAULT_AFF.adpickAffId || '4d31d3');
    const st11Target = `https://www.11st.co.kr/search/search.tmall?kwd=${encodeURIComponent(coupangQuery)}`;
    const adpickShoppingUrl = `https://adpick.co.kr/apis/goshopping.php?affid=${adpickAff}&offer=c16a2&url=${encodeURIComponent(st11Target)}`;

    return {
      coupangUrl: cpUrl,
      iherbUrl: ihUrl,
      amazonUrl: amzUrl,
      yes24Url: lpUrl,
      naverUrl,
      adpickShoppingUrl,
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
        rankKo: '🏆 엄마들 재주문 1위',
        rankEn: '🏆 Reorder Pick #1',
        titleKo: '차일드라이프(ChildLife) 액상 칼슘 마그네슘 오렌지맛 474ml & 뉴질랜드 초유 칼슘',
        titleEn: 'ChildLife Essentials Liquid Calcium with Magnesium Orange (474ml)',
        specKo: '칼슘 + 비타민D3 + 아연·마그네슘 함유. 아침저녁으로 간편하고 상큼한 오렌지맛으로 아이들이 잘 먹어 6개월 이상 꾸준히 먹이고 재주문하는 제품입니다.',
        specEn: 'Calcium Citrate + Magnesium + Vit D3 + Zinc in a delicious natural orange flavor kids love morning & night!',
        cpQuery: '차일드라이프 액상 칼슘 마그네슘 오렌지맛 474ml',
        ihQuery: 'ChildLife Essentials Liquid Calcium with Magnesium Natural Orange 16 fl oz',
        yesQuery: '유아 영양식단 백과'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '트루엔 키즈 칼슘 마그네슘 비타민D 아연 액상 스틱 (어골·해조칼슘)',
        titleEn: 'Truen Kids Liquid Calcium Magnesium Vitamin D Zinc Stick Pouch',
        specKo: '하루 1~2포 간편 스틱 포장 · 우유 배앓이 없이 깔끔한 맛으로 아이들이 먼저 찾는 고흡수 칼슘·비타민D3입니다.',
        specEn: 'Single-serve liquid sticks · High-absorption Calcium + Mg + D3',
        cpQuery: '트루엔 키즈 칼슘 마그네슘 비타민D 액상 스틱',
        ihQuery: 'Nature\'s Way Alive Kids Calcium + Vitamin D3 Gummies',
        yesQuery: '아이 성장 영양학'
      }
    ],
    ht042_growth: [
      {
        rankKo: '🏆 엄마들 재주문 1위',
        rankEn: '🏆 Reorder Pick #1',
        titleKo: '종근당건강 아이커 (식약처 인정 HT042 황기추출물 + 칼슘·비타민D·아연 정품)',
        titleEn: 'Chong Kun Dang Health I-KER (MFDS Approved HT042 Astragalus Complex · 30 Packets)',
        specKo: '식약처 인정 HT042 + 칼슘·비타민D·아연이 한 번에 들어있어 아침저녁으로 간편하게 챙기고 6개월 이상 꾸준히 재주문하는 1위 제품입니다.',
        specEn: 'Official HT042 clinical dosage + Calcium, Vitamin D, and Zinc for 6+ months consistent growth care',
        cpQuery: '종근당건강 아이커 HT042 황기추출물 키성장 30포',
        ihQuery: 'Nature\'s Answer Astragalus Root Fluid Extract Alcohol Free',
        yesQuery: '어린이 키성장 영양 가이드'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '보타니스타 키클래오042 / 퍼니트 키즈텐042 (HT042 황기추출물 젤리·타블렛형)',
        titleEn: 'Botanista KiCleo 042 (HT042 Astragalus + Red Ginseng Jelly Stick)',
        specKo: '우유 없이도 간식처럼 씹어서 먹을 수 있고 상큼한 과일맛으로 아이들이 잘 먹는 제품입니다.',
        specEn: 'Easy-to-eat grape/apple jelly stick with full HT042 complex + 6-yr red ginseng',
        cpQuery: '보타니스타 키클래오042 황기추출물 HT042 어린이 키성장',
        ihQuery: 'Planetary Herbals Astragalus Extract Full Spectrum',
        yesQuery: '우리 아이 숨은 키 7cm'
      }
    ],
    zinc_colostrum: [
      {
        rankKo: '🏆 엄마들 재주문 1위',
        rankEn: '🏆 Reorder Pick #1',
        titleKo: '뉴질랜드 초유 칼슘 츄어블 & 일동후디스 하이키즈 초유 플러스 아연·비타민D3',
        titleEn: 'New Zealand Colostrum Calcium Chewable / Hoodis Hi-Kids Colostrum Zinc',
        specKo: '1알에 우유칼슘 + 비타민C + 뉴질랜드초유, 비타민A,B,D3,E, 철분, 아연, 마그네슘이 다 들어있어 아침저녁 씹어 먹기 간편한 오렌지맛 타블렛입니다.',
        specEn: '1 tablet packs Milk Calcium + Vit C + NZ Colostrum + Vit A,B,D3,E + Iron, Zinc & Magnesium in a clean orange chewable!',
        cpQuery: '뉴질랜드 초유 칼슘 비타민D 아연 마그네슘 어린이 오렌지맛 츄어블',
        ihQuery: 'ChildLife Probiotics with Colostrum Powder Natural Orange Pineapple',
        yesQuery: '편식 아이 식습관 교정'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '세노비스 키즈 멀티비타민 미네랄 / 네이처스웨이 키즈 아연 츄어블',
        titleEn: 'Nature\'s Way Sambucus Kids Immune Gummy with Zinc & Vitamin C',
        specKo: '입 짧은 편식 아이도 사탕처럼 맛있게 씹어 먹으며 아연·비타민A,B,C,D3,E를 간편하게 보충합니다.',
        specEn: 'Supports taste-bud cell turnover, appetite & IGF-1 synthesis in picky eaters',
        cpQuery: '세노비스 키즈 멀티비타민 미네랄 어린이 아연 츄어블',
        ihQuery: 'Nature\'s Way Sambucus Kids Gummies Standardized Elderberry Zinc',
        yesQuery: '편식 없는 아이 식단'
      }
    ],
    sleep_magnesium_tartcherry: [
      {
        rankKo: '🏆 엄마들 재주문 1위',
        rankEn: '🏆 Reorder Pick #1',
        titleKo: '노르딕 내추럴스(Nordic Naturals) 마그네슘 오렌지·만다린 구미 & 칼슘·비타민D3',
        titleEn: 'Nordic Naturals Zero Sugar Magnesium Gummies / Solgar Chelated Magnesium',
        specKo: '저녁 식후 1알로 칼슘·마그네슘·비타민D3를 간편하게 보충하며 상큼한 오렌지·귤맛 츄어블로 밤새 깊은 숙면을 돕습니다.',
        specEn: 'Highly bioavailable chelated magnesium in a clean tangerine chewable for deep sleep & leg comfort',
        cpQuery: '노르딕내추럴스 마그네슘 구미 어린이 칼슘 마그네슘 비타민D',
        ihQuery: 'Nordic Naturals Zero Sugar Magnesium Gummies Tangerine',
        yesQuery: '수면과 성장호르몬 과학'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '프롬바이오 키즈 어골칼슘 마그네슘 비타민D & 타트체리 스틱',
        titleEn: 'FromBIO Kids Fish-Bone Calcium Magnesium D3 & Montmorency Tart Cherry',
        specKo: '어골칼슘 + 마그네슘 + 비타민D3가 한 포에 들어있어 저녁마다 간편하게 먹이기 좋습니다.',
        specEn: 'Non-calcined fish bone calcium + magnesium + natural tart cherry phytomelatonin',
        cpQuery: '키즈 어골칼슘 마그네슘 비타민D 타트체리 어린이 영양제',
        ihQuery: 'Dynamic Health Certified Organic Tart Cherry Juice Concentrate',
        yesQuery: '아이 수면 교육 가이드'
      }
    ],
    cartilage_calcium: [
      {
        rankKo: '🏆 엄마들 재주문 1위',
        rankEn: '🏆 Reorder Pick #1',
        titleKo: '뉴질랜드 초유 우유칼슘·어골연골칼슘 + 비타민D3·아연·마그네슘 오렌지맛 타블렛',
        titleEn: 'NZ Colostrum Milk & Cartilage Calcium + Vit D3/C/A/B/E + Iron/Zinc/Mg Orange Chewable',
        specKo: '1알에 우유·연골칼슘 + 비타민C + 뉴질랜드초유 + 비타민A,B,D3,E + 철분·아연·마그네슘 함유. 아침저녁으로 씹어 먹는 깔끔한 오렌지맛 스테디셀러입니다.',
        specEn: 'All-in-one Milk/Cartilage Calcium + NZ Colostrum + Vit A,B,C,D3,E + Iron, Zinc & Mg in an easy orange chewable tablet!',
        cpQuery: '어린이 어골칼슘 연골칼슘 초유 비타민D3 아연 마그네슘 츄어블',
        ihQuery: 'Carlson Labs Kid\'s Chewable Calcium Vanilla + Vitamin D3',
        yesQuery: '소아 뼈성장과 칼슘'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '네이처스플러스 애니멀 퍼레이드 키즈 칼슘 마그네슘 츄어블 (90정)',
        titleEn: 'NaturesPlus Animal Parade Calcium Children\'s Chewable Natural Vanilla (90 Tabs)',
        specKo: '우유 배앓이 없는 무유당 킬레이트 칼슘·마그네슘으로 아이들이 좋아하는 동물 모양 타블렛입니다.',
        specEn: 'Aminoate chelated calcium & magnesium · Lactose-free chewables',
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
    balance_stones_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '위플레이(Weplay) 하천 돌다리 유아 논슬립 밸런스 징검다리 스톤 6p 세트',
        titleEn: 'Weplay Non-Slip River Stones Tactile Balance Stepping Stones Set',
        specKo: '소뇌 평형감각(전정기관) 발달 + 발바닥 고유수용성 감각 자극 실내 징검다리',
        specEn: 'Develops cerebellar balance, coordination, and foot proprioception',
        cpQuery: '위플레이 유아 밸런스 징검다리 스톤 실내 신체놀이',
        ihQuery: 'GonGe River Stones Balance Stepping Stones for Kids',
        yesQuery: '유아 감각통합 징검다리 놀이'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '원더볼즈 유아 논슬립 밸런스 징검다리 스톤 점핑 블록 11p 세트',
        titleEn: 'Wonderballs Non-Slip Balance Stepping Stones 11-Piece Set',
        specKo: '미끄럼 방지 고무 테두리 + 높낮이가 다른 스톤으로 공간지각력 및 대근육 협응 발달',
        specEn: 'Rubber non-slip edge with varied heights building spatial balance',
        cpQuery: '유아 밸런스 징검다리 스톤 논슬립 실내 대근육 교구',
        ihQuery: 'National Geographic Stepping Stones Kids Balance Game',
        yesQuery: '영유아 대근육 신체발달'
      }
    ],
    toddler_trampoline_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 유아 안전 손잡이형 무소음 밴드 실내 트램폴린 (층간소음 제로)',
        titleEn: 'Melkin Toddler Silent Elastic-Band Mini Trampoline with Padded Bar',
        specKo: '영유아 맞춤 부드러운 탄성 밴드 + 폼패딩 안전 핸들바 · 성장판 미세자극',
        specEn: 'Gentle elastic bands with padded handlebar for toddler safe bouncing',
        cpQuery: '멜킨스포츠 유아 안전 손잡이 무소음 실내 트램폴린',
        ihQuery: 'Little Tikes 3-Foot Trampoline with Padded Handlebar',
        yesQuery: '유아 신체발달 점핑놀이'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '스마트라이크(smarTrike) 3-in-1 유아 트램폴린 & 볼풀장 겸용 세트',
        titleEn: 'smarTrike 3-in-1 Activity Center Trampoline and Ball Pit',
        specKo: '손잡이 잡고 뛰기부터 볼풀 놀이까지 영유아 신체 성장 3단계 멀티 플레이',
        specEn: 'Multi-stage active bouncing from handle-supported jumping to ball pit',
        cpQuery: '스마트라이크 3in1 유아 트램폴린 볼풀장',
        ihQuery: 'smarTrike 3-in-1 Folding Trampoline with Handlebar',
        yesQuery: '돌아기 실내 대근육 놀이'
      }
    ],
    sponge_jumprope_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '소프트 스펀지 그립 유아 안전 구슬 줄넘기 (맞춤 길이조절 마디형)',
        titleEn: 'Soft Sponge Foam Grip Kids Segmented Safety Jump Rope',
        specKo: '아프지 않은 부드러운 스펀지 손잡이 + 바닥 닿을 때 리듬감을 주는 마디형 비즈',
        specEn: 'Pain-free soft sponge foam handles with rhythmic segmented beads',
        cpQuery: '유아 스펀지 손잡이 안전 구슬 줄넘기 마디형',
        ihQuery: 'Just Jump It Lacing Beaded Jump Rope Kids Soft',
        yesQuery: '유아 첫 줄넘기 놀이'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '아이워너 유아 소프트 EVA 폼 그립 길이조절 안전 줄넘기',
        titleEn: 'IWanna Toddler Soft EVA Foam Grip Adjustable Safety Jump Rope',
        specKo: '가볍고 유연한 무독성 줄 + 폭신한 EVA 그립으로 초기 점핑 협응력 발달',
        specEn: 'Lightweight non-toxic flexible rope with cushioned EVA grip',
        cpQuery: '어린이 소프트 EVA 줄넘기 길이조절 유아용',
        ihQuery: 'Kids Soft Foam Handle Skipping Rope Lightweight',
        yesQuery: '유아 대근육 점프 놀이'
      }
    ],
    doorway_bar_foamroller_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '무타공 안전 이중잠금 실내 문틀 철봉 (저상형 데드행 바) & 소프트 폼롤러',
        titleEn: 'Toddler Low-Mount No-Screw Doorway Pull-Up Bar with Soft Roller',
        specKo: '저녁 20초 매달리기 척추 추간판 감압 + 흉추 C자 정렬 스트레칭',
        specEn: 'Low doorway mount for toddler gentle 20s hangs and thoracic alignment',
        cpQuery: '무타공 안전 문틀 철봉 실내 턱걸이봉 소프트 폼롤러',
        ihQuery: 'Toddler Low Doorway Pull Up Bar Foam Roller',
        yesQuery: '영유아 척추 스트레칭'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '멜킨 세이프락 어린이 저상형 문틀 철봉 / 멜킨 마일드 EVA 폼롤러',
        titleEn: 'Melkin Safe-Lock Low Doorway Bar & Mild EVA Roller',
        specKo: '아이 손높이에 맞춰 낮게 설치하는 안전 매달리기 바 + 성장통 이완 마사지',
        specEn: 'Adjustable low height for child-safe hanging and leg muscle relief',
        cpQuery: '멜킨 어린이 문틀 철봉 저상형 데드행 바',
        ihQuery: 'Kids Doorway Pull Up Bar Safety Lock Low Mount',
        yesQuery: '유아 바른 체형 스트레칭'
      }
    ],
    soft_roller_mat_1_3: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '어린이 척추·종아리 신전 고밀도 폼롤러 & 충격흡수 롤매트',
        titleEn: 'Kids Spine Extension EPP Roller & Shock Absorbing Mat',
        specKo: '취침 전 3분 종아리·대퇴근 근막 마사지로 야간 성장통 완화 및 숙면 유도',
        specEn: 'Nightly 3-min calf/quad fascia massage relieving growing pains',
        cpQuery: '어린이 척추 신전 폼롤러 성장통 마사지 롤매트',
        ihQuery: 'Kids Soft Foam Roller Growth Massage Mat',
        yesQuery: '성장통 마사지 가이드'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '트라택 키즈 소프트 롤러 & 두꺼운 무소음 충격흡수 TPE 놀이매트',
        titleEn: 'Tratac Kids Soft Roller with Thick TPE Impact Mat',
        specKo: '다리 피로를 풀어주는 소프트 자극 + 쿵쿵 뛰어도 안전한 층간소음 방어 매트',
        specEn: 'Soft muscle relaxation combined with thick soundproofing floor mat',
        cpQuery: '어린이 소프트 마사지 폼롤러 두꺼운 TPE 매트',
        ihQuery: 'Kids Myofascial Release Roller Foam Mat',
        yesQuery: '유아 성장통 완화 마사지'
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
        titleKo: '아이워너 / 멜킨 친환경 무소음 실내 점핑 트램폴린 쿠션 매트',
        titleEn: 'IWanna High-Density Silent Indoor Jumping Trampoline Cushion Mat',
        specKo: '다층 고밀도 PU 폼으로 층간소음 0dB 완벽 흡수 + 성장판 무리 없는 수직 반발탄성',
        specEn: 'Multi-layer high-density PU foam absorbing 100% floor impact for safe joint rebounding',
        cpQuery: '어린이 실내 무소음 트램폴린 점핑 쿠션 매트',
        ihQuery: 'Kids Indoor Jumping Cushion Silent Trampoline Mat',
        yesQuery: '아이 키 크는 점프 스트레칭'
      }
    ],
    trampoline_rebounder_4_5: [
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
        titleKo: '아이워너 / 멜킨 친환경 무소음 실내 점핑 트램폴린 쿠션 매트',
        titleEn: 'IWanna High-Density Silent Indoor Jumping Trampoline Cushion Mat',
        specKo: '다층 고밀도 PU 폼으로 층간소음 0dB 완벽 흡수 + 성장판 무리 없는 수직 반발탄성',
        specEn: 'Multi-layer high-density PU foam absorbing 100% floor impact for safe joint rebounding',
        cpQuery: '어린이 실내 무소음 트램폴린 점핑 쿠션 매트',
        ihQuery: 'Kids Indoor Jumping Cushion Silent Trampoline Mat',
        yesQuery: '아이 키 크는 점프 스트레칭'
      }
    ],
    doorway_bar_4_5: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 스파이더 철봉 / 세이프락 무타공 안전 문틀 철봉 (유아·어린이 저상형 데드행 바)',
        titleEn: 'Melkin Safe-Lock No-Screw Kids Doorway Pull-Up & Dead Hang Bar',
        specKo: '무타공 안전 이중 락킹 시스템 + 미끄럼 방지 루버 패드 · 저녁 30초 데드행 척추 추간판 감압',
        specEn: 'No-screw dual-locking safety bar with non-slip pads for daily 30s spinal decompression',
        cpQuery: '멜킨스포츠 무타공 안전 문틀 철봉 어린이 실내 풀업바',
        ihQuery: 'Doorway Pull Up Bar Kids Dead Hang Bar Safety Lock',
        yesQuery: '어린이 척추 감압 스트레칭'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '코멧 스포츠 무타공 수평계 이중 안전잠금 문틀 철봉 (가정용 턱걸이봉)',
        titleEn: 'Comet Sports Level-Indicator No-Screw Doorway Chin-Up Bar',
        specKo: '자체 수평계 내장으로 기울어짐 없는 완벽 수평 설치 · 200kg 하중 지지 안전 설계',
        specEn: 'Built-in bubble level indicator with 200kg heavy-duty load support',
        cpQuery: '코멧 스포츠 무타공 수평계 안전 문틀 철봉',
        ihQuery: 'Iron Gym Total Upper Body Workout Bar Doorway',
        yesQuery: '바른 자세 성장 스트레칭'
      }
    ],
    jumprope_digital_4_5: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '아이워너 줄 꼬임 방지 어린이 디지털 카운터 줄넘기 (무소음 노라인 에어볼 겸용)',
        titleEn: 'IWanna Kids Tangle-Free Digital Counting Jump Rope (Cord & Cordless)',
        specKo: '실내 층간소음 없는 노라인 실리콘 볼 + 야외 와이어 줄 2-in-1 · 발목 성장판 자극',
        specEn: '2-in-1 cordless air balls and outdoor rope with HD digital jump counter',
        cpQuery: '어린이 디지털 카운터 줄넘기 무소음 노라인 에어볼',
        ihQuery: 'Cordless Digital Jump Rope Kids Counting Ropeless',
        yesQuery: '유아 줄넘기 시작하기'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '김수열 어린이 줄넘기 / 프로스펙스 주니어 디지털 스마트 줄넘기',
        titleEn: 'Kim Soo-Yeol Junior Digital Smart Counting Jump Rope',
        specKo: '미끄럼 방지 실리콘 그립 + 자동 회전수 카운팅으로 유아 성취감과 점핑 습관 형성',
        specEn: 'Ergonomic silicone grip with auto-counting building daily jumping habits',
        cpQuery: '김수열 어린이 스마트 디지털 카운터 줄넘기',
        ihQuery: 'Kids Digital Counting Skipping Rope Weighted Handle',
        yesQuery: '어린이 성장 줄넘기 운동법'
      }
    ],
    foamroller_spine_4_5: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 어린이 척추 신전 스트레칭 EPP 폼롤러 (원형 60cm 마일드)',
        titleEn: 'Melkin Kids EPP Foam Roller for Spine Extension (60cm Round)',
        specKo: '친환경 무독성 고밀도 EPP 소재 · 취침 전 3분 흉추 펴기 및 척추 C자 정렬 스트레칭',
        specEn: 'Non-toxic high-density EPP foam for gentle nightly thoracic extension',
        cpQuery: '멜킨스포츠 어린이 척추 신전 스트레칭 EPP 폼롤러 60cm',
        ihQuery: 'OPTP Pro-Roller Soft Foam Roller 36 Inch',
        yesQuery: '어린이 바른 자세 폼롤러'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '트라택(Tratac) 액티브 폼롤러 EVA 마일드 / 키즈 척추 기립근 이완 롤러',
        titleEn: 'Tratac Active EVA Mild Kids Spine Alignment Roller',
        specKo: '부드러운 쿠션감으로 통증 없는 척추 기립근 마사지 및 골반 비대칭 교정',
        specEn: 'Soft cushioned EVA surface for painless spinal muscle relaxation',
        cpQuery: '트라택 액티브 폼롤러 EVA 마일드 어린이 척추 교정',
        ihQuery: 'TriggerPoint CORE Foam Roller Multi-Density',
        yesQuery: '척추 바른자세 스트레칭'
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
    doorway_bar_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 프리미엄 포스 세이프락 무타공 문틀 철봉 (초등 척추 감압 턱걸이봉)',
        titleEn: 'Melkin Force Safe-Lock No-Screw Kids Doorway Pull-Up Bar',
        specKo: '양방향 회전 방지 세이프 락킹 + 고밀도 네오프렌 풀 그립 · 초등 척추 디스크 수분 복원',
        specEn: 'Dual-locking mechanism with full neoprene grip for spinal disc hydration',
        cpQuery: '멜킨스포츠 무타공 세이프락 문틀 철봉 초등 턱걸이봉',
        ihQuery: 'Doorway Pull Up Bar Kids Dead Hang Bar Safe Lock',
        yesQuery: '초등 척추 감압 교정'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '반석스포츠 비스펙 무타공 안전 문틀 철봉 (초등학생 데드행 매달리기봉)',
        titleEn: 'Bansuk Sports B-Spec No-Screw Doorway Chin-Up Bar',
        specKo: '초밀착 고탄성 실리콘 와이드 패드로 문틀 손상 제로 · 매일 30초 3세트 데드행',
        specEn: 'Wide silicone wall-protection pads with zero doorframe damage',
        cpQuery: '반석스포츠 무타공 안전 문틀 철봉 어린이 매달리기',
        ihQuery: 'Kids Doorway Pull Up Bar Hanging Spinal Decompression',
        yesQuery: '초등 키성장 스트레칭'
      }
    ],
    trampoline_rebounder_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 48인치 대형 무소음 피트니스 트램폴린 (초등 점핑 성장판 자극)',
        titleEn: 'Melkin 48-Inch Silent Elastic-Rope Fitness Rebounder Trampoline',
        specKo: '스프링 없는 고탄성 라텍스 로프 방식 · 관절 충격 없이 성장판 수직 미세하중 전달',
        specEn: 'Spring-free latex rope design delivering zero-impact cyclic micro-loads to growth plates',
        cpQuery: '멜킨스포츠 48인치 무소음 트램폴린 실내 점핑 다이어트 키성장',
        ihQuery: '48 Inch Silent Fitness Mini Trampoline Rebounder with Handle',
        yesQuery: '초등 키성장 점핑 트레이닝'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '방방이 키즈 점핑보드 / 무소음 스프링리스 실내 트램폴린 매트',
        titleEn: 'Kids Springless Silent Rebounder Jumping Board & Mat',
        specKo: '초등학생 층간소음 민원 걱정 없이 실내에서 매일 1,000회 점핑 루틴 완성',
        specEn: 'Allows daily 1,000 jumps indoors with zero downstairs noise complaints',
        cpQuery: '초등학생 무소음 점핑보드 실내 트램폴린 층간소음 방지',
        ihQuery: 'Indoor Kids Trampoline Fitness Rebounder Heavy Duty',
        yesQuery: '초등학생 성장판 자극 홈트'
      }
    ],
    jumprope_digital_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '김수열줄넘기 초등 속도조절 디지털 카운터 줄넘기 (노라인 추 & 로프 겸용)',
        titleEn: 'Kim Soo-Yeol Elementary Digital Speed Jump Rope (Cord & Weight Ball)',
        specKo: '학교 줄넘기 급수제 완벽 대비 · 정밀 베어링 360도 회전 + 일일 500회 목표 달성 카운터',
        specEn: 'Smooth 360° bearing rotation for elementary school jump rope grade tests',
        cpQuery: '김수열줄넘기 초등학생 디지털 카운터 줄넘기 노라인 호환',
        ihQuery: 'Digital Counting Jump Rope Kids Cordless High Speed',
        yesQuery: '초등 줄넘기 급수제 완전정복'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '프로스펙스 스피드 디지털 카운팅 스마트 줄넘기 (초등 성장판 자극 에어로프)',
        titleEn: 'Prospecs Speed Digital Smart Jump Rope for Kids',
        specKo: '무소음 실내 노라인 볼 내장으로 거실에서도 매일 500회 점핑 루틴 완벽 실천',
        specEn: 'Silent indoor cordless balls enabling daily 500-jump routine in the living room',
        cpQuery: '프로스펙스 어린이 디지털 카운터 스마트 줄넘기',
        ihQuery: 'Smart Skipping Rope Digital Counter Kids Speed Rope',
        yesQuery: '초등학생 바른 줄넘기 자세'
      }
    ],
    foamroller_spine_6_8: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 고밀도 EPP 척추 신전 & 흉추 교정 폼롤러 90cm (거북목·굽은 등 방어)',
        titleEn: 'Melkin High-Density EPP Foam Roller 90cm Spine Alignment',
        specKo: '초등학생 착석 구부정한 자세 교정 · 취침 전 흉추 신전으로 눌린 척추 디스크 수분 복원',
        specEn: '90cm full-spine EPP roller restoring intervertebral hydration before sleep',
        cpQuery: '멜킨스포츠 고밀도 EPP 폼롤러 90cm 척추 스트레칭 거북목',
        ihQuery: 'High Density Round Foam Roller 36 Inch Physical Therapy',
        yesQuery: '초등 바른 자세 폼롤러 스트레칭'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '코멧 스포츠 고밀도 EPP 폼롤러 90cm + 바른 자세 척추 스트레칭 가이드 포스터',
        titleEn: 'Comet Sports High-Density EPP 90cm Spine Alignment Roller with Poster',
        specKo: '변형 없는 고내구성 압축 EPP · 종아리·대퇴사두근 근막 이완으로 야간 성장통 완화',
        specEn: 'Durable molded EPP relieving calf/quad fascia tension and growing pains',
        cpQuery: '코멧 스포츠 고밀도 EPP 폼롤러 90cm 스트레칭 포스터',
        ihQuery: 'Amazon Basics High-Density Round Foam Roller 36-Inch',
        yesQuery: '초등학생 성장통 마사지법'
      }
    ],
    doorway_bar_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 옥타곤 프리미엄 무타공 문틀 철봉 풀업바 (청소년 고중량 지지 데드행 바)',
        titleEn: 'Melkin Octagon Heavy-Duty No-Screw Doorway Pull-Up Bar',
        specKo: '8각 안전 락킹 구조 + 300kg 한계 하중 · 청소년기 척추 측만 방어 및 흉추 신전',
        specEn: '8-angle safety lock supporting up to 300kg for adolescent thoracic extension',
        cpQuery: '멜킨스포츠 옥타곤 무타공 문틀 철봉 풀업바 턱걸이봉',
        ihQuery: 'Heavy Duty Doorway Pull Up Bar Chin Up Bar 300kg',
        yesQuery: '청소년 척추 디스크와 성장'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '힘콩 재미어트 문틀 철봉 / 프로스펙스 세이프락 무타공 풀업바',
        titleEn: 'Himkong Jamiet No-Screw Safety Doorway Pull-Up Bar',
        specKo: '와이드 그립 데드행으로 광배근 이완 및 척추 추간판 압력 -40% 즉시 경감',
        specEn: 'Wide-grip dead hang relieving -40% intervertebral disc pressure',
        cpQuery: '재미어트 힘콩 무타공 문틀 철봉 세이프락 풀업바',
        ihQuery: 'Prospec Safe Doorway Pull Up Bar Chinning Bar',
        yesQuery: '청소년 바른 체형 교정 운동'
      }
    ],
    trampoline_heavy_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 고중량 지지 50인치 대형 8각형 무소음 피트니스 리바운더 트램폴린',
        titleEn: 'Melkin 50-Inch Heavy-Duty Octagonal Silent Fitness Rebounder',
        specKo: '최대 150kg 고하중 지지 + 3단 높이조절 핸들바 · 사춘기 PHV 급성장기 인터벌 점핑',
        specEn: 'Supports up to 150kg with 3-tier adjustable T-handlebar for adolescent PHV interval jumps',
        cpQuery: '멜킨스포츠 대형 8각 무소음 피트니스 트램폴린 리바운더',
        ihQuery: 'Heavy Duty 50 Inch Fitness Trampoline Rebounder 330 lbs',
        yesQuery: '청소년 성장호르몬 분비 운동'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '점핑하이 오리지널 점핑 트램폴린 / 홈트 무소음 프로 리바운더',
        titleEn: 'Jumping High Professional Silent Fitness Rebounder',
        specKo: '고강도 독일 규격 탄성 고무줄 장착으로 무릎·발목 관절을 보호하며 체지방 감량 및 성장 자극',
        specEn: 'High-tensile elastic cords protecting knee/ankle joints while promoting GH secretion',
        cpQuery: '점핑하이 정품 무소음 피트니스 트램폴린 리바운더',
        ihQuery: 'Maximus Pro Bungee Rebounder 40 Inch Silent Trampoline',
        yesQuery: '사춘기 키성장과 홈트레이닝'
      }
    ],
    trampoline_rebounder_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 고중량 지지 50인치 대형 8각형 무소음 피트니스 리바운더 트램폴린',
        titleEn: 'Melkin 50-Inch Heavy-Duty Octagonal Silent Fitness Rebounder',
        specKo: '최대 150kg 고하중 지지 + 3단 높이조절 핸들바 · 사춘기 PHV 급성장기 인터벌 점핑',
        specEn: 'Supports up to 150kg with 3-tier adjustable T-handlebar for adolescent PHV interval jumps',
        cpQuery: '멜킨스포츠 대형 8각 무소음 피트니스 트램폴린 리바운더',
        ihQuery: 'Heavy Duty 50 Inch Fitness Trampoline Rebounder 330 lbs',
        yesQuery: '청소년 성장호르몬 분비 운동'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '점핑하이 오리지널 점핑 트램폴린 / 홈트 무소음 프로 리바운더',
        titleEn: 'Jumping High Professional Silent Fitness Rebounder',
        specKo: '고강도 독일 규격 탄성 고무줄 장착으로 무릎·발목 관절을 보호하며 체지방 감량 및 성장 자극',
        specEn: 'High-tensile elastic cords protecting knee/ankle joints while promoting GH secretion',
        cpQuery: '점핑하이 정품 무소음 피트니스 트램폴린 리바운더',
        ihQuery: 'Maximus Pro Bungee Rebounder 40 Inch Silent Trampoline',
        yesQuery: '사춘기 키성장과 홈트레이닝'
      }
    ],
    jumprope_digital_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '청소년 고속 베어링 디지털 카운터 줄넘기 (급성장기 PHV 성장판 폭발 자극)',
        titleEn: 'Youth High-Speed Dual-Bearing Digital Counting Jump Rope',
        specKo: '더블 볼베어링 초고속 회전 + 칼로리·점프 횟수 LCD 디스플레이 · 매일 1,000회 수직 점프',
        specEn: 'Double ball-bearing rotation with backlit LCD counter for daily 1,000 jumps',
        cpQuery: '청소년 고속 베어링 디지털 카운터 줄넘기 실내 점핑매트',
        ihQuery: 'High Speed Bearing Digital Jump Rope Weighted Cordless',
        yesQuery: '사춘기 성장판 점프 운동'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '김수열 명품 스피드 줄넘기 / 프로스펙스 메탈 스마트 베어링 줄넘기',
        titleEn: 'Kim Soo-Yeol Pro Speed Jump Rope with Precision Bearings',
        specKo: '2단 뛰기(이단뛰기) 최적화 스피드 와이어 로프 + 손목 피로 없는 인체공학 그립',
        specEn: 'Optimized for double-unders and explosive vertical growth stimulation',
        cpQuery: '김수열 명품 스피드 줄넘기 2단뛰기 스마트 카운터',
        ihQuery: 'Crossrope Get Lean Weighted Jump Rope Speed',
        yesQuery: '청소년 급성장기 운동 처방'
      }
    ],
    foamroller_spine_9_plus: [
      {
        rankKo: '🏆 엄선 1위',
        rankEn: '🏆 Pick #1',
        titleKo: '멜킨스포츠 프리미엄 리셋 EPP 폼롤러 90cm (청소년 척추 추간판 감압 & 흉추 신전)',
        titleEn: 'Melkin Reset Premium 90cm EPP Full Spine Roller',
        specKo: '청소년 장시간 착석 학습으로 굽은 등(Kyphosis)과 일자목을 펴주는 고경도 척추 롤러',
        specEn: 'High-firmness 90cm roller reversing adolescent studying kyphosis and text-neck',
        cpQuery: '멜킨스포츠 리셋 EPP 폼롤러 90cm 청소년 척추 디스크 교정',
        ihQuery: 'OPTP Original High Density Foam Roller 36x6',
        yesQuery: '청소년 척추 디스크와 바른 자세'
      },
      {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Pick #2',
        titleKo: '트라택 릴리즈 롤러 프로 / 그리드 트리거포인트 폼롤러 (근막 딥티슈 이완)',
        titleEn: 'TriggerPoint GRID Foam Roller Deep Tissue Myofascial Release',
        specKo: '3차원 그리드 표면으로 척추 기립근 및 골반 장요근 심부 근막을 정밀 이완',
        specEn: 'Multi-density grid pattern for deep thoracic and iliopsoas myofascial release',
        cpQuery: '트리거포인트 그리드 폼롤러 근막이완 척추 신전',
        ihQuery: 'TriggerPoint GRID Foam Roller for Exercise Muscle Recovery',
        yesQuery: '청소년 척추 자세 교정 운동'
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
    const rawList = CURATED_SPECIFIC_PRODUCTS_DB[itemId];
    if (!rawList || !Array.isArray(rawList)) {
      return [];
    }
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
  function curatePinpointItems(profile = {}, affConfig = {}, thirdArg = {}) {
    let p = {};
    let safeAffConfig = affConfig;
    if (typeof profile === 'number') {
      p = { ageMonths: profile };
      if (Array.isArray(affConfig)) {
        p.habits = affConfig;
      }
      safeAffConfig = (thirdArg && typeof thirdArg === 'object' && !Array.isArray(thirdArg)) ? thirdArg : {};
    } else if (profile && typeof profile === 'object') {
      p = profile;
      safeAffConfig = (affConfig && typeof affConfig === 'object' && !Array.isArray(affConfig)) ? affConfig : {};
    }
    affConfig = safeAffConfig;

    const ageMonths = Number(p.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const genderKo = p.gender === 'girl' ? '여아' : '남아';
    const height = Number(p.currentHeight) || 137.0;
    const weight = Number(p.currentWeight) || 35.5;
    const recent6m = Number(p.recentGrowth6m) || 3.2;
    const habits = Array.isArray(p.habits) ? p.habits : ['late_sleep'];
    const cogAxes = Array.isArray(p.cognitiveAxes) ? p.cognitiveAxes : ['science_nature'];

    const traitSleepList = Array.isArray(p.traitSleepList) ? p.traitSleepList : [p.traitSleep || 'late_bedtime'];
    const traitDietList = Array.isArray(p.traitDietList) ? p.traitDietList : [p.traitDiet || 'small_appetite'];
    const traitPostureList = Array.isArray(p.traitPostureList) ? p.traitPostureList : [p.traitPosture || 'turtle_slouch'];

    // Determine if height is below median or velocity needs catch-up
    const isPicky = habits.includes('picky_eater') || traitDietList.includes('meat_veggie_picky') || traitDietList.includes('small_appetite') || traitDietList.includes('slow_hold_mouth') || traitDietList.includes('fast_indigestion') || traitDietList.includes('sweet_carb') || traitDietList.includes('fast_carb_sweet');
    const isLateSleep = habits.includes('late_sleep') || habits.includes('night_carbs') || traitSleepList.includes('late_bedtime') || traitSleepList.includes('toss_mouth') || traitSleepList.includes('wake_middle') || traitSleepList.includes('light_dream') || traitSleepList.includes('hard_wakeup') || traitSleepList.includes('night_sweat');
    const isPoorPosture = habits.includes('poor_posture') || traitPostureList.includes('turtle_slouch') || traitPostureList.includes('leg_cross_pelvis') || traitPostureList.includes('chin_lean') || traitPostureList.includes('flat_foot');
    const isSedentary = habits.includes('sedentary');

    // =========================================================================
    // A. PINPOINT SUPPLEMENTS (2 Exact Target Products per Child)
    // =========================================================================
    const supplements = [];

    if (ageYears <= 3) {
      // Toddler 1-3 yrs: Liquid Citrate/Cartilage Calcium + D3
      supplements.push(Object.assign({
        id: 'liquid_calcium_toddler',
        categoryBadge: `🍼 [만 ${ageYears}세 영유아 맞춤 1위] 골기질 액상 영양제`,
        name: '영유아 액상 구연산·연골 칼슘 마그네슘 & 비타민D3 1000IU 드롭',
        activeSpec: '액상 구연산칼슘(흡수율 45%) + 연골추출물 + 마그네슘 + 콜레칼시페롤(D3)',
        whyNeeded: `생후 ${ageMonths}개월(만 ${ageYears}세) ${genderKo}는 제1급성장기 골격이 형성되는 시기로, 알약 대신 위산 분비와 무관하게 흡수되는 액상 구연산·연골칼슘(일일 650mg 기준)과 비타민D3 드롭 보충이 필수입니다 (PMID:31964028).`,
        buttonLabelCoupang: `쿠팡에서 '유아 액상 구연산 연골칼슘 비타민D' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 'ChildLife 액상 칼슘 마그네슘' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 액상 칼슘 마그네슘 비타민D 어린이 구연산칼슘',
        'ChildLife Liquid Calcium with Magnesium Orange',
        '유아 영양식단 칼슘 육아',
        affConfig
      )));
    } else if (ageYears <= 6) {
      // Preschool 4-6 yrs: Chewable/Jelly HT042 Astragalus Complex
      supplements.push(Object.assign({
        id: 'ht042_growth',
        categoryBadge: `🧬 [만 ${ageYears}세 유아 맞춤 1위] 식약처 인정 키성장 젤리·분말`,
        name: '식약처 인정 황기추출물 등 복합물(HT042) 유아·어린이 키성장 영양제 (아이커·키클래오042)',
        activeSpec: '황기추출물 등 복합물(HT042 · 가시오갈피·한속단 배합) 유아 친화 분말/젤리형',
        whyNeeded: `만 ${ageYears}세(${ageMonths}개월, 현재 ${height}cm) 유아기에 간에서 성장호르몬 하위 인자(IGF-1 및 IGFBP-3) 생성을 촉진하여 하지 성장판 연골세포 증식 속도를 높여주는 식약처 인정 핵심 원료입니다 (경희대 임상 PMID:25374566).`,
        buttonLabelCoupang: `쿠팡에서 '만 ${ageYears}세 어린이 황기추출물 HT042 키성장 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '황기추출물(Astragalus) 성장 면역 스펙' 바로 보기 ↗`
      }, buildPinpointUrls(
        '식약처 인정 키성장 황기추출물 HT042 어린이 영양제',
        'Astragalus root extract kids growth immune',
        '어린이 키성장 영양가이드',
        affConfig
      )));
    } else if (ageYears <= 10) {
      // Elementary 7-10 yrs: Pre-pubertal foundation HT042
      supplements.push(Object.assign({
        id: 'ht042_growth',
        categoryBadge: `🧬 [만 ${ageYears}세 초등 맞춤 1위] 사춘기 전 기초키 확보 HT042`,
        name: '식약처 인정 황기추출물 등 복합물(HT042) 초등 키성장 집중 영양제',
        activeSpec: '황기추출물 등 복합물(HT042) + 어골칼슘·비타민D3·아연 올인원 배합',
        whyNeeded: `사춘기 급성장기 진입 전 기초 신장을 최대한 비축해야 하는 만 ${ageYears}세(현재 ${height}cm) 시기에 성장인자(IGF-1)와 성장판 연골 증식을 직접 돕는 식약처 인정 1순위 원료입니다 (PMID:25374566).`,
        buttonLabelCoupang: `쿠팡에서 '초등 황기추출물 HT042 키성장 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '황기추출물(Astragalus) 성장 면역 스펙' 바로 보기 ↗`
      }, buildPinpointUrls(
        '식약처 인정 키성장 황기추출물 HT042 어린이 영양제',
        'Astragalus root extract kids growth immune',
        '어린이 키성장 영양가이드',
        affConfig
      )));
    } else {
      // Age 11+ (Puberty / PHV / Adolescence): High-potency HT042 + Arginine
      supplements.push(Object.assign({
        id: 'ht042_growth',
        categoryBadge: `🧬 [만 ${ageYears}세 급성장기 맞춤 1위] 성장판 마감 전 집중 부스터`,
        name: '식약처 인정 황기추출물(HT042) & 청소년 고함량 아르기닌·초유 키성장 영양제',
        activeSpec: '황기추출물 복합물(HT042) + L-아르기닌 + 초유단백(IgG) 고함량 배합',
        whyNeeded: `성장판이 서서히 닫히기 시작하는 만 ${ageYears}세(${height}cm) 급성장·방어 골든타임에 성장호르몬 하위 인자(IGF-1) 분비와 골단 연골 증식을 극대화하는 필수 기능성 원료입니다 (PMID:25374566).`,
        buttonLabelCoupang: `쿠팡에서 '청소년 황기추출물 HT042 키성장 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '황기추출물(Astragalus) & L-Arginine' 바로 보기 ↗`
      }, buildPinpointUrls(
        '식약처 인정 키성장 황기추출물 HT042 어린이 청소년 영양제',
        'Astragalus root extract L-Arginine growth',
        '청소년 키성장 영양가이드',
        affConfig
      )));
    }

    // Supplement #2: Dynamically chosen based on child's age & specific habit bottleneck
    if (isPicky) {
      supplements.push(Object.assign({
        id: 'zinc_colostrum',
        categoryBadge: `🥦 [만 ${ageYears}세 맞춤 2위] 편식·입짧음 & 적정체중(${weight}kg) 케어`,
        name: ageYears <= 3
          ? '영유아 액상 글루콘산 아연 시럽 & 뉴질랜드 초유 분말 스틱'
          : (ageYears <= 6
            ? '유아 오렌지맛 초유 칼슘·아연 츄어블 & 어린이 멀티비타민 구미'
            : '어린이·청소년 글루콘산·피콜린산 아연 + 초유 단백질(IgG) + L-아르기닌'),
        activeSpec: `글루콘산/피콜린산 아연(${ageYears <= 3 ? '5~8mg 액상/분말' : '8~12mg 츄어블'}) + 뉴질랜드 초유단백 + L-아르기닌`,
        whyNeeded: `선택하신 [단백질·채소 편식 / 마른 체형] 요인은 성장호르몬 수용체(GHR) 인산화와 미각 세포 재생을 늦춥니다. 만 ${ageYears}세 체중(${weight}kg) 비례 단백질 기질과 아연·초유 성장인자를 동시에 보충해야 키와 적정 몸무게가 함께 자랍니다 (PMID:12036814).`,
        buttonLabelCoupang: `쿠팡에서 '만 ${ageYears}세 맞춤 아연 초유 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '어린이 피콜린산 아연 초유(Colostrum)' 바로 보기 ↗`
      }, buildPinpointUrls(
        ageYears <= 3 ? '유아 액상 아연 시럽 초유 분말 스틱' : '어린이 글루콘산 아연 초유 아르기닌 영양제',
        'Kids Zinc Picolinate Colostrum Chewable',
        '편식 아이 영양사전',
        affConfig
      )));
    } else if (isLateSleep && ageYears >= 7) {
      supplements.push(Object.assign({
        id: 'sleep_magnesium_tartcherry',
        categoryBadge: `🌙 [만 ${ageYears}세 맞춤 2위] 밤 10시 서파수면(SWS) & 성장통 완화`,
        name: '어린이·청소년 연골칼슘·글리시네이트 마그네슘 & 몽모랑시 타트체리 슬립케어',
        activeSpec: `연골·어골칼슘 + 킬레이트 글리시네이트 마그네슘(${Math.round(weight * 4.5)}mg) + 타트체리·L-테아닌`,
        whyNeeded: `선택하신 [늦은 취침 / 야간 혈당] 요인으로 억제된 밤 10시~2시 서파수면 성장호르몬 피크(일일 분비량의 65%)를 복원하고 만 ${ageYears}세 야간 성장통·신경 흥분을 안정시키는 맞춤 배합입니다 (PMID:4300547).`,
        buttonLabelCoupang: `쿠팡에서 '어린이 연골칼슘 마그네슘 타트체리 영양제' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '어린이 글리시네이트 마그네슘 타트체리' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 연골칼슘 어골칼슘 마그네슘 타트체리 비타민D',
        'Kids Magnesium Glycinate Calcium D3 Chewable',
        '수면 호르몬과 아이 키성장',
        affConfig
      )));
    } else {
      // Default #2: Age-tailored Cartilage Calcium & Fish Bone Calcium + Vit D3/K2
      const targetCa = ageYears <= 3 ? 650 : ageYears <= 8 ? 800 : 1100;
      supplements.push(Object.assign({
        id: 'cartilage_calcium',
        categoryBadge: `🦴 [만 ${ageYears}세 맞춤 2위] 성장판 연골 → 뼈 기질 골화 필수 칼슘`,
        name: ageYears <= 3
          ? '영유아 초유·해조칼슘 분말 스틱 & 비타민D3·아연 올인원'
          : (ageYears <= 6
            ? '유아용 오렌지맛 어골·연골칼슘 츄어블 & 폴리감마글루탐산·비타민D3·K2'
            : `초등·청소년 고흡수 어골·연골칼슘(${targetCa}mg) & 폴리감마글루탐산·비타민D3·K2`),
        activeSpec: `연골·어골칼슘(만 ${ageYears}세 일일 목표 ${targetCa}mg, 흡수율 45%) + 폴리감마글루탐산(PGA) + D3·K2(MK-7)`,
        whyNeeded: `만 ${ageYears}세 성장판의 연골세포가 단단한 뼈 기질로 전환될 때, 일반 탄산칼슘(흡수율 22%)보다 생체흡수율이 2배 이상 높고 인체 뼈 구성비(Ca:P=2:1)와 동일한 연골·어골칼슘과 비타민D3·K2가 필수입니다.`,
        buttonLabelCoupang: `쿠팡에서 '만 ${ageYears}세 연골칼슘 어골칼슘 비타민D3' 바로 보기 ↗`,
        buttonLabelIherb: `iHerb에서 '어린이 구연산·킬레이트 칼슘 마그네슘 D3·K2' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 연골칼슘 어골칼슘 폴리감마글루탐산 비타민D3 츄어블',
        'Kids Calcium Citrate Magnesium Vitamin D3 K2 Chewable',
        '소아 골밀도와 칼슘 영양학',
        affConfig
      )));
    }

    // =========================================================================
    // B. PINPOINT PURE PHYSICAL GROWTH & BIOMECHANICS EQUIPMENT (Pure Growth Only)
    // =========================================================================
    const toys = [];

    if (ageYears <= 3) {
      toys.push(Object.assign({
        id: 'balance_trampoline_1_3',
        categoryBadge: '🏃 영유아 전정감각 & 초기 성장판 미세자극 놀이기구',
        name: '유아 실내 밸런스 징검다리 스톤 & 손잡이형 무소음 실내 트램폴린 점핑매트',
        activeSpec: '소뇌 평형감각(전정기관) 발달 + 하지 성장판 수직 압전 자극',
        whyNeeded: `생후 ${ageMonths}개월 유아가 실내에서 안전하게 뛰고 균형을 잡으며 대근육 협응력과 밤 9시 깊은 서파수면(SWS)을 유도하는 영유아 필수 신체 성장 놀잇감입니다.`,
        buttonLabelCoupang: `쿠팡에서 '유아 실내 밸런스 징검다리 스톤 손잡이 트램폴린' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 실내 밸런스 징검다리 스톤 손잡이 트램폴린',
        'Toddler Balance Stepping Stones Indoor Trampoline',
        '영유아 대근육 신체놀이',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'doorway_bar_foamroller_1_3',
        categoryBadge: '🦴 영유아 척추 감압 & 바른 관절 스트레칭 기구',
        name: '무타공 안전 이중잠금 실내 문틀 철봉 (저상형 데드행 바) & 소프트 폼롤러',
        activeSpec: '저녁 20초 매달리기 척추 추간판 감압 + 흉추 C자 정렬 스트레칭',
        whyNeeded: `걸음마를 시작하며 체중 부하를 받는 척추와 고관절을 매달리기로 부드럽게 늘려주어 숨은 키와 균형 잡힌 골격 형성을 돕습니다.`,
        buttonLabelCoupang: `쿠팡에서 '무타공 안전 문틀 철봉 실내 턱걸이봉 소프트 폼롤러' 바로 보기 ↗`
      }, buildPinpointUrls(
        '무타공 안전 문틀 철봉 실내 턱걸이봉 소프트 폼롤러',
        'Toddler Low Doorway Pull Up Bar Foam Roller',
        '영유아 척추 스트레칭',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'soft_roller_mat_1_3',
        categoryBadge: '🦶 성장통 케어 & 하지 근막 이완 마사지 도구',
        name: '어린이 척추·종아리 신전 고밀도 폼롤러 & 충격흡수 롤매트',
        activeSpec: '취침 전 3분 종아리·대퇴근 근막 마사지로 야간 성장통 완화',
        whyNeeded: `낮 동안 활발히 움직이며 긴장된 다리 근육과 성장판 주변 근막을 잠들기 전 이완시켜 성장통으로 밤에 깨는 것을 예방합니다.`,
        buttonLabelCoupang: `쿠팡에서 '어린이 척추 신전 폼롤러 성장통 마사지 롤매트' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 척추 신전 폼롤러 성장통 마사지 롤매트',
        'Kids Soft Foam Roller Growth Massage Mat',
        '성장통 마사지 가이드',
        affConfig
      )));
    } else if (ageYears <= 5) {
      toys.push(Object.assign({
        id: 'doorway_bar_4_5',
        categoryBadge: '🦴 척추 추간판 감압(+1.8cm 복원) 1순위 운동 기구',
        name: '무타공 안전 이중잠금 실내 문틀 철봉 (어린이 데드행 바)',
        activeSpec: '저녁 30초×3세트 패시브 데드행 척추 견인 + 숨은 키 복원',
        whyNeeded: `만 ${ageYears}세(${ageMonths}개월) 성장기 아이가 중력에 의해 눌린 척추 디스크 수분을 매달리기로 즉시 복원해 숨은 키 1.8cm를 되찾아줍니다 (PMID:30897641).`,
        buttonLabelCoupang: `쿠팡에서 '무타공 안전 문틀 철봉 실내 데드행 턱걸이봉' 바로 보기 ↗`
      }, buildPinpointUrls(
        '무타공 안전 문틀 철봉 실내 데드행 턱걸이봉',
        'Doorway Pull Up Bar Kids Dead Hang',
        '어린이 척추 감압 운동',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'indoor_trampoline_4_5',
        categoryBadge: '⚡ 성장판 볼프의 법칙(Wolff\'s Law) 점핑 운동 기구',
        name: '층간소음 방어 어린이 무소음 실내 트램폴린 점핑매트 (고탄성 리바운더)',
        activeSpec: '체중 1.8배 수직 미세하중 성장판 자극 (볼프의 법칙)',
        whyNeeded: `하루 15분 규칙적인 수직 점핑은 대퇴골·경골 성장판 연골세포에 압전 신호를 전달해 골 성장 속도를 약 +1.5cm/yr 가속합니다 (PMID:19734332).`,
        buttonLabelCoupang: `쿠팡에서 '어린이 무소음 실내 트램폴린 점핑매트 손잡이형' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 무소음 실내 트램폴린 점핑매트 손잡이형',
        'Kids Indoor Fitness Rebounder Trampoline Silent',
        '아이 키 크는 점프 스트레칭',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'foamroller_spine_4_5',
        categoryBadge: '📏 흉추 신전 & 거북목 방어 척추 스트레칭 도구',
        name: '어린이 척추 신전 스트레칭 EPP 폼롤러 & 척추 기립근 교정 세트',
        activeSpec: '취침 전 3분 흉추 펴기 + 골반·장요근 정렬 스트레칭',
        whyNeeded: `스마트폰이나 책상에서 굽어진 등을 펴주고 척추 기립근을 이완시켜 바른 자세와 호르몬 순환을 극대화합니다.`,
        buttonLabelCoupang: `쿠팡에서 '어린이 척추 신전 스트레칭 EPP 폼롤러' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 척추 신전 스트레칭 EPP 폼롤러',
        'Kids Spine Extension EPP Foam Roller',
        '척추 바른자세 스트레칭',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'jumprope_digital_4_5',
        categoryBadge: '🏃 성장판 압전 자극 실내외 무소음 카운터 줄넘기',
        name: '줄 꼬임 방지 어린이 디지털 카운터 줄넘기 (무소음 노라인 에어볼 겸용)',
        activeSpec: '발목·무릎 성장판 미세하중 자극 + 일일 점프 300회 카운팅',
        whyNeeded: `실내에서도 층간소음 없이 에어볼로 수직 점프를 채워 성장판 연골세포의 분열과 골 형성을 자극합니다.`,
        buttonLabelCoupang: `쿠팡에서 '어린이 디지털 카운터 줄넘기 무소음 노라인' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 디지털 카운터 줄넘기 무소음 노라인',
        'Kids Digital Jump Rope Cordless Ropeless',
        '어린이 성장 줄넘기 운동',
        affConfig
      )));
    } else if (ageYears <= 8) {
      toys.push(Object.assign({
        id: 'doorway_bar_6_8',
        categoryBadge: '🦴 초등 척추 감압 & 바른 체형 교정 1순위 운동 기구',
        name: '무타공 안전 이중잠금 실내 문틀 철봉 (어린이 데드행 바)',
        activeSpec: '저녁 30초×3세트 패시브 데드행 척추 디스크 감압',
        whyNeeded: `초등 입학 후 책상에 앉아 있는 시간이 늘어나면서 압박받는 척추 추간판을 견인해 숨은 키 +1.8cm를 복원합니다.`,
        buttonLabelCoupang: `쿠팡에서 '무타공 안전 문틀 철봉 실내 데드행 턱걸이봉' 바로 보기 ↗`
      }, buildPinpointUrls(
        '무타공 안전 문틀 철봉 실내 데드행 턱걸이봉',
        'Doorway Pull Up Bar Kids Dead Hang Posture',
        '초등 척추 감압 운동법',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'trampoline_rebounder_6_8',
        categoryBadge: '⚡ 성장판 미세하중 플라이오메트릭 점핑 기구',
        name: '초등 층간소음 방어 고탄성 무소음 실내 트램폴린 점핑매트',
        activeSpec: '하루 15분 인터벌 점핑 성장판 수직 자극 (볼프의 법칙)',
        whyNeeded: `날씨와 상관없이 거실에서 15분 점핑으로 성장호르몬 분비와 심폐지구력을 폭발적으로 끌어올립니다 (PMID:19734332).`,
        buttonLabelCoupang: `쿠팡에서 '초등 층간소음 무소음 실내 트램폴린 점핑매트' 바로 보기 ↗`
      }, buildPinpointUrls(
        '초등 층간소음 무소음 실내 트램폴린 점핑매트',
        'Kids Silent Rebounder Trampoline Jump Mat',
        '키 성장 점핑 홈트레이닝',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'jumprope_digital_6_8',
        categoryBadge: '🏃 초등 성장판 수직 압전 자극 디지털 카운터 줄넘기',
        name: '초등 속도조절 디지털 카운터 줄넘기 (노라인 추 & 로프 겸용)',
        activeSpec: '성장판 수직 압전 자극 + 일일 500회 목표 달성 카운팅',
        whyNeeded: `초등 학교 줄넘기 급수제 대비는 물론 성장판에 가장 효과적인 수직 중력 하중을 전달해 연간 성장속도를 극대화합니다.`,
        buttonLabelCoupang: `쿠팡에서 '초등 학생용 디지털 카운터 줄넘기 노라인 호환' 바로 보기 ↗`
      }, buildPinpointUrls(
        '초등 학생용 디지털 카운터 줄넘기 노라인 호환',
        'Digital Counting Jump Rope Kids Cordless',
        '초등 줄넘기 급수제 연습',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'foamroller_spine_6_8',
        categoryBadge: '📏 거북목·굽은 등 방어 흉추 신전 스트레칭 도구',
        name: '고밀도 EPP 척추 신전 & 흉추 교정 폼롤러 (성장판 스트레칭)',
        activeSpec: '취침 전 3분 흉추 신전 스트레칭 + 하지 근막 이완',
        whyNeeded: `굽은 등과 거북목을 바르게 펴주고 다리 근육의 피로를 풀어주어 야간 성장통 없이 깊은 숙면을 돕습니다.`,
        buttonLabelCoupang: `쿠팡에서 '고밀도 EPP 척추 신전 폼롤러 거북목 스트레칭' 바로 보기 ↗`
      }, buildPinpointUrls(
        '고밀도 EPP 척추 신전 폼롤러 거북목 스트레칭',
        'High Density EPP Foam Roller Spine Alignment',
        '바른 자세 폼롤러 스트레칭',
        affConfig
      )));
    } else {
      // Age 9+ (Pre-puberty to Adolescence)
      toys.push(Object.assign({
        id: 'deadhang_foamroller_9_plus',
        categoryBadge: '🦴 척추 추간판 감압(+1.8cm 복원) & 성장판 스트레칭 기구',
        name: '무타공 안전 잠금 실내 문틀 철봉 (데드행 바) & 척추 신전 EPP 폼롤러 세트',
        activeSpec: '저녁 30초×3세트 패시브 데드행 척추 견인 + 흉추 가동성 복원',
        whyNeeded: `만 ${ageYears}세(${height}cm) 아동·청소년이 하루 종일 앉아 있으면서 눌린 척추 디스크 수분을 저녁 취침 전 90초 매달리기(Dead Hang)와 폼롤러 신전으로 즉각 복원해 숨은 키 1.5~2.2cm를 되찾아줍니다 (PMID:30897641).`,
        buttonLabelCoupang: `쿠팡에서 '무타공 안전 잠금 문틀 철봉 실내 턱걸이봉 폼롤러' 바로 보기 ↗`
      }, buildPinpointUrls(
        '무타공 안전 잠금 문틀 철봉 실내 데드행 턱걸이봉',
        'Doorway Pull Up Bar No Screw Foam Roller Spine',
        '척추 교정 스트레칭 가이드',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'jumprope_digital_9_plus',
        categoryBadge: '⚡ 급성장기(PHV) 성장판 폭발 자극 고속 베어링 카운터 줄넘기',
        name: '청소년 고속 베어링 디지털 카운터 줄넘기 & 무소음 점핑매트 세트',
        activeSpec: '성장판 닫히기 전 급성장기 매일 1,000회 수직 점프 카운팅',
        whyNeeded: `사춘기 급성장 골든타임에 성장판 연골세포 분열을 최대치로 자극하는 필수 운동 기구입니다.`,
        buttonLabelCoupang: `쿠팡에서 '청소년 고속 베어링 디지털 카운터 줄넘기 실내 점핑매트' 바로 보기 ↗`
      }, buildPinpointUrls(
        '청소년 고속 베어링 디지털 카운터 줄넘기 실내 점핑매트',
        'High Speed Bearing Digital Jump Rope Kids',
        '사춘기 성장판 점프 운동',
        affConfig
      )));

      toys.push(Object.assign({
        id: 'trampoline_heavy_9_plus',
        categoryBadge: '🏃 고중량 무소음 실내 피트니스 리바운더 트램폴린',
        name: '고중량 지지 8각형 무소음 실내 피트니스 리바운더 트램폴린',
        activeSpec: '관절 충격 없는 고강도 점핑 인터벌 + 체지방률 관리',
        whyNeeded: `무릎과 발목 관절에 무리 없이 성장호르몬 분비를 촉진하고 비만·성조숙증을 예방하는 홈트레이닝 기구입니다.`,
        buttonLabelCoupang: `쿠팡에서 '고중량 무소음 실내 트램폴린 리바운더 점핑매트' 바로 보기 ↗`
      }, buildPinpointUrls(
        '고중량 무소음 실내 트램폴린 리바운더 점핑매트',
        'Heavy Duty Silent Fitness Trampoline Rebounder',
        '청소년 홈트레이닝 리바운더',
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

    const eduToursList = curateEducationalTours(p, affConfig).map((t) => Object.assign({}, t, {
      name: t.titleKo || t.categoryKo,
      mrtUrl: t.myrealtripUrl
    }));
    const learningToolsList = attachCurated(curatePillar2LearningTools(p, affConfig));

    return {
      supplements: attachCurated(supplements),
      toys: attachCurated(toys),
      books: attachCurated(books),
      learningTools: learningToolsList,
      eduTours: eduToursList,
      tours: eduToursList,
      regionalTickets: curateRegionalAgeTickets(p, affConfig),
      lifecycleRoadmap: getSequentialLifecycleRoadmap(ageYears),
      autoStage: autoDetectGrowthStage(ageMonths, p.gender, recent6m)
    };
  }

  /**
   * 4-B1. Regional × Age-Band (만 1~3세 / 4~6세 / 7~9세 / 10~13세 / 14세+) Real Popular Museum, Science Center & Experience Ticket Curator
   * Combines the 40 regional courses with live MyRealTrip short links (mylinkId: 6226316), Klook Affiliate (aid=140161&aff_adid=1514603),
   * and Adpick KKday (affid=4d31d3&offer=b796d) + 5-tier age-band developmental viewing guides.
   */
  function curateRegionalAgeTickets(profile = {}, affConfig = {}) {
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const region = String(profile.region || '서울 강남·서초·송파');
    const cogAxes = Array.isArray(profile.cognitiveAxes) ? profile.cognitiveAxes : ['science_nature'];
    const cfg = Object.assign({}, DEFAULT_AFF, affConfig || {});
    const klookAid = encodeURIComponent(cfg.klookAid || DEFAULT_AFF.klookAid || '140161');
    const klookAdId = encodeURIComponent(cfg.klookAdId || DEFAULT_AFF.klookAdId || '1514603');
    const adpickAff = encodeURIComponent(cfg.adpickAffId || DEFAULT_AFF.adpickAffId || '4d31d3');

    // Load 40-course regional catalog
    let catalogCourses = [];
    if (typeof window !== 'undefined' && window.KIDSFIT_CATALOG_DATA && Array.isArray(window.KIDSFIT_CATALOG_DATA.courses)) {
      catalogCourses = window.KIDSFIT_CATALOG_DATA.courses;
    } else if (typeof global !== 'undefined' && global.KIDSFIT_CATALOG_DATA && Array.isArray(global.KIDSFIT_CATALOG_DATA.courses)) {
      catalogCourses = global.KIDSFIT_CATALOG_DATA.courses;
    } else if (typeof require === 'function') {
      try {
        const catJson = require('../data/curation-catalog.json');
        if (catJson && Array.isArray(catJson.courses)) catalogCourses = catJson.courses;
      } catch (_) {}
    }

    const ageKey = ageYears <= 3 ? 'age_1_3' : ageYears <= 6 ? 'age_4_6' : ageYears <= 9 ? 'age_7_9' : ageYears <= 13 ? 'age_10_13' : 'age_14_plus';
    const ageBandLabelKo = ageYears <= 3 ? '만 1~3세 (오감·촉각·유모차 무장애 코스)'
      : ageYears <= 6 ? '만 4~6세 (입체 조작·호기심 체험 코스)'
      : ageYears <= 9 ? '만 7~9세 (초등 교과 연계·하브루타 도슨트)'
      : ageYears <= 13 ? '만 10~13세 (심화 과학·역사 인과 탐구 코스)'
      : '만 14세+ (진로·융합 비평 & 뇌 피로 힐링 코스)';

    // Map cognitive axes / interest to preferred themeKey priority
    let preferredThemes = ['space_science', 'dino_nature', 'history_tradition', 'art_making', 'music_musical'];
    if (ageYears <= 3) {
      preferredThemes = ['dino_nature', 'art_making', 'music_musical', 'space_science', 'history_tradition'];
    } else if (ageYears <= 6) {
      preferredThemes = ['dino_nature', 'space_science', 'art_making', 'music_musical', 'history_tradition'];
    } else if (cogAxes.includes('sensory_arts')) {
      preferredThemes = ['art_making', 'music_musical', 'history_tradition', 'space_science', 'dino_nature'];
    } else if (cogAxes.includes('language_reading')) {
      preferredThemes = ['history_tradition', 'art_making', 'space_science', 'dino_nature', 'music_musical'];
    }

    const regionalPool = catalogCourses.filter(c => c.region === region);
    const activePool = regionalPool.length > 0 ? regionalPool : catalogCourses.slice(0, 5);

    const sorted = activePool.slice().sort((a, b) => {
      const idxA = preferredThemes.indexOf(a.themeKey);
      const idxB = preferredThemes.indexOf(b.themeKey);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    const THEME_BADGE_KO = {
      space_science: '🚀 과학관·우주·로봇 체험',
      dino_nature: '🦖 자연사·아쿠아리움·생태',
      history_tradition: '🏛️ 역사박물관·궁궐·유적 도슨트',
      art_making: '🎨 어린이미술관·드로잉·전시',
      music_musical: '🎵 어린이 공연·클래식·문화원'
    };

    return sorted.slice(0, 3).map((c, idx) => {
      const q = c.klookQuery || (c.destination || '').split('&')[0].trim();
      const kSite = `https://www.klook.com/ko/search/result/?query=${encodeURIComponent(q)}`;
      const klookUrl = `https://affiliate.klook.com/redirect?aid=${klookAid}&aff_adid=${klookAdId}&k_site=${encodeURIComponent(kSite)}`;
      const kkdayTarget = `https://www.kkday.com/ko/product/productlist?keyword=${encodeURIComponent(q)}`;
      const adpickKkdayUrl = `https://adpick.co.kr/apis/goshopping.php?affid=${adpickAff}&offer=b796d&url=${encodeURIComponent(kkdayTarget)}`;
      const mrtUrl = c.mrtShortUrl || 'https://myrealt.rip/xctNfd';
      const ageTip = (c.ageBandGuides && c.ageBandGuides[ageKey])
        ? c.ageBandGuides[ageKey]
        : `${c.destination} — 만 ${ageYears}세 눈높이 맞춤 관람 및 체험 코스`;

      return {
        id: c.id,
        rankBadgeKo: idx === 0 ? '🥇 내 지역 1순위 맞춤 티켓·코스' : idx === 1 ? '🥈 내 지역 2순위 연계 코스' : '🥉 내 지역 3순위 주말 나들이',
        region: c.region,
        ageBandLabelKo,
        themeBadgeKo: THEME_BADGE_KO[c.themeKey] || '🎫 지역 대표 체험',
        destination: c.destination,
        summary: c.summary,
        ageSpecificGuide: ageTip,
        viewPoints: Array.isArray(c.viewPoints) ? c.viewPoints : [],
        bookingTips: c.bookingTips || '',
        route: c.route || '',
        myrealtripUrl: mrtUrl,
        klookUrl,
        adpickKkdayUrl
      };
    });
  }

  /**
   * 4-B2. 5-Tier Age-Band (만 1~3세 / 4~6세 / 7~9세 / 10~13세 / 14세+) Signature Domestic & Overseas Educational Travel Curator
   * Powered 100% by MyRealTrip Partner API short links (mylinkId: 6226316), Klook Affiliate (aid=140161&aff_adid=1514603),
   * and Adpick Shopping Mate KKday/11st (affid=4d31d3).
   */
  function curateEducationalTours(profile = {}, affConfig = {}) {
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const region = String(profile.region || '서울 강남·서초·송파');
    const cogAxes = Array.isArray(profile.cognitiveAxes) ? profile.cognitiveAxes : ['science_nature'];
    const cfg = Object.assign({}, DEFAULT_AFF, affConfig || {});
    const cpTag = encodeURIComponent(cfg.coupang || DEFAULT_AFF.coupang);
    const lpId = encodeURIComponent(cfg.linkprice || DEFAULT_AFF.linkprice);
    const klookAid = encodeURIComponent(cfg.klookAid || DEFAULT_AFF.klookAid || '140161');
    const klookAdId = encodeURIComponent(cfg.klookAdId || DEFAULT_AFF.klookAdId || '1514603');
    const mrtMylinkId = encodeURIComponent(cfg.myrealtripMylinkId || DEFAULT_AFF.myrealtripMylinkId || '6226316');
    const adpickAff = encodeURIComponent(cfg.adpickAffId || DEFAULT_AFF.adpickAffId || '4d31d3');

    const makeTourUrls = (cpQuery, yesQuery, tourQuery, mrtShortUrl, klookDestUrl) => {
      const cpUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(cpQuery)}&channel=user&lptag=${cpTag}`;
      const yesTarget = `https://www.yes24.com/Product/Search?domain=ALL&query=${encodeURIComponent(yesQuery)}`;
      const yesUrl = `https://click.linkprice.com/click.php?m=yes24&a=${lpId}&l=9999&l_cd1=3&l_cd2=0&tu=${encodeURIComponent(yesTarget)}`;
      const myrealtripUrl = mrtShortUrl || `https://www.myrealtrip.com/offers?q=${encodeURIComponent(tourQuery)}&mylink_id=${mrtMylinkId}&utm_source=mktpartner`;
      const kSite = klookDestUrl || `https://www.klook.com/ko/search/result/?query=${encodeURIComponent(tourQuery)}`;
      const klookUrl = `https://affiliate.klook.com/redirect?aid=${klookAid}&aff_adid=${klookAdId}&k_site=${encodeURIComponent(kSite)}`;
      const kkdayTarget = `https://www.kkday.com/ko/product/productlist?keyword=${encodeURIComponent(tourQuery)}`;
      const adpickKkdayUrl = `https://adpick.co.kr/apis/goshopping.php?affid=${adpickAff}&offer=b796d&url=${encodeURIComponent(kkdayTarget)}`;
      return {
        coupangUrl: cpUrl,
        yes24Url: yesUrl,
        naverTourUrl: myrealtripUrl,
        myrealtripUrl,
        klookUrl,
        adpickKkdayUrl
      };
    };

    // Band 1: 만 1~3세 (영유아 오감·아쿠아리움·실내동물원·유모차 생태 목장)
    if (ageYears <= 3) {
      return [
        Object.assign({
          badgeKo: '🏆 만 1~3세 시그니처 1위 · 대형 아쿠아리움 수중 시각추적',
          badgeEn: '🏆 Age 1–3 Pick #1 · Aquarium Sensory',
          categoryKo: `🐠 [${region} 연계] 코엑스·일산·부산·여수·제주 아쿠아리움 패밀리 입장권 & 오감 바다 플랩북`,
          categoryEn: 'National Aquarium Family Pass & Toddler Marine Flap Book',
          titleKo: '대형 수조 물고기 시각 추적 워킹투어 & 출발 전 만져보는 해양생물 사운드·플랩북',
          titleEn: 'Aquarium Family Ticket & Interactive Marine Sound/Flap Book',
          descKo: '만 1~3세 영유아는 날씨 영향을 받지 않는 실내 아쿠아리움의 대형 수조 빛깔과 물고기 움직임을 눈으로 쫓으며 시각피질과 어휘 폭발기 시냅스가 가장 안전하고 강력하게 자극됩니다.',
          missionKo: '💬 아쿠아리움 부모 대화 미션: "우와~ 가오리가 날개처럼 헤엄치네! 가오리 배는 무슨 색깔일까?"'
        }, makeTourUrls('유아 바다생물 사운드북 아쿠아리움 스티커북 플랩북', '어스본 요리조리 열어보는 바다', '코엑스 아쿠아리움', 'https://myrealt.rip/xc4l47', 'https://www.klook.com/ko/search/result/?query=%EC%BD%94%EC%97%91%EC%8A%A4+%EC%95%84%EC%BF%A0%EC%95%84%EB%A6%AC%EC%9B%80')),
        Object.assign({
          badgeKo: '✨ 만 1~3세 시그니처 2위 · 실내 애니멀 테마파크 먹이주기',
          badgeEn: '✨ Age 1–3 Pick #2 · Indoor Animal Park',
          categoryKo: '🐾 주렁주렁 실내동물원(하남·동탄·경주·타임스퀘어) & 집게 먹이주기 소근육 체험',
          categoryEn: 'Joolung Joolung Indoor Animal Theme Park & Fine Motor Feeding',
          titleKo: '온순한 소동물 가까이 관찰·먹이주기 체험권 & 유아 동물 촉감책·미아방지 배낭',
          titleEn: 'Indoor Animal Park Ticket & Toddler Touch-and-Feel Animal Book',
          descKo: '미세먼지나 더위·추위 걱정 없이 유모차로 이동하며 작은 새와 초식동물에게 먹이를 건네주는 과정이 만 1~3세 아이의 손끝 조절력과 정서적 안정감을 동시에 키워줍니다.',
          missionKo: '💬 동물원 부모 대화 미션: "작은 새가 모이를 콕콕 먹네! 보들보들 깃털은 어떤 느낌일까?"'
        }, makeTourUrls('유아 동물 촉감책 아기 미아방지 가방', '아기 동물 촉감 그림책', '주렁주렁 실내 동물원', 'https://myrealt.rip/xc4wa0', 'https://www.klook.com/ko/search/result/?query=%EC%A3%BC%EB%A0%81%EC%A3%BC%EB%A0%81')),
        Object.assign({
          badgeKo: '💎 만 1~3세 시그니처 3위 · 무장애 초원 양떼·알파카 목장',
          badgeEn: '💎 Age 1–3 Pick #3 · Nature Ranch Walk',
          categoryKo: '🌿 강원 홍천 알파카월드 · 대관령 양떼목장 · 제주 스누피가든 잔디 산책 & 비타민D 합성',
          categoryEn: 'Alpaca World / Sheep Ranch & Snoopy Garden Stroller-Friendly Tour',
          titleKo: '푸른 초원 잔디밭 걷기·동물 교감 투어 & 유아 생태 돋보기·나들이 모자 세트',
          titleEn: 'Nature Ranch Family Ticket & Toddler Outdoor Explorer Set',
          descKo: '낮 시간 30분 이상의 자연광 노출은 영유아 칼슘 흡수를 돕는 비타민D 합성과 밤 9시 멜라토닌 분비를 촉진해 밤중 각성 없이 통잠을 자게 해줍니다.',
          missionKo: '💬 초원 산책 부모 대화 미션: "복슬복슬 양털이 구름 같네! 풀 냄새를 코로 킁킁 맡아볼까?"'
        }, makeTourUrls('유아 나들이 가방 어린이 곤충 관찰 돋보기', '유아 자연관찰 동물 그림책', '홍천 알파카월드', 'https://myrealt.rip/xc4Y3a', 'https://www.klook.com/ko/search/result/?query=%EC%95%8C%ED%8C%8C%EC%B9%B4%EC%9B%94%EB%93%9C'))
      ];
    }

    // Band 2: 만 4~6세 (유아기 사파리·과학관 유아체험관·공룡 화석·테마파크)
    if (ageYears <= 6) {
      return [
        Object.assign({
          badgeKo: '🏆 만 4~6세 시그니처 1위 · 사파리 생태 탐험 & 대근육 자극',
          badgeEn: '🏆 Age 4–6 Pick #1 · Safari & Zoo Expedition',
          categoryKo: `🦁 [${region} 연계] 에버랜드 로스트밸리·판다월드 & 대전 오월드·대구 네이처파크 사파리 투어`,
          categoryEn: 'Everland Lost Valley Safari & Nature Park Family Pass',
          titleKo: '초식·육식동물 생태 비교 사파리 종일권 & 어린이 동물 대백과·쌍안경 탐험 세트',
          titleEn: 'Safari Theme Park Pass & Kids Binoculars Animal Encyclopedia Set',
          descKo: '만 4~6세는 동물의 생김새와 서식지 이유("기린은 왜 목과 혀가 길까?")를 추론하며 전두엽 인과 사고가 열리는 시기입니다. 야외 걷기로 하지 성장판에도 최적의 자극을 줍니다.',
          missionKo: '💬 사파리 하브루타 미션: "기린과 얼룩말은 왜 줄무늬와 점무늬 모양이 서로 다를까?"'
        }, makeTourUrls('어린이 쌍안경 동물 백과사전 피규어 세트', '유아 동물 대백과 도감', '에버랜드 종일권', 'https://myrealt.rip/xctSa3', 'https://www.klook.com/ko/search/result/?query=%EC%97%90%EB%B2%84%EB%9E%9C%EB%93%9C')),
        Object.assign({
          badgeKo: '✨ 만 4~6세 시그니처 2위 · 국립과학관 어린이관 & 공룡 탐사',
          badgeEn: '✨ Age 4–6 Pick #2 · Kids Science & Dinosaur Museum',
          categoryKo: '🦖 서대문자연사박물관 · 국립과천과학관 유아체험관 · 고성 공룡박물관 탐험 코스',
          categoryEn: 'Natural History Dinosaur Museum & National Science Center Kids Zone',
          titleKo: '실물 공룡 화석·기초 물리 작동 체험 & 집에서 발굴하는 공룡 화석 발굴 키트',
          titleEn: 'Dinosaur & Science Museum Tour + Home Fossil Digging Kit',
          descKo: '거대한 공룡 골격의 스케일을 체감하고 도르래·기어·물길 장치를 손으로 직접 돌려보는 체험이 두정엽 3차원 공간지각력을 폭발적으로 깨워줍니다.',
          missionKo: '💬 박물관 하브루타 미션: "티라노사우루스의 이빨은 뾰족한데 브라키오사우루스는 왜 평평할까?"'
        }, makeTourUrls('어린이 공룡 화석 발굴 키트 공룡 뼈대 조립', '어스본 공룡 대백과 플랩북', '서대문자연사박물관 투어', 'https://myrealt.rip/xctR7f', 'https://www.klook.com/ko/search/result/?query=%EA%B3%BC%ED%95%99%EA%B4%80')),
        Object.assign({
          badgeKo: '💎 만 4~6세 시그니처 3위 · 예술마을 공방 & 어린이박물관',
          badgeEn: '💎 Age 4–6 Pick #3 · Art Village & Children\'s Museum',
          categoryKo: '🎨 국립중앙박물관 어린이박물관 · 파주 헤이리 예술마을 · 현대어린이책미술관(MOKA)',
          categoryEn: 'National Children\'s Museum & Heyri Art Village Hands-on Workshop',
          titleKo: '손끝으로 빚고 만지는 도자기·미술·전통문화 체험 & 창의 미술·클레이 워크북',
          titleEn: 'Kids Art/Pottery Workshop Ticket & Creative Clay Activity Set',
          descKo: '취학 전 아이가 자기 손으로 흙을 빚고 색을 섞어 작품을 완성해 보는 경험은 소근육 정교성과 자기효능감(Self-Efficacy)을 동시에 높여줍니다.',
          missionKo: '💬 미술관 하브루타 미션: "오늘 네가 만든 작품에 이름을 붙여준다면 어떤 제목이 좋을까?"'
        }, makeTourUrls('어린이 도자기 클레이 만들기 키트 워셔블 물감', '유아 미술 놀이 그림책', '파주 헤이리 예술마을 체험', 'https://myrealt.rip/xctX9c', 'https://www.klook.com/ko/search/result/?query=%ED%8C%8C%EC%A3%BC+%ED%97%A4%EC%9D%B4%EB%A6%AC'))
      ];
    }

    // Band 3: 만 7~9세 (초등 저학년 역사 도슨트·과학관 물리탐험·제주 생태지질)
    if (ageYears <= 9) {
      return [
        Object.assign({
          badgeKo: '🏆 만 7~9세 시그니처 1위 · 유네스코 역사 도슨트 가족여행',
          badgeEn: '🏆 Age 7–9 Pick #1 · UNESCO Heritage Docent Tour',
          categoryKo: '👑 경주 신라천년(국립경주박물관·첨성대·대릉원) & 공주·부여 백제 · 경복궁 소그룹 어린이 해설투어',
          categoryEn: 'Gyeongju, Buyeo & Gyeongbokgung Kids Historical Docent Tour',
          titleKo: '초등 눈높이 전문 도슨트 역사 투어 & 출발 전 읽는 한국사 유물 탐구 도감',
          titleEn: 'Kids Historical Docent Tour & Korean Heritage Field Guidebook',
          descKo: '초등 사회·한국사 교과가 본격화되기 전 경주·공주·경복궁을 도슨트 선생님과 걸으며 유물의 과학적 원리를 추론해보면 역사적 인과 사고력과 장기 기억이 3배 깊어집니다.',
          missionKo: '💬 여행지 하브루타 미션: "첨성대는 왜 네모 모양이 아니라 아래가 넓은 원기둥 모양으로 쌓았을까?"'
        }, makeTourUrls('초등 경주 역사 여행 가이드북 한국사 유물 워크북', '아이와 경주 여행 역사 도감', '경주 어린이 도슨트 역사 투어', 'https://myrealt.rip/xc4b13', 'https://www.klook.com/ko/search/result/?query=%EA%B2%BD%EC%A3%BC+%ED%88%AC%EC%96%B4')),
        Object.assign({
          badgeKo: '✨ 만 7~9세 시그니처 2위 · 국립과학관 물리·우주 탐험대',
          badgeEn: '✨ Age 7–9 Pick #2 · National Science & Space Expedition',
          categoryKo: '🚀 국립과천과학관 물리·우주탐험대 & 대전 국립중앙과학관·서울시립과학관 도슨트 투어',
          categoryEn: 'Gwacheon & Daejeon National Science Museum Inquiry Expedition',
          titleKo: '과학관 교과 연계 실험 해설 투어 & 어린이 굴절 천체망원경·과학 탐구 일지',
          titleEn: 'Science Museum Docent Tour & Portable Astronomical Telescope',
          descKo: `우리 아이가 선택한 [${cogAxes.includes('science_nature') ? '과학·자연 원리 탐구' : '전두엽 인과 추론'}] 영역과 직결되는 코스로, 로켓 작용-반작용·자기부상·천체 관측을 직접 체험하며 이공계 사고력을 깨웁니다.`,
          missionKo: '💬 과학관 하브루타 미션: "만약 달에서 점프를 한다면 지구에서보다 몇 배나 더 높이 뛸 수 있을까?"'
        }, makeTourUrls('어린이 천체망원경 초등 과학관 체험 학습 워크북', '초등 과학관 박물관 탐구 도감', '국립과천과학관 초등 물리탐험대', 'https://myrealt.rip/xc4c05', 'https://www.klook.com/ko/search/result/?query=%EA%B3%BC%ED%95%99%EA%B4%80')),
        Object.assign({
          badgeKo: '💎 만 7~9세 시그니처 3위 · 제주 화산지질 & 해양생태 가족탐사',
          badgeEn: '💎 Age 7–9 Pick #3 · Jeju Volcanic Geopark & Aquarium',
          categoryKo: '🌋 제주 아쿠아플라넷·스누피가든·성산일출봉 지질트레킹 & 여수 해양과학 가족여행',
          categoryEn: 'Jeju Aqua Planet, Snoopy Garden & Volcanic Geopark Family Pass',
          titleKo: '제주 투어패스·아쿠아리움 할인권 & 어린이 아웃도어 쌍안경·생태 탐험 도감',
          titleEn: 'Jeju Family Tour Pass & Kids Outdoor Ecology Guidebook',
          descKo: '화산 지형과 해안 생태계를 직접 걸으며 하루 8,000보 이상 하지 성장판을 건강하게 자극하고, 가족과 함께 자연 현상의 원리를 대화로 풀어보는 최고의 방학 코스입니다.',
          missionKo: '💬 제주 하브루타 미션: "제주도의 현무암 돌에는 왜 구멍이 송송 뚫려 있고 비가 와도 물이 고이지 않을까?"'
        }, makeTourUrls('어린이 쌍안경 나침반 자연관찰 탐험 키트', '제주도 어린이 생태 지질 여행책', '제주 아쿠아플라넷 스누피가든', 'https://myrealt.rip/xctjf8', 'https://www.klook.com/ko/search/result/?query=%EC%A0%9C%EC%A3%BC+%EC%95%84%EC%BF%A0%EC%95%84%ED%94%8C%EB%9E%98%EB%8B%9B'))
      ];
    }

    // Band 4: 만 10~13세 (초등 고학년·중1 궁궐·수원화성 심화 도슨트, KAIST 과학관, 도쿄/오사카 과학·문화 해외탐방)
    if (ageYears <= 13) {
      return [
        Object.assign({
          badgeKo: '🏆 만 10~13세 시그니처 1위 · 궁궐·수원화성 심화 역사 도슨트',
          badgeEn: '🏆 Age 10–13 Pick #1 · Royal Palace & Hwaseong Deep Docent',
          categoryKo: '🏛️ 서울 경복궁·창덕궁 · 국립중앙박물관 · 수원화성 거중기 과학·역사 심화 해설투어',
          categoryEn: 'Seoul Royal Palaces, National Museum & Suwon Hwaseong Deep-Dive Tour',
          titleKo: '초등 고학년·중등 소그룹 심화 도슨트 투어 & 한국사 논술·유물 분석 워크북',
          titleEn: 'Upper-Elementary Historical Docent Tour & Essay Workbook',
          descKo: '배외측 전전두엽(DLPFC)이 급성장하는 만 10~13세 시기에 정조의 수원화성 거중기 과학 원리와 조선 왕실의 역사적 의사결정을 현장에서 토론하면 강력한 메타인지가 형성됩니다.',
          missionKo: '💬 역사 하브루타 미션: "정조가 수원화성을 지을 때 거중기와 벽돌을 도입한 과학적·경제적 이유는 무엇이었을까?"'
        }, makeTourUrls('초등 고학년 청소년 역사 논술 한국사 탐구 도서', '수원화성 경복궁 역사 기행 청소년 필독서', '경복궁 역사체험 가족여행 도슨트 투어', 'https://myrealt.rip/xc4f7a', 'https://www.klook.com/ko/search/result/?query=%EA%B2%BD%EB%B3%B5%EA%B6%81+%ED%88%AC%EC%96%B4')),
        Object.assign({
          badgeKo: '✨ 만 10~13세 시그니처 2위 · 대덕연구단지 국립중앙과학관 & 캠퍼스',
          badgeEn: '✨ Age 10–13 Pick #2 · Daedeok Science Town & STEM Tour',
          categoryKo: '🔬 대전 국립중앙과학관(창의나래관·천체관) · KAIST 캠퍼스 진로 탐방 & 서울 과학관 투어',
          categoryEn: 'Daejeon National Science Museum & KAIST STEM Career Exploration',
          titleKo: '과학관 심화 해설 투어 & 청소년 과학 탐구 보고서 노트·광학 현미경 세트',
          titleEn: 'National Science Museum Deep Tour & STEM Research Journal',
          descKo: '사춘기 진입기 아이들에게 막연한 공부 잔소리 대신 국내 최고 과학관과 대학 캠퍼스를 함께 걸으며 미래의 내 모습을 그려보게 하면 내적 학습 동기가 깨어납니다.',
          missionKo: '💬 과학관 하브루타 미션: "오늘 본 미래 과학기술 중 10년 뒤 네가 직접 연구해보고 싶은 분야는 무엇이니?"'
        }, makeTourUrls('청소년 과학 탐구 보고서 코넬 노트 현미경', '십대를 위한 미래 과학 진로 교양서', '대전 국립중앙과학관 도슨트 투어', 'https://myrealt.rip/xc4g4e', 'https://www.klook.com/ko/search/result/?query=%EB%8C%80%EC%A0%84+%EA%B3%BC%ED%95%99%EA%B4%80')),
        Object.assign({
          badgeKo: '💎 만 10~13세 시그니처 3위 · 방학 해외 과학박물관·테마파크 가족연수',
          badgeEn: '💎 Age 10–13 Pick #3 · Tokyo/Osaka/Singapore Science & Theme Tour',
          categoryKo: '✈️ 도쿄 국립과학박물관·디즈니 / 오사카 과학관·유니버설(USJ) / 싱가포르 사이언스센터 가족투어',
          categoryEn: 'Tokyo Miraikan / Osaka USJ / Singapore Science Centre Family Pass',
          titleKo: '해외 과학관·테마파크 패스·공항 리무진 티켓 & 어린이 세계문화·영어회화 가이드북',
          titleEn: 'Overseas Family Theme Park/Airport Pass & World Culture Guidebook',
          descKo: '방학 기간 가까운 일본(도쿄 오다이바 미래과학관·오사카)·싱가포르의 세계적 과학관과 테마파크를 경험하며 글로벌 시야를 넓히고 가족 유대감을 깊게 다지는 코스입니다.',
          missionKo: '💬 해외여행 하브루타 미션: "다른 나라의 박물관과 교통시스템에서 우리나라와 가장 다른 점과 배울 점은 무엇이었니?"'
        }, makeTourUrls('어린이 세계 여러나라 백과 일본 싱가포르 가족여행 가이드북', '아이와 일본 도쿄 오사카 싱가포르 여행', '도쿄 디즈니랜드 나리타 리무진', 'https://myrealt.rip/xctk64', 'https://www.klook.com/ko/activity/2274-narita-airport-limousine-bus-tokyo'))
      ];
    }

    // Band 5: 만 14세+ (중·고등 청소년 명문대·규장각 진로탐방, 해외 문화·과학 인사이트 투어, 산림·제주 척추감압 액티브 리프레시)
    return [
      Object.assign({
        badgeKo: '🏆 만 14세+ 시그니처 1위 · 학술·박물관·명문 캠퍼스 진로 로드맵',
        badgeEn: '🏆 Age 14+ Pick #1 · University Museum & Heritage Deep Dive',
        categoryKo: '🎓 국립중앙박물관 사유의 방 · 서울대 규장각 · 경복궁·창덕궁 인문·건축 심화 도슨트',
        categoryEn: 'National Museum Room of Quiet Contemplation & Palace Architecture Tour',
        titleKo: '청소년 인문·역사·건축 심화 도슨트 투어 & 코넬식 탐구 보고서·독서 노트 패키지',
        titleEn: 'Youth Humanities/Architecture Docent Tour & Cornell Research Note',
        descKo: '학업 스트레스와 진로 고민이 깊어지는 만 14세 이상 청소년에게 깊이 있는 박물관 사유 공간과 명문 캠퍼스·역사 건축 해설 투어는 지적 호기심과 생기부 심화 탐구 주제를 동시에 선물합니다.',
        missionKo: '💬 인문 탐방 대화 포인트: "반가사유상과 조선 궁궐 건축이 수백 년이 지나도 사람들에게 깊은 울림을 주는 이유는 무엇일까?"'
      }, makeTourUrls('청소년 코넬식 탐구 보고서 노트 한국사 인문학 필독서', '청소년을 위한 박물관 인문학 건축 교양서', '국립중앙박물관 어린이 투어', 'https://myrealt.rip/xctPa2', 'https://www.klook.com/ko/search/result/?query=%EA%B5%AD%EB%A6%BD%EC%A4%91%EC%95%99%EB%B0%95%EB%AC%BC%EA%B4%80')),
      Object.assign({
        badgeKo: '✨ 만 14세+ 시그니처 2위 · 글로벌 과학·문화 도시 인사이트 투어',
        badgeEn: '✨ Age 14+ Pick #2 · Global City Science & Cultural Insight',
        categoryKo: '🌏 오사카·교토 역사과학 투어 / 도쿄 미래과학관·시부야 스카이 / 싱가포르 바이오폴리스 탐방',
        categoryEn: 'Osaka-Kyoto Heritage / Tokyo Miraikan / Singapore Global Tour Pass',
        titleKo: '글로벌 시티 패스·고속열차·입장권(마이리얼트립·클룩) & 청소년 세계사·과학 교양서',
        titleEn: 'Global City Rail/Attraction Pass & Youth World History/Science Book',
        descKo: '시험이 끝난 방학·연휴에 세계적인 과학·문화 도시를 아이가 직접 동선과 교통패스(나리타 리무진·라피트·메트로패스)까지 계획해 다녀오면 자기주도 문제해결력이 비약적으로 성장합니다.',
        missionKo: '💬 글로벌 탐방 미션: "오늘 하루 이동 동선과 예산을 네가 직접 캡틴이 되어 가이드해 볼래?"'
      }, makeTourUrls('청소년 세계사 교양서 글로벌 진로 탐색 도서', '십대를 위한 세계문화 역사 기행', '오사카 유니버설 스튜디오 재팬', 'https://myrealt.rip/xctl66', 'https://www.klook.com/ko/search/result/?query=%EC%98%A4%EC%82%AC%EC%B9%B4+%ED%8C%A8%EC%8A%A4')),
      Object.assign({
        badgeKo: '💎 만 14세+ 시그니처 3위 · 척추 감압 & 코르티솔 리셋 액티브 트레킹',
        badgeEn: '💎 Age 14+ Pick #3 · Spinal Decompression & Cortisol Reset Trip',
        categoryKo: '🌲 제주 올레·성산일출봉·비자림 트레킹 & 부산 해운대 요트·강원 숲체원 힐링 여행',
        categoryEn: 'Jeju Forest Trekking & Busan Marine Yacht Cortisol-Reset Tour',
        titleKo: '제주·부산 액티브 투어패스 & 청소년 발 아치 보호 트레킹 인솔·척추 스트레칭 가이드',
        titleEn: 'Jeju/Busan Active Tour Pass & Arch-Support Trekking Gear',
        descKo: '하루 10시간 이상 책상 착석으로 눌린 청소년의 척추 추간판 디스크(+1.8cm 숨은 키)를 펴주고, 학업 코르티솔(성장호르몬 억제 요인)을 낮춰 깊은 서파수면을 회복시키는 재충전 코스입니다.',
        missionKo: '💬 힐링 트레킹 대화 포인트: "공부 이야기 없이 오늘은 푸른 바다와 숲을 보며 네가 제일 하고 싶은 이야기만 해보자!"'
      }, makeTourUrls('주니어 아치 보호 트레킹 깔창 청소년 스트레칭 폼롤러', '청소년 뇌과학 수면 휴식 에세이', '제주투어패스 가족 액티브 여행', 'https://myrealt.rip/xc4hf6', 'https://www.klook.com/ko/search/result/?query=%EC%A0%9C%EC%A3%BC+%ED%88%AC%EC%96%B4%ED%8C%A8%EC%8A%A4'))
    ];
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
      if (dietList.includes('dairy_sensitive') || dietList.includes('weak_stomach') || dietList.includes('constipation_hard')) {
        return isEn
          ? 'Tailored for dairy-sensitive digestion: non-lactose calcium citrate & cartilage matrix.'
          : '[우유·유제품 배앓이·변비 맞춤] 유당 부담 없이 흡수되는 구연산·연골칼슘 및 장 면역 배합이 필요합니다.';
      }
      if (dietList.includes('meat_veggie_picky') || dietList.includes('fast_carb_sweet') || dietList.includes('sweet_carb')) {
        return isEn
          ? 'Tailored for meat/veggie picky eaters: zinc, colostrum protein & amino acid support.'
          : '[고기·채소 편식·단맛 선호 맞춤] 부족한 단백질 기질과 미각 세포를 깨우는 아연·초유·아르기닌 보충이 핵심입니다.';
      }
      if (sleepList.includes('toss_mouth') || sleepList.includes('late_bedtime') || sleepList.includes('wake_middle') || sleepList.includes('light_dream') || sleepList.includes('hard_wakeup') || sleepList.includes('night_sweat') || postureList.includes('growing_pains')) {
        return isEn
          ? 'Tailored for late/restless sleep & growing pains: chelated magnesium & cartilage calcium.'
          : '[얕은 수면·늦은 취침·성장통 맞춤] 밤 10시 깊은 서파수면 유도 및 저녁 다리 피로 완화를 돕는 배합입니다.';
      }
      return isEn
        ? 'Tailored for small appetite: high-density HT042 & bioavailable calcium.'
        : '[입 짧은 소식형·체질 맞춤] 적은 양으로도 성장판 연골 증식(IGF-1)을 돕는 고밀도 원료가 필요합니다.';
    }

    if (category === 'toy') {
      if (tempList.includes('builder')) {
        return isEn
          ? 'Matched to Focused Builder temperament: 3D spatial block construction & posture tools.'
          : '[손끝 조립 몰입형 기질 맞춤] 아이가 좋아하는 입체 조립 교구와 앉은 자세 교정 도구를 결합했습니다.';
      }
      if (tempList.includes('questioner') || tempList.includes('competitive_game') || tempList.includes('reward_goal')) {
        return isEn
          ? 'Matched to Verbal Questioner & Goal Achiever temperament: cause-and-effect science kits & spinal decompression.'
          : '[질문·사고·미션 성취형 기질 맞춤] 원리를 실험하며 단계별 성취감을 느끼는 과학 교구와 척추 감압 기구입니다.';
      }
      if (tempList.includes('cautious') || tempList.includes('art_story') || tempList.includes('creative_art')) {
        return isEn
          ? 'Matched to Careful Observer & Creative temperament: step-by-step precision puzzles & safe indoor exercise.'
          : '[섬세·감성 창의형 맞춤] 실패 부담 없이 단계별로 완성하는 정밀 교구와 안전한 실내 점핑 기구입니다.';
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
   * 4-B. Age-Specific Educational Travel Philosophy & 3-Step Coaching Guide (Content First, BEFORE any product cards)
   */
  function getAgeEducationalTravelPhilosophy(ageYears = 10, profile = {}, isEn = false) {
    const y = Math.max(1, Math.min(20, Number(ageYears) || 10));
    const tempList = Array.isArray(profile.traitTemperamentList) && profile.traitTemperamentList.length
      ? profile.traitTemperamentList
      : [profile.traitTemperament || 'explorer'];

    let tempTravelTipKo = '아이 스스로 코스를 1곳 고르게 하고, 이동 중 충분한 신체 활동 시간을 확보해 주세요.';
    if (tempList.includes('explorer')) {
      tempTravelTipKo = '[활동·탐구형 기질 맞춤] 가만히 듣는 해설 투어보다 직접 만지고 걷고 채집할 수 있는 야외 생태·과학 체험형 동선을 70% 이상 배치하세요.';
    } else if (tempList.includes('questioner')) {
      tempTravelTipKo = '[질문·사고형 기질 맞춤] 출발 전날 여행지 관련 짧은 그림책·영상을 함께 보고, 현장에서는 어린이 도슨트(해설) 프로그램을 예약해 주시면 질문이 폭발합니다.';
    } else if (tempList.includes('builder')) {
      tempTravelTipKo = '[손끝 조립·몰입형 기질 맞춤] 건축물(고궁·성곽), 과학관 기계장치, 박물관 유물 구조를 가까이서 관찰하고 다녀와서 블록이나 모형으로 재현해 보게 하세요.';
    } else if (tempList.includes('cautious')) {
      tempTravelTipKo = '[신중·관찰형 기질 맞춤] 인파가 몰리는 시간대를 피하고, 도착 전 오늘 볼 장소를 미리 사진으로 보여주어 심리적 안정감을 주면 관찰력이 2배 깊어집니다.';
    } else if (tempList.includes('creative_art')) {
      tempTravelTipKo = '[감성·예술형 기질 맞춤] 작은 스케치북과 색연필을 챙겨가 여행지에서 가장 마음에 드는 장면을 10분간 직접 그려보게 하면 오감 기억이 오래 남습니다.';
    } else if (tempList.includes('reward_goal')) {
      tempTravelTipKo = '[미션·성취형 기질 맞춤] 박물관·국립공원 스탬프 투어 여권이나 보물찾기 미션지(3가지 유물 찾기)를 활용하면 지치지 않고 완주합니다.';
    }

    if (y <= 3) {
      return {
        stageTitleKo: `만 ${y}세 (영유아 감각·애착 민감기) 필수 여행: '장거리 관광'이 아닌 '오감 자연 자극 & 정서 애착 나들이'`,
        whyNeededKo: `만 ${y}세는 대뇌 감각운동 피질에서 초당 100만 개의 시냅스가 연결되는 시기입니다. 이 시기에는 유명한 랜드마크나 긴 이동시간이 오히려 아이의 코르티솔(스트레스 호르몬)을 높입니다. 집에서 1시간 이내의 수목원·키즈 아쿠아리움·자연 농장에서 흙·풀·물·동물을 직접 만지고 맨발로 잔디를 밟는 '근거리 오감 여행'이 소뇌 균형감각과 밤 10시 깊은 숙면(성장호르몬 분비)을 동시에 이끌어냅니다.`,
        themesKo: [
          { title: '🌿 테마 1. 수목원·자연휴양림 오감 산책', desc: '피톤치드 호흡과 나뭇잎·솔방울 촉각 탐색으로 감각통합 신경망 자극 및 야외 비타민D 합성' },
          { title: '🐠 테마 2. 아쿠아리움 & 교감형 동물 농장', desc: '움직이는 해양생물·초식동물을 눈으로 쫓으며 시각 추적력과 생명 존중 정서 형성' },
          { title: '🎨 테마 3. 영유아 체험형 어린이박물관', desc: '안전한 대형 블록·물놀이·소리 체험존에서 대근육과 자율성("내가 할래!") 해소' }
        ],
        dialogue3StepKo: {
          before: '🚗 출발 전 (안심 & 기대감): "오늘 우리가 갈 곳에는 초록색 큰 나무랑 귀여운 물고기가 있대! 어떤 소리가 날까?"',
          onsite: '🔍 현장에서 (오감 언어화): "이 나뭇잎을 만져보니 까슬까슬할까, 보들보들할까? 엄마 손이랑 같이 만져보자!"',
          after: '🍽️ 다녀온 후 (정서 각인): "오늘 본 동물 친구 중에 누가 제일 반가웠어? 우리 코 자면서 꿈에서 또 만나자~"'
        },
        tempTravelTipKo
      };
    }

    if (y <= 6) {
      return {
        stageTitleKo: `만 ${y}세 (유아 전두엽 호기심 폭발기) 필수 여행: '왜 그럴까?' 인과 추론을 깨우는 자연사·생태·과학 여행`,
        whyNeededKo: `만 ${y}세는 언어가 폭발하고 세상의 모든 현상에 "왜?"라고 묻는 전두엽 호기심의 황금기입니다. 이때 평면적인 영상(유튜브) 대신 공룡 화석의 실제 크기를 올려다보고, 갯벌·습지에서 생물을 관찰하며, 밤하늘 별자리를 보는 입체적 공간 여행을 경험하면 두정엽(공간·수리)과 전두엽(인과 추론) 회로가 단단하게 연결됩니다. 또한 주말 하루 5,000~6,000보의 즐거운 야외 걷기는 무릎·발목 성장판에 최적의 압전 자극을 줍니다.`,
        themesKo: [
          { title: '🦖 테마 1. 자연사박물관 & 공룡 화석지 탐방', desc: '거대 공룡 골격과 지층 화석을 관찰하며 시간의 흐름과 생태계 인과관계 추론' },
          { title: '🦀 테마 2. 갯벌·생태습지 & 곤충 생태관 체험', desc: '직접 손으로 생물을 찾고 루페(돋보기)로 관찰하며 과학적 탐구 태도와 소근육 발달' },
          { title: '🔭 테마 3. 어린이 천문대 & 과학관 작동 체험', desc: '달의 분화구와 행성을 망원경으로 관측하고 물·공기·자석 원리를 몸으로 체득' }
        ],
        dialogue3StepKo: {
          before: '🚗 출발 전 (가설 세우기): "공룡은 왜 이렇게 목이 길었을까? 오늘 박물관에 가서 진짜 뼈를 보고 비밀을 찾아보자!"',
          onsite: '🔍 현장에서 (비교 관찰): "이 화석의 이빨 모양을 봐봐! 뾰족할까, 납작할까? 그럼 무엇을 먹었을까?"',
          after: '🍽️ 다녀온 후 (스토리텔링): "오늘 우리가 찾은 공룡 비밀을 아빠(할머니)한테 이야기해 줄까? 블록으로도 만들어보자!"'
        },
        tempTravelTipKo
      };
    }

    if (y <= 9) {
      return {
        stageTitleKo: `만 ${y}세 (초등 저학년 교과 배경지식 형성기) 필수 여행: 교과서 속 역사와 과학을 눈으로 먼저 만나는 '배경지식 각인 여행'`,
        whyNeededKo: `초등 1~3학년(만 ${y}세)은 본격적인 교과 학습이 시작되면서 '독서 문해력'과 '체험 배경지식(Schema)'의 격차가 성적과 학업 자존감을 가르는 시기입니다. 책으로만 '신라의 문화재'나 '우주 발사체'를 읽은 아이보다, 주말 가족 여행으로 경주 고분군이나 국립과학관을 직접 걸으며 부모와 대화를 나눈 아이는 수업 시간에 아는 내용이 나올 때 눈이 반짝이며 자기주도 발표력이 2배 이상 높아집니다.`,
        themesKo: [
          { title: '👑 테마 1. 국립중앙박물관 & 고궁·경주 역사 입문 여행', desc: '초등 사회·한국사 등장 유물(금관·반가사유상·자격루)을 실물로 먼저 만나 역사 흥미 점화' },
          { title: '🚀 테마 2. 국립과학관 & 항공우주·미래기술 탐방', desc: '중력·빛·에너지·로켓 원리를 직접 조작하며 초등 과학 개념을 입체적으로 이해' },
          { title: '🌲 테마 3. 국립수목원·지질공원 액티브 트레킹', desc: '주중 책상 앞에서 눌린 척추 디스크를 펴고 햇빛 비타민D와 하지 성장판을 깨우는 가족 산행' }
        ],
        dialogue3StepKo: {
          before: '🚗 출발 전 (핵심 미션 1가지): "오늘 박물관에서 옛날 임금님이 쓰던 물건 딱 3가지만 찾아서 사진 찍어볼까?"',
          onsite: '🔍 현장에서 (역지사지 질문): "만약 네가 1,000년 전 장군님이었다면, 왜 성벽을 이렇게 높은 산 위에 쌓았을까?"',
          after: '🍽️ 다녀온 후 (식탁 하브루타): "오늘 본 유물 중에 우리 집에 딱 하나만 가져올 수 있다면 무엇을 고르고 싶어? 왜?"'
        },
        tempTravelTipKo
      };
    }

    if (y <= 12) {
      return {
        stageTitleKo: `만 ${y}세 (초등 고학년 메타인지 피크 & 사춘기 진입기) 필수 여행: 학업 내적 동기와 가족 대화 끈을 지키는 '비전·세계유산 탐방'`,
        whyNeededKo: `만 ${y}세(초등 고학년)는 배외측 전전두엽(DLPFC)의 추상적 사고력이 정점에 달하는 동시에, 사춘기 호르몬 변화와 학업 스트레스가 시작되는 골든타임입니다. 이 시기에 잔소리 대신 유네스코 세계문화유산(수원화성·안동·부여), 대덕 연구단지·명문대 캠퍼스, 제주 지질 트레킹을 함께 떠나 '세상의 넓음'을 보여주면, 아이 스스로 "왜 공부해야 하는지" 내적 동기(Metacognitive Motivation)를 찾고 사춘기 동안에도 부모와 깊은 대화를 이어갈 수 있습니다.`,
        themesKo: [
          { title: '🏯 테마 1. 유네스코 세계문화유산 & 과학사 심층 답사', desc: '수원화성 거중기·안동 병산서원·경주 첨성대 등 화학과 역사가 결합된 입체적 인문 답사' },
          { title: '🔬 테마 2. 대전 국립중앙과학관 & 카이스트/대학 캠퍼스 투어', desc: '첨단 과학기술 현장을 걸으며 미래 진로 롤모델을 구체화하고 학업 동기 부여' },
          { title: '⛰️ 테마 3. 제주 지질트레일 & 강원 숲체원 성장 리셋 여행', desc: '스마트폰 도파민 피로를 씻어내고 장시간 야외 트레킹으로 성장호르몬 감수성 극대화' }
        ],
        dialogue3StepKo: {
          before: '🚗 출발 전 (주도권 위임): "이번 여행 코스 3곳 중 1곳은 네가 직접 골라볼래? 맛집도 네가 추천해 줘!"',
          onsite: '🔍 현장에서 (원리·비판적 추론): "정약용 선생님은 왜 거중기에 도르래 원리를 썼을까? 지금 우리 일상 어디에 이 원리가 쓰일까?"',
          after: '🍽️ 다녀온 후 (비전 연결): "오늘 가본 곳 중에서 나중에 네 친구들에게 직접 설명해 주고 싶은 장소는 어디였어?"'
        },
        tempTravelTipKo
      };
    }

    return {
      stageTitleKo: `만 ${y}세 (중·고등 수초화 완성 & 진로 확립기) 필수 여행: 번아웃 코르티솔을 낮추고 미래 비전을 세우는 '캠퍼스·인문·액티브 리프레시 여행'`,
      whyNeededKo: `만 ${y}세 청소년기는 신경 전달 속도를 100배 높이는 축삭 수초화(Myelination)가 완성되지만, 장시간 착석 학습과 입시 압박으로 인해 스트레스 호르몬(코르티솔)이 높아져 수면 질과 마지막 숨은 키 성장까지 방해받기 쉽습니다. 분기별 1회라도 책상을 벗어나 국내외 대학 캠퍼스·인문 역사 현장을 걷거나 자연 속 트레킹을 다녀오면, 뇌 피로(Default Mode Network)가 리셋되고 장기 목표를 향한 딥워크(Deep Work) 지구력이 회복됩니다.`,
      themesKo: [
        { title: '🎓 테마 1. 국내외 명문 대학 캠퍼스 & 과학·박물관 비전 투어', desc: '대학 도서관과 연구실 분위기를 직접 호흡하며 구체적인 진학·진로 목표 설정' },
        { title: '🌲 테마 2. 국립숲체원·제주 올레길 척추 감압 & 힐링 트레킹', desc: '굽은 경추·흉추를 펴고 야외 유산소 보행으로 코르티솔 저하 및 숙면 리듬 회복' },
        { title: '🏛️ 테마 3. 근현대사·미술관 인문 사유 여행', desc: '역사적 전환점과 현대 예술 작품을 통해 논술·면접의 바탕이 되는 비판적 시각 확장' }
      ],
      dialogue3StepKo: {
        before: '🚗 출발 전 (존중과 공감): "이번 여행은 공부 얘기 잠시 내려놓고, 맛있는 거 먹으면서 머리 식히고 오자!"',
        onsite: '🔍 현장에서 (미래 비전 대화): "이 캠퍼스(전시관)를 걸어보니 5년 뒤 네가 어떤 분야를 연구하거나 일하고 있을지 상상돼?"',
        after: '🍽️ 다녀온 후 (에너지 충전): "이번 여행에서 가장 마음이 편했던 순간은 언제였어? 다음 방학엔 어디로 가보고 싶어?"'
      },
      tempTravelTipKo
    };
  }

  function renderAgeEducationalTravelGuide(ageYears = 10, profile = {}, isEn = false) {
    const phil = getAgeEducationalTravelPhilosophy(ageYears, profile, isEn);
    return `
      <!-- PURE EDUCATIONAL TRAVEL GUIDE (Explains WHY & WHAT travel is needed at this age BEFORE any product/ad links) -->
      <div id="age-educational-travel-guide-box" style="margin-top: 1.35rem; padding: 1.35rem; background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9)); border: 1.5px solid rgba(251, 191, 36, 0.42); border-radius: 20px; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.7rem;">
          <span style="font-size: 0.8rem; font-weight: 900; color: #FBBF24; background: rgba(251, 191, 36, 0.16); border: 1px solid rgba(251, 191, 36, 0.35); padding: 0.24rem 0.75rem; border-radius: 9999px;">
            🧭 동 나이대(만 ${ageYears}세) 필수 교육여행 가이드 (본문 해설)
          </span>
          <span style="font-size: 0.76rem; font-weight: 800; color: #34D399;">
            ✓ 두뇌 신경가소성 × 야외 성장판 자극 × 가족 유대
          </span>
        </div>

        <h3 style="font-size: 1.14rem; font-weight: 900; color: #FFFFFF; line-height: 1.45; margin: 0 0 0.65rem 0;">
          ✈️ ${phil.stageTitleKo}
        </h3>

        <div style="background: rgba(255, 255, 255, 0.04); border-left: 4px solid #FBBF24; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.9rem; color: #E2E8F0; line-height: 1.65;">
          <strong style="color: #FDE68A; display: block; margin-bottom: 0.25rem;">💡 왜 지금 나이(만 ${ageYears}세)에 이런 여행이 꼭 필요할까요?</strong>
          ${phil.whyNeededKo}
        </div>

        <!-- 3 Age-Matched Essential Travel Themes -->
        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.92rem; font-weight: 900; color: #93C5FD; margin-bottom: 0.55rem;">
            📌 만 ${ageYears}세에 꼭 경험해야 할 3대 필수 여행 테마
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 0.65rem;">
            ${phil.themesKo.map(t => `
              <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 0.8rem 0.9rem;">
                <div style="font-size: 0.88rem; font-weight: 900; color: #FDE68A; margin-bottom: 0.3rem;">${t.title}</div>
                <p style="font-size: 0.82rem; color: #CBD5E1; line-height: 1.5; margin: 0;">${t.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3-Step Parent-Child Travel Dialogue Guide -->
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 0.9rem 1rem; margin-bottom: 0.85rem;">
          <div style="font-size: 0.9rem; font-weight: 900; color: #34D399; margin-bottom: 0.45rem;">
            🗣️ 여행의 교육 효과를 3배 높이는 '출발 전 · 현장 · 다녀온 후' 3단계 부모 대화법
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.84rem; color: #F8FAFC; line-height: 1.52;">
            <div>${phil.dialogue3StepKo.before}</div>
            <div>${phil.dialogue3StepKo.onsite}</div>
            <div>${phil.dialogue3StepKo.after}</div>
          </div>
        </div>

        <!-- Temperament-Tailored Travel Routing Tip -->
        <div style="font-size: 0.84rem; color: #C4B5FD; background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 10px; padding: 0.65rem 0.85rem; line-height: 1.5;">
          🧩 <strong>우리 아이 기질 맞춤 여행 동선 팁:</strong> ${phil.tempTravelTipKo}
        </div>
      </div>
    `;
  }

  /**
   * Helper: Renders 3 curated flagship cards for a given category ('supplement' | 'toy' | 'book')
   */
  function renderCategoryProductCards(items, accentColor, categoryType, isEn = false) {
    const threePicks = [];
    if (items && items[0]) {
      const sub0 = (items[0].curatedProducts && items[0].curatedProducts[0]) || {
        rankKo: '🏆 엄마들 재주문 1위',
        rankEn: '🏆 Reorder Pick #1',
        titleKo: items[0].name,
        titleEn: items[0].name,
        specKo: items[0].activeSpec,
        specEn: items[0].activeSpec,
        coupangUrl: items[0].coupangUrl,
        iherbUrl: items[0].iherbUrl,
        amazonUrl: items[0].amazonUrl,
        yes24Url: items[0].yes24Url,
        naverUrl: items[0].naverUrl,
        naverBrandConnectHealthUrl: items[0].naverBrandConnectHealthUrl,
        tenpingUrl: items[0].tenpingUrl,
        cpQuery: items[0].coupangQuery,
        ihQuery: items[0].iherbQuery
      };
      threePicks.push({ item: items[0], sub: sub0, badgeKo: '🏆 엄선 1위 (최다 재주문)', badgeEn: '🏆 Curated Pick #1' });
    }
    if (items && items[1]) {
      const sub1 = (items[1].curatedProducts && items[1].curatedProducts[0]) || {
        rankKo: '✨ 엄선 2위',
        rankEn: '✨ Curated Pick #2',
        titleKo: items[1].name,
        titleEn: items[1].name,
        specKo: items[1].activeSpec,
        specEn: items[1].activeSpec,
        coupangUrl: items[1].coupangUrl,
        iherbUrl: items[1].iherbUrl,
        amazonUrl: items[1].amazonUrl,
        yes24Url: items[1].yes24Url,
        naverUrl: items[1].naverUrl,
        naverBrandConnectHealthUrl: items[1].naverBrandConnectHealthUrl,
        tenpingUrl: items[1].tenpingUrl,
        cpQuery: items[1].coupangQuery,
        ihQuery: items[1].iherbQuery
      };
      threePicks.push({ item: items[1], sub: sub1, badgeKo: '✨ 엄선 2위 (맞춤 시너지)', badgeEn: '✨ Curated Pick #2' });
    }
    if (items && items[0] && items[0].curatedProducts && items[0].curatedProducts[1]) {
      const sub2 = items[0].curatedProducts[1];
      threePicks.push({ item: items[0], sub: sub2, badgeKo: '💎 엄선 3위 (인기 대안)', badgeEn: '💎 Curated Pick #3' });
    } else if (items && items[1] && items[1].curatedProducts && items[1].curatedProducts[1]) {
      const sub2 = items[1].curatedProducts[1];
      threePicks.push({ item: items[1], sub: sub2, badgeKo: '💎 엄선 3위 (인기 대안)', badgeEn: '💎 Curated Pick #3' });
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${threePicks.map(({ item, sub, badgeKo, badgeEn }) => `
          <div class="pinpoint-item-card" data-item-id="${item.id}" style="background: rgba(15, 23, 42, 0.94); border: 1.5px solid ${accentColor}; border-radius: 16px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.45rem;">
                <span style="font-size: 0.76rem; font-weight: 900; color: #FBBF24; background: rgba(251, 191, 36, 0.16); padding: 0.2rem 0.6rem; border-radius: 9999px;">
                  ${isEn ? badgeEn : badgeKo}
                </span>
                <span style="font-size: 0.74rem; color: #93C5FD; font-weight: 700;">
                  ${item.categoryBadge}
                </span>
              </div>

              <div style="font-size: 0.98rem; font-weight: 900; color: #FFFFFF; line-height: 1.42; margin-bottom: 0.45rem;">
                ${isEn ? sub.titleEn : sub.titleKo}
              </div>

              <div style="font-size: 0.85rem; color: #F8FAFC; line-height: 1.55; background: rgba(255, 255, 255, 0.05); border-left: 3px solid #34D399; padding: 0.55rem 0.75rem; border-radius: 8px; margin-bottom: 0.7rem;">
                💬 ${isEn ? sub.specEn : sub.specKo}
              </div>
            </div>

            <div>
              <a href="${categoryType === 'book' ? sub.yes24Url : sub.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn" data-merchant="${categoryType === 'book' ? 'linkprice' : 'coupang'}" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.28); color: #FFFFFF; font-size: 0.84rem; font-weight: 800; padding: 0.45rem 0.8rem; border-radius: 10px; text-decoration: none; text-align: center;">
                ${categoryType === 'book' ? `📚 ${isEn ? 'View Book Info ↗' : '도서 상세 정보 확인하기 ↗'}` : `📦 ${isEn ? 'View Product Spec ↗' : '상세 스펙·성분 확인하기 ↗'}`}
              </a>
              <details style="margin-top: 0.4rem; font-size: 0.76rem; color: #94A3B8;">
                <summary style="cursor: pointer; text-align: right; color: #94A3B8; font-weight: 700;">교차 비교처 &amp; 제휴 혜택 더보기 ▼</summary>
                <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem;">
                  <a href="${sub.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="coupang" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(255,255,255,0.06); border-radius: 6px; color: #E2E8F0; text-decoration: none; text-align: center; font-weight: 700;">쿠팡(AF7865143) ↗</a>
                  ${categoryType === 'supplement' ? `<a href="${sub.iherbUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="iherb" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(16,185,129,0.14); border-radius: 6px; color: #A7F3D0; text-decoration: none; text-align: center; font-weight: 700;">iHerb(IPZ1547) ↗</a>` : `<a href="${sub.yes24Url}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="linkprice" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(139,92,246,0.16); border-radius: 6px; color: #EDE9FE; text-decoration: none; text-align: center; font-weight: 700;">YES24 ↗</a>`}
                  <a href="${sub.amazonUrl || `https://www.amazon.com/s?k=${encodeURIComponent(sub.ihQuery || sub.cpQuery || '')}&tag=kidfit-20`}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="amazon" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(245,158,11,0.14); border-radius: 6px; color: #FDE68A; text-decoration: none; text-align: center; font-weight: 700;">Amazon(kidfit-20) ↗</a>
                  <a href="${sub.adpickShoppingUrl || `https://adpick.co.kr/apis/goshopping.php?affid=4d31d3&offer=c16a2&url=${encodeURIComponent('https://www.11st.co.kr/search/search.tmall?kwd=' + encodeURIComponent(sub.cpQuery || ''))}`}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="adpick" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(236,72,153,0.14); border-radius: 6px; color: #FBCFE8; text-decoration: none; text-align: center; font-weight: 700;">🛒 11번가(애드픽 4d31d3) ↗</a>
                </div>
              </details>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 5-A. Renders ONLY the 4-Year Sequential Age Lifecycle Timeline (for Chapter 2: Auxology & Bone Age)
   */
  function renderLifecycleTimelineOnly(profile = {}, affConfig = {}) {
    const isEn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en');
    const data = curatePinpointItems(profile, affConfig);
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));

    return `
      <div id="child-lifecycle-roadmap-section" style="margin-top: 1.25rem; padding: 1.25rem; background: rgba(15, 23, 42, 0.85); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 18px; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.08rem; font-weight: 900; color: #FFFFFF; margin: 0;">
            🗓️ ${isEn
              ? `3-Year Forward Growth & Bone-Age Roadmap (Age ${ageYears} → Age ${ageYears + 3})`
              : `향후 3개년 순수 신체성장·골연령 타임라인 (만 ${ageYears}세 → 만 ${ageYears + 3}세 연도별 골단판 체크포인트)`}
          </h4>
          <span style="background: rgba(59, 130, 246, 0.16); color: #93C5FD; font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.7rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.35);">
            ${isEn ? data.autoStage.stageNameEn : data.autoStage.stageNameKo}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.45rem; margin-bottom: 0.75rem;">
          ${data.lifecycleRoadmap.map((step, idx) => `
            <button
              type="button"
              class="lifecycle-tab-btn"
              onclick="(function(btn, targetIdx){ var sec = btn.closest('#child-lifecycle-roadmap-section'); if(!sec) return; var cards = sec.querySelectorAll('.lifecycle-age-card'); cards.forEach(function(c, i){ c.style.display = (i === targetIdx) ? 'block' : 'none'; }); var btns = sec.querySelectorAll('.lifecycle-tab-btn'); btns.forEach(function(b, i){ b.style.background = (i === targetIdx) ? '#3B82F6' : 'rgba(255,255,255,0.06)'; b.style.color = '#FFFFFF'; b.style.borderColor = (i === targetIdx) ? '#60A5FA' : 'rgba(255,255,255,0.15)'; }); })(this, ${idx})"
              style="padding: 0.55rem 0.4rem; border-radius: 10px; font-size: 0.84rem; font-weight: 800; cursor: pointer; background: ${idx === 0 ? '#3B82F6' : 'rgba(255,255,255,0.06)'}; color: #FFFFFF; border: 1px solid ${idx === 0 ? '#60A5FA' : 'rgba(255,255,255,0.15)'};"
            >
              ${isEn ? (idx === 0 ? `Now (${step.age}y)` : `+${idx}Yr (${step.age}y)`) : (idx === 0 ? `현재 만 ${step.age}세` : `만 ${step.age}세 (+${idx}년)`)}
            </button>
          `).join('')}
        </div>

        <div>
          ${data.lifecycleRoadmap.map((step, idx) => `
            <div class="lifecycle-age-card" data-age="${step.age}" style="display: ${idx === 0 ? 'block' : 'none'}; background: rgba(15, 23, 42, 0.95); border: 1.5px solid rgba(59, 130, 246, 0.45); border-radius: 14px; padding: 1.1rem 1.2rem; text-align: left;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.55rem;">
                <span style="font-size: 1rem; font-weight: 900; color: #60A5FA;">
                  📌 ${isEn ? `Age ${step.age} Skeletal Milestone` : `만 ${step.age}세 핵심 신체성장·골연령 체크포인트`}
                </span>
                <span style="font-size: 0.84rem; font-weight: 900; color: #34D399; background: rgba(16, 185, 129, 0.15); padding: 0.2rem 0.65rem; border-radius: 9999px;">
                  권장 성장속도: ${step.expectedVelocity}
                </span>
              </div>
              <div style="font-size: 0.92rem; color: #FFFFFF; line-height: 1.6; margin-bottom: 0.4rem;">
                <strong style="color: #38BDF8;">📏 ${isEn ? 'Skeletal Maturation:' : '신체·골연령 포인트:'}</strong> ${step.physicalFocus}
              </div>
              <div style="font-size: 0.92rem; color: #FFFFFF; line-height: 1.6; margin-bottom: 0.45rem;">
                <strong style="color: #34D399;">🦴 ${isEn ? 'Epiphyseal Reserve:' : '골단판 연골 보존:'}</strong> Tanner 단계별 골화 진행도 정상 궤도 유지 및 밤 10시 서파수면 성장호르몬 맥동 극대화
              </div>
              <div style="font-size: 0.86rem; color: #FDE68A; line-height: 1.5; border-top: 1px dashed rgba(255, 255, 255, 0.14); padding-top: 0.45rem;">
                ⚠️ <strong>부모님 성장 관리 주의점:</strong> ${step.parentWarning}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 5-A2. Cognitive & Curriculum Roadmap for Pillar 2 (Migrated from Chapter 2 to Chapter 6)
   */
  function renderCognitiveCurriculumRoadmap(profile = {}, affConfig = {}) {
    const isEn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en');
    const data = curatePinpointItems(profile, affConfig);
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));

    const CURRICULUM_ROADMAP = {
      1: {
        kor: '감각 그림책 오감 대화 & 의성어·의태어 폭발기',
        math: '원목 블록 크기 비교 & 위·아래·안·밖 공간 감각',
        focus: '10분 이내 손끝 촉각 집게 놀이 및 자율성 지지'
      },
      2: {
        kor: '음운인식 그림책 하브루타 & 질문 대화 턴 3회',
        math: '1~10 수 세기 구체물 대응 & 도형 맞추기 퍼즐',
        focus: '15분 몬테소리 손끝 조작 및 자기주도 장난감 정리'
      },
      3: {
        kor: '그림책 상황 이야기 나누기 & 의성어·의태어 말놀이',
        math: '직관적 양감(Subitizing) & 원목 블록·모양 맞추기 입체 놀이',
        focus: '15분 손끝 촉각·집게 놀이 후 스스로 정리하기 루틴'
      },
      4: {
        kor: '한글 자모음 결합 & 그림책 3문장 생각 말하기',
        math: '가베·자석블록 3D 입체 기하학 & 멘탈 로테이션',
        focus: '20분 착석 지구력 & 손끝 소근육 악력 기르기'
      },
      5: {
        kor: '초등 입학 전 독해 기초 & 어휘 마인드맵 워크북',
        math: '10 이하 가르기·모으기 & 소마큐브 공간지각',
        focus: '20분 시각 타이머 활용 1과제 완수 습관'
      },
      6: {
        kor: '초등 1학년 교과 어휘력 & 1지문 핵심어 동그라미',
        math: '문장제 조건 밑줄 긋기 & 단순 연산 30% 축소',
        focus: '25분 눈높이 2단 독서대 시선 고정 집중 훈련'
      },
      7: {
        kor: '초등 2학년 비문학 독서 & 3단계 하브루타 대화',
        math: '구구단 원리 이해 & 칠교/도형 분할 문제 해결',
        focus: '25분 뽀모도로 인터벌 + 틀린 문제 발상 점검'
      },
      8: {
        kor: '초등 3학년 문단 구조화 & 긴 줄글 서술형 독해',
        math: '분수·소수 개념 시각화 & 조건 여백에 그림 그리기',
        focus: '30분 딥워크 몰입 + 코넬 노트 1줄 요약'
      },
      9: {
        kor: '초등 4학년 교과 비문학 요약 & 어휘 한자어 스키마',
        math: '도형 각도·넓이 개념 구조화 & 심상 회전 훈련',
        focus: '30분 자기주도 스터디 플래너 체크리스트 실천'
      },
      10: {
        kor: '초등 5학년 긴 지문 요약 & 수능형 문맥 추론',
        math: '약수·배수·약분 개념 연결 & 오답 원인 역추적',
        focus: '35분 무방해 딥워크 + 학원 직후 5분 백지복습'
      },
      11: {
        kor: '초등 6학년 비문학 철학·과학 지문 논리적 비판 독해',
        math: '비례식·원기둥 입체 기하학 & 풀이과정 서술 훈련',
        focus: '40분 메타인지 백지복습 + 서파수면 기억 공고화'
      },
      12: {
        kor: '중1 국어 문학·비문학 복합 서사 구조화',
        math: '문자와 식·일차방정식 개념 추상화 & 함수 기초',
        focus: '45분 스마트폰 격리 딥워크 + 파인만 3분 설명'
      },
      13: {
        kor: '중2 심화 비문학 칼럼 요약 & 수능형 어휘 체계화',
        math: '연립방정식·부등식 & 중등 기하 논증 증명 훈련',
        focus: '45분 코넬식 핵심 인출 + 주말 3시간 고효율 복습'
      }
    };

    return `
      <div id="child-cognitive-roadmap-section" style="margin-top: 1.25rem; padding: 1.25rem; background: rgba(15, 23, 42, 0.92); border: 1.5px solid rgba(139, 92, 246, 0.45); border-radius: 18px; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.08rem; font-weight: 900; color: #FFFFFF; margin: 0;">
            🗓️ ${isEn
              ? `3-Year Forward Cognitive & Curriculum Roadmap (Age ${ageYears} → Age ${ageYears + 3})`
              : `향후 3개년 연령별 학습·교과 전환 로드맵 (만 ${ageYears}세 → 만 ${ageYears + 3}세 핵심 과제)`}
          </h4>
          <span style="background: rgba(139, 92, 246, 0.2); color: #DDD6FE; font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.7rem; border-radius: 9999px; border: 1px solid rgba(139, 92, 246, 0.45);">
            🧠 대뇌 피질 재조직화 &amp; 교과 전환
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.45rem; margin-bottom: 0.75rem;">
          ${data.lifecycleRoadmap.map((step, idx) => `
            <button
              type="button"
              class="cognitive-lifecycle-tab-btn"
              onclick="(function(btn, targetIdx){ var sec = btn.closest('#child-cognitive-roadmap-section'); if(!sec) return; var cards = sec.querySelectorAll('.cognitive-age-card'); cards.forEach(function(c, i){ c.style.display = (i === targetIdx) ? 'block' : 'none'; }); var btns = sec.querySelectorAll('.cognitive-lifecycle-tab-btn'); btns.forEach(function(b, i){ b.style.background = (i === targetIdx) ? '#7C3AED' : 'rgba(255,255,255,0.06)'; b.style.color = '#FFFFFF'; b.style.borderColor = (i === targetIdx) ? '#C4B5FD' : 'rgba(255,255,255,0.15)'; }); })(this, ${idx})"
              style="padding: 0.55rem 0.4rem; border-radius: 10px; font-size: 0.84rem; font-weight: 800; cursor: pointer; background: ${idx === 0 ? '#7C3AED' : 'rgba(255,255,255,0.06)'}; color: #FFFFFF; border: 1px solid ${idx === 0 ? '#C4B5FD' : 'rgba(255,255,255,0.15)'};"
            >
              ${isEn ? (idx === 0 ? `Now (${step.age}y)` : `+${idx}Yr (${step.age}y)`) : (idx === 0 ? `현재 만 ${step.age}세` : `만 ${step.age}세 (+${idx}년)`)}
            </button>
          `).join('')}
        </div>

        <div>
          ${data.lifecycleRoadmap.map((step, idx) => {
            const curInfo = CURRICULUM_ROADMAP[step.age] || CURRICULUM_ROADMAP[12];
            return `
              <div class="cognitive-age-card" data-age="${step.age}" style="display: ${idx === 0 ? 'block' : 'none'}; background: rgba(15, 23, 42, 0.95); border: 1.5px solid rgba(139, 92, 246, 0.45); border-radius: 14px; padding: 1.1rem 1.2rem; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.55rem;">
                  <span style="font-size: 1rem; font-weight: 900; color: #DDD6FE;">
                    🧠 ${isEn ? `Age ${step.age} Cognitive & Study Roadmap` : `만 ${step.age}세 두뇌 신경망 & 교과 학습 전환 과제`}
                  </span>
                  <span style="font-size: 0.84rem; font-weight: 800; color: #6EE7B7; background: rgba(16, 185, 129, 0.15); padding: 0.2rem 0.65rem; border-radius: 9999px;">
                    집중 목표: ${curInfo.focus}
                  </span>
                </div>
                <div style="font-size: 0.92rem; color: #FFFFFF; line-height: 1.6; margin-bottom: 0.4rem;">
                  <strong style="color: #C4B5FD;">🧠 ${isEn ? 'Cortical Rewiring:' : '두뇌·신경망 발달 과제:'}</strong> ${step.brainFocus}
                </div>
                <div style="font-size: 0.9rem; color: #E2E8F0; line-height: 1.6; margin-bottom: 0.35rem;">
                  <strong style="color: #93C5FD;">📖 국어·문해력 포인트:</strong> ${curInfo.kor}
                </div>
                <div style="font-size: 0.9rem; color: #E2E8F0; line-height: 1.6; margin-bottom: 0.45rem;">
                  <strong style="color: #FBBF24;">📐 수학·공간추론 포인트:</strong> ${curInfo.math}
                </div>
                <div style="font-size: 0.86rem; color: #DDD6FE; line-height: 1.5; border-top: 1px dashed rgba(255, 255, 255, 0.14); padding-top: 0.45rem;">
                  💡 <strong>자기주도 코칭 조언:</strong> 기계적 선행 학원 진도보다 매일 5분 백지복습(Active Recall)과 밤 10시 숙면(기억 공고화)이 학업 성취도를 50% 이상 결정합니다.
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 5-B. Contextual Nutrition Prescription (for the bottom of Chapter 3: Hormone, Sleep & Clinical Nutrition)
   */
  function renderContextualSupplementsPrescription(profile = {}, affConfig = {}) {
    const isEn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en');
    const data = curatePinpointItems(profile, affConfig);
    const suppTraitNote = getTraitSpecificNote(profile, 'supplement', isEn);

    return `
      <div class="pinpoint-category-box" id="pinpoint-supplements-box" style="margin-top: 1.25rem; background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(8, 47, 73, 0.45)); border: 1.5px solid rgba(56, 189, 248, 0.45); border-radius: 18px; padding: 1.25rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
          <span style="font-size: 0.78rem; font-weight: 900; color: #38BDF8; background: rgba(56, 189, 248, 0.16); padding: 0.22rem 0.7rem; border-radius: 9999px;">
            💊 [Chapter 3 연계 처방] 호르몬·임상영양 맞춤 솔루션
          </span>
          <span style="font-size: 0.76rem; color: #93C5FD; font-weight: 700;">
            위 영양 흡수율·체중 비례 요구량 진단 기반
          </span>
        </div>
        <h4 style="font-size: 1.08rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.35rem 0;">
          ${isEn ? 'Tailored Clinical Nutrition & Sleep-GH Supplements (Top 3)' : '위 영양·수면 진단 결과에 맞춘 아침·저녁 필수 영양제 처방 TOP 3'}
        </h4>
        <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.85rem 0; line-height: 1.55;">
          ${suppTraitNote}
        </p>
        ${renderCategoryProductCards(data.supplements, 'rgba(56, 189, 248, 0.45)', 'supplement', isEn)}
      </div>
    `;
  }

  /**
   * 5-C. Contextual Biomechanics & Posture Prescription (for the bottom of Chapter 4: Spinal Decompression & Biomechanics)
   */
  function renderContextualBiomechanicsPrescription(profile = {}, affConfig = {}) {
    const isEn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en');
    const data = curatePinpointItems(profile, affConfig);
    const toyTraitNote = getTraitSpecificNote(profile, 'toy', isEn);

    return `
      <div class="pinpoint-category-box" id="pinpoint-toys-box" style="margin-top: 1.25rem; background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(6, 78, 59, 0.42)); border: 1.5px solid rgba(52, 211, 153, 0.45); border-radius: 18px; padding: 1.25rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
          <span style="font-size: 0.78rem; font-weight: 900; color: #34D399; background: rgba(16, 185, 129, 0.16); padding: 0.22rem 0.7rem; border-radius: 9999px;">
            🏃 [Chapter 4 연계 처방] 척추 감압 · 자세교정 · 성장통 케어 도구
          </span>
          <span style="font-size: 0.76rem; color: #A7F3D0; font-weight: 700;">
            숨은 키 +1.8cm 복원 및 성장판 기계적 미세하중(Wolff's Law) 기반
          </span>
        </div>
        <h4 style="font-size: 1.08rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.35rem 0;">
          ${isEn ? 'Spinal Decompression, Posture & Active Home Exercise Tools (Top 3)' : '위 척추·생체역학 진단에 맞춘 자세교정 & 실내 점핑·스트레칭 도구 TOP 3'}
        </h4>
        <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.85rem 0; line-height: 1.55;">
          ${toyTraitNote}
        </p>
        ${renderCategoryProductCards(data.toys, 'rgba(52, 211, 153, 0.45)', 'toy', isEn)}
      </div>
    `;
  }

  /**
   * 5-C2. Curate Pillar 2 Learning Environment & Manipulative Tools (Migrated from Chapter 4)
   */
  function curatePillar2LearningTools(profile = {}, affConfig = {}) {
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const tools = [];

    if (ageYears <= 3) {
      tools.push(Object.assign({
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

      tools.push(Object.assign({
        id: 'montessori_cylinder_shelf_1_3',
        categoryBadge: '🧩 만 1~3세 몬테소리 꼭지원기둥 실린더 & 자율 교구장',
        name: '몬테소리 원목 꼭지원기둥 4종 실린더 블록 & 자율정리 원목 전면 교구장',
        activeSpec: '크기·높이·굵기 시각 변별력 + 스스로 교구를 꺼내 정리하는 자율성 훈련',
        whyNeeded: '아이 스스로 높낮이와 굵기 차이를 감각하고 제자리에 정리하는 환경이 전두엽 실행기능과 질서감을 형성합니다.',
        buttonLabelCoupang: `쿠팡에서 '몬테소리 꼭지원기둥 실린더 원목 전면 교구장' 바로 보기 ↗`
      }, buildPinpointUrls(
        '몬테소리 꼭지원기둥 실린더 블록 원목 전면 교구장',
        'Montessori Cylinder Blocks Wooden Bookshelf Kids',
        '몬테소리 자율 환경 교구장',
        affConfig
      )));

      tools.push(Object.assign({
        id: 'sensory_visual_book_1_3',
        categoryBadge: '📖 만 1~3세 브로카 언어영역 자극 오감 그림책',
        name: '유아 첫 비주얼 플랩북 & 의성어·의태어 오감 말놀이 그림책 세트',
        activeSpec: '부모-자녀 일대일 눈맞춤 대화 + 좌뇌 브로카 언어 영역 자극',
        whyNeeded: '영상 대신 입체 플랩북을 만지고 부모와 의성어·의태어를 주고받을 때 어휘 폭발기 어휘 스키마가 단단해집니다.',
        buttonLabelCoupang: `쿠팡에서 '유아 첫 비주얼 플랩북 오감 말놀이 그림책' 바로 보기 ↗`
      }, buildPinpointUrls(
        '유아 첫 비주얼 플랩북 오감 말놀이 그림책 세트',
        'Toddler Sensory Flap Book Visual Board Books',
        '유아 오감 말놀이 그림책',
        affConfig
      )));
    } else if (ageYears <= 5) {
      tools.push(Object.assign({
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

      tools.push(Object.assign({
        id: 'visual_timer_pomodoro_4_5',
        categoryBadge: '⏳ 만 4~5세 전두엽 시간 감각 & 착석 집중 타이머',
        name: '타임타이머(Time Timer) 무소음 시각 집중 타이머 (15분 몰입 원반)',
        activeSpec: '빨간색 원반으로 남은 시간을 직관적으로 시각화 + 15분 착석 완수 루틴',
        whyNeeded: '초등 입학 전 스스로 시간의 흐름을 눈으로 보며 한 가지 놀이나 그림책을 끝까지 완수하는 전두엽 지구력을 형성합니다.',
        buttonLabelCoupang: `쿠팡에서 '타임타이머 무소음 시각 타이머 15분 집중 공부시계' 바로 보기 ↗`
      }, buildPinpointUrls(
        '타임타이머 무소음 시각 타이머 공부시계 유아 집중력',
        'Time Timer Visual Countdown Timer 15 Min Pomodoro',
        '유아 집중력 시간관리 시계',
        affConfig
      )));

      tools.push(Object.assign({
        id: 'soma_tangram_math_4_5',
        categoryBadge: '📐 만 4~5세 두정엽 공간 추론 수리 사고력 교구',
        name: '소마셈 K·P단계 창의연산 + 원목 칠교놀이·소마큐브 입체도형 세트',
        activeSpec: '구체물 도형 회전 조작 + 10 이하 가르기·모으기 수감각 체득',
        whyNeeded: '단순 숫자 암기가 아닌 손끝 조작을 통해 수의 구조와 공간 감각을 동시에 깨우쳐 수학 정서를 긍정적으로 만듭니다.',
        buttonLabelCoupang: `쿠팡에서 '원목 칠교놀이 소마큐브 유아 창의사고력 수학' 바로 보기 ↗`
      }, buildPinpointUrls(
        '원목 칠교놀이 소마큐브 유아 창의사고력 수학 퍼즐',
        'Wooden Tangram Soma Cube Geometric Puzzle Kids',
        '유아 창의사고력 도형 퍼즐',
        affConfig
      )));
    } else if (ageYears <= 8) {
      tools.push(Object.assign({
        id: 'gravitrax_stem_6_8',
        categoryBadge: '🔬 만 6~8세 전두엽 인과추론 & 소근육 정밀조립 교구',
        name: '그래비트랙스(GraviTrax) 코어 스타터 세트 & 원목 칠교 소마큐브',
        activeSpec: '중력·위치에너지 가설 실험 + 3차원 트랙 설계 전두엽 계획 회로 강화',
        whyNeeded: `초등 입학 전후 만 ${ageYears}세 아이가 스마트폰 대신 손끝으로 트랙 높이와 각도를 조절하며 물리적 인과관계와 공간 논리를 스스로 깨우치는 최고급 STEM 탐구 교구입니다.`,
        buttonLabelCoupang: `쿠팡에서 '그래비트랙스 코어 스타터 세트 소마큐브 칠교놀이' 바로 보기 ↗`
      }, buildPinpointUrls(
        '그래비트랙스 코어 스타터 세트 소마큐브 칠교놀이',
        'Ravensburger GraviTrax Marble Run STEM Toy',
        '초등 과학 탐구 도형 퍼즐',
        affConfig
      )));

      tools.push(Object.assign({
        id: 'ergonomic_bookstand_6_8',
        categoryBadge: '🪑 초등 거북목 예방 & 시선 분산 방지 학습도구',
        name: '초등 거북목 예방 높이·각도조절 원목 2단 독서대 (HW_02 표준형)',
        activeSpec: '경추 18kg 하중 차단(Hansraj 2014) + 시야 100% 교재 고정으로 착석 시간 2배 연장',
        whyNeeded: '고개를 숙이지 않아 목과 어깨 피로를 없애고 시선이 교재에만 고정되어 산만한 아이도 30분 이상 깊게 몰입합니다.',
        buttonLabelCoupang: `쿠팡에서 '초등 높이각도조절 원목 2단 독서대 거북목 예방' 바로 보기 ↗`
      }, buildPinpointUrls(
        '어린이 높이조절 원목 2단 독서대 거북목 교정',
        'Ergonomic Adjustable Wooden Book Stand Posture Kids',
        '바른 자세 독서법',
        affConfig
      )));

      tools.push(Object.assign({
        id: 'time_timer_focus_6_8',
        categoryBadge: '⏳ 전두엽 작업기억 외부화 & 20분 뽀모도로 타이머',
        name: '타임타이머(Time Timer) 초등 무소음 시각 집중 타이머',
        activeSpec: '남은 시간 시각화로 시간 압박감 해소 + 전두엽 충동 억제 훈련',
        whyNeeded: '스마트폰이나 시계 초침 소리 없이 20분 동안 한 과제에 온전히 몰입하는 전두엽 자기조절력을 완성합니다.',
        buttonLabelCoupang: `쿠팡에서 '타임타이머 무소음 시각 타이머 초등 학생용' 바로 보기 ↗`
      }, buildPinpointUrls(
        '타임타이머 초등 무소음 시각 집중 타이머 공부시계',
        'Time Timer MOD Visual Timer Kids Focus Pomodoro',
        '초등 자기주도 시각 타이머',
        affConfig
      )));
    } else {
      // Age 9+
      tools.push(Object.assign({
        id: 'microscope_science_kit_9_plus',
        categoryBadge: '🔬 만 9세+ 배외측 전전두엽(DLPFC) 과학 탐구 & 가설검증 도구',
        name: '초등·청소년 고배율 광학 현미경 프레파라트 과학실험 관찰 키트',
        activeSpec: '세포·식물·광물 미세 구조 관찰 + 가설 설정 및 관찰 일지 작성',
        whyNeeded: `만 ${ageYears}세는 전두엽 피질 재조직화와 추상적 사고가 폭발하는 시기입니다. 교과서 줄글로만 보던 과학 개념을 직접 눈으로 확인하고 탐구 일지를 쓰며 논리적 비판 사고력을 완성합니다.`,
        buttonLabelCoupang: `쿠팡에서 '초등 학생용 광학 현미경 과학실험 세트 프레파라트' 바로 보기 ↗`
      }, buildPinpointUrls(
        '초등 학생용 광학 현미경 프레파라트 과학실험 세트',
        'AmScope Kids Microscope Visual Countdown Timer',
        '자기주도학습 과학실험',
        affConfig
      )));

      tools.push(Object.assign({
        id: 'ergonomic_wide_stand_timer_9_plus',
        categoryBadge: '🪑 청소년 딥워크(Deep Work) 높이조절 원목 2단 독서대 & 시각타이머',
        name: '위즈독서대 / 독서대통령 와이드 2단 원목 독서대 + 무소음 시각 타이머',
        activeSpec: '상단 교재 독서 + 하단 백지복습 필기 2단 구조화 + 25분 뽀모도로',
        whyNeeded: '중·고등 내신과 수능 대비 방대한 교재를 시야에 올리고 바른 척추 정렬을 유지하며 딥워크 몰입을 실현합니다.',
        buttonLabelCoupang: `쿠팡에서 '와이드 높이조절 원목 2단 독서대 무소음 타이머' 바로 보기 ↗`
      }, buildPinpointUrls(
        '무소음 시각 타이머 공부 시계 원목 2단 독서대',
        'Adjustable 2-Tier Wooden Book Stand Ergonomic Reading Holder',
        '자기주도학습 딥워크 독서대',
        affConfig
      )));

      tools.push(Object.assign({
        id: 'cornell_active_recall_planner_9_plus',
        categoryBadge: '🧠 메타인지 백지복습(인출효과 +50%) 코넬 노트 & 플래너',
        name: '코넬식 메타인지 백지복습 요약 노트 & 100일 자기주도 스터디 플래너 세트',
        activeSpec: '단서(Cue)·핵심개념·1줄 요약 3분할 코넬 노트 + 오답 원인 역추적',
        whyNeeded: '설명을 듣는 수동적 공부에서 벗어나 스스로 책을 덮고 인출(Active Recall)하는 메타인지를 완성합니다 (PMID:16507066).',
        buttonLabelCoupang: `쿠팡에서 '코넬식 메타인지 백지복습 노트 100일 스터디플래너' 바로 보기 ↗`
      }, buildPinpointUrls(
        '코넬노트 백지복습 노트 초등 중등 메타인지 자기주도 스터디플래너',
        'Cornell Notes Notebook Study Planner Active Recall Student',
        '메타인지 공부법 코넬노트 스터디플래너',
        affConfig
      )));
    }

    return tools;
  }

  /**
   * 5-C3. Contextual Learning Tools & Environment Prescription for Pillar 2 (Chapter 8)
   */
  function renderPillar2LearningToolsPrescription(profile = {}, affConfig = {}) {
    const isEn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en');
    const learningTools = curatePillar2LearningTools(profile, affConfig);

    return `
      <div class="pinpoint-category-box" id="pillar2-learning-tools-box" style="margin-top: 1.25rem; background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(30, 27, 75, 0.55)); border: 1.5px solid rgba(139, 92, 246, 0.45); border-radius: 18px; padding: 1.25rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
          <span style="font-size: 0.78rem; font-weight: 900; color: #DDD6FE; background: rgba(139, 92, 246, 0.22); padding: 0.22rem 0.7rem; border-radius: 9999px;">
            🧩 [Chapter 8 연계 처방] 학습 환경 &amp; 두뇌 사고력 교구 처방
          </span>
          <span style="font-size: 0.76rem; color: #C4B5FD; font-weight: 700;">
            서파수면 기억 공고화 &amp; 전두엽 작업기억 외부화 표준 도구
          </span>
        </div>
        <h4 style="font-size: 1.08rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.35rem 0;">
          ${isEn ? 'Tailored Learning Environment, Timers & Cognitive Tools (Top 3)' : '위 뇌인지·학습병목 진단에 맞춘 학습 환경(독서대·타이머) &amp; 사고력 교구 TOP 3'}
        </h4>
        <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.85rem 0; line-height: 1.55;">
          스마트폰 미디어 자극을 줄이고 눈높이 독서대(경추 18kg 하중 차단)와 무소음 시각 타이머, 연령별 맞춤 입체 사고력 교구로 자기주도 몰입 환경을 세팅해 주세요.
        </p>
        ${renderCategoryProductCards(learningTools, 'rgba(139, 92, 246, 0.45)', 'learning_tool', isEn)}
      </div>
    `;
  }

  /**
   * 5-D0. 1:1 Bespoke Learning Counseling & Hyper-Targeted Learning Curation Engine
   * Diagnoses the child's exact `traitLearningConcerns`, `traitStudyStyle`, `traitFocusSpan`, and `ageYears`
   * with peer-reviewed learning-science citations and curates tailored study books, workbooks, and focus tools.
   */
  function curateLearningCounselingPlan(profile = {}, affConfig = {}) {
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const concerns = Array.isArray(profile.traitLearningConcerns) && profile.traitLearningConcerns.length > 0
      ? profile.traitLearningConcerns
      : ['reading_literacy'];
    const studyStyle = String(profile.traitStudyStyle || 'dialogue_question');

    const CONCERN_DB = {
      reading_literacy: {
        key: 'reading_literacy',
        badgeKo: '📖 문해력 · 독해력 병목 진단',
        titleKo: '긴 글·문장제 문제를 읽고 핵심을 파악하는 문해력이 부족할 때',
        rootCauseKo: '글자를 소리 내어 읽는 해독(Decoding)은 가능하지만, 문장의 핵심 인과관계를 좌측 후두-측두엽 시각단어형태영역(VWFA)에서 구조화하는 어휘 스키마(Schema)가 부족한 상태입니다.',
        prescriptionKo: '처음부터 두꺼운 줄글 책을 억지로 읽히지 마세요! 하루 15분 【하루 한장 비주얼 마인드맵 독해 워크북】으로 문단마다 핵심어 2개에 동그라미 치는 연습부터 시작하고, 읽은 뒤 부모와 "왜 그랬을까?" 3문장 요약 대화를 나누면 독서 매튜효과(Matthew Effect)가 점화됩니다.',
        paperCitationKo: '📚 학술 근거: Mol & Bus (2011, Psychological Bulletin · N=7,758 메타분석, 독서 노출량이 문해력 격차의 42% 결정 · PMID:21219058)',
        product: Object.assign({
          badgeKo: '🏆 문해력·독해 1순위 맞춤 처방',
          categoryKo: '📖 하루 15분 문단 구조화 & 비문학·문장제 문해력 돌파 워크북',
          titleKo: ageYears <= 3
            ? '유아 첫 오감 플랩북 · 의성어 말놀이 그림책 & 부모 상호작용 가이드 세트'
            : (ageYears <= 6
              ? '길벗스쿨 기적의 한글·유아 독해 & 어스본 그림책 생각열기 놀이북 세트'
              : (ageYears <= 9
                ? '천재교육 하루 한장 독해 · 길벗스쿨 기적의 독서 논술 (초등 문해력·어휘 마인드맵)'
                : '디딤돌 초등·중등 비문학 독해력 & 수능형 문단 요약·어휘 스키마 워크북 세트')),
          specKo: ageYears <= 3
            ? '하루 15분 입체 플랩북 만지기 + 부모와 눈 맞추며 의성어·의태어 주고받기'
            : '하루 15분 1지문 핵심어 찾기 + 시각 마인드맵 구조화로 국어·수학 문장제 문해력 동시 강화',
          whyKo: ageYears <= 3
            ? '복잡한 글자 읽기 대신 오감 그림책과 부모의 따뜻한 목소리로 언어 뇌(브로카 영역)를 깨워줍니다.'
            : '눈으로만 흘려 읽는 습관을 교정하고 문단의 중심 문장과 인과관계를 손으로 구조화하게 해줍니다.'
        }, buildPinpointUrls(
          ageYears <= 3 ? '유아 첫 오감 플랩북 말놀이 그림책 세트' : (ageYears <= 6 ? '기적의 유아 독해 한글 어휘 그림책 세트' : (ageYears <= 9 ? '천재교육 하루 한장 독해 기적의 독서 논술 초등 문해력 워크북' : '디딤돌 초등 고학년 중등 비문학 독해력 어휘력 워크북')),
          'Scholastic Reading Comprehension Graphic Organizers Workbook',
          ageYears <= 3 ? '유아 오감 말놀이 그림책' : (ageYears <= 6 ? '기적의 유아 독해' : (ageYears <= 9 ? '하루 한장 독해 초등 문해력' : '디딤돌 비문학 독해력')),
          affConfig
        ))
      },
      math_concept: {
        key: 'math_concept',
        badgeKo: '📐 수리 · 사고력 수학 병목 진단',
        titleKo: ageYears <= 4 ? '크기·모양·숫자 세기 등 기초 수 감각을 놀이로 깨우치고 싶을 때' : '단순 연산은 해도 도형·응용·사고력 수학에서 막혀할 때',
        rootCauseKo: '기계적 계산 절차만 암기했을 뿐, 두정엽의 3차원 정신적 도형 회전(Mental Rotation) 경험이 부족하고 긴 문장제 조건을 머릿속에 유지하는 전두엽 작업기억(Working Memory)에 과부하가 걸리기 때문입니다.',
        prescriptionKo: ageYears <= 3
          ? '만 3세 이하 영유아에게는 학습지나 복잡한 수식이 아닌 【원목 도형 끼우기·크기 비교 블록 놀이】가 수리 두뇌의 출발점입니다. "어떤 블록이 더 클까?" 대화하며 손으로 직접 만지게 해주세요.'
          : '연산 문제집 비중을 30%로 줄이세요! 문장제·응용 문제를 풀 때는 암산을 멈추고 ① 구하려는 것에 밑줄 긋기, ② 조건을 여백에 그림·수직선·표로 직접 그리기(작업기억 외부화), ③ 칠교·소마큐브·창의사고력 도형 워크북을 손으로 조작하며 풀게 해주세요.',
        paperCitationKo: '📚 학술 근거: Mix et al. (2016, J Educ Psychol · 공간회전력과 수학 응용력 상관 r=0.54 · DOI:10.1037/edu0000105) & Gathercole et al. (2004, 작업기억과 수학 성취 · PMID:14979759)',
        product: Object.assign({
          badgeKo: '🏆 사고력·도형 수학 1순위 처방',
          categoryKo: '📐 두정엽 시공간 회전 & 문장제 조건 시각화 사고력 수학 세트',
          titleKo: ageYears <= 3
            ? '몬테소리 원목 도형 맞추기 퍼즐 & 크기·색깔 분류 수감각 블록 세트'
            : (ageYears <= 6
              ? '소마셈 K·P단계 창의연산 + 원목 칠교놀이·소마큐브·패턴블록 도형 놀이 세트'
              : (ageYears <= 9
                ? '팩토(FACTO) / 필즈수학 초등 창의사고력 수학 & 플라토 입체도형 공간지각 워크북'
                : '디딤돌 최상위연산·문장제 조건 시각화 노트 & 중등 기하·함수 개념 구조화 워크북')),
          specKo: '구체물 도형 회전 조작 + 문장제 조건을 그림·식으로 바꾸는 단계별 사고력 훈련',
          whyKo: '단순 계산기식 암산에서 벗어나 도형 감각과 응용 문제 해결 자신감을 근본적으로 끌어올립니다.'
        }, buildPinpointUrls(
          ageYears <= 3 ? '몬테소리 원목 도형 맞추기 퍼즐 수감각 블록' : (ageYears <= 6 ? '소마셈 유아 창의사고력 수학 칠교놀이 소마큐브 워크북' : (ageYears <= 9 ? '창의사고력 수학 팩토 플라토 도형 문장제 워크북' : '디딤돌 초등 사고력 수학 문장제 기하 도형 워크북')),
          'Singapore Math Challenging Word Problems Spatial Geometry Workbook',
          ageYears <= 3 ? '유아 원목 도형 퍼즐' : (ageYears <= 6 ? '소마셈 창의사고력 수학' : (ageYears <= 9 ? '창의사고력 수학 팩토 플라토' : '디딤돌 사고력 수학 문장제')),
          affConfig
        ))
      },
      passive_forget: {
        key: 'passive_forget',
        badgeKo: `🧠 [만 ${ageYears}세 맞춤] 기억 정착 · 자기주도 인출 병목 진단`,
        titleKo: ageYears <= 6 ? '배운 낱말이나 그림책 내용을 금방 잊어버릴 때' : '학원·설명을 들어도 금방 잊어버리고 스스로 복습이 안 될 때',
        rootCauseKo: '선생님이나 부모님의 설명을 눈과 귀로만 따라가는 수동적 학습은 "내가 다 안다"는 유창성 착각(Fluency Illusion)을 일으켜 해마 단기기억에만 머물다 1주일 내 52%가 망각됩니다.',
        prescriptionKo: ageYears <= 6
          ? '그림책이나 놀이를 마친 직후 딱 3분만 책을 덮고 【아이에게 오늘 가장 재미있었던 장면 1가지를 그림으로 그리거나 엄마에게 이야기해 주기】를 실천하세요! 그리고 밤 9시 30분~10시 전 숙면에 들면 해마 단기기억이 대뇌 장기기억으로 코팅됩니다.'
          : '학원 다녀온 직후 딱 5분만 책을 덮고 【코넬 백지복습 노트에 오늘 배운 핵심 3가지 적기(Active Recall)】 또는 【엄마에게 일일 선생님이 되어 1분간 설명하기(파인만 기법)】를 실천하세요! 그리고 밤 10시 전 서파수면에 진입하면 해마 단기기억이 대뇌 장기기억으로 +50% 이상 공고화됩니다.',
        paperCitationKo: '📚 학술 근거: Roediger & Karpicke (2006, Psychol Sci · 인출학습 장기기억 보존 +50% · PMID:16507066) & Diekelmann & Born (2010, Nat Rev Neurosci · 서파수면 기억 공고화 · PMID:20046194)',
        product: Object.assign({
          badgeKo: `🏆 [만 ${ageYears}세 맞춤] 장기기억·복습 1순위 처방`,
          categoryKo: ageYears <= 6
            ? '🧠 만 1~6세 유아 기억력·표현력을 깨우는 스토리텔링 그림일기 & 생각열기 워크북'
            : '🧠 인출효과(+50%) 코넬식 백지복습 노트 & 자기주도 스터디 플래너',
          titleKo: ageYears <= 3
            ? '유아 첫 낱말·사물 인지 플래시카드 & 들춰보기 기억력 플랩북 세트'
            : (ageYears <= 6
              ? '유아 생각 표현 그림일기장 · 이야기 순서 맞추기 카드 & 스티커 워크북 세트'
              : (ageYears <= 9
                ? '초등 저학년 오늘 배운 내용 3줄 백지복습 노트 & 일일 성취 스터디 플래너'
                : '초등 고학년·청소년 코넬식 메타인지 백지복습 요약 노트 & 100일 스터디 플래너 세트')),
          specKo: ageYears <= 6
            ? '그림책 읽은 뒤 장면 떠올려 말하기 + 손끝 스티커·그림으로 기억 인출 훈련'
            : '단서(Cue)·핵심개념·1줄 요약 3분할 코넬 노트 + 오답 원인 역추적 체크리스트',
          whyKo: ageYears <= 6
            ? '아이 눈높이에서 방금 본 내용을 스스로 떠올려 말하고 표현하게 하여 해마 장기기억 회로를 단단하게 만듭니다.'
            : '책을 덮고 스스로 인출(Active Recall)해 봄으로써 아는 것과 모르는 것을 정확히 구분하는 메타인지를 완성합니다.'
        }, buildPinpointUrls(
          ageYears <= 3 ? '유아 사물 인지 플래시카드 기억력 플랩북' : (ageYears <= 6 ? '유아 그림일기장 이야기 순서 카드 생각열기 워크북' : '코넬노트 백지복습 노트 초등 중등 메타인지 자기주도 스터디플래너'),
          'Cornell Notes Notebook Study Planner Active Recall Student',
          ageYears <= 6 ? '유아 생각열기 그림일기 워크북' : '메타인지 공부법 코넬노트 스터디플래너',
          affConfig
        ))
      },
      screen_dopamine: {
        key: 'screen_dopamine',
        badgeKo: `📱 [만 ${ageYears}세 맞춤] 미디어 도파민 · 학습 흥미 병목 진단`,
        titleKo: '스마트폰·유튜브 자극에 익숙해 책이나 공부에 흥미가 없을 때',
        rootCauseKo: '빠르게 전환되는 영상·게임의 고농도 도파민 스파이크에 뇌 보상회로가 적응하면서, 전두엽과 언어 중추를 잇는 백질 수초화가 지연되고 느린 호흡의 텍스트에 지루함을 느끼는 상태입니다.',
        prescriptionKo: '스마트폰을 갑자기 뺏으면 반발심만 커집니다. 【무소음 시각 타이머 15분】을 세팅해 연령에 맞는 손끝 입체교구(원목교구·자석블록·그래비트랙스·두뇌퍼즐)를 먼저 끝낸 뒤 정해진 시간만 미디어를 허용하는 "선(先) 전두엽 몰입 → 후(後) 보상" 루틴으로 도파민 기준선을 낮춰주세요.',
        paperCitationKo: '📚 학술 근거: Hutton et al. (2020, JAMA Pediatrics · 스크린 미디어 노출과 뇌 언어·집중 백질 수초화 DTI 연구 · PMID:31682712)',
        product: Object.assign({
          badgeKo: `🏆 [만 ${ageYears}세 맞춤] 도파민 디톡스 · 몰입 전환 1순위`,
          categoryKo: '📱 스마트폰 대신 손끝과 눈을 사로잡는 연령별 입체 교구 & 시각 집중 타이머',
          titleKo: ageYears <= 3
            ? '유아 무소음 시각 타이머 + 원목 구슬꿰기·자석 낚시·원목 퍼즐 손끝 몰입 세트'
            : (ageYears <= 6
              ? '타임타이머 무소음 시각 타이머 + 매그나타일즈/맥포머스 3D 입체 자석블록 세트'
              : '타임타이머(Time Timer) 무소음 시각 집중 타이머 + 스마트게임즈 IQ 퍼즐·그래비트랙스 몰입 세트'),
          specKo: '남은 시간을 직관적으로 보여주는 무소음 원판 타이머 + 연령 맞춤 손끝 입체 미션',
          whyKo: '디지털 화면 없이도 손끝 조작과 단계별 미션 클리어를 통해 건강한 성취 도파민을 회복시킵니다.'
        }, buildPinpointUrls(
          ageYears <= 3 ? '유아 원목 자석 낚시 구슬꿰기 타임타이머' : (ageYears <= 6 ? '유아 투명 자석블록 타임타이머 집중력 시계' : '타임타이머 무소음 시각 타이머 스마트게임즈 IQ퍼즐 두뇌보드게임'),
          'Time Timer MOD Visual Timer SmartGames IQ Puzzler Pro',
          '스마트폰 이기는 독서 공부 습관',
          affConfig
        ))
      },
      desk_endurance: {
        key: 'desk_endurance',
        badgeKo: `🪑 [만 ${ageYears}세 맞춤] 착석 지구력 · 학습 자세 병목 진단`,
        titleKo: '책상에 15~20분 이상 바른 자세로 앉아 있기 힘들고 산만할 때',
        rootCauseKo: '전두엽 억제조절(Inhibitory Control) 회로가 발달 중이거나, 평면 책상에 고개를 숙여 경추 하중(15~18kg)과 흉곽 압박으로 뇌 산소 공급이 떨어져 신체적 피로가 빨리 오기 때문입니다.',
        prescriptionKo: '공부·독서 시작 전 5분 트램폴린·스트레칭으로 뇌 각성도(세로토닌·BDNF)를 깨운 뒤, 【눈높이 각도조절 원목 독서대 + 15분 뽀모도로 타이머】 조합으로 고개를 세우고 짧고 굵게 몰입하는 습관을 들여주세요. 숨은 키 +1.8cm와 집중 지속시간이 동시에 살아납니다.',
        paperCitationKo: '📚 학술 근거: Moffitt et al. (2011, PNAS · 전두엽 자기조절력 32년 종단 연구 · PMID:21310973) & Hansraj (2014, 경추 굴곡 생체역학 하중 · PMID:25393825)',
        product: Object.assign({
          badgeKo: `🏆 [만 ${ageYears}세 맞춤] 바른 착석 · 집중 지구력 1순위`,
          categoryKo: '🪑 거북목·산만함 동시 교정 눈높이 원목 독서대 & 집중 타이머',
          titleKo: ageYears <= 5
            ? '유아용 그림책 전면 거치 원목 독서대 & 바른자세 유아 책상의자·시각 타이머 세트'
            : '위즈독서대 / 독서대통령 높이·각도조절 원목 2단 독서대 + 학습 집중 스터디 타이머 세트',
          specKo: '아이 눈높이 맞춤 각도 조절로 경추 C자 커브 보호 및 시선 집중 유지',
          whyKo: '고개를 숙이지 않아 목·어깨 피로가 줄어들고, 시야가 책에만 고정되어 착석 유지 시간이 2배 이상 늘어납니다.'
        }, buildPinpointUrls(
          ageYears <= 5 ? '유아 그림책 원목 독서대 유아 바른자세 책상의자' : '위즈독서대 높이각도조절 원목 2단 독서대 초등 바른자세',
          'Adjustable 2-Tier Wooden Book Stand Ergonomic Reading Holder',
          '집중력 바른 자세 공부법',
          affConfig
        ))
      },
      vocab_expression: {
        key: 'vocab_expression',
        badgeKo: `🗣️ [만 ${ageYears}세 맞춤] 어휘력 · 서술형 표현 병목 진단`,
        titleKo: '어휘력이 부족하거나 생각을 말·서술형 글로 표현하기 어려워할 때',
        rootCauseKo: '단답형·객관식 문제풀이나 일방적 영상 시청에 익숙해져 좌측 전두엽 브로카 영역(언어 생성 중추)과 손끝 운필 신경망이 스스로 문장을 조직해 발화할 기회가 부족했기 때문입니다.',
        prescriptionKo: ageYears <= 6
          ? '하루 10분 【유아 의성어·의태어 그림책 & 낱말 말놀이 카드】로 어휘 뿌리를 넓히고, 저녁 식탁에서 【부모-자녀 이야기 질문카드】를 1장 뽑아 "네 생각은 어때? 만약 네가 주인공이라면 어땠을까?"라고 5회 이상 대화를 주고받으세요.'
          : '하루 10분 【초등·청소년 교과 필수 어휘·한자어 마인드맵 워크북】으로 어휘 뿌리를 넓히고, 저녁 식탁에서 【하브루타 질문카드】를 1장 뽑아 "네 생각은 어때? 왜 그렇게 생각했어?"라고 5회 이상 대화 턴(Turn-taking)을 주고받으며 완성된 문장으로 말해보게 하세요.',
        paperCitationKo: '📚 학술 근거: Romeo et al. (2018, Psychological Science · MIT/하버드 대화 턴과 브로카 영역 활성 r=0.51 · PMID:29648612) & Fiorella & Mayer (2014, 설명하기 효과 d=0.77)',
        product: Object.assign({
          badgeKo: `🏆 [만 ${ageYears}세 맞춤] 어휘력 · 하브루타 표현 1순위`,
          categoryKo: '🗣️ 좌뇌 브로카 영역을 깨우는 연령별 어휘력 & 부모-자녀 하브루타 질문카드',
          titleKo: ageYears <= 3
            ? '유아 첫 낱말 말놀이 사운드북·세이펜 어휘 병풍책 & 부모 대화 가이드 세트'
            : (ageYears <= 6
              ? '유아 한글 어휘 마인드맵 스티커북 & 유치원생 눈높이 하브루타 그림 질문카드 세트'
              : (ageYears <= 9
                ? '길벗스쿨 기적의 어휘력 (초등 저학년) & 초등 교과서 어휘 마인드맵·하브루타 질문카드 세트'
                : '초등 고학년·중등 비문학 한자어·교과 어휘 스키마 워크북 & 심화 하브루타 토론카드 세트')),
          specKo: `만 ${ageYears}세 발달 단계 맞춤 어휘 확장 워크북 + 식탁·차 안에서 대화 턴을 늘려주는 질문카드`,
          whyKo: '단어 뜻을 정확히 이해하고 자신의 생각을 논리적인 말과 문장으로 인출하는 힘을 길러줍니다.'
        }, buildPinpointUrls(
          ageYears <= 3 ? '유아 낱말 사운드북 어휘 병풍책 말놀이 카드' : (ageYears <= 6 ? '유아 한글 어휘 스티커북 유아 하브루타 질문카드' : '기적의 어휘력 초등 교과서 어휘 한자어 워크북 하브루타 질문카드'),
          'Wordly Wise 3000 Vocabulary Workbook Conversation Cards Kids',
          ageYears <= 6 ? '유아 어휘력 말놀이 그림책' : '기적의 어휘력 초등 어휘 워크북',
          affConfig
        ))
      }
    };

    const STUDY_STYLE_DB = {
      dialogue_question: {
        badgeKo: '🗣️ 질문·대화·설명형 (하브루타·파인만 스타일)',
        coachingKo: '혼자 조용히 문제집만 풀게 하면 쉽게 지루해합니다. 공부한 뒤 부모님께 <strong>"일일 선생님"이 되어 3분간 말로 설명하게 하거나(파인만 학습법), 식탁에서 하브루타 질문카드로 문답</strong>을 주고받을 때 좌뇌 브로카 영역과 장기기억 보존율이 2.4배 높아집니다.',
        styleProduct: CONCERN_DB.vocab_expression.product
      },
      play_manipulative: {
        badgeKo: '🧩 손끝 조작·체험·교구형 (구체물 몰입 스타일)',
        coachingKo: ageYears <= 3
          ? '만 3세 영유아기에는 글자 학습지 대신 <strong>원목 집게·구슬꿰기·도형 맞추기 블록으로 손끝 소근육을 먼저 깨워준 뒤</strong> 오감 그림책 놀이로 연결해 주세요. 손끝 조작이 전두엽 실행기능을 깨워 집중력이 3배 깊어집니다.'
          : (ageYears <= 6
            ? '눈으로만 개념을 읽게 하지 마시고, <strong>만 4~6세 시기에 맞는 입체 도형 블록(은물·가베·자석블록·칠교)으로 손끝 감각을 먼저 깨워준 뒤</strong> 놀이북으로 연결해 주세요. 소근육 조작이 전두엽 실행기능을 깨워 집중력이 3배 깊어집니다.'
            : '눈으로만 개념을 읽게 하지 마시고, <strong>초등·청소년 눈높이에 맞는 입체 기하 퍼즐(소마큐브·그래비트랙스)·과학 실험 키트·조건 그림 그리기로 손끝과 시각을 먼저 깨워준 뒤</strong> 개념서로 연결해 주세요.'),
        styleProduct: CONCERN_DB.math_concept.product
      },
      visual_story: {
        badgeKo: '🎨 시각 마인드맵·스토리텔링형 (비주얼 씽킹 스타일)',
        coachingKo: '줄글 암기보다 <strong>색깔 펜으로 핵심 개념을 마인드맵·도표로 그리게 하고, 역사·과학 인포그래픽 도감이나 스토리텔링 교양서</strong>를 마중물로 읽힌 뒤 교과서로 넘어가면 개념 흡수 속도가 비약적으로 빨라집니다.',
        styleProduct: CONCERN_DB.reading_literacy.product
      },
      goal_workbook: {
        badgeKo: '✅ 일일 목표·체크리스트 성취형 (자기주도 플래너 스타일)',
        coachingKo: '분량이 많은 두꺼운 문제집보다 <strong>"하루 한 장·하루 2쪽"처럼 끝이 명확한 일일 분권형 워크북과 스터디 플래너 체크리스트, 무소음 시각 타이머</strong>를 세트로 주면 스스로 미션을 완수하는 성취 도파민이 폭발합니다.',
        styleProduct: CONCERN_DB.passive_forget.product
      }
    };

    const diagnosedConcerns = concerns.map(k => CONCERN_DB[k]).filter(Boolean);
    if (diagnosedConcerns.length === 0) {
      diagnosedConcerns.push(CONCERN_DB.reading_literacy);
    }

    const activeStyle = STUDY_STYLE_DB[studyStyle] || STUDY_STYLE_DB.dialogue_question;

    // Build exactly 3 deduplicated, hyper-targeted learning curation items
    const learningItems = [];
    const seenTitles = new Set();
    diagnosedConcerns.forEach((dc) => {
      if (learningItems.length < 3 && dc.product && !seenTitles.has(dc.product.titleKo)) {
        seenTitles.add(dc.product.titleKo);
        learningItems.push(dc.product);
      }
    });
    if (learningItems.length < 3 && activeStyle.styleProduct && !seenTitles.has(activeStyle.styleProduct.titleKo)) {
      seenTitles.add(activeStyle.styleProduct.titleKo);
      learningItems.push(activeStyle.styleProduct);
    }
    const fallbackKeys = ['reading_literacy', 'math_concept', 'passive_forget', 'desk_endurance', 'screen_dopamine', 'vocab_expression'];
    for (const fk of fallbackKeys) {
      if (learningItems.length >= 3) break;
      const cand = CONCERN_DB[fk].product;
      if (!seenTitles.has(cand.titleKo)) {
        seenTitles.add(cand.titleKo);
        learningItems.push(cand);
      }
    }

    return {
      diagnosedConcerns,
      activeStyle,
      learningItems
    };
  }

  /**
   * 5-D. Chapter 6: Custom Education & 1:1 Learning Counseling Prescription
   * (뇌인지 결과 기반 어떤 교육이 왜 필요한지 진단 + 1:1 맞춤형 학습 상담 진단서 + 맞춤 도서·워크북·학습도구 큐레이팅)
   */
  function renderCustomEducationChapter(profile = {}, affConfig = {}) {
    const isEn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en');
    const data = curatePinpointItems(profile, affConfig);
    const learningPlan = curateLearningCounselingPlan(profile, affConfig);
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const bookTraitNote = getTraitSpecificNote(profile, 'book', isEn);
    const cogAxes = Array.isArray(profile.cognitiveAxes) && profile.cognitiveAxes.length > 0
      ? profile.cognitiveAxes
      : ['science_nature'];
    const temps = Array.isArray(profile.traitTemperament) && profile.traitTemperament.length > 0
      ? profile.traitTemperament
      : ['explorer'];
    const focusSpan = profile.traitFocusSpan || '15_20m';

    // Determine Age-Specific Core Pedagogy Diagnosis
    let eduStageBadge = '';
    let eduHeadline = '';
    let eduWhyNeeded = '';
    let eduAvoidPitfall = '';
    let eduMethodComparison = [];

    if (ageYears <= 3) {
      eduStageBadge = `만 ${ageYears}세 · 대뇌 운동피질 손끝 민감기 & 자율성 폭발기`;
      eduHeadline = '지식 주입이나 빠른 학습지 대신 【몬테소리 일상감각 · 손끝 소근육(Pincer Grasp) 자율 교육】이 1순위입니다';
      eduWhyNeeded = `만 ${ageYears}세는 대뇌 운동피질의 약 30%가 손가락 끝 신경과 직결되어 시냅스가 폭발적으로 연결되는 시기입니다. 아이가 "내가 혼자 할 거야!"라고 고집을 부리는 것은 반항이 아니라, 전두엽 자기조절력과 눈-손 협응 회로를 스스로 완성하려는 신호(Lillard & Else-Quest, Science 2006)입니다.`;
      eduAvoidPitfall = '아직 손끝 악력과 세 손가락 집기(엄지·검지·중지)가 완성되기 전에 복잡한 입체 가베나 글자 통암기 카드를 주면 쉽게 좌절하고 흥미를 잃습니다.';
      eduMethodComparison = [
        { title: '🥇 1순위 필수: 몬테소리 일상·감각 소근육 교육', desc: '원목 집게로 폼폼이 옮기기, 구슬 꿰기, 안전가위 오리기 등 손끝 정교성을 키우는 활동이 초등 입학 후 수학·독해력을 결정합니다(Grissmer et al., 2010).' },
        { title: '🥈 2순위 병행: 오감 그림책 & 의성어·의태어 상호작용', desc: '일방적인 영상 시청을 줄이고, 플랩북·촉감책을 엄마 아빠와 함께 만지고 질문하며 브로카 언어영역을 자극하세요.' },
        { title: '⏳ 다음 단계 예고 (만 4~5세~): 프뢰벨 은물·가베 입체도형', desc: '손끝 소근육이 충분히 잡힌 만 4세 이후부터 자석블록·은물로 넘어가야 중복 지출 없이 200% 활용합니다.' }
      ];
    } else if (ageYears <= 6) {
      eduStageBadge = `만 ${ageYears}세 · 두정엽 3D 공간지각 & 전두엽 실행기능 도약기`;
      eduHeadline = '단순 연산 반복 대신 【프뢰벨 은물·가베·자석블록 3D 공간도형 교육 & 스토리텔링 수감각】이 필요한 시기입니다';
      eduWhyNeeded = `만 ${ageYears}세는 뇌가 평면(2D)에서 입체(3D)로 확장되며 두정엽의 심상회전(Mental Rotation) 회로와 전전두엽의 실행기능(작업기억·충동억제)이 급격히 발달하는 골든타임입니다. 손으로 직접 대칭·비례·기하 구조물을 만들어본 경험이 초등 고학년 도형·물리 사고력의 뿌리가 됩니다.`;
      eduAvoidPitfall = '취학 전 불안감으로 연산 문제집만 기계적으로 풀게 하면 수학 정서가 무너집니다. 손으로 만지는 구체물(블록·칠교·패턴)로 수의 구조를 먼저 눈으로 보게 해주세요.';
      eduMethodComparison = [
        { title: '🥇 1순위 필수: 은물·가베 & 자석 입체블록 3D 조형 교육', desc: '정육면체 분할·결합과 입체 트랙 설계를 통해 공간지각력과 물리적 인과관계 추론 회로를 동시에 깨웁니다.' },
        { title: '🥈 2순위 병행: 음운인식 & 그림책 하브루타 대화 교육', desc: '글자를 읽는 것보다 중요한 것은 이야기를 듣고 "만약 네가 주인공이라면 어떻게 했을까?"를 상상해 말해보는 문해력입니다.' },
        { title: '🥉 3순위 습관: 무소음 시각 타이머 15~20분 착석 루틴', desc: '초등 입학 전 스스로 정해진 시간 동안 한 가지 놀이나 워크북을 끝까지 완수하는 전두엽 지구력을 길러주세요.' }
      ];
    } else if (ageYears <= 9) {
      eduStageBadge = `만 ${ageYears}세 · 초등 구체적 조작기 & 배외측 전전두엽(DLPFC) 성장기`;
      eduHeadline = '정답 맞히기식 문제풀이 대신 【3단계 하브루타 질문독서 & STEAM 원리 실험·탐구 교육】으로 전환해야 합니다';
      eduWhyNeeded = `만 ${ageYears}세는 피아제 인지발달 이론상 '구체적 조작기'에 해당하며, 만 9세경 배외측 전전두엽(DLPFC) 피질 두께가 정점에 도달합니다. 이때 눈으로 직접 실험·관찰하고 부모에게 자신의 말로 원리를 설명해 보는 경험이 평생의 메타인지와 학습 자존감을 좌우합니다.`;
      eduAvoidPitfall = '선행 진도 위주의 학원 뺑뺑이는 아이를 수동적 암기 기계로 만들고 밤 10시 수면 골든타임까지 침해하여 키 성장과 전두엽 발달을 동시에 깎아먹습니다.';
      eduMethodComparison = [
        { title: '🥇 1순위 필수: 부모-자녀 3단계 하브루타 질문독서', desc: '책을 읽은 뒤 ① 사실 확인 → ② 이유·원리 추론("왜 그랬을까?") → ③ 적용·확장 질문으로 생각을 말과 글로 구조화합니다.' },
        { title: '🥈 2순위 병행: STEAM 과학 실험·역사 스토리텔링 탐구', desc: '현미경 관찰, 과학 키트 실험, 역사 인물 탐구처럼 교과 개념을 실제 사물·사건과 연결하는 체험형 교육이 가장 효과적입니다.' },
        { title: '🥉 3순위 습관: 메타인지 1줄 요약 & 바른 독서 자세', desc: '하루 20분 눈높이 독서대에서 책을 읽고 오늘 새롭게 알게 된 핵심 1문장을 스스로 적어보는 루틴을 시작하세요.' }
      ];
    } else if (ageYears <= 13) {
      eduStageBadge = `만 ${ageYears}세 · 형식적 조작기 진입 & 2차 시냅스 가지치기(Pruning) 골든타임`;
      eduHeadline = '수동적 인강·학원 수강을 줄이고 【메타인지 백지복습(인출 학습) & 비문학 문해력·개념 구조화 교육】에 집중하세요';
      eduWhyNeeded = `만 ${ageYears}세는 추상적·가설연역적 사고가 가능해지는 시기이자, 뇌가 자주 쓰는 신경회로만 남기고 수초화(Myelination·전달속도 100배 가속)하는 결정적 재조직화 구간입니다. 눈으로만 읽는 공부는 뇌에 남지 않으며, 책을 덮고 스스로 설명·인출하는 공부가 전두엽 회로를 단단히 코팅합니다.`;
      eduAvoidPitfall = '밤 11시~12시까지 이어지는 심야 학원·숙제는 코르티솔(스트레스 호르몬)을 높여 해마 기억 공고화를 방해하고 급성장기(PHV) 성장호르몬을 최대 38% 억제합니다.';
      eduMethodComparison = [
        { title: '🥇 1순위 필수: 메타인지 백지복습 & 파인만 설명법', desc: '오늘 배운 수학·과학·사회 개념을 백지에 마인드맵으로 그려보거나 부모님께 3분간 선생님처럼 설명해 보게 하세요.' },
        { title: '🥈 2순위 병행: 교과 연계 비문학(과학·역사·철학) 심화 독해', desc: '중·고등 내신과 수능의 핵심 병목은 어휘력과 긴 지문 문해력입니다. 매일 비문학 칼럼/교양서 2쪽씩 문단 요약을 실천하세요.' },
        { title: '🥉 3순위 습관: 밤 10시 취침 사수를 위한 방과후 골든타임 몰입', desc: '시각 타이머로 방과후~저녁 9시 사이에 25분 고밀도 몰입(뽀모도로)으로 학습을 끝내고 밤 10시 전 숙면에 들어가는 것이 성적과 키를 모두 잡는 비결입니다.' }
      ];
    } else {
      eduStageBadge = `만 ${ageYears}세 · 전두엽 백질 수초화 완성 & 고차원 자기주도 전략기`;
      eduHeadline = '잠을 줄이는 소모전 대신 【25분 딥워크(Deep Work) 초집중 인출 학습 & 서파수면 기억 공고화 교육】이 핵심입니다';
      eduWhyNeeded = `청소년 후기에는 전두엽과 변연계를 잇는 백질 수초화가 완성됩니다. 수면 중 서파수면(SWS)과 렘수면 단계에서 낮에 학습한 해마의 단기 기억이 대뇌 피질의 장기 기억으로 이전(Consolidation)되므로, 수면 효율과 낮 시간 무방해 몰입 밀도가 성적을 결정합니다.`;
      eduAvoidPitfall = '스마트폰을 옆에 두고 4시간 앉아 있는 가짜 공부나 새벽 2시까지의 카페인·야식 학습은 기억 저장 효율을 절반 이하로 떨어뜨립니다.';
      eduMethodComparison = [
        { title: '🥇 1순위 필수: 스마트폰 격리 25분 뽀모도로 & 오답 원인 역추적', desc: '시각 타이머를 활용해 25분 완전 몰입 + 5분 철봉·스트레칭 휴식 주기로 뇌 피로를 리셋하고, 틀린 문제는 발상 조건을 한 줄로 정리합니다.' },
        { title: '🥈 2순위 병행: 개념 간 연결망(Schema) 구축 & 논술형 인출', desc: '단편적 암기 대신 단원 간 인과관계를 구조화하고 백지에 스스로 증명·서술하는 연습이 최상위권 변별력을 만듭니다.' },
        { title: '🥉 3순위 습관: 뇌 피로 회복과 척추 감압을 결합한 루틴', desc: '책상 착석 50분마다 2분씩 흉추 신전 스트레칭과 눈높이 독서대 사용으로 경추 피로와 두통을 예방하세요.' }
      ];
    }

    // Focus span specific coaching
    let focusCoachingKo = '15~20분 단위로 작은 미션을 주고 완수할 때마다 구체적인 과정 칭찬을 해주세요.';
    if (focusSpan === 'under_10m') {
      focusCoachingKo = '현재 집중 유지 시간이 10분 미만이므로, 처음부터 30분 앉혀두려 하지 마시고 <strong>무소음 시각 타이머로 딱 10분 미션</strong>부터 시작해 성취 도파민을 쌓아주세요.';
    } else if (focusSpan === '30m_plus') {
      focusCoachingKo = '30분 이상 깊은 몰입이 가능한 우수한 전두엽 지속력을 가지고 있습니다! 단, 40분 이상 연속 착석 시 성장판과 척추 디스크가 눌리므로 <strong>40분 몰입 후 반드시 5분 스트레칭·물 마시기 휴식</strong>을 넣어주세요.';
    }

    return `
      <div id="pinpoint-custom-prescription-section" data-chapter="custom-education-chapter-box" style="text-align: left;">
        <!-- Part 1: Clinical Educational Diagnosis (Why & What Education is Needed) -->
        <div style="background: linear-gradient(145deg, rgba(30, 27, 75, 0.92), rgba(15, 23, 42, 0.96)); border: 1.5px solid rgba(139, 92, 246, 0.48); border-radius: 18px; padding: 1.3rem; margin-bottom: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.55rem;">
            <span style="background: rgba(139, 92, 246, 0.22); color: #DDD6FE; font-size: 0.8rem; font-weight: 900; padding: 0.24rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(139, 92, 246, 0.45);">
              🎓 ${eduStageBadge}
            </span>
            <span style="font-size: 0.78rem; color: #34D399; font-weight: 800;">
              Chapter 5 5각 뇌인지 · 기질 · 집중시간 연동 판정
            </span>
          </div>

          <h4 style="font-size: 1.14rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.65rem 0; line-height: 1.45;">
            ${eduHeadline}
          </h4>

          <div style="background: rgba(255, 255, 255, 0.04); border-left: 4px solid #A78BFA; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 0.95rem; font-size: 0.88rem; color: #E2E8F0; line-height: 1.62;">
            <strong style="color: #C4B5FD; display: block; margin-bottom: 0.25rem;">🧠 왜 지금 우리 아이에게 이 교육이 필요할까요? (뇌과학적 근거)</strong>
            ${eduWhyNeeded}
          </div>

          <!-- 3-Priority Educational Methods Sequential List (1위 → 2위 → 3위) -->
          <div style="display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 0.95rem;">
            ${eduMethodComparison.map(m => `
              <div style="background: rgba(15, 23, 42, 0.88); border: 1px solid rgba(196, 181, 253, 0.25); border-radius: 12px; padding: 0.9rem 1.05rem;">
                <div style="font-size: 0.92rem; font-weight: 900; color: #DDD6FE; margin-bottom: 0.3rem;">${m.title}</div>
                <p style="font-size: 0.85rem; color: #CBD5E1; line-height: 1.52; margin: 0;">${m.desc}</p>
              </div>
            `).join('')}
          </div>

          <!-- Focus Span & Pitfall Alert Sequential Column -->
          <div style="display: flex; flex-direction: column; gap: 0.7rem;">
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.32); border-radius: 12px; padding: 0.8rem 0.95rem; font-size: 0.84rem; color: #E2E8F0; line-height: 1.55;">
              <strong style="color: #34D399; display: block; margin-bottom: 0.2rem;">⏱️ 우리 아이 집중시간 맞춤 홈 코칭법</strong>
              ${focusCoachingKo}
            </div>
            <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.32); border-radius: 12px; padding: 0.8rem 0.95rem; font-size: 0.84rem; color: #E2E8F0; line-height: 1.55;">
              <strong style="color: #FDA4AF; display: block; margin-bottom: 0.2rem;">⚠️ 이 시기 피해야 할 교육·교구 실패 패턴</strong>
              ${eduAvoidPitfall}
            </div>
          </div>
        </div>

        <!-- Part 1-B: 1:1 Bespoke Learning Counseling Report (Based on Selected Learning Bottlenecks & Study Style) -->
        <div id="bespoke-learning-counseling-box" style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(30, 58, 138, 0.38)); border: 1.5px solid rgba(56, 189, 248, 0.48); border-radius: 18px; padding: 1.3rem; margin-bottom: 1.15rem; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;">
            <span style="background: rgba(56, 189, 248, 0.18); color: #38BDF8; font-size: 0.8rem; font-weight: 900; padding: 0.24rem 0.78rem; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.42);">
              🧠 [1:1 맞춤 학습 상담 진단서] 우리 아이 학습 병목 원인 분석 &amp; 뇌과학 공부 처방
            </span>
            <span style="font-size: 0.76rem; color: #A7F3D0; font-weight: 800;">
              ✓ 학습 질문지 × 2,081편 학술 논문 DB 실시간 매칭
            </span>
          </div>

          <h4 style="font-size: 1.12rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.65rem 0; line-height: 1.45;">
            선택하신 학습 고민(${learningPlan.diagnosedConcerns.map(c => c.badgeKo).join(' · ')})에 대한 1:1 정밀 상담 결과입니다
          </h4>

          <!-- Diagnosed Learning Bottlenecks Cards -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.95rem;">
            ${learningPlan.diagnosedConcerns.map((dc) => `
              <div class="learning-concern-diagnosis-card" data-concern-key="${dc.key}" style="background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 14px; padding: 0.95rem 1.05rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.4rem;">
                  <span style="font-size: 0.82rem; font-weight: 900; color: #38BDF8; background: rgba(56, 189, 248, 0.14); padding: 0.18rem 0.65rem; border-radius: 9999px;">
                    ${dc.badgeKo}
                  </span>
                  <span style="font-size: 0.75rem; font-weight: 700; color: #93C5FD;">
                    ${dc.paperCitationKo}
                  </span>
                </div>
                <div style="font-size: 0.96rem; font-weight: 900; color: #FFFFFF; margin-bottom: 0.35rem;">
                  Q. "${dc.titleKo}"
                </div>
                <div style="font-size: 0.85rem; color: #CBD5E1; line-height: 1.55; margin-bottom: 0.45rem;">
                  <strong style="color: #FDA4AF;">🔍 뇌인지 병목 원인:</strong> ${dc.rootCauseKo}
                </div>
                <div style="font-size: 0.86rem; color: #F8FAFC; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10B981; padding: 0.55rem 0.75rem; border-radius: 8px; line-height: 1.55;">
                  <strong style="color: #34D399;">💡 오늘부터 바꾸는 1:1 학습 처방:</strong> ${dc.prescriptionKo}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Child's Best Learning Style + Sleep-Memory Consolidation Golden Rule (1 Card Per Row) -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(167, 139, 250, 0.38); border-radius: 12px; padding: 0.85rem 1rem; font-size: 0.84rem; color: #F8FAFC; line-height: 1.55;">
              <strong style="color: #DDD6FE; display: block; margin-bottom: 0.25rem;">✍️ 우리 아이 학습 스타일 맞춤 코칭 (${learningPlan.activeStyle.badgeKo})</strong>
              ${learningPlan.activeStyle.coachingKo}
            </div>
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(251, 191, 36, 0.38); border-radius: 12px; padding: 0.85rem 1rem; font-size: 0.84rem; color: #F8FAFC; line-height: 1.55;">
              <strong style="color: #FDE68A; display: block; margin-bottom: 0.25rem;">🌙 키 성장 + 장기기억 동시 완성: 서파수면 기억 공고화 법칙</strong>
              낮에 공부한 어휘·수학·과학 단기 기억은 <strong>밤 10시~새벽 2시 서파수면(SWS) 중 해마에서 대뇌 피질 장기기억으로 +40% 이상 전송(Diekelmann &amp; Born, Nature Reviews Neuroscience 2010)</strong>됩니다. 방과 후 20분 백지복습 후 밤 10시 전에 재우는 것이 성적과 키를 동시에 잡는 핵심입니다!
            </div>
          </div>
        </div>

        <!-- Part 2-A: 1:1 Learning Counseling Pinpoint Curation (Matched to Selected Learning Bottlenecks & Study Style) -->
        <div class="pinpoint-category-box" id="pinpoint-learning-counseling-curation-box" style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(30, 27, 75, 0.55)); border: 1.5px solid rgba(56, 189, 248, 0.45); border-radius: 18px; padding: 1.2rem; margin-bottom: 1.15rem; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span style="font-size: 0.78rem; font-weight: 900; color: #38BDF8; background: rgba(56, 189, 248, 0.18); padding: 0.22rem 0.7rem; border-radius: 9999px;">
              ✍️ [1:1 학습 상담 맞춤 큐레이팅] 선택한 학습 고민 해결 교재 · 백지복습 노트 · 집중 도구 TOP 3
            </span>
            <span style="font-size: 0.76rem; color: #93C5FD; font-weight: 700;">
              YES24(A100708867) · 쿠팡(AF7865143) · 11번가(애드픽 4d31d3) · Amazon 연동
            </span>
          </div>
          <h4 style="font-size: 1.06rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.35rem 0;">
            위 1:1 학습 상담 진단에 맞춰 우리 아이 공부 병목을 바로 해결해 줄 핀셋 학습 큐레이팅 TOP 3
          </h4>
          <p style="font-size: 0.86rem; color: #CBD5E1; margin: 0 0 0.85rem 0; line-height: 1.52;">
            아이의 학습 병목(${learningPlan.diagnosedConcerns.map(c => c.badgeKo).join(', ')})과 학습 흡수 스타일(${learningPlan.activeStyle.badgeKo})에 정확히 매칭된 도서·워크북·집중 도구입니다.
          </p>
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${learningPlan.learningItems.map((item) => `
              <div class="pinpoint-item-card learning-curated-card" style="background: rgba(15, 23, 42, 0.94); border: 1.5px solid rgba(56, 189, 248, 0.45); border-radius: 16px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.45rem;">
                    <span style="font-size: 0.75rem; font-weight: 900; color: #FBBF24; background: rgba(251, 191, 36, 0.16); padding: 0.18rem 0.6rem; border-radius: 9999px;">
                      ${item.badgeKo}
                    </span>
                  </div>
                  <div style="font-size: 0.8rem; font-weight: 800; color: #93C5FD; margin-bottom: 0.25rem;">
                    ${item.categoryKo}
                  </div>
                  <div style="font-size: 0.96rem; font-weight: 900; color: #FFFFFF; line-height: 1.42; margin-bottom: 0.45rem;">
                    ${item.titleKo}
                  </div>
                  <div style="font-size: 0.83rem; color: #F8FAFC; line-height: 1.5; background: rgba(255, 255, 255, 0.05); border-left: 3px solid #38BDF8; padding: 0.5rem 0.7rem; border-radius: 8px; margin-bottom: 0.45rem;">
                    🎯 ${item.specKo}
                  </div>
                  <p style="font-size: 0.8rem; color: #CBD5E1; line-height: 1.48; margin: 0 0 0.7rem 0;">
                    💬 ${item.whyKo}
                  </p>
                </div>
                <div>
                  <a href="${item.yes24Url}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn" data-merchant="linkprice" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(56, 189, 248, 0.18); border: 1px solid rgba(56, 189, 248, 0.48); color: #FFFFFF; font-size: 0.84rem; font-weight: 800; padding: 0.45rem 0.8rem; border-radius: 10px; text-decoration: none; text-align: center;">
                    📚 YES24 도서·워크북 상세 보기 ↗
                  </a>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-top: 0.4rem;">
                    <a href="${item.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="coupang" style="padding: 0.38rem 0.4rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #E2E8F0; text-decoration: none; text-align: center; font-size: 0.75rem; font-weight: 800;">🚀 쿠팡 로켓배송 ↗</a>
                    <a href="${item.adpickShoppingUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="adpick" style="padding: 0.38rem 0.4rem; background: rgba(236,72,153,0.15); border: 1px solid rgba(236,72,153,0.4); border-radius: 8px; color: #FBCFE8; text-decoration: none; text-align: center; font-size: 0.75rem; font-weight: 800;">🛒 11번가(애드픽) ↗</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Part 2-B: Contextual Education Prescription (Age-Band Must-Read Books & Workbooks) -->
        <div class="pinpoint-category-box" id="pinpoint-books-box" style="background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(196, 181, 253, 0.42); border-radius: 18px; padding: 1.2rem; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span style="font-size: 0.78rem; font-weight: 900; color: #C4B5FD; background: rgba(139, 92, 246, 0.2); padding: 0.22rem 0.7rem; border-radius: 9999px;">
              📚 [연령 × 뇌인지 연계 처방] 만 ${ageYears}세 필독 도서 &amp; 워크북 TOP 3
            </span>
            <span style="font-size: 0.76rem; color: #DDD6FE; font-weight: 700;">
              YES24(A100708867) · 쿠팡(AF7865143) · 11번가(애드픽 4d31d3) 연동
            </span>
          </div>
          <h4 style="font-size: 1.06rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.35rem 0;">
            ${isEn ? 'Curated Must-Read Books & Cognitive Workbooks (Top 3)' : `만 ${ageYears}세 두뇌 발달 민감기에 꼭 읽어야 할 연령별 필독 도서 & 워크북 TOP 3`}
          </h4>
          <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.85rem 0; line-height: 1.52;">
            ${bookTraitNote}
          </p>
          ${renderCategoryProductCards(data.books, 'rgba(196, 181, 253, 0.45)', 'book', isEn)}
        </div>
      </div>
    `;
  }

  /**
   * 5-E. Chapter 7: Custom Travel & Experiential Learning Prescription
   * (Part 1: 왜 어떤 여행이 필요한지 진단 -> Part 2-A: 내 지역 × 연령대별 실제 인기 과학관·박물관·체험 티켓 TOP 3 -> Part 2-B: 연령대별 시그니처 국내외 교육여행 TOP 3)
   */
  function renderCustomTravelChapter(profile = {}, affConfig = {}) {
    const isEn = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en');
    const data = curatePinpointItems(profile, affConfig);
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));
    const region = String(profile.region || '서울 강남·서초·송파');
    const travelPhilosophyHtml = renderAgeEducationalTravelGuide(ageYears, profile, isEn);
    const regionalTickets = data.regionalTickets || [];
    const ageBandTag = ageYears <= 3 ? '만 1~3세' : ageYears <= 6 ? '만 4~6세' : ageYears <= 9 ? '만 7~9세' : ageYears <= 13 ? '만 10~13세' : '만 14세+';

    return `
      <div id="custom-travel-chapter-box" style="text-align: left;">
        <!-- Part 1: Why & What Travel is Needed First -->
        ${travelPhilosophyHtml}

        <!-- Part 2-A: Regional × Age-Band Real Popular Museum, Science Center & Experience Ticket Catalog (Top 3) -->
        <div id="regional-age-ticket-catalog-box" style="margin-top: 1.15rem; background: linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(12, 74, 110, 0.38)); border: 1.5px solid rgba(56, 189, 248, 0.48); border-radius: 18px; padding: 1.25rem; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
            <span style="font-size: 0.78rem; font-weight: 900; color: #38BDF8; background: rgba(56, 189, 248, 0.18); padding: 0.22rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.4);">
              📍 [내 지역 × 연령 맞춤 티켓] ${region} × ${ageBandTag} 인기 과학관·박물관·체험 TOP 3
            </span>
            <span style="font-size: 0.76rem; color: #93C5FD; font-weight: 800;">
              마이리얼트립(6226316) · 클룩(140161) · KKday(애드픽 4d31d3) 실시간 연동
            </span>
          </div>
          <h4 style="font-size: 1.08rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.35rem 0;">
            ${isEn
              ? `Top 3 Regional Museums, Science Centers & Experiences in [${region}] for Age ${ageYears}`
              : `우리 동네 권역(${region})에서 만 ${ageYears}세 아이와 이번 주말 바로 갈 수 있는 인기 박물관·과학관·체험 티켓 TOP 3`}
          </h4>
          <p style="font-size: 0.86rem; color: #CBD5E1; margin: 0 0 0.9rem 0; line-height: 1.55;">
            8대 거주 권역 × 5단계 연령대(만 1~3세 / 4~6세 / 7~9세 / 10~13세 / 14세+) 매트릭스를 기반으로, 우리 아이 나이에 딱 맞는 관람 포인트와 사전 예약·할인 티켓을 매칭했습니다.
          </p>
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${regionalTickets.map((tk) => `
              <div class="regional-ticket-card" data-course-id="${tk.id}" style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid rgba(56, 189, 248, 0.42); border-radius: 16px; padding: 1.05rem; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.4rem;">
                    <span style="font-size: 0.74rem; font-weight: 900; color: #38BDF8; background: rgba(56, 189, 248, 0.16); padding: 0.18rem 0.55rem; border-radius: 9999px;">
                      ${tk.rankBadgeKo}
                    </span>
                    <span style="font-size: 0.73rem; font-weight: 800; color: #A7F3D0;">
                      ${tk.themeBadgeKo}
                    </span>
                  </div>
                  <div style="font-size: 1rem; font-weight: 900; color: #FFFFFF; line-height: 1.4; margin-bottom: 0.4rem;">
                    ${tk.destination}
                  </div>
                  <div style="font-size: 0.82rem; color: #FDE68A; font-weight: 800; background: rgba(245, 158, 11, 0.12); border-left: 3px solid #F59E0B; padding: 0.45rem 0.65rem; border-radius: 8px; margin-bottom: 0.5rem; line-height: 1.48;">
                    🎯 <strong>[${ageBandTag} 맞춤 포인트]</strong> ${tk.ageSpecificGuide}
                  </div>
                  <ul style="margin: 0 0 0.55rem 0; padding-left: 1.1rem; font-size: 0.8rem; color: #E2E8F0; line-height: 1.5;">
                    ${tk.viewPoints.map(vp => `<li>${vp}</li>`).join('')}
                  </ul>
                  <div style="font-size: 0.76rem; color: #94A3B8; background: rgba(255,255,255,0.04); padding: 0.45rem 0.6rem; border-radius: 8px; margin-bottom: 0.7rem; line-height: 1.45;">
                    💡 <strong>예약·동선 팁:</strong> ${tk.bookingTips}<br>
                    🗺️ <strong>추천 코스:</strong> ${tk.route}
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                  <a href="${tk.myrealtripUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn" data-merchant="myrealtrip" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(56, 189, 248, 0.18); border: 1px solid rgba(56, 189, 248, 0.5); color: #E0F2FE; font-size: 0.83rem; font-weight: 900; padding: 0.45rem 0.75rem; border-radius: 10px; text-decoration: none; text-align: center;">
                    ✈️ 마이리얼트립 티켓·도슨트 투어 보기 ↗
                  </a>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;">
                    <a href="${tk.klookUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="klook" style="padding: 0.4rem 0.45rem; background: rgba(249, 115, 22, 0.16); border: 1px solid rgba(249, 115, 22, 0.42); border-radius: 8px; color: #FDBA74; font-size: 0.76rem; font-weight: 800; text-decoration: none; text-align: center;">
                      🎟️ 클룩(Klook) 할인권 ↗
                    </a>
                    <a href="${tk.adpickKkdayUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="adpick" style="padding: 0.4rem 0.45rem; background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.4); border-radius: 8px; color: #FBCFE8; font-size: 0.76rem; font-weight: 800; text-decoration: none; text-align: center;">
                      🎫 KKday·애드픽 패스 ↗
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Part 2-B: 5-Tier Age-Band Signature Domestic & Overseas Educational Travel Prescription (MyRealTrip + Klook + Adpick KKday) -->
        <div class="pinpoint-category-box" id="pinpoint-edu-travel-box" style="margin-top: 1.15rem; background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(251, 191, 36, 0.45); border-radius: 18px; padding: 1.2rem; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span style="font-size: 0.78rem; font-weight: 900; color: #FDE68A; background: rgba(245, 158, 11, 0.2); padding: 0.22rem 0.7rem; border-radius: 9999px;">
              🌏 [${ageBandTag} 시그니처 교육여행] 주말·방학 국내외 도슨트 · 과학관 · 테마파크 투어 TOP 3
            </span>
            <span style="font-size: 0.76rem; color: #FDE68A; font-weight: 700;">
              마이리얼트립 · 클룩(Klook) · KKday(애드픽) 공식 연동
            </span>
          </div>
          <h4 style="font-size: 1.06rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.35rem 0;">
            ${isEn ? 'Curated Educational Family Travel & Field Tours (Top 3)' : `만 ${ageYears}세(${ageBandTag}) 필수 여행 테마를 주말·방학에 완성하는 시그니처 투어 TOP 3`}
          </h4>
          <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.85rem 0; line-height: 1.52;">
            ${isEn
              ? `Mapped to Age ${ageYears} developmental windows: combines outdoor vitamin D synthesis, active growth plate walking, and parent-child Havruta inquiry.`
              : `아이의 해마 장기기억과 전두엽 호기심을 깨우는 연령별 대표 도슨트 투어·과학관·테마파크 티켓(마이리얼트립·클룩·KKday) 및 사전답사 도서·키트입니다.`}
          </p>
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${(data.eduTours || []).map((tour) => `
              <div class="pinpoint-item-card" style="background: rgba(15, 23, 42, 0.94); border: 1.5px solid rgba(251, 191, 36, 0.45); border-radius: 16px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.45rem;">
                    <span style="font-size: 0.76rem; font-weight: 900; color: #FBBF24; background: rgba(251, 191, 36, 0.16); padding: 0.2rem 0.6rem; border-radius: 9999px;">
                      ${isEn ? tour.badgeEn : tour.badgeKo}
                    </span>
                  </div>
                  <div style="font-size: 0.82rem; font-weight: 800; color: #93C5FD; margin-bottom: 0.25rem;">
                    ${isEn ? tour.categoryEn : tour.categoryKo}
                  </div>
                  <div style="font-size: 0.98rem; font-weight: 900; color: #FFFFFF; line-height: 1.42; margin-bottom: 0.45rem;">
                    ${isEn ? tour.titleEn : tour.titleKo}
                  </div>
                  <p style="font-size: 0.84rem; color: #E2E8F0; line-height: 1.52; margin: 0 0 0.5rem 0;">
                    ${tour.descKo}
                  </p>
                  <div style="font-size: 0.82rem; color: #A7F3D0; line-height: 1.48; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10B981; padding: 0.5rem 0.7rem; border-radius: 8px; margin-bottom: 0.7rem;">
                    ${tour.missionKo}
                  </div>
                </div>
                <div>
                  <a href="${tour.myrealtripUrl || tour.naverTourUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link mobile-touch-btn" data-merchant="myrealtrip" style="display: flex; min-height: 40px; align-items: center; justify-content: center; background: rgba(251, 191, 36, 0.16); border: 1px solid rgba(251, 191, 36, 0.45); color: #FDE68A; font-size: 0.84rem; font-weight: 800; padding: 0.45rem 0.8rem; border-radius: 10px; text-decoration: none; text-align: center;">
                    ✈️ ${isEn ? 'MyRealTrip Family Tour & Ticket ↗' : '마이리얼트립 도슨트·입장권 보러가기 ↗'}
                  </a>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-top: 0.4rem;">
                    <a href="${tour.klookUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="klook" style="padding: 0.4rem 0.45rem; background: rgba(249,115,22,0.16); border: 1px solid rgba(249,115,22,0.42); border-radius: 8px; color: #FDBA74; text-decoration: none; text-align: center; font-size: 0.76rem; font-weight: 800;">🎟️ 클룩(Klook) 패스 ↗</a>
                    <a href="${tour.adpickKkdayUrl || 'https://adpick.co.kr/apis/goshopping.php?affid=4d31d3&offer=b796d&url=https%3A%2F%2Fwww.kkday.com%2Fko'}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="adpick" style="padding: 0.4rem 0.45rem; background: rgba(236,72,153,0.15); border: 1px solid rgba(236,72,153,0.4); border-radius: 8px; color: #FBCFE8; text-decoration: none; text-align: center; font-size: 0.76rem; font-weight: 800;">🎫 KKday·애드픽 ↗</a>
                  </div>
                  <details style="margin-top: 0.4rem; font-size: 0.76rem; color: #94A3B8;">
                    <summary style="cursor: pointer; text-align: right; color: #94A3B8; font-weight: 700;">사전답사 도서 &amp; 탐구키트(YES24·쿠팡) 보기 ▼</summary>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem;">
                      <a href="${tour.coupangUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="coupang" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(255,255,255,0.06); border-radius: 6px; color: #E2E8F0; text-decoration: none; text-align: center; font-weight: 700;">🎒 탐구키트(쿠팡) ↗</a>
                      <a href="${tour.yes24Url}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="linkprice" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(139,92,246,0.16); border-radius: 6px; color: #EDE9FE; text-decoration: none; text-align: center; font-weight: 700;">📘 사전도서(YES24) ↗</a>
                    </div>
                  </details>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 5. Legacy combined renderer (preserved for backwards compatibility)
   */
  function renderPinpointAndLifecycleSection(profile = {}, affConfig = {}) {
    return `
      ${renderLifecycleTimelineOnly(profile, affConfig)}
      ${renderContextualSupplementsPrescription(profile, affConfig)}
      ${renderContextualBiomechanicsPrescription(profile, affConfig)}
      ${renderCustomEducationChapter(profile, affConfig)}
      ${renderCustomTravelChapter(profile, affConfig)}
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
    curateLearningCounselingPlan,
    curateRegionalAgeTickets,
    curateEducationalTours,
    getAgeEducationalTravelPhilosophy,
    renderAgeEducationalTravelGuide,
    renderLifecycleTimelineOnly,
    renderCognitiveCurriculumRoadmap,
    renderContextualSupplementsPrescription,
    renderContextualBiomechanicsPrescription,
    curatePillar2LearningTools,
    renderPillar2LearningToolsPrescription,
    renderCustomEducationChapter,
    renderCustomTravelChapter,
    renderPinpointAndLifecycleSection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TallerPinpointCurator;
  }
  global.TallerPinpointCurator = TallerPinpointCurator;
  global.KidsFitPinpointCurator = TallerPinpointCurator;

})(typeof window !== 'undefined' ? window : global);
