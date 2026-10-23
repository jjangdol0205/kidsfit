# -*- coding: utf-8 -*-
import sys
import time
from urllib.parse import quote
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

TEST_URLS = [
    ("11st_LINKPRICE_NEW_SEARCH", "https://click.linkprice.com/click.php?m=11st&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=" + quote("https://search.11st.co.kr/pc/total-search?kwd=" + quote("어린이 칼슘"))),
    ("YES24_LINKPRICE_DOUBLE_ENC", "https://click.linkprice.com/click.php?m=yes24&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=" + quote("https://www.yes24.com/Product/Search?domain=ALL&query=" + quote(quote("초등 하브루타")))),
    ("MRT_SHORT_X1g4da", "https://myrealt.rip/X1g4da"),
    ("MRT_BRIDGE", "https://www.myrealtrip.com/main/bridge/marketing?utm_source=mktpartner&mylink_id=6226316&return_url=" + quote("https://www.myrealtrip.com/search?q=" + quote("코엑스 아쿠아리움"))),
    ("KLOOK_AFF", "https://affiliate.klook.com/redirect?aid=140161&aff_adid=1514603&k_site=" + quote("https://www.klook.com/ko/search/result/?query=" + quote("코엑스 아쿠아리움"))),
    ("KKDAY_ADPICK", "https://adpick.co.kr/apis/goshopping.php?affid=4d31d3&offer=b796d&url=" + quote("https://www.kkday.com/ko/product/productlist?keyword=" + quote("코엑스 아쿠아리움"))),
    ("KYOBO_LINKPRICE", "https://click.linkprice.com/click.php?m=kyobobook&a=A100708867&l=9999&l_cd1=3&l_cd2=0&tu=" + quote("https://search.kyobobook.co.kr/search?keyword=" + quote("초등 하브루타"))),
    ("ALADIN_SEARCH", "https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=" + quote("초등 하브루타")),
]

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    context = browser.contexts[0]

    for name, url in TEST_URLS:
        page = context.new_page()
        try:
            page.goto(url, wait_until="commit", timeout=15000)
            time.sleep(3.5)
            title = page.title()
            final_url = page.url
            body_preview = page.evaluate("() => document.body ? document.body.innerText.replace(/\\s+/g, ' ').slice(0, 120) : ''")
            print(f"[{name}]\n  Final URL: {final_url[:110]}\n  Title: {title}\n  Preview: {body_preview}\n", flush=True)
        except Exception as e:
            print(f"[{name}] ERROR ({page.url[:80]}): {e}\n", flush=True)
        finally:
            page.close()
