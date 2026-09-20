@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title ContractLens - Windows Launcher

echo.
echo ============================================================
echo                    CONTRACTLENS
echo                  Windows Local Launcher
echo ============================================================
echo.
echo Working directory:
echo %CD%
echo.

REM --- Check Node.js ---
where node >nul 2>&1
if errorlevel 1 goto NODE_MISSING

for /f "delims=" %%V in ('node --version 2^>nul') do set "NODE_VERSION=%%V"
echo [OK] Node.js %NODE_VERSION%

REM --- Check pnpm, otherwise try Corepack ---
where pnpm >nul 2>&1
if not errorlevel 1 goto PNPM_OK

echo [INFO] pnpm was not found. Trying Corepack...
where corepack >nul 2>&1
if errorlevel 1 goto PNPM_MISSING

call corepack enable >nul 2>&1
call corepack prepare pnpm@10 --activate >nul 2>&1

where pnpm >nul 2>&1
if errorlevel 1 goto PNPM_MISSING

:PNPM_OK
for /f "delims=" %%V in ('pnpm --version 2^>nul') do set "PNPM_VERSION=%%V"
echo [OK] pnpm %PNPM_VERSION%
echo.
echo [INFO] Enabling required dependency build scripts for this project...
call pnpm config set dangerouslyAllowAllBuilds true --location project >nul 2>nul
call pnpm config set ignore-scripts false --location project >nul 2>nul
echo [OK] Dependency build permissions configured.
echo.

REM --- Install dependencies ---
if not exist "node_modules" goto INSTALL_DEPS
if exist "node_modules\.pnpm\esbuild@0.28.2" goto DEPS_READY
if exist "node_modules\.pnpm" goto INSTALL_DEPS

:INSTALL_DEPS

echo [INFO] Installing dependencies...
echo [INFO] This may take a few minutes on the first run.
echo.

call pnpm install --config.ignore-scripts=false --config.dangerouslyAllowAllBuilds=true
if errorlevel 1 goto INSTALL_FAILED

:DEPS_READY
echo.
echo [OK] Dependencies are installed.
echo.

REM --- Start API and web in separate windows ---
echo [INFO] Starting ContractLens API...
start "ContractLens API" cmd /k "cd /d ""%~dp0"" && call run-api.bat"

echo [INFO] Starting ContractLens Web...
start "ContractLens Web" cmd /k "cd /d ""%~dp0"" && call run-web.bat"

echo.
echo ============================================================
echo                     ContractLens started
echo ============================================================
echo.
echo Web: http://localhost:5173
echo API: http://localhost:5000
echo.
echo Two windows were opened. Keep them open while using the app.
echo.
pause
exit /b 0

:NODE_MISSING
echo [ERROR] Node.js was not found on PATH.
echo Install Node.js 20+ LTS, restart Windows, and run this again.
echo.
pause
exit /b 1

:PNPM_MISSING
echo [ERROR] pnpm/Corepack is not available.
echo Install Node.js 20+ LTS with Corepack, restart Windows, then retry.
echo.
pause
exit /b 1

:INSTALL_FAILED
echo.
echo [ERROR] pnpm install failed.
echo The command window was intentionally kept open so the error above is visible.
echo.
pause
exit /b 1
