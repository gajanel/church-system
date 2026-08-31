@echo off
echo ==========================================
echo Compilando Backend (PyInstaller)
echo ==========================================
cd backend
echo Eliminando compilaciones anteriores...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

echo Ejecutando PyInstaller...
REM Nota: PyInstaller a veces requiere hidden imports para FastAPI y Uvicorn
venv\Scripts\pyinstaller.exe --name "SIGDEM_Backend" --onefile --hidden-import uvicorn --hidden-import sqlalchemy --hidden-import psycopg2 main.py

echo Backend compilado exitosamente en backend\dist\SIGDEM_Backend.exe
cd ..
