# MoneyFit Daily Unattended Automation & Telegram Reporting Scheduler Installer
# Registers a Windows Scheduled Task that runs `scripts/auto-master.js --live` every day at 03:00 AM
# and sends the completion report directly to your Telegram.

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$NodePath = (Get-Command node).Source
$ScriptPath = Join-Path $ProjectDir "scripts\auto-master.js"
$TaskName = "MoneyFit_Daily_AutoMaster_Telegram"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  [MoneyFit] 무인 야간 자동 증식 & 텔레그램 보고 스케줄러 등록" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`" --live" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "매일 새벽 3시 머니핏 36개 SEO 빌드, 108편 바이럴 원고, 스나이퍼 키트 갱신 및 텔레그램 자동 완료 보고" -Force | Out-Null

Write-Host "✅ 윈도우 작업 스케줄러 등록 완료: $TaskName (매일 03:00 AM 자동 실행 및 텔레그램 보고)" -ForegroundColor Green
