@echo off
setlocal
cd /d "%~dp0"
title ContractLens API
echo ============================================================
echo                    ContractLens API
echo ============================================================
echo.
echo Building API...
call pnpm --filter @workspace/api-server run build
if errorlevel 1 (
  echo.
  echo [ERROR] API build failed.
  pause
  exit /b 1
)
echo.
echo Starting API on port 5000...
set PORT=5000
set NODE_ENV=development
call pnpm --filter @workspace/api-server run start
echo.
echo API process ended.
pause
