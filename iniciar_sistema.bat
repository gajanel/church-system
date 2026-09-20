@echo off
title Iniciando Sistema SIGDEM
echo Iniciando los servicios del sistema, por favor espere...

:: Establecer el directorio de trabajo a la ruta donde se encuentra este archivo .bat
cd /d "%~dp0"

:: 1. Iniciar el Backend (Python)
echo Levantando el Backend...
:: Ejecutar la API desde su directorio.
start "SIGDEM - Backend Python" cmd /k ".\.venv\Scripts\activate && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000"

:: 2. Iniciar el Frontend (Node.js)
echo Levantando el Frontend...
:: El frontend tiene su propio package.json en church-frontend.
start "SIGDEM - Frontend Node" cmd /k "cd church-frontend && npm run dev"

echo Servicios iniciados correctamente en ventanas separadas.
exit