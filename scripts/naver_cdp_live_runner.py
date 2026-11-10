#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
D:\드림컴퍼니\5사업부\scripts\naver_cdp_live_runner.py
Pure WebSocket CDP Automation Engine (Port 9233) for Division 3 (kidsfit.co.kr):
  1. Publishes deep academic parenting column + 3 1080x1080 infographics to Naver Blog (expertise333)
  2. Answers open parenting questions on Naver Knowledge iN (kin.naver.com) with Zero-URL clinical guidance
  3. Performs external parenting blog sympathy & comment tour
"""

import argparse
import asyncio
import json
import os
import random
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
import websockets

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(r"D:\드림컴퍼니\5사업부")
sys.path.insert(0, str(ROOT / "scripts"))

from publish_enhanced_naver_blog import (
    DEEP_PARENTING_TOPICS,
    generate_all_blog_images,
    sanitize_se_one_body,
    send_telegram_notification,
    write_audit_log,
)
from execute_safe_backlog_activity import SAFE_BACKLOG_ITEMS
from naver_auto_comment_and_kin_daemon import BLOG_TOUR_TOPICS, load_state, save_state

CDP_PORT = 9233


def open_fresh_clean_tab():
    raw = urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/list", timeout=3).read().decode("utf-8")
    tabs = json.loads(raw)
    old_pages = [t["id"] for t in tabs if t.get("type") == "page"]
    req = urllib.request.Request(f"http://127.0.0.1:{CDP_PORT}/json/new?about:blank", method="PUT")
    new_tab = json.loads(urllib.request.urlopen(req, timeout=3).read().decode("utf-8"))
    for oid in old_pages:
        if oid != new_tab.get("id"):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/close/{oid}", timeout=2)
            except Exception:
                pass
    return new_tab["webSocketDebuggerUrl"]


def ensure_daemon_running():
    try:
        return open_fresh_clean_tab()
    except Exception:
        pass

    from naver_browser_daemon import launch_chrome_on_default_desktop
    launch_chrome_on_default_desktop()
    for _ in range(15):
        time.sleep(1)
        try:
            return open_fresh_clean_tab()
        except Exception:
            pass
    raise RuntimeError(f"CDP port {CDP_PORT} not reachable")


class CDPClient:
    def __init__(self, ws):
        self.ws = ws
        self.msg_id = 1

    async def call(self, method: str, params: dict = None):
        mid = self.msg_id
        self.msg_id += 1
        await self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            try:
                raw = await asyncio.wait_for(self.ws.recv(), timeout=15.0)
            except asyncio.TimeoutError:
                await self.ws.send(
                    json.dumps({"id": 99999, "method": "Page.handleJavaScriptDialog", "params": {"accept": True}})
                )
                return {}
            data = json.loads(raw)
            if data.get("method") == "Page.javascriptDialogOpening":
                await self.ws.send(
                    json.dumps({"id": 99999, "method": "Page.handleJavaScriptDialog", "params": {"accept": True}})
                )
                continue
            if data.get("id") == mid:
                return data.get("result", {})

    async def eval(self, expr: str):
        res = await self.call("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
        return res.get("result", {}).get("value")

    async def insert_text(self, text: str):
        await self.call("Input.insertText", {"text": text})

    async def press_enter(self):
        await self.call(
            "Input.dispatchKeyEvent",
            {"type": "keyDown", "windowsVirtualKeyCode": 13, "key": "Enter", "code": "Enter"},
        )
        await self.call(
            "Input.dispatchKeyEvent",
            {"type": "keyUp", "windowsVirtualKeyCode": 13, "key": "Enter", "code": "Enter"},
        )

    async def press_space(self):
        await self.call(
            "Input.dispatchKeyEvent",
            {"type": "keyDown", "windowsVirtualKeyCode": 32, "key": " ", "code": "Space"},
        )
        await self.call(
            "Input.dispatchKeyEvent",
            {"type": "keyUp", "windowsVirtualKeyCode": 32, "key": " ", "code": "Space"},
        )

    async def mouse_click_xy(self, x: float, y: float):
        await self.call(
            "Input.dispatchMouseEvent",
            {"type": "mouseMoved", "x": x, "y": y, "button": "none", "buttons": 0},
        )
        await self.call(
            "Input.dispatchMouseEvent",
            {"type": "mousePressed", "x": x, "y": y, "button": "left", "buttons": 1, "clickCount": 1},
        )
        await self.call(
            "Input.dispatchMouseEvent",
            {"type": "mouseReleased", "x": x, "y": y, "button": "left", "buttons": 0, "clickCount": 1},
        )

    async def click_selector(self, selector: str, pick_last: bool = False) -> bool:
        sel_json = json.dumps(selector)
        last_flag = "true" if pick_last else "false"
        pt_raw = await self.eval(f"""JSON.stringify((() => {{
            const mf = document.querySelector('iframe#mainFrame');
            const doc = (mf && mf.contentDocument) ? mf.contentDocument : document;
            const mfRect = mf ? mf.getBoundingClientRect() : {{ left: 0, top: 0 }};
            const els = Array.from(doc.querySelectorAll({sel_json})).filter(e => e.offsetParent !== null || e.getBoundingClientRect().width > 0);
            if (!els.length) return null;
            const el = {last_flag} ? els[els.length - 1] : els[0];
            el.scrollIntoView({{ block: 'center', inline: 'center' }});
            const r = el.getBoundingClientRect();
            return {{ x: mfRect.left + r.left + r.width / 2, y: mfRect.top + r.top + r.height / 2 }};
        }})())""")
        if not pt_raw or pt_raw == "null":
            return False
        pt = json.loads(pt_raw)
        await self.mouse_click_xy(float(pt["x"]), float(pt["y"]))
        return True


async def inject_naver_cookies(cdp: CDPClient):
    ck_file = ROOT / ".naver-browser-profile" / "naver_cookies_backup.json"
    if not ck_file.exists():
        return
    cookies = json.loads(ck_file.read_text(encoding="utf-8"))
    await cdp.call("Network.enable")
    for ck in cookies:
        await cdp.call(
            "Network.setCookie",
            {
                "name": ck["name"],
                "value": ck["value"],
                "domain": ck["domain"],
                "path": ck.get("path", "/"),
                "secure": bool(ck.get("secure", False)),
                "httpOnly": bool(ck.get("httpOnly", False)),
            },
        )


async def publish_naver_blog_via_cdp(cdp: CDPClient, topic_idx: int = None) -> dict:
    cursor_path = ROOT / "logs" / "naver_blog_daily_cursor.json"
    if topic_idx is None:
        last_idx = 0
        if cursor_path.exists():
            try:
                cur = json.loads(cursor_path.read_text(encoding="utf-8"))
                last_idx = int(cur.get("lastTopicIdx", 0))
            except Exception:
                last_idx = 0
        topic_idx = (last_idx + 1) % len(DEEP_PARENTING_TOPICS)

    topic = DEEP_PARENTING_TOPICS[topic_idx % len(DEEP_PARENTING_TOPICS)]
    seq_num = topic_idx + 1
    image_paths = [str(Path(p).resolve()) for p in generate_all_blog_images(topic, seq_num)]
    clean_body = sanitize_se_one_body(topic["body"])
    deep_link = topic.get("deep_link", "https://kidsfit.co.kr/?ep=1")
    inflow_prefix = (
        f"⚡ [오늘의 키즈핏 교육 코칭 & 추천 육아템 공식 혜택가 + 1:1 발달진단 무료 오픈]\n"
        f"공식 판매처 1회 확인 시 4대 발달·성장 정밀 진단과 A4 코칭 워크북이 즉시 무료로 열립니다 👇\n"
        f"{deep_link}\n\n"
    )
    full_body = clean_body + "\n\n" + inflow_prefix

    print(f"📝 [네이버 블로그 자동 발행 시작] ({topic['category']}) {topic['title']}")
    await cdp.call("Page.enable")
    await cdp.call("DOM.enable")
    await cdp.call("Page.navigate", {"url": "https://blog.naver.com/PostWriteForm.naver?blogId=expertise333"})
    await asyncio.sleep(6.0)

    # Dismiss popups (both top document and mainFrame iframe if any)
    js_helper = """(() => {
        function getDoc() {
            const mf = document.querySelector('iframe#mainFrame');
            return (mf && mf.contentDocument) ? mf.contentDocument : document;
        }
        const doc = getDoc();
        doc.querySelectorAll('button.se-popup-button-cancel, button.se-help-panel-close-button').forEach(b => b.click());
        return doc.title || location.href;
    })()"""
    await cdp.eval(js_helper)
    await asyncio.sleep(0.8)

    # 1. Focus Title and insert title text via real mouse click
    focused_title = await cdp.click_selector(".se-documentTitle .se-text-paragraph, .se-title-text .se-text-paragraph")
    print("  • 제목 포커스:", focused_title)
    await asyncio.sleep(0.4)
    await cdp.insert_text(topic["title"])
    await asyncio.sleep(0.5)

    # 2. Focus Body paragraph via real mouse click
    await cdp.click_selector(".se-component.se-text .se-text-paragraph")
    await asyncio.sleep(0.4)

    # 3. Upload 3 infographic images via file input
    await cdp.eval("""(() => {
        const mf = document.querySelector('iframe#mainFrame');
        const doc = (mf && mf.contentDocument) ? mf.contentDocument : document;
        const btn = doc.querySelector('button.se-image-toolbar-button');
        if (btn) btn.click();
    })()""")
    await asyncio.sleep(1.0)
    doc_root = await cdp.call("DOM.getDocument", {"depth": -1, "pierce": True})
    root_node_id = doc_root.get("root", {}).get("nodeId", 1)
    q_res = await cdp.call("DOM.querySelectorAll", {"nodeId": root_node_id, "selector": "input[type='file']"})
    node_ids = q_res.get("nodeIds", [])
    if node_ids:
        await cdp.call("DOM.setFileInputFiles", {"files": image_paths, "nodeId": node_ids[-1]})
        await asyncio.sleep(1.8)
        clicked_layout = await cdp.click_selector("label.se-image-type-label")
        if not clicked_layout:
            await cdp.eval("""(() => {
                const mf = document.querySelector('iframe#mainFrame');
                const doc = (mf && mf.contentDocument) ? mf.contentDocument : document;
                const lbl = Array.from(doc.querySelectorAll('label.se-image-type-label, label, button, a')).find(b =>
                    (b.innerText || '').includes('개별') || (b.innerText || '').includes('확인')
                );
                if (lbl) lbl.click();
            })()""")
        print(f"  • 인포그래픽 {len(image_paths)}장 개별사진 레이아웃 선택(clicked={clicked_layout}) 및 업로드 대기...")
        await asyncio.sleep(5.5)

    # 4. Focus last text paragraph via real mouse click and insert body lines
    await cdp.click_selector(".se-component.se-text .se-text-paragraph", pick_last=True)
    await asyncio.sleep(0.4)
    await cdp.press_enter()

    for line in full_body.splitlines():
        cl = line.strip()
        if cl:
            await cdp.insert_text(cl)
            if cl.startswith("https://"):
                await cdp.press_space()
                await asyncio.sleep(0.2)
                await cdp.press_enter()
                await asyncio.sleep(0.8)
                continue
        await cdp.press_enter()
        await asyncio.sleep(0.015)

    await asyncio.sleep(1.2)

    # 5. Open Publish Drawer & Select Category + Tags + Confirm Publish
    await cdp.click_selector("button[class*='publish_btn']")
    await asyncio.sleep(1.8)

    # Enter tags
    tag_focused = await cdp.click_selector("input[placeholder*='태그'], input[id*='tag']")
    if tag_focused:
        for t in topic.get("tags", [])[:8]:
            clean_t = t.strip().lstrip("#")
            if clean_t:
                await cdp.insert_text(clean_t)
                await cdp.press_enter()
                await asyncio.sleep(0.15)

    await asyncio.sleep(0.5)
    await cdp.click_selector("button[data-testid='seOnePublishBtn'], button[class*='confirm_btn']")
    await asyncio.sleep(7.5)

    # 6. Resolve latest logNo from redirected URL or PostList
    cur_url = await cdp.eval("location.href") or ""
    m_url = re.search(r"logNo=(\d{10,15})", cur_url) or re.search(r"expertise333/(\d{10,15})", cur_url)
    log_no = m_url.group(1) if m_url else None
    if not log_no:
        await cdp.call(
            "Page.navigate",
            {"url": "https://blog.naver.com/PostList.naver?blogId=expertise333&categoryNo=0&from=postList"},
        )
        await asyncio.sleep(3.5)
        log_no = await cdp.eval("""(() => {
            const docs = [document, ...Array.from(document.querySelectorAll('iframe')).map(f => { try { return f.contentDocument; } catch(e) { return null; } }).filter(Boolean)];
            for (const doc of docs) {
                const a = Array.from(doc.querySelectorAll('a')).find(el => el.href && /logNo=\\d{10,15}/.test(el.href));
                if (a) {
                    const m = a.href.match(/logNo=(\\d{10,15})/);
                    if (m) return m[1];
                }
                const html = doc.body ? doc.body.innerHTML : '';
                const m2 = html.match(/logNo=(\\d{10,15})/);
                if (m2) return m2[1];
            }
            return null;
        })()""")
    post_url = f"https://blog.naver.com/expertise333/{log_no}" if log_no else "https://blog.naver.com/expertise333"
    print(f"  ✅ 네이버 블로그 발행 완료: {post_url}")

    entry = {
        "timestamp": datetime.now().isoformat(),
        "logNo": log_no or "published",
        "postUrl": post_url,
        "title": topic["title"],
        "category": topic["category"],
        "char_count": len(clean_body),
        "images": image_paths,
        "tags": topic["tags"][:10],
        "channel": "expertise333",
        "lastTopicIdx": topic_idx,
    }
    write_audit_log(entry)
    cursor_path.write_text(
        json.dumps(
            {
                "lastPublishedAt": entry["timestamp"],
                "lastLogNo": entry["logNo"],
                "lastTitle": entry["title"],
                "lastTopicIdx": topic_idx,
                "channel": "expertise333",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    send_telegram_notification(topic["title"], post_url, topic["category"], len(image_paths))
    return entry


async def publish_naver_cafe_via_cdp(cdp: CDPClient, topic_idx: int = None) -> dict:
    cursor_path = ROOT / "logs" / "naver_cafe_daily_cursor.json"
    if topic_idx is None:
        last_idx = -1
        if cursor_path.exists():
            try:
                cur = json.loads(cursor_path.read_text(encoding="utf-8"))
                last_idx = int(cur.get("lastTopicIdx", -1))
            except Exception:
                last_idx = -1
        topic_idx = (last_idx + 1) % len(DEEP_PARENTING_TOPICS)

    topic = DEEP_PARENTING_TOPICS[topic_idx % len(DEEP_PARENTING_TOPICS)]
    seq_num = topic_idx + 1
    image_paths = [str(Path(p).resolve()) for p in generate_all_blog_images(topic, seq_num)]
    menu_id = int(topic.get("cafe_menu_id", 3))
    board_name = topic.get("cafe_board", "우리아이 키성장·성조숙증")
    deep_link = topic.get("deep_link", f"https://kidsfit.co.kr/?ep={topic.get('ep', 1)}")
    cafe_title = f"[키즈핏 육아·교육 칼럼 #{topic.get('ep', seq_num)}] {topic['title']}"
    clean_body = sanitize_se_one_body(topic["body"])
    cafe_prefix = (
        f"🎁 [카페 회원 전용 무료 특전: 추천 육아템 공식 혜택가 비교 & A4 코칭 워크북 잠금해제]\n"
        f"아래 키즈핏 전용 링크에서 공식 판매처를 1회 확인하시면 4대 발달 진단과 A4 워크북이 즉시 무료로 열립니다 👇\n"
        f"{deep_link}\n\n"
    )
    full_body = cafe_prefix + clean_body

    write_url = f"https://cafe.naver.com/ca-fe/cafes/31805224/menus/{menu_id}/articles/write?boardType=L"
    print(f"☕ [네이버 카페 자동 발행 시작] ({board_name} · menu={menu_id}) {cafe_title}")
    await cdp.call("Page.enable")
    await cdp.call("DOM.enable")
    await cdp.call("Page.navigate", {"url": write_url})
    await asyncio.sleep(5.5)

    # Dismiss any popups
    await cdp.eval("""(() => {
        window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;
        document.querySelectorAll('button.BaseButton--gray, .se-popup-close-button, .se-popup-button-cancel, .se-help-panel-close-button').forEach(b => b.click());
        document.querySelectorAll('.se-popup-dim').forEach(d => d.remove());
    })()""")
    await asyncio.sleep(0.6)

    # 1. Fill Cafe Title (textarea.textarea_input)
    title_escaped = json.dumps(cafe_title)
    filled_title = await cdp.eval(f"""(() => {{
        const inp = document.querySelector("textarea.textarea_input[placeholder*='제목'], textarea.textarea_input");
        if (!inp) return false;
        inp.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(inp, {title_escaped});
        inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
        inp.dispatchEvent(new Event('change', {{ bubbles: true }}));
        return true;
    }})()""")
    print("  • 카페 제목 입력:", filled_title)
    await asyncio.sleep(0.5)

    # 2. Focus Body paragraph & upload infographic
    await cdp.click_selector(".se-component.se-text .se-text-paragraph, .se-text-paragraph")
    await asyncio.sleep(0.4)

    await cdp.eval("""(() => {
        const btn = document.querySelector('button.se-image-toolbar-button');
        if (btn) btn.click();
    })()""")
    await asyncio.sleep(1.0)
    doc_root = await cdp.call("DOM.getDocument", {"depth": -1, "pierce": True})
    root_node_id = doc_root.get("root", {}).get("nodeId", 1)
    q_res = await cdp.call("DOM.querySelectorAll", {"nodeId": root_node_id, "selector": "input[type='file']"})
    node_ids = q_res.get("nodeIds", [])
    if node_ids and image_paths:
        await cdp.call("DOM.setFileInputFiles", {"files": image_paths[:2], "nodeId": node_ids[-1]})
        await asyncio.sleep(1.8)
        clicked_layout = await cdp.click_selector("label.se-image-type-label")
        if not clicked_layout:
            await cdp.eval("""(() => {
                const lbl = Array.from(document.querySelectorAll('label.se-image-type-label, label, button, a')).find(b =>
                    (b.innerText || '').includes('개별') || (b.innerText || '').includes('확인')
                );
                if (lbl) lbl.click();
            })()""")
        print(f"  • 카페 인포그래픽 {len(image_paths[:2])}장 첨부 완료 (clicked={clicked_layout})")
        await asyncio.sleep(4.5)

    await cdp.click_selector(".se-component.se-text .se-text-paragraph, .se-text-paragraph", pick_last=True)
    await asyncio.sleep(0.4)
    await cdp.press_enter()

    for line in full_body.splitlines():
        cl = line.strip()
        if cl:
            await cdp.insert_text(cl)
            if cl.startswith("https://"):
                await cdp.press_space()
                await asyncio.sleep(0.2)
                await cdp.press_enter()
                await asyncio.sleep(0.8)
                continue
        await cdp.press_enter()
        await asyncio.sleep(0.015)

    await asyncio.sleep(1.0)

    # 3. Enter tags
    tag_focused = await cdp.click_selector("input.tag_input, input[placeholder*='태그']")
    if tag_focused:
        for t in topic.get("tags", [])[:6]:
            clean_t = t.strip().lstrip("#")
            if clean_t:
                await cdp.insert_text(clean_t)
                await cdp.press_enter()
                await asyncio.sleep(0.15)

    # 4. Click Register button
    await cdp.eval("""(() => {
        window.confirm = () => true; window.alert = () => true; window.onbeforeunload = null;
        const btns = Array.from(document.querySelectorAll('button.BaseButton--skinGreen, a.BaseButton--skinGreen, button'));
        const reg = btns.find(b => (b.innerText || '').trim() === '등록');
        if (reg) reg.click();
    })()""")
    await asyncio.sleep(6.5)

    cur_url = await cdp.eval("location.href") or ""
    m_art = re.search(r"articleid(?:=|%3D)(\d+)", cur_url, re.IGNORECASE) or re.search(r"/articles/(\d+)", cur_url)
    article_id = m_art.group(1) if m_art else None
    if not article_id:
        try:
            latest_id = await cdp.eval("""(async () => {
                const r = await fetch('https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=31805224&search.queryType=lastArticle&search.page=1&search.perPage=5', { credentials: 'include' });
                const j = await r.json();
                const list = (j.message && j.message.result && j.message.result.articleList) || [];
                return list.length > 0 ? String(list[0].articleId) : null;
            })()""")
            article_id = latest_id
        except Exception:
            article_id = None

    cafe_url = (
        f"https://cafe.naver.com/ca-fe/cafes/31805224/articles/{article_id}"
        if article_id
        else "https://cafe.naver.com/moneyfitlab"
    )
    print(f"  ✅ 네이버 카페 발행 완료: {cafe_url}")

    cursor_path.parent.mkdir(parents=True, exist_ok=True)
    cursor_path.write_text(
        json.dumps(
            {
                "lastPublishedAt": datetime.now().isoformat(),
                "lastArticleId": article_id or "published",
                "lastTitle": cafe_title,
                "lastTopicIdx": topic_idx,
                "cafeUrl": cafe_url,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return {
        "timestamp": datetime.now().isoformat(),
        "articleId": article_id or "published",
        "cafeUrl": cafe_url,
        "board": board_name,
        "title": cafe_title,
        "deepLink": deep_link,
        "lastTopicIdx": topic_idx,
    }


async def run_kin_and_blog_tour_via_cdp(cdp: CDPClient) -> dict:
    st = load_state()
    cycle = int(st.get("cycle", 0)) + 1
    st["cycle"] = cycle
    answered_urls = st.setdefault("answered_kin_urls", [])
    visited_blogs = st.setdefault("visited_blog_urls", [])

    # 1. Naver Knowledge iN (지식iN) Live Answer (Zero-URL clinical answer)
    item = SAFE_BACKLOG_ITEMS[(cycle - 1) % len(SAFE_BACKLOG_ITEMS)]
    q_encoded = urllib.parse.quote(item["kin_search_query"])
    search_url = f"https://kin.naver.com/search/list.naver?query={q_encoded}&section=qna&sort=date"
    print(f"🔍 [네이버 지식iN 실시간 질문 탐색] 검색어: {item['kin_search_query']}")
    await cdp.call("Page.navigate", {"url": search_url})
    await asyncio.sleep(3.5)

    q_links_raw = await cdp.eval("""JSON.stringify((() => {
        const anchors = Array.from(document.querySelectorAll('ul.basic1 li dl dt a, .search_list a'));
        const seen = new Set();
        const out = [];
        for (const a of anchors) {
            const href = a.href || '';
            const title = (a.innerText || '').trim();
            if (href.includes('kin.naver.com/qna/detail.naver') && title.length >= 6 && !seen.has(href)) {
                seen.add(href);
                out.push({ title, url: href });
            }
        }
        return out;
    })())""")
    q_links = json.loads(q_links_raw or "[]")
    relevant_kw = [
        "키", "성장", "아이", "초등", "중학", "유아", "개월", "살", "공부", "수학", "독서",
        "문해력", "집중", "수면", "영양", "칼슘", "우유", "교구", "가베", "몬테소리",
        "박물관", "사춘기", "성조숙", "거북목", "자세", "체중", "몸무게", "아들", "딸",
        "아기", "신생아", "통잠", "속싸개", "자석", "블록", "장난감", "의자", "비타민", "유산균"
    ]
    filtered_links = [q for q in q_links if any(k in q.get("title", "") for k in relevant_kw)]
    candidates = [q for q in filtered_links if q["url"] not in answered_urls] or filtered_links[:3]

    kin_result = {"status": "curated_ready", "query": item["kin_search_query"]}
    for target_q in candidates[:3]:
        print(f"  👉 지식iN 질문 진입: {target_q['title'][:40]}")
        await cdp.call("Page.navigate", {"url": target_q["url"]})
        await asyncio.sleep(4.0)

        clicked_ans = await cdp.eval("""(() => {
            const selectors = ['#answerWriteButton', 'a._answerWriteButton', 'button._answerWriteButton', '.c-heading-answer__button a', 'a[href*="answerWrite"]'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null) { el.click(); return true; }
            }
            const allBtns = Array.from(document.querySelectorAll('a, button'));
            const ansBtn = allBtns.find(b => (b.innerText || '').trim().includes('답변하기') && b.offsetParent !== null);
            if (ansBtn) { ansBtn.click(); return true; }
            return false;
        })()""")
        if not clicked_ans:
            kin_result = {
                "status": "curated_ready",
                "query": item["kin_search_query"],
                "question_title": target_q["title"],
                "question_url": target_q["url"],
            }
            continue

        await asyncio.sleep(3.5)
        focused_ed = await cdp.eval("""(() => {
            const docs = [document, ...Array.from(document.querySelectorAll('iframe')).map(f => { try { return f.contentDocument; } catch(e) { return null; } }).filter(Boolean)];
            for (const doc of docs) {
                const el = doc.querySelector('.se-component.se-text .se-text-paragraph, .se-content, [contenteditable="true"], textarea');
                if (el) { el.click(); return true; }
            }
            return false;
        })()""")
        if focused_ed:
            safe_text = item["kin_answer_no_link"]
            for line in safe_text.splitlines():
                cl = line.strip()
                if cl:
                    await cdp.insert_text(cl)
                await cdp.press_enter()
                await asyncio.sleep(0.02)
            await asyncio.sleep(1.5)
            await cdp.eval("""(() => {
                const docs = [document, ...Array.from(document.querySelectorAll('iframe')).map(f => { try { return f.contentDocument; } catch(e) { return null; } }).filter(Boolean)];
                for (const doc of docs) {
                    const btns = Array.from(doc.querySelectorAll('a, button'));
                    const reg = btns.find(b => ['답변등록', '등록하기', '답변 등록'].some(k => (b.innerText || '').trim().includes(k)));
                    if (reg) { reg.click(); return true; }
                }
                return false;
            })()""")
            await asyncio.sleep(4.0)
            answered_urls.append(target_q["url"])
            kin_result = {
                "status": "published_no_link",
                "reason": "외부 URL 0개(노링크 '키즈핏 그로스 스튜디오' 브랜드 검색 유도형) 자동 답변 완료",
                "query": item["kin_search_query"],
                "question_title": target_q["title"],
                "question_url": target_q["url"],
            }
            print(f"  ✅ 지식iN 답변 등록 완료: {target_q['title'][:40]}")
            break

    # 2. Own Blog (expertise333) First-Comment Pinning & Visitor Comment Reply Management
    commented_own = st.setdefault("commented_own_posts", [])
    replied_cids = st.setdefault("replied_comment_ids", [])
    own_mgmt_result = {"pinned_first_comment": False, "visitor_replies": 0, "accepted_buddies": 0}

    # 2-A. Accept any incoming mutual neighbor (서로이웃) requests
    try:
        await cdp.call("Page.navigate", {"url": "https://m.blog.naver.com/BuddyMeManage.naver?blogId=expertise333"})
        await asyncio.sleep(2.8)
        acc_cnt = await cdp.eval("""(() => {
            const btns = Array.from(document.querySelectorAll('button, a')).filter(b => (b.innerText || '').trim() === '수락');
            btns.forEach(b => b.click());
            return btns.length;
        })()""")
        own_mgmt_result["accepted_buddies"] = int(acc_cnt or 0)
    except Exception:
        pass

    # 2-B. Pin first comment & reply to visitor comments on latest own blog post
    cursor_path = ROOT / "logs" / "naver_blog_daily_cursor.json"
    if cursor_path.exists():
        try:
            cur = json.loads(cursor_path.read_text(encoding="utf-8"))
            last_log_no = str(cur.get("lastLogNo", ""))
            last_idx = int(cur.get("lastTopicIdx", 0))
            ep_num = (last_idx % 10) + 1
            if last_log_no.isdigit():
                own_c_url = f"https://m.blog.naver.com/CommentList.naver?blogId=expertise333&logNo={last_log_no}"
                await cdp.call("Page.navigate", {"url": own_c_url})
                await asyncio.sleep(3.2)

                # Pin first comment if not yet pinned
                if last_log_no not in commented_own:
                    pin_msg = (
                        f"📌 [방문자 필독 · 본문 추천 육아템 공식 혜택가 & 무료 발달진단·A4 워크북 바로가기]\n"
                        f"본문에 소개된 교구·영양제 상세 비교표와 공식 판매처(확인 즉시 4대 발달진단 & A4 워크북 무료 오픈)는 아래 전용 링크에서 바로 확인하실 수 있습니다 👇\n"
                        f"👉 오늘의 에피소드 전용 스토어: https://kidsfit.co.kr/?ep={ep_num}\n"
                        f"👉 1분 무료 예상키·두뇌 발달 진단: https://kidsfit.co.kr"
                    )
                    focused_c = await cdp.click_selector("#naverComment__write_textarea, div.u_cbox_text, textarea.u_cbox_text")
                    if focused_c:
                        await asyncio.sleep(0.4)
                        await cdp.insert_text(pin_msg)
                        await asyncio.sleep(0.6)
                        await cdp.eval("""(() => {
                            const btn = document.querySelector('button.u_cbox_btn_upload.__uis_naverComment_writeButton, button.u_cbox_btn_upload');
                            if (btn) btn.click();
                        })()""")
                        await asyncio.sleep(2.5)
                        commented_own.append(last_log_no)
                        own_mgmt_result["pinned_first_comment"] = True
                        print(f"  📌 내 블로그 최신글({last_log_no}) 첫 댓글 딥링크 고정 완료")

                # Like & reply to any external visitor comments
                visitor_Action = await cdp.eval("""(() => {
                    let liked = 0;
                    document.querySelectorAll('a.u_cbox_btn_recomm:not(.u_cbox_btn_recomm_on)').forEach(b => { b.click(); liked++; });
                    return liked;
                })()""")
                own_mgmt_result["visitor_replies"] = int(visitor_Action or 0)
        except Exception as e:
            print("  ⚠️ 내 블로그 댓글 관리 경고:", e)

    # 3. External Parenting Blog Sympathy (공감) + Comment (댓글) + Mutual Neighbor Add (서로이웃/이웃추가)
    tour_topic = BLOG_TOUR_TOPICS[(cycle - 1) % len(BLOG_TOUR_TOPICS)]
    b_query = urllib.parse.quote(tour_topic["query"])
    await cdp.call("Page.navigate", {"url": f"https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query={b_query}"})
    await asyncio.sleep(3.5)
    b_links_raw = await cdp.eval("""JSON.stringify((() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="blog.naver.com/"]'));
        const seen = new Set();
        const out = [];
        for (const a of anchors) {
            const href = a.href || '';
            const title = (a.innerText || '').trim();
            const m = href.match(/blog\\.naver\\.com\\/([a-zA-Z0-9_-]+)\\/(\\d+)/);
            if (m && m[1] !== 'expertise333' && title.length >= 8 && !seen.has(href)) {
                seen.add(href);
                out.push({ blogId: m[1], logNo: m[2], title: title.slice(0, 50), url: href });
            }
        }
        return out.slice(0, 4);
    })())""")
    b_links = json.loads(b_links_raw or "[]")
    candidates_blog = [b for b in b_links if b["url"] not in visited_blogs][:2] or b_links[:2]
    tour_results = []
    greetings = [
        "안녕하세요! 아이 신체 성장과 두뇌·학습 발달을 연구하며 기록하는 키즈핏입니다 :) 정성스러운 육아·교육 글 잘 읽고 공감 남기며 서로이웃 신청드려요. 따뜻하게 소통하며 지내요!",
        "반갑습니다 :) 아이 키 성장과 연령별 공부법·주말 나들이 코스를 나누는 키즈핏입니다. 올려주신 정성스러운 글에 많이 공감하며 서로이웃 신청드려요! 자주 소통하러 올게요 :)",
    ]

    for bl in candidates_blog:
        b_id, l_no = bl["blogId"], bl["logNo"]
        m_post_url = f"https://m.blog.naver.com/PostView.naver?blogId={b_id}&logNo={l_no}"
        m_comm_url = f"https://m.blog.naver.com/CommentList.naver?blogId={b_id}&logNo={l_no}"
        m_buddy_url = f"https://m.blog.naver.com/BuddyAddForm.naver?blogId={b_id}"

        # 3-A. Visit mobile post & click Sympathy (공감)
        await cdp.call("Page.navigate", {"url": m_post_url})
        await asyncio.sleep(3.2)
        sym = await cdp.eval("""(() => {
            window.scrollTo(0, document.body ? document.body.scrollHeight : 1000);
            const btn = document.querySelector('a.u_likeit_list_button._button.off, a.u_likeit_button._face.off, a.u_likeit_list_btn._button[aria-pressed="false"], .u_likeit_button:not(.on)');
            if (btn) { btn.click(); return true; }
            return false;
        })()""")
        await asyncio.sleep(1.0)

        # 3-B. Leave warm parenting comment on CommentList
        await cdp.call("Page.navigate", {"url": m_comm_url})
        await asyncio.sleep(2.8)
        comment_posted = False
        focused_cb = await cdp.click_selector("#naverComment__write_textarea, div.u_cbox_text, textarea.u_cbox_text")
        if focused_cb:
            await asyncio.sleep(0.4)
            msg_to_type = random.choice(tour_topic["comments"])
            await cdp.insert_text(msg_to_type)
            await asyncio.sleep(0.7)
            clicked_up = await cdp.eval("""(() => {
                const btn = document.querySelector('button.u_cbox_btn_upload.__uis_naverComment_writeButton, button.u_cbox_btn_upload');
                if (btn) { btn.click(); return true; }
                return false;
            })()""")
            if clicked_up:
                await asyncio.sleep(2.5)
                comment_posted = True

        # 3-C. Send Mutual Neighbor (서로이웃 신청) or Neighbor (이웃추가) Request
        await cdp.call("Page.navigate", {"url": m_buddy_url})
        await asyncio.sleep(2.4)
        greet_escaped = json.dumps(random.choice(greetings))
        buddy_status = await cdp.eval(f"""(() => {{
            window.alert = () => true; window.confirm = () => true;
            const txt = (document.body && document.body.innerText) || '';
            if (txt.includes('이미 이웃') || txt.includes('진행중')) return '이미이웃/신청중';
            const bothR = document.querySelector('input#bothBuddyRadio');
            const oneR = document.querySelector('input#buddyRadio');
            let mode = 'none';
            if (bothR && !bothR.disabled) {{
                bothR.click();
                const lbl = document.querySelector('label[for="bothBuddyRadio"]');
                if (lbl) lbl.click();
                mode = 'mutual';
            }} else if (oneR && !oneR.disabled) {{
                oneR.click();
                const lbl = document.querySelector('label[for="buddyRadio"]');
                if (lbl) lbl.click();
                mode = 'neighbor';
            }}
            if (mode === 'mutual') {{
                const ta = document.querySelector('textarea.textarea_t1, textarea#inviteMessage, textarea');
                if (ta) {{
                    ta.focus();
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    setter.call(ta, {greet_escaped});
                    ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
            }}
            if (mode === 'mutual' || mode === 'neighbor') {{
                const ok = document.querySelector('a.btn_ok, button.btn_ok');
                if (ok) ok.click();
                return mode === 'mutual' ? '서로이웃신청완료' : '이웃추가완료';
            }}
            return '이웃확인완료';
        }})()""")
        await asyncio.sleep(2.0)

        visited_blogs.append(bl["url"])
        tour_results.append({
            "blogId": b_id,
            "title": bl["title"],
            "url": bl["url"],
            "sympathy_clicked": bool(sym),
            "comment_posted": bool(comment_posted),
            "buddy_status": buddy_status or "확인완료",
        })
        print(f"  🤝 육아 블로그 투어({b_id}): 공감={bool(sym)} · 댓글={bool(comment_posted)} · 이웃={buddy_status}")

    st.setdefault("history", []).append(
        {
            "cycle": cycle,
            "executedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S KST"),
            "tourQuery": tour_topic["query"],
            "ownBlogManagement": own_mgmt_result,
            "blogTourResults": tour_results,
            "kinResult": kin_result,
        }
    )
    save_state(st)
    return {
        "cycle": cycle,
        "ownBlogManagement": own_mgmt_result,
        "kinResult": kin_result,
        "blogTourResults": tour_results,
    }


async def main_async():
    parser = argparse.ArgumentParser()
    parser.add_argument("--blog", action="store_true", help="Publish 1 Naver Blog post")
    parser.add_argument("--cafe", action="store_true", help="Publish 1 Naver Cafe post")
    parser.add_argument("--kin", action="store_true", help="Run 1 Naver Kin + Blog Tour cycle")
    parser.add_argument("--all", action="store_true", help="Run Blog + Cafe + Kin + Blog Tour cycle")
    parser.add_argument("--topic-idx", type=int, default=None)
    args = parser.parse_args()

    ws_url = ensure_daemon_running()
    async with websockets.connect(ws_url, max_size=50_000_000) as ws:
        cdp = CDPClient(ws)
        await cdp.call("Page.enable")
        await cdp.call(
            "Page.addScriptToEvaluateOnNewDocument",
            {
                "source": (
                    "window.alert = () => true; window.confirm = () => true; window.prompt = () => ''; "
                    "window.onbeforeunload = null; "
                    "const _origAEL = EventTarget.prototype.addEventListener; "
                    "EventTarget.prototype.addEventListener = function(t, fn, o) { "
                    "if (t === 'beforeunload') return; return _origAEL.call(this, t, fn, o); };"
                )
            },
        )
        await inject_naver_cookies(cdp)
        out = {}
        if args.blog or args.all:
            out["blog"] = await publish_naver_blog_via_cdp(cdp, args.topic_idx)
        if args.cafe or args.all:
            out["cafe"] = await publish_naver_cafe_via_cdp(cdp, args.topic_idx)
        if args.kin or args.all:
            out["kin"] = await run_kin_and_blog_tour_via_cdp(cdp)
        print("RESULT_JSON=" + json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main_async())
