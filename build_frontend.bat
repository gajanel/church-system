@echo off
echo ==========================================
echo Compilando Frontend (Vite)
echo ==========================================
cd church-frontend

echo Construyendo aplicacion de React para produccion...
call npm run build

echo Frontend compilado exitosamente en church-frontend\dist
cd ..
