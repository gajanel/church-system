@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "BACKEND_DIR=%~dp0backend"
set "PYTHON_EXE=%BACKEND_DIR%\venv\Scripts\python.exe"

echo ==========================================
echo Compilando backend SIGDEM
echo ==========================================

if not exist "%PYTHON_EXE%" (
    echo ERROR: No existe backend\venv\Scripts\python.exe.
    echo Crea el entorno con Python y ejecuta:
    echo   py -m venv backend\venv
    echo   backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt pyinstaller
    exit /b 1
)

"%PYTHON_EXE%" -c "import sys; print(sys.version)" >nul 2>&1
if errorlevel 1 (
    echo ERROR: El entorno backend\venv esta danado o apunta a un Python que ya no existe.
    echo Elimina y vuelve a crear backend\venv antes de compilar.
    exit /b 1
)

pushd "%BACKEND_DIR%"

echo Verificando dependencias del backend...
"%PYTHON_EXE%" -m pip install --disable-pip-version-check -r requirements.txt
if errorlevel 1 goto :error

"%PYTHON_EXE%" -c "import PyInstaller" >nul 2>&1
if errorlevel 1 (
    echo Instalando PyInstaller...
    "%PYTHON_EXE%" -m pip install pyinstaller
    if errorlevel 1 goto :error
)

echo Generando SIGDEM_Backend.exe...
"%PYTHON_EXE%" -m PyInstaller --clean --noconfirm SIGDEM_Backend.spec
if errorlevel 1 goto :error

if not exist "dist\SIGDEM_Backend.exe" (
    echo ERROR: PyInstaller no genero dist\SIGDEM_Backend.exe.
    goto :error
)

popd
echo.
echo Backend compilado correctamente en backend\dist\SIGDEM_Backend.exe.
exit /b 0

:error
set "BUILD_ERROR=%ERRORLEVEL%"
if "%BUILD_ERROR%"=="0" set "BUILD_ERROR=1"
popd
echo ERROR: No se pudo compilar el backend.
exit /b %BUILD_ERROR%
