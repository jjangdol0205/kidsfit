# -*- coding: utf-8 -*-
"""
Inspects exact form inputs (excluding #gnb) for Blog & Cafe admin pages.
"""

import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\키즈핏")
LOG_DIR = ROOT / "logs"


def get_clean_inputs(target):
    return target.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('input, textarea, select, button, a, label')).filter(el => !el.closest('#gnb'));
        return els.map(el => ({
            tag: el.tagName,
            type: el.type || '',
            id: el.id || '',
            name: el.name || '',
            cls: el.className || '',
            forAttr: el.getAttribute('for') || '',
            val: (el.value || '').slice(0, 100),
            text: (el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 120),
            onclick: (el.getAttribute('onclick') || '').slice(0, 150),
            href: (el.getAttribute('href') || '').slice(0, 150)
        })).filter(x => x.id || x.name || x.onclick || x.tag === 'INPUT' || x.tag === 'TEXTAREA' || x.tag === 'SELECT' || x.tag === 'BUTTON' || (x.tag === 'A' && (x.cls.includes('btn') || x.cls.includes('_') || x.text.includes('추가') || x.text.includes('삭제') || x.text.includes('저장') || x.text.includes('확인'))));
    }""")


def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        out = {}

        # 1. Check Blog posts on m.blog.naver.com/expertise333?tab=1
        print("🔍 [1/6] 모바일 블로그 글 목록 DOM 확인...", flush=True)
        page.goto("https://m.blog.naver.com/expertise333?tab=1", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        out["blog_mobile_posts"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a[href*="expertise333/"]')).map(a => ({
                text: a.innerText.trim().replace(/\\s+/g, ' ').slice(0, 120),
                href: a.href
            }));
        }""")

        # 2. Check Blog subject labels in AdminUserBasic.naver
        print("🔍 [2/6] 블로그 기본정보(AdminUserBasic.naver) 주제 라벨 확인...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminUserBasic.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        out["blog_basic_labels"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('label[for^="label-subject"]')).map(l => ({
                forAttr: l.getAttribute('for'),
                text: l.innerText.trim(),
                val: (document.getElementById(l.getAttribute('for')) || {}).value
            }));
        }""")

        # 3. Check Blog Category tree in AdminCategoryView.naver
        print("🔍 [3/6] 블로그 카테고리(AdminCategoryView.naver) 구조 확인...", flush=True)
        page.goto("https://admin.blog.naver.com/AdminCategoryView.naver?blogId=expertise333", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        out["blog_categories"] = page.evaluate("""() => {
            const treeItems = Array.from(document.querySelectorAll('#tree li, .tree_item, [id^="category"]')).map(el => ({
                id: el.id,
                cls: el.className,
                text: el.innerText.trim().replace(/\\s+/g, ' ').slice(0, 100)
            }));
            return {
                treeItems: treeItems.slice(0, 50),
                buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a')).map(b => ({
                    tag: b.tagName,
                    id: b.id,
                    cls: b.className,
                    val: b.value || '',
                    text: b.innerText.trim(),
                    onclick: b.getAttribute('onclick') || ''
                })).filter(x => x.id || x.cls || x.val || x.text)
            };
        }""")

        # 4. Cafe ManageBaseInformation
        print("🔍 [4/6] 카페 기본정보(ManageBaseInformation.nhn) 입력 폼 확인...", flush=True)
        page.goto("https://cafe.naver.com/ManageBaseInformation.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        out["cafe_base_info"] = get_clean_inputs(page)

        # 5. Cafe ManageMenu
        print("🔍 [5/6] 카페 메뉴관리(ManageMenu.nhn) 입력 폼 확인...", flush=True)
        page.goto("https://cafe.naver.com/ManageMenu.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        out["cafe_menu_manage"] = get_clean_inputs(page)

        # 6. Cafe ManageMemberLevel
        print("🔍 [6/6] 카페 멤버등급관리(ManageMemberLevel.nhn) 입력 폼 확인...", flush=True)
        page.goto("https://cafe.naver.com/ManageMemberLevel.nhn?clubid=31805224", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        out["cafe_member_level"] = get_clean_inputs(page)

        out_path = LOG_DIR / "admin_forms_part2.json"
        out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ Part 2 분석 완료: {out_path}", flush=True)


if __name__ == "__main__":
    main()
