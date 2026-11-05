@echo off
setlocal EnableExtensions

set "STARTUP_FILE=%ProgramData%\Microsoft\Windows\Start Menu\Programs\StartUp\SIGDEM_System.vbs"

net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ejecuta este archivo como Administrador.
    pause
    exit /b 1
)

if exist "%STARTUP_FILE%" del /F /Q "%STARTUP_FILE%"
netsh advfirewall firewall delete rule name="SIGDEM System" >nul 2>&1

echo Se elimino el inicio automatico y la regla de firewall de SIGDEM.
echo Los datos y archivos instalados no fueron eliminados.
pause
exit /b 0
