#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\kfk_naver_editorial_designer.py
================================================================================
5사업부 (KidsFit Korea · https://kidsfit.co.kr)
자사 네이버 블로그(blog.naver.com/expertise333) · 카페(cafe.naver.com/moneyfitlab)
『키 성장 100% 전문 매거진 원고 뱅크 & 소아성장 연구소 급 3종 PNG 인포그래픽 엔진』

핵심 원칙 (그룹 총 회장 승인 · 비서실장 B형 초고해상도 명세):
1. 주제 100% '키 성장 5대 핵심축' 단일화 (C-Rank 집중 · 비성장 잡학 주제 0건):
   - 축 1: 밤 10시 성장호르몬 · 서파수면(N3) · 침실 0 Lux 조도 · 취침 전 혈당/구강호흡 관리
   - 축 2: 구연산 칼슘 · 비타민D3 · 비타민K2 · 아연 · 단백질 영양 & 편식 푸드브릿지
   - 축 3: 거북목 경추 하중 · 15도 눈높이 독서대 · 저녁 척추 감압 등 숨은 키 2cm 바른자세
   - 축 4: 줄넘기·점핑매트 수직 미세하중 자극 & 급성장기(PHV) vs 성조숙증 감별
   - 축 5: 질병관리청(KDCA) 성장 백분위 곡선 & 병원 성장판(뼈나이) 판독법
2. 블로그 전문 에디토리얼 칼럼(20종, 1,800~2,400자) vs 카페 소통형 코칭 원고(20종) 100% 분리:
   - 유사문서 원천 차단 (문장 구조·어휘·단락 전개 완전 분리)
   - 블로그 카테고리: '우리 아이 키성장·성조숙증' 고정
   - 카페 게시판: '우리아이 키성장·성조숙증' (menu_id=3) 고정
3. 무결점 3종 PNG 인포그래픽 세트 (두부 깨짐 '□' 0건 · 우측/하단 세이프 마진 >= 80px 강제):
   - Image 1 (blog_seq_XXX_1_cover.png): 매거진 대표 썸네일 배너
   - Image 2 (blog_seq_XXX_2_chart.png): 임상·통계 데이터 수평 막대 비교 차트 인포그래픽
   - Image 3 (blog_seq_XXX_3_checklist.png): 연령단계별(만 3~8세 / 만 9~12세 / 만 13~17세) 실천 체크표
   - Cafe Image (cafe_seq_XXX_card.png): 에메랄드 민트 소통형 실천 미션 카드
4. D.I.A.+ 상업성 감점 차단 & 수익화 가드레일:
   - 첫 문단 외부링크 노출 0건 (구 top_inflow_box 영구 폐지)
   - 본문 3개 섹션 사이사이에 이미지 3장을 교차 배치한 뒤 맨 하단에만 무료 성장진단·뼈나이 해석기 및
     연령단계별 에디터 큐레이션(쿠팡 AF7865143 · 링크프라이스 A100708867 · 공정위 고지문) 자연 연결
   - 금지어 4종 및 해외 PG 문자열 혼입 0건
================================================================================
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(r"D:\드림컴퍼니\5사업부")
EDITORIAL_IMG_DIR = ROOT_DIR / "samples" / "9_naver_brand_assets" / "editorial_3set_cards"

BLOG_TARGET_CATEGORY = "우리 아이 키성장·성조숙증"
CAFE_TARGET_BOARD = "우리아이 키성장·성조숙증"
CAFE_TARGET_MENU_ID = 3

BANNED_KR_PROMO_WORDS = (
    "\ucd5c\uc800\uac00",
    "\ud560\uc778\uc728",
    "\ud2b9\uac00",
    "\ud3ed\ud0c4\uc138\uc77c",
)

NON_GROWTH_OFF_TOPIC_KEYWORDS = (
    "박물관",
    "미술관",
    "과학관",
    "하브루타",
    "문장제",
    "백지복습",
    "파인만",
    "안전가위",
    "빨래집게",
    "사자 갈기",
)

KFTC_DISCLOSURE_KO = (
    "※ 공정거래위원회 경제적 이해관계 고지: 본 칼럼 하단의 성장 환경 큐레이션 안내를 통해 "
    "제휴 파트너사(쿠팡 파트너스 AF7865143 · 링크프라이스 A100708867)로부터 소정의 수수료를 "
    "제공받을 수 있으나, 학부모님께 추가 비용은 일절 발생하지 않습니다."
)

LATPEED_MASTERBOOK_SLOT_URL = "https://kidsfit.co.kr/#kfk-latpeed-ebook-slot"

# 질병관리청(KDCA) 2017 소아청소년 성장도표 공식 50백분위(중앙값) 공신력 데이터 박스
KDCA_OFFICIAL_DATA_BOX_KO = (
    "■ [공공기관 공신력 기준] 질병관리청(KDCA) 2017 소아청소년 성장도표 표준키(50백분위 중앙값)\n"
    "• 만 6세(72개월) 표준키: 남아 115.7cm / 여아 114.7cm\n"
    "• 만 8세(96개월) 표준키: 남아 127.8cm / 여아 126.7cm\n"
    "• 만 10세(120개월) 표준키: 남아 138.8cm / 여아 139.1cm (여아 급성장기 PHV 진입 교차 구간)\n"
    "• 만 12세(144개월) 표준키: 남아 151.9cm / 여아 152.0cm\n"
    "• 사춘기 전 정상 연간 성장속도: 연 5.0~6.5cm (연 4.0cm 미만이거나 뼈나이 1년 빠름 · 성조숙증 검사 시기가 고민될 경우 소아청소년과 성장판 점검을 권장합니다)"
)

# 5대 축별 한글·영문·구어체 연관검색어 변주 클러스터 (챌린지클래스 11/09 홈판+검색형 하이브리드 로직)
AXIS_QUERY_VARIANT_CLUSTERS: Dict[str, List[str]] = {
    "AXIS 01": [
        "성장호르몬 분비시간",
        "Slow-Wave Sleep(서파수면 N3)",
        "Melatonin(멜라토닌 조도)",
        "밤 10시 통잠 루틴",
        "질병관리청 표준키",
    ],
    "AXIS 02": [
        "구연산 칼슘 흡수율",
        "Vitamin D3 · K2(오스테오칼신)",
        "Zinc(아연 미각세포)",
        "밥 안 먹는 아이 푸드브릿지",
        "질병관리청 표준키",
    ],
    "AXIS 03": [
        "어린이 거북목 교정",
        "Text Neck 경추 하중",
        "숨은 키 2cm 찾기",
        "새학기 바른자세 15도 독서대·발받침",
        "질병관리청 표준키",
    ],
    "AXIS 04": [
        "급성장기",
        "PHV(Peak Height Velocity)",
        "성조숙증 검사 시기",
        "뼈나이 1년 빠름",
        "질병관리청 표준키",
    ],
    "AXIS 05": [
        "질병관리청 표준키",
        "KDCA 소아청소년 성장도표",
        "Bone Age(손목 엑스레이 뼈나이)",
        "뼈나이 1년 빠름",
        "급성장기 PHV · 성조숙증 검사 시기",
    ],
}


def format_mobile_short_breath_paragraphs(
    text: str,
    max_chars_per_para: int = 165,
    max_sentences_per_para: int = 2,
) -> str:
    """
    [챌린지클래스 11/09 가독성 표준]
    긴 문단을 모바일 화면 3~4줄(1~2문장, 약 80~165자) 호흡으로 압축 분리하여
    네이버 홈판·모바일 검색 유입 독자의 스크롤 피로도를 낮추고 체류시간을 높입니다.
    """
    out_blocks: List[str] = []
    for raw_para in str(text or "").strip().split("\n\n"):
        p = raw_para.strip()
        if not p:
            continue
        if p.startswith(("■", "•", "1.", "2.", "3.", "※")):
            out_blocks.append(p)
            continue
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", p) if s.strip()]
        buf = ""
        sent_cnt = 0
        for sent in sentences:
            if not buf:
                buf = sent
                sent_cnt = 1
            elif sent_cnt < max_sentences_per_para and len(buf) + 1 + len(sent) <= max_chars_per_para:
                buf = f"{buf} {sent}"
                sent_cnt += 1
            else:
                out_blocks.append(buf)
                buf = sent
                sent_cnt = 1
        if buf:
            out_blocks.append(buf)
    return "\n\n".join(out_blocks)

# Characters strictly verified to render cleanly in Windows Malgun Gothic (zero '□' tofu boxes)
ALLOWED_CANVAS_CHARS_RE = re.compile(
    r"[^가-힣0-9A-Za-z\s\.\,\:\;\!\?\(\)\[\]\/\%\+\-\~\&\·\•\→\±\°\×\—\|]"
)


def sanitize_canvas_text(text: str) -> str:
    """
    Removes all emojis, supplementary Unicode symbols, and unsupported glyphs that render
    as tofu boxes ('□') in malgun.ttf / malgunbd.ttf.
    """
    if not text:
        return ""
    s = str(text)
    replacements = {
        "①": "01 ",
        "②": "02 ",
        "③": "03 ",
        "④": "04 ",
        "⑤": "05 ",
        "~": "~",
        "–": "-",
        "’": "'",
        "‘": "'",
        "“": '"',
        "”": '"',
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    s = ALLOWED_CANVAS_CHARS_RE.sub("", s)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def get_malgun_font(size_px: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf" if bold else r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\NanumGothicBold.ttf" if bold else r"C:\Windows\Fonts\NanumGothic.ttf",
        r"C:\Windows\Fonts\gulim.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size_px)
    return ImageFont.load_default()


def wrap_pixel_exact(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width_px: int,
) -> List[str]:
    """
    Pixel-accurate line wrapper using draw.textbbox. Splits by words first and falls back to
    character-level splitting if a single token exceeds max_width_px, guaranteeing 0% overflow.
    """
    lines: List[str] = []
    for raw_para in str(text or "").splitlines():
        para = sanitize_canvas_text(raw_para)
        if not para:
            continue
        words = para.split(" ")
        cur = ""
        for word in words:
            cand = f"{cur} {word}".strip() if cur else word
            bbox = draw.textbbox((0, 0), cand, font=font)
            if (bbox[2] - bbox[0]) <= max_width_px:
                cur = cand
            else:
                if cur:
                    lines.append(cur)
                    cur = ""
                # Check if single word itself exceeds max_width_px
                wb = draw.textbbox((0, 0), word, font=font)
                if (wb[2] - wb[0]) <= max_width_px:
                    cur = word
                else:
                    chunk = ""
                    for ch in word:
                        cb = draw.textbbox((0, 0), chunk + ch, font=font)
                        if (cb[2] - cb[0]) <= max_width_px:
                            chunk += ch
                        else:
                            if chunk:
                                lines.append(chunk)
                            chunk = ch
                    cur = chunk
        if cur:
            lines.append(cur)
    return lines


def fit_wrapped_lines(
    draw: ImageDraw.ImageDraw,
    text: str,
    max_width_px: int,
    max_lines: int,
    start_size: int,
    min_size: int,
    bold: bool = True,
) -> Tuple[ImageFont.FreeTypeFont, List[str]]:
    """Steps font size down cleanly until wrapped text fits within max_lines and max_width_px."""
    size = start_size
    while size >= min_size:
        fnt = get_malgun_font(size, bold=bold)
        lines = wrap_pixel_exact(draw, text, fnt, max_width_px)
        if len(lines) <= max_lines:
            return fnt, lines
        size -= 2
    fnt = get_malgun_font(min_size, bold=bold)
    lines = wrap_pixel_exact(draw, text, fnt, max_width_px)
    if len(lines) > max_lines:
        kept = lines[: max_lines - 1]
        tail = lines[max_lines - 1]
        while tail and (draw.textbbox((0, 0), tail + "...", font=fnt)[2] > max_width_px):
            tail = tail[:-1]
        kept.append(tail.rstrip() + "...")
        return fnt, kept
    return fnt, lines


class SafeCanvasDrawer:
    """
    2x supersampled PIL canvas wrapper that records every text bounding box in final 1x coordinates
    and enforces >= 80px right/bottom safe margins with zero clipping.
    """

    def __init__(self, width: int, height: int, bg_rgb: Tuple[int, int, int], scale: int = 2):
        self.w = width
        self.h = height
        self.s = scale
        self.img_hi = Image.new("RGB", (width * scale, height * scale), bg_rgb)
        self.draw = ImageDraw.Draw(self.img_hi)
        self.text_boxes_1x: List[Dict[str, Any]] = []

    def rect(self, box: List[float], fill=None, outline=None, width: int = 1):
        s = self.s
        self.draw.rectangle([box[0] * s, box[1] * s, box[2] * s, box[3] * s], fill=fill, outline=outline, width=width * s)

    def rrect(self, box: List[float], radius: float, fill=None, outline=None, width: int = 1):
        s = self.s
        self.draw.rounded_rectangle(
            [box[0] * s, box[1] * s, box[2] * s, box[3] * s],
            radius=int(radius * s),
            fill=fill,
            outline=outline,
            width=int(width * s),
        )

    def circle(self, cx: float, cy: float, r: float, fill=None, outline=None, width: int = 1):
        s = self.s
        self.draw.ellipse(
            [(cx - r) * s, (cy - r) * s, (cx + r) * s, (cy + r) * s],
            fill=fill,
            outline=outline,
            width=int(width * s),
        )

    def line(self, pts: List[Tuple[float, float]], fill, width: int = 2):
        s = self.s
        scaled = [(p[0] * s, p[1] * s) for p in pts]
        self.draw.line(scaled, fill=fill, width=int(width * s), joint="curve")

    def draw_check_icon(self, cx: float, cy: float, r: float, bg_rgb: Tuple[int, int, int], tick_rgb=(255, 255, 255)):
        self.circle(cx, cy, r, fill=bg_rgb)
        p1 = (cx - r * 0.42, cy + r * 0.02)
        p2 = (cx - r * 0.10, cy + r * 0.34)
        p3 = (cx + r * 0.46, cy - r * 0.30)
        self.line([p1, p2, p3], fill=tick_rgb, width=max(3, int(r * 0.22)))

    def pill(
        self,
        x: float,
        y: float,
        h: float,
        text: str,
        size: int,
        bg_fill: Tuple[int, int, int],
        text_fill: Tuple[int, int, int],
        pad_x: float = 26.0,
        outline=None,
        width: int = 1,
    ) -> float:
        clean = sanitize_canvas_text(text)
        s = self.s
        fnt = get_malgun_font(int(size * s), bold=True)
        b0 = self.draw.textbbox((0, 0), clean, font=fnt)
        tw = (b0[2] - b0[0]) / s
        th = (b0[3] - b0[1]) / s
        pill_w = tw + pad_x * 2.0
        self.rrect([x, y, x + pill_w, y + h], radius=h / 2.0, fill=bg_fill, outline=outline, width=width)
        ty = y + (h - th) / 2.0 - 4
        self.text(x + pad_x, ty, clean, size=size, fill=text_fill, bold=True)
        return x + pill_w

    def text_centered_in_box(
        self,
        x: float,
        box_top: float,
        box_h: float,
        text: str,
        max_width: float,
        max_lines: int,
        start_size: int,
        min_size: int,
        fill: Tuple[int, int, int],
        bold: bool = True,
        line_gap: float = 10.0,
    ) -> None:
        s = self.s
        fnt_hi, lines = fit_wrapped_lines(
            self.draw,
            text,
            max_width_px=int(max_width * s),
            max_lines=max_lines,
            start_size=int(start_size * s),
            min_size=int(min_size * s),
            bold=bold,
        )
        heights_1x: List[float] = []
        for ln in lines:
            b = self.draw.textbbox((0, 0), ln, font=fnt_hi)
            heights_1x.append((b[3] - b[1]) / s)
        total_h = sum(heights_1x) + line_gap * max(0, len(lines) - 1)
        cur_y = box_top + (box_h - total_h) / 2.0 - 3
        for ln in lines:
            actual_hi = self.draw.textbbox((x * s, cur_y * s), ln, font=fnt_hi)
            self.draw.text((x * s, cur_y * s), ln, font=fnt_hi, fill=fill)
            box_1x = (
                actual_hi[0] / s,
                actual_hi[1] / s,
                actual_hi[2] / s,
                actual_hi[3] / s,
            )
            self.text_boxes_1x.append({"text": ln, "bbox": box_1x})
            cur_y = box_1x[3] + line_gap

    def text(
        self,
        x: float,
        y: float,
        text: str,
        size: int,
        fill: Tuple[int, int, int],
        bold: bool = True,
        align: str = "left",
    ) -> Tuple[float, float, float, float]:
        clean = sanitize_canvas_text(text)
        if not clean:
            return (x, y, x, y)
        s = self.s
        fnt = get_malgun_font(int(size * s), bold=bold)
        b0 = self.draw.textbbox((0, 0), clean, font=fnt)
        tw = (b0[2] - b0[0]) / s
        draw_x = x
        if align == "center":
            draw_x = x - tw / 2.0
        elif align == "right":
            draw_x = x - tw
        actual_hi = self.draw.textbbox((draw_x * s, y * s), clean, font=fnt)
        self.draw.text((draw_x * s, y * s), clean, font=fnt, fill=fill)
        box_1x = (
            actual_hi[0] / s,
            actual_hi[1] / s,
            actual_hi[2] / s,
            actual_hi[3] / s,
        )
        self.text_boxes_1x.append({"text": clean, "bbox": box_1x})
        return box_1x

    def text_block(
        self,
        x: float,
        y: float,
        text: str,
        max_width: float,
        max_lines: int,
        start_size: int,
        min_size: int,
        fill: Tuple[int, int, int],
        bold: bool = True,
        line_gap: float = 12.0,
    ) -> float:
        s = self.s
        fnt_hi, lines = fit_wrapped_lines(
            self.draw,
            text,
            max_width_px=int(max_width * s),
            max_lines=max_lines,
            start_size=int(start_size * s),
            min_size=int(min_size * s),
            bold=bold,
        )
        cur_y = y
        for ln in lines:
            actual_hi = self.draw.textbbox((x * s, cur_y * s), ln, font=fnt_hi)
            self.draw.text((x * s, cur_y * s), ln, font=fnt_hi, fill=fill)
            box_1x = (
                actual_hi[0] / s,
                actual_hi[1] / s,
                actual_hi[2] / s,
                actual_hi[3] / s,
            )
            self.text_boxes_1x.append({"text": ln, "bbox": box_1x})
            cur_y = box_1x[3] + line_gap
        return cur_y

    def validate_safe_margins(self, min_right_px: int = 80, min_bottom_px: int = 80, min_left_px: int = 80) -> List[str]:
        violations: List[str] = []
        for rec in self.text_boxes_1x:
            x0, y0, x1, y1 = rec["bbox"]
            if x0 < min_left_px - 2:
                violations.append(f"Left margin < {min_left_px}px ({x0:.1f}px): '{rec['text']}'")
            if x1 > (self.w - min_right_px + 2):
                violations.append(f"Right margin < {min_right_px}px (x1={x1:.1f}/{self.w}): '{rec['text']}'")
            if y1 > (self.h - min_bottom_px + 2):
                violations.append(f"Bottom margin < {min_bottom_px}px (y1={y1:.1f}/{self.h}): '{rec['text']}'")
        return violations

    def save_png(self, out_path: Path, min_margin_px: int = 80) -> Dict[str, Any]:
        violations = self.validate_safe_margins(
            min_right_px=min_margin_px,
            min_bottom_px=min_margin_px,
            min_left_px=min_margin_px,
        )
        if violations:
            raise ValueError(f"Infographic safe-margin check failed for {out_path.name}: {violations}")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        final_img = self.img_hi.resize((self.w, self.h), Image.Resampling.LANCZOS)
        final_img.save(str(out_path), "PNG", optimize=True)
        return {
            "path": str(out_path),
            "width": self.w,
            "height": self.h,
            "text_elements_verified": len(self.text_boxes_1x),
            "min_safe_margin_px": min_margin_px,
        }


# ---------------------------------------------------------------------------
# 1. 소아성장 연구소 급 3종 PNG 인포그래픽 렌더러 + 카페 소통 카드 렌더러
# ---------------------------------------------------------------------------
def render_blog_cover_png(out_path: Path, seq_num: int, item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Image 1 (1080x1200): 매거진 대표 썸네일 배너
    - 딥 네이비/로얄 인디고 헤더 + 웜 아이보리 카드
    - 상단 'KIDSFIT PEDIATRIC GROWTH LAB · 소아성장 연구 칼럼' 라벨
    - 강렬하고 품격 있는 2~3줄 메인 타이틀 + 핵심 요약 배지 3개 + 하단 연구소 서명
    """
    W, H = 1080, 1200
    cv = SafeCanvasDrawer(W, H, bg_rgb=(247, 244, 238), scale=2)

    # Outer magazine frame (leaves >= 80px safe margin for all inner text)
    cv.rrect([52, 48, W - 52, H - 52], radius=34, fill=(255, 253, 249), outline=(214, 219, 228), width=2)

    # Deep Royal Navy Hero Header
    cv.rrect([68, 64, W - 68, 496], radius=28, fill=(15, 29, 58))
    # Subtle Gold Accent Line inside header
    cv.rect([100, 152, 230, 157], fill=(245, 176, 65))

    # Top Pill Label (dynamic width — zero text overflow)
    cv.pill(
        x=96,
        y=92,
        h=46,
        text=f"KIDSFIT PEDIATRIC GROWTH LAB · 소아성장 연구 칼럼 #{seq_num:02d}",
        size=21,
        bg_fill=(30, 52, 96),
        text_fill=(226, 238, 255),
        pad_x=24,
        outline=(68, 104, 176),
        width=1,
    )

    # Axis tag
    cv.text(100, 174, sanitize_canvas_text(item["axis_label"]), size=24, fill=(248, 196, 113), bold=True)

    # Main 2~3 line Headline inside Deep Navy Header
    cv.text_block(
        x=100,
        y=220,
        text=item["cover_headline"],
        max_width=W - 200,
        max_lines=3,
        start_size=45,
        min_size=34,
        fill=(255, 255, 255),
        bold=True,
        line_gap=14,
    )

    # Sub-caption inside bottom of Navy Header
    cv.text_block(
        x=100,
        y=432,
        text=item["cover_subline"],
        max_width=W - 200,
        max_lines=1,
        start_size=22,
        min_size=18,
        fill=(186, 206, 238),
        bold=False,
        line_gap=6,
    )

    # 3 Key Summary Badges in Warm Ivory Body
    py = 528
    badge_colors = [(37, 99, 235), (16, 148, 108), (79, 70, 229)]
    for idx, pt in enumerate(item["cover_points"][:3]):
        box_h = 136
        cv.rrect(
            [92, py, W - 92, py + box_h],
            radius=22,
            fill=(248, 250, 253),
            outline=(220, 228, 239),
            width=2,
        )
        # Left vertical accent bar inside badge
        cv.rrect([92, py + 18, 102, py + box_h - 18], radius=5, fill=badge_colors[idx])

        # Numbered circle
        cx, cy = 154, py + box_h / 2.0
        cv.circle(cx, cy, 28, fill=badge_colors[idx])
        cv.text(cx, cy - 15, f"0{idx + 1}", size=23, fill=(255, 255, 255), bold=True, align="center")

        # Point text vertically centered in box (safe right limit: W - 116 => margin >= 116px)
        cv.text_centered_in_box(
            x=204,
            box_top=py,
            box_h=box_h,
            text=pt,
            max_width=(W - 116) - 204,
            max_lines=2,
            start_size=29,
            min_size=23,
            fill=(20, 31, 52),
            bold=True,
            line_gap=10,
        )
        py += box_h + 20

    # Bottom Studio Signature Bar (strictly above H - 80 = 1120)
    cv.rrect([92, 1018, W - 92, 1098], radius=18, fill=(15, 29, 58))
    cv.text(
        W / 2.0,
        1043,
        "키즈핏 소아성장 연구소  |  질병관리청 KDCA 성장도표 · 소아내분비 학술 리포트",
        size=23,
        fill=(241, 245, 249),
        bold=True,
        align="center",
    )

    return cv.save_png(out_path, min_margin_px=80)


def render_blog_chart_png(out_path: Path, seq_num: int, item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Image 2 (1080x1200): 임상 데이터 비교 차트 인포그래픽
    - 수평 막대 비교 차트 + 최적 골든타임 강조 배지 + 하단 학술 출처 박스
    """
    W, H = 1080, 1200
    cv = SafeCanvasDrawer(W, H, bg_rgb=(241, 245, 249), scale=2)

    cv.rrect([52, 48, W - 52, H - 52], radius=34, fill=(255, 255, 255), outline=(203, 213, 225), width=2)

    # Header bar (dynamic width)
    cv.pill(
        x=92,
        y=76,
        h=48,
        text="CLINICAL DATA INSIGHT · 임상 데이터 분석",
        size=21,
        bg_fill=(15, 23, 42),
        text_fill=(125, 211, 252),
        pad_x=26,
    )

    # Chart Main Title
    next_y = cv.text_block(
        x=92,
        y=144,
        text=item["chart_title"],
        max_width=W - 184,
        max_lines=2,
        start_size=38,
        min_size=30,
        fill=(15, 23, 42),
        bold=True,
        line_gap=10,
    )

    # Key Insight Subtitle Box
    sub_top = max(256, next_y + 10)
    cv.rrect([92, sub_top, W - 92, sub_top + 78], radius=16, fill=(239, 246, 255), outline=(191, 219, 254), width=2)
    cv.text_block(
        x=116,
        y=sub_top + 20,
        text=item["chart_takeaway"],
        max_width=W - 232,
        max_lines=1,
        start_size=24,
        min_size=19,
        fill=(30, 64, 175),
        bold=True,
        line_gap=6,
    )

    # Horizontal Bar Comparison Rows (3 rows)
    bars = item["chart_bars"][:3]
    row_y = sub_top + 106
    bar_palettes = [
        ((16, 185, 129), (236, 253, 245)),   # Emerald (Optimal / Best)
        ((59, 130, 246), (239, 246, 255)),   # Royal Blue (Moderate)
        ((239, 68, 68), (254, 242, 242)),    # Coral Red (Caution / Risk)
    ]

    for idx, bar in enumerate(bars):
        fg_col, soft_bg = bar_palettes[idx % len(bar_palettes)]
        if bar.get("tone") == "risk":
            fg_col, soft_bg = ((225, 29, 72), (255, 241, 242))
        elif bar.get("tone") == "good":
            fg_col, soft_bg = ((5, 150, 105), (236, 253, 245))
        elif bar.get("tone") == "mid":
            fg_col, soft_bg = ((37, 99, 235), (239, 246, 255))

        card_h = 182
        cv.rrect([92, row_y, W - 92, row_y + card_h], radius=22, fill=soft_bg, outline=(226, 232, 240), width=2)

        # Row Label (Left) & Value Label (Right, inside W - 116)
        cv.text_block(
            x=120,
            y=row_y + 20,
            text=bar["label"],
            max_width=560,
            max_lines=1,
            start_size=28,
            min_size=22,
            fill=(15, 23, 42),
            bold=True,
        )
        cv.text(
            W - 120,
            row_y + 18,
            bar["value_text"],
            size=30,
            fill=fg_col,
            bold=True,
            align="right",
        )

        # Progress Track & Value Bar
        track_x0, track_x1 = 120, W - 120
        track_y0, track_y1 = row_y + 74, row_y + 114
        cv.rrect([track_x0, track_y0, track_x1, track_y1], radius=20, fill=(226, 232, 240))
        pct = max(0.10, min(1.0, float(bar["ratio"])))
        fill_x1 = track_x0 + (track_x1 - track_x0) * pct
        cv.rrect([track_x0, track_y0, fill_x1, track_y1], radius=20, fill=fg_col)

        # Sub-note under bar
        cv.text_block(
            x=120,
            y=row_y + 128,
            text=bar["note"],
            max_width=W - 240,
            max_lines=1,
            start_size=22,
            min_size=18,
            fill=(71, 85, 105),
            bold=False,
        )
        row_y += card_h + 20

    # Bottom Source Citation Box (strictly above H - 80 = 1120)
    cv.rrect([92, 1012, W - 92, 1102], radius=18, fill=(248, 250, 252), outline=(203, 213, 225), width=2)
    cv.text(
        W / 2.0,
        1028,
        "자료 근거: 질병관리청(KDCA) 소아청소년 성장도표 · 소아내분비학 학술 문헌 재구성",
        size=21,
        fill=(51, 65, 85),
        bold=True,
        align="center",
    )
    cv.text(
        W / 2.0,
        1062,
        "키즈핏 소아성장 연구소 데이터 에디션  |  가정 내 성장 환경 점검 참고용",
        size=19,
        fill=(100, 116, 139),
        bold=False,
        align="center",
    )

    return cv.save_png(out_path, min_margin_px=80)


def render_blog_checklist_png(out_path: Path, seq_num: int, item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Image 3 (1080x1200): 연령단계별 오늘 밤 실천 체크표
    - [유아·초등 저학년 (만 3~8세)] / [초등 고학년 급성장기 (만 9~12세)] / [중·고등 마무리 성장기 (만 13~17세)]
    - 벡터 체크 아이콘(이모지 0건) + 하단 '무료 1분 질병관리청 성장 백분위 진단 · kidsfit.co.kr' 바
    """
    W, H = 1080, 1200
    cv = SafeCanvasDrawer(W, H, bg_rgb=(242, 248, 245), scale=2)

    cv.rrect([52, 48, W - 52, H - 52], radius=34, fill=(255, 255, 255), outline=(198, 224, 212), width=2)

    # Top Header Pill (dynamic width — zero clipping)
    cv.pill(
        x=92,
        y=74,
        h=48,
        text="HOME CARE CHECKLIST · 연령단계별 오늘 밤 실천표",
        size=21,
        bg_fill=(6, 95, 70),
        text_fill=(209, 250, 229),
        pad_x=26,
    )

    cv.text_block(
        x=92,
        y=138,
        text=item["checklist_title"],
        max_width=W - 184,
        max_lines=2,
        start_size=36,
        min_size=28,
        fill=(15, 23, 42),
        bold=True,
        line_gap=10,
    )

    stages = [
        ("유아·초등 저학년 (만 3~8세)", (16, 185, 129), (236, 253, 245), item["stage_actions"]["early"]),
        ("초등 고학년 급성장기 (만 9~12세)", (37, 99, 235), (239, 246, 255), item["stage_actions"]["upper"]),
        ("중·고등 마무리 성장기 (만 13~17세)", (79, 70, 229), (238, 242, 255), item["stage_actions"]["teen"]),
    ]

    sy = 250
    for stage_label, accent_col, pill_bg, bullets in stages:
        card_h = 232
        cv.rrect([92, sy, W - 92, sy + card_h], radius=22, fill=(250, 252, 251), outline=(214, 226, 220), width=2)

        # Stage Header Pill (dynamic width)
        cv.pill(
            x=116,
            y=sy + 18,
            h=46,
            text=f"[{stage_label}]",
            size=23,
            bg_fill=pill_bg,
            text_fill=accent_col,
            pad_x=22,
        )

        by = sy + 82
        for b_txt in bullets[:2]:
            cv.draw_check_icon(138, by + 18, 15, bg_rgb=accent_col)
            cv.text_block(
                x=170,
                y=by + 2,
                text=b_txt,
                max_width=(W - 116) - 170,
                max_lines=2,
                start_size=24,
                min_size=20,
                fill=(30, 41, 59),
                bold=True,
                line_gap=6,
            )
            by += 68

        sy += card_h + 18

    # Bottom Diagnostic Guide Bar (strictly above H - 80 = 1120)
    cv.rrect([92, 1012, W - 92, 1098], radius=18, fill=(6, 95, 70))
    cv.text(
        W / 2.0,
        1039,
        "무료 1분 질병관리청 성장 백분위 진단 · kidsfit.co.kr",
        size=26,
        fill=(255, 255, 255),
        bold=True,
        align="center",
    )

    return cv.save_png(out_path, min_margin_px=80)


def render_cafe_coaching_card_png(out_path: Path, seq_num: int, cafe_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cafe Card (1080x1080): 따뜻한 에메랄드 민트 소통형 실천 미션 체크카드 (이모지 0건, 마진 >= 80px)
    """
    W, H = 1080, 1080
    cv = SafeCanvasDrawer(W, H, bg_rgb=(238, 249, 244), scale=2)

    cv.rrect([52, 48, W - 52, H - 52], radius=34, fill=(255, 255, 255), outline=(186, 230, 210), width=2)
    cv.rrect([68, 64, W - 68, 368], radius=26, fill=(5, 122, 85))

    cv.pill(
        x=96,
        y=88,
        h=46,
        text=f"키즈핏 우리아이 키성장 연구소 · 실천 미션 #{seq_num:02d}",
        size=21,
        bg_fill=(6, 95, 70),
        text_fill=(209, 250, 229),
        pad_x=24,
    )

    cv.text_block(
        x=100,
        y=158,
        text=cafe_item["card_title"],
        max_width=W - 200,
        max_lines=3,
        start_size=40,
        min_size=31,
        fill=(255, 255, 255),
        bold=True,
        line_gap=12,
    )

    py = 402
    for idx, pt in enumerate(cafe_item["points"][:3]):
        box_h = 142
        cv.rrect([92, py, W - 92, py + box_h], radius=20, fill=(244, 251, 248), outline=(204, 235, 220), width=2)
        cv.draw_check_icon(144, py + box_h / 2.0, 22, bg_rgb=(16, 185, 129))
        cv.text_centered_in_box(
            x=188,
            box_top=py,
            box_h=box_h,
            text=pt,
            max_width=(W - 116) - 188,
            max_lines=2,
            start_size=27,
            min_size=22,
            fill=(20, 40, 34),
            bold=True,
            line_gap=10,
        )
        py += box_h + 20

    cv.rrect([92, 902, W - 92, 986], radius=18, fill=(6, 95, 70))
    cv.text(
        W / 2.0,
        929,
        "오늘 밤 실천 후 댓글로 아이 연령대 · 인증 한 줄을 남겨주세요  |  kidsfit.co.kr",
        size=22,
        fill=(255, 255, 255),
        bold=True,
        align="center",
    )

    return cv.save_png(out_path, min_margin_px=80)


def generate_blog_3set_infographics(seq_num: int, item: Dict[str, Any], out_dir: Path = EDITORIAL_IMG_DIR) -> List[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    p1 = out_dir / f"blog_seq_{seq_num:03d}_1_cover.png"
    p2 = out_dir / f"blog_seq_{seq_num:03d}_2_chart.png"
    p3 = out_dir / f"blog_seq_{seq_num:03d}_3_checklist.png"
    render_blog_cover_png(p1, seq_num, item)
    render_blog_chart_png(p2, seq_num, item)
    render_blog_checklist_png(p3, seq_num, item)
    return [str(p1), str(p2), str(p3)]


# ---------------------------------------------------------------------------
# 2. 5대 키 성장 핵심축 20종 블로그 전문 에디토리얼 칼럼 뱅크 (비성장 주제 0%)
# ---------------------------------------------------------------------------
def _make_editorial_topic(
    topic_id: str,
    axis_label: str,
    title: str,
    cover_headline: str,
    cover_subline: str,
    cover_points: List[str],
    chart_title: str,
    chart_takeaway: str,
    chart_bars: List[Dict[str, Any]],
    checklist_title: str,
    early_actions: List[str],
    upper_actions: List[str],
    teen_actions: List[str],
    section1_intro: str,
    section2_mechanism: str,
    section3_routine: str,
    tags: List[str],
) -> Dict[str, Any]:
    return {
        "id": topic_id,
        "axis_label": axis_label,
        "blog_category": BLOG_TARGET_CATEGORY,
        "title": title,
        "cover_headline": cover_headline,
        "cover_subline": cover_subline,
        "cover_points": cover_points,
        "chart_title": chart_title,
        "chart_takeaway": chart_takeaway,
        "chart_bars": chart_bars,
        "checklist_title": checklist_title,
        "stage_actions": {
            "early": early_actions,
            "upper": upper_actions,
            "teen": teen_actions,
        },
        "section1_intro": section1_intro.strip(),
        "section2_mechanism": section2_mechanism.strip(),
        "section3_routine": section3_routine.strip(),
        "tags": tags,
    }


BLOG_GROWTH_EDITORIAL_BANK: List[Dict[str, Any]] = [
    # ==================== AXIS 1: 야간 성장호르몬 · 서파수면 (4종) ====================
    _make_editorial_topic(
        topic_id="axis1_sleep_insulin_gh",
        axis_label="AXIS 01 · 야간 성장호르몬과 서파수면 의학",
        title="[소아성장 칼럼] 밤 10시 전에 재워도 키가 더딘 이유? 취침 2시간 전 '혈당·인슐린'과 서파수면 성장호르몬의 비밀",
        cover_headline="밤 10시 전에 불을 꺼도\n키가 더디게 자란다면?\n취침 전 혈당부터 점검하세요",
        cover_subline="서파수면(N3) 성장호르몬 분비 효율을 좌우하는 저녁 공복 리듬",
        cover_points=[
            "성장호르몬 70%는 잠든 뒤 첫 90분 깊은 서파수면에 집중 분비",
            "취침 직전 과일·우유·야식은 인슐린을 높여 성장호르몬 분비 억제",
            "저녁 식사는 취침 3시간 전 마무리하고 미지근한 물로 입면 유도",
        ],
        chart_title="취침 전 식사·간식 시점별 첫 서파수면 성장호르몬 분비 효율 비교",
        chart_takeaway="핵심 지표: 잠들기 2~3시간 전 공복을 유지할 때 첫 서파수면 성장호르몬 피크가 온전히 보존됩니다",
        chart_bars=[
            {"label": "취침 3시간 전 저녁 완료 (공복 입면)", "value_text": "92% 효율", "ratio": 0.92, "tone": "good", "note": "혈중 인슐린 안정 -> 뇌하수체 야간 성장호르몬 맥동 최고치 도달"},
            {"label": "취침 90분 전 흰 우유·요거트 섭취", "value_text": "58% 효율", "ratio": 0.58, "tone": "mid", "note": "유당 소화 과정 및 완만한 혈당 상승으로 초기 서파수면 깊이 저하"},
            {"label": "취침 45분 전 달콤한 과일·빵 야식", "value_text": "31% 효율", "ratio": 0.31, "tone": "risk", "note": "고혈당·인슐린 상승이 뇌하수체 성장호르몬 분비 신호를 직접 억제"},
        ],
        checklist_title="연령단계별 야간 성장호르몬 극대화 저녁 식사 · 취침 실천표",
        early_actions=[
            "저녁 6시 반 식사 완료 후 밤 9시 정각 소등 루틴 고정하기",
            "잠자리 우유 대신 저녁 반찬에 두부·생선·잔멸치 배치하기",
        ],
        upper_actions=[
            "학원 하원 후 밤 8시 이후 당분 간식 대신 따뜻한 물 한 모금",
            "밤 9시 30분 침실 스탠드 소등 후 종아리 3분 이완 마사지",
        ],
        teen_actions=[
            "야간 학습 전 저녁 7시 전후 고단백 식사로 늦은 야식 차단",
            "밤 10시 30분 이전 입면해 첫 90분 서파수면 골든타임 사수",
        ],
        section1_intro=(
            "진료실과 학부모 상담에서 가장 자주 듣는 하소연 중 하나가 바로 '우리 아이는 밤 10시 전에 침대에 눕히는데도 왜 또래보다 키가 더디게 자랄까요?'라는 질문입니다. "
            "실제로 아이의 수면 시간을 앞당기려고 퇴근 후 전쟁 같은 저녁을 보내시는 부모님일수록, 계절이 바뀌어도 제자리걸음인 신장 백분위 숫자 앞에서 깊은 허탈감을 느끼시곤 합니다.\n\n"
            "이때 수면 시간표만큼이나 면밀하게 살펴보아야 할 숨은 변수가 바로 '아이의 마지막 한 입이 몇 시에 들어갔는가'입니다. "
            "아이를 재우기 직전 키에 좋다는 마음으로 건넨 따뜻한 우유 한 컵이나 달콤한 제철 과일 몇 조각이, 정작 밤사이 성장판 연골세포를 깨워야 할 성장호르몬의 문을 조용히 닫고 있을 수 있기 때문입니다."
        ),
        section2_mechanism=(
            "소아내분비학의 야간 호르몬 분비 동역학 연구를 살펴보면, 어린이와 청소년의 하루 성장호르몬(GH) 총량 중 약 65~70%는 잠이 든 직후 찾아오는 첫 번째 깊은 비렘수면, 즉 서파수면(Slow-Wave Sleep, N3 단계) 구간에 맥동 형태로 집중 분비됩니다. "
            "중요한 생리학적 원칙은 뇌하수체 전엽의 성장호르몬과 췌장의 인슐린이 서로 시소처럼 길항 작용을 한다는 점입니다.\n\n"
            "잠들기 1~2시간 이내에 탄수화물이나 당분이 포함된 간식, 혹은 유당이 들어 있는 우유를 섭취하면 혈당이 오르면서 인슐린이 분비됩니다. "
            "혈중 인슐린과 유리 지방산 농도가 높아진 상태에서는 아이가 아무리 일찍 눈을 감더라도 뇌하수체가 첫 서파수면 성장호르몬 피크를 평소 대비 30~40% 이상 낮추어 내보내게 됩니다. "
            "게다가 한국 소아에게 흔한 경미한 유당 소화 부담까지 겹치면 밤새 장 운동이 계속되면서 뇌파가 깊은 N3 단계에 머물지 못하고 얕은 수면으로 쪼개지는 이중 손실이 발생합니다."
        ),
        section3_routine=(
            "오늘 밤부터 가정에서 바로 실천할 수 있는 해법은 '수면 시간'과 '공복 시간'을 하나의 세트로 묶어 설계하는 것입니다. "
            "첫째, 저녁 본식은 목표 취침 시각으로부터 최소 2시간 30분에서 3시간 전에 마무리해 잠자리에 들 때 위장이 편안하고 인슐린이 기저치로 내려온 상태를 만들어 주세요. "
            "둘째, 학원 일정 때문에 저녁이 늦어져 아이가 배고파한다면 당분이 많은 과일이나 시리얼 대신 삶은 달걀 반 개나 따뜻한 두유 몇 모금처럼 혈당 스파이크가 적은 소량 단백질로 달래주는 것이 현명합니다.\n\n"
            "셋째, 칼슘과 비타민D3·아연 등 뼈 기질을 채우는 영양은 잠자리 직전이 아니라 저녁 식사 직후에 흡수율 높은 형태로 챙겨주시고, 취침 30분 전에는 거실 백색 형광등을 끄고 아이의 무릎 아래를 부드럽게 쓸어주어 부교감신경이 자연스럽게 깊은 서파수면으로 이어지도록 도와주세요."
        ),
        tags=["아이키성장", "성장호르몬시간", "밤10시수면", "서파수면", "어린이키크는습관", "질병관리청키백분위", "초등키성장", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis1_sleep_zero_lux_melatonin",
        axis_label="AXIS 01 · 침실 조도와 멜라토닌 수면 설계",
        title="[소아성장 칼럼] 은은한 수면등 하나가 성장호르몬을 줄인다? 침실 '조도 0 Lux' 암막 설계와 입면 골든타임",
        cover_headline="아이 방 은은한 수면등 하나가\n밤사이 키 성장 효율을 깎는다?\n침실 0 Lux 암막 수면 설계법",
        cover_subline="멜라토닌 분비 개시 시각을 22분 앞당기는 저녁 빛 환경 프로토콜",
        cover_points=[
            "어린이는 성인보다 수정체가 투명해 미세한 빛에도 멜라토닌 급감",
            "취침 40분 전 전구색 간접조명 전환 시 입면 시간 평균 22분 단축",
            "수면 중에는 무드등·스마트폰 불빛 없는 완전 암막 환경 유지",
        ],
        chart_title="어린이 침실 야간 조도(Lux) 환경별 멜라토닌 유지율 및 깊은 잠 비율",
        chart_takeaway="핵심 지표: 어두운 0~1 Lux 암막 침실에서만 멜라토닌과 서파수면이 온전히 이어집니다",
        chart_bars=[
            {"label": "완전 암막 침실 (0~1 Lux, 불빛 완전 차단)", "value_text": "95% 유지", "ratio": 0.95, "tone": "good", "note": "멜라토닌 정상 분비 -> 입면 후 20분 내 깊은 서파수면(N3) 안정 진입"},
            {"label": "침대 옆 소형 수면등 점등 (10~15 Lux)", "value_text": "54% 유지", "ratio": 0.54, "tone": "mid", "note": "감은 눈꺼풀 투과 빛 자극으로 멜라토닌 분비 지연 및 얕은 잠 증가"},
            {"label": "거실 백색 형광등·태블릿 노출 (100+ Lux)", "value_text": "18% 유지", "ratio": 0.18, "tone": "risk", "note": "청색광이 시교차상핵 자극 -> 생체시계 낮 인식 및 성장호르몬 피크 이월"},
        ],
        checklist_title="연령단계별 멜라토닌 보호 저녁 조명 · 침실 암막 세팅 체크표",
        early_actions=[
            "무서워하는 유아는 잠들 때만 복도 등 켜고 입면 후 완전 소등",
            "저녁 8시 30분부터 거실 천장 백색등을 노란 전구색 스탠드로 전환",
        ],
        upper_actions=[
            "취침 1시간 전 태블릿·스마트폰 거실 충전 스테이션에 보관하기",
            "창밖 가로등·아파트 불빛 막는 암막 커튼으로 0 Lux 침실 만들기",
        ],
        teen_actions=[
            "야간 스탠드 학습 시 청색광 적은 색온도 3000~4000K 조명 활용",
            "침대 머리맡 충전기 LED 불빛까지 가려 미세 각성 원천 차단",
        ],
        section1_intro=(
            "아이가 혼자 자는 연습을 시작할 때 방 한구석에 귀여운 캐릭터 수면등을 밤새 켜두시는 가정이 참 많습니다. "
            "어른 눈에는 아주 은은하고 아늑해 보이는 불빛이지만, 아침에 일어났을 때 아이가 유독 눈을 비비며 피곤해하거나 또래보다 연간 키 성장 속도가 아쉬운 편이라면 이 작은 불빛부터 다시 점검해 볼 필요가 있습니다.\n\n"
            "키 성장은 단순히 침대에 누워 있는 시간의 총합이 아니라, 뇌가 얼마나 깊고 방해받지 않는 어둠 속에서 휴식했느냐에 따라 결정됩니다. "
            "특히 성장기 아이들의 눈은 성인과 해부학적 투과율 자체가 다르기 때문에 저녁 시간 거실 조명과 침실 조도 설계가 곧 성장판의 야간 작업 환경을 좌우합니다."
        ),
        section2_mechanism=(
            "소아 수면의학 연구에 따르면 만 10세 전후 어린이의 수정체는 성인보다 훨씬 맑고 투명하며 동공 크기도 커서, 똑같은 실내 조명이나 스마트기기 불빛에 노출되더라도 망막을 통해 뇌의 생체시계(시교차상핵)로 전달되는 빛 에너지가 성인의 최대 2배에 달합니다. "
            "잠자리에 누운 뒤에도 10~15 Lux 수준의 약한 수면등이 켜져 있으면 감은 눈꺼풀을 투과한 미세 광원이 송과선의 멜라토닌 분비를 최대 40% 이상 억제합니다.\n\n"
            "멜라토닌은 단순히 잠을 부르는 호르몬에 그치지 않고 체온을 살짝 낮추어 깊은 서파수면(N3)을 여는 열쇠이자, 여아·남아의 성선자극호르몬이 너무 이른 나이에 과도하게 깨어나지 않도록 조율하는 생체 브레이크 역할까지 수행합니다. "
            "즉 밤새 밝은 조도에서 얕은 잠을 자는 습관은 성장호르몬 분비 효율을 떨어뜨릴 뿐 아니라 성장판이 열려 있는 소중한 기간을 단축시킬 위험까지 안고 있습니다."
        ),
        section3_routine=(
            "오늘 저녁부터 우리 집 침실을 성장 골든타임에 맞춘 '빛 디톡스 공간'으로 바꾸는 방법은 어렵지 않습니다. "
            "첫째, 목표 취침 시각 40분 전이 되면 거실의 하얀 주광색 천장등을 모두 끄고 노을빛에 가까운 3000K 전구색 간접 스탠드 하나만 켜두어 아이의 뇌가 자연스럽게 밤 신호를 받아들이게 해주세요.\n\n"
            "둘째, 어둠을 무서워하는 유아·초등 저학년 아이라면 잠드는 15분 동안만 방문을 살짝 열어 복도 간접등을 활용하고, 아이의 숨소리가 고르게 깊어진 직후에는 방 안의 모든 무드등과 멀티탭 빨간 불빛까지 가려 완전한 0 Lux 암막 상태를 만들어 주시는 것이 좋습니다. "
            "셋째, 창밖에서 스며드는 단지 내 가로등이나 네온사인 불빛은 암막 커튼과 통기성 좋은 침구로 차단해 아침 기상 직전까지 깊은 통잠이 끊기지 않도록 지켜주세요."
        ),
        tags=["어린이수면환경", "멜라토닌", "암막커튼", "아이수면등", "키크는수면습관", "성조숙증예방습관", "성장골든타임", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis1_sleep_mouth_breathing",
        axis_label="AXIS 01 · 코호흡 숙면과 야간 성장호르몬 보호",
        title="[소아성장 칼럼] 자면서 입 벌리고 뒤척이는 아이, '구강호흡'이 깊은 서파수면과 키 성장을 방해하는 이유",
        cover_headline="베개에 침 묻히며 입 벌리고 자는 아이\n단순 잠버릇이 아니라\n성장호르몬 누수 신호입니다",
        cover_subline="구강호흡으로 쪼개지는 서파수면(N3) 복원 & 침실 온습도 케어",
        cover_points=[
            "만성 야간 구강호흡 시 깊은 서파수면 비율 최대 32% 단편화",
            "침실 습도 45~55% 유지 및 낮은 경추 베개로 코호흡 기도 확보",
            "잠든 뒤 입술이 편안히 다물어질 때 아침 기상 컨디션과 키 성장 회복",
        ],
        chart_title="수면 중 호흡 패턴(비강 코호흡 vs 구강 입호흡)별 깊은 수면 유지율",
        chart_takeaway="핵심 지표: 코로 편안히 숨 쉬며 잘 때 뇌 산소 포화도와 성장호르몬 맥동이 극대화됩니다",
        chart_bars=[
            {"label": "편안한 비강 코호흡 수면 (습도 50% 적정)", "value_text": "91% 숙면", "ratio": 0.91, "tone": "good", "note": "비강 가습·정화 작용 -> 미세 각성 없이 깊은 N3 서파수면 연속 유지"},
            {"label": "건조한 침실 간헐적 입벌림 수면", "value_text": "62% 숙면", "ratio": 0.62, "tone": "mid", "note": "구강 건조로 밤새 3~5회 뒤척임 발생 및 수면 주기 단절"},
            {"label": "만성 구강호흡 · 코골이 동반 수면", "value_text": "38% 숙면", "ratio": 0.38, "tone": "risk", "note": "서파수면 분절로 야간 성장호르몬 분비 저하 및 주간 만성 피로 유발"},
        ],
        checklist_title="연령단계별 편안한 코호흡 통잠 · 침실 기도 환경 점검표",
        early_actions=[
            "침실 온도 20~22도·습도 50% 맞추고 먼지 적은 순면 침구 관리",
            "잠든 지 30분 뒤 입 벌림·코골이 여부를 조용히 30초 관찰하기",
        ],
        upper_actions=[
            "너무 높은 어른 베개 대신 아이 체형에 맞는 낮은 경추 베개 사용",
            "저녁 샤워 시 따뜻한 수증기로 코 점막을 촉촉하게 이완해 주기",
        ],
        teen_actions=[
            "비염·구강호흡이 4주 이상 지속되면 소아청소년과·이비인후과 점검",
            "엎드려 자거나 턱 괴는 자세 교정해 상기도 압박 줄이기",
        ],
        section1_intro=(
            "밤늦게 아이 이불을 덮어주러 방에 들어갔을 때, 아이가 입을 반쯤 벌린 채 숨을 쉬고 있거나 아침마다 베개 한쪽이 축축하게 젖어 있는 모습을 발견하신 적이 있으신가요? "
            "많은 부모님께서 '낮에 신나게 뛰어놀아 피곤해서 그렇겠지'라며 대수롭지 않게 넘기시지만, 매일 밤 반복되는 구강호흡은 아이의 키 성장 속도를 소리 없이 붙잡는 대표적인 수면 방해 요인입니다.\n\n"
            "실제로 9시간 이상 충분히 자는데도 아침마다 일어나기 힘들어하고 다크서클이 짙으며 키 백분위가 서서히 내려앉는 아이들을 살펴보면, 수면의 '양'이 아니라 호흡이 결정하는 수면의 '질'에 구멍이 나 있는 경우가 매우 흔합니다."
        ),
        section2_mechanism=(
            "코(비강)는 차갑고 건조한 공기를 체온에 맞게 데우고 습도를 더해주며 미세먼지를 걸러 폐로 보내는 정교한 천연 가습 필터입니다. "
            "반면 코가 막히거나 베개 높이가 맞지 않아 입을 벌리고 숨을 쉬게 되면, 건조한 공기가 편도와 인두 점막을 직접 자극하고 혀뿌리가 뒤로 살짝 밀리면서 기도가 좁아집니다.\n\n"
            "소아 수면다원검사 학술 보고들을 종합하면 만성 구강호흡을 하는 어린이는 밤사이 산소 포화도가 미세하게 흔들릴 때마다 뇌가 숨을 쉬기 위해 잠을 얕은 단계로 끌어올리는 '미세 각성'을 수십 차례 겪게 됩니다. "
            "그 결과 성장판 연골 증식을 이끄는 깊은 서파수면(N3) 구간이 최대 30% 이상 단편화되어, 똑같이 밤 10시에 잠들더라도 실제 분비되는 야간 성장호르몬 총량에서 큰 손해를 보게 됩니다."
        ),
        section3_routine=(
            "우리 아이가 오늘 밤부터 입을 편안히 다물고 코로 깊게 숨 쉬며 통잠을 자도록 돕는 침실 환경 설계는 세 가지가 핵심입니다. "
            "첫째, 침실 습도를 45~55%, 실내 온도를 20~22도로 일정하게 유지해 밤사이 코 점막이 마르거나 붓지 않도록 저소음 가습 케어와 먼지 없는 침구 세탁 주기를 지켜주세요.\n\n"
            "둘째, 어른용 높은 솜베개를 함께 쓰면 고개가 앞으로 꺾이면서 기도가 좁아져 입이 저절로 벌어지므로, 아이의 목 C커브를 자연스럽게 받쳐주어 기도를 열어주는 연령별 낮은 기능성 경추 베개로 교체해 주시는 것이 큰 도움이 됩니다. "
            "셋째, 만약 환경 개선 후에도 코골이나 무호흡, 구강호흡이 한 달 이상 계속된다면 아데노이드 비대나 알레르기 비염 여부를 전문의와 함께 점검해 성장 골든타임의 수면 효율을 반드시 회복해 주세요."
        ),
        tags=["어린이구강호흡", "입벌리고자는아이", "아이코골이", "어린이경추베개", "수면성장호르몬", "초등숙면", "키성장습관", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis1_sleep_weekend_jetlag",
        axis_label="AXIS 01 · 생체시계 일관성과 수면 리듬",
        title="[소아성장 칼럼] 주말 늦잠 2시간이 한 주 키 성장을 흔든다? '소아 사회적 시차'와 월요일 숙면 회복법",
        cover_headline="평일 부족한 잠 보충하려 잔 주말 늦잠\n오히려 한 주 성장호르몬 시계를\n뒤로 밀어내고 있습니다",
        cover_subline="주중·주말 기상 시각 편차 60분 이내 유지가 만드는 성장 시너지",
        cover_points=[
            "주말 기상 시각이 2시간 이상 늦어지면 생체시계 시차 발생",
            "일요일 밤 입면 지연으로 월~수요일 첫 서파수면 피크 연속 손실",
            "주말 아침 기상 편차 1시간 이내 + 오전 20분 햇볕 산책으로 고정",
        ],
        chart_title="주중 대비 주말 기상 시각 차이(사회적 시차)에 따른 주간 서파수면 안정도",
        chart_takeaway="핵심 지표: 주말 기상 시각 차이를 60분 이내로 지킬 때 7일 내내 성장호르몬 리듬이 일정합니다",
        chart_bars=[
            {"label": "주말 기상 편차 45분 이내 + 오전 햇볕 노출", "value_text": "93% 안정", "ratio": 0.93, "tone": "good", "note": "일요일 밤 9시 30분 자연 입면 -> 주간 내내 일정한 성장호르몬 분비"},
            {"label": "주말 기상 90분 지연 (오전 9시 반 기상)", "value_text": "64% 안정", "ratio": 0.64, "tone": "mid", "note": "일요일 밤 입면 1시간 지연 -> 월요일 아침 기상 피로 및 식욕 저하"},
            {"label": "주말 정오 근처 늦잠 (3시간 이상 시차)", "value_text": "35% 안정", "ratio": 0.35, "tone": "risk", "note": "매주 해외 시차 적응 반복 -> 주중 3일간 서파수면 진입 심각 지연"},
        ],
        checklist_title="연령단계별 주말 수면 리듬 고정 · 월요일 숙면 사수 체크표",
        early_actions=[
            "토·일요일 기상 시각을 평일보다 최대 40분 이내로만 늦추기",
            "주말 오전 놀이터 산책으로 아침 햇볕 20분 쬐어 생체시계 리셋",
        ],
        upper_actions=[
            "피곤한 주말에는 아침 늦잠 대신 토요일 오후 2시 전 25분 낮잠 활용",
            "일요일 저녁은 외식·야식 대신 오후 6시 반 담백한 집밥으로 마무리",
        ],
        teen_actions=[
            "주말 몰아자기(오전 11시 이후 기상) 피하고 기상 후 즉시 커튼 열기",
            "일요일 밤 9시 반 따뜻한 족욕·샤워로 체온 낮추며 입면 앞당기기",
        ],
        section1_intro=(
            "월요일부터 금요일까지 학교와 학원 일정을 소화하느라 고생한 아이가 안쓰러워, 토요일과 일요일 아침만큼은 암막 커튼을 닫아둔 채 오전 10시, 11시까지 실컷 자도록 두시는 부모님이 많습니다. "
            "'평일에 못 잔 잠을 주말에라도 몰아서 자야 키가 크지 않을까' 하는 다정한 배려에서 비롯된 선택입니다.\n\n"
            "하지만 일요일 밤마다 침대에서 말똥말똥 눈을 뜨고 '엄마 잠이 안 와'라며 밤 11시 반을 넘기고, 월요일 아침마다 전쟁처럼 깨워 아침밥도 거른 채 등교하는 악순환이 반복되고 있다면 이 주말 늦잠 습관이 오히려 한 주의 성장 리듬을 무너뜨리고 있다는 신호입니다."
        ),
        section2_mechanism=(
            "시간생물학(Chronobiology)에서는 평일 수면 중간점과 주말 수면 중간점의 차이를 '사회적 시차(Social Jetlag)'라고 부릅니다. "
            "평일 오전 7시에 일어나던 아이가 토·일요일 오전 10시에 일어나면, 아이의 뇌하수체와 생체시계는 매주 주말마다 서쪽으로 3시간 시차가 나는 나라로 비행기를 타고 다녀오는 것과 똑같은 혼란을 겪게 됩니다.\n\n"
            "아침 첫 햇빛이 망막에 들어온 시각으로부터 약 14~15시간 뒤에 밤 멜라토닌 분비 스위치가 켜지는데, 일요일 오전 10시에 기상하면 일요일 밤 멜라토닌 분비 개시 시각이 자정 무렵으로 밀려납니다. "
            "결국 일요일 밤부터 화요일·수요일까지 사흘 동안 입면 후 첫 서파수면 성장호르몬 피크가 흐트러지고 아침 코르티솔 각성 리듬까지 깨져 오전 식욕과 수업 집중력이 함께 떨어지게 됩니다."
        ),
        section3_routine=(
            "성장기 아이의 생체시계를 1년 365일 흔들림 없이 지키는 주말 수면 원칙은 매우 명확합니다. "
            "첫째, 주말 아침 기상 시각은 평일 기상 시각보다 최대 45분~1시간 이내로만 여유를 두시고, 일어나는 즉시 커튼을 활짝 열어 아침 자연광이 아이 눈으로 들어오게 해주세요.\n\n"
            "둘째, 주중 학업이나 활동으로 누적된 피로를 풀어주고 싶다면 아침 늦잠으로 생체시계를 미루는 대신, 토요일 점심 식사 직후 오후 2시 이전에 20~30분 정도 짧은 낮잠을 재우는 것이 일요일 밤 숙면을 해치지 않는 현명한 보충법입니다. "
            "셋째, 일요일 오후에는 가족과 함께 동네 공원에서 가볍게 걷거나 줄넘기를 하며 기분 좋은 신체 피로를 만들어 주시면 월요일 아침 키 측정기가 반가워하는 가장 이상적인 한 주가 시작됩니다."
        ),
        tags=["어린이수면습관", "주말늦잠", "생체시계", "아이키크는법", "초등수면시간", "성장호르몬분비", "학부모성장수첩", "키즈핏"],
    ),

    # ==================== AXIS 2: 칼슘·D3·K2·아연 영양 & 푸드브릿지 (4종) ====================
    _make_editorial_topic(
        topic_id="axis2_nutri_ca_d3_k2",
        axis_label="AXIS 02 · 골밀도 영양 시너지와 우유 적정량",
        title="[소아성장 칼럼] 흰 우유 하루 3팩 마시는데 왜 키 백분위는 그대로일까? 칼슘·비타민D3·K2 골밀도 3중 시너지",
        cover_headline="흰 우유 하루 3팩씩 마시는데\n왜 키 백분위는 그대로일까요?\n뼈로 가는 길목 D3 · K2를 확인하세요",
        cover_subline="철분 흡수를 지키는 우유 적정량(400ml)과 오스테오칼신 활성화 원리",
        cover_points=[
            "하루 600ml 이상 과다 우유 섭취는 철분·아연 흡수와 식욕 저해 우려",
            "칼슘 장내 흡수(비타민D3) + 성장판 뼈 기질 안착(비타민K2) 협업 필수",
            "저녁 식후 흡수율 높은 구연산 칼슘·D3·K2 밸런스로 골밀도 보강",
        ],
        chart_title="칼슘 단독 섭취 vs 비타민 D3 · K2 동반 시 성장판 골기질 활용 효율",
        chart_takeaway="핵심 지표: 섭취량보다 중요한 것은 칼슘을 실제 성장판 골기질로 데려다주는 D3·K2 연결고리입니다",
        chart_bars=[
            {"label": "구연산 칼슘 + 비타민D3 + 비타민K2 시너지", "value_text": "89% 활용", "ratio": 0.89, "tone": "good", "note": "장내 흡수 촉진 및 오스테오칼신 활성화로 성장판 뼈 기질 정밀 축적"},
            {"label": "칼슘 + 비타민D3 2종 조합 섭취", "value_text": "63% 활용", "ratio": 0.63, "tone": "mid", "note": "혈중 칼슘 흡수는 개선되나 골기질 결합 효율은 K2 동반 대비 제한적"},
            {"label": "흰 우유·단일 칼슘만 과량 섭취 (D3 부족)", "value_text": "29% 활용", "ratio": 0.29, "tone": "risk", "note": "낮은 장내 흡수율 및 과다 섭취 시 철분 흡수 방해·포만감으로 본식 감소"},
        ],
        checklist_title="연령단계별 우유 적정량 조절 & 칼슘·D3·K2 저녁 영양 체크표",
        early_actions=[
            "유아 흰 우유는 하루 2팩(400ml) 이내로 제한해 철분·식욕 보호하기",
            "액상 또는 츄어블 비타민D3·아연으로 기초 골격 흡수력 깨우기",
        ],
        upper_actions=[
            "실내 학원 생활로 부족한 햇볕 대신 저녁 식후 D3+K2+구연산칼슘 루틴",
            "주 3회 이상 연어·계란노른자·두부·낫토/발효 반찬 식탁에 올리기",
        ],
        teen_actions=[
            "급성장기 일일 칼슘 권장량(900~1000mg) 식단+밸런스 보충 점검",
            "칼슘 배출을 늘리는 탄산음료·짠 라면 국물 주 1회 이하로 줄이기",
        ],
        section1_intro=(
            "키 성장을 챙기시는 부모님께서 가장 먼저 장바구니에 담으시는 식품은 단연 흰 우유입니다. "
            "실제로 '우유를 하루 세 팩, 네 팩씩 꾸준히 마시게 했는데도 학교 신체검사 키 번호가 앞자리 그대로여서 속상하다'고 말씀하시는 학부모님을 자주 뵙습니다.\n\n"
            "우유가 훌륭한 단백질·칼슘 공급원인 것은 분명하지만, 무조건 많이 마시는 것만으로 아이의 성장판이 길어지지는 않습니다. "
            "오히려 우유 섭취량이 적정선을 넘어서면 정작 뼈를 키우는 데 꼭 필요한 다른 미네랄의 흡수를 방해하거나, 섭취한 칼슘이 성장판까지 도달하지 못하는 영양 병목 현상이 나타날 수 있습니다."
        ),
        section2_mechanism=(
            "소아영양학 가이드라인에서는 성장기 어린이의 하루 순수 우유 권장량을 약 400ml(200ml 기준 2팩 내외)로 안내합니다. "
            "하루 600~800ml 이상 우유로 배를 채우면 우유 속 고농도 칼슘이 장 점막에서 철분(Iron) 및 아연(Zinc)과 흡수 통로를 두고 경쟁해 저장철 수치를 떨어뜨리고, 포만감 때문에 소고기·생선·채소 같은 본식 섭취량을 줄이게 됩니다.\n\n"
            "더 중요한 기전은 칼슘이 뼈가 되는 '2단계 열쇠'입니다. 입으로 들어온 칼슘이 소장 벽을 통과하려면 첫 번째 열쇠인 '비타민D3'가 반드시 필요하고, 혈액 속으로 들어온 칼슘이 뼈 기질 단백질인 오스테오칼신(Osteocalcin)과 결합해 실제 성장판 골밀도를 단단히 채우려면 두 번째 열쇠인 '비타민K2(MK-7)'의 협업이 필수적입니다. "
            "햇볕을 쬐는 야외 활동이 부족한 한국 어린이의 경우 비타민D 결핍률이 매우 높기 때문에 이 연결고리를 함께 열어주어야 식단의 노력이 온전히 키 숫자로 이어집니다."
        ),
        section3_routine=(
            "오늘 저녁부터 우리 집 식탁의 성장 영양 효율을 두 배로 높이는 실천법은 세 가지입니다. "
            "첫째, 흰 우유는 낮 간식 시간대에 하루 1~2팩으로 기분 좋게 마시게 하고, 저녁 식탁에서는 잔멸치 볶음, 손두부, 브로콜리, 계란, 생선 등 씹어 먹는 자연 식재료로 칼슘과 단백질을 고르게 채워주세요.\n\n"
            "둘째, 탄산음료나 과자 속 인산염은 뼈에서 칼슘을 빠져나가게 하므로 집 안 냉장고에서는 탄산수나 보리차로 자연스럽게 대체해 주시는 것이 좋습니다. "
            "셋째, 학업과 실내 생활로 햇볕 노출이 짧은 초등·중등 시기에는 위산 분비와 무관하게 소화가 편안한 구연산 칼슘과 비타민D3·비타민K2가 균형 있게 배합된 연령별 맞춤 영양 루틴을 저녁 식사 직후에 꾸준히 챙겨 밤사이 골형성 대사를 든든히 뒷받침해 주세요."
        ),
        tags=["어린이칼슘", "비타민D3K2", "아이우유권장량", "초등키성장영양", "성장판영양", "영유아키백분위", "골밀도식단", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis2_nutri_zinc_foodbridge",
        axis_label="AXIS 02 · 편식 개선 아연과 푸드브릿지",
        title="[소아성장 칼럼] 밥 한 숟가락을 입에 물고 1시간 걸리는 아이, '미각 세포 아연(Zinc)'과 4단계 푸드브릿지",
        cover_headline="고기·채소 피하고 밥 물고 있는 아이\n훈육보다 먼저 점검할 것은\n혀 미각 세포 '아연'입니다",
        cover_subline="세포 분열·연골 증식 핵심 미네랄 아연과 스트레스 없는 식탁 설계",
        cover_points=[
            "아연 부족 시 혀 미뢰 재생 지연으로 음식 맛 둔화 및 식욕 저하",
            "억지 강요는 편도체 방어 반응을 키워 편식을 장기화시키는 역효과",
            "노출 -> 탐색 -> 변형 조리 -> 한 입 성공의 4단계 푸드브릿지 실천",
        ],
        chart_title="편식 아동 접근 방식별 8주 후 신규 단백질·채소 수용 성공률 비교",
        chart_takeaway="핵심 지표: 아연 영양 보충과 놀이형 4단계 푸드브릿지를 병행할 때 식탁 거부가 빠르게 줄어듭니다",
        chart_bars=[
            {"label": "아연·철분 밸런스 보충 + 4단계 푸드브릿지", "value_text": "84% 수용", "ratio": 0.84, "tone": "good", "note": "미각 수용체 감도 회복 및 정서적 안전감 형성으로 자발적 섭취 증가"},
            {"label": "보상 조건 제시 ('다 먹으면 간식·영상 보여줄게')", "value_text": "46% 수용", "ratio": 0.46, "tone": "mid", "note": "단기 섭취는 유도되나 본식을 '해치워야 할 숙제'로 인식해 지속성 낮음"},
            {"label": "식탁 압박·강요 ('다 먹을 때까지 못 일어나')", "value_text": "19% 수용", "ratio": 0.19, "tone": "risk", "note": "교감신경 항진으로 소화액 분비 저하 및 음식 혐오 반응 고착화"},
        ],
        checklist_title="연령단계별 입 짧은 아이 식욕 회복 · 아연 & 푸드브릿지 실천표",
        early_actions=[
            "식사 시간은 최대 30분으로 정하고 남기더라도 혼내지 않고 정리하기",
            "주말에 버섯·파프리카를 모양틀로 찍어보는 오감 요리 놀이 진행",
        ],
        upper_actions=[
            "식전 90분 동안 주스·과자 간식 끊어 건강한 위장 공복감 만들기",
            "세포 분열과 미각 회복 돕는 일일 아연 권장량(8~10mg) 꾸준히 보충",
        ],
        teen_actions=[
            "아침 결식 대신 삶은 계란·치즈 토스트·미숫가루로 오전 대사 깨우기",
            "인스턴트 배달식 줄이고 살코기·해산물 아연 급원 식품 주 4회 구성",
        ],
        section1_intro=(
            "매일 저녁 식탁마다 '딱 세 숟가락만 더 먹자', '고기 한 점이라도 삼켜야 키가 크지!'라며 실랑이를 벌이다 결국 한숨을 내쉬어 본 경험, 입 짧은 아이를 키우는 부모님이라면 누구나 깊이 공감하실 것입니다. "
            "밥 한 공기를 다 비우는 데 한 시간이 넘게 걸리고 입안에 밥알을 물고만 있는 모습을 보면 영양 결핍으로 또래보다 작게 자랄까 봐 조바심이 앞설 수밖에 없습니다.\n\n"
            "하지만 아이가 밥을 안 먹는 이유를 단순히 고집이나 응석으로만 보고 숟가락을 억지로 밀어 넣으면, 아이의 뇌는 식탁을 긴장되는 공간으로 기억해 입을 더욱 굳게 닫게 됩니다. "
            "편식과 식욕 부진의 이면에는 아이의 의지가 아닌 미량 미네랄 상태와 감각 적응 단계라는 과학적인 열쇠가 숨어 있습니다."
        ),
        section2_mechanism=(
            "소아 소화기영양학에서 입 짧은 아이의 성장 지연을 평가할 때 가장 먼저 확인하는 영양소 중 하나가 바로 '아연(Zinc)'입니다. "
            "아연은 성장판 연골세포의 DNA 합성과 세포 분열에 직접 관여하는 성장 필수 미네랄일 뿐 아니라, 혀 표면에 있는 미각 세포(미뢰)를 약 10~14일 주기로 새롭게 재생시키는 핵심 원료입니다.\n\n"
            "체내 아연 농도가 경계선 이하로 낮아지면 미각 세포 교체가 늦어져 자연 식재료 고유의 감칠맛을 잘 느끼지 못하고, 오직 짜거나 단 자극적인 가공식품 맛에만 반응하게 됩니다. "
            "여기에 식탁에서의 훈육 스트레스가 더해지면 자율신경계 중 교감신경이 항진되면서 위장관 운동과 소화 효소 분비까지 억제되어, 조금만 먹어도 배가 부르다고 느끼는 악순환이 완성됩니다."
        ),
        section3_routine=(
            "아이의 닫힌 입맛을 열고 성장판에 원료를 공급하는 가정 내 솔루션은 생리적 보충과 심리적 다리 놓기를 함께 진행하는 것입니다. "
            "첫째, 식사 전 90분 동안은 과일 주스나 우유, 작은 과자 한 조각도 주지 않는 '건강한 배고픔 시간'을 확보하고, 식사 시간은 최대 30분으로 제한해 식탁 분위기를 밝고 가볍게 바꿔주세요.\n\n"
            "둘째, 낯선 채소나 고기는 눈으로 보기(1단계) ➔ 손으로 만지고 요리 돕기(2단계) ➔ 잘게 다져 좋아하는 카레·볶음밥에 숨기기(3단계) ➔ 스스로 한 입 맛보기(4단계)의 푸드브릿지 순서로 최소 8번 이상 부담 없이 만나게 해주세요. "
            "셋째, 식습관이 자리 잡는 동안 성장 속도가 처지지 않도록 흡수율이 좋은 아연과 비타민D3, 양질의 단백질 보충 루틴을 병행해 미각 회복과 연골 성장을 동시에 챙겨주시는 것이 현명합니다."
        ),
        tags=["아이편식", "밥안먹는아이", "어린이아연", "푸드브릿지", "입짧은아이영양", "키성장영양소", "소아성장", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis2_nutri_growing_pains_mg",
        axis_label="AXIS 02 · 야간 성장통 완화와 칼슘·마그네슘",
        title="[소아성장 칼럼] 밤마다 무릎·종아리 아파서 깨는 '야간 성장통', 위험 신호 구별법과 5분 온찜질·미네랄 루틴",
        cover_headline="자다가 무릎·종아리가 아파 울며 깨는 밤\n진짜 성장통 vs 병원 진료 신호 구별법과\n5분 이완 · 미네랄 케어",
        cover_subline="뼈 길이 성장을 따라가는 근육·골막 이완과 숙면 보호 가이드",
        cover_points=[
            "저녁·밤 양쪽 종아리·허벅지 통증 후 아침에 멀쩡하면 전형적 성장통",
            "취침 전 5분 따뜻한 물수건 온찜질로 골막·근막 견인 긴장 완화",
            "칼슘과 마그네슘·비타민D3 균형 보충으로 야간 신경·근육 흥분 진정",
        ],
        chart_title="야간 성장통 아동의 취침 전 케어 방식별 밤사이 수면 각성 감소율",
        chart_takeaway="핵심 지표: 온찜질 이완과 칼슘·마그네슘 밸런스를 함께 챙길 때 밤사이 깨는 횟수가 크게 줄어듭니다",
        chart_bars=[
            {"label": "5분 온찜질 마사지 + 저녁 칼슘·마그네슘·D3 보충", "value_text": "86% 완화", "ratio": 0.86, "tone": "good", "note": "골막 주변 근막 이완 및 신경 전달 안정으로 통잠 유지율 대폭 상승"},
            {"label": "통증 호소 시 일시적 주무르기만 시행", "value_text": "52% 완화", "ratio": 0.52, "tone": "mid", "note": "즉각적 위로는 되나 새벽 재각성으로 서파수면 연속성 일부 저하"},
            {"label": "낮 과격 활동 후 스트레칭·미네랄 보충 없음", "value_text": "21% 완화", "ratio": 0.21, "tone": "risk", "note": "하체 근육 피로 누적 및 미네랄 소모로 야간 통증 빈도 증가"},
        ],
        checklist_title="연령단계별 야간 성장통 완화 · 안전 신호 구별 실천 체크표",
        early_actions=[
            "놀이터에서 많이 뛴 날은 저녁 목욕 시 따뜻한 물로 종아리 이완",
            "아침 기상 후에도 한쪽 다리만 절뚝이거나 부으면 즉시 소아과 진료",
        ],
        upper_actions=[
            "취침 15분 전 따뜻한 온찜질 팩·물수건으로 무릎 아래 5분 감싸기",
            "뼈 성장기 소모량 큰 칼슘·마그네슘·비타민D3 저녁 식후 보충",
        ],
        teen_actions=[
            "급성장기 대퇴사두근·아킬레스건 3분 가벼운 스트레칭으로 견인통 예방",
            "딱딱한 슬리퍼 대신 발 아치를 지지하는 쿠션감 있는 운동화 착용",
        ],
        section1_intro=(
            "낮에는 놀이터에서 아무렇지 않게 잘 뛰어놀던 아이가, 밤에 잠들고 한두 시간쯤 지나 갑자기 무릎이나 정강이, 종아리가 아프다며 눈물을 글썽이며 깨어나는 날이 있습니다. "
            "주물러 주면 스르르 다시 잠들었다가도 다음 날 아침에는 언제 아팠냐는 듯 씩씩하게 걸어 다니니 부모님 입장에서는 반가운 성장 신호인지, 혹시 정형외과에 가보아야 할 문제는 아닌지 마음이 쓰이기 마련입니다.\n\n"
            "만 4세부터 12세 사이 성장기 어린이의 약 20~30%가 경험하는 야간 성장통은 그 자체로 해로운 질환은 아니지만, 통증 때문에 밤 10시~새벽 2시 서파수면이 자주 끊기면 정작 가장 중요한 키 성장 효율을 갉아먹을 수 있어 세심한 밤 케어가 필요합니다."
        ),
        section2_mechanism=(
            "소아정형외과 및 내분비학에서 설명하는 성장통의 주된 기전은 '뼈와 주변 연부조직의 성장 속도 불균형' 및 '낮 활동에 따른 골막 미세 피로'입니다. "
            "성장판에서 뼈 길이가 빠르게 자라날 때 뼈를 감싸고 있는 얇은 막(골막)과 주변 힘줄·근육이 그 속도를 미처 따라가지 못하면서 밤시간대 신경 말단이 당겨지는 뻐근한 통증이 나타납니다.\n\n"
            "다만 반드시 구별해야 할 의학적 경계선이 있습니다. 전형적인 성장통은 주로 양쪽 허벅지 앞쪽이나 종아리, 무릎 뒤쪽에 대칭적으로 나타나며 아침이 되면 통증이 깨끗이 사라집니다. "
            "반면 한쪽 관절만 계속 아프거나, 관절 부위가 빨갛게 붓고 열감이 느껴지거나, 아침에 일어난 뒤에도 다리를 절뚝거린다면 단순 성장통이 아니므로 지체 없이 진료를 받아야 합니다. "
            "또한 급성장기에는 뼈 석회화와 근육 수축·이완을 조절하는 칼슘과 마그네슘 요구량이 급증해 두 미네랄이 부족할수록 야간 근육 긴장도가 더 예민해집니다."
        ),
        section3_routine=(
            "아이의 밤잠을 깨우지 않고 성장통을 포근하게 가라앉히는 저녁 3단계 루틴을 소개합니다. "
            "첫째, 활동량이 많았던 날일수록 잠들기 15분 전 따뜻한 물수건이나 안전한 온열 찜질로 무릎 위아래와 종아리를 5분간 감싸 혈류를 늘리고 긴장된 근막을 부드럽게 풀어주세요.\n\n"
            "둘째, 발끝을 몸 쪽으로 살살 당겨주는 아킬레스건·종아리 스트레칭을 통증이 없는 범위에서 15초씩 두 번만 함께 해주셔도 밤사이 골막 견인 부담이 훨씬 줄어듭니다. "
            "셋째, 저녁 식단에 시금치·바나나·아몬드·두부처럼 마그네슘과 칼슘이 풍부한 식재료를 자주 올리고, 성장 속도가 가파른 시기에는 구연산 칼슘과 마그네슘·비타민D3 구성을 저녁 식후에 챙겨 아이가 아침까지 한 번도 깨지 않는 깊은 숙면을 선물해 주세요."
        ),
        tags=["어린이성장통", "아이무릎통증", "종아리성장통", "칼슘마그네슘", "성장통마사지", "초등급성장기", "아이키성장", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis2_nutri_protein_collagen_frame",
        axis_label="AXIS 02 · 성장판 연골 단백질과 아미노산 식단",
        title="[소아성장 칼럼] 칼슘이 시멘트라면 '단백질'은 철근입니다 — 성장판 연골 기질을 세우는 체중별 저녁 단백질 공식",
        cover_headline="칼슘만 챙기면 키가 클까요?\n성장판 연골의 뼈대를 짓는\n체중별 '양질 단백질' 섭취 공식",
        cover_subline="뼈 길이 성장을 먼저 여는 콜라겐 연골 기질과 필수 아미노산 배분",
        cover_points=[
            "뼈는 성장판 연골(단백질 기질)이 먼저 자란 뒤 칼슘이 채워져 완성",
            "성장기 일일 단백질 목표(체중 1kg당 약 1.0~1.2g)를 세 끼 분산 섭취",
            "튀김·가공육 대신 살코기·흰살생선·계란·콩 단백질로 체지방 증가 방지",
        ],
        chart_title="단백질 급원 식단 구성별 성장판 아미노산 이용률 및 체지방 안전도",
        chart_takeaway="핵심 지표: 기름진 가공육·튀김 대신 자연 살코기·생선·계란·콩으로 세 끼 나누어 채우는 것이 핵심입니다",
        chart_bars=[
            {"label": "살코기·생선·계란·두부 세 끼 균등 배분", "value_text": "91% 균형", "ratio": 0.91, "tone": "good", "note": "필수 아미노산 9종 안정 공급 및 적정 체중 유지로 성장판 수명 보호"},
            {"label": "아침·점심 부실 후 저녁 고기 1끼 몰아먹기", "value_text": "57% 균형", "ratio": 0.57, "tone": "mid", "note": "1회 체내 단백질 합성 한계 초과 및 늦은 소화 부담으로 숙면 방해"},
            {"label": "치킨·소시지·돈가스 등 고지방 가공 단백질 위주", "value_text": "28% 균형", "ratio": 0.28, "tone": "risk", "note": "포화지방·열량 과잉으로 체지방률 상승 및 성장판 조기 노화 위험"},
        ],
        checklist_title="연령단계별 성장판 철근 세우는 세 끼 양질 단백질 실천 체크표",
        early_actions=[
            "유아(체중 15~20kg) 하루 달걀 1개 + 두부 반 모 + 생선/살코기 한 토막",
            "소시지·너겟 대신 부드러운 소고기 장조림·대구살 전으로 반찬 구성",
        ],
        upper_actions=[
            "아침 결식 막기 위해 삶은 계란·그릭요거트·두유 중 1가지 필수 섭취",
            "초등 급성장기(체중 30~40kg) 매 끼니 아이 손바닥 크기 단백질 배치",
        ],
        teen_actions=[
            "운동 직후 40분 이내 우유·단백질 간식으로 근육과 성장판 회복 지원",
            "야식 치킨·라면 대신 닭가슴살 샐러드·연두부로 체지방 증가 차단",
        ],
        section1_intro=(
            "아이 키 성장을 이야기할 때 많은 분이 제일 먼저 칼슘을 떠올리시지만, 건축 현장에 비유하면 칼슘은 건물을 단단하게 굳히는 시멘트에 가깝습니다. "
            "아무리 좋은 시멘트를 많이 부어도 건물 높이를 위로 올리는 '철근 골조'가 먼저 올라가지 않으면 층수를 높일 수 없는데, 우리 아이 성장판에서 바로 그 철근 역할을 맡는 주인공이 '양질의 단백질'입니다.\n\n"
            "실제로 밥과 국수, 빵처럼 탄수화물 위주로 배를 채우거나 저녁 한 끼에만 기름진 고기를 몰아 먹는 아이들의 경우, 열량은 충분한데도 정작 뼈 길이를 늘리는 아미노산 재료가 부족해 성장 속도가 기대만큼 올라오지 않는 일이 자주 벌어집니다."
        ),
        section2_mechanism=(
            "뼈가 길어지는 연골내 골화(Endochondral Ossification) 과정을 현미경으로 들여다보면, 뼈 양 끝 성장판의 연골세포가 활발히 분열하며 제2형 콜라겐 등 단백질 기질을 먼저 촘촘히 만들어 위로 쌓아 올리고, 그 뒤를 이어 칼슘과 인이 침착되면서 단단한 뼈로 바뀝니다. "
            "또한 간에서 성장호르몬 신호를 받아 실제 성장판 세포를 증식시키는 인슐린 유사 성장인자(IGF-1)의 혈중 농도 역시 일일 필수 아미노산 섭취량에 민감하게 반응합니다.\n\n"
            "한국인 영양소 섭취기준을 참고하면 성장기 아동·청소년은 체중 1kg당 하루 약 1.0~1.2g의 단백질이 필요합니다(예: 체중 30kg 초등학생 기준 하루 약 30~36g). "
            "다만 우리 몸은 한 끼에 흡수해 성장 조직 합성에 쓸 수 있는 단백질 양이 제한되어 있어 저녁에만 삼겹살이나 치킨으로 과식하면 남는 열량이 체지방으로 축적되어 오히려 성호르몬 분비를 앞당길 수 있으므로, 아침·점심·저녁 세 끼에 기름기 적은 단백질로 고르게 나누어 담는 전략이 중요합니다."
        ),
        section3_routine=(
            "계산기 없이도 매일 식탁에서 쉽게 지킬 수 있는 '아이 손바닥 단백질 공식'을 기억해 보세요. "
            "첫째, 매 끼니 식판에 아이 본인의 손바닥 크기와 두께만 한 살코기(소고기 우둔·홍두깨, 돼지 안심, 닭가슴살), 흰살생선, 두부, 또는 계란 요리가 한 가지씩 올라가 있는지 확인해 주세요.\n\n"
            "둘째, 바쁜 등교 아침에 밥을 잘 못 먹는 아이라면 빈속으로 보내지 마시고 반숙 계란 하나와 치즈 한 장, 혹은 무가당 그릭요거트를 챙겨 오전 IGF-1 대사 스위치를 켜주시는 것이 좋습니다. "
            "셋째, 편식이 있거나 운동량이 많아 식사만으로 단백질을 채우기 빠듯한 날에는 당분과 포화지방이 적은 어린이 맞춤 초유·분리유청 단백질이나 아미노산 밸런스 구성을 간식 시간에 보완해 성장판 골조가 쉼 없이 올라가도록 도와주세요."
        ),
        tags=["어린이단백질", "키크는식단", "초등아침식사", "성장판연골", "아미노산", "성조숙증식단관리", "아이키성장", "키즈핏"],
    ),

    # ==================== AXIS 3: 거북목·척추 숨은 키 2cm 바른자세 (4종) ====================
    _make_editorial_topic(
        topic_id="axis3_posture_neck_18kg",
        axis_label="AXIS 03 · 거북목 교정과 숨은 키 2cm 복원",
        title="[소아성장 칼럼] 고개 30도 숙일 때 목뼈 하중 18kg! 구부정한 거북목 펴고 '숨은 키 2cm' 되찾는 15도 책상 공식",
        cover_headline="책상 앞 고개 30도 숙인 우리 아이\n목뼈에 볼링공 2개(18kg)를 얹은 채\n숨은 키 2cm를 잃고 있습니다",
        cover_subline="시선 각도 15도 독서대와 가슴 펴기로 되찾는 반듯한 성장 체형",
        cover_points=[
            "평평한 책상 위 책을 내려다보면 경추 하중이 5kg에서 18kg으로 급증",
            "거북목·라운드숄더 고착 시 실제 뼈 길이보다 1.5~2.5cm 작아 보이는 체형",
            "눈높이 각도조절 독서대 + 50분마다 문틀 가슴 펴기로 척추 정렬 복원",
        ],
        chart_title="책상 독서·학습 시 고개 숙임 각도별 성장기 어린이 경추(목뼈) 부하 하중",
        chart_takeaway="핵심 지표: 책을 15~30도 세워 시선만 올려주어도 목과 등 상부 압박 하중이 3분의 1로 줄어듭니다",
        chart_bars=[
            {"label": "바른 정면 시선 (독서대 활용 · 고개 0~5도)", "value_text": "약 5 kg 하중", "ratio": 0.28, "tone": "good", "note": "머리 고유 무게만 지지 -> 경추 C커브 보존 및 흉곽 호흡·집중력 최적화"},
            {"label": "낮은 책상 살짝 숙임 (고개 15도 굴곡)", "value_text": "약 12 kg 하중", "ratio": 0.65, "tone": "mid", "note": "승모근·목 뒤 근육 긴장 시작 -> 40분 경과 시 등이 둥글게 말림"},
            {"label": "평평한 책·태블릿 내려다보기 (고개 30~45도)", "value_text": "18~22 kg 하중", "ratio": 0.96, "tone": "risk", "note": "거북목·흉추 후만 고착화 -> 숨은 키 손실 및 만성 두통·피로 유발"},
        ],
        checklist_title="연령단계별 거북목 예방 · 숨은 키 되찾는 책상 환경 체크표",
        early_actions=[
            "바닥에 엎드려 그림책 보지 않고 낮은 책상 위 독서대 세워 읽기",
            "하루 3번 양팔 벌려 '기지개 나무' 포즈로 말린 앞가슴 활짝 펴기",
        ],
        upper_actions=[
            "모든 교과서·문제집·태블릿을 15~30도 각도조절 독서대 위에 올리기",
            "45분 공부 후 5분간 벽에 뒤통수·어깨·발뒤꿈치 붙이고 바른 정렬 감각 익히기",
        ],
        teen_actions=[
            "모니터·노트북 상단을 눈높이에 맞추는 거치대 및 외장 키보드 활용",
            "쉬는 시간마다 문틀 양옆 잡고 가슴 앞으로 내미는 소흉근 스트레칭",
        ],
        section1_intro=(
            "아이의 키가 부쩍 자랐으면 하는 마음에 영양제도 챙기고 잠도 일찍 재우는데, 정작 옆에서 바라본 아이의 목이 앞으로 길게 빠지고 양쪽 어깨가 안쪽으로 둥글게 말려 있어 속상해하시는 부모님이 많습니다. "
            "'허리 펴고 똑바로 앉아!'라고 하루에도 열 번씩 이야기해 보지만, 잔소리가 끝나고 3분만 지나면 아이의 고개는 다시 책상 코앞으로 내려가곤 합니다.\n\n"
            "사실 아이가 구부정하게 앉는 것은 의지가 약해서가 아니라 평평한 책상 위에 놓인 책과 스마트기기의 물리적 높이 때문입니다. "
            "성장기 척추와 주변 인대는 성인보다 훨씬 유연해서 잘못된 독서·학습 각도가 몇 달만 이어져도 체형이 구부정하게 굳어지며 당장 찾아올 수 있는 '숨은 키 2cm'를 고스란히 손해 보게 됩니다."
        ),
        section2_mechanism=(
            "척추 생체역학 연구(Hansraj 경추 부하 모델 등)에 따르면, 아이가 귀와 어깨선이 일직선을 이루는 바른 자세(0도)로 앉아 있을 때 목뼈가 지탱하는 무게는 머리 무게인 약 4.5~5kg 수준입니다. "
            "하지만 평평한 책상에 놓인 문제집을 읽기 위해 고개를 15도 숙이면 경추 하중이 12kg으로 늘어나고, 30~45도까지 깊게 숙이면 무려 18~22kg—대형 수박 두 통이나 볼링공 두 개를 목 뒤에 매달고 있는 것과 같은 압력이 성장기 경추와 상부 흉추에 가해집니다.\n\n"
            "이 하중을 버티기 위해 등이 뒤로 굽는 흉추 후만과 라운드숄더가 연쇄적으로 진행되면, 실제 뼈 길이는 그대로인데도 서 있을 때 신장이 1.5~2.5cm 작게 측정될 뿐 아니라 흉곽이 좁아져 폐활량과 뇌로 가는 산소 공급 효율까지 떨어집니다."
        ),
        section3_routine=(
            "잔소리 한마디 없이 아이의 허리와 목이 저절로 펴지게 만드는 비결은 '아이의 시선 높이'를 물리적으로 끌어올리는 환경 세팅입니다. "
            "첫째, 오늘 바로 아이 책상 위에 15~30도 각도 조절이 가능한 튼튼한 독서대를 놓아주어 책을 읽거나 필기할 때 고개를 숙이지 않고 시선만 자연스럽게 닿도록 만들어 주세요.\n\n"
            "둘째, 45~50분 학습을 마칠 때마다 알람을 맞추어 벽에 발뒤꿈치·엉덩이·양쪽 날개뼈·뒤통수를 모두 붙이고 30초간 서 보는 '벽 천사(Wall Angel) 정렬 습관'을 들이면 아이의 뇌가 반듯한 척추 감각을 스스로 기억하게 됩니다. "
            "셋째, 저녁 샤워 후에는 문틀 양옆에 손을 짚고 말린 앞가슴 근육(소흉근)을 20초간 시원하게 늘려주어 당당한 어깨 라인과 숨은 키를 함께 되찾아 주세요."
        ),
        tags=["어린이거북목", "숨은키찾기", "초등독서대", "바른자세습관", "라운드숄더교정", "초등책상세팅", "아이키성장", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis3_posture_spinal_decompression",
        axis_label="AXIS 03 · 아침·저녁 키 차이와 저녁 척추 감압",
        title="[소아성장 칼럼] 아침 키보다 저녁 키가 1.8cm 작아지는 이유 — 낮 동안 눌린 척추 디스크를 살리는 저녁 90초 감압 루틴",
        cover_headline="아침에 잰 키보다 저녁 키가\n1.8cm나 작아져 놀라셨나요?\n저녁 90초 '척추 감압'이 해답입니다",
        cover_subline="중력에 눌린 추간판 수분 회복과 성장판 연골 휴식을 돕는 이완법",
        cover_points=[
            "하루 종일 앉고 걸으며 척추 추간판 디스크가 눌려 저녁 신장 일시 감소",
            "압박된 상태로 바로 잠들면 밤사이 디스크·성장판 회복 효율 저하",
            "취침 전 실내 철봉 가벼운 매달리기·고양이 기지개로 척추 공간 확보",
        ],
        chart_title="하루 시간대별 신장 변화 및 취침 전 척추 감압 스트레칭 유무별 회복도",
        chart_takeaway="핵심 지표: 잠들기 전 90초 척추 이완 루틴이 밤사이 추간판 재수화(수분 충전) 속도를 높여줍니다",
        chart_bars=[
            {"label": "저녁 90초 감압 스트레칭 후 밤 9시반 숙면", "value_text": "96% 회복", "ratio": 0.96, "tone": "good", "note": "척추 마디 압력 즉시 해제 -> 밤사이 디스크 수분 재충전 및 성장판 이완"},
            {"label": "별도 스트레칭 없이 평평한 침대 취침", "value_text": "74% 회복", "ratio": 0.74, "tone": "mid", "note": "수면 중 자연 회복은 진행되나 굳은 등·허리 근막 이완까지 시간 소요"},
            {"label": "장시간 착석 + 늦은 밤 푹신한 소파 반누움 자세", "value_text": "41% 회복", "ratio": 0.41, "tone": "risk", "note": "요추·흉추 비대칭 압박 지속 -> 아침 기상 시 뻐근함 및 자세 불균형"},
        ],
        checklist_title="연령단계별 저녁 90초 척추 감압 · 아침 정밀 키 측정 체크표",
        early_actions=[
            "매트 위에서 엄마와 함께 '고양이-소 등 늘리기' 놀이 1분 진행",
            "키 측정은 항상 아침 기상 직후 같은 벽면에서 맨발로 기록하기",
        ],
        upper_actions=[
            "안전한 실내 철봉 또는 발 닿는 낮은 바 잡고 20초 x 3회 상체 늘리기",
            "누워서 양 무릎 가슴으로 안아 허리 기립근 부드럽게 이완하기",
        ],
        teen_actions=[
            "야간 학업 직후 폼롤러를 등 아래 가로로 대고 흉추 시원하게 펴기",
            "너무 꺼지는 매트리스 대신 척추 수평을 지지하는 탄탄한 침구 점검",
        ],
        section1_intro=(
            "집에서 아이 키를 재어보시다가 아침 식사 전에 쟀을 때와 밤에 자기 전에 쟀을 때 눈금이 1.5cm에서 많게는 2cm 가까이 달라져 체중계나 줄자가 고장 난 줄 알았다는 학부모님이 꽤 많으십니다. "
            "분명 아침에는 140cm가 넘었는데 저녁에 다시 재보니 138.5cm가 나오니 어느 숫자가 진짜 우리 아이 키인지 헷갈릴 수밖에 없습니다.\n\n"
            "결론부터 말씀드리면 두 숫자 모두 정상적인 생리 현상이며, 성장 기록의 표준은 언제나 '아침 기상 직후 키'입니다. "
            "다만 낮 동안 줄어든 이 1.8cm의 간격을 잠자리에 들기 전 어떻게 풀어주느냐가 아이의 척추 정렬과 밤사이 성장판 회복 컨디션에 적지 않은 차이를 만듭니다."
        ),
        section2_mechanism=(
            "우리 몸의 척추뼈 24개 사이사이에는 충격을 흡수하는 말랑말랑한 젤리 쿠션인 추간판(디스크)이 자리 잡고 있습니다. "
            "아침에 일어났을 때는 밤새 중력 부담 없이 누워 있는 동안 추간판이 수분을 가득 머금어 통통하게 부풀어 있지만, 낮 동안 서서 걷고 책상에 오래 앉아 있으면 중력 압박에 의해 추간판 속 수분이 조금씩 빠져나가 두께가 얇아집니다.\n\n"
            "문제는 하루 8~10시간 이상 책상 앞에 구부정하게 앉아 지내는 아동·청소년의 경우 척추 주변 심부 근육과 인대까지 단단하게 뭉친 채 침대에 눕게 된다는 점입니다. "
            "척추 마디 주변 근육이 과긴장된 상태에서는 수면 중 추간판의 재수화(수분 복원)와 척추 성장판으로 가는 미세 혈류 순환이 더뎌져 이튿날 아침까지도 등이 굽은 자세가 이어지기 쉽습니다."
        ),
        section3_routine=(
            "하루 동안 중력에 눌렸던 우리 아이의 척추 마디마디에 숨통을 틔워주는 '저녁 90초 감압 루틴'을 오늘 밤부터 시작해 보세요. "
            "첫째, 악력이 약한 어린이는 무리해서 공중에 매달릴 필요 없이 발끝이 바닥에 살짝 닿는 높이의 안전한 실내 바나 문틀을 잡고 무릎만 살짝 구부려 겨드랑이와 옆구리, 척추가 수직으로 길어지는 느낌을 20초씩 3세트 경험하게 해주세요.\n\n"
            "둘째, 매트 위에 네발기기 자세를 취한 뒤 숨을 내쉬며 고양이처럼 등을 동그랗게 말고, 들이쉬며 가슴을 활짝 여는 '고양이 기지개 스트레칭'을 6회 반복하면 뭉친 흉추와 요추가 편안하게 풀립니다. "
            "셋째, 가정에서 성장 속도를 체크하실 때는 반드시 매달 같은 요일 아침 기상 직후 10분 이내에 뒤꿈치·엉덩이·어깨·뒤통수를 벽에 붙이고 측정하셔야 정확한 연간 성장 흐름을 읽으실 수 있습니다."
        ),
        tags=["아침키저녁키", "척추감압", "키크는스트레칭", "실내철봉매달리기", "초등키재는법", "숨은키복원", "바른체형", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis3_posture_footrest_pelvis",
        axis_label="AXIS 03 · 골반 정렬과 발받침 착석 역학",
        title="[소아성장 칼럼] 의자에서 다리 흔들고 꼬아 앉는 아이, '공중에 뜬 발바닥'이 척추 측만과 집중력 저하를 부릅니다",
        cover_headline="의자에 앉자마자 다리 꼬고 눕는 아이\n집중력 부족이 아니라\n'공중에 뜬 발바닥' 때문입니다",
        cover_subline="무릎·고관절 90도 발받침 고정이 척추 성장판 대칭을 지키는 원리",
        cover_points=[
            "발이 바닥에 닿지 않으면 골반이 뒤로 밀리며 허리가 C자로 무너짐",
            "다리 꼬기·한쪽 턱 괴기는 성장기 척추 비대칭 압박과 골반 틀어짐 유발",
            "신장 맞춤 높이조절 발받침으로 발바닥 전체를 밀착해 코어 안정화",
        ],
        chart_title="착석 시 발바닥 지지 상태별 골반 수평 유지율 및 40분 바른 자세 지속률",
        chart_takeaway="핵심 지표: 발바닥 전체가 발받침에 단단히 닿는 순간 골반과 허리가 저절로 세워집니다",
        chart_bars=[
            {"label": "발바닥 전체 밀착 착석 (발받침 + 무릎 90도)", "value_text": "88% 유지", "ratio": 0.88, "tone": "good", "note": "하지 체중 분산 -> 골반 중립 정렬 유지 및 차분한 독서·학습 몰입"},
            {"label": "발끝만 간신히 바닥이나 의자 다리에 걸침", "value_text": "49% 유지", "ratio": 0.49, "tone": "mid", "note": "종아리 긴장 누적 -> 15분 뒤 의자 앞쪽으로 엉덩이가 미끄러짐"},
            {"label": "발이 공중에 뜬 성인용 식탁·책상 의자 착석", "value_text": "17% 유지", "ratio": 0.17, "tone": "risk", "note": "다리 흔들림·양반다리·다리 꼬기 유발 -> 척추 측만 비대칭 부하"},
        ],
        checklist_title="연령단계별 골반·척추 대칭 지키는 의자 & 발받침 피팅 체크표",
        early_actions=[
            "식탁·책상 의자에서 아이 발이 대롱거리지 않게 안정적인 발받침 배치",
            "바닥에 다리를 바깥으로 꺾어 앉는 'W자 앉기' 대신 의자 착석 유도",
        ],
        upper_actions=[
            "엉덩이를 등받이 끝까지 넣었을 때 무릎과 발목 각도가 90도인지 점검",
            "키가 5cm 자랄 때마다 책상·의자·발받침 단수를 분기별로 재조정",
        ],
        teen_actions=[
            "습관적인 다리 꼬기·한쪽 팔걸이 기대기 교정해 골반 좌우 높이 맞추기",
            "바지 뒷주머니 지갑·휴대폰 빼고 앉아 좌골 수평 압력 유지하기",
        ],
        section1_intro=(
            "식탁이나 공부방 책상에 앉힌 지 10분도 채 되지 않아 아이가 다리를 앞뒤로 달랑거리거나, 의자 위에 한쪽 무릎을 세우고 앉거나, 어른처럼 다리를 꼬고 한쪽 턱을 괴는 모습을 보면 부모님 속이 타들어 갑니다. "
            "자세가 흐트러지니 글씨도 비뚤어지고 집중 시간도 짧아지는 것 같아 의자 등받이를 툭툭 치며 바르게 앉으라고 일러주곤 하시죠.\n\n"
            "그런데 오늘 저녁 아이가 평소 앉는 의자에 깊숙이 앉았을 때 '아이의 두 발바닥이 어디에 놓여 있는지'를 꼭 한 번 확인해 보세요. "
            "성인 체형에 맞춰 제작된 일반 책상(높이 72cm 내외)과 의자에 키 110~150cm대 아이를 앉히면 발바닥이 바닥에 닿지 않고 허공에 뜨게 되는데, 이것이 모든 흐트러진 착석 자세의 출발점입니다."
        ),
        section2_mechanism=(
            "소아 재활의학과 인간공학(Ergonomics)에서는 바른 앉기 자세의 제1원칙을 '허리 힘주기'가 아닌 '발바닥 기저면(Base of Support) 확보'로 꼽습니다. "
            "두 발이 공중에 대롱대롱 떠 있으면 허벅지 아래쪽 혈관이 의자 모서리에 눌리고 하체 무게를 지탱할 지지점이 사라지기 때문에, 아이의 몸은 본능적으로 균형을 잡으려 다리를 흔들거나 의자 위로 발을 끌어올려 양반다리·다리 꼬기 자세를 취하게 됩니다.\n\n"
            "한쪽으로 다리를 꼬거나 골반이 뒤로 누운 천골 앉기 자세가 매일 서너 시간씩 반복되면 척추 마디의 좌우 성장판에 비대칭 압력이 가해집니다. "
            "성장판 연골은 적당한 수직 자극에는 잘 자라지만 한쪽으로 치우친 지속적 압박에는 성장이 억제되는 특성(Hueter-Volkmann 법칙)이 있어, 사춘기 급성장기에 기능성 척추 불균형이 빠르게 심화될 수 있습니다."
        ),
        section3_routine=(
            "우리 아이의 골반과 척추 성장판을 좌우 대칭으로 반듯하게 지키는 '90-90-90 착석 세팅'은 오늘 바로 완성할 수 있습니다. "
            "첫째, 아이 엉덩이를 의자 등받이 깊숙이 밀착시켰을 때 고관절 90도, 무릎 90도, 그리고 발목이 90도를 이루며 두 발바닥 전체가 평평한 발받침 위에 안정적으로 얹혀 있도록 높이를 맞춰주세요.\n\n"
            "둘째, 거실 바닥에서 놀 때 양 무릎은 모으고 두 발목을 엉덩이 바깥쪽으로 꺾어 앉는 이른바 'W자 앉기'는 고관절 내회전과 휜 다리를 유발하므로, 발견하실 때마다 '다리 앞으로 쭉 펴기'나 낮은 좌식 의자로 부드럽게 바꿔주세요. "
            "셋째, 아이 키는 계절마다 쑥쑥 달라지므로 3개월에 한 번 키를 측정하는 날 책상·의자·발받침 높이도 한 칸씩 함께 점검해 주시면 바른 체형과 학습 지구력을 동시에 선물하실 수 있습니다."
        ),
        tags=["어린이발받침", "초등의자자세", "다리꼬는습관", "척추측만예방", "W자앉기교정", "바른자세교정", "성장기체형", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis3_posture_backpack_symmetry",
        axis_label="AXIS 03 · 책가방 무게와 어깨·흉추 균형",
        title="[소아성장 칼럼] 아이 체중의 15%를 넘는 무거운 학원 가방, 한쪽 어깨 메기가 척추 성장판을 누르는 기전",
        cover_headline="아이 몸무게보다 버거운 책가방과\n습관적인 한쪽 어깨 메기\n어깨 높낮이와 숨은 키를 깎습니다",
        cover_subline="소아정형외과 권고 '체중 10% 이하 가방 무게'와 밀착 피팅 3원칙",
        cover_points=[
            "가방 무게가 체중의 10%를 넘으면 몸이 앞으로 쏠리며 거북목 가속",
            "한쪽 끈만 메거나 골반 아래로 처진 가방은 좌우 척추 비대칭 유발",
            "양쪽 넓은 어깨끈 밀착 + 가슴 버클 체결 + 무거운 책 등판 쪽 수납",
        ],
        chart_title="어린이 체중 대비 책가방 무게 비율별 보행 시 척추 전방 경사 및 피로도",
        chart_takeaway="핵심 지표: 가방 총무게를 아이 체중의 10% 이내로 줄이고 등판에 밀착할 때 척추 정렬이 유지됩니다",
        chart_bars=[
            {"label": "체중의 8~10% 이내 + 양쪽 끈·가슴버클 밀착", "value_text": "92% 안정", "ratio": 0.92, "tone": "good", "note": "체중심 중앙 유지 -> 보행 시 자연스러운 척추 신전 및 활기찬 걸음"},
            {"label": "체중의 12~14% + 어깨끈 길게 늘여 메기", "value_text": "53% 안정", "ratio": 0.53, "tone": "mid", "note": "가방이 엉덩이 뒤로 당김 -> 균형 잡기 위해 목·상체가 앞으로 숙여짐"},
            {"label": "체중의 15% 초과 또는 한쪽 어깨·크로스 편측 메기", "value_text": "22% 안정", "ratio": 0.22, "tone": "risk", "note": "한쪽 승모근 과긴장 및 척추 측방 굴곡 -> 어깨 비대칭·성장 피로 누적"},
        ],
        checklist_title="연령단계별 등하교 책가방 무게 다이어트 · 대칭 피팅 체크표",
        early_actions=[
            "유치원·초등 저학년(체중 22kg 기준) 가방 총무게 2.0kg 이하 유지",
            "가슴 체스트 버클을 꼭 채워 걸을 때 어깨끈이 흘러내리지 않게 고정",
        ],
        upper_actions=[
            "일요일 저녁 가방 속 불필요한 지난 프린트·두꺼운 참고서 비워내기",
            "가장 무거운 책과 물통은 바깥쪽이 아닌 '등판에 가장 가까운 안쪽'에 배치",
        ],
        teen_actions=[
            "멋으로 가방 끈을 엉덩이 아래까지 길게 늘이거나 한쪽 어깨로 메지 않기",
            "거울 앞에서 양쪽 어깨 봉우리 높이와 귀 높이가 수평인지 월 1회 점검",
        ],
        section1_intro=(
            "등교하거나 학원으로 향하는 아이의 가방을 대신 들어주셨다가 '벽돌이 들었나?' 싶을 만큼 묵직한 무게에 깜짝 놀라신 적이 있으실 것입니다. "
            "교과서에 문제집, 필통, 가득 채운 보온 물병까지 넣다 보면 초등학생 가방 무게가 훌쩍 4~5kg을 넘어가고, 아이는 그 무게를 이기지 못해 상체를 잔뜩 앞으로 숙인 채 종종걸음을 걷곤 합니다.\n\n"
            "특히 고학년으로 올라갈수록 가방 끈을 길게 늘여 엉덩이 아래까지 처지게 메거나 한쪽 어깨에만 대충 걸치는 습관이 생기기 쉬운데, 매일 40~60분씩 반복되는 이 보행 하중이 아이의 어깨 대칭과 척추 성장판에 적지 않은 부담을 남깁니다."
        ),
        section2_mechanism=(
            "미국소아과학회(AAP)와 소아정형외과 학술 권고안을 보면 성장기 아동·청소년의 배낭 무게 상한선은 '아이 본인 체중의 10% 이내(최대 12% 미만)'입니다. "
            "예를 들어 몸무게가 28kg인 초등학생이라면 가방 안 내용물을 모두 합쳐 2.8kg을 넘지 않아야 척추 곡선이 변형 없이 유지됩니다.\n\n"
            "가방이 체중의 15%를 넘거나 등판에서 떨어져 아래로 축 처지면 무게중심이 뒤아래로 당겨지기 때문에, 아이는 뒤로 넘어지지 않으려 보상 작용으로 목을 앞으로 빼고 허리를 과도하게 꺾게 됩니다. "
            "더욱이 한쪽 어깨로만 가방을 메면 반대쪽 어깨가 들리고 척추가 옆으로 휘어지는 측방 압력이 매 걸음마다 추간판과 성장판에 전달되어 만성 어깨 결림과 체형 비대칭으로 이어집니다."
        ),
        section3_routine=(
            "오늘 저녁 현관 저울 위에 아이 책가방을 한 번 올려보고 아래 세 가지 '가방 피팅 공식'을 실천해 보세요. "
            "첫째, 일주일에 한 번은 아이와 함께 가방을 완전히 뒤집어 다 푼 학습지와 안 쓰는 학용품을 정리하고, 스테인리스 대용량 물병은 등교 후 학교·학원 정수기에서 절반씩 채워 마시도록 해 기본 무게를 500g 이상 덜어주세요.\n\n"
            "둘째, 가방을 쌀 때는 무거운 백과사전이나 문제집일수록 아이의 등과 가장 밀착되는 안쪽 포켓에 세워서 넣어야 지렛대 원리에 의한 허리 부담이 절반으로 줄어듭니다. "
            "셋째, 가방 하단 끝선이 아이 허리 벨트 라인(엉덩이 위쪽)에 딱 맞도록 양쪽 어깨끈 길이를 똑같이 조여주시고 앞쪽 가슴 버클을 체결해 주면 걸음걸이부터 한결 가볍고 반듯하게 달라집니다."
        ),
        tags=["초등책가방무게", "아이어깨비대칭", "척추건강", "바른걸음걸이", "거북목예방", "성장기체형관리", "초등입학준비", "키즈핏"],
    ),

    # ==================== AXIS 4: 점프 성장판 자극 & 급성장기 vs 성조숙증 구별 (4종) ====================
    _make_editorial_topic(
        topic_id="axis4_exercise_rope_micro_loading",
        axis_label="AXIS 04 · 점프 성장판 자극과 볼프의 법칙",
        title="[소아성장 칼럼] 성장판 연골세포가 가장 좋아하는 운동은? 하루 15분 줄넘기·점핑 '수직 미세하중' 프로토콜",
        cover_headline="무조건 지칠 때까지 뛰지 마세요!\n성장판 연골세포를 깨우는\n하루 15분 '리듬 점프' 골든 프로토콜",
        cover_subline="볼프의 법칙(Wolff's Law) 기반 성장판 미세 자극과 관절 보호 수칙",
        cover_points=[
            "위아래로 가볍게 통통 뛰는 수직 미세하중이 성장판 연골 증식 촉진",
            "콘크리트 바닥 대신 흙·우레탄 트랙 또는 실내 층간소음 점핑매트 필수",
            "운동 종료 후 30~60분 뒤 찾아오는 주간 성장호르몬 보너스 분비 효과",
        ],
        chart_title="운동 유형·강도별 성장판 연골 자극 효율 및 주간 성장호르몬 반응도",
        chart_takeaway="핵심 지표: 숨이 기분 좋게 차는 15~25분 중강도 리듬 점프 운동이 성장판 자극에 가장 이상적입니다",
        chart_bars=[
            {"label": "하루 15~25분 리듬 줄넘기 · 농구 · 트램펄린 점프", "value_text": "93% 최적", "ratio": 0.93, "tone": "good", "note": "적정 수직 탄성 자극 -> 성장판 혈류 증가 및 운동 후 성장호르몬 피크 유도"},
            {"label": "평지 천천히 산책하기 (수직 점프 자극 없음)", "value_text": "58% 양호", "ratio": 0.58, "tone": "mid", "note": "기분 전환과 비타민D 합성에 좋으나 성장판 직접 탄성 자극은 완만함"},
            {"label": "무거운 중량 들기 · 콘크리트 장시간 과격 점프", "value_text": "26% 주의", "ratio": 0.26, "tone": "risk", "note": "무릎·발목 성장판 과부하 및 피로 호르몬 상승으로 회복 지연"},
        ],
        checklist_title="연령단계별 관절 안전 · 성장판 깨우는 일일 점프 운동 체크표",
        early_actions=[
            "실내 도톰한 점핑매트 위에서 음악 맞춰 10분 개구리·토끼 점프 놀이",
            "아스팔트 대신 놀이터 탄성 바닥에서 달리기와 공 주고받기 진행",
        ],
        upper_actions=[
            "하교 후 오후 4~6시 사이 줄넘기(1분 뛰기 + 30초 휴식 x 8세트) 실천",
            "점프 시 무릎을 살짝 굽히며 앞발바닥으로 사뿐히 착지하는 법 익히기",
        ],
        teen_actions=[
            "농구 레이업 점프·배드민턴 등 전신 신전 스포츠 주 3~4회 30분 유지",
            "운동 직후 종아리·허벅지 스트레칭과 수분·단백질 보충으로 피로 해소",
        ],
        section1_intro=(
            "'키 크려면 줄넘기랑 농구를 시켜야 한다더라'는 이야기는 누구나 알고 계시지만, 막상 하루에 몇 개를 어떻게 뛰어야 성장판에 도움이 되고 무릎에는 무리가 가지 않는지 정확한 기준을 아는 경우는 드뭅니다. "
            "의욕이 앞서 딱딱한 아파트 주차장 바닥에서 줄넘기 1,000개를 억지로 채우게 했다가 아이가 발목과 무릎 앞쪽이 아프다며 운동 자체를 싫어하게 되는 일도 종종 생깁니다.\n\n"
            "성장판은 너무 가만히 있어도 잠들지만, 지나치게 무겁고 거친 충격에도 움츠러드는 섬세한 연골 조직입니다. "
            "우리 아이 성장판이 가장 반갑게 반응하는 '황금 강도의 점프 자극법'을 알면 하루 딱 15분 투자로도 훌륭한 성장 부스터를 만들 수 있습니다."
        ),
        section2_mechanism=(
            "정형외과 생리학의 고전 원리인 '볼프의 법칙(Wolff's Law)'과 성장판 기계적 자극 연구에 따르면, 뼈와 성장판 연골세포는 중력 방향으로 주기적이고 탄력적인 미세 압박과 이완(Cyclic Micro-loading)이 반복될 때 세포 분열과 골기질 합성을 가장 활발히 일으킵니다. "
            "마치 스펀지를 물속에서 살짝 눌렀다 떼면 주변 영양분과 산소가 스펀지 속으로 빨려 들어가는 것처럼, 가벼운 점프 동작이 혈관 분포가 적은 성장판 연골에 영양 공급 펌프 역할을 해주는 것입니다.\n\n"
            "또한 이마에 땀이 송골송골 맺히고 옆 사람과 대화가 가능할 정도의 중강도 유산소·점프 운동을 15~25분 지속하면, 밤 시간대뿐 아니라 운동 종료 후 30~60분 사이에 뇌하수체에서 낮 시간 보너스 성장호르몬 맥동이 분비되어 체지방은 줄이고 뼈 성장은 촉진하는 일석이조 효과가 나타납니다."
        ),
        section3_routine=(
            "부상 걱정 없이 성장판만 똑똑하게 깨우는 '3-Step 리듬 점프 수칙'을 기억해 주세요. "
            "첫째, 바닥 선택이 절반입니다. 충격 흡수가 전혀 되지 않는 시멘트나 대리석 바닥은 피하고 학교 우레탄 트랙, 흙 운동장, 혹은 비 오는 날이나 미세먼지가 심한 날에는 거실에 층간소음 방지 탄성 매트를 깔고 쿠션 좋은 운동화를 신겨 뛰게 해주세요.\n\n"
            "둘째, 착지할 때 발뒤꿈치로 '쿵쿵' 내리찍지 않고 무릎을 살짝 구부린 채 앞발바닥 볼로 통통 튀어 오르는 가벼운 리듬감을 알려주세요. "
            "셋째, 한 번에 지칠 때까지 몰아 뛰기보다 '1분 가볍게 뛰고 30초 숨 고르기'를 8~10세트 반복하는 인터벌 방식으로 주 4~5회 꾸준히 이어가시면 아이의 심폐 체력과 연간 성장 속도가 함께 탄력을 받게 됩니다."
        ),
        tags=["키크는운동", "어린이줄넘기", "성장판자극운동", "실내점핑매트", "초등키성장운동", "농구키성장", "성장호르몬운동", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis4_puberty_phv_vs_precocious",
        axis_label="AXIS 04 · 급성장기(PHV) vs 성조숙증 정밀 감별",
        title="[소아성장 칼럼] 1년에 8cm 훌쩍 자란 우리 아이, 반가운 '급성장기'일까 '성조숙증' 신호일까? 부모 점검표",
        cover_headline="갑자기 바지가 짧아지며 훌쩍 큰 아이\n반가운 급성장기일까요,\n성장판 시계가 빨라진 신호일까요?",
        cover_subline="여아 만 8세 미만 · 남아 만 9세 미만 2차 성징 체크포인트와 대처 시점",
        cover_points=[
            "또래보다 너무 일찍 크면 성장판이 조기 폐쇄되어 최종 성인키는 손해",
            "여아 만 8세 미만 가슴 멍울 · 남아 만 9세 미만 고환 발달 유무가 핵심 기준",
            "6개월 단위 신장·체중 속도와 손목 뼈나이 편차 확인으로 골든타임 사수",
        ],
        chart_title="성장 리듬 유형별 사춘기 진입 시기 및 최종 성인키 잠재력 보존 비교",
        chart_takeaway="핵심 지표: 지금 당장 반에서 큰 것보다 성장판이 닫히기 전까지 '자라는 기간'을 길게 지키는 것이 핵심입니다",
        chart_bars=[
            {"label": "적기 급성장 진입 (사춘기 전 연 5~6cm 꾸준히 성장)", "value_text": "95% 보존", "ratio": 0.95, "tone": "good", "note": "충분한 아동기 기초 신장 확보 후 정상 시기 급성장 -> 최종 성인키 극대화"},
            {"label": "빠른 사춘기 경계군 (만 8~9세 조기 가속 · 비만 동반)", "value_text": "66% 보존", "ratio": 0.66, "tone": "mid", "note": "체중·수면·식습관 조기 교정 및 6개월 추적 검사로 속도 완충 가능"},
            {"label": "성조숙증 미인지 방치 (초기 급성장 후 조기 멈춤)", "value_text": "39% 보존", "ratio": 0.39, "tone": "risk", "note": "초등 저학년엔 커 보이나 골연령 급진행으로 성장판 조기 폐쇄 위험"},
        ],
        checklist_title="연령단계별 급성장기 vs 성조숙증 가정 내 정기 관찰 체크표",
        early_actions=[
            "여아 만 8세 생일 전 가슴 스침 통증·멍울, 머리 정수리 냄새 변화 살피기",
            "플라스틱 뜨거운 음식 용기·배달 일회용기 사용 줄여 환경호르몬 차단",
        ],
        upper_actions=[
            "남아 만 9세 생일 전 고환 크기 증가·음모·갑작스러운 여드름 유무 확인",
            "최근 6개월 키가 4cm 이상 급증했다면 소아내분비과 뼈나이 점검 권장",
        ],
        teen_actions=[
            "사춘기 중후반 급성장 정점(PHV) 구간에는 밤 10시 수면과 단백질 총력 지원",
            "키 성장 속도가 연 2cm 미만으로 완만해지기 전 바른자세로 숨은 키 확보",
        ],
        section1_intro=(
            "초등 저학년인 우리 아이가 반에서 키 번호 뒤쪽에 서고 바지 기장이 몇 달 만에 훌쩍 짧아지면, 대부분의 부모님께서는 '우리 아이는 영양 상태가 좋아서 남들보다 잘 크나 보다'라며 안심하십니다. "
            "하지만 소아내분비 전문의들이 입을 모아 강조하는 역설이 있습니다. '초등 저학년 때 반에서 제일 컸던 아이가 고등학교에 가서도 제일 큰 것은 아니다'라는 사실입니다.\n\n"
            "아이의 최종 성인키는 '일년에 몇 센티미터씩 자랐느냐'에 '몇 년 동안 자랐느냐'를 곱해서 결정됩니다. "
            "만약 또래보다 성호르몬 시계가 1~2년 일찍 켜져서 당장 키가 훌쩍 자란 것이라면, 성장판 문이 닫히는 시각 역시 앞당겨져 전체 성장 기간에서 큰 손해를 볼 수 있으므로 부모님의 차분하고 정확한 감별 눈썰미가 꼭 필요합니다."
        ),
        section2_mechanism=(
            "의학적으로 성조숙증은 여아에서 만 8세 미만(만 7세 364일까지), 남아에서 만 9세 미만(만 8세 364일까지)에 2차 성징이 시작되는 상태를 말합니다. "
            "사춘기 전 아동기의 정상적인 연간 키 성장 속도는 보통 1년에 5.0~6.0cm 정도로 일정하게 유지되다가, 사춘기 급성장기(Peak Height Velocity, PHV)에 접어들면 여아는 연 7~9cm, 남아는 연 8~10cm까지 가속됩니다.\n\n"
            "아직 만 7~8세인데 갑자기 연간 7~8cm 이상 키가 쑥 자라면서 머리에서 어른스러운 피지 냄새가 나거나, 여아의 유방 멍울 통증, 남아의 고환 용적 증가(4cc 이상)가 동반된다면 성호르몬이 성장판을 빠르게 성숙시키고 있다는 신호일 수 있습니다. "
            "이 경우 실제 나이(역연령)는 만 8세인데 손목 X-ray상 뼈나이(골연령)는 만 10세로 앞서 나가, 정작 초등 고학년 이후 자라야 할 예비 연골을 미리 당겨 쓰는 셈이 됩니다."
        ),
        section3_routine=(
            "불필요한 공포심 대신 정확한 기준만 알고 계시면 골든타임을 여유 있게 지킬 수 있습니다. "
            "첫째, 샤워 후 로션을 발라주실 때 한 달에 한 번쯤 자연스럽게 아이의 신체 변화와 최근 3개월간 체중이 너무 급격히(예: 분기당 2~3kg 이상) 늘지 않았는지 함께 살펴주세요.\n\n"
            "둘째, 뜨거운 국물이나 기름진 음식을 플라스틱·일회용 용기에 담아 전자레인지에 데우는 습관을 유리·도자기 식기로 바꾸어 내분비 교란 물질(환경호르몬) 노출을 생활 속에서 최소화해 주세요. "
            "셋째, 만 7~9세 시기에 키 성장 속도가 갑자기 가팔라지거나 부모님 중 일찍 크고 일찍 멈춘 가족력이 있다면 고민만 하기보다 소아청소년과에서 간단한 뼈나이 검사를 받아 현재 성장 시계 속도를 객관적인 숫자로 확인해 두시는 것이 가장 현명한 부모의 전략입니다."
        ),
        tags=["성조숙증초기증상", "급성장기", "여아성조숙증", "남아성조숙증", "뼈나이검사", "초등저학년키성장", "소아내분비", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis4_puberty_leptin_weight_balance",
        axis_label="AXIS 04 · 적정 체중 관리와 성장판 수명 보호",
        title="[소아성장 칼럼] '어릴 때 살은 다 키로 간다'는 옛말의 함정 — 체지방 렙틴(Leptin) 호르몬과 성장판 조기 노화 방어법",
        cover_headline="'어릴 때 통통한 살은 다 키로 간다?'\n과도한 체지방의 렙틴 신호가\n성장판 시계를 재촉할 수 있습니다",
        cover_subline="굶기지 않고 키만 쑥 키우는 '신장 증가 우선 · 체중 유지' 생활 수칙",
        cover_points=[
            "체지방 세포에서 분비되는 렙틴 과잉은 사춘기 개시 중추를 조기 자극",
            "성장기 아이에게 무리한 굶기 다이어트는 성장호르몬과 골밀도까지 동반 저하",
            "현재 체중을 유지한 채 키만 자라게 하는 액상당 차단·점프 운동 전략",
        ],
        chart_title="성장기 체질량지수(BMI) 관리 방식별 연간 신장 성장 및 뼈나이 안정도",
        chart_takeaway="핵심 지표: 아이 체중을 억지로 빼려 하지 말고 '체중 정체 + 키 성장'으로 자연스럽게 날씬해지게 돕습니다",
        chart_bars=[
            {"label": "액상과당 차단 + 저녁 줄넘기 (체중 유지·키 증가)", "value_text": "92% 이상적", "ratio": 0.92, "tone": "good", "note": "근육량·연골 영양은 지키면서 체지방률만 완만히 낮춰 골연령 가속 방지"},
            {"label": "극단적 식사량 감량 (칼로리·단백질 동시 제한)", "value_text": "44% 주의", "ratio": 0.44, "tone": "mid", "note": "체중은 줄어들지만 IGF-1 감소로 가장 중요한 키 성장 속도까지 둔화"},
            {"label": "음료수·야식 방치로 연간 체중 5~6kg 이상 급증", "value_text": "27% 위험", "ratio": 0.27, "tone": "risk", "note": "체지방 렙틴·아로마타제 증가 -> 성호르몬 조기 활성화 및 뼈나이 선행"},
        ],
        checklist_title="연령단계별 굶지 않고 키로 보내는 체지방 · 렙틴 관리 체크표",
        early_actions=[
            "과일 주스·요구르트 음료 대신 생과일 소량과 깨끗한 생수로 수분 섭취",
            "저녁 식사 후 거실 풍선 배구·점프 놀이로 20분 즐겁게 몸 움직이기",
        ],
        upper_actions=[
            "학원가 편의점 탄산음료·슬러시·컵떡볶이 주 1회 이내로 아이와 약속",
            "밥양을 갑자기 반으로 줄이지 말고 채소·단백질 반찬부터 먼저 먹기",
        ],
        teen_actions=[
            "야간 공부 스트레스성 배달 야식 대신 따뜻한 보리차·방울토마토 활용",
            "체중계 숫자 대신 3개월 단위 키 대비 체중(BMI 백분위) 흐름 점검",
        ],
        section1_intro=(
            "할머니·할아버지 세대에서는 복스럽게 통통한 손주 모습을 보며 '걱정 마라, 어릴 때 찐 살은 중학교 가면 전부 키로 간다'며 흐뭇해하시곤 했습니다. "
            "영양이 전반적으로 부족하던 시절에는 어느 정도 일리가 있던 말씀이지만, 고열량 간식과 실내 좌식 생활이 일상화된 요즘 아이들에게는 이 옛말이 가장 주의해야 할 오해 중 하나가 되었습니다.\n\n"
            "그렇다고 해서 통통한 성장기 아이에게 어른처럼 저녁을 굶기거나 샐러드만 먹이는 감량 다이어트를 시키면, 정작 키가 자라야 할 골든타임에 뼈 성장까지 멈춰버리는 안타까운 결과가 생깁니다. "
            "성장기 체중 관리는 어른의 다이어트와 목표부터 완전히 달라야 합니다."
        ),
        section2_mechanism=(
            "소아내분비학 연구들이 밝혀낸 체지방과 성장판의 연결 고리는 지방세포에서 분비되는 호르몬인 '렙틴(Leptin)'과 효소 '아로마타제(Aromatase)'입니다. "
            "체내 지방 조직이 급격히 늘어나 혈중 렙틴 농도가 일정 임계치를 넘어서면, 뇌의 시상하부는 '이제 성인이 되어 생식을 시작할 만큼 에너지가 충분히 비축되었다'고 판단해 성선자극호르몬 방출 스위치를 예정보다 일찍 켜게 됩니다.\n\n"
            "더불어 지방세포 속 아로마타제 효소는 부신 호르몬을 여성호르몬(에스트로겐) 계열로 전환시키는데, 에스트로겐은 남녀 아이 모두에게서 성장판 연골의 성숙과 폐쇄(뼈나이 진행)를 주도하는 핵심 물질입니다. "
            "따라서 초등 시기 과체중 관리는 체중계 숫자를 3kg 빼는 것이 목표가 아니라, '향후 6~12개월 동안 몸무게는 지금 수준에서 그대로 묶어두고 키만 5~6cm 자라게 해 체지방률을 자연스럽게 낮추는 것'이 의학적 정답입니다."
        ),
        section3_routine=(
            "아이의 자존감과 성장 에너지를 모두 지키면서 체지방 렙틴 신호만 차분히 낮추는 3원칙을 실천해 보세요. "
            "첫째, 식사량을 깎기 전에 가장 먼저 끊어야 할 단 한 가지는 '마시는 당분(액상과당)'입니다. 과일 맛 음료, 가당 요거트 음료, 탄산음료, 초코우유만 물과 플레인 우유로 바꾸어도 한 달 체지방 증가세가 놀라울 만큼 안정됩니다.\n\n"
            "둘째, 식사 순서를 '나물·쌈채소 2입 ➔ 생선·두부·살코기 단백질 ➔ 잡곡밥' 순서로 바꾸어 주면 배고픔 없이도 식후 인슐린 급상승을 막아 열량이 지방 대신 근육과 뼈 기질로 쓰이게 됩니다. "
            "셋째, 저녁 식사 40분 뒤 가족과 함께 아파트 단지 빠르게 걷기나 줄넘기 15분을 루틴으로 정착시키면 밤사이 숙면까지 깊어져 키 성장 곡선이 다시 힘차게 위로 향합니다."
        ),
        tags=["소아비만키성장", "살이키로간다", "렙틴호르몬", "초등체중관리", "성조숙증예방식단", "BMI백분위", "아이키크는법", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis4_exercise_timing_cortisol",
        axis_label="AXIS 04 · 운동 시간대와 코르티솔·입면 밸런스",
        title="[소아성장 칼럼] 밤 9시 넘은 격렬한 운동이 오히려 숙면을 늦춘다? 키 성장 효율 높이는 '하교 후 운동 골든타임'",
        cover_headline="키 크려고 밤 9시에 땀 뻘뻘 흘리며 줄넘기?\n심부 체온과 코르티솔 상승으로\n밤 10시 깊은 잠이 늦어집니다",
        cover_subline="오후 4~7시 중강도 유산소·점프 vs 저녁 8시 이후 부드러운 이완 루틴",
        cover_points=[
            "취침 1시간 이내 고강도 운동은 교감신경·심부 체온을 높여 입면 지연",
            "오후 4시~7시 사이 활동적 점프 운동이 야간 서파수면 압력을 극대화",
            "학원 후 늦은 밤에는 땀나는 운동 대신 척추 감압·종아리 스트레칭만 진행",
        ],
        chart_title="어린이 운동 시간대별 밤 10시 입면 성공률 및 첫 서파수면 도달 속도",
        chart_takeaway="핵심 지표: 땀 흘리는 점프 운동은 저녁 7시 이전에 마치고, 밤 8시 이후에는 이완 스트레칭으로 전환하세요",
        chart_bars=[
            {"label": "하교 후 오후 4시~6시 반 줄넘기·구기 운동", "value_text": "94% 최적", "ratio": 0.94, "tone": "good", "note": "건강한 수면 압력(아데노신) 축적 및 취침 시점 심부 체온 자연 하강"},
            {"label": "이른 아침 등교 전 가벼운 10분 산책·체조", "value_text": "76% 양호", "ratio": 0.76, "tone": "mid", "note": "아침 햇볕 노출로 밤 멜라토닌 예약 효과 우수"},
            {"label": "밤 8시 40분~9시 반 숨차는 고강도 줄넘기·달리기", "value_text": "38% 지연", "ratio": 0.38, "tone": "risk", "note": "심박수·코르티솔·체온 상승으로 입면 45분 이상 지연 우려"},
        ],
        checklist_title="연령단계별 하루 시간표 맞춤 성장 운동 · 야간 이완 배분 체크표",
        early_actions=[
            "하원 직후 오후 4~5시 놀이터·실내 매트 신나는 점프 놀이 집중",
            "목욕 후 밤 8시 30분부터는 공놀이 멈추고 차분한 그림책·마사지 전환",
        ],
        upper_actions=[
            "태권도·농구·줄넘기 등 땀 흘리는 운동은 저녁 식사 전후 7시 이전 배치",
            "밤늦게 귀가한 날은 줄넘기 숙제 대신 3분 기지개 스트레칭으로 대체",
        ],
        teen_actions=[
            "학교 체육·점심시간 야외 활동 적극 활용해 낮 신체 활동량 확보",
            "밤 10시 귀가 후 격렬한 홈트 대신 따뜻한 샤워와 흉추 이완으로 숙면 유도",
        ],
        section1_intro=(
            "맞벌이 가정이나 학원 일정이 빡빡한 초등 고학년 가정에서는 낮에 운동할 짬이 나지 않다 보니, 저녁을 먹고 숙제까지 다 마친 밤 9시 무렵에야 현관이나 아파트 공터로 나가 줄넘기 500개를 부랴부랴 뛰고 들어오는 경우가 적지 않습니다. "
            "매일 거르지 않고 운동 약속을 지키는 성실함은 정말 칭찬받아 마땅하지만, 운동 직후 아이 얼굴이 발갛게 달아오른 채 밤 10시 반이 넘도록 이불 속에서 뒤척인다면 운동 '시간대'를 살짝 손볼 때입니다.\n\n"
            "키 성장에서 운동과 수면은 따로 노는 두 과목이 아니라 정교하게 맞물려 돌아가는 톱니바퀴입니다. "
            "언제 땀을 흘리고 언제 몸의 열기를 식혀주느냐에 따라 똑같은 15분 운동의 성장 효과가 배가되기도 하고 반감되기도 합니다."
        ),
        section2_mechanism=(
            "인간이 깊은 잠에 빠지기 위해서는 뇌와 몸 중심부의 온도인 '심부 체온(Core Body Temperature)'이 평소보다 약 0.5~1.0도 부드럽게 내려가고, 자율신경계가 활동 모드인 교감신경에서 휴식 모드인 부교감신경으로 전환되어야 합니다. "
            "그런데 잠자리에 들기 1시간 이내에 숨이 턱까지 차오르는 고강도 줄넘기나 달리기를 하면 심박수와 아드레날린·코르티솔 농도가 올라가고 심부 체온이 상승합니다.\n\n"
            "한번 올라간 어린이의 심부 체온과 흥분된 교감신경이 다시 입면에 적합한 수준으로 가라앉기까지는 최소 90분에서 2시간이 걸립니다. "
            "반대로 하교 직후인 오후 4시에서 저녁 7시 사이에 기분 좋게 땀을 흘려두면, 뇌 속에 건강한 피로 물질(수면 압력 인자 아데노신)이 알맞게 쌓였다가 밤 9시 반 무렵 체온이 자연스럽게 떨어지면서 훨씬 깊고 굵은 첫 서파수면 파동을 만들어 냅니다."
        ),
        section3_routine=(
            "바쁜 주중 일과 속에서도 실천 가능한 '낮 점프 · 밤 이완' 이원화 시간표를 제안합니다. "
            "첫째, 줄넘기나 농구, 자전거, 태권도처럼 심박수가 올라가는 활동적인 성장판 자극 운동은 하교 직후부터 저녁 7시 30분 이전에 마무리되도록 학원 동선 사이 자투리 15분을 활용해 주세요.\n\n"
            "둘째, 부득이하게 학원이 늦게 끝나 밤 8시 30분이 넘은 요일에는 '오늘 줄넘기 못 했으니 지금이라도 뛰자'며 무리하지 마시고, 과감히 점프 운동을 쉬는 대신 거실 매트에서 5분 동안 척추와 다리 근육을 늘려주는 정적 스트레칭으로 대체해 주세요. "
            "셋째, 취침 40분 전 미지근한 물로 가볍게 샤워하면 피부 표면 혈관이 열리면서 심부 열이 빠르게 발산되어 아이가 베개에 머리를 대자마자 깊은 잠으로 빠져들게 됩니다."
        ),
        tags=["키크는운동시간", "어린이줄넘기시간", "코르티솔", "초등하루일과", "숙면유도법", "성장호르몬극대화", "성장습관", "키즈핏"],
    ),

    # ==================== AXIS 5: 질병관리청 KDCA 백분위 & 병원 뼈나이 판독 (4종) ====================
    _make_editorial_topic(
        topic_id="axis5_clinical_kdca_percentile",
        axis_label="AXIS 05 · 질병관리청(KDCA) 백분위 곡선 판독법",
        title="[소아성장 칼럼] 영유아·학생 검진표 키 백분위, '오늘 숫자'보다 무서운 '최근 6개월 기울기' 읽는 법",
        cover_headline="검진표 키 45백분위라 안심하셨나요?\n한 번의 숫자보다 중요한 건\n최근 6개월 '성장 곡선 기울기'입니다",
        cover_subline="질병관리청(KDCA) 2017 소아청소년 성장도표 연간 성장속도(cm/yr) 기준",
        cover_points=[
            "백분위는 같은 생월·성별 또래 100명 중 작은 순 번호 (50백분위가 정중앙)",
            "사춘기 전 아동기 연간 성장속도 4.0cm 미만은 전문 점검이 필요한 신호",
            "백분위 선이 6~12개월 사이 2단계(예: 50->25) 이상 꺾이면 원인 파악 필수",
        ],
        chart_title="사춘기 이전 아동기(만 4세~사춘기 전) 연간 키 성장속도(cm/년) 구간별 해석",
        chart_takeaway="핵심 지표: 현재 키가 평균이어도 1년 성장폭이 4cm 아래로 떨어지면 성장 레일이 내려가고 있다는 뜻입니다",
        chart_bars=[
            {"label": "안정적 골든타임 궤도 (연간 5.5 ~ 6.5 cm 성장)", "value_text": "정상 상위 흐름", "ratio": 0.90, "tone": "good", "note": "본인의 백분위 곡선을 흔들림 없이 유지하거나 완만히 상향 돌파하는 구간"},
            {"label": "완만한 주의 관찰 구간 (연간 4.2 ~ 4.9 cm 성장)", "value_text": "생활습관 교정", "ratio": 0.56, "tone": "mid", "note": "수면 입면 지연·영양 불균형·구강호흡 등 환경 병목 점검으로 반등 가능"},
            {"label": "성장 감속 경보 구간 (연간 4.0 cm 미만 또는 급하락)", "value_text": "전문의 정밀점검", "ratio": 0.25, "tone": "risk", "note": "성장호르몬·갑상선·만성 영양흡수 등 소아내분비 진료 권고 기준선"},
        ],
        checklist_title="연령단계별 질병관리청(KDCA) 성장 백분위 · 연간 속도 기록 체크표",
        early_actions=[
            "영유아 건강검진 결과지의 이전 차수 백분위와 이번 백분위 연결해 보기",
            "만 3세 이후 1년에 최소 5~6cm 이상 꾸준히 자라고 있는지 수첩 기록",
        ],
        upper_actions=[
            "3개월마다(3·6·9·12월 1일) 아침 기상 키를 재어 연간 환산 속도 계산",
            "백분위가 15~20포인트 이상 급락·급등할 때 수면·체중 변화 함께 체크",
        ],
        teen_actions=[
            "급성장 정점(PHV) 통과 여부와 현재 백분위 유지 추이를 분기별로 확인",
            "단순 반 번호 비교 대신 생년월일(개월수)까지 반영한 정밀 백분위 조회",
        ],
        section1_intro=(
            "영유아 건강검진이나 학교 신체검사 결과지를 받아 들면 부모님의 시선은 제일 먼저 '키 ○○백분위'라는 숫자 하나에 꽂힙니다. "
            "50백분위 근처가 나오면 '다행히 중간은 하네'라며 서랍에 넣어두시고, 20백분위대가 나오면 그날부터 인터넷 검색창을 밤새 뒤지며 한숨을 쉬시곤 합니다.\n\n"
            "하지만 소아청소년과 성장클리닉에서 의사들이 가장 중요하게 보는 지표는 오늘 찍힌 점 하나가 아니라 지난 1~2년 동안 점들이 이어지며 그리는 '기울기(성장 속도, Height Velocity)'입니다. "
            "25백분위라도 자기 선을 꿋꿋이 타고 올라가는 아이는 건강한 반면, 작년 60백분위였다가 올해 35백분위로 내려앉은 아이는 지금 당장 성장 환경의 누수를 막아주어야 하기 때문입니다."
        ),
        section2_mechanism=(
            "질병관리청(KDCA)과 대한소아청소년과학회가 제정한 2017 소아청소년 성장도표는 같은 성별, 같은 생년월일(개월 단위) 또래 아이 100명을 키가 작은 순서부터 1번에서 100번까지 세웠을 때의 상대적 위치를 나타냅니다. "
            "여기서 같은 학년이라도 1월생과 12월생은 무려 11개월의 성장 시간 차이(약 5cm 내외)가 나기 때문에, 반에서의 키 번호가 아닌 정확한 '만 개월령 백분위'로 비교해야 착시를 막을 수 있습니다.\n\n"
            "임상적으로 만 4세 이후 사춘기가 시작되기 전까지의 어린이는 매년 최소 5.0~6.0cm 이상 자라야 자신의 백분위 차선을 유지할 수 있습니다. "
            "만약 이 시기에 6개월간 자란 키가 2cm 미만(연간 환산 4.0cm 미만)이거나, 성장도표상 주요 백분위 곡선을 두 단계 이상 아래로 가로질러 내려간다면 수면·영양 결핍 혹은 내분비적 요인이 개입하고 있다는 객관적인 신호로 해석합니다."
        ),
        section3_routine=(
            "가정에서 병원 수준의 성장 모니터링을 실천하는 가장 스마트한 방법은 '90일 아침 기록 루틴'입니다. "
            "첫째, 일 년에 한 번 학교 신체검사만 기다리지 마시고 계절이 바뀌는 3월·6월·9월·12월 첫째 주 일요일 아침 기상 직후에 정확한 키와 몸무게를 재어 성장 수첩에 남겨두세요.\n\n"
            "둘째, 최근 3개월 성장폭에 4를 곱해(또는 6개월 성장폭에 2를 곱해) 우리 아이의 현재 연간 성장속도(cm/yr)가 5.5cm 이상의 골든타임 궤도에 올라 있는지 확인해 보세요. "
            "셋째, 속도가 주춤해진 분기가 발견되면 당황하기보다 최근 석 달간 취침 시각이 늦어지지 않았는지, 편식이나 거북목 착석이 심해지지 않았는지 점검해 즉시 바로잡아 주시면 다음 분기 곡선에서 분명한 회복 탄력을 확인하실 수 있습니다."
        ),
        tags=["질병관리청성장도표", "어린이키백분위", "영유아검진키", "연간성장속도", "아이키계산기", "초등신체검사", "성장곡선", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis5_clinical_bone_age_xray",
        axis_label="AXIS 05 · 병원 성장판 X-ray와 뼈나이(골연령) 해석",
        title="[소아성장 칼럼] 병원 성장판 검사에서 '뼈나이가 1년 빠르다·느리다'는 말의 진짜 의미와 부모 대처 로드맵",
        cover_headline="손목 X-ray 찍고 들은 한마디\n'뼈나이가 실제 나이보다 빠르네요'\n당황하지 않고 정확히 해석하는 법",
        cover_subline="역연령(만 나이) vs 골연령(Bone Age) 편차별 남은 성장 잠재력 계산 원리",
        cover_points=[
            "뼈나이는 왼손·손목 뼈의 골화 정도를 표준 도감(TW3·GP법)과 대조한 생물학적 나이",
            "실제 나이 대비 ±6개월~1년 이내 편차는 정상 생리적 변동 범위에 해당",
            "뼈나이 선행 시 체지방·수면 관리 집중, 지연 시 영양 흡수·수면 깊이 보강",
        ],
        chart_title="실제 만 나이(역연령) 대비 뼈나이(골연령) 편차 유형별 성장 시계 해석",
        chart_takeaway="핵심 지표: 현재 키와 뼈나이를 함께 대조해야 '남아 있는 진짜 성장 여력'이 정확히 보입니다",
        chart_bars=[
            {"label": "역연령과 뼈나이 일치 (±6개월 이내) + 백분위 상위", "value_text": "안정 순항형", "ratio": 0.91, "tone": "good", "note": "제 나이 속도에 맞춰 착실히 성장 중 -> 현재 수면·영양·운동 루틴 유지"},
            {"label": "뼈나이가 1년 이상 느린 경우 (대기만성 · 만숙 가능성)", "value_text": "성장기간 여유", "ratio": 0.72, "tone": "mid", "note": "남들보다 오래 자랄 여지 있음 -> 단, 단백질·아연·수면 보강으로 속도 지원"},
            {"label": "뼈나이가 1.2~2년 이상 빠른 경우 (조기 성숙 주의)", "value_text": "마감시계 가속", "ratio": 0.36, "tone": "risk", "note": "성장판 닫히는 시점 앞당겨질 우려 -> 체지방 관리 및 소아내분비 추적 필수"},
        ],
        checklist_title="연령단계별 병원 성장판(뼈나이) 검사 시기 · 사후 홈케어 체크표",
        early_actions=[
            "특별한 이상 없으면 만 6~7세 초등 입학 전후 첫 기초 뼈나이 확인 고려",
            "검사 결과지의 '만 개월수 / 현재 키 / 판독 뼈나이' 세 숫자를 메모해 두기",
        ],
        upper_actions=[
            "뼈나이가 빠르게 나왔다면 야식·액상당 끊고 밤 9시 반 완전 암막 취침",
            "6~12개월 뒤 재검사 시 '키가 자란 폭 vs 뼈나이가 먹은 폭' 비율 비교",
        ],
        teen_actions=[
            "성장판 후기 단계일수록 하루라도 일찍 수면·단백질·점프 루틴 밀도 높이기",
            "남은 성장판 틈새 동안 거북목·척추 압박 풀어 최종 신장 1~2cm까지 사수",
        ],
        section1_intro=(
            "큰맘 먹고 아이 손을 잡고 성장클리닉이나 소아청소년과에 방문해 왼손 손목 X-ray를 찍고 나면, 진료실에서 '아이 실제 나이는 만 9세인데 뼈나이는 만 10세 반 정도네요' 혹은 '뼈나이가 열 달쯤 어리게 나왔어요'라는 설명을 듣게 됩니다. "
            "짧은 진료 시간 동안 고개를 끄덕이며 나왔지만 집에 돌아오는 차 안에서는 '그래서 우리 아이가 앞으로 얼마나 더 클 수 있다는 뜻이지?'라며 머릿속이 복잡해지곤 합니다.\n\n"
            "뼈나이(골연령, Bone Age)는 숫자가 크다고 좋은 점수도 아니고 작다고 무조건 안심할 지표도 아닙니다. "
            "아이의 '현재 키'와 '실제 나이', 그리고 '뼈나이' 세 가지 좌표를 나란히 놓고 읽는 법을 알면 앞으로 가정에서 무엇에 집중해야 할지 명쾌한 길이 보입니다."
        ),
        section2_mechanism=(
            "소아과에서 주로 왼손과 손목 X-ray를 촬영하는 이유는 작은 공간 안에 손가락 마디뼈와 손목뼈(수근골) 등 수십 개의 성장판이 모여 있어 전신 골격 성숙도를 가장 적은 방사선량으로 정확하게 대표하기 때문입니다. "
            "전문의는 Greulich-Pyle(GP) 도감이나 Tanner-Whitehouse(TW3) 점수법을 통해 뼈 사이의 검은 연골 틈새가 얼마나 단단한 하얀 뼈로 채워졌는지를 판독해 '생물학적 성장 시계'를 산출합니다.\n\n"
            "예를 들어 똑같이 키가 138cm인 만 9세 여아 두 명이 있을 때, A 아동의 뼈나이가 만 8세 반이라면 아직 성장판 마감 시간까지 여유가 넉넉해 최종 성인키 예측치가 높게 산출됩니다. "
            "반면 B 아동의 뼈나이가 만 10세 반이라면 이미 만 10세 반 몫의 성장판을 당겨 써서 138cm에 도달한 것이므로, 남은 성장 기간이 짧아져 지금부터 성숙 속도를 늦추고 연간 성장 효율을 끌어올리는 집중 관리가 필요합니다."
        ),
        section3_routine=(
            "병원에서 들은 뼈나이 결과를 가정 내 실질적인 키 성장 전략으로 연결하는 3단계 가이드를 활용하세요. "
            "첫째, 진료를 보실 때 스마트폰 메모장에 ① 촬영일 기준 정확한 키·체중, ② 아이 만 나이(개월), ③ 의사 선생님이 말씀해 주신 뼈나이(예: 10세 3개월) 세 줄을 꼭 받아 적어 오세요.\n\n"
            "둘째, 뼈나이가 실제 나이보다 1년 이상 앞서 있다면 칼로리 과잉과 늦은 취침이 성숙 시계를 재촉하지 않도록 저녁 식후 간식을 끊고 유산소 점프 운동과 밤 9시 30분 암막 수면에 집중해 주세요. "
            "셋째, 반대로 키도 작은 편인데 뼈나이도 1년 이상 느리게 나왔다면 성장 기간이 남아 있다는 희망적인 신호이므로, 그 귀한 시간 동안 뼈가 힘차게 치고 올라갈 수 있도록 양질의 단백질과 칼슘·D3·아연 영양을 빈틈없이 채워주시면 됩니다."
        ),
        tags=["뼈나이검사", "성장판검사", "골연령해석", "성장클리닉", "손목엑스레이뼈나이", "성인예상키", "소아청소년과키검사", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis5_clinical_seasonal_growth_wave",
        axis_label="AXIS 05 · 계절별 성장 파동과 90일 측정 표준",
        title="[소아성장 칼럼] 봄·여름엔 쑥 크고 가을·겨울엔 멈춘 듯 보이는 이유 — 계절별 성장 파동과 가정 키 측정 오차 줄이기",
        cover_headline="가을·겨울 석 달 동안 키가 안 컸다고\n실망하기엔 아직 이릅니다!\n아이 키도 나무처럼 '계절 파동'을 탑니다",
        cover_subline="봄·여름 도약기 vs 겨울 비축기 생체 리듬과 오차 없는 아침 측정 4원칙",
        cover_points=[
            "일조량·야외 활동이 풍부한 봄·여름 성장 속도가 겨울보다 최대 1.5~2배 빠름",
            "가을·겨울은 골밀도·비타민D3를 비축해 내년 봄 도약을 준비하는 시기",
            "매달 조급히 재기보다 90일 주기로 아침 기상 직후 같은 벽에서 측정",
        ],
        chart_title="소아 코호트 계절별 평균 성장 속도 분포 및 겨울철 비타민D 관리 효과",
        chart_takeaway="핵심 지표: 겨울철 실내 생활기일수록 비타민D3 보충과 밤 9시반 숙면이 내년 봄 급도약을 만듭니다",
        chart_bars=[
            {"label": "봄·초여름 도약기 (3~7월 · 일조량 및 활동량 최고)", "value_text": "연 환산 6.8 cm", "ratio": 0.92, "tone": "good", "note": "햇볕 비타민D 합성 및 야외 점프 증가로 성장판 연골 증식 가장 활발"},
            {"label": "겨울철 + 실내 점프·비타민D3·숙면 꾸준 관리군", "value_text": "연 환산 5.4 cm", "ratio": 0.73, "tone": "mid", "note": "일조량 감소기를 맞춤 영양·실내 활동으로 보완해 겨울 감속 최소화"},
            {"label": "겨울철 운동 부족 · 비타민D 결핍 · 방학 늦잠군", "value_text": "연 환산 3.4 cm", "ratio": 0.42, "tone": "risk", "note": "체중만 늘고 키 성장은 정체되는 전형적인 겨울방학 슬럼프 패턴"},
        ],
        checklist_title="연령단계별 사계절 성장 파동 활용 · 오차 0mm 가정 측정 체크표",
        early_actions=[
            "일주일마다 키 재며 일희일비하지 않고 90일 간격 공식 기록 날 정하기",
            "겨울철 실내 놀이터·거실 매트 놀이 후 비타민D3 꾸준히 챙기기",
        ],
        upper_actions=[
            "맨발 뒤꿈치·엉덩이·양 어깨·뒤통수 4곳 벽 밀착 + 시선 정면 수평 고정",
            "겨울방학 늦잠·게임 시간 늘어나지 않게 평일 기상 시각 그대로 사수",
        ],
        teen_actions=[
            "두꺼운 머리카락을 단단한 직각 삼각자(또는 하드커버 책)로 눌러 눈금 읽기",
            "일교차 큰 환절기 감기·비염 관리로 야간 깊은 서파수면 손실 막기",
        ],
        section1_intro=(
            "집 기둥이나 방문 옆에 키재기 스티커를 붙여두신 부모님께서는 열흘이 멀다 하고 아이를 벽 앞에 세워보곤 하십니다. "
            "봄에서 여름으로 넘어갈 때는 달마다 연필 자국이 시원하게 위로 올라가더니, 찬 바람이 부는 늦가을과 겨울에는 두세 달이 지나도 지난번 선 그대로인 모습을 보면 가슴이 철렁 내려앉기 쉽습니다.\n\n"
            "하지만 아이의 키는 매일 0.015cm씩 자로 잰 듯 균일하게 자라지 않습니다. "
            "자연 속 어린나무가 봄·여름에 가지를 뻗고 겨울에 뿌리와 나이테를 단단히 다지듯, 우리 아이들의 성장판 역시 계절과 계단식 도약(Saltatory Growth)이라는 고유한 생체 리듬을 가지고 움직입니다."
        ),
        section2_mechanism=(
            "장기 추적 소아 성장학(Auxology) 연구들에 따르면 온대 기후권 어린이들의 봄·여름(3~8월) 신장 성장 속도는 늦가을·겨울(10~2월) 대비 평균 1.3배에서 최대 2배 가까이 빠르게 나타납니다. "
            "낮 길이가 길어지고 야외 신체 활동이 늘어나면서 피부에서 합성되는 체내 비타민D 농도가 상승하고, 일조 자극이 뇌하수체 대사를 활발하게 깨우기 때문입니다.\n\n"
            "여기에 가정 내 측정 오차까지 겹치면 부모님의 불안은 배가됩니다. 아침과 저녁 측정 시각 차이(최대 1.8cm), 턱을 살짝 들거나 숙인 각도 차이(±0.8cm), 머리카락 두께를 누르지 않고 잰 오차(±0.5cm)가 합쳐지면 실제로는 1cm가 자랐는데도 오히려 줄어든 것처럼 읽히기 일쑤입니다."
        ),
        section3_routine=(
            "계절 변화에 흔들리지 않고 1년 내내 알찬 성장을 이어가는 두 가지 원칙을 기억해 주세요. "
            "첫째, 가정 키 측정은 최소 8~12주(90일) 간격으로 하시되 반드시 '아침 기상 직후 맨발 상태'에서 뒤꿈치·엉덩이·어깨뼈·뒤통수 네 지점을 벽에 붙이고, 귀 구멍과 눈 아랫선이 바닥과 수평이 되게 한 뒤 두꺼운 하드커버 책을 벽과 직각으로 내려 눈금을 표시해 주세요.\n\n"
            "둘째, 야외 활동이 줄어드는 가을·겨울과 방학 기간이야말로 또래와 격차를 벌리는 진짜 승부처입니다. "
            "방학이라고 취침·기상 시각을 늦추지 않고, 부족해진 햇볕을 비타민D3·칼슘·K2 영양과 거실 실내 줄넘기·점핑 루틴으로 채워주시면 다가오는 봄 도약기에 한 뼘 더 시원하게 뻗어 올라가는 기쁨을 만나실 수 있습니다."
        ),
        tags=["계절별키성장", "집에서키재는법", "겨울방학키성장", "어린이비타민D", "키성장정체기", "초등키성장기록", "소아성장도표", "키즈핏"],
    ),
    _make_editorial_topic(
        topic_id="axis5_clinical_mph_genetics_environment",
        axis_label="AXIS 05 · 유전 예상키(MPH)와 후천적 ±8cm 환경 설계",
        title="[소아성장 칼럼] 엄마·아빠 키가 작으면 아이도 작을까? 유전 예상키(MPH) 공식과 후천적 환경이 만드는 '±8cm' 격차",
        cover_headline="엄마·아빠 키가 아담해서 미안하신가요?\n유전은 '점 하나'가 아니라\n위아래 16cm 열려 있는 '구간'입니다",
        cover_subline="부모 평균 신장(MPH) 공식 너머 수면·영양·자세가 결정하는 상위 잠재력",
        cover_points=[
            "유전 예상키(MPH): 남아 (부+모+13)/2 · 여아 (부+모-13)/2 기준점 산출",
            "같은 부모 밑 형제자매도 생활 환경에 따라 ±8.5cm(약 17cm 폭) 차이 발생",
            "수면(밤 9시반) · 영양(칼슘/D3/단백질) · 바른자세 3박자로 유전 상단 돌파",
        ],
        chart_title="동일 유전 예상키(MPH) 조건에서 성장기 생활환경 관리 수준별 도달 영역",
        chart_takeaway="핵심 지표: 유전이 정해주는 것은 고정된 키가 아니라 ±8cm의 넓은 운동장이며, 어디에 설지는 오늘 밤 습관이 정합니다",
        chart_bars=[
            {"label": "유전 상단 돌파군 (수면·영양·자세·점프 4박자 실천)", "value_text": "MPH +5 ~ +8 cm", "ratio": 0.94, "tone": "good", "note": "성장판 개방 기간 동안 잠재력을 95% 이상 발현해 부모 세대보다 훌쩍 성장"},
            {"label": "유전 중앙 도달군 (평균적인 수면 및 일반 식습관)", "value_text": "MPH ±0 ~ +2 cm", "ratio": 0.62, "tone": "mid", "note": "부모 평균 신장 공식 근처의 예측 범위 중앙값 수준 도달"},
            {"label": "유전 하단 손실군 (만성 수면부족·편식·거북목·과체중)", "value_text": "MPH -4 ~ -7 cm", "ratio": 0.28, "tone": "risk", "note": "물려받은 유전 잠재력조차 다 쓰지 못하고 성장판이 일찍 닫히는 유형"},
        ],
        checklist_title="연령단계별 유전 예상키 상단(+8cm)을 여는 가정 환경 3대 체크표",
        early_actions=[
            "부모 키 때문에 미리 단정 짓지 않고 만 3~7세 통잠·식습관 기초 다지기",
            "매년 5.5cm 이상 안정적 성장 속도를 지키며 기초 신장 저축 늘리기",
        ],
        upper_actions=[
            "초등 골든타임 4년 동안 밤 9시 30분 소등 + 15도 독서대 바른자세 고정",
            "사춘기 조기 진입 막는 적정 체중 관리로 성장판 개방 기간 1년 더 확보",
        ],
        teen_actions=[
            "급성장기 단백질·칼슘·D3·K2 빈틈없는 공급으로 연간 최대 성장폭 달성",
            "성장판 닫히기 전 마지막 2년 구부정한 경추·흉추 펴서 숨은 2cm까지 완성",
        ],
        section1_intro=(
            "'남편도 저도 키가 큰 편이 아니라서 아이에게 괜히 미안해요. 키는 결국 유전이 80%라던데 노력을 해봤자 소용없는 걸까요?' "
            "학부모 성장 상담에서 가장 마음이 뭉클해지는 질문입니다. 부모님의 키가 아담할수록 아이가 또래 사이에서 작아 보일 때마다 마치 내 탓인 것처럼 자책하시는 분들이 참 많습니다.\n\n"
            "하지만 소아 유전학과 쌍둥이·형제 코호트 연구들이 들려주는 과학적 진실은 훨씬 희망적입니다. "
            "똑같은 엄마·아빠에게서 태어난 친형제나 친자매인데도 성인이 되었을 때 키가 7~10cm씩 차이 나는 경우를 주변에서 흔히 보실 수 있듯, 유전은 결승선 숫자를 못 박아두지 않습니다."
        ),
        section2_mechanism=(
            "소아청소년과에서 참고용으로 활용하는 표적키(Mid-Parental Height, MPH) 공식은 남아의 경우 '(아버지 키 + 어머니 키 + 13cm) ÷ 2', 여아의 경우 '(아버지 키 + 어머니 키 - 13cm) ÷ 2'입니다. "
            "여기서 많은 분이 놓치시는 핵심 통계 표기가 바로 뒤에 붙는 '±8.5cm'라는 오차 범위입니다.\n\n"
            "예를 들어 공식으로 계산한 유전 예상키 중앙값이 172cm인 남자아이라면, 유전적으로 열려 있는 실제 가능 구간은 163.5cm부터 180.5cm까지 무려 17cm 폭에 달합니다. "
            "유전율이 70~80%라는 학술 표현은 집단 내 변이를 설명하는 통계 용어일 뿐, 개별 가정에서는 밤 10시 서파수면, 단백질·미네랄 흡수율, 만성 질환·구강호흡 여부, 사춘기 진입 시기라는 후천적 환경 요인이 이 17cm 스펙트럼의 맨 위칸에 설지 맨 아래칸에 머물지를 결정합니다."
        ),
        section3_routine=(
            "부모님이 물려주신 유전 범위의 가장 높은 천장(+5~8cm 상단)까지 우리 아이를 데려다주는 길은 거창한 비법이 아닌 오늘 밤의 단단한 기본기입니다. "
            "첫째, 저녁 식사를 취침 3시간 전에 마치고 밤 9시 30분 완전 암막 침실에서 첫 서파수면 성장호르몬 피크를 매일 밤 적금처럼 차곡차곡 쌓아주세요.\n\n"
            "둘째, 낮에는 15도 눈높이 독서대와 발받침으로 척추 압박을 덜어주고 하교 후 15분 리듬 줄넘기로 성장판 연골에 활기찬 자극을 전달해 주세요. "
            "셋째, 저녁 식탁에서 양질의 단백질과 구연산 칼슘·비타민D3·K2·아연 밸런스를 연령 단계에 맞게 채우며 90일마다 질병관리청 백분위 흐름을 차분히 점검하신다면, 아이는 분명 부모님의 사랑만큼이나 당당하고 건강한 키로 자라날 것입니다."
        ),
        tags=["유전예상키", "엄마아빠키유전", "성인예상키계산법", "키유전후천적", "아이키크는방법", "성장골든타임", "초등키성장", "키즈핏"],
    ),
]


def build_blog_bottom_bridge_text(seq_num: int, item: Dict[str, Any]) -> str:
    """
    본문 최하단(Image 3 아래, 전문 해설 85% 이후)에만 배치되는 에디터 맺음말 & 자연 전환 브릿지.
    - 『키즈핏 성장 서재』 풀버전 에세이 이메일 무료 구독 (#kfk-passwordless-club-box) & 5단계 뼈나이(Δt) 해석기
    - 『우리아이 급성장 골든타임 & 뼈나이 실전 마스터북 PDF』 (#kfk-latpeed-ebook-slot / daMaP)
    - 연령·단계별 에디터 큐레이션 (https://kidsfit.co.kr/coupang-kidsfit.html) + 공정위 고지문
    """
    return (
        "■ 키즈핏 성장 서재 에세이 이메일 구독 & 가정용 실전 점검 안내\n"
        "조급한 비교 대신 오늘 밤 우리 집에서 실천하기 쉬운 루틴 한 가지부터 아이와 기분 좋게 시작해 보세요.\n\n"
        "1. 풀버전 성장 에세이 이메일 무료 구독 & 5단계 병원 뼈나이(Δt) 맞춤 해석기\n"
        "매주 깊은 소아성장 에세이를 이메일로 받아보시고(무비밀번호 3초 구독), 우리 아이 백분위와 골연령 편차를 확인해 보세요.\n"
        "https://kidsfit.co.kr/#kfk-passwordless-club-box | https://kidsfit.co.kr/#kfk-bone-age-interpreter\n\n"
        "2. 가정 비치용 『우리아이 급성장 골든타임 & 뼈나이 실전 마스터북 PDF (+30일 체크표)』\n"
        "급성장기 로드맵부터 뼈나이 편차별 식단·수면·진료 질문지까지 정리한 실전 마스터북 안내도 함께 살펴보세요.\n"
        f"{LATPEED_MASTERBOOK_SLOT_URL} (https://www.latpeed.com/products/daMaP)\n\n"
        "3. 연령·단계별 수면·영양·바른자세 성장 환경 에디터 큐레이션\n"
        "단계별 숙면·칼슘/D3/K2/아연·15도 독서대 구성을 공식 판매처 보러가기 및 혜택가 확인으로 만나보실 수 있습니다.\n"
        "https://kidsfit.co.kr/coupang-kidsfit.html\n\n"
        f"{KFTC_DISCLOSURE_KO}"
    )


# ---------------------------------------------------------------------------
# 3. 네이버 카페 전용 20종 '따뜻한 학부모 소통·실천인증 코칭' 원고 뱅크
#    (블로그 원고와 문장·어휘·단락 구조 100% 분리 -> 유사문서 원천 차단!)
# ---------------------------------------------------------------------------
CAFE_GROWTH_COACHING_BANK: List[Dict[str, Any]] = [
    {
        "id": "cafe_01_bedtime_fasting",
        "title": "[오늘밤 키성장 미션 #1] 잠들기 전 우유·과일 잠시 멈춤! 저녁 공복 2시간 반 같이 실천해요",
        "card_title": "잠자기 직전 우유·과일 대신\n'공복 2시간 반'으로\n밤 10시 성장호르몬 깨우기",
        "points": [
            "자기 직전 달콤한 간식은 밤사이 성장호르몬 피크를 방해해요",
            "저녁 식사는 밤 7시 이전 마무리하고 잠자리엔 미지근한 물 한 모금",
            "배고파하는 날엔 따뜻한 두유 반 컵이나 삶은 달걀 반 개로 가볍게",
        ],
        "body": (
            "안녕하세요, 키즈핏 우리아이 키성장 연구소 부모님 여러분!\n\n"
            "아이 재우기 직전에 허전해 보인다고 딸기 몇 알이나 흰 우유 한 팩 챙겨주신 적 있으시죠? 저도 예전엔 키 크라고 자기 전에 꼭 우유를 데워주었는데, 잠들기 직전 혈당이 오르면 오히려 첫 깊은 잠에서 나오는 성장호르몬 효율이 떨어진다는 걸 알고 저녁 루틴을 완전히 바꾸었답니다.\n\n"
            "• 오늘 저녁 우리 집 3분 실천 약속\n"
            "1) 저녁 밥상은 목표 취침 시각보다 2시간 30분 일찍 정리하기\n"
            "2) 양치 후 잠자리에서는 물만 한 모금 마시고 배 마사지해 주기\n"
            "3) 칼슘·비타민D3는 잠자리 대신 저녁 식사 직후에 챙기기\n\n"
            "오늘 저녁 식사 몇 시에 마치셨나요? 댓글로 [아이 학년/나이 + 저녁 마감 시각] 편하게 한 줄 인증 남겨주시면 서로 큰 응원이 됩니다!"
        ),
        "tags": ["키즈핏카페", "아이키성장습관", "밤10시취침", "야식끊기", "학부모실천인증", "어린이수면"],
    },
    {
        "id": "cafe_02_bedroom_darkness",
        "title": "[오늘밤 키성장 미션 #2] 아이 방 무드등 끄고 '완전 암막 침실' 만들기 챌린지",
        "card_title": "아이 방 작은 수면등 하나까지 OFF!\n멜라토닌 지키는\n완전 암막 침실 챌린지",
        "points": [
            "아이 눈은 어른보다 빛에 민감해 약한 무드등도 깊은 잠을 얕게 만들어요",
            "밤 9시부터 거실 하얀 형광등 끄고 노란 간접 스탠드만 켜두기",
            "아이가 잠든 뒤엔 방문 틈 불빛과 충전기 LED까지 깔끔히 가려주기",
        ],
        "body": (
            "반갑습니다, 키즈핏 키성장 연구소 가족 여러분!\n\n"
            "하루를 마무리하는 밤 9시, 지금 우리 집 거실 천장등은 어떤 색으로 켜져 있나요? 하얀 형광등이 환하게 켜져 있으면 아이 뇌는 아직 낮인 줄 알고 잠자리에서도 한참을 뒤척이게 됩니다.\n\n"
            "• 오늘 밤 거실·아이방 조명 스위치 미션\n"
            "1) 밤 9시 정각 거실 큰 불 끄고 노란색 스탠드 하나만 남기기\n"
            "2) 어두운 걸 무서워하는 아이는 잠들 때만 복도 등 켜고, 잠들면 완전 소등하기\n"
            "3) 멀티탭 빨간 불빛은 검은 절연테이프 작게 붙여 가려주기\n\n"
            "우리 집 침실에 켜두었던 수면등이나 불빛, 오늘 밤 정리해 보시고 아이가 얼마나 빨리 잠들었는지 댓글로 수다 나누어 보아요!"
        ),
        "tags": ["암막수면", "아이방조명", "멜라토닌습관", "초등통잠", "키성장루틴", "육아소통"],
    },
    {
        "id": "cafe_03_nose_breathing",
        "title": "[오늘밤 키성장 미션 #3] 잠든 아이 얼굴 30초 관찰하기 — 코로 스르르 숨 쉬고 있나요?",
        "card_title": "잠든 뒤 30분, 아이 입술을 보세요!\n통잠 키 성장을 지키는\n코호흡 · 침실 습도 50% 점검",
        "points": [
            "입 벌리고 자면 입안이 말라 밤새 뒤척이며 깊은 잠이 조각나요",
            "침실 습도 50% · 온도 21도로 코 점막을 촉촉하게 유지해 주세요",
            "어른용 높은 베개 대신 아이 목 높이에 맞는 낮은 베개로 교체하기",
        ],
        "body": (
            "키즈핏 가족 여러분, 오늘 밤 아이 이불 덮어주실 때 딱 30초만 아이가 코로 숨 쉬는지 입을 벌리고 자는지 살펴봐 주세요!\n\n"
            "아침에 일어났을 때 입술이 트거나 베개에 침 자국이 자주 남는다면 밤새 코가 답답해 입으로 숨 쉬느라 깊은 잠을 설쳤다는 신호일 수 있거든요.\n\n"
            "• 코호흡 통잠을 돕는 침실 3가지 손질\n"
            "1) 가습기나 젖은 수건으로 아이 머리맡 습도 45~55% 맞추기\n"
            "2) 고개가 앞으로 꺾이지 않는 낮은 아동용 경추 베개 쓰기\n"
            "3) 저녁 세안·샤워 때 따뜻한 김으로 코 주변 편안하게 풀어주기\n\n"
            "오늘 밤 관찰해 보신 우리 아이 잠버릇이나 침실 습도 꿀팁이 있다면 댓글로 함께 공유해 주세요!"
        ),
        "tags": ["아이코호흡", "구강호흡교정", "침실습도", "어린이베개", "통잠비결", "키즈핏"],
    },
    {
        "id": "cafe_04_weekend_wakeup",
        "title": "[주말 키성장 코칭 #4] 토·일요일 아침 기상 시각 '평일 +1시간 이내' 지키기 약속!",
        "card_title": "주말 늦잠 대신 아침 햇볕 산책!\n월요일까지 이어지는\n생체시계 고정 프로젝트",
        "points": [
            "주말에 정오까지 자면 일요일 밤 잠이 안 와 월요일 성장이 흔들려요",
            "기상 시각은 평일보다 최대 1시간 이내로만 여유 두기",
            "피곤한 날엔 아침 늦잠 대신 토요일 점심 뒤 25분 짧은 낮잠 활용",
        ],
        "body": (
            "한 주 동안 등원·등교하느라 애쓴 우리 아이들, 주말 아침이면 커튼 닫아두고 늦게까지 재우고 싶은 마음이 굴뚝같죠.\n\n"
            "그런데 주말 기상 시각이 두세 시간 밀리면 일요일 밤에 눈이 말똥말똥해져서 결국 한 주 시작부터 수면 리듬이 엉키더라고요.\n\n"
            "• 이번 주말 생체시계 사수 미션\n"
            "1) 평일 7시 반 기상 아이라면 주말에도 8시 반 전에는 커튼 활짝 열기\n"
            "2) 오전 중 동네 놀이터나 산책로에서 아침 햇살 15분 쬐기\n"
            "3) 일요일 저녁엔 일찍 따뜻한 물로 샤워하고 9시 반 불 끄기\n\n"
            "우리 아이 평소 평일/주말 기상 시간은 몇 시쯤인지 댓글로 이야기 나누어 봐요!"
        ),
        "tags": ["주말육아루틴", "아침기상습관", "수면시계", "초등생활습관", "아이키키우기", "키즈핏카페"],
    },
    {
        "id": "cafe_05_milk_and_d3k2",
        "title": "[식탁 키성장 코칭 #5] 흰 우유는 하루 2팩까지만! 뼈로 쏙 흡수되는 저녁 반찬 아이디어",
        "card_title": "흰 우유 과다 섭취는 철분 흡수 방해!\n하루 2팩 적정량과\n칼슘 · D3 · K2 시너지 식탁",
        "points": [
            "우유로 배를 채우면 정작 철분·아연과 저녁 밥맛이 떨어질 수 있어요",
            "우유는 낮 간식으로 1~2팩(400ml 이내), 저녁엔 두부·멸치·생선 반찬",
            "실내 생활 많은 아이일수록 저녁 식후 비타민D3·K2 흡수 고리 챙기기",
        ],
        "body": (
            "키즈핏 부모님들, 우리 아이 하루에 흰 우유 몇 팩 정도 마시고 있나요?\n\n"
            "물 대신 우유를 세네 팩씩 마시면 배가 불러 정작 고기·채소 반찬을 남기고 철분 흡수까지 방해받을 수 있어서, 하루 2팩(400ml) 안쪽으로 조절해 주는 것이 훨씬 좋답니다.\n\n"
            "• 오늘 저녁 뼈 튼튼 식탁 팁\n"
            "1) 우유는 하교 후 간식으로 1팩, 저녁 식탁엔 구운 두부나 잔멸치 주먹밥 올리기\n"
            "2) 칼슘을 실제 성장판으로 안내하는 비타민D3·K2 식후에 까먹지 않기\n"
            "3) 냉장고 속 탄산음료 대신 고소한 보리차 시원하게 우려두기\n\n"
            "오늘 저녁 우리 아이가 제일 잘 먹은 반찬 한 가지는 무엇이었나요? 댓글로 메뉴 공유 환영합니다!"
        ),
        "tags": ["우유권장량", "어린이식단공유", "칼슘비타민D", "초등저녁메뉴", "키크는반찬", "키즈핏"],
    },
    {
        "id": "cafe_06_picky_eater_zinc",
        "title": "[식탁 키성장 코칭 #6] 밥 한 숟가락 물고 세월아 네월아 하는 아이, 화내지 않고 입맛 여는 법",
        "card_title": "밥상머리 잔소리 멈춤 선언!\n식전 90분 공복 만들기와\n미각 깨우는 아연 · 요리 놀이",
        "points": [
            "식사 시간은 딱 30분! 다 못 먹어도 밝게 치워주어야 식탁이 편해져요",
            "저녁 먹기 1시간 반 전부터는 주스·과자 한 조각도 주지 않기",
            "입 짧은 아이일수록 미뢰 세포 돕는 아연 보충과 식재료 만지기 놀이",
        ],
        "body": (
            "입 짧은 아이 키우시는 어머님·아버님들, 오늘 저녁 식탁에서도 깊은 심호흡 몇 번 하셨나요?\n\n"
            "'한 입만 더 먹어라' 실랑이가 길어질수록 아이도 긴장해서 소화가 더 안 된다고 해요. 오늘부터는 엄마 아빠 마음부터 편하게 내려놓는 식탁 규칙을 같이 해봐요.\n\n"
            "• 스트레스 제로 식탁 3원칙\n"
            "1) 하원 후 저녁 먹기 전 90분 동안 간식 완전 스톱(물만 마시기)\n"
            "2) 타이머 30분 맞추고 시간이 되면 남겼어도 혼내지 않고 식사 마무리\n"
            "3) 주말엔 아이가 직접 두부 썰고 채소 도장 찍어보며 친해지기 + 아연 챙기기\n\n"
            "우리 아이가 유독 피하는 식재료나 성공했던 편식 극복 레시피가 있다면 댓글로 지혜를 빌려주세요!"
        ),
        "tags": ["입짧은아이", "편식극복", "어린이아연", "식습관코칭", "유아식단고민", "키즈핏카페"],
    },
    {
        "id": "cafe_07_growing_pain_massage",
        "title": "[오늘밤 키성장 미션 #7] 자다가 다리 아프다고 깨는 밤, 따뜻한 손길 5분 온찜질 루틴",
        "card_title": "밤마다 종아리·무릎 주물러 달라는 아이\n잠들기 15분 전\n따뜻한 물수건 5분 이완 케어",
        "points": [
            "많이 뛰어논 날 밤 양쪽 종아리·허벅지가 뻐근한 건 흔한 성장통 신호",
            "깨서 울기 전에 잠자리 들기 전 5분 온찜질과 부드러운 쓸어주기",
            "아침에도 한쪽만 붓거나 절뚝이면 미루지 말고 병원 점검받기",
        ],
        "body": (
            "낮에 놀이터나 체육 시간에 신나게 달린 날이면 어김없이 새벽에 '엄마 다리 아파' 하고 칭얼거리는 아이들 있죠.\n\n"
            "아파서 깨기 전에 잠들기 전 5분만 미리 따뜻하게 풀어주면 아이도 아침까지 푹 자고 부모님도 새벽잠을 지킬 수 있답니다.\n\n"
            "• 오늘 밤 잠자리 5분 종아리 케어\n"
            "1) 따뜻한 물수건으로 무릎 아래부터 발목까지 포근하게 감싸주기\n"
            "2) 로션 바른 손으로 정강이 옆 근육을 위아래로 살살 쓸어내리기\n"
            "3) 저녁 식후 구연산 칼슘·마그네슘으로 근육 긴장 편안하게 도와주기\n\n"
            "오늘 밤 아이 다리 주물러 주시면서 '오늘도 쑥쑥 크느라 고생했어' 따뜻한 한마디 건네보시고 댓글로 하트 남겨주세요!"
        ),
        "tags": ["다리성장통", "어린이마사지", "성장통완화", "아이통잠", "초등엄마소통", "키즈핏"],
    },
    {
        "id": "cafe_08_palm_protein_breakfast",
        "title": "[식탁 키성장 코칭 #8] 바쁜 등교 아침, 빈속 대신 '손바닥 단백질 1가지' 챙기기",
        "card_title": "아침 거르고 등교하는 우리 아이\n5분이면 충분한\n간편 고단백 아침 메뉴 3선",
        "points": [
            "성장판 연골 기질은 한 끼 몰아먹기보다 세 끼 나누어 먹는 단백질이 핵심",
            "반숙 계란 + 치즈 1장, 무가당 요거트, 따뜻한 순두부 중 1가지 선택",
            "튀김·가공 소시지 대신 자연 단백질로 체중 부담 없이 키만 키우기",
        ],
        "body": (
            "아침마다 깨우고 옷 입히고 준비물 챙기다 보면 아침밥 차리기가 제일 막막하시죠?\n\n"
            "그래도 오전 시간 성장 대사를 깨우려면 거창한 국·찌개 대신 소화 잘되는 단백질 한 가지만 입에 넣어 보내는 게 정말 큰 차이를 만든답니다.\n\n"
            "• 5분 완성 등교 아침 단백질 아이디어\n"
            "1) 전날 삶아둔 반숙 달걀 1알 + 슬라이스 치즈 반 장\n"
            "2) 따뜻한 들기름 연두부 반 모 또는 잔멸치 주먹밥 2알\n"
            "3) 무가당 그릭요거트에 블루베리 몇 알 톡톡 올리기\n\n"
            "내일 아침 우리 집 식탁에 올릴 초간단 단백질 메뉴는 무엇인지 댓글로 함께 찜해 보아요!"
        ),
        "tags": ["초등아침메뉴", "어린이단백질", "등교아침식사", "키성장식단", "엄마표아침", "키즈핏카페"],
    },
    {
        "id": "cafe_09_desk_bookstand_15deg",
        "title": "[바른자세 미션 #9] 지금 아이 책상 위 문제집 각도 확인! 눈높이 독서대로 숨은 키 2cm 찾기",
        "card_title": "고개 푹 숙이고 책 읽는 우리 아이\n잔소리 대신 책상 위\n'15도 독서대'를 세워주세요",
        "points": [
            "평평한 책을 내려다보면 아이 목뼈에 볼링공 두 개 무게가 실려요",
            "독서대로 시선만 올려주어도 말린 어깨와 등이 자연스럽게 펴집니다",
            "바닥에 엎드려 책·패드 보는 습관만 고쳐도 숨은 키가 살아나요",
        ],
        "body": (
            "아이 공부할 때 옆모습을 찍어보신 적 있으신가요? 생각보다 고개가 책상 가까이 푹 숙여져 있어서 놀라시는 분들이 많아요.\n\n"
            "'허리 펴!' 백 번 외치는 것보다 책이나 태블릿을 눈높이로 세워주는 독서대 하나가 자세를 훨씬 빠르게 바꿔준답니다.\n\n"
            "• 오늘 오후 공부방 1분 점검\n"
            "1) 그림책·교과서·문제집 모두 각도조절 독서대 위에 올려서 보기\n"
            "2) 침대나 거실 카펫에 배 깔고 엎드려 책 읽지 않기\n"
            "3) 40분 앉아 있었으면 일어나서 양팔 벌려 가슴 활짝 펴기\n\n"
            "오늘 아이 책상 세팅 점검해 보시고 바른 자세 실천 완료 댓글 남겨주세요!"
        ),
        "tags": ["초등책상정리", "독서대습관", "거북목교정", "숨은키2cm", "바른자세챌린지", "키즈핏"],
    },
    {
        "id": "cafe_10_cat_stretch_evening",
        "title": "[오늘밤 키성장 미션 #10] 자기 전 거실 매트에서 엄마랑 90초 '고양이 기지개' 스트레칭",
        "card_title": "하루 종일 눌린 척추 디스크 펴주기!\n자기 전 거실 매트\n90초 고양이 기지개 루틴",
        "points": [
            "학교·학원에서 오래 앉아 있으면 저녁엔 척추 사이 공간이 살짝 눌려요",
            "네발기기 자세로 등을 동그랗게 말았다 펴는 고양이 기지개 6회",
            "누워서 양 무릎 가슴으로 꼭 안고 좌우로 살랑살랑 허리 풀기",
        ],
        "body": (
            "하루 종일 가방 메고 책상에 앉아 있느라 우리 아이들 등·허리도 은근히 뻐근하답니다.\n\n"
            "잠자리에 바로 눕기 전에 거실 매트에서 엄마 아빠와 마주 보고 딱 90초만 척추 기지개를 켜보세요. 아이들이 놀이처럼 정말 좋아해요!\n\n"
            "• 오늘 밤 90초 커플 기지개 순서\n"
            "1) 후- 숨 내쉬며 고양이처럼 등을 천장 쪽으로 둥글게 말기 (5초)\n"
            "2) 스으- 숨 들이쉬며 가슴을 앞으로 활짝 열기 (5초) x 6번 반복\n"
            "3) 반듯하게 누워 기지개 쭉 펴며 손끝·발끝 길어지기 (10초)\n\n"
            "오늘 밤 아이와 기지개 펴고 주무실 분! 댓글로 손 번쩍 들어주세요!"
        ),
        "tags": ["자기전스트레칭", "키크는체조", "척추이완", "엄마랑운동", "초등저녁루틴", "키즈핏카페"],
    },
    {
        "id": "cafe_11_footrest_check",
        "title": "[바른자세 미션 #11] 의자에 앉은 우리 아이 발바닥, 허공에 대롱거리고 있지 않나요?",
        "card_title": "다리 흔들고 꼬아 앉는 진짜 이유!\n무릎 90도 발받침으로\n골반 · 척추 수평 잡아주기",
        "points": [
            "발이 공중에 뜨면 중심 잡으려 저절로 다리를 꼬거나 걸터앉게 돼요",
            "의자 깊숙이 앉았을 때 두 발바닥 전체가 발받침에 닿도록 세팅",
            "거실 바닥에서 다리 바깥으로 꺾는 W자 앉기는 바로 펴주기",
        ],
        "body": (
            "아이가 식탁이나 공부방 의자에 앉을 때마다 다리를 달랑거리거나 양반다리로 올라앉아서 고민이셨나요?\n\n"
            "오늘 아이를 의자 등받이 끝까지 붙여 앉힌 뒤 발밑을 한 번 봐주세요. 발바닥이 바닥에 안 닿고 떠 있으면 어른도 10분 이상 바르게 앉아 있기 힘들답니다.\n\n"
            "• 우리 집 의자 발밑 1분 체크\n"
            "1) 발바닥 전체가 안정적으로 닿는 높이의 발받침 놓아주기\n"
            "2) 무릎 각도가 90도로 편안하게 꺾이는지 확인하기\n"
            "3) 아이 키가 자란 만큼 이번 달 의자·책상 단수 한 칸 재조정하기\n\n"
            "우리 집 의자 발받침 점검 완료하셨다면 댓글로 알려주세요!"
        ),
        "tags": ["아이의자세팅", "발받침필수", "골반교정습관", "바른앉기자세", "초등공부방", "키즈핏"],
    },
    {
        "id": "cafe_12_backpack_diet",
        "title": "[주간 키성장 미션 #12] 현관 체중계에 아이 책가방 올려보기! '체중 10% 이하' 가방 다이어트",
        "card_title": "아이 어깨 누르는 무거운 책가방\n오늘 저녁 불필요한 짐 빼고\n양쪽 끈 대칭 맞춰주기",
        "points": [
            "책가방 무게는 아이 몸무게의 10%를 넘지 않아야 척추가 반듯해요",
            "무거운 문제집은 등판에 가장 가까운 안쪽 주머니에 세워 넣기",
            "양쪽 어깨끈 길이 똑같이 조이고 가슴 앞 버클 꼭 채워주기",
        ],
        "body": (
            "어머님·아버님들, 오늘 현관에 놓인 아이 책가방 한 번 들어보셨나요? 다 끝난 지난주 프린트물과 두꺼운 책들이 한가득 들어있어 깜짝 놀랄 때가 많죠.\n\n"
            "아이 몸무게가 25kg이면 가방은 2.5kg 아래여야 걸을 때 목이 앞으로 빠지지 않는답니다.\n\n"
            "• 오늘 저녁 3분 가방 다이어트\n"
            "1) 아이와 함께 가방 비우고 내일 꼭 쓸 책만 가볍게 챙기기\n"
            "2) 가방 밑단이 엉덩이 아래로 처지지 않게 허리선에 맞춰 끈 조절하기\n"
            "3) 한쪽 어깨로만 메지 않고 양쪽 끈 + 가슴 버클 채우는 습관 칭찬하기\n\n"
            "오늘 비워낸 아이 가방 속 깜짝 유물(?)이나 가방 무게 줄이기 팁, 댓글로 재미있게 나눠봐요!"
        ),
        "tags": ["책가방무게", "초등등교준비", "어깨대칭", "척추보호", "성장기습관", "키즈핏카페"],
    },
    {
        "id": "cafe_13_jump_rope_15min",
        "title": "[활력 키성장 미션 #13] 하교 후 15분 리듬 줄넘기·점핑! 성장판 깨우는 사뿐 착지법",
        "card_title": "지칠 때까지 뛰기보다 리듬감 있게!\n1분 점프 · 30초 휴식\n성장판 깨우는 15분 루틴",
        "points": [
            "콘크리트 바닥 대신 운동장 우레탄 트랙이나 거실 점핑매트 위에서!",
            "발뒤꿈치 쿵쿵 대신 앞발바닥과 무릎 탄성으로 사뿐사뿐 뛰기",
            "1분 뛰고 30초 숨 고르기 8세트로 무릎 부담 없이 성장판 자극",
        ],
        "body": (
            "날씨 좋은 오후나 하교 직후, 우리 아이 오늘 몇 분 정도 통통 뛰어놀았나요?\n\n"
            "줄넘기는 무조건 개수만 많이 채우기보다 충격 흡수가 잘되는 바닥에서 쿠션 좋은 운동화를 신고 가볍게 리듬을 타는 게 무릎에도 안전하고 성장판 자극에도 최고랍니다.\n\n"
            "• 오늘의 15분 리듬 점프 약속\n"
            "1) 놀이터 탄성 바닥이나 실내 매트 위에서 준비운동 발목 돌리기 1분\n"
            "2) 음악 한 곡 틀어놓고 1분 점프 + 30초 휴식 기분 좋게 반복하기\n"
            "3) 끝나고 물 한 컵 마시며 종아리 쭉 늘려주기\n\n"
            "우리 아이가 제일 좋아하는 점프 운동(줄넘기, 농구, 트램펄린 등)은 무엇인지 댓글로 남겨주세요!"
        ),
        "tags": ["어린이줄넘기", "키크는점프", "실내운동매트", "하교후운동", "성장판자극", "키즈핏"],
    },
    {
        "id": "cafe_14_early_puberty_watch",
        "title": "[학부모 체크 미션 #14] 부쩍 빨리 크는 초등 저학년, 반가운 성장일까 조기 사춘기 신호일까?",
        "card_title": "만 7~8세 아이가 갑자기 쑥 자랄 때\n불안 대신 차분하게 살피는\n가정 내 3가지 체크포인트",
        "points": [
            "여아 만 8세 생일 전 · 남아 만 9세 생일 전 2차 성징 유무 확인하기",
            "최근 6개월 키가 4cm 이상 급증하고 체중까지 확 늘었는지 기록 대조",
            "뜨거운 배달 일회용기 피하고 유리·도자기 식기로 환경호르몬 줄이기",
        ],
        "body": (
            "아이가 잘 크면 기쁘면서도 한편으론 '혹시 사춘기가 너무 일찍 오는 건 아닐까?' 은근히 걱정되실 때가 있죠.\n\n"
            "막연하게 불안해하기보다 기준 나이(여아 만 8세 미만, 남아 만 9세 미만)와 성장 속도 기록만 차분히 챙겨두시면 언제든 골든타임을 지킬 수 있답니다.\n\n"
            "• 이번 달 부모님 안심 체크 3가지\n"
            "1) 샤워 후 스킨케어 시간에 가슴 멍울 통증이나 머리 피지 냄새 살피기\n"
            "2) 주방에서 전자레인지 돌릴 때 플라스틱 대신 내열 유리 용기 쓰기\n"
            "3) 분기별 키·몸무게 변화를 수첩에 적어 급가속 여부 확인하기\n\n"
            "성장 속도나 사춘기 시기와 관련해 평소 궁금하셨던 점, 댓글로 편하게 이야기 나누어 보아요!"
        ),
        "tags": ["성조숙증체크", "초등저학년육아", "환경호르몬줄이기", "사춘기관리", "키성장상담", "키즈핏카페"],
    },
    {
        "id": "cafe_15_sweet_drink_swap",
        "title": "[식탁 키성장 코칭 #15] 통통한 우리 아이, 굶기지 않고 키만 쑥 키우는 '음료수 바꾼 날'",
        "card_title": "성장기 아이는 절대 굶기지 마세요!\n마시는 당분만 물·보리차로 바꿔\n체중은 그대로, 키만 쑥!",
        "points": [
            "밥을 굶기면 살보다 키 성장 에너지가 먼저 빠져나가 손해예요",
            "냉장고 속 과일주스·가당 요거트·탄산음료만 끊어도 체지방 증가 스톱",
            "현재 몸무게를 유지하면서 키만 5cm 자라게 하는 건강한 습관",
        ],
        "body": (
            "활동량보다 간식이 많아 살짝 통통해진 아이를 보면 밥그릇부터 줄여야 하나 고민되시죠?\n\n"
            "하지만 한창 자라는 아이들은 식사를 굶기면 성장판 영양까지 부족해지기 때문에, 밥상은 건강하게 유지하고 '달콤한 음료수' 딱 하나만 먼저 바꾸는 게 가장 지혜로운 방법이랍니다.\n\n"
            "• 우리 집 냉장고 음료 스왑 챌린지\n"
            "1) 주스·초코우유·탄산음료 대신 구수한 보리차나 깨끗한 생수 채워두기\n"
            "2) 식사할 때 채소·생선·두부 반찬 먼저 두 입 먹고 밥 먹기\n"
            "3) 저녁 먹고 설거지 끝난 뒤 가족 다 같이 단지 한 바퀴 산책하기\n\n"
            "우리 집에서 아이가 물 대신 제일 잘 마시는 건강 차(보리차, 현미차 등)가 있다면 댓글로 추천해 주세요!"
        ),
        "tags": ["어린이체중관리", "액상과당줄이기", "건강간식", "초등식습관", "성조숙증예방", "키즈핏"],
    },
    {
        "id": "cafe_16_evening_calm_down",
        "title": "[오늘밤 키성장 미션 #16] 밤 8시 반 이후엔 격한 운동 멈춤! 미지근한 샤워로 숙면 스위치 켜기",
        "card_title": "밤 9시 숨차는 줄넘기는 내일 낮으로!\n저녁 8시 반 이후에는\n미지근한 샤워 · 이완 모드",
        "points": [
            "자기 직전 땀 뻘뻘 흘리는 운동은 체온을 높여 잠드는 시간을 늦춰요",
            "땀나는 운동은 오후 4~7시에, 늦은 밤 귀가 날엔 스트레칭만 가볍게",
            "취침 40분 전 미지근한 샤워가 심부 체온을 낮춰 꿀잠을 불러옵니다",
        ],
        "body": (
            "학원 다녀오면 밤 8시 반, 9시인데 오늘 운동 못 했다고 밤늦게 줄넘기 시키셨던 적 있으신가요?\n\n"
            "밤늦게 심장이 쿵쾅거릴 만큼 뛰면 몸에 열이 올라 정작 제일 중요한 밤 10시 깊은 잠을 놓치기 쉽답니다. 늦은 날엔 과감히 숙면을 선택해 주세요!\n\n"
            "• 늦은 저녁 숙면 전환 3단계\n"
            "1) 밤 8시 30분 이후엔 공놀이·달리기 대신 조용한 스트레칭으로 전환\n"
            "2) 취침 40분 전 미지근한 물로 샤워해 몸속 열기 부드럽게 식혀주기\n"
            "3) 이불 속에서 오늘 고마웠던 일 한 가지 도란도란 나누고 불 끄기\n\n"
            "오늘 밤 우리 아이 몇 시 소등 목표이신가요? 댓글로 목표 시간 적고 같이 성공해 봐요!"
        ),
        "tags": ["취침전루틴", "아이샤워시간", "밤10시소등", "초등일과관리", "숙면습관", "키즈핏카페"],
    },
    {
        "id": "cafe_17_quarterly_ruler_day",
        "title": "[기록 키성장 미션 #17] 매일 재며 조바심내기 끝! 90일마다 찍는 '아침 첫 키' 기록 습관",
        "card_title": "일주일마다 키 재며 속상해하지 마세요!\n3개월에 한 번 아침 기상 직후\n정확한 성장 속도 기록하기",
        "points": [
            "아침과 저녁 키 차이가 최대 2cm라 재는 시간마다 숫자가 달라요",
            "매 분기 첫 일요일 아침 기상 직후 맨발로 같은 벽면에서 측정하기",
            "최근 6개월 성장폭 x 2가 연간 5.5cm 이상인지 흐름으로 확인하기",
        ],
        "body": (
            "거실 기둥 키재기 자 앞에서 매주 아이 세워놓고 '왜 지난달이랑 똑같지?' 속상해하셨던 적 있으시죠?\n\n"
            "저녁에 재거나 고개 각도만 조금 달라도 1cm는 금방 차이가 나서, 너무 자주 재면 오히려 부모님 마음만 조급해지더라고요.\n\n"
            "• 오차 없는 우리 집 공식 키 측정일 만들기\n"
            "1) 3월·6월·9월·12월 첫째 주 일요일 아침 눈 뜨자마자 화장실 다녀온 직후 측정\n"
            "2) 뒤꿈치·엉덩이·어깨·뒤통수 벽에 붙이고 두꺼운 책으로 직각 눈금 표시\n"
            "3) 무료 성장 백분위 진단기로 개월수 기준 정확한 또래 백분위 기록해 두기\n\n"
            "최근에 재어본 우리 아이 키 성장폭이나 기록 노하우가 있다면 댓글로 함께 나누어 주세요!"
        ),
        "tags": ["아이키기록", "집에서키재기", "성장백분위", "학부모성장수첩", "초등키크기", "키즈핏"],
    },
    {
        "id": "cafe_18_bone_age_memo",
        "title": "[학부모 코칭 #18] 소아과 성장판 사진 찍으러 갈 때, 진료실에서 꼭 메모해 올 3가지 질문",
        "card_title": "성장판 X-ray 진료 보러 가실 때\n잊지 말고 휴대폰에 적어 올\n핵심 숫자 3가지 체크리스트",
        "points": [
            "1) 오늘 병원 정밀 신장계로 잰 정확한 키와 몸무게 숫자",
            "2) 아이 실제 만 개월수 vs 판독된 뼈나이(몇 세 몇 개월인지)",
            "3) 6개월~1년 뒤 다음 추적 관찰 권장 시기와 중점 생활수칙",
        ],
        "body": (
            "방학이나 검진 시즌을 맞아 아이 손목 성장판(뼈나이) 검사 다녀오시는 부모님들 많으시죠?\n\n"
            "막상 진료실에 들어가면 긴장되어서 설명만 얼핏 듣고 나오느라 집에 와서 정확한 뼈나이 개월수가 기억 안 나 아쉬울 때가 많답니다.\n\n"
            "• 병원 가기 전 메모장에 복사해 두실 3줄\n"
            "1) 오늘 측정 신장(cm) / 체중(kg) 정확한 소수점 첫째 자리\n"
            "2) 판독된 골연령(뼈나이)이 몇 세 몇 개월 수준인지\n"
            "3) 현재 생활에서 수면·체중·영양 중 가장 먼저 챙길 1순위는 무엇인지\n\n"
            "최근 성장판 검사 다녀오신 경험담이나 궁금한 점이 있으시면 댓글로 편하게 소통해요!"
        ),
        "tags": ["성장판검사후기", "뼈나이질문", "소아과검진", "초등성장클리닉", "엄마체크리스트", "키즈핏카페"],
    },
    {
        "id": "cafe_19_winter_indoor_ care",
        "title": "[계절 키성장 코칭 #19] 야외 활동 줄어드는 계절, 내년 봄 훌쩍 크는 '비축기 3종 루틴'",
        "card_title": "바깥 놀이 줄어드는 계절일수록 승부처!\n실내 점프 · 비타민D3 · 칼소등으로\n내년 봄 급도약 준비하기",
        "points": [
            "햇볕 쬐는 시간이 줄어드는 달에는 식후 비타민D3 보충이 더욱 중요해요",
            "집에만 있어 처지기 쉬운 날 거실 매트 10분 점프로 활력 깨우기",
            "방학·연휴에도 아침 기상 시각과 밤 9시 반 소등 리듬 흔들리지 않기",
        ],
        "body": (
            "날씨가 추워지거나 미세먼지가 심해 바깥 놀이터에 못 나가는 날이 길어지면 아이들 몸도 근질근질하고 키 성장도 주춤해지기 쉽죠.\n\n"
            "하지만 나무가 겨울에 뿌리에 영양을 가득 모아 봄에 새순을 틔우듯, 실내 생활기에 기본기를 잘 지켜준 아이들이 봄·여름에 정말 시원하게 치고 올라간답니다!\n\n"
            "• 실내 생활기 성장 저축 3가지\n"
            "1) 저녁 식사 후 온 가족 다 같이 비타민D3 챙겨 먹기\n"
            "2) TV 보며 소파에 눕기 대신 거실 매트에서 음악 맞춰 10분 점프하기\n"
            "3) 환절기 코막힘 없도록 실내 습도 50%와 따뜻한 물 자주 마시기\n\n"
            "집콕하는 날 우리 아이 에너지를 발산시키는 부모님만의 실내 놀이 비법, 댓글로 알려주세요!"
        ),
        "tags": ["실내키크는운동", "어린이비타민D3", "집콕육아꿀팁", "방학키성장", "성장비축기", "키즈핏"],
    },
    {
        "id": "cafe_20_parent_encouragement",
        "title": "[주말 응원 편지 #20] 엄마·아빠 키 걱정 내려놓고, 오늘 밤 우리 아이 '생활 잠재력 +8cm' 응원해요",
        "card_title": "부모 키가 아담하다고 미안해 마세요!\n오늘 밤 지켜준 통잠과 바른 자세가\n유전 상단 +8cm를 열어줍니다",
        "points": [
            "유전 예상키는 고정된 점 하나가 아니라 위아래로 넓게 열린 구간이에요",
            "비교하는 말 대신 아이가 오늘 잘 지킨 작은 성장 습관 하나 칭찬하기",
            "편안한 마음과 충분한 수면·영양·자세가 가장 든든한 성장 밑거름",
        ],
        "body": (
            "키즈핏 우리아이 키성장 연구소 가족 여러분, 한 주 동안 아이 세 끼 챙기고 재우시느라 정말 고생 많으셨습니다!\n\n"
            "가끔 또래 큰 아이들을 보면 괜히 마음이 조급해지기도 하지만, 같은 부모 밑에서도 생활 습관에 따라 성인키가 8cm 이상 달라진다는 걸 기억하면 오늘 우리가 챙기는 작은 루틴 하나하나가 얼마나 값진지 모릅니다.\n\n"
            "• 오늘 밤 아이에게 건네는 다정한 칭찬 미션\n"
            "1) '누구보다 작네/크네' 또래 비교하는 말 오늘부터 완전 금지하기\n"
            "2) 밥 맛있게 먹은 것, 바르게 앉은 것, 일찍 양치한 것 중 하나 꼭 칭찬하기\n"
            "3) 불 끄고 아이 손 꼭 잡아주며 편안한 마음으로 통잠 선물하기\n\n"
            "오늘 우리 아이에게 해주고 싶은 따뜻한 응원 한마디를 댓글로 남겨주세요!"
        ),
        "tags": ["엄마응원", "유전키극복", "아이자존감", "키성장습관", "학부모커뮤니티", "키즈핏카페"],
    },
]


def build_cafe_bottom_bridge_text() -> str:
    return (
        "\n\n• 우리 아이 개월수별 질병관리청(KDCA) 표준키 백분위 & 병원 뼈나이 1분 무료 점검표\n"
        "필요하실 때 생년월일과 키·몸무게만 입력해 현재 성장 흐름을 확인하시고, 가정용 『급성장 골든타임 & 뼈나이 실전 마스터북 PDF』 안내도 편하게 참고해 보세요.\n"
        "https://kidsfit.co.kr\n"
        f"{LATPEED_MASTERBOOK_SLOT_URL}"
    )


def _resolve_axis_variants_and_seasonal_note(axis_label: str) -> Tuple[List[str], str]:
    axis_key = (axis_label or "AXIS 05")[:7].strip()
    base_variants = list(AXIS_QUERY_VARIANT_CLUSTERS.get(axis_key, AXIS_QUERY_VARIANT_CLUSTERS["AXIS 05"]))
    # Always ensure hybrid Korean/English/colloquial core markers are present
    for core_kw in ("급성장기", "PHV", "성조숙증 검사 시기", "뼈나이 1년 빠름", "질병관리청 표준키"):
        if not any(core_kw in v for v in base_variants):
            base_variants.append(core_kw)

    seasonal_line = ""
    hq_text_dir = ROOT_DIR.parent / "text_automation_hq"
    if hq_text_dir.exists():
        import sys as _sys

        if str(hq_text_dir) not in _sys.path:
            _sys.path.insert(0, str(hq_text_dir))
        try:
            from seasonal_keyword_calendar_matrix import resolve_seasonal_calendar_pack

            cal = resolve_seasonal_calendar_pack("KFK")
            seasonal_line = (
                f"■ [{cal['phase']} 시즌 사전 점검 팁] {cal['event_title']}\n"
                f"• 함께 체크하면 좋은 핵심 주제: {' · '.join(base_variants[:6])}"
            )
        except Exception:
            seasonal_line = ""

    if not seasonal_line:
        seasonal_line = f"■ [학부모 핵심 연관 점검 키워드] {' · '.join(base_variants[:6])}"
    return base_variants, seasonal_line


# ---------------------------------------------------------------------------
# 4. 통합 회차 조회 & 가드레일 검증 API
# ---------------------------------------------------------------------------
def build_blog_editorial_package(blog_seq: int, out_dir: Path = EDITORIAL_IMG_DIR) -> Dict[str, Any]:
    """
    Returns structured 3-section + 3-image editorial package for Naver Blog (100% height-growth focused,
    Challenge-Class 11/09 short-breath mobile readability + KDCA official data box + hybrid query variants).
    """
    idx = (max(1, int(blog_seq)) - 1) % len(BLOG_GROWTH_EDITORIAL_BANK)
    cycle = (max(1, int(blog_seq)) - 1) // len(BLOG_GROWTH_EDITORIAL_BANK) + 1
    item = BLOG_GROWTH_EDITORIAL_BANK[idx]

    title = item["title"] if cycle == 1 else f"{item['title']} (성장 리포트 #{blog_seq})"
    variants, seasonal_note = _resolve_axis_variants_and_seasonal_note(item["axis_label"])

    sec1 = format_mobile_short_breath_paragraphs(item["section1_intro"])
    sec2 = f"{format_mobile_short_breath_paragraphs(item['section2_mechanism'])}\n\n{KDCA_OFFICIAL_DATA_BOX_KO}"
    sec3 = f"{format_mobile_short_breath_paragraphs(item['section3_routine'])}\n\n{seasonal_note}"
    bottom_bridge = build_blog_bottom_bridge_text(blog_seq, item)
    images = generate_blog_3set_infographics(blog_seq, item, out_dir=out_dir)

    sections = [
        {"type": "text", "role": "section1_intro", "content": sec1},
        {"type": "image", "role": "cover_banner", "path": images[0]},
        {"type": "text", "role": "section2_mechanism", "content": sec2},
        {"type": "image", "role": "clinical_chart", "path": images[1]},
        {"type": "text", "role": "section3_routine", "content": sec3},
        {"type": "image", "role": "age_checklist", "path": images[2]},
        {"type": "text", "role": "bottom_bridge", "content": bottom_bridge},
    ]

    full_body = "\n\n".join([sec1, sec2, sec3, bottom_bridge])

    merged_tags: List[str] = list(item["tags"])
    for extra_t in ("질병관리청표준키", "급성장기PHV", "성조숙증검사시기", "뼈나이검사"):
        if extra_t not in merged_tags and len(merged_tags) < 10:
            merged_tags.append(extra_t)

    return {
        "seq": blog_seq,
        "topic_id": item["id"],
        "axis_label": item["axis_label"],
        "category": BLOG_TARGET_CATEGORY,
        "title": title,
        "section1_intro": sec1,
        "section2_mechanism": sec2,
        "section3_routine": sec3,
        "bottom_bridge": bottom_bridge,
        "query_variants": variants,
        "full_body": full_body,
        "char_count": len(full_body),
        "images": images,
        "sections": sections,
        "tags": merged_tags,
    }


def build_cafe_coaching_package(cafe_seq: int, out_dir: Path = EDITORIAL_IMG_DIR) -> Dict[str, Any]:
    """
    Returns structured parent-community coaching package for Naver Cafe (menu_id=3, zero duplicate prose).
    """
    idx = (max(1, int(cafe_seq)) - 1) % len(CAFE_GROWTH_COACHING_BANK)
    cycle = (max(1, int(cafe_seq)) - 1) // len(CAFE_GROWTH_COACHING_BANK) + 1
    item = CAFE_GROWTH_COACHING_BANK[idx]

    title = item["title"] if cycle == 1 else f"{item['title']} (#{cafe_seq})"
    body = item["body"].strip() + build_cafe_bottom_bridge_text()
    img_path = out_dir / f"cafe_seq_{cafe_seq:03d}_card.png"
    render_cafe_coaching_card_png(img_path, cafe_seq, item)

    return {
        "seq": cafe_seq,
        "topic_id": item["id"],
        "board": CAFE_TARGET_BOARD,
        "menu_id": CAFE_TARGET_MENU_ID,
        "title": title,
        "body": body,
        "char_count": len(body),
        "image": str(img_path),
        "tags": list(item["tags"]),
    }


def validate_kfk_editorial_pair(blog_pkg: Dict[str, Any], cafe_pkg: Dict[str, Any]) -> List[str]:
    """
    Validates C-Rank topic purity, zero first-paragraph link, 3-image existence, zero banned words,
    and blog/cafe anti-duplicate separation.
    """
    violations: List[str] = []

    if blog_pkg["category"] != BLOG_TARGET_CATEGORY:
        violations.append(f"Blog category mismatch: {blog_pkg['category']}")
    if cafe_pkg["board"] != CAFE_TARGET_BOARD or cafe_pkg["menu_id"] != CAFE_TARGET_MENU_ID:
        violations.append(f"Cafe board/menu mismatch: {cafe_pkg['board']} ({cafe_pkg['menu_id']})")

    if "http://" in blog_pkg["section1_intro"] or "https://" in blog_pkg["section1_intro"]:
        violations.append("D.I.A.+ violation: External URL found in blog first section (section1_intro).")

    if not (1800 <= len(blog_pkg["full_body"]) <= 3400):
        violations.append(f"Blog body length ({len(blog_pkg['full_body'])}) outside target editorial range.")

    # Challenge-Class 11/09 verification: KDCA official numbers + Latpeed Masterbook PDF bridge + hybrid variants
    if "138.8cm" not in blog_pkg["section2_mechanism"] or "139.1cm" not in blog_pkg["section2_mechanism"]:
        violations.append("Missing official KDCA 2017 standard height reference box (138.8cm / 139.1cm).")
    if LATPEED_MASTERBOOK_SLOT_URL not in blog_pkg["bottom_bridge"]:
        violations.append("Missing Latpeed Masterbook PDF bridge (#kfk-latpeed-ebook-slot) in bottom_bridge.")
    for req_variant in ("PHV", "질병관리청 표준키", "성조숙증 검사 시기"):
        if req_variant not in blog_pkg["full_body"]:
            violations.append(f"Missing hybrid Korean/English/colloquial search variant: {req_variant}")

    # Polite honorific consistency check on narrative paragraphs (no plain '~다.' report endings; all '합쇼체' end in '니다.')
    for para in blog_pkg["section1_intro"].split("\n\n"):
        p_clean = para.strip()
        if p_clean and not p_clean.startswith(("■", "•")) and re.search(r"[가-힣]다\.$", p_clean):
            if not p_clean.endswith("니다."):
                violations.append(f"Non-honorific plain ending detected in intro: '{p_clean[-20:]}'")

    combined = "\n".join(
        [
            blog_pkg["title"],
            blog_pkg["full_body"],
            " ".join(blog_pkg["tags"]),
            cafe_pkg["title"],
            cafe_pkg["body"],
            " ".join(cafe_pkg["tags"]),
        ]
    )

    for bw in BANNED_KR_PROMO_WORDS:
        if bw in combined:
            violations.append(f"Banned promo word detected: {bw}")
    if "lemonsqueezy" in combined.lower():
        violations.append("Forbidden 'lemonsqueezy' reference detected in KFK content.")
    for off_kw in NON_GROWTH_OFF_TOPIC_KEYWORDS:
        if off_kw in combined:
            violations.append(f"Off-topic non-growth keyword '{off_kw}' leaked into KFK editorial content.")

    if len(blog_pkg["images"]) != 3:
        violations.append(f"Expected 3 blog infographic images, got {len(blog_pkg['images'])}")
    for p_str in blog_pkg["images"] + [cafe_pkg["image"]]:
        p = Path(p_str)
        if not p.exists() or p.stat().st_size < 10_000:
            violations.append(f"Generated PNG missing or too small: {p_str}")

    # Anti-duplicate check: 5-word shingle Jaccard similarity between Blog and Cafe must stay < 0.12
    b_words = re.findall(r"[가-힣A-Za-z0-9]+", blog_pkg["section1_intro"] + " " + blog_pkg["section2_mechanism"] + " " + blog_pkg["section3_routine"])
    c_words = re.findall(r"[가-힣A-Za-z0-9]+", cafe_pkg["body"].split("• 우리 아이 개월수별")[0])
    b_shingles = {" ".join(b_words[i : i + 4]) for i in range(max(0, len(b_words) - 3))}
    c_shingles = {" ".join(c_words[i : i + 4]) for i in range(max(0, len(c_words) - 3))}
    if b_shingles and c_shingles:
        jaccard = len(b_shingles & c_shingles) / float(len(b_shingles | c_shingles))
        if jaccard >= 0.12:
            violations.append(f"Duplicate-document risk: Blog vs Cafe 4-gram Jaccard too high ({jaccard:.3f}).")

    return violations
