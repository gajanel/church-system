@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title SIGDEM 1.1.0

if not exist "SIGDEM_Backend.exe" (
    echo ERROR: No se encontro SIGDEM_Backend.exe.
    pause
    exit /b 1
)

if not exist ".env" (
    echo ERROR: No se encontro el archivo .env de produccion.
    pause
    exit /b 1
)

if not exist "frontend\index.html" (
    echo ERROR: No se encontro el frontend compilado.
    pause
    exit /b 1
)

tasklist /FI "IMAGENAME eq SIGDEM_Backend.exe" 2>nul | find /I "SIGDEM_Backend.exe" >nul
if not errorlevel 1 (
    echo SIGDEM ya se encuentra en ejecucion.
) else (
    echo Iniciando SIGDEM...
    start "SIGDEM Backend" /D "%~dp0" "%~dp0SIGDEM_Backend.exe"
)

timeout /T 4 /NOBREAK >nul
start "" "http://localhost:8000"
exit /b 0
