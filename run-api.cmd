@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title ContractLens API
call pnpm --filter @workspace/api-server run build
if errorlevel 1 goto :fail
call pnpm --filter @workspace/api-server run start
if errorlevel 1 goto :fail
exit /b 0
:fail
echo.
echo [ContractLens API] The API stopped because the command above failed.
echo Check the error above, then press any key to close this window.
pause >nul
exit /b 1
