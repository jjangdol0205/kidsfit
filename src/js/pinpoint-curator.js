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
    adpickAffId: '',
    adpickApiUrl: 'https://adpick.co.kr/apis/offers.php?affid=&os=&adtype=&category=notgame&order=rand',
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
    const naverBrandConnectHealthUrl = cfg.naverBrandConnectHealth || DEFAULT_AFF.naverBrandConnectHealth;
    const tenpingUrl = cfg.tenpingUrl || DEFAULT_AFF.tenpingUrl;

    return {
      coupangUrl: cpUrl,
      iherbUrl: ihUrl,
      amazonUrl: amzUrl,
      yes24Url: lpUrl,
      naverUrl,
      naverBrandConnectHealthUrl,
      tenpingUrl,
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
        specKo: '칼슘 + 비타민D3 + 아연·마그네슘 함유! 아침저녁으로 간편하고 상큼한 오렌지맛으로 아이들이 아주 잘 먹어 6개월 이상 꾸준히 먹이고 재주문하는 제품이에요~!',
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
        specKo: '하루 1~2포 간편 스틱 포장 · 우유 배앓이 없이 깔끔한 맛으로 아이들이 먼저 찾는 고흡수 칼슘·비타민D3~!',
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
        specKo: '성장기 아이에게 어떤 걸 먹일까 고민 끝! 식약처 인정 HT042 + 칼슘·비타민D·아연이 한 번에 들어있어 아침저녁으로 간편하게 챙기고 6개월 이상 꾸준히 재주문하는 1위 제품이에요~!',
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
        specKo: '우유 없이도 간식처럼 씹어서 먹을 수 있고 상큼한 과일맛으로 아이들이 아주 잘 먹어요~!',
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
        specKo: '1알에 우유칼슘 + 비타민C + 뉴질랜드초유, 비타민A,B,D3,E, 철분, 아연, 마그네슘이 다 들어있어요~! 타블렛 형태로 아침저녁 씹어 먹고 깔끔한 오렌지맛이라 6개월 이상 꾸준히 재주문하는 핫템입니다~!',
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
        specKo: '입 짧은 편식 아이도 사탕처럼 맛있게 씹어 먹으며 아연·비타민A,B,C,D3,E를 간편하게 채워줘요~!',
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
        specKo: '저녁 식후 1알로 칼슘·마그네슘·비타민D3를 간편하게! 상큼한 오렌지·귤맛 츄어블이라 아이들이 잘 먹고 밤마다 깨던 성장통 없이 푹 자서 재주문율 최고예요~!',
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
        specKo: '어골칼슘 + 마그네슘 + 비타민D3가 한 포에 들어있어 저녁마다 간편하게 먹이기 좋아요~!',
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
        specKo: '1알에 우유·연골칼슘 + 비타민C + 뉴질랜드초유 + 비타민A,B,D3,E + 철분·아연·마그네슘 함유! 아침저녁으로 씹어 먹는 깔끔한 오렌지맛이라 6개월 이상 꾸준히 먹이고 재주문까지 완료하는 스테디셀러~!',
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
        specKo: '우유 배앓이 없는 무유당 킬레이트 칼슘·마그네슘 · 아이들이 좋아하는 동물 모양 타블렛이에요~!',
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
      eduTours: curateEducationalTours(profile, affConfig),
      lifecycleRoadmap: getSequentialLifecycleRoadmap(ageYears),
      autoStage: autoDetectGrowthStage(ageMonths, profile.gender, recent6m)
    };
  }

  /**
   * 4-B. Educational Family Travel & Experiential Tour Curator
   * Maps age band, region, and cognitive interests to 3 curated educational travel & tour recommendations.
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
    const naverBrandTourUrl = cfg.naverBrandConnectTour || DEFAULT_AFF.naverBrandConnectTour || 'https://naver.me/xJcOADhA';
    const tenpingFairUrl = cfg.tenpingUrl || DEFAULT_AFF.tenpingUrl || 'https://iryan.kr/t8g8qxgcc2';

    const makeTourUrls = (cpQuery, yesQuery, tourQuery, mrtShortUrl, klookDestUrl) => {
      const cpUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(cpQuery)}&channel=user&lptag=${cpTag}`;
      const yesTarget = `https://www.yes24.com/Product/Search?domain=ALL&query=${encodeURIComponent(yesQuery)}`;
      const yesUrl = `https://click.linkprice.com/click.php?m=yes24&a=${lpId}&l=9999&l_cd1=3&l_cd2=0&tu=${encodeURIComponent(yesTarget)}`;
      const myrealtripUrl = mrtShortUrl || `https://www.myrealtrip.com/offers?q=${encodeURIComponent(tourQuery)}&mylink_id=${mrtMylinkId}&utm_source=mktpartner`;
      const kSite = klookDestUrl || `https://www.klook.com/ko/search/result/?query=${encodeURIComponent(tourQuery)}`;
      const klookUrl = `https://affiliate.klook.com/redirect?aid=${klookAid}&aff_adid=${klookAdId}&k_site=${encodeURIComponent(kSite)}`;
      return {
        coupangUrl: cpUrl,
        yes24Url: yesUrl,
        naverTourUrl: myrealtripUrl,
        myrealtripUrl,
        klookUrl,
        naverBrandTourUrl,
        tenpingFairUrl
      };
    };

    if (ageYears <= 5) {
      return [
        Object.assign({
          badgeKo: '🏆 엄선 1위 · 오감·생태 가족여행',
          badgeEn: '🏆 Edu Travel #1 · Nature & Sensory',
          categoryKo: `🌿 [${region} 출발 추천] 강원 홍천·평창 알파카월드 & 대관령 양떼목장 생태 체험 여행`,
          categoryEn: 'Gangwon Nature & Animal Ranch Family Eco-Tour',
          titleKo: '대자연 동물 교감 · 숲속 오감 걷기 & 어린이 생태 관찰 돋보기·채집 키트',
          titleEn: 'Animal Feeding Ranch Tour & Kids Nature Explorer Kit',
          descKo: '영유아·유아기 시냅스가 가장 활발히 열리는 야외 동물 먹이주기와 잔디밭 달리기 코스로, 낮 동안 충분한 햇빛(비타민D 합성)과 대근육 자극을 통해 밤 9시 반 꿀잠을 유도합니다.',
          missionKo: '💬 여행지 부모 대화 미션: "양과 알파카의 털을 만져보니 구름처럼 폭신할까, 까슬까슬할까?"'
        }, makeTourUrls('어린이 곤충채집 생태관찰 돋보기 키트 아기 나들이 가방', '유아 자연관찰 동물 도감', '홍천 알파카월드 대관령 양떼목장', 'https://myrealt.rip/xc4Y3a', 'https://www.klook.com/ko/search/result/?query=%EC%95%8C%ED%8C%8C%EC%B9%B4%EC%9B%94%EB%93%9C')),
        Object.assign({
          badgeKo: '✨ 엄선 2위 · 해양·아쿠아리움 여행',
          badgeEn: '✨ Edu Travel #2 · Marine Science',
          categoryKo: '🐠 여수·제주·코엑스 대형 아쿠아리움 해양생태 가족 투어 & 바다생물 사전답사',
          categoryEn: 'National Aquarium Marine Biology Family Tour',
          titleKo: '바다 생물 도슨트 워킹투어 & 출발 전 읽는 입체 해양생물 플랩북·놀이키트',
          titleEn: 'Aquarium Family Pass & Interactive Marine Flap Book',
          descKo: '수족관의 거대한 수조와 빛의 굴절, 다양한 물고기 움직임을 눈으로 따라가며 유아의 시각 추적 능력과 어휘 호기심을 동시에 키워주는 만족도 1위 실내외 가족 여행입니다.',
          missionKo: '💬 여행지 부모 대화 미션: "가오리는 왜 배가 하얗고 등이 까만색일까? 같이 찾아볼까?"'
        }, makeTourUrls('어린이 바다생물 피규어 아쿠아리움 스티커북 플랩북', '어스본 요리조리 열어보는 바다', '코엑스 아쿠아리움 가족 입장권', 'https://myrealt.rip/xc4l47', 'https://www.klook.com/ko/search/result/?query=%EC%BD%94%EC%97%91%EC%8A%A4+%EC%95%84%EC%BF%A0%EC%95%84%EB%A6%AC%EC%9B%80')),
        Object.assign({
          badgeKo: '💎 엄선 3위 · 별빛·키즈 글램핑 여행',
          badgeEn: '💎 Edu Travel #3 · Starlight Glamping',
          categoryKo: '⛺ 경기도 가평·포천·동탄 키즈 생태·실내동물원 & 자연 숲속 글램핑 1박 2일 코스',
          categoryEn: 'Kids Observatory & Forest Glamping 2-Day Trip',
          titleKo: '어린이 첫 입문용 휴대용 망원경·쌍안경 & 캠핑 별자리 랜턴 프로젝터 세트',
          titleEn: 'Kids Beginner Binoculars & Starlight Constellation Projector',
          descKo: '스마트폰 화면 대신 밤하늘의 달과 별자리, 살아있는 동식물을 직접 관찰하고 가족 대화를 나누며 정서적 안정감과 과학적 호기심을 길러주는 주말 코스입니다.',
          missionKo: '💬 여행지 부모 대화 미션: "오늘 밤 가장 밝게 빛나는 별은 어떤 모양을 닮았을까?"'
        }, makeTourUrls('어린이 쌍안경 캠핑 천체망원경 별자리 프로젝터', '유아 밤하늘 별자리 그림책', '주렁주렁 실내 동물원 키즈 체험', 'https://myrealt.rip/xc4wa0', 'https://www.klook.com/ko/search/result/?query=%EC%A3%BC%EB%A0%81%EC%A3%BC%EB%A0%81'))
      ];
    }

    if (ageYears <= 9) {
      return [
        Object.assign({
          badgeKo: '🏆 엄선 1위 · 역사 타임머신 가족여행',
          badgeEn: '🏆 Edu Travel #1 · UNESCO Heritage Tour',
          categoryKo: '👑 경주 신라천년(첨성대·대릉원·국립경주박물관) & 부여·공주 백제 역사 도슨트 가족여행',
          categoryEn: 'Gyeongju & Buyeo UNESCO World Heritage Docent Family Tour',
          titleKo: '어린이 눈높이 소그룹 역사 해설 투어 & 출발 전 읽는 경주·한국사 유물 탐구 도감',
          titleEn: 'Kids Historical Docent Tour & Korean Heritage Field Guidebook',
          descKo: '초등 한국사 교과가 시작되기 전 경주·공주·수원화성을 직접 걸으며 유물의 쓰임새와 선조들의 지혜를 추론해보면 역사적 인과 사고력과 장기 기억이 3배 이상 깊어집니다.',
          missionKo: '💬 여행지 하브루타 미션: "첨성대는 왜 네모 모양이 아니라 아래가 넓은 원기둥 모양으로 쌓았을까?"'
        }, makeTourUrls('초등 경주 역사 여행 가이드북 한국사 유물 워크북', '아이와 경주 여행 역사 도감', '경주 어린이 도슨트 역사 투어 국립경주박물관 해설', 'https://myrealt.rip/xc4b13', 'https://www.klook.com/ko/search/result/?query=%EA%B2%BD%EC%A3%BC+%ED%88%AC%EC%96%B4')),
        Object.assign({
          badgeKo: '✨ 엄선 2위 · 우주·과학 탐사 가족여행',
          badgeEn: '✨ Edu Travel #2 · Space & Science Camp',
          categoryKo: '🚀 국립과천과학관 물리탐험대 & 대전 국립중앙과학관·천문대 과학 탐사 여행',
          categoryEn: 'Gwacheon & Daejeon National Science Museum Family Expedition',
          titleKo: '과학관 교과 연계 실험 탐구 노트 & 어린이 굴절 천체망원경·현미경 탐사 패키지',
          titleEn: 'Science Museum Inquiry Journal & Portable Astronomical Telescope',
          descKo: `우리 아이가 선택한 [${cogAxes.includes('science_nature') ? '과학·자연 원리 탐구' : '전두엽 인과 추론'}] 영역과 직결되는 코스로, 로켓 추진·자기부상·천체 관측을 직접 체험하며 이공계 사고력을 폭발시킵니다.`,
          missionKo: '💬 여행지 하브루타 미션: "만약 지구에 중력이 절반으로 줄어든다면 우리 키와 점프 높이는 어떻게 달라질까?"'
        }, makeTourUrls('어린이 천체망원경 초등 과학관 체험 학습 워크북', '초등 과학관 박물관 탐구 도감', '국립과천과학관 초등 물리탐험대', 'https://myrealt.rip/xc4c05', 'https://www.klook.com/ko/search/result/?query=%EA%B3%BC%ED%95%99%EA%B4%80')),
        Object.assign({
          badgeKo: '💎 엄선 3위 · 지질·생태 자연유산 여행',
          badgeEn: '💎 Edu Travel #3 · Jeju & Eco Geopark',
          categoryKo: '🌋 제주 화산지질(곶자왈·성산일출봉) & 서천 국립생태원·고성 공룡발자국 가족 탐사',
          categoryEn: 'Jeju Volcanic Geopark & National Institute of Ecology Family Tour',
          titleKo: '어린이 아웃도어 탐험가 조끼·쌍안경·나침반 키트 & 한국 자연생태 현장 도감',
          titleEn: 'Kids Outdoor Field Explorer Vest/Binoculars & Ecology Guidebook',
          descKo: '화산 지형과 습지 생태계를 직접 걸으며 하루 8,000보 이상 하지 성장판을 건강하게 자극하고, 살아있는 동식물 생태계를 관찰하며 전두엽 탐구력을 키우는 가족 여행입니다.',
          missionKo: '💬 여행지 하브루타 미션: "제주도의 돌에는 왜 구멍이 송송 뚫려 있고 비가 와도 물이 고이지 않을까?"'
        }, makeTourUrls('어린이 쌍안경 나침반 자연관찰 탐험 키트', '제주도 어린이 생태 지질 여행책', '제주 아이와 체험학습 투어', 'https://myrealt.rip/xc4e9f', 'https://www.klook.com/ko/search/result/?query=%EC%A0%9C%EC%A3%BC+%EC%95%84%EC%9D%B4%EC%99%80'))
      ];
    }

    // Age 10+ (Upper Elementary & Youth)
    return [
      Object.assign({
        badgeKo: '🏆 엄선 1위 · 세계유산·궁궐 심화 도슨트 여행',
        badgeEn: '🏆 Edu Travel #1 · Royal Palace & History Docent',
        categoryKo: '🏛️ 서울 5대 궁궐(경복궁·창덕궁 후원) · 수원화성 · 안동 하회마을 심화 역사 도슨트 투어',
        categoryEn: 'Seoul Royal Palaces, Suwon Hwaseong & Andong UNESCO Deep-Dive Tour',
        titleKo: '초등 고학년·청소년 역사 논술 워크북 & 문화재청 궁궐길라잡이·도슨트 투어 준비 키트',
        titleEn: 'Youth Historical Essay Workbook & Palace Docent Audio/Field Set',
        descKo: '배외측 전전두엽(DLPFC)이 정점에 달하는 만 10세 이상 시기에 정조의 수원화성 거중기 과학 원리와 조선 왕실의 의사결정을 현장에서 토론하면 교과서 10번 읽는 것보다 강력한 메타인지가 형성됩니다.',
        missionKo: '💬 여행지 하브루타 미션: "정조가 수원화성을 지을 때 거중기와 벽돌을 도입한 과학적·경제적 이유는 무엇이었을까?"'
      }, makeTourUrls('초등 고학년 청소년 역사 논술 한국사 탐구 도서', '수원화성 경복궁 역사 기행 청소년 필독서', '경복궁 역사체험 가족여행 도슨트 투어', 'https://myrealt.rip/xc4f7a', 'https://www.klook.com/ko/search/result/?query=%EA%B2%BD%EB%B3%B5%EA%B6%81+%ED%88%AC%EC%96%B4')),
      Object.assign({
        badgeKo: '✨ 엄선 2위 · 대학 캠퍼스·국립과학관 미래 진로 여행',
        badgeEn: '✨ Edu Travel #2 · STEM & University Campus Tour',
        categoryKo: '🔬 대전 KAIST·대덕연구단지 국립중앙과학관 & 서울대·규장각 학술 진로 탐방 코스',
        categoryEn: 'KAIST Daedeok Science Town & University Museum Career Exploration Tour',
        titleKo: '청소년 과학·공학 탐구 보고서 노트 & 고배율 천체망원경·코딩 로봇 학습 패키지',
        titleEn: 'Youth STEM Lab Research Notebook & Astronomical Telescope Kit',
        descKo: '사춘기 초·중기 아이들에게 막연한 공부 잔소리 대신 국내 최고 과학관과 대학 캠퍼스·박물관을 함께 걸으며 미래의 내 모습을 그려보게 하면 내적 학습 동기와 딥워크 집중력이 깨어납니다.',
        missionKo: '💬 여행지 하브루타 미션: "오늘 본 미래 기술 중 10년 뒤 네가 직접 만들어보고 싶은 기술은 무엇이니?"'
      }, makeTourUrls('청소년 과학 탐구 보고서 코넬 노트 천체망원경', '십대를 위한 미래 과학 진로 교양서', '대전 국립중앙과학관 도슨트 투어', 'https://myrealt.rip/xc4g4e', 'https://www.klook.com/ko/search/result/?query=%EB%8C%80%EC%A0%84+%EA%B3%BC%ED%95%99%EA%B4%80')),
      Object.assign({
        badgeKo: '💎 엄선 3위 · 해양·산림 액티브 성장 캠프 여행',
        badgeEn: '💎 Edu Travel #3 · Active Nature & Posture Reset Trip',
        categoryKo: '🌲 강원 평창·정선 국립숲체원 트레킹 & 제주 올레길·한라산 어리목 가족 액티브 여행',
        categoryEn: 'National Forest Healing Trekking & Jeju Active Family Expedition',
        titleKo: '어린이·청소년 발 아치 보호 트레킹 인솔·등산스틱 & 가족 여행 독서·관찰 키트',
        titleEn: 'Youth Arch-Support Trekking Gear & Family Travel Journal',
        descKo: '책상과 학원 의자에 눌려 있던 척추 디스크와 거북목을 펴주고, 숲길 걷기와 야외 햇빛 노출을 통해 세로토닌·멜라토닌 분비를 극대화하여 밤 10시 성장호르몬 피크를 회복시키는 힐링 여행입니다.',
        missionKo: '💬 여행지 하브루타 미션: "스마트폰을 내려놓고 숲길을 걸을 때 우리 뇌와 몸에서는 어떤 좋은 변화가 일어날까?"'
      }, makeTourUrls('주니어 어린이 트레킹화 아치 깔창 가족여행 배낭', '청소년 자연 과학 에세이 필독서', '제주투어패스 가족 액티브 여행', 'https://myrealt.rip/xc4hf6', 'https://www.klook.com/ko/search/result/?query=%EC%A0%9C%EC%A3%BC+%ED%88%AC%EC%96%B4%ED%8C%A8%EC%8A%A4'))
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
   * 5. Renders the Clean, Single-View Tabbed Lifecycle Roadmap + Educational Travel Guide + Category-Tabbed Prescription Guide
   */
  function renderPinpointAndLifecycleSection(profile = {}, affConfig = {}) {
    const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const data = curatePinpointItems(profile, affConfig);
    const ageMonths = Number(profile.ageMonths) || 120;
    const ageYears = Math.max(1, Math.min(20, Math.floor(ageMonths / 12)));

    const suppTraitNote = getTraitSpecificNote(profile, 'supplement', isEn);
    const toyTraitNote = getTraitSpecificNote(profile, 'toy', isEn);
    const bookTraitNote = getTraitSpecificNote(profile, 'book', isEn);
    const travelPhilosophyHtml = renderAgeEducationalTravelGuide(ageYears, profile, isEn);

    const renderCleanCategoryItems = (items, accentColor, categoryType) => {
      // Collect exactly 3 curated flagship products from items[0] (top 2) + items[1] (top 1)
      const threePicks = [];
      if (items[0]) {
        const sub0 = (items[0].curatedProducts && items[0].curatedProducts[0]) || {
          rankKo: '🏆 엄마들 재주문 1위',
          rankEn: '🏆 Reorder Pick #1',
          titleKo: items[0].name,
          titleEn: items[0].name,
          specKo: items[0].activeSpec,
          specEn: items[0].activeSpec,
          coupangUrl: items[0].coupangUrl,
          iherbUrl: items[0].iherbUrl,
          yes24Url: items[0].yes24Url,
          naverUrl: items[0].naverUrl,
          cpQuery: items[0].coupangQuery
        };
        threePicks.push({ item: items[0], sub: sub0, badgeKo: '🏆 엄선 1위 (최다 재주문)', badgeEn: '🏆 Curated Pick #1' });
      }
      if (items[1]) {
        const sub1 = (items[1].curatedProducts && items[1].curatedProducts[0]) || {
          rankKo: '✨ 엄선 2위',
          rankEn: '✨ Curated Pick #2',
          titleKo: items[1].name,
          titleEn: items[1].name,
          specKo: items[1].activeSpec,
          specEn: items[1].activeSpec,
          coupangUrl: items[1].coupangUrl,
          iherbUrl: items[1].iherbUrl,
          yes24Url: items[1].yes24Url,
          naverUrl: items[1].naverUrl,
          cpQuery: items[1].coupangQuery
        };
        threePicks.push({ item: items[1], sub: sub1, badgeKo: '✨ 엄선 2위 (맞춤 시너지)', badgeEn: '✨ Curated Pick #2' });
      }
      if (items[0] && items[0].curatedProducts && items[0].curatedProducts[1]) {
        const sub2 = items[0].curatedProducts[1];
        threePicks.push({ item: items[0], sub: sub2, badgeKo: '💎 엄선 3위 (인기 대안)', badgeEn: '💎 Curated Pick #3' });
      } else if (items[1] && items[1].curatedProducts && items[1].curatedProducts[1]) {
        const sub2 = items[1].curatedProducts[1];
        threePicks.push({ item: items[1], sub: sub2, badgeKo: '💎 엄선 3위 (인기 대안)', badgeEn: '💎 Curated Pick #3' });
      }

      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.85rem;">
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
                    ${categoryType === 'toy' ? `<a href="${sub.naverBrandConnectHealthUrl || 'https://naver.me/5Jq9LnLT'}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="naver-brandconnect" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(34,197,94,0.14); border-radius: 6px; color: #86EFAC; text-decoration: none; text-align: center; font-weight: 700;">💆 닥터웰 건강케어(네이버) ↗</a>` : `<a href="${sub.tenpingUrl || 'https://iryan.kr/t8g8qxgcc2'}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="tenping" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(244,63,94,0.14); border-radius: 6px; color: #FDA4AF; text-decoration: none; text-align: center; font-weight: 700;">🎁 유아교육전 무료입장(텐핑) ↗</a>`}
                  </div>
                </details>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    };

    return `
      <!-- AGE LIFECYCLE TIMELINE (Full Text Display, Zero Clipping) -->
      <div id="child-lifecycle-roadmap-section" style="margin-top: 1.35rem; padding-top: 1.25rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <h3 style="font-size: 1.12rem; font-weight: 900; color: #FFFFFF; margin: 0;">
            🗓️ ${isEn
              ? `Year-by-Year Focus (Age ${ageYears} → Age ${ageYears + 3})`
              : `나이별 집중 포인트 (만 ${ageYears}세 → 만 ${ageYears + 3}세 탭 선택)`}
          </h3>
          <span style="background: rgba(59, 130, 246, 0.16); color: #93C5FD; font-size: 0.8rem; font-weight: 800; padding: 0.28rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.35);">
            ${isEn ? data.autoStage.stageNameEn : data.autoStage.stageNameKo}
          </span>
        </div>

        <!-- Age Selector Tabs -->
        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.45rem; margin-bottom: 0.75rem;">
          ${data.lifecycleRoadmap.map((step, idx) => `
            <button
              type="button"
              class="lifecycle-tab-btn"
              onclick="(function(btn, targetIdx){ var sec = document.getElementById('child-lifecycle-roadmap-section'); if(!sec) return; var cards = sec.querySelectorAll('.lifecycle-age-card'); cards.forEach(function(c, i){ c.style.display = (i === targetIdx) ? 'block' : 'none'; }); var btns = sec.querySelectorAll('.lifecycle-tab-btn'); btns.forEach(function(b, i){ b.style.background = (i === targetIdx) ? '#3B82F6' : 'rgba(255,255,255,0.06)'; b.style.color = '#FFFFFF'; b.style.borderColor = (i === targetIdx) ? '#60A5FA' : 'rgba(255,255,255,0.15)'; }); })(this, ${idx})"
              style="padding: 0.55rem 0.4rem; border-radius: 10px; font-size: 0.84rem; font-weight: 800; cursor: pointer; background: ${idx === 0 ? '#3B82F6' : 'rgba(255,255,255,0.06)'}; color: #FFFFFF; border: 1px solid ${idx === 0 ? '#60A5FA' : 'rgba(255,255,255,0.15)'};"
            >
              ${isEn ? (idx === 0 ? `Now (${step.age}y)` : `+${idx}Yr (${step.age}y)`) : (idx === 0 ? `현재 만 ${step.age}세` : `만 ${step.age}세 (+${idx}년)`)}
            </button>
          `).join('')}
        </div>

        <div>
          ${data.lifecycleRoadmap.map((step, idx) => `
            <div class="lifecycle-age-card" data-age="${step.age}" style="display: ${idx === 0 ? 'block' : 'none'}; background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(59, 130, 246, 0.45); border-radius: 16px; padding: 1.15rem 1.25rem; text-align: left;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;">
                <span style="font-size: 1.02rem; font-weight: 900; color: #60A5FA;">
                  📌 ${isEn ? `Age ${step.age} Core Milestone` : `만 ${step.age}세 핵심 성장·발달 체크리스트`}
                </span>
                <span style="font-size: 0.86rem; font-weight: 900; color: #34D399; background: rgba(16, 185, 129, 0.15); padding: 0.22rem 0.65rem; border-radius: 9999px;">
                  목표 성장속도: ${step.expectedVelocity}
                </span>
              </div>
              <div style="font-size: 0.95rem; color: #FFFFFF; line-height: 1.62; margin-bottom: 0.45rem;">
                <strong style="color: #38BDF8;">📏 ${isEn ? 'Body Growth:' : '신체 성장 포인트:'}</strong> ${step.physicalFocus}
              </div>
              <div style="font-size: 0.95rem; color: #FFFFFF; line-height: 1.62; margin-bottom: 0.55rem;">
                <strong style="color: #C4B5FD;">🧠 ${isEn ? 'Brain & Study:' : '두뇌·학습 포인트:'}</strong> ${step.brainFocus}
              </div>
              <div style="font-size: 0.9rem; color: #6EE7B7; font-weight: 800; border-top: 1px dashed rgba(255, 255, 255, 0.14); padding-top: 0.5rem;">
                🎁 ${isEn ? 'Recommended Prep:' : '이 시기 필수 준비물:'} ${step.mustHaveSummary}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- EDUCATIONAL TRAVEL EXPLANATION FIRST (Before any product recommendations) -->
      ${travelPhilosophyHtml}

      <!-- STEP 04: CATEGORY-TABBED CURATED ITEMS (Eliminates Mid-Report Ad Clutter; Shows 1 Category at a Time) -->
      <div id="pinpoint-custom-prescription-section" style="margin-top: 1.4rem; padding-top: 1.3rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="margin-bottom: 0.9rem; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
            <span style="display: inline-block; font-size: 0.8rem; font-weight: 900; color: #34D399; background: rgba(16, 185, 129, 0.16); padding: 0.25rem 0.75rem; border-radius: 9999px;">
              STEP 04 · ${isEn ? 'OPTIONAL CURATED TOOLKIT (BY CATEGORY TAB)' : '필요한 영역만 탭해서 보는 맞춤 교구·영양·도서·여행 추천'}
            </span>
            <span style="font-size: 0.76rem; color: #94A3B8;">
              ※ 본문 가독성을 위해 원하는 카테고리 탭을 누를 때만 깔끔하게 표시됩니다
            </span>
          </div>
          <h3 style="font-size: 1.12rem; font-weight: 900; color: #FFFFFF; margin: 0 0 0.65rem 0;">
            ${isEn
              ? 'Select a Category Tab Below to View Tailored Recommendations'
              : '우리 아이 맞춤 준비물 보관함 (원하시는 카테고리 버튼을 눌러 확인하세요)'}
          </h3>

          <!-- Category Filter Buttons -->
          <div id="pinpoint-category-filter-bar" style="display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.85rem;">
            <button type="button" class="pinpoint-cat-tab-btn" onclick="(function(btn){ var sec=document.getElementById('pinpoint-custom-prescription-section'); if(!sec) return; var boxes=sec.querySelectorAll('.pinpoint-category-box'); boxes.forEach(function(b){ b.style.display=(b.id==='pinpoint-supplements-box')?'block':'none'; }); var btns=sec.querySelectorAll('.pinpoint-cat-tab-btn'); btns.forEach(function(bt){ bt.style.background='rgba(255,255,255,0.06)'; bt.style.borderColor='rgba(255,255,255,0.18)'; }); btn.style.background='#0284C7'; btn.style.borderColor='#38BDF8'; })(this)" style="padding: 0.5rem 0.85rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; cursor: pointer; background: #0284C7; color: #FFFFFF; border: 1px solid #38BDF8;">
              💊 1. 맞춤 영양제 (3선)
            </button>
            <button type="button" class="pinpoint-cat-tab-btn" onclick="(function(btn){ var sec=document.getElementById('pinpoint-custom-prescription-section'); if(!sec) return; var boxes=sec.querySelectorAll('.pinpoint-category-box'); boxes.forEach(function(b){ b.style.display=(b.id==='pinpoint-toys-box')?'block':'none'; }); var btns=sec.querySelectorAll('.pinpoint-cat-tab-btn'); btns.forEach(function(bt){ bt.style.background='rgba(255,255,255,0.06)'; bt.style.borderColor='rgba(255,255,255,0.18)'; }); btn.style.background='#059669'; btn.style.borderColor='#34D399'; })(this)" style="padding: 0.5rem 0.85rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; cursor: pointer; background: rgba(255,255,255,0.06); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.18);">
              🧩 2. 맞춤 교구·실내운동 (3선)
            </button>
            <button type="button" class="pinpoint-cat-tab-btn" onclick="(function(btn){ var sec=document.getElementById('pinpoint-custom-prescription-section'); if(!sec) return; var boxes=sec.querySelectorAll('.pinpoint-category-box'); boxes.forEach(function(b){ b.style.display=(b.id==='pinpoint-books-box')?'block':'none'; }); var btns=sec.querySelectorAll('.pinpoint-cat-tab-btn'); btns.forEach(function(bt){ bt.style.background='rgba(255,255,255,0.06)'; bt.style.borderColor='rgba(255,255,255,0.18)'; }); btn.style.background='#7C3AED'; btn.style.borderColor='#C4B5FD'; })(this)" style="padding: 0.5rem 0.85rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; cursor: pointer; background: rgba(255,255,255,0.06); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.18);">
              📚 3. 필독 도서·워크북 (3선)
            </button>
            <button type="button" class="pinpoint-cat-tab-btn" onclick="(function(btn){ var sec=document.getElementById('pinpoint-custom-prescription-section'); if(!sec) return; var boxes=sec.querySelectorAll('.pinpoint-category-box'); boxes.forEach(function(b){ b.style.display=(b.id==='pinpoint-edu-travel-box')?'block':'none'; }); var btns=sec.querySelectorAll('.pinpoint-cat-tab-btn'); btns.forEach(function(bt){ bt.style.background='rgba(255,255,255,0.06)'; bt.style.borderColor='rgba(255,255,255,0.18)'; }); btn.style.background='#D97706'; btn.style.borderColor='#FBBF24'; })(this)" style="padding: 0.5rem 0.85rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; cursor: pointer; background: rgba(255,255,255,0.06); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.18);">
              ✈️ 4. 교육여행 추천 코스·키트 (3선)
            </button>
            <button type="button" class="pinpoint-cat-tab-btn" onclick="(function(btn){ var sec=document.getElementById('pinpoint-custom-prescription-section'); if(!sec) return; var boxes=sec.querySelectorAll('.pinpoint-category-box'); boxes.forEach(function(b){ b.style.display='block'; }); var btns=sec.querySelectorAll('.pinpoint-cat-tab-btn'); btns.forEach(function(bt){ bt.style.background='rgba(255,255,255,0.06)'; bt.style.borderColor='rgba(255,255,255,0.18)'; }); btn.style.background='#334155'; btn.style.borderColor='#94A3B8'; })(this)" style="padding: 0.5rem 0.85rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; cursor: pointer; background: rgba(255,255,255,0.06); color: #CBD5E1; border: 1px solid rgba(255,255,255,0.18);">
              📋 전체 펼침 보기
            </button>
          </div>
        </div>

        <div class="pinpoint-single-view-container" style="display: flex; flex-direction: column; gap: 1rem;">
          <!-- Category 1: Required Supplements (Default Visible Tab) -->
          <div class="pinpoint-category-box" id="pinpoint-supplements-box" style="display: block; background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(56, 189, 248, 0.38); border-radius: 18px; padding: 1.15rem; text-align: left;">
            <h4 style="font-size: 1.05rem; font-weight: 900; color: #38BDF8; margin: 0 0 0.3rem 0;">
              💊 ${isEn ? '1. Curated Nutritional Supplements (Top 3)' : '1. 맞춤 영양제 엄선 TOP 3 (아침·저녁 6개월 이상 꾸준히 챙기는 조합)'}
            </h4>
            <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.8rem 0; line-height: 1.52;">
              ${suppTraitNote}
            </p>
            ${renderCleanCategoryItems(data.supplements, 'rgba(56, 189, 248, 0.45)', 'supplement')}
          </div>

          <!-- Category 2: Required Play & Posture Tools (Shown when Tab 2 or Show All clicked) -->
          <div class="pinpoint-category-box" id="pinpoint-toys-box" style="display: none; background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(52, 211, 153, 0.38); border-radius: 18px; padding: 1.15rem; text-align: left;">
            <h4 style="font-size: 1.05rem; font-weight: 900; color: #34D399; margin: 0 0 0.3rem 0;">
              🧩 ${isEn ? '2. Curated Play & Exercise Tools (Top 3)' : '2. 맞춤 교구 & 실내 운동기구 엄선 TOP 3 (숨은 키 +1.8cm & 두뇌 몰입)'}
            </h4>
            <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.8rem 0; line-height: 1.52;">
              ${toyTraitNote}
            </p>
            ${renderCleanCategoryItems(data.toys, 'rgba(52, 211, 153, 0.45)', 'toy')}
          </div>

          <!-- Category 3: Required Books & Workbooks (Shown when Tab 3 or Show All clicked) -->
          <div class="pinpoint-category-box" id="pinpoint-books-box" style="display: none; background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(196, 181, 253, 0.38); border-radius: 18px; padding: 1.15rem; text-align: left;">
            <h4 style="font-size: 1.05rem; font-weight: 900; color: #C4B5FD; margin: 0 0 0.3rem 0;">
              📚 ${isEn ? '3. Curated Must-Read Books & Workbooks (Top 3)' : '3. 맞춤 필독 도서 & 워크북 엄선 TOP 3 (집중력·하브루타 질문독서)'}
            </h4>
            <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.8rem 0; line-height: 1.52;">
              ${bookTraitNote}
            </p>
            ${renderCleanCategoryItems(data.books, 'rgba(196, 181, 253, 0.45)', 'book')}
          </div>

          <!-- Category 4: Educational Family Travel & Experiential Tours (Shown when Tab 4 or Show All clicked) -->
          <div class="pinpoint-category-box" id="pinpoint-edu-travel-box" style="display: none; background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(251, 191, 36, 0.42); border-radius: 18px; padding: 1.15rem; text-align: left;">
            <h4 style="font-size: 1.05rem; font-weight: 900; color: #FDE68A; margin: 0 0 0.3rem 0;">
              ✈️ ${isEn ? '4. Curated Educational Family Travel & Field Tours (Top 3)' : '4. 위 동 나이대 필수 여행 가이드에 맞춘 추천 여행지 & 준비물 TOP 3'}
            </h4>
            <p style="font-size: 0.88rem; color: #E2E8F0; margin: 0 0 0.8rem 0; line-height: 1.52;">
              ${isEn
                ? `Mapped to Age ${ageYears} developmental windows: combines outdoor vitamin D synthesis, active growth plate walking, and parent-child Havruta inquiry.`
                : `앞서 설명드린 [만 ${ageYears}세 필수 교육여행 3대 테마]를 주말·방학에 바로 실천할 수 있도록 엄선한 실제 여행지 및 사전답사 도서·탐구키트입니다.`}
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.85rem;">
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
                      ✈️ ${isEn ? 'MyRealTrip Family Tour & Ticket ↗' : '마이리얼트립 가족 투어·티켓 특가 보기 ↗'}
                    </a>
                    <details style="margin-top: 0.4rem; font-size: 0.76rem; color: #94A3B8;">
                      <summary style="cursor: pointer; text-align: right; color: #94A3B8; font-weight: 700;">클룩(Klook) · 네이버투어 · 사전답사 도서 보기 ▼</summary>
                      <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem;">
                        <a href="${tour.klookUrl}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="klook" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(249,115,22,0.16); border-radius: 6px; color: #FDBA74; text-decoration: none; text-align: center; font-weight: 700;">🎫 클룩(Klook) 패스 ↗</a>
                        <a href="${tour.naverBrandTourUrl || 'https://naver.me/xJcOADhA'}" target="_blank" rel="noopener noreferrer" class="pinpoint-direct-link" data-merchant="naver-brandconnect" style="flex: 1 1 45%; padding: 0.35rem; background: rgba(34,197,94,0.15); border-radius: 6px; color: #86EFAC; text-decoration: none; text-align: center; font-weight: 700;">🏖️ 네이버 패밀리투어 ↗</a>
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

        <!-- Mandatory FTC & Coupang Partners Affiliate Disclosure -->
        <div id="affiliate-ftc-disclosure" style="margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; font-size: 0.8rem; color: #94A3B8; text-align: center; line-height: 1.5;">
          ℹ️ 본 서비스의 추천 상품 링크는 쿠팡 파트너스 및 제휴 마케팅 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
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
    getAgeEducationalTravelPhilosophy,
    renderAgeEducationalTravelGuide,
    renderPinpointAndLifecycleSection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TallerPinpointCurator;
  }
  global.TallerPinpointCurator = TallerPinpointCurator;
  global.KidsFitPinpointCurator = TallerPinpointCurator;

})(typeof window !== 'undefined' ? window : global);
