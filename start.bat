@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [인스타그램 클론] 백엔드와 프론트엔드를 시작합니다...
call npm run dev
if errorlevel 1 pause
