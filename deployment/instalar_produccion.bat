@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "SOURCE_DIR=%~dp0"
set "INSTALL_DIR=%ProgramData%\SIGDEM"
set "STARTUP_FILE=%ProgramData%\Microsoft\Windows\Start Menu\Programs\StartUp\SIGDEM_System.vbs"
rem Si la instalacion anterior esta en otra ubicacion, escribe aqui su carpeta.
rem Ejemplo: set "LEGACY_DIR_MANUAL=D:\SIGDEM"
set "LEGACY_DIR_MANUAL="
set "LEGACY_DIR="
set "BACKUP_DIR="

echo ==========================================
echo Instalacion de SIGDEM 1.1.0
echo ==========================================

net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ejecuta este archivo como Administrador.
    pause
    exit /b 1
)

if not exist "%SOURCE_DIR%SIGDEM_Backend.exe" (
    echo ERROR: El paquete no contiene SIGDEM_Backend.exe.
    pause
    exit /b 1
)
if not exist "%SOURCE_DIR%.env.example" (
    echo ERROR: El paquete no contiene .env.example.
    pause
    exit /b 1
)
if not exist "%SOURCE_DIR%frontend\index.html" (
    echo ERROR: El paquete no contiene el frontend.
    pause
    exit /b 1
)

tasklist /FI "IMAGENAME eq SIGDEM_Backend.exe" 2>nul | find /I "SIGDEM_Backend.exe" >nul
if not errorlevel 1 (
    echo ERROR: SIGDEM esta en ejecucion.
    echo Ejecuta detener_sistema.bat antes de actualizar la instalacion.
    pause
    exit /b 1
)

rem Detecta la instalacion anterior. Una instalacion ya migrada tiene prioridad.
if exist "%INSTALL_DIR%\.env" (
    set "LEGACY_DIR=%INSTALL_DIR%"
) else if defined LEGACY_DIR_MANUAL if exist "%LEGACY_DIR_MANUAL%\.env" (
    set "LEGACY_DIR=%LEGACY_DIR_MANUAL%"
) else if exist "C:\.env" (
    set "LEGACY_DIR=C:\"
) else if exist "C:\SIGDEM\.env" (
    set "LEGACY_DIR=C:\SIGDEM"
) else if exist "C:\church-system\.env" (
    set "LEGACY_DIR=C:\church-system"
)

if defined LEGACY_DIR_MANUAL if not defined LEGACY_DIR (
    echo ERROR: No se encontro .env en la ubicacion indicada:
    echo   %LEGACY_DIR_MANUAL%
    echo Corrige LEGACY_DIR_MANUAL y vuelve a ejecutar el instalador.
    pause
    exit /b 1
)

if defined LEGACY_DIR (
    for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "BACKUP_DIR=%ProgramData%\SIGDEM_Backups\antes_v1.1.0_%%I"
    echo Instalacion anterior detectada en !LEGACY_DIR!
    echo Creando respaldo de configuracion y archivos en !BACKUP_DIR! ...
    mkdir "!BACKUP_DIR!" >nul 2>&1
    copy /Y "!LEGACY_DIR!\.env" "!BACKUP_DIR!\.env" >nul
    if errorlevel 1 goto :error
    if exist "!LEGACY_DIR!\static" (
        robocopy "!LEGACY_DIR!\static" "!BACKUP_DIR!\static" /E /R:2 /W:1 >nul
        if errorlevel 8 goto :error
    )
)

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if errorlevel 1 goto :error

rem Migra la configuracion y los archivos de la instalacion ubicada en C:\.
if not exist "%INSTALL_DIR%\.env" if defined LEGACY_DIR (
    copy /Y "%LEGACY_DIR%\.env" "%INSTALL_DIR%\.env" >nul
    if errorlevel 1 goto :error
    echo Configuracion PostgreSQL anterior conservada.
)
if defined LEGACY_DIR if /I not "%LEGACY_DIR%"=="%INSTALL_DIR%" if exist "%LEGACY_DIR%\static" (
    if not exist "%INSTALL_DIR%\static" mkdir "%INSTALL_DIR%\static"
    robocopy "%LEGACY_DIR%\static" "%INSTALL_DIR%\static" /E /R:2 /W:1 >nul
    if errorlevel 8 goto :error
    echo Fotografias y documentos anteriores conservados.
)

