@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ==========================================
echo Compilando frontend SIGDEM
echo ==========================================

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js y npm no estan disponibles en PATH.
    echo Instala Node.js antes de compilar el frontend.
    exit /b 1
)

if not exist "church-frontend\package.json" (
    echo ERROR: No se encontro church-frontend\package.json.
    exit /b 1
)

pushd "church-frontend"

if not exist "node_modules" (
    echo Instalando dependencias del frontend...
    call npm ci
    if errorlevel 1 goto :error
)

echo Generando archivos de produccion...
call npm run build
if errorlevel 1 goto :error

if not exist "dist\index.html" (
    echo ERROR: La compilacion termino sin generar dist\index.html.
    goto :error
)

popd
echo.
echo Frontend compilado correctamente en church-frontend\dist.
exit /b 0

:error
set "BUILD_ERROR=%ERRORLEVEL%"
if "%BUILD_ERROR%"=="0" set "BUILD_ERROR=1"
popd
echo ERROR: No se pudo compilar el frontend.
exit /b %BUILD_ERROR%
