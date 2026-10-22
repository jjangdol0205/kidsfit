# -*- coding: utf-8 -*-
import os, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
PROF_DIR = ROOT_DIR / "인스타_쓰레드_프로필_모음"
CLIP_DIR = ROOT_DIR / "네이버클립_웹툰영상_모음"

EMAIL_BATCHES = [
    {
        "subject": "[키즈핏 신규] KidsFit 인스타그램 & 쓰레드 원형 프로필 이미지 3종 + 16초 책넘김 웹툰 영상(1~3화 무음성 피아노BGM)",
        "body": """안녕하세요 대표님! 키즈핏(KIDS-FIT) 그로스 스튜디오입니다.

방금 요청하신 2가지 신규 제작물을 첨부해 드립니다:

1. 【KidsFit 인스타그램 & 쓰레드 전용 1080x1080 원형 안전영역 프로필 이미지 3종 패키지】
- 00_인스타쓰레드_원형적용_미리보기_3종비교.png
- 01_키즈핏_인스타쓰레드_프로필_로얄인디고_엠블럼.png
- 02_키즈핏_인스타쓰레드_프로필_웜아이보리_감성툰형.png
- 03_키즈핏_인스타쓰레드_프로필_화이트클리닉_배지형.png
- 04_인스타_쓰레드_프로필소개글_링크_세팅가이드.txt
- 키즈핏_인스타_쓰레드_프로필이미지_3종패키지.zip

2. 【16초 책장 넘김(Page-Flip) 웹툰 영상 (음성 완전 제거 · 잔잔한 피아노·오르골 BGM 전용, 4컷×4초=16초)】
- 01_네이버클립_웹툰1화_만3세소근육민감기.mp4 (16초)
- 02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4 (16초)
- 03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4 (16초)
- 05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt

이어서 1~3화 통합 묶음 책넘김 합본 영상도 바로 다음 메일로 발송해 드립니다!""",
        "files": [
            str(PROF_DIR / "키즈핏_인스타_쓰레드_프로필이미지_3종패키지.zip"),
            str(PROF_DIR / "00_인스타쓰레드_원형적용_미리보기_3종비교.png"),
            str(PROF_DIR / "01_키즈핏_인스타쓰레드_프로필_로얄인디고_엠블럼.png"),
            str(PROF_DIR / "02_키즈핏_인스타쓰레드_프로필_웜아이보리_감성툰형.png"),
            str(PROF_DIR / "03_키즈핏_인스타쓰레드_프로필_화이트클리닉_배지형.png"),
            str(CLIP_DIR / "01_네이버클립_웹툰1화_만3세소근육민감기.mp4"),
            str(CLIP_DIR / "02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4"),
            str(CLIP_DIR / "03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4"),
            str(CLIP_DIR / "05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt"),
        ],
    },
    {
        "subject": "[키즈핏 신규] 네이버 클립용 웹툰 1~3화 통합 묶음 책넘김 영상 (무음성 · 잔잔한 피아노 BGM 전용)",
        "body": """안녕하세요 대표님! 키즈핏(KIDS-FIT) 그로스 스튜디오입니다.

음성(TTS)을 완전히 빼고 잔잔한 피아노·오르골 선율과 함께 그림책 페이지가 넘어가듯 자연스럽게 넘어가는 【웹툰 1~3화 전체 통합 책넘김 합본 영상(MP4)】을 보내드립니다.

■ 첨부파일 구성
1. 00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4
2. 05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt

감사합니다!""",
        "files": [
            str(CLIP_DIR / "00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4"),
            str(CLIP_DIR / "05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt"),
        ],
    },
]

RECIPIENTS = ["jjangdol0205@naver.com", "better_life333@naver.com"]

report = {"batches": []}

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    context = browser.contexts[0]
    page = context.new_page()
    page.set_viewport_size({"width": 1280, "height": 960})
    cdp = context.new_cdp_session(page)

    try:
        for idx, batch in enumerate(EMAIL_BATCHES, start=1):
            page.goto("https://mail.naver.com/v2/new", wait_until="domcontentloaded", timeout=30000)
            time.sleep(3)

            rec_input = page.locator("#recipient_input_element")
            for r_email in RECIPIENTS:
                rec_input.click()
                rec_input.fill(r_email)
                rec_input.press("Enter")
                time.sleep(0.5)

            subj_input = page.locator("#subject_title")
            subj_input.click()
            subj_input.fill(batch["subject"])
            time.sleep(0.5)

            existing_files = [f for f in batch["files"] if os.path.exists(f)]
            doc_root = cdp.send("DOM.getDocument", {"depth": 1})["root"]["nodeId"]
            file_node = cdp.send("DOM.querySelector", {
                "nodeId": doc_root,
                "selector": "#ATTACH_LOCAL_FILE_ELEMENT_ID"
            })["nodeId"]
            cdp.send("DOM.setFileInputFiles", {
                "nodeId": file_node,
                "files": existing_files
            })
            page.evaluate("""() => {
                const inp = document.getElementById('ATTACH_LOCAL_FILE_ELEMENT_ID');
                if (inp) inp.dispatchEvent(new Event('change', { bubbles: true }));
            }""")
            time.sleep(6)

            page.evaluate("""(bodyText) => {
                for (const ifr of Array.from(document.querySelectorAll('iframe'))) {
                    try {
                        const doc = ifr.contentDocument;
                        if (doc && doc.body && (doc.body.isContentEditable || doc.designMode === 'on' || doc.body.classList.contains('workseditor-content') || doc.body.innerHTML !== undefined)) {
                            if (ifr.id && ifr.id.includes('gnb')) continue;
                            if (ifr.id === 'checkVirusArea') continue;
                            doc.body.innerHTML = '<div style="font-family:Malgun Gothic,sans-serif;font-size:14px;line-height:1.7;">' + bodyText.replace(/\\n/g, '<br>') + '</div>';
                            return 'iframe_body';
                        }
                    } catch (e) {}
                }
                const ce = document.querySelector('[contenteditable="true"]');
                if (ce) ce.innerHTML = bodyText.replace(/\\n/g, '<br>');
            }""", batch["body"])

            page.locator("button.button_write_task").first.click()
            time.sleep(4)
            page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button'));
                for (const b of btns) {
                    const t = (b.innerText || '').trim();
                    if (t === '확인' || t === '보내기') {
                        if (b.offsetParent !== null && !b.classList.contains('button_write_task')) b.click();
                    }
                }
            }""")
            time.sleep(4)
            print(f"New Batch {idx} sent -> url={page.url}")

    finally:
        page.close()

print("ALL NEW EMAILS SENT")
