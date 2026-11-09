@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js tu https://nodejs.org de choi ban game nay.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Khong tim thay ban build. Chay npm install va npm run build truoc.
  pause
  exit /b 1
)
title Sen An Nhien - LAN
node scripts\play-lan.mjs
pause
