@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ==========================================
echo Preparar memoria USB con SIGDEM
echo ==========================================

call "%~dp0build_release.bat"
if errorlevel 1 (
    echo No se copiara nada porque la compilacion fallo.
    pause
    exit /b 1
)

echo.
echo Escribe la letra de la memoria USB, por ejemplo E:
set /P "USB_DRIVE=Unidad USB: "

if "%USB_DRIVE%"=="" (
    echo ERROR: No se indico una unidad.
    exit /b 1
)

if /I "%USB_DRIVE%"=="C:" (
    echo ERROR: La unidad C: no puede utilizarse como destino USB.
    exit /b 1
)

if not exist "%USB_DRIVE%\" (
    echo ERROR: La unidad %USB_DRIVE% no existe o no esta conectada.
    exit /b 1
)

set /P "APP_VERSION="<"%~dp0VERSION"
set "USB_DIR=%USB_DRIVE%\SIGDEM_%APP_VERSION%"
if exist "%USB_DIR%" rmdir /S /Q "%USB_DIR%"
mkdir "%USB_DIR%"
if errorlevel 1 exit /b 1

robocopy "%~dp0Instalador_SIGDEM" "%USB_DIR%" /MIR /R:2 /W:1 >nul
if errorlevel 8 (
    echo ERROR: No se pudo copiar el paquete a la USB.
    exit /b 1
)

copy /Y "%~dp0SIGDEM_USB_v%APP_VERSION%.zip" "%USB_DRIVE%\SIGDEM_USB_v%APP_VERSION%.zip" >nul
if errorlevel 1 exit /b 1

echo.
echo SIGDEM %APP_VERSION% fue copiado correctamente a:
echo   %USB_DIR%
echo   %USB_DRIVE%\SIGDEM_USB_v%APP_VERSION%.zip
echo.
echo Expulsa la memoria USB de forma segura antes de retirarla.
pause
exit /b 0
