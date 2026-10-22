# -*- coding: utf-8 -*-
import os, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
WEBTOON_DIR = ROOT_DIR / "웹툰_모음"
CARDNEWS_DIR = ROOT_DIR / "카드뉴스_모음"
CLIP_DIR = ROOT_DIR / "네이버클립_웹툰영상_모음"

EMAIL_BATCHES = [
    {
        "subject": "[키즈핏 패키지 ①] 인스타·쓰레드·블로그용 육아웹툰(1~3화) 전체 모음집 (ZIP 3종)",
        "body": """안녕하세요 대표님! 키즈핏(KIDS-FIT) 그로스 스튜디오입니다.

요청하신 【육아웹툰 1~3화 전체 패키지】 원본 이미지(4컷 개별 + 2x2 합본 + 블로그 세로연속 합본) 및 인스타·쓰레드 본문·해시태그·고정 대댓글 텍스트 모음 ZIP 파일 3종을 보내드립니다.

■ 첨부파일 구성 (웹툰 1~3화 ZIP 3개)
1. 1화_만3세소근육민감기_웹툰_전체파일.zip
2. 2화_초등문장제수학작업기억_웹툰_전체파일.zip
3. 3화_밤10시숙면숨은키7cm_웹툰_전체파일.zip

이어서 카드뉴스(1~3탄) 패키지와 네이버 클립용 웹툰 묶음 영상(MP4) 메일을 바로 발송해 드립니다!""",
        "files": [
            str(WEBTOON_DIR / "1화_만3세소근육민감기_웹툰_전체파일.zip"),
            str(WEBTOON_DIR / "2화_초등문장제수학작업기억_웹툰_전체파일.zip"),
            str(WEBTOON_DIR / "3화_밤10시숙면숨은키7cm_웹툰_전체파일.zip"),
        ],
    },
    {
        "subject": "[키즈핏 패키지 ②] 인스타·블로그·카페용 카드뉴스(1~3탄) 전체 모음집 (ZIP 3종)",
        "body": """안녕하세요 대표님! 키즈핏(KIDS-FIT) 그로스 스튜디오입니다.

요청하신 【카드뉴스 1~3탄 전체 패키지 (1080x1350 풀블리드 고해상도 슬라이드 + 캡션 텍스트)】 ZIP 파일 3종을 보내드립니다.

■ 첨부파일 구성 (카드뉴스 1~3탄 ZIP 3개)
1. 1탄_만3세고집과소근육발달_카드뉴스_전체파일.zip (6장 + 본문 텍스트)
2. 2탄_초등문장제수학과백지복습_카드뉴스_전체파일.zip (4장 + 본문 텍스트)
3. 3탄_밤10시숙면과숨은키7cm_카드뉴스_전체파일.zip (4장 + 본문 텍스트)""",
        "files": [
            str(CARDNEWS_DIR / "1탄_만3세고집과소근육발달_카드뉴스_전체파일.zip"),
            str(CARDNEWS_DIR / "2탄_초등문장제수학과백지복습_카드뉴스_전체파일.zip"),
            str(CARDNEWS_DIR / "3탄_밤10시숙면과숨은키7cm_카드뉴스_전체파일.zip"),
        ],
    },
    {
        "subject": "[키즈핏 패키지 ③] 네이버 클립용 웹툰 1~3화 통합 묶음 합본 영상 (1080x1920 세로형 MP4)",
        "body": """안녕하세요 대표님! 키즈핏(KIDS-FIT) 그로스 스튜디오입니다.

요청하신 【네이버 클립(Naver Clip)용 웹툰 1~3화 통합 묶음 합본 영상 (1080x1920 세로형, 전체 12컷 연속, 나레이션+배경음악 포함)】 및 업로드 가이드를 보내드립니다.

■ 첨부파일 구성
1. 00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4 (1화 소근육 민감기 + 2화 초등 문장제 수학 + 3화 밤 10시 키성장 통합 영상)
2. 05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt (네이버 클립 업로드 시 제목·해시태그·정보스티커 링크 복사본)

■ 네이버 클립 업로드 시 정보 스티커(링크 스티커) 추천 주소
- 공식 홈페이지: https://truthofmarket.com
- 공식 네이버 블로그: https://blog.naver.com/expertise333
- 공식 네이버 카페: https://cafe.naver.com/moneyfitlab""",
        "files": [
            str(CLIP_DIR / "00_네이버클립_웹툰_1~3화_통합묶음_합본영상.mp4"),
            str(CLIP_DIR / "05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt"),
        ],
    },
    {
        "subject": "[키즈핏 패키지 ④] 네이버 클립용 에피소드별 개별 웹툰 영상(1화·2화·3화) & 카드뉴스 영상",
        "body": """안녕하세요 대표님! 키즈핏(KIDS-FIT) 그로스 스튜디오입니다.

네이버 클립에 에피소드별로 나누어 매일 1편씩 업로드하실 수 있도록 【웹툰 1화 · 2화 · 3화 개별 클립 영상(MP4)】과 【카드뉴스 핵심요약 클립 영상(MP4)】을 함께 첨부해 드립니다.

■ 첨부파일 구성
1. 01_네이버클립_웹툰1화_만3세소근육민감기.mp4
2. 02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4
3. 03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4
4. 04_네이버클립_카드뉴스_핵심요약_영상.mp4
5. 05_네이버클립_업로드_제목_태그_정보스티커_가이드.txt

감사합니다!""",
        "files": [
            str(CLIP_DIR / "01_네이버클립_웹툰1화_만3세소근육민감기.mp4"),
            str(CLIP_DIR / "02_네이버클립_웹툰2화_초등문장제수학작업기억.mp4"),
            str(CLIP_DIR / "03_네이버클립_웹툰3화_밤10시숙면숨은키7cm.mp4"),
            str(CLIP_DIR / "04_네이버클립_카드뉴스_핵심요약_영상.mp4"),
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

            # 1. Enter recipients
            rec_input = page.locator("#recipient_input_element")
            for r_email in RECIPIENTS:
                rec_input.click()
                rec_input.fill(r_email)
                rec_input.press("Enter")
                time.sleep(0.5)

            # 2. Enter subject
            subj_input = page.locator("#subject_title")
            subj_input.click()
            subj_input.fill(batch["subject"])
            time.sleep(0.5)

            # 3. Attach files directly via CDP DOM.setFileInputFiles (bypasses Playwright 50MB remote check!)
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
            # Dispatch change event just in case
            page.evaluate("""() => {
                const inp = document.getElementById('ATTACH_LOCAL_FILE_ELEMENT_ID');
                if (inp) inp.dispatchEvent(new Event('change', { bubbles: true }));
            }""")
            time.sleep(6)

            # 4. Fill body text inside editor iframe or contenteditable
            body_filled = page.evaluate("""(bodyText) => {
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
                if (ce) {
                    ce.innerHTML = bodyText.replace(/\\n/g, '<br>');
                    return 'contenteditable';
                }
                return 'not_found';
            }""", batch["body"])

            # 5. Click Send button (button.button_write_task)
            page.locator("button.button_write_task").first.click()
            time.sleep(4)

            # Check if confirmation modal popped up
            page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button'));
                for (const b of btns) {
                    const t = (b.innerText || '').trim();
                    if (t === '확인' || t === '보내기') {
                        if (b.offsetParent !== null && !b.classList.contains('button_write_task')) {
                            b.click();
                        }
                    }
                }
            }""")
            time.sleep(4)

            screenshot_path = str(ROOT_DIR / "logs" / f"mail_sent_batch_{idx}.png")
            page.screenshot(path=screenshot_path)
            report["batches"].append({
                "idx": idx,
                "subject": batch["subject"],
                "files_count": len(existing_files),
                "body_filled": body_filled,
                "after_url": page.url,
                "result_text": page.evaluate("() => document.body.innerText.slice(0, 600)"),
            })
            print(f"Batch {idx} sent -> url={page.url}")

    except Exception as e:
        report["error"] = str(e)
    finally:
        page.close()

with open(str(ROOT_DIR / "logs" / "mail_send_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print("ALL EMAILS SENT")
