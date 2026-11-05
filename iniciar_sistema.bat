@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Iniciar SIGDEM para pruebas

echo ==========================================
echo Iniciando SIGDEM en modo de pruebas
echo ==========================================

set "PYTHON_EXE=C:\Users\gerso\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if not exist "%PYTHON_EXE%" (
    echo ERROR: No se encontro el entorno Python del backend.
    echo Ruta esperada: %PYTHON_EXE%
    pause
    exit /b 1
)

if not exist "backend\.env" if not exist ".env" (
    echo ERROR: No se encontro la configuracion .env.
    pause
    exit /b 1
)

if not exist "church-frontend\node_modules" (
    echo ERROR: Faltan las dependencias del frontend.
    echo Ejecuta npm install dentro de church-frontend.
    pause
    exit /b 1
)

powershell -NoProfile -Command "if (Test-NetConnection 127.0.0.1 -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo ERROR: PostgreSQL no responde en localhost:5432.
    echo Inicia el servicio PostgreSQL y vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul
if not errorlevel 1 (
    echo ERROR: El puerto 8000 ya esta ocupado. Cierra el backend anterior.
    pause
    exit /b 1
)

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul
if not errorlevel 1 (
    echo ERROR: El puerto 5173 ya esta ocupado. Cierra el frontend anterior.
    pause
    exit /b 1
)

echo Iniciando backend...
start "SIGDEM - Backend" cmd /k "cd /d ""%~dp0backend"" && set ""PYTHONPATH=%~dp0backend\runtime_packages"" && ""%PYTHON_EXE%"" -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo Iniciando frontend...
start "SIGDEM - Frontend" cmd /k "cd /d ""%~dp0church-frontend"" && npm.cmd run dev -- --host 127.0.0.1"

echo Esperando que los servicios esten disponibles...
timeout /T 6 /NOBREAK >nul
start "" "http://localhost:5173"

echo.
echo SIGDEM se abrio en http://localhost:5173
echo Conserva abiertas las ventanas Backend y Frontend durante las pruebas.
echo Para detenerlo, cierra ambas ventanas.
exit /b 0