echo Copiando archivos a %INSTALL_DIR% ...
robocopy "%SOURCE_DIR%frontend" "%INSTALL_DIR%\frontend" /MIR /R:2 /W:1 >nul
if errorlevel 8 goto :error

copy /Y "%SOURCE_DIR%SIGDEM_Backend.exe" "%INSTALL_DIR%\SIGDEM_Backend.exe" >nul
if errorlevel 1 goto :error
if not exist "%INSTALL_DIR%\.env" (
    echo Creando una configuracion inicial segura...
    copy /Y "%SOURCE_DIR%.env.example" "%INSTALL_DIR%\.env" >nul
    if errorlevel 1 goto :error
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='%INSTALL_DIR%\.env'; $secret=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower(); $c=[IO.File]::ReadAllLines($p); $c=@($c ^| ForEach-Object { if ($_ -match '^SECRET_KEY=') { 'SECRET_KEY=' + $secret } elseif ($_ -match '^ENV=') { 'ENV=production' } else { $_ } }); [IO.File]::WriteAllLines($p, $c, (New-Object Text.UTF8Encoding($false)))"
    if errorlevel 1 goto :error
) else (
    echo Conservando la configuracion .env existente de produccion.
)

findstr /C:"CAMBIA_" "%INSTALL_DIR%\.env" >nul
if not errorlevel 1 (
    echo.
    echo CONFIGURACION REQUERIDA:
    echo Edita DATABASE_URL en %INSTALL_DIR%\.env con los datos de PostgreSQL.
    echo Guarda el archivo y vuelve a ejecutar instalar_produccion.bat.
    start "" notepad "%INSTALL_DIR%\.env"
    pause
    exit /b 2
)
copy /Y "%SOURCE_DIR%*.bat" "%INSTALL_DIR%\" >nul
copy /Y "%SOURCE_DIR%.env.example" "%INSTALL_DIR%\.env.example" >nul
copy /Y "%SOURCE_DIR%VERSION" "%INSTALL_DIR%\VERSION" >nul 2>&1
copy /Y "%SOURCE_DIR%CHANGELOG.md" "%INSTALL_DIR%\CHANGELOG.md" >nul 2>&1

echo Configurando el firewall...
netsh advfirewall firewall delete rule name="SIGDEM System" >nul 2>&1
netsh advfirewall firewall add rule name="SIGDEM System" dir=in action=allow protocol=TCP localport=8000 profile=private >nul
if errorlevel 1 goto :error

echo Configurando el inicio automatico...
> "%STARTUP_FILE%" echo Set WshShell = CreateObject("WScript.Shell"^)
>> "%STARTUP_FILE%" echo WshShell.CurrentDirectory = "%INSTALL_DIR%"
>> "%STARTUP_FILE%" echo WshShell.Run Chr(34^) ^& "%INSTALL_DIR%\SIGDEM_Backend.exe" ^& Chr(34^), 0, False
if errorlevel 1 goto :error

echo Iniciando SIGDEM...
start "SIGDEM Backend" /D "%INSTALL_DIR%" "%INSTALL_DIR%\SIGDEM_Backend.exe"
timeout /T 5 /NOBREAK >nul
start "" "http://localhost:8000"

echo.
echo SIGDEM fue instalado correctamente en:
echo   %INSTALL_DIR%
if defined BACKUP_DIR echo Respaldo de la instalacion anterior: %BACKUP_DIR%
echo El sistema se iniciara al ingresar a Windows.
pause
exit /b 0

:error
echo.
echo ERROR: La instalacion no pudo completarse.
pause
exit /b 1
