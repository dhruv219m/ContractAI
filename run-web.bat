@echo off
setlocal
cd /d "%~dp0"
title ContractLens Web
echo ============================================================
echo                   ContractLens Web
echo ============================================================
echo.
echo Starting web app on port 5173...
set PORT=5173
set NODE_ENV=development
set BASE_PATH=/
call pnpm --filter @workspace/contractlens run dev
echo.
echo Web process ended.
pause
