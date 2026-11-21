import os
import sys
import json
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path("D:/드림컴퍼니/5사업부")
load_dotenv(ROOT / ".env")

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
VIDEO_PATH = ROOT / "samples" / "shorts_ep1_newborn" / "ep1_newborn_flow_couple_duet.mp4"
THUMB_PATH = ROOT / "samples" / "shorts_ep1_newborn" / "flow_clips" / "v4_check_cut1.jpg"


def send_telegram_video(video_path: Path, caption: str):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendVideo"
    boundary = "----KidsFitShortsBoundary987654321"
    body = bytearray()

    def add_field(name, value):
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{value}\r\n".encode("utf-8"))

    add_field("chat_id", CHAT_ID)
    add_field("caption", caption)
    add_field(" parse_mode", "HTML")
    add_field("supports_streaming", "true")
    add_field("width", "1080")
    add_field("height", "1920")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        f'Content-Disposition: form-data; name="video"; filename="{video_path.name}"\r\n'
        f"Content-Type: video/mp4\r\n\r\n".encode("utf-8")
    )
    body.extend(video_path.read_bytes())
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        print("Telegram sendVideo success:", res_data.get("ok"), "message_id:", res_data.get("result", {}).get("message_id"))


if __name__ == "__main__":
    caption = (
        "🎬 [유튜브 쇼츠 1편 최종본] 신생아 육아 필수템 5가지 (부부 티키타카 더빙 · 초대형 후킹 자막 에디션)\n\n"
        "✅ 러닝타임: 21.5초 (30fps · 1.2~1.3배속 실속도 컷편집)\n"
        "✅ 오프닝 후킹 타이틀: 88pt / 98pt 초대형 사이즈\n"
        "✅ 본문 자막: 86pt~90pt 대형 1~2줄 키워드 자막 (음성 1:1 프레임 동기화 · 짤림 0%)\n"
        "✅ AI 어색 구간 제거 완료 (컷2 완결 지퍼 클로즈업/풀샷, 컷3 오픈 젖병 VFX, 컷5 클린 언박싱)\n\n"
        "📌 유튜브 쇼츠 업로드 제목 추천:\n"
        "육아는 장비빨! 조리원 퇴소 전 무조건 사야 할 신생아 필수템 5가지 #출산준비 #육아템 #신생아\n\n"
        "📌 고정댓글 / 설명란 링크 문구:\n"
        "영상 속 신생아 필수템 5가지 공식 혜택가 비교표 & 우리 아기 1:1 무료 발달진단 라운지 👉 https://kidsfit.co.kr"
    )
    send_telegram_video(VIDEO_PATH, caption)
