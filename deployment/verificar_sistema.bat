@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ==========================================
echo Verificacion de SIGDEM
echo ==========================================

set "FILES_OK=1"
if not exist "SIGDEM_Backend.exe" (
    echo FALTA: SIGDEM_Backend.exe
    set "FILES_OK=0"
)
if not exist ".env" (
    echo FALTA: .env
    set "FILES_OK=0"
)
if not exist "frontend\index.html" (
    echo FALTA: frontend\index.html
    set "FILES_OK=0"
)

if "%FILES_OK%"=="0" (
    echo ERROR: La instalacion esta incompleta.
    pause
    exit /b 1
)

echo Archivos principales: OK
echo Consultando http://localhost:8000/health ...

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:8000/health' -TimeoutSec 8; if ($r.status -eq 'healthy') { Write-Host 'API y base de datos: OK'; exit 0 } else { Write-Host ('Estado del sistema: ' + $r.status + ' / Base de datos: ' + $r.database); exit 2 } } catch { Write-Host 'No fue posible conectar con SIGDEM.'; exit 1 }"
set "CHECK_ERROR=%ERRORLEVEL%"

if not "%CHECK_ERROR%"=="0" (
    echo Ejecuta iniciar_sistema.bat y vuelve a verificar.
    pause
    exit /b %CHECK_ERROR%
)

echo Verificacion completada correctamente.
pause
exit /b 0
