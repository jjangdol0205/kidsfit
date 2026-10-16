@echo off
chcp 65001 >nul
title [MoneyFit x Antigravity] 텔레그램 양방향 원격 제어 데몬
cd /d "%~dp0"
echo ============================================================================
echo   🤖 텔레그램 ^<-^> 안티그래비티(Antigravity) 실시간 양방향 원격 제어 데몬
echo   스마트폰 텔레그램에서 명령을 입력하면 안티그래비티가 자동으로 작동합니다!
echo ============================================================================
node scripts/telegram-antigravity-bridge.js %*
pause
