@echo off
setlocal EnableExtensions
title Detener SIGDEM de pruebas

echo Deteniendo SIGDEM...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=8000,5173; $ids=Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue ^| Where-Object { $ports -contains $_.LocalPort } ^| Select-Object -ExpandProperty OwningProcess -Unique; foreach($id in $ids){ Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }"

echo SIGDEM fue detenido.
timeout /T 2 /NOBREAK >nul
exit /b 0
