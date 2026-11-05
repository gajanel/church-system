@echo off
setlocal EnableExtensions

tasklist /FI "IMAGENAME eq SIGDEM_Backend.exe" 2>nul | find /I "SIGDEM_Backend.exe" >nul
if errorlevel 1 (
    echo SIGDEM no se encuentra en ejecucion.
    exit /b 0
)

taskkill /IM SIGDEM_Backend.exe /F >nul
if errorlevel 1 (
    echo ERROR: No se pudo detener SIGDEM.
    pause
    exit /b 1
)

echo SIGDEM fue detenido correctamente.
exit /b 0
