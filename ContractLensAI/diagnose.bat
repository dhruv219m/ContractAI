@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title ContractLens Diagnostics

echo ==========================================
echo ContractLens Windows Diagnostics
echo ==========================================
echo.
echo Folder:
cd

echo.
echo Node:
node --version
if errorlevel 1 echo Node.js unavailable.

echo.
echo pnpm:
pnpm --version
if errorlevel 1 echo pnpm unavailable.

echo.
echo Workspace packages:
pnpm --filter @workspace/api-server --if-present exec node -e "console.log('API workspace reachable')"
pnpm --filter @workspace/contractlens --if-present exec node -e "console.log('Web workspace reachable')"

echo.
echo Installed esbuild packages:
pnpm list esbuild --depth 0

echo.
echo Diagnostics finished.
pause
