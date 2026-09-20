@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title ContractLens Web
call pnpm --filter @workspace/contractlens run dev
if errorlevel 1 goto :fail
exit /b 0
:fail
echo.
echo [ContractLens Web] The web app stopped because the command above failed.
echo Check the error above, then press any key to close this window.
pause >nul
exit /b 1
