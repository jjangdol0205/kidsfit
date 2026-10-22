# -*- coding: utf-8 -*-
"""
Naver Browser Daemon (scripts/naver_browser_daemon.py)
Spawns Chrome directly on the interactive user desktop (WinSta0\\Default) with remote debugging port 9222,
and stays alive as a daemon so the Windows Job Object never terminates Chrome prematurely.
"""

import ctypes
from ctypes import wintypes
import sys
import time
import urllib.request
import json
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"d:\사업아이템")
PROFILE_DIR = ROOT / ".naver-browser-profile"
PROFILE_DIR.mkdir(parents=True, exist_ok=True)


class STARTUPINFOW(ctypes.Structure):
    _fields_ = [
        ("cb", wintypes.DWORD),
        ("lpReserved", wintypes.LPWSTR),
        ("lpDesktop", wintypes.LPWSTR),
        ("lpTitle", wintypes.LPWSTR),
        ("dwX", wintypes.DWORD),
        ("dwY", wintypes.DWORD),
        ("dwXSize", wintypes.DWORD),
        ("dwYSize", wintypes.DWORD),
        ("dwXCountChars", wintypes.DWORD),
        ("dwYCountChars", wintypes.DWORD),
        ("dwFillAttribute", wintypes.DWORD),
        ("dwFlags", wintypes.DWORD),
        ("wShowWindow", wintypes.WORD),
        ("cbReserved2", wintypes.WORD),
        ("lpReserved2", ctypes.POINTER(wintypes.BYTE)),
        ("hStdInput", wintypes.HANDLE),
        ("hStdOutput", wintypes.HANDLE),
        ("hStdError", wintypes.HANDLE),
    ]


class PROCESS_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("hProcess", wintypes.HANDLE),
        ("hThread", wintypes.HANDLE),
        ("dwProcessId", wintypes.DWORD),
        ("dwThreadId", wintypes.DWORD),
    ]


def launch_chrome_on_default_desktop():
    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    target_url = "https://nid.naver.com/nidlogin.login?mode=form&url=https%3A%2F%2Fwww.naver.com"
    cmd = (
        f'"{chrome_exe}" '
        f'--user-data-dir="{PROFILE_DIR}" '
        f'--remote-debugging-port=9222 '
        f'--start-maximized '
        f'--no-first-run '
        f'--no-default-browser-check '
        f'--disable-blink-features=AutomationControlled '
        f'"{target_url}"'
    )

    si = STARTUPINFOW()
    si.cb = ctypes.sizeof(STARTUPINFOW)
    si.lpDesktop = "WinSta0\\Default"
    si.dwFlags = 1  # STARTF_USESHOWWINDOW
    si.wShowWindow = 3  # SW_SHOWMAXIMIZED

    pi = PROCESS_INFORMATION()
    cmd_buf = ctypes.create_unicode_buffer(cmd)

    ok = ctypes.windll.kernel32.CreateProcessW(
        None,
        cmd_buf,
        None,
        None,
        False,
        0,
        None,
        None,
        ctypes.byref(si),
        ctypes.byref(pi),
    )
    if not ok:
        err = ctypes.windll.kernel32.GetLastError()
        raise RuntimeError(f"CreateProcessW failed with error {err}")

    print(f"✅ Launched Chrome on WinSta0\\Default (PID={pi.dwProcessId})", flush=True)
    return pi.dwProcessId


def main():
    pid = launch_chrome_on_default_desktop()
    for _ in range(15):
        try:
            with urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=2) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                print(f"✅ CDP Port 9222 Ready: {data.get('Browser')}", flush=True)
                break
        except Exception:
            time.sleep(1)

    while True:
        time.sleep(5)


if __name__ == "__main__":
    main()
