# 🎬 [1편] 신생아 필수템 5가지 추천 — 구글 Flow 프롬프트 & 더빙 마스터 패키지

- **레퍼런스 스타일**: 팡팡쀼 (`육아는 장비빨! 신생아 육아 필수템 5가지 추천` 쇼츠 포맷)
- **총 러닝타임**: `62.2초` (유튜브 쇼츠 1.25배 속도감 + 무음 점프컷 적용 완료)
- **생성된 더빙 오디오 파일 (`samples/shorts_ep1_newborn/audio/`)**:
  1. `ep1_voice_couple_duet.mp3` (**★강추: 부부 티키타카 버전** — 엄마·아빠가 컷마다 번갈아 대화하듯 소개하여 단일 TTS 특유의 AI 지루함이 전혀 없는 버전)
  2. `ep1_voice_mom_solo.mp3` (**30대 선배맘 단독 버전** — 무음 호흡 컷편집 + 1.25배속 + 콘덴서 마이크 EQ 적용)
  3. `ep1_voice_dad_solo.mp3` (**다정한 육아대디 단독 버전** — 최신 다국어 자연 억양 모델 적용)
- **즉시 재생 가능한 완성본 영상**:
  - 로컬 파일: `D:\드림컴퍼니\3사업부\samples\shorts_ep1_newborn\ep1_newborn_essential5_shorts.mp4`
  - 브라우저 확인: `http://localhost:3000/samples/shorts_ep1_newborn/ep1_newborn_essential5_shorts.mp4`

---

## 📋 구글 Flow (`labs.google/fx/tools/flow`) 장면별 복사·붙여넣기 프롬프트 (6컷)
> **핵심 팁**: AI 특유의 어색한 한국인 얼굴 정면 클로즈업을 피하고, **아이폰 15 Pro로 찍은 현실 육아 손동작·측면·1인칭 시점(POV)**으로 설계되어 실제 육아 유튜버 브이로그처럼 뽑힙니다.
> 구글 Flow에서 생성하신 클립을 `samples/shorts_ep1_newborn/flow_clips/scene1.mp4` ~ `scene6.mp4` 이름으로 폴더에 넣고 `python scripts/build_ep1_flow_shorts.py`를 실행하시면 배경에 자동 합성됩니다!

### Cut 1 (`scene1.mp4`). 출산준비 필수체크 — 신생아 육아 필수 장비 BEST 5
- **내레이션 대본 (선배맘)**:
  > "아기 태어나기 전에 다른 건 다 천천히 사도 되는데요,"
  > "이 다섯 가지는 조리원 나오기 전에 무조건 집에 있어야 합니다!"
  > "특히 세 번째는 없으면 새벽마다 진짜 후회해요."
- **구글 Flow 입력 프롬프트 (복사해서 바로 붙여넣기)**:
```text
Vertical 9:16 handheld iPhone 15 Pro home vlog shot. Warm sunlit Korean apartment living room with ivory baby play mat and sheer white curtains. A young mother's hands gently arranging neatly folded newborn baby clothes and baby essentials on a wooden table, warm natural morning light, shallow depth of field, photorealistic, authentic home video aesthetic, no stiff AI face.
```

### Cut 2 (`scene2.mp4`). 필수템 01 · 면역/배앓이 — 닥터에디션 베이비 비타민D3 400IU & 유산균
- **내레이션 대본 (육아대디)**:
  > "첫 번째, 액상 비타민D 드롭스랑 배앓이 유산균!"
  > "모유엔 비타민D가 부족해서 소아과도 생후 당장 먹이라고 하거든요."
  > "기울이면 딱 한 방울만 톡 떨어져서 쪽쪽이에 묻혀주기 진짜 편해요."
- **구글 Flow 입력 프롬프트 (복사해서 바로 붙여넣기)**:
```text
Vertical 9:16 close-up POV shot on iPhone 15 Pro. Warm cozy Korean nursery room. A parent's hand holding a small amber glass baby vitamin D dropper bottle, a single clear drop forming at the tip over a clean baby pacifier, soft natural window lighting, ultra-realistic macro details, authentic parenting vlog style.
```

