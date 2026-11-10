@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 goto folder_error
title Sen An Nhien - Choi game LAN

where node >nul 2>nul
if errorlevel 1 goto node_error
node -e "const [major,minor]=process.versions.node.split('.').map(Number); process.exit(major>18 || (major===18 && minor>=20) ? 0 : 1);"
if errorlevel 1 goto node_error

rem Source checkouts need a fresh build. Prebuilt Play packages can launch directly.
if exist "src\main.tsx" goto prepare_source
goto start_game

:prepare_source
if not exist "package.json" goto source_error
if not exist "package-lock.json" goto source_error
where npm.cmd >nul 2>nul
if errorlevel 1 goto npm_error
if not exist "node_modules\.bin\vite.cmd" goto install_dependencies
if not exist "node_modules\.bin\tsc.cmd" goto install_dependencies
if not exist "node_modules\.bin\tsx.cmd" goto install_dependencies
goto build_game

:install_dependencies
echo Dang cai thu vien cho lan chay dau. Can ket noi Internet...
call npm ci --include=dev --no-audit --no-fund
set "game_exit=%errorlevel%"
if not "%game_exit%"=="0" goto install_error

:build_game
echo.
echo Dang tao ban game tu code moi nhat. Vui long doi...
call npm run build
set "game_exit=%errorlevel%"
if not "%game_exit%"=="0" goto build_error

:start_game
if not exist "dist\index.html" goto missing_build
if not exist "scripts\play-lan.mjs" goto source_error
echo.
echo Dang mo game. Giu cua so nay mo trong khi choi.
node scripts\play-lan.mjs %*
set "game_exit=%errorlevel%"
if not "%game_exit%"=="0" echo Khong khoi dong duoc game. Xem thong bao loi o tren.
pause
exit /b %game_exit%

:folder_error
echo Khong mo duoc thu muc game. Hay giai nen hoac clone day du repo roi thu lai.
set "game_exit=1"
goto finish_error

:node_error
echo Can cai Node.js 18.20 tro len tu https://nodejs.org roi mo lai CMD.
set "game_exit=1"
goto finish_error

:npm_error
echo Khong tim thay npm. Hay cai lai Node.js kem npm roi mo lai CMD.
set "game_exit=1"
goto finish_error

:source_error
echo Thieu file nguon hoac file khoi dong. Hay git pull hoac clone day du repo.
set "game_exit=1"
goto finish_error

:missing_build
echo Khong tim thay dist\index.html. Can ban nguon day du hoac goi Play da build.
set "game_exit=1"
goto finish_error

:install_error
echo Cai thu vien that bai. Kiem tra ket noi Internet va thong bao loi o tren.
goto finish_error

:build_error
echo Build that bai. Xem loi o tren; co the thu npm ci --include=dev roi mo lai CMD.

:finish_error
pause
exit /b %game_exit%
