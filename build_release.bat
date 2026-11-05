@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not exist "%~dp0VERSION" (
    echo ERROR: No se encontro el archivo VERSION.
    exit /b 1
)
set /P "APP_VERSION="<"%~dp0VERSION"
set "RELEASE_DIR=%~dp0Instalador_SIGDEM"
set "RELEASE_ZIP=%~dp0SIGDEM_USB_v%APP_VERSION%.zip"

echo ==========================================
echo Generando paquete SIGDEM %APP_VERSION% para USB
echo ==========================================

call "%~dp0build_frontend.bat"
if errorlevel 1 goto :error

call "%~dp0build_backend.bat"
if errorlevel 1 goto :error

if not exist "deployment\production.env.example" (
    echo ERROR: Falta deployment\production.env.example.
    goto :error
)

if exist "%RELEASE_DIR%" rmdir /S /Q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"
if errorlevel 1 goto :error

echo Copiando frontend...
xcopy "church-frontend\dist" "%RELEASE_DIR%\frontend\" /E /I /Y /Q >nul
if errorlevel 1 goto :error

echo Copiando backend y configuracion...
copy /Y "backend\dist\SIGDEM_Backend.exe" "%RELEASE_DIR%\SIGDEM_Backend.exe" >nul
if errorlevel 1 goto :error
copy /Y "deployment\production.env.example" "%RELEASE_DIR%\.env.example" >nul
if errorlevel 1 goto :error

echo Copiando herramientas de instalacion...
copy /Y "deployment\*.bat" "%RELEASE_DIR%\" >nul
if errorlevel 1 goto :error
copy /Y "deployment\LEEME_USB.txt" "%RELEASE_DIR%\LEEME_USB.txt" >nul
if errorlevel 1 goto :error
copy /Y "VERSION" "%RELEASE_DIR%\VERSION" >nul
copy /Y "CHANGELOG.md" "%RELEASE_DIR%\CHANGELOG.md" >nul

echo Comprimiendo paquete...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%RELEASE_DIR%' -Force ^| Compress-Archive -DestinationPath '%RELEASE_ZIP%' -Force"
if errorlevel 1 goto :error

echo.
echo ==========================================
echo PAQUETE CREADO CORRECTAMENTE
echo ==========================================
echo Carpeta: %RELEASE_DIR%
echo Archivo: %RELEASE_ZIP%
echo Usa preparar_usb.bat para copiarlo a una memoria USB.
exit /b 0

:error
echo.
echo ERROR: No se pudo generar el paquete de produccion.
exit /b 1