### Cut 3 (`scene3.mp4`). 필수템 02 · 새벽 통잠 — 모로반사 숙면 방지 오가닉 순면 스와들업 속싸개
- **내레이션 대본 (선배맘)**:
  > "두 번째, 오가닉 스와들업 속싸개!"
  > "신생아는 자다가 자기 손에 깜짝 놀라 깨는 모로반사가 심한데요,"
  > "지퍼만 쓱 올려주면 나비잠 자세로 새벽에 안 깨고 꿀잠 잡니다."
- **구글 Flow 입력 프롬프트 (복사해서 바로 붙여넣기)**:
```text
Vertical 9:16 overhead soft shot on iPhone 15 Pro. Dimly lit warm nursery at night with a soft amber nightlight. A newborn baby sleeping peacefully in a cream organic cotton butterfly swaddle suit inside a wooden crib, chest gently rising and falling, parent's hand softly zipping up the swaddle, cozy realistic home video.
```

### Cut 4 (`scene4.mp4`). 필수템 03 · 새벽수유 구원템 — 무소음 자동 출수 분유포트 & 아기방 온습도계
- **내레이션 대본 (육아대디)**:
  > "세 번째, 원터치 자동 출수 분유포트랑 온습도계!"
  > "새벽 세 시에 아기는 자지러지게 우는데 뜨거운 물 식히려면 진짜 멘붕 오거든요."
  > "사십삼 도 딱 맞춰 일 초 만에 나오는 걸로 부부 수면 시간 지키세요."
- **구글 Flow 입력 프롬프트 (복사해서 바로 붙여넣기)**:
```text
Vertical 9:16 iPhone 15 Pro close-up shot in a modern Korean kitchen at night under warm under-cabinet lighting. A sleek white digital baby formula water dispenser pouring warm water into a baby feeding bottle with one touch, digital temperature display glowing 43C, realistic steam and water droplets, authentic home vlog.
```

### Cut 5 (`scene5.mp4`). 필수템 04 · 시신경/두뇌자극 — 신생아 흑백/컬러 초점책 & 오감발달 헝겊 촉각 인형
- **내레이션 대본 (선배맘)**:
  > "네 번째, 신생아 흑백 초점 병풍책과 촉각 인형!"
  > "생후 백일까지는 시신경이랑 두뇌가 폭발적으로 크는 시기라,"
  > "터미타임 할 때 세워두면 혼자서도 초점 맞추느라 엄청 집중합니다."
- **구글 Flow 입력 프롬프트 (복사해서 바로 붙여넣기)**:
```text
Vertical 9:16 low-angle iPhone 15 Pro shot on a soft cream Korean living room mat. A black-and-white high-contrast accordion baby visual stimulation book standing upright in front of a baby doing tummy time (seen from behind/over-the-shoulder of the baby's cute back of head and tiny hands), bright natural daylight, realistic textures.
```

### Cut 6 (`scene6.mp4`). 필수템 05 · 무료혜택 & 스토어 — 베베클럽 임산부·출산 축하 10종 본품 무료 기프트박스
- **내레이션 대본 (육아대디)**:
  > "다섯 번째, 임산부 출산 축하 무료 기프트박스까지!"
  > "오늘 소개한 필수템 다섯 가지 공식 판매처와 선배맘 비교표는 프로필 링크 키즈핏 스토어에 모아뒀어요."
  > "구경만 하셔도 우리 아기 일대일 발달 진단권이 무료로 열리니까 꼭 챙겨가세요!"
- **구글 Flow 입력 프롬프트 (복사해서 바로 붙여넣기)**:
```text
Vertical 9:16 iPhone 15 Pro POV shot. A clean white gift box filled with baby skincare samples, wet wipes, and a developmental guide ribbon being opened by gentle hands on a sunlit wooden table, warm joyful morning atmosphere, photorealistic Korean home vlog.
```
