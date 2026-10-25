@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22.13 ou superior antes de iniciar o Ritmo.
  pause
  exit /b 1
)
if not exist "node_modules\" (
  call npm install --no-audit --no-fund
  if errorlevel 1 exit /b 1
)
if not exist "dist\index.html" (
  call npm run build
  if errorlevel 1 exit /b 1
)
echo.
echo Ritmo pessoal - abra http://localhost:3000 no navegador.
echo Acesso por outros dispositivos da mesma rede esta habilitado pela flag RITMO_LAN_ACCESS=true.
echo Use o IP local deste computador, por exemplo http://192.168.0.10:3000.
echo Mantenha esta janela aberta enquanto estiver usando.
echo Para encerrar, pressione Ctrl+C.
echo.
call npm start
pause
