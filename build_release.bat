@echo off
echo ==========================================
echo Iniciando Generacion de Release GEAG
echo ==========================================

REM 1. Compilar Frontend
call build_frontend.bat

REM 2. Compilar Backend
call build_backend.bat

REM 3. Ensamblar Instalador
echo ==========================================
echo Ensamblando carpeta Instalador_SIGDEM
echo ==========================================
if exist Instalador_SIGDEM rmdir /s /q Instalador_SIGDEM
mkdir Instalador_SIGDEM

echo Copiando Frontend...
xcopy /E /I /Y church-frontend\dist Instalador_SIGDEM\frontend > nul

echo Copiando Backend ejecutable...
copy backend\dist\SIGDEM_Backend.exe Instalador_SIGDEM\ > nul

echo Copiando archivo de configuracion .env...
copy backend\.env Instalador_SIGDEM\ > nul

echo Creando script de inicio manual...
echo @echo off > Instalador_SIGDEM\iniciar_sistema.bat
echo echo Iniciando Sistema SIGDEM... >> Instalador_SIGDEM\iniciar_sistema.bat
echo start SIGDEM_Backend.exe >> Instalador_SIGDEM\iniciar_sistema.bat
echo echo El sistema esta corriendo. Entra a http://localhost:8000 en tu navegador. >> Instalador_SIGDEM\iniciar_sistema.bat
echo pause >> Instalador_SIGDEM\iniciar_sistema.bat

echo Creando script de instalacion de arranque automatico...
echo @echo off > Instalador_SIGDEM\instalar_arranque.bat
echo echo ======================================================== >> Instalador_SIGDEM\instalar_arranque.bat
echo echo 1. Abriendo puerto 8000 en el Firewall para red local... >> Instalador_SIGDEM\instalar_arranque.bat
echo netsh advfirewall firewall add rule name="SIGDEM System" dir=in action=allow protocol=TCP localport=8000 >> Instalador_SIGDEM\instalar_arranque.bat
echo echo ======================================================== >> Instalador_SIGDEM\instalar_arranque.bat
echo echo 2. Instalando el sistema en el arranque automatico de Windows... >> Instalador_SIGDEM\instalar_arranque.bat
echo set "TARGET=%%APPDATA%%\Microsoft\Windows\Start Menu\Programs\Startup\SIGDEM_System.vbs" >> Instalador_SIGDEM\instalar_arranque.bat
echo echo Set WshShell = CreateObject("WScript.Shell"^) ^> "%%TARGET%%" >> Instalador_SIGDEM\instalar_arranque.bat
echo echo WshShell.Run chr(34^) ^& "%%~dp0SIGDEM_Backend.exe" ^& chr(34^), 0 ^>^> "%%TARGET%%" >> Instalador_SIGDEM\instalar_arranque.bat
echo echo ======================================================== >> Instalador_SIGDEM\instalar_arranque.bat
echo echo Listo! El sistema se iniciara silenciosamente cada vez que prendas la computadora. >> Instalador_SIGDEM\instalar_arranque.bat
echo echo (Recuerda ejecutar este archivo como Administrador si el firewall dio error) >> Instalador_SIGDEM\instalar_arranque.bat
echo pause >> Instalador_SIGDEM\instalar_arranque.bat

echo ==========================================
echo ¡PROCESO COMPLETADO EXITOSAMENTE!
echo ==========================================
echo Se ha creado la carpeta "Instalador_SIGDEM".
echo Esta carpeta es la que debes copiar a la computadora de la iglesia.
echo Adentro incluye el ejecutable (.exe), la pagina (frontend) y los scripts de arranque.
echo ==========================================
pause
